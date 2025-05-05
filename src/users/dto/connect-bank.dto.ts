import { plainToInstance } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';

export class ConnectBankDto {
  @IsString()
  vpa: string;

  @IsBoolean()
  verification: boolean;
}


export type ConnectBankInput = {   vpa: string; verification: boolean;  }

export function toConnectBankDto(input: ConnectBankInput){
  const plainConnectBankDto : ConnectBankDto = {
    vpa: input.vpa,
    verification: input.verification
  }

  const connectBankDto = plainToInstance(ConnectBankDto, plainConnectBankDto);
  return connectBankDto
}