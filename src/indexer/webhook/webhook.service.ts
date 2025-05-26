import { Injectable } from '@nestjs/common';
import {
  EnrichedTransaction,
  Helius,
  HeliusCluster,
  Instruction,
  TransactionType,
  WebhookType,
} from 'helius-sdk';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import * as jwt from 'jsonwebtoken';
import {
  getAccount,
  TOKEN_PROGRAM_ID,
  transferInstructionData,
} from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import { PrismaService } from 'nestjs-prisma';
import { getConnection } from '../../utils/connection';
import bs58 from 'bs58';
import { RewardPointTask, TokenType, TransferStatus } from '@prisma/client';
import { USDC_ADDRESS } from '../../constants';
import {
  calculateShoppingPoints,
  isSupportedToken,
} from '../../utils/payments';

@Injectable()
export class WebhookService {
  private readonly client: Helius;
  private readonly webhookID: string;
  private readonly connection: Connection;

  constructor(private readonly prisma: PrismaService) {
    this.client = new Helius(
      process.env.HELIUS_API_KEY,
      process.env.SOLANA_CLUSTER as HeliusCluster,
    );
    this.webhookID = process.env.WEBHOOK_ID;
    this.connection = getConnection();
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
    return Promise.all(
      enrichedTransactions.map((transaction) => {
        switch (transaction.type) {
          case TransactionType.TRANSFER:
            return this.handleTransfer(
              transaction.instructions.at(-1),
              transaction.signature,
            );
          case TransactionType.UNKNOWN:
            return this.handleTransfer(
              transaction.instructions.at(-1),
              transaction.signature,
            );
        }
      }),
    );
  }

  async handleTransfer(instruction: Instruction, signature: string) {
    if (instruction.programId != TOKEN_PROGRAM_ID.toString()) {
      return;
    }

    let sender: string, destinationAta: string;

    if (instruction.accounts.at(1) == USDC_ADDRESS) {
      // transfer checked
      sender = instruction.accounts.at(3);
      destinationAta = instruction.accounts.at(2);
    } else {
      sender = instruction.accounts.at(2);
      destinationAta = instruction.accounts.at(1);
    }

    const account = await getAccount(
      this.connection,
      new PublicKey(destinationAta),
    );

    // Index only supported tokens
    if (!isSupportedToken(account.mint.toString())) {
      return;
    }

    const data = bs58.decode(instruction.data);
    const transferData = transferInstructionData.decode(data);
    const receiver = account.owner.toString();
    const amount = Number(transferData.amount);

    const reference = instruction.accounts.at(-1);
    const inAppTransfer = await this.prisma.transfer.findUnique({
      where: { reference },
    });

    if (inAppTransfer) {
      const transfer = await this.prisma.transfer.update({
        where: { reference },
        data: {
          senderWallet: {
            connectOrCreate: {
              where: { address: sender },
              create: { address: sender, lastInteractedAt: new Date() },
            },
          },
          receiverWallet: {
            connectOrCreate: {
              where: { address: receiver },
              create: { address: receiver, lastInteractedAt: new Date() },
            },
          },
          status: TransferStatus.Success,
          signature,
          tokenType: TokenType.USDC, // TODO: Change this when support more currency,
        },
        select: {
          senderWallet: { select: { userId: true } },
          receiverWallet: { select: { userId: true } },
          royaltyFee: true,
        },
      });

      // If royaltyFee, receiver is merchant
      if (transfer.royaltyFee) {
        const points = calculateShoppingPoints(amount);
        await this.prisma.userRewardPoint.create({
          data: {
            user: { connect: { id: transfer.senderWallet.userId } },
            value: points,
            task: RewardPointTask.Shopping,
            targetId: transfer.receiverWallet.userId,
          },
        });
      }
    } else {
      // create transfer
      await this.prisma.transfer.upsert({
        where: { signature },
        create: {
          senderWallet: {
            connectOrCreate: {
              where: { address: sender },
              create: { address: sender, lastInteractedAt: new Date() },
            },
          },
          receiverWallet: {
            connectOrCreate: {
              where: { address: receiver },
              create: { address: receiver, lastInteractedAt: new Date() },
            },
          },
          status: TransferStatus.Success,
          signature,
          amount: Number(transferData.amount),
          tokenType: TokenType.USDC, // TODO: Change this when support more currency,
        },
        update: {
          senderWallet: {
            connectOrCreate: {
              where: { address: sender },
              create: { address: sender, lastInteractedAt: new Date() },
            },
          },
          receiverWallet: {
            connectOrCreate: {
              where: { address: receiver },
              create: { address: receiver, lastInteractedAt: new Date() },
            },
          },
          status: TransferStatus.Success,
          signature,
          tokenType: TokenType.USDC, // TODO: Change this when support more currency,
        },
      });
    }
  }

  private generateJwtHeader() {
    const token = jwt.sign({ webhook: true }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '7d',
    });

    return `Bearer ${token}`;
  }
}
