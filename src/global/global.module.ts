import { Global, Module } from '@nestjs/common';
// import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import config from '../config';

@Global()
@Module({
  imports: [
    // DatabaseModule,
    HttpModule,
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      isGlobal: true,
      load: [config],
    }),
  ],
  exports: [HttpModule],
})
export class GlobalModule {}
