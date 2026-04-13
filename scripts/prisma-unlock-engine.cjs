/**
 * Windows often blocks Prisma's rename of query_engine-*.dll.node (EPERM) when another
 * process still has the file open — usually `next dev` / `node`.
 * Deleting the engine first lets `prisma generate` write a fresh copy.
 */
const fs = require("fs")
const path = require("path")

const dir = path.join(process.cwd(), "node_modules", ".prisma", "client")
if (!fs.existsSync(dir)) {
  process.exit(0)
}

let removed = 0
for (const name of fs.readdirSync(dir)) {
  // Prisma engine binaries + Windows failed renames (*.tmp*)
  if (!name.startsWith("query_engine") && !name.startsWith("libquery_engine")) continue
  const fp = path.join(dir, name)
  try {
    fs.unlinkSync(fp)
    removed++
  } catch (e) {
    if (e && e.code === "ENOENT") continue
    console.error(
      "\n[!] Could not delete Prisma query engine file:\n    " +
        fp +
        "\n    Stop all Node processes using this project (Ctrl+C on `npm run dev`), then run again.\n" +
        "    If it persists: Task Manager → end \"Node.js\" tasks, or restart the PC.\n"
    )
    process.exit(1)
  }
}
if (removed > 0) {
  console.log("[prisma-unlock] Removed " + removed + " query engine file(s).")
}
