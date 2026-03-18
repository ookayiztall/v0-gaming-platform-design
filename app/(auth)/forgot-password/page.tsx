"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setEmail("")
    } catch (err) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-primary/30 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center glow-text">Reset Password</CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          Enter your email to receive a password reset link
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 rounded-md bg-green-500/10 border border-green-500/30 text-green-600 text-sm">
            Check your email for a password reset link. It will expire in 1 hour.
          </div>
        )}

        {/* Reset Form */}
        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border focus:border-primary focus:shadow-lg focus:shadow-primary/20"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Check your spam folder if you don't see it in your inbox.
            </p>
          </div>
        )}

        {/* Back to Login Link */}
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </CardContent>
    </Card>
  )
}
