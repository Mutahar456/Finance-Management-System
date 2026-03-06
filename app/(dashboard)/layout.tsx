"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { useSession } from "next-auth/react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // Safely handle useSession - it can return undefined during SSR
  const sessionResult = useSession()
  const session = sessionResult?.data || null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
            <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          userName={session?.user?.name ?? undefined}
          userRole={session?.user?.role ?? undefined}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}


