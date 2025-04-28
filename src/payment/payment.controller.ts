import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetReceiverParams } from './dto/get-receiver-params.dto';
import { PaymentService } from './payment.service';
import { toReceiverDto } from './dto/receiver.dto';
import { TransferParams } from './dto/transfer-params.dto';
import { UserEntity } from 'src/decorators/user.decorator';
import { UserPayload } from 'src/auth/dto/authorization.dto';
import { UserAuth } from 'src/guards/user-auth';
import { ReceivePaymentParamsDto } from './dto/receive-payment-params.dto';
import { toTransferHistoryArray } from './dto/transfer-history';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UserAuth()
  @Get('get/receiver')
  async getReceiver(@Query() query: GetReceiverParams) {
    const receiver = await this.paymentService.getReceiver(query.encodedQr);
    return toReceiverDto(receiver);
  }

  @UserAuth()
  @Get('get/transfer')
  async transfer(
    @Query() query: TransferParams,
    @UserEntity() user: UserPayload,
  ) {
    const transferTransaction = await this.paymentService.createTransferRequest(
      query,
      user.id,
    );
    return transferTransaction;
  }

  @UserAuth()
  @Get('get/receive-request')
  async getPaymentReceiveRequest(
    @Query() query: ReceivePaymentParamsDto,
    @UserEntity() user: UserPayload,
  ) {
    const transferTransaction = await this.paymentService.createReceiveRequest(
      user.id,
      query,
    );
    return transferTransaction;
  }

  @UserAuth()
  @Get('get/transfer-history')
  async getTransferHistory(@UserEntity() user: UserPayload) {
    const transferTransaction = await this.paymentService.getTransferHistory(
      user.id,
    );

    return toTransferHistoryArray(transferTransaction);
  }
}
