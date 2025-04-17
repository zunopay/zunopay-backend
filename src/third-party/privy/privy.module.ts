import { Module } from '@nestjs/common';
import { PrivyService } from './privy.service';

@Module({
  providers: [PrivyService],
})
export class PrivyModule {}
