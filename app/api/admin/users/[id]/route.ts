import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(() => ({})) as any
  const data: any = {}
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive
  if (body.role === 'ADMIN' || body.role === 'USER') data.role = body.role
  if (body.password) data.password = await bcrypt.hash(body.password, 10)
  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'No changes' }, { status: 400 })
  const user = await prisma.user.update({ where: { id: params.id }, data, select: { id: true, name: true, email: true, role: true, isActive: true } })
  return NextResponse.json(user)
}


