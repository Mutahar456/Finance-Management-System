import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import NextTopLoader from "nextjs-toploader"
import "./globals.css"
import { NextAuthProvider } from "@/components/providers/session-provider"
import { InstallPrompt } from "@/components/pwa/install-prompt"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0c1017",
}

export const metadata: Metadata = {
  title: "Infinity Wave Inc - Inventory Management System",
  description: "Complete inventory, finance, and project management system",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextTopLoader
          color="#f97316"
          height={3}
          showSpinner={false}
          shadow={false}
        />
        <NextAuthProvider>{children}</NextAuthProvider>
        <InstallPrompt />
      </body>
    </html>
  )
}


