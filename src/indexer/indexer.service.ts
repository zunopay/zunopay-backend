import { Injectable } from '@nestjs/common';
import { WebhookService } from './webhook/webhook.service';
import { Transfer, TransferStatus } from '@prisma/client';
import { ConfirmedSignatureInfo, Connection, PublicKey } from '@solana/web3.js';
import {
  findReference,
  FindReferenceError,
  validateTransfer,
  ValidateTransferError,
} from '@solana/pay';
import { USDC_ADDRESS } from '../constants';
import { PrismaService } from 'nestjs-prisma';
import { getConnection } from '../utils/connection';
import * as BigNumber from 'bignumber.js';

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
    const amount = new BigNumber(transfer.amount);
    const splToken = new PublicKey(USDC_ADDRESS);

    const TEN_MINUTES = 60 * 1000;
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
      await validateTransfer(
        this.connection,
        signature,
        { recipient, amount, splToken, reference },
        { commitment: 'confirmed' },
      );

      await this.sendTransferResponseEvent(
        transfer.id,
        transfer.reference,
        TransferStatus.Success,
      );
    } catch (error) {
      console.error('Polling or validation failed', error);

      if (error instanceof ValidateTransferError) {
        await this.prisma.transfer.update({
          where: { id: transfer.id },
          data: { status: TransferStatus.Rejected },
        });
      }
    } finally {
      if (interval) {
        clearInterval(interval);
      }
    }
  }

  private async sendTransferResponseEvent(
    transferId: number,
    reference: string,
    status: TransferStatus,
  ) {
    await this.prisma.transfer.update({
      where: { id: transferId },
      data: { status },
    });

    // TODO: Send websocket event to receiver.
  }
}
