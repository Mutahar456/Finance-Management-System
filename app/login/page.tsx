"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LOGO_URL } from "@/lib/branding"
import { Mail, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InstallButton } from "@/components/pwa/install-prompt"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0 animate-gradient opacity-20" />
      {/* Floating blobs */}
      <div className="blob absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/40" />
      <div className="blob absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-500/40" />

      {/* Install Button - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <InstallButton />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 p-6 md:grid-cols-2 md:gap-8 md:p-10">
        {/* Brand panel */}
        <div className="hidden flex-col justify-center md:flex">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Infinity Wave Inc" className="h-12 w-12" />
              <h1 className="text-4xl font-extrabold tracking-tight">Infinity Wave Inc</h1>
            </div>
            <p className="text-muted-foreground">Secure Inventory, Finance and Project Management — all in one place.</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Role-based access (Admin / User)</li>
              <li>• Complete audit trail</li>
              <li>• Beautiful analytics and reports</li>
            </ul>
          </div>
        </div>

        {/* Auth card */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md border-transparent bg-card/80 shadow-xl backdrop-blur">
            <CardHeader className="space-y-1">
              <div className="flex w-full justify-center">
                <img src={LOGO_URL} alt="Infinity Wave Inc" className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">Sign in to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <a href="#" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</a>
                  </div>
                </div>
                {error && (
                  <div className="animate-in fade-in-50 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg transition-transform hover:scale-[1.01] hover:shadow-xl" disabled={loading}>
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Register
                </Link>
              </p>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Back to site</Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}


