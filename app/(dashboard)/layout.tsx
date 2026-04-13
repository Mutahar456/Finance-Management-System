"use client"

import { Suspense, useState } from "react"
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
    <div className="flex min-h-0 min-h-[100dvh] overflow-hidden bg-background print:min-h-0 print:bg-white">
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          userName={session?.user?.name ?? undefined}
          userRole={session?.user?.role ?? undefined}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        {/* min-h-0 is required so flex gives this pane a bounded height; without it wheel/trackpad scroll often breaks */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-safe pt-2.5 print:overflow-visible print:bg-white print:p-0 sm:p-4 sm:pt-4 md:p-6 lg:p-8 [-webkit-overflow-scrolling:touch]">
          <Suspense
            fallback={
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-48 max-w-full rounded-md bg-muted" />
                <div className="h-4 w-72 max-w-full rounded-md bg-muted" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-lg bg-muted/60" />
                ))}
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}


