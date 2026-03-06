import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as any
  const { oldPassword, newPassword } = body
  if (!newPassword) return NextResponse.json({ error: 'newPassword required' }, { status: 400 })
  const userId = session.user?.id as string
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (oldPassword) {
    const ok = await bcrypt.compare(oldPassword, user.password)
    if (!ok) return NextResponse.json({ error: 'Old password incorrect' }, { status: 400 })
  }
  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
  return NextResponse.json({ success: true })
}


