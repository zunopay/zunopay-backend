import { Injectable } from '@nestjs/common';
import {
    EnrichedTransaction,
  Helius,
  HeliusCluster,
  TransactionType,
  WebhookType,
} from 'helius-sdk';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class WebhookService {
  private readonly client: Helius;
  private readonly webhookID: string;

  constructor() {
    this.client = new Helius(
      process.env.HELIUS_API_KEY,
      process.env.SOLANA_CLUSTER as HeliusCluster,
    );
    this.webhookID = process.env.WEBHOOK_ID;
  }

  createWebhook(payload: CreateWebhookDto) {
    return this.client.createWebhook({
      ...payload,
      transactionTypes: [TransactionType.ANY],
      webhookType:
        process.env.SOLANA_CLUSTER === 'devnet'
          ? WebhookType.ENHANCED_DEVNET
          : WebhookType.ENHANCED,
        authHeader: this.generateJwtHeader(),
    });
  }

  findAll() {
    return this.client.getAllWebhooks();
  }

  findOne() {
    return this.client.getWebhookByID(this.webhookID);
  }

  async subscribeTo(address: string) {
    try {
      const { webhookID, accountAddresses } = await this.findOne();
      await this.updateWebhook(webhookID, {
        accountAddresses: accountAddresses.concat(address),
      });
    } catch (e) {
      console.error(`Subscribed to address ${address}`);
    }
  }

  async removeSubscription(address: string) {
    const { webhookID, accountAddresses } = await this.findOne();
    await this.updateWebhook(webhookID, {
      accountAddresses: accountAddresses.filter((aa) => aa !== address),
    });
  }

  updateWebhook(id: string, payload: UpdateWebhookDto) {
    return this.client.editWebhook(id, {
      ...payload,
        authHeader: this.generateJwtHeader(),
    });
  }

  deleteWebhook(id: string) {
    return this.client.deleteWebhook(id);
  }

  handleWebhookEvent(enrichedTransactions: EnrichedTransaction[]) {
    console.log(enrichedTransactions);
    return Promise.all(
      enrichedTransactions.map((transaction) => {
        switch (transaction.type) {
        //   case TransactionType.TRANSFER:
        //     return this.handleLegacyCollectibleComicTransfer(
        //       transaction.instructions.at(-1),
        //       transaction.signature,
        //     );
        //   default:
        //     return this.handleUnknownWebhookEvent(transaction);
        }
      }),
    );
  }

  private generateJwtHeader() {
    const token = jwt.sign({ webhook: true }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '7d',
    });

    return `Bearer ${token}`;
  }
}
