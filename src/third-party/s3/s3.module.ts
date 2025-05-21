import { Global, Module } from '@nestjs/common';
import { S3Service } from './s3.service';

@Global()
@Module({
  exports: [S3Service],
  providers: [S3Service],
})
export class S3Module {}
