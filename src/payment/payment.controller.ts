import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetReceiverParams } from './dto/get-receiver-params.dto';
import { PaymentService } from './payment.service';
import { toReceiverDto } from './dto/receiver.dto';
import { PayParams } from './dto/pay-params.dto';
import { TransferParams } from './dto/transfer-params.dto';
import { UserEntity } from 'src/decorators/user.decorator';
import { UserPayload } from 'src/auth/dto/authorization.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('get/receiver')
  async getReceiver(@Query() query: GetReceiverParams) {
    const receiver = await this.paymentService.getReceiver(query.encodedQr);
    return toReceiverDto(receiver);
  }

  @Get('get/transfer')
  async transfer(
    @Query() query: TransferParams,
    @UserEntity() user: UserPayload,
  ) {
    const transferTransaction = await this.paymentService.transferDigital(
      query,
      user.id,
    );
    return transferTransaction;
  }

  pay(@Query() query: PayParams) {}
}
