import { IsString } from "class-validator";

export class StartKycDto {
    @IsString()
    vpa: string
}