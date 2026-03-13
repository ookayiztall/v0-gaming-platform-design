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
import { Lock, Users, Info } from "lucide-react"
import { isValidDOB, getAgeGroupFromDOB, getAgeGroup, calculateAge } from "@/lib/age-verification"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [spaceType, setSpaceType] = useState<"private" | "public">("private")
  const [planTier, setPlanTier] = useState<"free" | "standard" | "premium">("free")
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    agreeToTerms: false,
  })
  const [ageGroup, setAgeGroup] = useState<string>("unknown")
  const [hasGuardianEmail, setHasGuardianEmail] = useState(false)
  const [guardianEmail, setGuardianEmail] = useState("")

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.dateOfBirth) {
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
    if (!isValidDOB(formData.dateOfBirth)) {
      setError("Please enter a valid date of birth")
      return false
    }
    if (ageGroup === "under_13" && !hasGuardianEmail) {
      setError("Users under 13 must provide a guardian's email")
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
            dateOfBirth: formData.dateOfBirth,
            ageGroup,
            guardianEmail: ageGroup === "under_13" ? guardianEmail : null,
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
    
    if (name === "dateOfBirth") {
      const newAgeGroup = getAgeGroupFromDOB(value)
      setAgeGroup(newAgeGroup)
    }
    
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
          <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium text-foreground">Choose Your Plan</p>
            <RadioGroup value={planTier} onValueChange={(value) => setPlanTier(value as "free" | "standard" | "premium")}>
              <div className="flex items-center space-x-3 p-3 rounded cursor-pointer hover:bg-primary/10 border border-transparent hover:border-primary/30">
                <RadioGroupItem value="free" id="free" />
                <label htmlFor="free" className="cursor-pointer flex-1">
                  <p className="font-medium text-sm">Free Plan</p>
                  <p className="text-xs text-muted-foreground">Up to 5 members • Perfect for testing</p>
                </label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded cursor-pointer hover:bg-primary/10 border border-transparent hover:border-primary/30">
                <RadioGroupItem value="standard" id="standard" />
                <label htmlFor="standard" className="cursor-pointer flex-1">
                  <p className="font-medium text-sm">Standard Plan</p>
                  <p className="text-xs text-muted-foreground">Up to 10 members • $9.95/month</p>
                </label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded cursor-pointer hover:bg-primary/10 border border-transparent hover:border-primary/30">
                <RadioGroupItem value="premium" id="premium" />
                <label htmlFor="premium" className="cursor-pointer flex-1">
                  <p className="font-medium text-sm">Premium Plan</p>
                  <p className="text-xs text-muted-foreground">Up to 20 members • $19.95/month</p>
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

          {/* Date of Birth */}
          <div className="space-y-2">
            <label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground">
              Date of Birth
            </label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="bg-input border-border focus:border-primary focus:shadow-lg focus:shadow-primary/20"
            />
            {formData.dateOfBirth && (
              <p className="text-xs text-muted-foreground">
                Age: {calculateAge(formData.dateOfBirth)} years old
              </p>
            )}
          </div>

          {/* Age-specific notices */}
          {ageGroup === "under_13" && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
                  <p className="font-semibold">Guardian Consent Required</p>
                  <p>As you are under 13, you will need a guardian (18+) to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>Verify and approve your account</li>
                    <li>Be the administrator of any private spaces</li>
                    <li>Help manage your gameplay</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-amber-500/20">
                <label htmlFor="guardianEmail" className="text-sm font-medium text-foreground">
                  Guardian's Email Address
                </label>
                <Input
                  id="guardianEmail"
                  type="email"
                  placeholder="guardian@example.com"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className="bg-input border-border focus:border-primary focus:shadow-lg focus:shadow-primary/20"
                />
              </div>
            </div>
          )}

          {ageGroup === "14_17" && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-semibold">Teen Account</p>
                  <p>Casino games are not available for ages 14-17.</p>
                </div>
              </div>
            </div>
          )}

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
