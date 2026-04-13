/**
 * Runs `prisma generate` if possible, then always runs `next build`.
 * On Windows, generate sometimes fails with EPERM when the query engine DLL is locked;
 * the app can still build if the client was already generated.
 */
const { execSync } = require("child_process")

try {
  execSync("npx prisma generate", { stdio: "inherit", env: process.env })
} catch {
  console.warn(
    "\n[build] prisma generate failed (often EPERM on Windows if another process locks the engine). Continuing with next build…\n"
  )
}

execSync("npx next build", { stdio: "inherit", env: process.env })
