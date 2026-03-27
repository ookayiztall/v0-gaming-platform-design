"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu, X, LogOut, Shield, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"

const mainNavItems = (spaceSlug?: string) => [
  { href: spaceSlug ? `/space/${spaceSlug}` : "/dashboard", label: "Dashboard", icon: "🎮" },
  { href: spaceSlug ? `/space/${spaceSlug}/command-center` : "/command-center", label: "Command Center", icon: "⌘" },
  { href: spaceSlug ? `/space/${spaceSlug}/games` : "/games", label: "Games", icon: "🕹️" },
  { href: spaceSlug ? `/space/${spaceSlug}/leaderboard` : "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: spaceSlug ? `/space/${spaceSlug}/chat` : "/chat", label: "Chat", icon: "💬" },
]

const moreNavItems = (spaceSlug?: string) => [
  { href: spaceSlug ? `/space/${spaceSlug}/friends` : "/friends", label: "Friends", icon: "👥" },
  { href: spaceSlug ? `/space/${spaceSlug}/messages` : "/messages", label: "Messages", icon: "✉️" },
  { href: spaceSlug ? `/space/${spaceSlug}/tournaments` : "/tournaments", label: "Tournaments", icon: "🏅" },
  { href: spaceSlug ? `/space/${spaceSlug}/blog` : "/blog", label: "Blog", icon: "📝" },
  { href: spaceSlug ? `/space/${spaceSlug}/events` : "/events", label: "Events", icon: "📅" },
  { href: "/profile", label: "Profile", icon: "👤" },
]

interface MainNavProps {
  spaceSlug?: string
}

export function MainNav({ spaceSlug }: MainNavProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        setIsAdmin(profile?.role === "admin")
      }
    }

    checkAdminStatus()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">GV</span>
          </div>
          <span className="font-bold text-lg glow-text hidden sm:inline">GameVerse</span>
        </Link>

        {/* Desktop Navigation - Main items + More dropdown */}
        <div className="hidden md:flex items-center gap-1">
          {mainNavItems(spaceSlug).map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`${
                  pathname === item.href
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Button>
            </Link>
          ))}

          {/* More Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-primary/10">
                More
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {moreNavItems(spaceSlug).map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="cursor-pointer">
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isAdmin && (
            <Link href="/dashboard">
              <Button variant="ghost" className="text-muted-foreground hover:text-accent hover:bg-accent/10">
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-accent"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background/95 backdrop-blur border-b border-border md:hidden">
            <div className="p-4 space-y-2">
              {[...mainNavItems, ...moreNavItems].map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      pathname === item.href
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Button>
                </Link>
              ))}

              {isAdmin && (
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
