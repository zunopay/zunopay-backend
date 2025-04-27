import { Injectable } from '@nestjs/common';
import { WebhookService } from './webhook/webhook.service';
import { PrismaClient, Transfer, TransferStatus } from '@prisma/client';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  findReference,
  FindReferenceError,
  validateTransfer,
  ValidateTransferError,
} from '@solana/pay';
import { USDC_ADDRESS } from 'src/constants';

@Injectable()
export class IndexerService {
  private readonly connection: Connection;
  constructor(
    private readonly webhookService: WebhookService,
    private readonly prisma: PrismaClient,
  ) {}

  async pollTransfer(transfer: Transfer) {
    try {
      const reference = new PublicKey(transfer.reference);
      let signature: string;

      try {
        const oldest = await findReference(this.connection, reference, {
          finality: 'confirmed',
        });
        signature = oldest.signature;
      } catch (e) {
        if (e instanceof FindReferenceError) return;
      }

      const recipient = new PublicKey(transfer.receiverWalletAddress);
      const amount = new BigNumber(transfer.amount);
      const splToken = new PublicKey(USDC_ADDRESS);

      await validateTransfer(
        this.connection,
        signature,
        { recipient, amount, splToken, reference },
        { commitment: 'confirmed' },
      );
      await this.prisma.transfer.update({
        where: { id: transfer.id },
        data: { status: TransferStatus.Success },
      });
      // TODO: Send update to receiver of payment
    } catch (e) {
      if (e instanceof ValidateTransferError) {
        await this.prisma.transfer.update({
          where: { id: transfer.id },
          data: { status: TransferStatus.Rejected },
        });
      }
    }
  }
}
