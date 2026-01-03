import { type db } from '@cw/database';
import { PropertySchema } from '@cw/schema';
import { Injectable, Inject } from '@nestjs/common';
import { DB_CONNECTION } from 'src/database/database.module';
import z from 'zod';

@Injectable()
export class PropertyService {
  constructor(@Inject(DB_CONNECTION) private readonly db: db) {}

  async getAllProperty(cursor: number) {
    const data = await this.db
      .selectFrom('property')
      .select(['property.name', 'property.type', 'property.id'])
      .orderBy('property.id', 'asc')
      .offset(cursor)
      .limit(10)
      .execute();

    return {
      data,
      ...(data.length === 10 ? { nextCursor: cursor + 10 } : {}),
    };
  }

  async getPropertyById(id: string) {
    try {
      return await this.db
        .selectFrom('property')
        .select('property.id')
        .where('property.id', '=', id)
        .executeTakeFirstOrThrow();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  }

  async createProperty(values: z.infer<typeof PropertySchema>) {
    try {
      return await this.db
        .insertInto('property')
        .values(values)
        .returning(['property.id', 'property.name'])
        .executeTakeFirstOrThrow();
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
