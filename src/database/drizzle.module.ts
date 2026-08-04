import { Global, Module } from '@nestjs/common';
import { DrizzleClient, DRIZZLE, drizzleProvider } from './drizzle.provider';

@Global()
@Module({
  providers: [DrizzleClient, drizzleProvider],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
