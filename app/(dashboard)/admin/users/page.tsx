import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import UsersClient from "@/components/admin/users-client"

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!session || role !== 'ADMIN') redirect('/login')

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Users</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersClient />
        </CardContent>
      </Card>
    </div>
  )
}


