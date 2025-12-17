import { createKysely, type db } from '@cw/database/kysely';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const DB_CONNECTION = 'DB_CONNECTION';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DB_CONNECTION,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): db => {
        const connectionString: string =
          configService.getOrThrow('DATABASE_URL');

        return createKysely(connectionString);
      },
    },
  ],
  exports: [DB_CONNECTION],
})
export class DatabaseModule {}
