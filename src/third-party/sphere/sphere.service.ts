import { BadRequestException, Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from 'nestjs-prisma';
import {
  SphereFetchCustomerResponseData,
  SphereTransferResponseData,
  SphereWalletAccount,
} from './dto/types';
import { BASE_SPHERE_URL } from '../../constants';
import { UserOfframpProvider } from '@prisma/client';
import { constructDigitalTransferTransaction } from '../../utils/payments';
import { Connection } from '@solana/web3.js';
import { getConnection, getSphereApiClient } from '../../utils/connection';
import { Currency } from '../../types/payment';

@Injectable()
export class SphereService {
  private readonly connection: Connection;
  private readonly client: AxiosInstance;

  constructor(private readonly prisma: PrismaService) {
    this.connection = getConnection();
    this.client = getSphereApiClient();
  }

  async offramp(userId: number, amount: number) {
    const sphereCustomer = await this.prisma.userOfframpProvider.findUnique({
      where: {
        userId_offrampProvider: { userId, offrampProvider: 'SpherePay' },
      },
    });

    // Create transfer
    const transferData = await this.transferToBank(
      sphereCustomer,
      amount,
      Currency.EUR,
    );
    const intermediaryWallet = transferData.instructions
      .resource as SphereWalletAccount;
    if (intermediaryWallet.owner == 'bridge') {
      /*
        If automatic:
        - Transfer using smart account

        If mannual:
        - Transfer with transaction wallet signing
      */
      // const transferTransaction = await constructDigitalTransferTransaction(
      //   this.connection,
      //   sphereCustomer.walletAccountId,
      //   intermediaryWallet.address,
      //   amount,
      // );
      // return transferTransaction;
    } else {
      //fails
      throw new BadRequestException('Failed to offramp');
    }
  }

  private async fetchCustomer(customerId: string) {
    const customer = await axios.get<SphereFetchCustomerResponseData>(
      `${BASE_SPHERE_URL}/v2/customer/${customerId}`,
    );
    return customer;
  }

  private async transferToBank(
    userOfframpDetails: UserOfframpProvider,
    amount: number,
    currency: Currency,
  ) {
    const bankAccount = userOfframpDetails.bankAccountId;
    const walletAccount = userOfframpDetails.walletAccountId;
    const customer = userOfframpDetails.customerId;

    const data = JSON.stringify({
      amount: amount,
      customer,
      source: {
        id: walletAccount,
        currency: 'usdc',
        network: 'sol',
      },
      destination: {
        id: bankAccount,
        currency: currency == Currency.EUR ? 'eur' : 'usdc',
        network: 'sepa',
      },
    });

    const response = await this.client.post<SphereTransferResponseData>(
      '/v1/transfer',
      data,
    );
    if (response.status !== 200) {
      throw new BadRequestException();
    }

    return response.data.transfer;
  }
}
