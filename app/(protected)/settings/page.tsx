"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { Input } from "@/components/ui/input"
import { Bell, Lock, Palette, LogOut, Eye, EyeOff, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface PasswordModalState {
  isOpen: boolean
  currentPassword: string
  newPassword: string
  confirmPassword: string
  showCurrent: boolean
  showNew: boolean
  showConfirm: boolean
  error: string
  success: string
  isLoading: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    soundEnabled: true,
    privateMode: false,
    friendRequests: true,
  })
  const [passwordModal, setPasswordModal] = useState<PasswordModalState>({
    isOpen: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrent: false,
    showNew: false,
    showConfirm: false,
    error: "",
    success: "",
    isLoading: false,
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem("user")
    router.push("/login") // Fixed route - removed /auth prefix
  }

  const openPasswordModal = () => {
    setPasswordModal((prev) => ({
      ...prev,
      isOpen: true,
      error: "",
      success: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }))
  }

  const closePasswordModal = () => {
    setPasswordModal((prev) => ({
      ...prev,
      isOpen: false,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      error: "",
      success: "",
    }))
  }

  const validatePasswordForm = () => {
    if (!passwordModal.currentPassword) {
      setPasswordModal((prev) => ({ ...prev, error: "Please enter your current password" }))
      return false
    }
    if (!passwordModal.newPassword) {
      setPasswordModal((prev) => ({ ...prev, error: "Please enter a new password" }))
      return false
    }
    if (passwordModal.newPassword.length < 6) {
      setPasswordModal((prev) => ({ ...prev, error: "New password must be at least 6 characters" }))
      return false
    }
    if (passwordModal.newPassword !== passwordModal.confirmPassword) {
      setPasswordModal((prev) => ({ ...prev, error: "Passwords do not match" }))
      return false
    }
    return true
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordModal((prev) => ({ ...prev, error: "", success: "" }))

    if (!validatePasswordForm()) return

    setPasswordModal((prev) => ({ ...prev, isLoading: true }))
    try {
      const supabase = createClient()

      // First verify the current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        throw new Error("User not found")
      }

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordModal.currentPassword,
      })

      if (signInError) {
        setPasswordModal((prev) => ({ ...prev, error: "Current password is incorrect", isLoading: false }))
        return
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordModal.newPassword,
      })

      if (updateError) {
        setPasswordModal((prev) => ({ ...prev, error: updateError.message, isLoading: false }))
        return
      }

      setPasswordModal((prev) => ({
        ...prev,
        success: "Password changed successfully!",
        isLoading: false,
      }))

      // Close modal after 2 seconds
      setTimeout(() => {
        closePasswordModal()
      }, 2000)
    } catch (err) {
      setPasswordModal((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "An error occurred",
        isLoading: false,
      }))
    }
  }

  const settingSections = [
    {
      title: "Notifications",
      icon: Bell,
      settings: [
        {
          label: "Email Notifications",
          description: "Receive email updates about games and tournaments",
          key: "emailNotifications" as const,
        },
        {
          label: "Push Notifications",
          description: "Get push notifications for important events",
          key: "pushNotifications" as const,
        },
        {
          label: "Sound Effects",
          description: "Enable in-game sound effects",
          key: "soundEnabled" as const,
        },
      ],
    },
    {
      title: "Privacy & Safety",
      icon: Lock,
      settings: [
        {
          label: "Private Mode",
          description: "Hide your online status from other players",
          key: "privateMode" as const,
        },
        {
          label: "Friend Requests",
          description: "Allow players to send you friend requests",
          key: "friendRequests" as const,
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold glow-text">Settings</h1>
          <p className="text-muted-foreground">Customize your GameVerse experience</p>
        </div>

        {/* Settings Sections */}
        {settingSections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.title} className="bg-card/50 border-border/50 backdrop-blur overflow-hidden">
              {/* Section Header */}
              <div className="border-b border-border/50 p-6 bg-muted/20">
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold">{section.title}</h2>
                </div>
              </div>

              {/* Settings List */}
              <div className="divide-y divide-border/30">
                {section.settings.map((setting) => (
                  <div key={setting.key} className="p-6 flex items-center justify-between hover:bg-primary/5">
                    <div>
                      <h3 className="font-semibold text-foreground">{setting.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                    </div>
                    <Toggle
                      pressed={settings[setting.key]}
                      onPressedChange={() => handleToggle(setting.key)}
                      className="bg-muted hover:bg-muted/80 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )
        })}

        {/* Account Section */}
        <Card className="bg-card/50 border-border/50 backdrop-blur overflow-hidden">
          <div className="border-b border-border/50 p-6 bg-muted/20">
            <div className="flex items-center gap-3">
              <Palette className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold">Account</h2>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <p className="font-semibold text-foreground">Email</p>
              <p className="text-sm text-muted-foreground mt-1">phantom_echo@example.com</p>
            </div>

            <div className="pt-4 border-t border-border/30 space-y-3">
              <Button 
                onClick={openPasswordModal}
                variant="outline" 
                className="w-full border-border bg-transparent hover:bg-primary/10"
              >
                Change Password
              </Button>
              <Button variant="outline" className="w-full border-border bg-transparent hover:bg-primary/10">
                Two-Factor Authentication
              </Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-destructive/10 border-destructive/30 backdrop-blur overflow-hidden">
          <div className="border-b border-destructive/20 p-6 bg-destructive/5">
            <h2 className="text-xl font-bold text-destructive">Danger Zone</h2>
          </div>

          <div className="p-6 space-y-3">
            <Button
              onClick={handleLogout}
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent border"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
            <Button
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
            >
              Delete Account
            </Button>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            Save Changes
          </Button>
          <Button variant="outline" className="flex-1 border-border bg-transparent">
            Cancel
          </Button>
        </div>
      </div>

      {/* Change Password Modal */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-primary/30 bg-card/95 backdrop-blur">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <button
                onClick={closePasswordModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Error Message */}
              {passwordModal.error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  {passwordModal.error}
                </div>
              )}

              {/* Success Message */}
              {passwordModal.success && (
                <div className="p-3 rounded-md bg-green-500/10 border border-green-500/30 text-green-600 text-sm">
                  {passwordModal.success}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-sm font-medium">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={passwordModal.showCurrent ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordModal.currentPassword}
                      onChange={(e) =>
                        setPasswordModal((prev) => ({ ...prev, currentPassword: e.target.value }))
                      }
                      className="bg-input border-border focus:border-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPasswordModal((prev) => ({ ...prev, showCurrent: !prev.showCurrent }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {passwordModal.showCurrent ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={passwordModal.showNew ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordModal.newPassword}
                      onChange={(e) =>
                        setPasswordModal((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      className="bg-input border-border focus:border-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordModal((prev) => ({ ...prev, showNew: !prev.showNew }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {passwordModal.showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">At least 6 characters</p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={passwordModal.showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordModal.confirmPassword}
                      onChange={(e) =>
                        setPasswordModal((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      className="bg-input border-border focus:border-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPasswordModal((prev) => ({ ...prev, showConfirm: !prev.showConfirm }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {passwordModal.showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={closePasswordModal}
                    disabled={passwordModal.isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={passwordModal.isLoading}
                  >
                    {passwordModal.isLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
