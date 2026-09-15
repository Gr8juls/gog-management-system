import { PrismaClient } from '@prisma/client';

// Ensure DATABASE_URL is defined so Prisma never crashes on initialization
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.MONGODB_URI ||
    'mongodb+srv://rubajul_db_user:wX4C%21M%3AEHzmTy34@cluster0.enkqgtm.mongodb.net/gog_management_system?retryWrites=true&w=majority&appName=Cluster0';
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
