"use client"

import { User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationsBell } from "@/components/layout/notifications"
import { InstallButton } from "@/components/pwa/install-prompt"

interface NavbarProps {
  userName?: string
  userRole?: string
  onMenuClick?: () => void
}

export function Navbar({ userName, userRole, onMenuClick }: NavbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-3 pt-safe print:hidden sm:h-16 sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-10 w-10 shrink-0 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="hidden truncate text-base font-semibold sm:block sm:text-lg">Dashboard</h2>
      </div>
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-3 md:gap-4">
        <InstallButton />
        <NotificationsBell />
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <User className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="hidden min-w-0 flex-col sm:flex">
            <span className="truncate text-sm font-medium">{userName}</span>
            <span className="truncate text-xs text-muted-foreground">{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  )
}


