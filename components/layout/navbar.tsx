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
    <div className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold hidden sm:block">Dashboard</h2>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <InstallButton />
        <NotificationsBell />
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground">{userRole}</span>
          </div>
        </div>
      </div>
    </div>
  )
}


