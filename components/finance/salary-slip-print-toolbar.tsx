"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import Link from "next/link"

export function SalarySlipPrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
      <Button type="button" variant="default" className="gap-2" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print / Save as PDF
      </Button>
      <Button type="button" variant="outline" asChild>
        <Link href={backHref}>Back</Link>
      </Button>
    </div>
  )
}
