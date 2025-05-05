import { IsString } from "class-validator";

export class ConnectBankDto {
    @IsString()
    vpa: string;
}