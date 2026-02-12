"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Lock, Users } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [spaceType, setSpaceType] = useState<"private" | "public">("private")
  const [planTier, setPlanTier] = useState<"free" | "paid">("free")
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields")
      return false
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters")
      return false
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email")
      return false
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    if (!formData.agreeToTerms) {
      setError("You must agree to the terms and conditions")
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
      const { error: authError, data } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            spaceType,
            planTier,
          },
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (data?.user) {
        router.push("/verify-email")
      }
    } catch (err) {
      setError("An error occurred during registration")
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.currentTarget
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  return (
    <Card className="border-accent/30 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center glow-text">Join GameVerse</CardTitle>
        <p className="text-center text-sm text-muted-foreground">Create your gaming account</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Space Type Selection */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Choose Your Experience</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Private Space Option */}
            <button
              type="button"
              onClick={() => setSpaceType("private")}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                spaceType === "private"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <Lock className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="font-semibold text-sm">Private Space</p>
              <p className="text-xs text-muted-foreground">Family & friends</p>
            </button>

            {/* Public Option */}
            <button
              type="button"
              onClick={() => setSpaceType("public")}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                spaceType === "public"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <Users className="h-5 w-5 mx-auto mb-2 text-accent" />
              <p className="font-semibold text-sm">Public Community</p>
              <p className="text-xs text-muted-foreground">Global gaming hub</p>
            </button>
          </div>
        </div>

        {/* Plan Selection - Only for Private Space */}
        {spaceType === "private" && (
          <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium text-foreground">Choose a Plan</p>
            <RadioGroup value={planTier} onValueChange={(value) => setPlanTier(value as "free" | "paid")}>
              <div className="flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-primary/10">
                <RadioGroupItem value="free" id="free" />
                <label htmlFor="free" className="cursor-pointer flex-1">
                  <p className="font-medium text-sm">Free Plan</p>
                  <p className="text-xs text-muted-foreground">Up to 5 members</p>
                </label>
              </div>
              <div className="flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-primary/10">
                <RadioGroupItem value="paid" id="paid" />
                <label htmlFor="paid" className="cursor-pointer flex-1">
                  <p className="font-medium text-sm">Premium Plan</p>
                  <p className="text-xs text-muted-foreground">Unlimited members - $9.99/month</p>
                </label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-foreground">
              Username
            </label>
            <Input
              id="username"
              name="username"
              placeholder="Choose your player name"
              value={formData.username}
              onChange={handleChange}
              className="bg-input border-border focus:border-primary focus:shadow-lg focus:shadow-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className="bg-input border-border focus:border-primary focus:shadow-lg focus:shadow-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="bg-input border-border focus:border-primary focus:shadow-lg focus:shadow-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="bg-input border-border focus:border-primary focus:shadow-lg focus:shadow-primary/20"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  agreeToTerms: checked === true,
                }))
              }
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
              I agree to the terms and conditions
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Account"}
          </Button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
