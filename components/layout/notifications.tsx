"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import Link from "next/link"

type NotificationItem = { projectId: string; overdueCount: number }
type UserNotification = { id: string; message: string; link?: string; readAt?: string | null; createdAt: string }

export function NotificationsBell() {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [userNotifs, setUserNotifs] = useState<UserNotification[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/projects/overdue")
        if (!res.ok) return
        const data = await res.json()
        let normalized: NotificationItem[] = []
        if (data && Array.isArray(data.overdue)) {
          // Two possible shapes:
          // 1) Admin: [{ projectId, overdueUserIds: string[] }]
          // 2) User:  [projectId, projectId, ...]
          if (data.overdue.length > 0 && typeof data.overdue[0] === 'object') {
            normalized = data.overdue.map((it: any) => ({ projectId: String(it.projectId), overdueCount: Array.isArray(it.overdueUserIds) ? it.overdueUserIds.length : 1 }))
          } else {
            normalized = data.overdue.map((pid: any) => ({ projectId: String(pid), overdueCount: 1 }))
          }
        }
        setItems(normalized)
        let c = normalized.reduce((acc, it) => acc + (it.overdueCount || 0), 0)

        const nr = await fetch('/api/notifications')
        if (nr.ok) {
          const ns = await nr.json()
          setUserNotifs(ns)
          c += ns.filter((n: any) => !n.readAt).length
        }
        setCount(c)
      } catch {}
    }
    load()
  }, [])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="relative inline-flex items-center">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
              {count}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content sideOffset={8} className="z-50 w-96 rounded-md border bg-popover p-2 text-sm shadow-md">
        <div className="px-1 py-1">
          <div className="mb-2 font-semibold">Notifications</div>
          {userNotifs.length === 0 ? (
            <div className="text-muted-foreground">No notifications</div>
          ) : (
            <div className="mb-3 max-h-64 space-y-1 overflow-auto">
              {userNotifs.map((n) => (
                <Link key={n.id} href={n.link || '#'} className="block rounded px-2 py-1 hover:bg-accent hover:text-accent-foreground">
                  <div className="flex items-center justify-between">
                    <span className={!n.readAt ? 'font-medium' : ''}>{n.message}</span>
                    <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="mb-2 font-semibold">Overdue Updates</div>
          {items.length === 0 ? (
            <div className="text-muted-foreground">No overdue items</div>
          ) : (
            <div className="max-h-64 space-y-1 overflow-auto">
              {items.map((it, idx) => {
                const pid = String(it.projectId)
                return (
                  <Link key={idx} href={`/projects/${pid}`} className="block rounded px-2 py-1 hover:bg-accent hover:text-accent-foreground">
                    Project #{pid.slice(0, 6)} {it.overdueCount ? `· ${it.overdueCount} overdue` : ''}
                  </Link>
                )
              })}
            </div>
          )}
          <div className="mt-2">
            <Link href="/projects" className="text-primary hover:underline">View all projects</Link>
          </div>
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}


