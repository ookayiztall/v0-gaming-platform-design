"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)

  useEffect(() => {
    // Check if we have a valid recovery token
    const hash = window.location.hash
    if (!hash.includes("access_token")) {
      setIsValidToken(false)
    }
  }, [])

  const validateForm = () => {
    if (!password || !confirmPassword) {
      setError("Please fill in all fields")
      return false
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setPassword("")
      setConfirmPassword("")

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <Card className="border-destructive/30 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center text-destructive">Invalid Reset Link</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
        </CardHeader>

        <CardContent>
          <Button
            onClick={() => router.push("/forgot-password")}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            Request a New Reset Link
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/30 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center glow-text">Create New Password</CardTitle>
        <p className="text-center text-sm text-muted-foreground">Enter your new password below</p>
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
            Password reset successfully! Redirecting to login...
          </div>
        )}

        {/* Reset Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border focus:border-primary focus:shadow-lg focus:shadow-primary/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">At least 6 characters</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-input border-border focus:border-primary focus:shadow-lg focus:shadow-primary/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Reset Password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
