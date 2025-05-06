import { Injectable } from '@nestjs/common';
import { WebhookService } from './webhook/webhook.service';
import { Transfer, TransferStatus } from '@prisma/client';
import {
  ConfirmedSignatureInfo,
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  findReference,
  FindReferenceError,
  validateTransfer,
  ValidateTransferError,
} from '@solana/pay';
import { USDC_ADDRESS, USDC_DECIMALS } from '../constants';
import { PrismaService } from 'nestjs-prisma';
import { getConnection } from '../utils/connection';
import * as BigNumber from 'bignumber.js';
import {
  decodeInstruction,
  isTransferCheckedInstruction,
  isTransferInstruction,
} from '@solana/spl-token';

@Injectable()
export class IndexerService {
  private readonly connection: Connection;
  constructor(
    private readonly webhookService: WebhookService,
    private readonly prisma: PrismaService,
  ) {
    this.connection = getConnection();
  }

  async pollPayment(transfer: Transfer) {
    const reference = new PublicKey(transfer.reference);
    const recipient = new PublicKey(transfer.receiverWalletAddress);
    const amount = new BigNumber(transfer.amount / Math.pow(10, USDC_DECIMALS));
    const splToken = new PublicKey(USDC_ADDRESS);
    let senderWalletAddress: string;

    const TEN_MINUTES = 10 * 60 * 1000;
    const POLL_INTERVAL = 1000;

    const start = Date.now();
    let interval: NodeJS.Timeout;

    try {
      const { signature } = await new Promise<ConfirmedSignatureInfo>(
        (resolve, reject) => {
          interval = setInterval(() => {
            (async () => {
              console.count(
                `Checking for transaction, reference: ${transfer.reference} ...`,
              );

              if (Date.now() - start > TEN_MINUTES) {
                clearInterval(interval);
                try {
                  await this.sendTransferResponseEvent(
                    transfer.id,
                    transfer.reference,
                    TransferStatus.Rejected,
                  );
                } catch (err) {
                  console.error('Failed to send timeout event', err);
                }
                return reject(new Error('Polling timed out after 10 minutes.'));
              }

              try {
                const info = await findReference(this.connection, reference, {
                  finality: 'confirmed',
                });
                clearInterval(interval);
                return resolve(info);
              } catch (error: any) {
                if (!(error instanceof FindReferenceError)) {
                  console.error('Unexpected error during findReference', error);
                  clearInterval(interval);
                  try {
                    await this.sendTransferResponseEvent(
                      transfer.id,
                      transfer.reference,
                      TransferStatus.Rejected,
                    );
                  } catch (err) {
                    console.error('Failed to send error event', err);
                  }
                  return reject(
                    error instanceof Error ? error : new Error(String(error)),
                  );
                }
              }
            })();
          }, POLL_INTERVAL);
        },
      );

      // After finding the transaction, validate it
      const transactionResponse = await validateTransfer(
        this.connection,
        signature,
        { recipient, amount, splToken, reference },
        { commitment: 'confirmed' },
      );
      const transaction = Transaction.populate(
        transactionResponse.transaction.message,
        transactionResponse.transaction.signatures,
      );

      senderWalletAddress =
        this.getSenderWalletAddressFromTransactionResponse(transaction);

      await this.sendTransferResponseEvent(
        transfer.id,
        transfer.reference,
        TransferStatus.Success,
        senderWalletAddress,
        transaction.signature.toString('base64'),
      );
    } catch (error) {
      console.error('Polling or validation failed', error);

      if (error instanceof ValidateTransferError) {
        await this.sendTransferResponseEvent(
          transfer.id,
          reference.toString(),
          TransferStatus.Rejected,
          senderWalletAddress,
        );
      }
    } finally {
      if (interval) {
        clearInterval(interval);
      }
    }
  }

  private getSenderWalletAddressFromTransactionResponse(
    transaction: Transaction,
  ) {
    const instruction = transaction.instructions.at(-1);
    if (!instruction) return;

    const decodedInstruction = decodeInstruction(instruction);
    if (
      !isTransferCheckedInstruction(decodedInstruction) &&
      !isTransferInstruction(decodedInstruction)
    )
      return;

    const senderWalletAddress = decodedInstruction.keys.owner.pubkey.toString();
    return senderWalletAddress;
  }

  private async sendTransferResponseEvent(
    transferId: number,
    reference: string,
    status: TransferStatus,
    senderWalletAddress?: string,
    signature?: string,
  ) {
    await this.prisma.transfer.update({
      where: { id: transferId },
      data: {
        status,
        signature,
        ...(senderWalletAddress && {
          senderWallet: {
            connectOrCreate: {
              where: { address: senderWalletAddress },
              create: {
                address: senderWalletAddress,
                lastInteractedAt: new Date(),
              },
            },
          },
        }),
      },
    });

    // TODO: Send websocket event to receiver.
  }
}
