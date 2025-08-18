import { PrismaClient } from '@prisma/client'

// PrismaClient singleton pattern to prevent multiple instances
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to safely disconnect (useful for serverless)
export async function disconnectPrisma() {
  await prisma.$disconnect()
}