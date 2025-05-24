import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { getUSDCUiAmount, isSolanaAddress } from '../utils/payments';
import { TransferParams } from './dto/transfer-params.dto';
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  getConnection,
  getIdentitySignature,
  getTreasuryPublicKey,
} from '../utils/connection';
import { PrismaService } from 'nestjs-prisma';
import { SphereService } from '../third-party/sphere/sphere.service';
import {
  FEE_DESTINATION,
  FEE_USDC,
  MIN_COMPUTE_PRICE,
  PLATFORM_FEE_BASIS_POINTS,
  REFERRAL_FEE_BASIS_POINTS,
  TOKEN_ACCOUNT_FEE_USDC,
  USDC_ADDRESS,
} from '../constants';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
} from '@solana/spl-token';
import { Role, TokenType, TransferStatus } from '@prisma/client';
import { IndexerService } from '../indexer/indexer.service';
import { TransferHistoryInput, TransferType } from './dto/transfer-history';
import { ReceiverInput } from './dto/receiver.dto';
import { WithdrawParams } from './dto/withdraw-params.dto';

/*
TODO:
  1. Google signup creates wallet and gives a random username
  2. profile page with way to change username
  3. Add referral fee incentives
  4. user incentives for shopping from listed stores only on the merchant profile
*/

@Injectable()
export class PaymentService {
  private readonly connection: Connection;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sphereService: SphereService,
    private readonly indexerService: IndexerService,
  ) {
    this.connection = getConnection();
  }

  async getReceiver(id: string): Promise<ReceiverInput> {
    if (isSolanaAddress(id)) {
      const wallet = await this.prisma.wallet.findUnique({
        where: { address: id },
        include: { user: true },
      });

      return wallet?.user
        ? { id: wallet.user.username, avatar: wallet.user.avatar }
        : { id };
    }

    const user = await this.prisma.user.findUnique({
      where: { username: id },
      select: { username: true, avatar: true },
    });

    if (!user) {
      throw new NotFoundException(`User with username ${id} doesn't exist`);
    }

    return { id: user.username, avatar: user.avatar };
  }

  async createWithdrawTransaction(query: WithdrawParams, userId: number) {
    try {
      const { destinationAddress, amount } = query;

      const sender = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { wallet: { select: { address: true } } },
      });

      // Construct transaction
      const referenceKey = Keypair.generate().publicKey;
      const senderWalletAddress = sender.wallet.address;
      const transaction = await this.constructDigitalTransferTransaction(
        senderWalletAddress,
        destinationAddress,
        amount,
        referenceKey,
      );

      const reference = referenceKey.toString();
      const transfer = await this.prisma.transfer.create({
        data: {
          senderWallet: { connect: { address: senderWalletAddress } },
          receiverWallet: {
            connectOrCreate: {
              where: { address: destinationAddress },
              create: {
                address: destinationAddress,
                lastInteractedAt: new Date(),
              },
            },
          },
          amount,
          reference,
          tokenType: TokenType.USDC,
          status: TransferStatus.Pending,
        },
      });
      this.indexerService.pollPayment(transfer);

      return transaction;
    } catch (e) {
      throw new InternalServerErrorException('Failed to initiate withdraw');
    }
  }

  async createTransferRequest(query: TransferParams, userId: number) {
    try {
      const { id, amount } = query;

      const sender = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { wallet: { select: { address: true } } },
      });

      const senderWalletAddress = sender.wallet.address;

      let receiverWalletAddress = id;
      let isMerchant = false;
      let referredById: number | undefined;

      if (isSolanaAddress(id)) {
        const wallet = await this.prisma.wallet.findUnique({
          where: { address: id },
          include: { user: { include: { referredBy: true } } },
        });

        if (wallet?.user) {
          isMerchant = wallet.user.role === Role.Merchant;
          referredById = wallet.user.referredBy?.referrerId;
          receiverWalletAddress = wallet.address;
        }
      } else {
        const user = await this.prisma.user.findUnique({
          where: { username: id },
          select: {
            wallet: { select: { address: true } },
            role: true,
            referredBy: true,
          },
        });

        if (!user) throw new NotFoundException('Receiver not found');

        isMerchant = user.role === Role.Merchant;
        referredById = user.referredBy?.referrerId;
        receiverWalletAddress = user.wallet.address;
      }

      let referrerWalletAddress: string | undefined;
      let royaltyFee = 0;

      if (isMerchant && referredById) {
        const referrer = await this.prisma.user.findUnique({
          where: { id: referredById },
          select: { wallet: { select: { address: true } } },
        });
        referrerWalletAddress = referrer?.wallet.address;
        royaltyFee = (REFERRAL_FEE_BASIS_POINTS * amount) / 10000;
      }

      const referenceKey = Keypair.generate().publicKey;
      const transaction = await this.constructDigitalTransferTransaction(
        senderWalletAddress,
        receiverWalletAddress,
        amount,
        referenceKey,
        referrerWalletAddress,
      );

      const reference = referenceKey.toString();

      const transfer = await this.prisma.transfer.create({
        data: {
          senderWallet: { connect: { address: senderWalletAddress } },
          receiverWallet: {
            connectOrCreate: {
              where: { address: receiverWalletAddress },
              create: {
                address: receiverWalletAddress,
                lastInteractedAt: new Date(),
              },
            },
          },
          amount,
          reference,
          tokenType: TokenType.USDC,
          status: TransferStatus.Pending,
          royaltyFee,
        },
      });

      this.indexerService.pollPayment(transfer);
      return transaction;
    } catch (e) {
      throw new InternalServerErrorException(
        'Failed to initiate transfer request',
      );
    }
  }

  async getWalletBalance(walletAddress: string) {
    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(USDC_ADDRESS);
    try {
      const { balance: rawBalance, instruction } =
        await this.getTokenAccountOrCreateInstruction(owner, mint);

      if (instruction) {
        try {
          const payer = getTreasuryPublicKey();
          const latestBlockhash = await this.connection.getLatestBlockhash({
            commitment: 'confirmed',
          });
          const transaction = new Transaction({
            ...latestBlockhash,
            feePayer: payer,
          })
            .add(
              ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: MIN_COMPUTE_PRICE,
              }),
            )
            .add(instruction);
          const signedTransaction = getIdentitySignature(transaction);
          const rawTransaction = signedTransaction.serialize();

          await this.connection.sendRawTransaction(rawTransaction);
        } catch (e) {
          console.log(
            `Failed to create token account for wallet ${walletAddress}`,
          );
        }
      }

      const balance = getUSDCUiAmount(rawBalance);
      return balance;
    } catch (e) {
      throw new InternalServerErrorException('Failed to get wallet balance');
    }
  }

  async getTransferHistory(userId: number): Promise<TransferHistoryInput[]> {
    const userWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    const transfers = await this.prisma.transfer.findMany({
      where: {
        OR: [{ senderWallet: { userId } }, { receiverWallet: { userId } }],
      },
    });

    const transferHistory: TransferHistoryInput[] = transfers.map(
      (transfer) => ({
        ...transfer,
        type:
          transfer.senderWalletAddress == userWallet.address
            ? TransferType.Sent
            : TransferType.Received,
      }),
    );

    return transferHistory;
  }

  private async getTokenAccountOrCreateInstruction(
    owner: PublicKey,
    mint: PublicKey,
  ): Promise<{
    address: PublicKey;
    instruction?: TransactionInstruction;
    balance?: number;
  }> {
    const tokenAddress = await getAssociatedTokenAddress(mint, owner);

    try {
      const tokenAccount = await getAccount(this.connection, tokenAddress);
      return {
        address: tokenAccount.address,
        balance: Number(tokenAccount.amount),
      };
    } catch (error: unknown) {
      if (
        error instanceof TokenAccountNotFoundError ||
        error instanceof TokenInvalidAccountOwnerError
      ) {
        try {
          const payer = getTreasuryPublicKey();
          const instruction = createAssociatedTokenAccountInstruction(
            payer,
            tokenAddress,
            owner,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          );

          return { address: tokenAddress, instruction };
        } catch (error: unknown) {}
      } else {
        throw error;
      }
    }
  }

  async constructDigitalTransferTransaction(
    sender: string,
    receiver: string,
    amount: number,
    reference: PublicKey,
    referrerWalletAddress?: string,
  ) {
    const mint = new PublicKey(USDC_ADDRESS);
    const sourceOwner = new PublicKey(sender);
    const destinationOwner = new PublicKey(receiver);
    const feePayer = getTreasuryPublicKey();

    let transferFee = FEE_USDC;
    const { address: source, instruction: createSourceTokenAccount } =
      await this.getTokenAccountOrCreateInstruction(sourceOwner, mint);
    transferFee += createSourceTokenAccount ? TOKEN_ACCOUNT_FEE_USDC : 0;

    const { address: destination, instruction: createDestinationTokenAccount } =
      await this.getTokenAccountOrCreateInstruction(destinationOwner, mint);
    transferFee += createDestinationTokenAccount ? TOKEN_ACCOUNT_FEE_USDC : 0;

    const transferFeeWallet = new PublicKey(FEE_DESTINATION);
    const transferFeeWalletTokenAddress = await getAssociatedTokenAddress(
      mint,
      transferFeeWallet,
    );

    const isMerchant = !!referrerWalletAddress;

    const computeBudgetInstruction = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: MIN_COMPUTE_PRICE,
    });
    const latestBlockhash = await this.connection.getLatestBlockhash();

    let transaction = new Transaction({ ...latestBlockhash, feePayer }).add(
      computeBudgetInstruction,
    );

    // Create and add transfer instructions
    const transferFeeInstruction = createTransferInstruction(
      source,
      transferFeeWalletTokenAddress,
      sourceOwner,
      transferFee,
    );

    let platformFee = 0,
      referralFee = 0;

    if (isMerchant) {
      const referrer = new PublicKey(referrerWalletAddress);
      const { instruction: createReferrerTokenAccountInstruction } =
        await this.getTokenAccountOrCreateInstruction(referrer, mint);

      platformFee = (PLATFORM_FEE_BASIS_POINTS * amount) / 10000;
      const createTransferToPlatform = createTransferInstruction(
        source,
        transferFeeWalletTokenAddress,
        sourceOwner,
        platformFee,
      );

      transaction = transaction.add(createTransferToPlatform);

      if (!createReferrerTokenAccountInstruction) {
        referralFee = (REFERRAL_FEE_BASIS_POINTS * amount) / 10000;
        const createTransferToReferrer = createTransferInstruction(
          source,
          referrer,
          sourceOwner,
          referralFee,
        );
        transaction = transaction.add(createTransferToReferrer);
      }
    }

    const amountAfterFees = amount - (platformFee + referralFee);
    const transferToDestinationInstruction = createTransferInstruction(
      source,
      destination,
      sourceOwner,
      amountAfterFees,
    );

    /* Add reference key for polling the transaction confirmation */
    transferToDestinationInstruction.keys.push({
      pubkey: reference,
      isSigner: false,
      isWritable: false,
    });

    if (createSourceTokenAccount) {
      transaction = transaction.add(createSourceTokenAccount);
    }

    if (createDestinationTokenAccount) {
      transaction = transaction.add(createDestinationTokenAccount);
    }

    transaction = transaction
      .add(transferFeeInstruction)
      .add(transferToDestinationInstruction);

    const signedTransaction = getIdentitySignature(transaction);
    const serializedTransaction = signedTransaction
      .serialize({
        requireAllSignatures: false,
      })
      .toString('base64');

    return serializedTransaction;
  }

  /*
    OnReceiving funds give a notification/email to receiver and offramnp the funds.
  */

  async offramp(userId: number, amount: number) {
    /*
      - Figure out the offramp provider required
      - Offramp usdc to reciever's bank using that

      For automatic offramps, User smart accounts to transfer to offramp provider's intermediary wallet.
    */
    const offrampTransaction = await this.sphereService.offramp(userId, amount);
    return offrampTransaction;
  }
}
