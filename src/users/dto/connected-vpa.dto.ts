import { plainToInstance } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';

export class ConnectedVpaDto {
  @IsString()
  vpa: string;

  @IsBoolean()
  verification: boolean;
}

export type ConnectedVpaInput = { vpa: string; verification: boolean };

export function toConnectedVpaDto(input: ConnectedVpaInput) {
  const plainConnectVpaDto: ConnectedVpaDto = {
    vpa: input.vpa,
    verification: input.verification,
  };

  const connectedVpaDto = plainToInstance(ConnectedVpaDto, plainConnectVpaDto);
  return connectedVpaDto;
}
