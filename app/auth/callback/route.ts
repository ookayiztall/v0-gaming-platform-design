import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${error.message}`, request.url))
    }

    // Redirect to onboarding instead of dashboard
    return NextResponse.redirect(new URL("/onboarding", request.url))
  } catch (err) {
    return NextResponse.redirect(new URL("/login?error=auth-error", request.url))
  }
}
