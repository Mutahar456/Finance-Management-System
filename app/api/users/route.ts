import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    })
    return NextResponse.json(users)
  } catch (e) {
    console.error("Error listing users:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


