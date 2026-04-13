import fs from "node:fs"
import path from "node:path"
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  /** Last mtime of generated client — when `prisma generate` runs, drop cached PrismaClient in dev */
  __prismaGeneratedMtime?: number
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma

  if (process.env.NODE_ENV !== "production") {
    try {
      const indexPath = path.join(process.cwd(), "node_modules", ".prisma", "client", "index.js")
      const mtime = fs.statSync(indexPath).mtimeMs
      if (
        globalForPrisma.__prismaGeneratedMtime !== undefined &&
        mtime !== globalForPrisma.__prismaGeneratedMtime &&
        cached
      ) {
        void cached.$disconnect().catch(() => {})
        globalForPrisma.prisma = undefined
      }
      globalForPrisma.__prismaGeneratedMtime = mtime
    } catch {
      /* ignore — e.g. first install */
    }
  }

  const refreshed = globalForPrisma.prisma
  // Runtime-only: old cached client may predate `prisma generate` (TS always types the new delegate).
  const delegate = refreshed
    ? Reflect.get(refreshed as object, "recurringExpenseTemplate")
    : undefined
  if (process.env.NODE_ENV !== "production" && refreshed && delegate === undefined) {
    void refreshed.$disconnect().catch(() => {})
    globalForPrisma.prisma = undefined
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

/**
 * Lazy proxy so dev servers don't keep a pre-`generate` PrismaClient on `globalThis`.
 * Must use the real `client` as Reflect receiver — Prisma's model delegates are getters
 * that break when `this` is the Proxy (they return undefined → `.findMany` crashes).
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    return Reflect.get(client, prop, client)
  },
})

export default prisma
