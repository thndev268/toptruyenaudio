import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Dùng DIRECT_URL (cổng 5432) cho prisma db push / migrate
    // Dùng DATABASE_URL (cổng 6543, pooler) cho backend runtime
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'],
  },
});
