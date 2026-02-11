"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Trophy, Users, Zap, Edit2 } from "lucide-react"

const statsData = [
  { month: "Jan", wins: 12, losses: 8 },
  { month: "Feb", wins: 15, losses: 6 },
  { month: "Mar", wins: 18, losses: 5 },
  { month: "Apr", wins: 14, losses: 9 },
  { month: "May", wins: 20, losses: 4 },
]

const friendsList = [
  { name: "ShadowKnight", avatar: "🗡️", status: "online", lastSeen: "now" },
  { name: "NeonGamer", avatar: "⚡", status: "online", lastSeen: "now" },
  { name: "IceBreaker", avatar: "❄️", status: "away", lastSeen: "5 min ago" },
  { name: "CrimsonBlade", avatar: "🔴", status: "offline", lastSeen: "2 hours ago" },
]

export default function ProfilePage() {
  const [username, setUsername] = useState("Player")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      const userData = JSON.parse(user)
      setUsername(userData.username)
    }
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Profile Header */}
        <Card className="bg-gradient-to-r from-primary/20 via-card/50 to-accent/20 border-primary/30 backdrop-blur overflow-hidden">
          <div className="relative p-8">
            {/* Avatar */}
            <div className="flex items-end gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-5xl border-4 border-background shadow-lg">
                👻
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground">{username}</h1>
                <p className="text-muted-foreground">@{username.toLowerCase()} | Joined Jan 2024</p>
              </div>

              {/* Edit Button */}
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="mt-8 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Global Rank</p>
                <p className="text-2xl font-bold text-primary mt-1">#3</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Points</p>
                <p className="text-2xl font-bold text-accent mt-1">14,220</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Win Rate</p>
                <p className="text-2xl font-bold text-secondary mt-1">78.3%</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats & Performance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Chart */}
            <Card className="bg-card/50 border-border/50 backdrop-blur p-6">
              <h2 className="text-xl font-bold mb-4">Performance</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,15,35,0.8)",
                      border: "1px solid rgba(88,86,214,0.3)",
                    }}
                  />
                  <Bar dataKey="wins" fill="rgba(88,86,214,0.8)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="losses" fill="rgba(167,107,207,0.4)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Achievements Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Achievements</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { emoji: "🔥", name: "Hot Streak", desc: "10-win streak", unlocked: true },
                  { emoji: "🎯", name: "Sharp Shot", desc: "95% accuracy", unlocked: true },
                  { emoji: "🏅", name: "Top 10", desc: "Rank in top 10", unlocked: true },
                  { emoji: "🌟", name: "Star Player", desc: "1,000 wins", unlocked: false },
                ].map((achievement) => (
                  <Card
                    key={achievement.name}
                    className={`p-4 backdrop-blur transition-all ${
                      achievement.unlocked
                        ? "bg-card/50 border-border/50 hover:border-primary/30"
                        : "bg-card/30 border-border/30 opacity-50"
                    }`}
                  >
                    <p className={`text-2xl mb-2 ${achievement.unlocked ? "" : "grayscale"}`}>{achievement.emoji}</p>
                    <p className="font-semibold text-sm text-foreground">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Friends & Quick Stats */}
          <div className="space-y-6">
            {/* Quick Stats Cards */}
            <div className="space-y-3">
              {[
                { label: "Total Games", value: "324", icon: Zap },
                { label: "Friends", value: "24", icon: Users },
                { label: "Tournaments Won", value: "8", icon: Trophy },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <Card
                    key={stat.label}
                    className="bg-card/50 border-border/50 backdrop-blur p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <Icon className="w-6 h-6 text-primary opacity-60" />
                  </Card>
                )
              })}
            </div>

            {/* Friends List */}
            <Card className="bg-card/50 border-border/50 backdrop-blur p-4">
              <h3 className="font-semibold mb-3">Friends Online</h3>
              <div className="space-y-2">
                {friendsList.map((friend) => (
                  <div key={friend.name} className="flex items-center justify-between p-2 rounded hover:bg-primary/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs">
                        {friend.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{friend.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{friend.lastSeen}</p>
                      </div>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        friend.status === "online"
                          ? "bg-green-500"
                          : friend.status === "away"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-3 border-border bg-transparent">
                View All Friends
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
