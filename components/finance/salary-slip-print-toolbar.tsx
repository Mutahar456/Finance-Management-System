"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"
import { useRouter } from "next/navigation"

export function SalarySlipPrintToolbar({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter()

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
      <Button type="button" variant="default" className="gap-2" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print / Save as PDF
      </Button>
      <Button type="button" variant="outline" className="gap-2" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
    </div>
  )
}
