/**
 * One-time / occasional: set category from title+description for rows still "uncategorized".
 * Keep rules in sync with lib/finance-auto-category.ts
 *
 * Run: npm run db:backfill-auto-category
 */
const { PrismaClient } = require("@prisma/client")

const UNCATEGORIZED = "uncategorized"

/** @param {'INCOME'|'EXPENSE'} type */
function suggestFinanceCategory(type, title, description) {
  const text = `${title || ""} ${description || ""}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
  if (text.length < 2) return null

  if (type === "EXPENSE") {
    const rules = [
      [/\b(office rent|shop rent|warehouse rent|lease payment|landlord|monthly rent)\b/, "office_rent"],
      [
        /\b(salary|salaries|payroll|employee pay|staff pay|wages|stipend|pay of employee|employee payment)\b/,
        "salaries",
      ],
      [
        /\b(cursor|cursor\.ai|openai|chatgpt|github|notion|slack|figma|adobe|jetbrains|subscription|saas|software license|hosting|domain|upload thing|uploadthing|visa purchase|pcb video|cloudinary|vercel|netlify|aws|azure|gcp|google workspace|microsoft 365|m365)\b/,
        "software_tools",
      ],
      [/\b(laptop|monitor|keyboard|mouse|desktop|pc|hardware|equipment|ups|router|switch)\b/, "hardware"],
      [/\b(marketing|ads campaign|facebook ads|google ads|meta ads|linkedin ads|seo)\b/, "marketing"],
      [
        /\b(internet bill|electric|electricity|utility|utilities|wapda|iesco|gas bill|water bill|phone bill|mobile bundle|broadband|fiber)\b/,
        "utilities",
      ],
      [/\b(travel|flight|uber|careem|indrive|petrol|diesel|hotel stay|per diem)\b/, "travel"],
      [/\b(freelancer payment|pay freelancer|contractor pay|fiverr fee|upwork fee)\b/, "freelancer_payment"],
      [/\b(bank charges|wire fee|swift|transaction fee|easypaisa fee|jazzcash fee|service charge)\b/, "bank_charges"],
      [/\b(company registration|secp|ntn|incorporation|legal fee|lawyer|notary)\b/, "other"],
    ]
    for (const [re, cat] of rules) {
      if (re.test(text)) return cat
    }
    return null
  }

  const rules = [
    [/\bfiverr\b/, "fiverr"],
    [/\bupwork\b/, "upwork"],
    [/\b(project payment|milestone|client invoice|invoice paid|milestone payment)\b/, "project_payment"],
    [/\b(direct client|wire from client|bank transfer from client)\b/, "direct_client"],
    [/\bretainer\b/, "retainer"],
    [/\b(investment return|dividend|profit on investment|mutual fund)\b/, "investment"],
    [/\b(income for month|monthly income|salary received|reimbursement received)\b/, "project_payment"],
  ]
  for (const [re, cat] of rules) {
    if (re.test(text)) return cat
  }
  return null
}

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.financeTransaction.findMany({
    where: {
      OR: [{ category: null }, { category: "" }, { category: UNCATEGORIZED }],
    },
  })

  let updated = 0
  for (const row of rows) {
    const type = row.type === "INCOME" ? "INCOME" : "EXPENSE"
    const next = suggestFinanceCategory(type, row.title, row.description || "")
    if (next && next !== row.category) {
      await prisma.financeTransaction.update({
        where: { id: row.id },
        data: { category: next },
      })
      updated++
    }
  }

  console.log(`Scanned ${rows.length} uncategorized row(s). Updated ${updated} with a suggested category.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
