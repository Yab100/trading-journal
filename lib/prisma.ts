import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

declare global {
  var prisma: PrismaClient | undefined
}

const connectionString =
  process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined"
  )
}

const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

const adapter =
  new PrismaPg(pool)

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
  })

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma
}