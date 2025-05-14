import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { getUSDCUiAmount } from '../utils/payments';
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
import { TokenType, TransferStatus } from '@prisma/client';
import { IndexerService } from '../indexer/indexer.service';
import { TransferHistoryInput, TransferType } from './dto/transfer-history';

/*
TODO:
  1. Add referral fee incentives
  2. user incentives for shopping from listed stores only on the merchant profile
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

  async getMerchantPaymentDetails(username: string) {
    const receiver = await this.prisma.user.findUnique({
      where: { username },
      include: { merchant: true },
    });

    if (!receiver) {
      throw new NotFoundException(
        `User with username ${username} doesn't exist`,
      );
    }

    //TODO: Do we have user select the restraunt they are using to verify the Merchant QR ?
    if (!receiver.merchant) {
      throw new NotFoundException(
        `User with username ${username} is not a merchant`,
      );
    }

    const merchant = receiver.merchant;
    if (!merchant.isVerified) {
      throw new BadRequestException(
        `Merchant ${merchant.displayName} is not verified`,
      );
    }

    return merchant;
  }

  async createTransferRequest(query: TransferParams, userId: number) {
    try {
      const { username, amount } = query;

      const sender = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { wallet: { select: { address: true } } },
      });

      const receiver = await this.prisma.user.findUnique({
        where: { username },
        select: { wallet: { select: { address: true } } },
      });

      // Construct transaction
      const referenceKey = Keypair.generate().publicKey;
      const senderWalletAddress = sender.wallet.address;
      const transaction = await this.constructDigitalTransferTransaction(
        senderWalletAddress,
        receiver.wallet.address,
        amount,
        referenceKey,
      );

      const reference = referenceKey.toString();
      const transfer = await this.prisma.transfer.create({
        data: {
          senderWallet: { connect: { address: senderWalletAddress } },
          receiverWallet: {
            connectOrCreate: {
              where: { address: receiver.wallet.address },
              create: {
                address: receiver.wallet.address,
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

    const transferFeeInstruction = createTransferInstruction(
      source,
      transferFeeWalletTokenAddress,
      sourceOwner,
      transferFee,
    );

    const transferToDestinationInstruction = createTransferInstruction(
      source,
      destination,
      sourceOwner,
      amount,
    );

    /* Add reference key for polling the transaction confirmation */
    transferToDestinationInstruction.keys.push({
      pubkey: reference,
      isSigner: false,
      isWritable: false,
    });

    const computeBudgetInstruction = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: MIN_COMPUTE_PRICE,
    });
    const latestBlockhash = await this.connection.getLatestBlockhash();

    let transaction = new Transaction({ ...latestBlockhash, feePayer }).add(
      computeBudgetInstruction,
    );

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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user.region == 'EU') {
      const offrampTransaction = await this.sphereService.offramp(
        userId,
        amount,
      );
      return offrampTransaction;
    } else {
      throw new BadRequestException('Region not supported');
    }
  }
}
