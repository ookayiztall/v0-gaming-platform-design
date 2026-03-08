import { createClient } from "@/lib/supabase/server"

export type SpaceRole = "owner" | "admin" | "member"

export interface SpaceAccessCheck {
  hasAccess: boolean
  role?: SpaceRole
  spaceId?: string
  error?: string
}

/**
 * Verify user has access to a specific space
 */
export async function verifySpaceAccess(
  userId: string,
  spaceSlug: string,
): Promise<SpaceAccessCheck> {
  try {
    const supabase = await createClient()

    // Get space by slug
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id")
      .eq("slug", spaceSlug)
      .single()

    if (spaceError || !space) {
      return { hasAccess: false, error: "Space not found" }
    }

    // Check membership
    const { data: membership, error: memberError } = await supabase
      .from("space_memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("space_id", space.id)
      .single()

    if (memberError || !membership) {
      return { hasAccess: false, error: "Not a member of this space" }
    }

    return {
      hasAccess: true,
      role: membership.role as SpaceRole,
      spaceId: space.id,
    }
  } catch (error) {
    console.error("[v0] Space access verification error:", error)
    return { hasAccess: false, error: "Verification failed" }
  }
}

/**
 * Verify user is space admin or owner
 */
export async function verifySpaceAdmin(
  userId: string,
  spaceSlug: string,
): Promise<SpaceAccessCheck> {
  const access = await verifySpaceAccess(userId, spaceSlug)

  if (!access.hasAccess) {
    return access
  }

  if (access.role !== "admin" && access.role !== "owner") {
    return { hasAccess: false, error: "Admin role required" }
  }

  return access
}

/**
 * Verify user is space owner
 */
export async function verifySpaceOwner(
  userId: string,
  spaceSlug: string,
): Promise<SpaceAccessCheck> {
  const access = await verifySpaceAccess(userId, spaceSlug)

  if (!access.hasAccess) {
    return access
  }

  if (access.role !== "owner") {
    return { hasAccess: false, error: "Owner role required" }
  }

  return access
}

/**
 * Get space ID from slug
 */
export async function getSpaceIdFromSlug(spaceSlug: string): Promise<string | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("spaces")
      .select("id")
      .eq("slug", spaceSlug)
      .single()

    if (error || !data) {
      return null
    }

    return data.id
  } catch (error) {
    console.error("[v0] Error getting space ID:", error)
    return null
  }
}

/**
 * Get user's space memberships
 */
export async function getUserSpaces(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("space_memberships")
      .select(`
        role,
        spaces (
          id,
          slug,
          name,
          description,
          owner_id,
          plan_tier,
          is_public
        )
      `)
      .eq("user_id", userId)

    if (error) {
      console.error("[v0] Error fetching user spaces:", error)
      return []
    }

    return (
      data?.map((m: any) => ({
        ...m.spaces,
        userRole: m.role,
      })) || []
    )
  } catch (error) {
    console.error("[v0] Error getting user spaces:", error)
    return []
  }
}
