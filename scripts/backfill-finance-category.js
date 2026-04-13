/**
 * One-time: set category to "uncategorized" where it was never chosen.
 * Run: npm run db:backfill-finance-category
 */
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.financeTransaction.updateMany({
    where: {
      OR: [{ category: null }, { category: "" }],
    },
    data: { category: "uncategorized" },
  })
  console.log(`Updated ${result.count} transaction(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
