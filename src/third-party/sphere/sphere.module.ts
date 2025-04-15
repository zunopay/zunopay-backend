import { Module } from '@nestjs/common';
import { SphereService } from './sphere.service';

@Module({
  providers: [SphereService],
})
export default class SphereModule {}
