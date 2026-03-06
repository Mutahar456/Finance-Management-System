"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Download, Check, Smartphone } from "lucide-react"
import { LOGO_URL } from "@/lib/branding"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Detect iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)

    // For testing: allow showing on localhost even if dismissed
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    // Check if user has already dismissed the prompt (stored in localStorage)
    // Skip this check on localhost for easier testing
    if (!isLocalhost) {
      const dismissed = localStorage.getItem("pwa-install-dismissed")
      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10)
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
        
        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          return
        }
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Show prompt after delay - works on localhost, production, iOS, etc.
    const timer = setTimeout(() => {
      const isProduction = window.location.protocol === 'https:' || 
                          window.location.hostname.includes('vercel.app')
      
      // Show on localhost, production, iOS, or if we have deferredPrompt
      if (isLocalhost || isProduction || isIOS || deferredPrompt) {
        setShowPrompt(true)
      }
    }, 2000) // Reduced to 2 seconds for faster visibility

    return () => {
      clearTimeout(timer)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [isIOS, deferredPrompt])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        setIsInstalled(true)
        setShowPrompt(false)
      }

      setDeferredPrompt(null)
    } else if (isIOS) {
      alert("To install on iOS:\n\n1. Tap the Share button (square with arrow up)\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add'")
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-install-dismissed", Date.now().toString())
  }

  if (isInstalled || !showPrompt) {
    return null
  }

  // Show on localhost (for testing), production (HTTPS), or if we have deferredPrompt or on iOS/Android
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
  )
  const isProduction = typeof window !== 'undefined' && (
    window.location.protocol === 'https:' || 
    window.location.hostname.includes('vercel.app')
  )
  
  // Show if: localhost (testing), production, has deferredPrompt, or iOS
  if (!isLocalhost && !deferredPrompt && !isIOS && !isProduction) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 animate-in slide-in-from-bottom-5 fade-in-0">
      <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-5 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <img src={LOGO_URL} alt="Infinity Wave" className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Install Infinity Wave</h3>
            <p className="text-sm text-orange-100 mt-0.5">Get the full app experience</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-white/20"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-300 flex-shrink-0" />
            <span>Fast access from home screen</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-300 flex-shrink-0" />
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-300 flex-shrink-0" />
            <span>Native app experience</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10"
          >
            Later
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            className="flex-1 bg-white text-orange-600 hover:bg-orange-50 font-semibold"
          >
            <Download className="mr-2 h-4 w-4" />
            Install
          </Button>
        </div>
      </div>
    </div>
  )
}

// Export a component for Navbar/Sidebar to show install button
export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowButton(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Wait a bit to see if beforeinstallprompt fires
    // If it doesn't, the browser likely has its own install button
    const timer = setTimeout(() => {
      // Only show our button if we have deferredPrompt or on iOS
      // Otherwise, let the browser handle it natively
      if (deferredPrompt || isIOS) {
        setShowButton(true)
      }
    }, 2000)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [deferredPrompt, isIOS])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Use native browser prompt
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } else if (isIOS) {
      // iOS doesn't support beforeinstallprompt, show helpful message
      const message = "To install on iOS:\n\n1. Tap the Share button (square with arrow up)\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add' in the top right"
      alert(message)
    }
    // If no deferredPrompt and not iOS, the browser should handle it
    // (user can use the browser's install button in toolbar)
  }

  if (isInstalled || !showButton) {
    return null
  }

  // Only show button if we have deferredPrompt (native install available) or iOS
  // On desktop browsers without deferredPrompt, the browser's own install button is better
  if (!deferredPrompt && !isIOS) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  )
}




