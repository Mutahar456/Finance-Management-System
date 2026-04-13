"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Package,
  DollarSign,
  FolderKanban,
  FileText,
  BarChart3,
  LogOut,
  User,
  X,
  CalendarClock,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/finance", label: "Finance", icon: DollarSign },
  { href: "/finance/recurring", label: "Monthly bills", icon: CalendarClock },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/users", label: "Users", icon: User },
  { href: "/logs", label: "Activity Logs", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
]

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

interface SidebarContentProps {
  pathname: string | null
  onNavLinkClick: () => void
  onItemClick?: () => void
  showBrand?: boolean
}

function SidebarContent({
  pathname,
  onNavLinkClick,
  onItemClick,
  showBrand = true,
}: SidebarContentProps) {
  return (
    <>
      {showBrand && (
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold text-primary">Infinity Wave Inc</h1>
        </div>
      )}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (pathname !== item.href && !pathname?.startsWith(`${item.href}/`)) {
                  onNavLinkClick()
                }
                onItemClick?.()
              }}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors active:opacity-90",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  )
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const [navigating, setNavigating] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setNavigating(false)
  }, [pathname])

  useEffect(() => {
    if (!navigating) return
    const safety = window.setTimeout(() => setNavigating(false), 5000)
    return () => window.clearTimeout(safety)
  }, [navigating])

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="relative hidden h-screen w-64 flex-col border-r bg-card print:hidden lg:flex">
        <SidebarContent
          pathname={pathname}
          onNavLinkClick={() => setNavigating(true)}
        />
        {navigating && (
          <div className="absolute inset-0 z-50 flex items-end justify-center bg-background/20 pb-6 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
              Loading...
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 print:hidden lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-card transition-transform duration-300 ease-in-out print:hidden lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b px-6">
            <h1 className="text-xl font-bold text-primary">Infinity Wave Inc</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <SidebarContent
            pathname={pathname}
            onNavLinkClick={() => setNavigating(true)}
            onItemClick={onMobileClose}
            showBrand={false}
          />
          {navigating && (
            <div className="absolute inset-0 z-50 flex items-end justify-center bg-background/20 pb-6 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
                Loading...
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
