import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ReceiverBankingDetail, ReceiverQrDetails } from './dto/types';
import { isNull } from 'lodash';
import {
  getCurrencyValue,
  getUSDCUiAmount,
  isSolanaAddress,
  VpaType,
} from '../utils/payments';
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
import { generateCommitment } from '../utils/hash';
import {
  FEE_DESTINATION,
  FEE_USDC,
  MIN_COMPUTE_PRICE,
  TOKEN_ACCOUNT_FEE_USDC,
  UPI_VPA_PREFIX,
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
import { Currency } from '../types/payment';
import { TokenType, TransferStatus } from '@prisma/client';
import { ReceivePaymentParamsDto } from './dto/receive-payment-params.dto';
import { encodeURL } from '@solana/pay';
import BigNumber from 'bignumber.js';
import { IndexerService } from '../indexer/indexer.service';
import { TransferHistoryInput, TransferType } from './dto/transfer-history';

/*
TODO:
  1. Make transfer indexing error proof.
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

  async getReceiver(encodedQr: string): Promise<ReceiverBankingDetail> {
    if(isSolanaAddress(encodedQr)){
      const walletAddress = encodedQr;
      return {
        vpa: '',
        walletAddress,
        name: '',
        currency: Currency.USD
      }
    }


    const receiver = this.decodeQr(encodedQr);

    const commitment = generateCommitment(receiver.vpa);

    const registry = await this.prisma.keyWalletRegistry.findFirst({
      where: { commitment, verification: { isNot: null } },
      include: { user: { select: { wallet: { select: { address: true } } } } },
    });

    if (!registry) {
      throw new NotFoundException(
        'Receiver have not registered the vpa, onboard them and earn points',
      );
    }

    return {
      ...receiver,
      vpa: receiver.vpa,
      walletAddress: registry.user.wallet.address,
    };
  }

  async createTransferRequest(query: TransferParams, userId: number) {
    try {
      const { vpa, amount } = query;

      const sender = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { wallet: { select: { address: true } } },
      });

      const receiverWalletAddress = await this.resolveWalletAddress(vpa);

      // Construct transaction
      const reference = Keypair.generate().publicKey;
      const senderWalletAddress = sender.wallet.address;
      const transaction = await this.constructDigitalTransferTransaction(
        senderWalletAddress,
        receiverWalletAddress,
        amount,
        reference,
      );

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
          reference: reference.toString(),
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

  async createReceiveRequest(userId: number, query: ReceivePaymentParamsDto) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: { select: { address: true } } },
    });

    // Construct transaction
    const reference = Keypair.generate().publicKey;
    const receiverWalletAddress = new PublicKey(receiver.wallet.address);
    const splToken = new PublicKey(USDC_ADDRESS);
    const amount = new BigNumber(query.amount);

    const transfer = await this.prisma.transfer.create({
      data: {
        receiverWallet: { connect: { address: receiver.wallet.address } },
        amount: query.amount,
        status: TransferStatus.Pending,
        tokenType: TokenType.USDC,
        reference: reference.toString(),
      },
    });

    const paymentUrl = encodeURL({
      recipient: receiverWalletAddress,
      amount,
      splToken,
      reference,
      message: query.message,
    });

    this.indexerService.pollPayment(transfer);
    return paymentUrl;
  }

  async getWalletBalance(walletAddress: string) {
    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(USDC_ADDRESS);
    try {
      const { balance: rawBalance } =
        await this.getTokenAccountOrCreateInstruction(owner, mint);

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

  private async resolveWalletAddress(vpa: string) {
    if (isSolanaAddress(vpa)) {
      return vpa;
    }

    const commitment = generateCommitment(vpa);
    const receiverRegistry = await this.prisma.keyWalletRegistry.findFirst({
      where: { commitment, verification: { isNot: null } },
      select: { user: { select: { wallet: { select: { address: true } } } } },
    });

    if (!receiverRegistry || !receiverRegistry.user.wallet?.address) {
      throw new BadRequestException(
        "Receiver either haven't got verified or registered. Get them register to earn rewards",
      );
    }

    return receiverRegistry.user.wallet.address;
  }

  private decodeQr(encodedQr: string) {
    const qr = decodeURIComponent(encodedQr);

    if (this.isUPIQr(qr)) {
      return this.parseUpiQr(qr);
    } else if (this.isSEPAQr(qr)) {
      return this.parseSEPAQr(qr);
    }

    throw new NotFoundException('Unsupported QR code');
  }

  /*
        Example:
        Uses EPC069-12 standard: 

        BCD
        001
        1
        SCT
        SWIFT/BIC
        <Receiver Name> 
        HR09*******01
        EUR1

    */

  private isSEPAQr(qr: string): boolean {
    const sepaPattern = /^BCD\s*001\s*1\s*SCT/i;
    return sepaPattern.test(qr);
  }

  private isUPIQr(qr: string): boolean {
    return qr.startsWith(UPI_VPA_PREFIX);
  }

  private parseSEPAQr(qr: string): ReceiverQrDetails {
    const sepaDetails = qr
      .trimEnd()
      .split('\n')
      .map((detail) => detail.trim());

    const iban = sepaDetails.at(6).trim();
    const name = sepaDetails.at(5).trim();
    const currency = sepaDetails.at(-1);

    if (isNull(iban) || isNull(name) || isNull(currency)) {
      throw new BadRequestException('Invalid Qr');
    }

    const cleanCurrency = getCurrencyValue(currency);
    return {
      vpa: iban,
      name: name,
      currency: cleanCurrency,
    };
  }

  /*
      Eg: upi://pay?pa=merchant@upi&pn=MerchantName&mc=1234&tid=123456&tr=123456789&tn=Payment&am=100.00&cu=INR
  */
  private parseUpiQr(qr: string): ReceiverQrDetails {
    const qrUrl = new URL(qr);
    const upiId = qrUrl.searchParams.get('pa');
    const name = qrUrl.searchParams.get('pn');

    if (isNull(upiId) || isNull(name)) {
      throw new BadRequestException('Invalid Qr');
    }

    return {
      vpa: upiId,
      name,
      currency: Currency.INR,
    };
  }
}

/* 
PIX QR Data
- use pix-utils to parse encoded qr 
// {
//   type: 'STATIC',
//   merchantCategoryCode: '0000',
//   transactionCurrency: '986',
//   countryCode: 'BR',
//   merchantName: 'Thales Ogliari',
//   merchantCity: 'SAO MIGUEL DO O',
//   pixKey: 'nubank@thalesog.com',
//   transactionAmount: 1,
//   infoAdicional: 'Gerado por Pix-Utils',
//   txid: '***',
//   toBRCode: [Function: toBRCode],
//   toImage: [Function: toImage]
// }
*/
