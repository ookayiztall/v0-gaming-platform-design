import { NextRequest, NextResponse } from 'next';
import { createClient } from '@/lib/supabase/server';
import { verifySpaceAccess } from '@/lib/spaces/authorization';

export async function extractSpaceFromRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const spaceSlug = searchParams.get('space_slug');
  return spaceSlug;
}

export async function validateSpaceRequest(
  request: NextRequest,
  requiredRole?: 'admin' | 'owner'
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        valid: false,
        error: 'Unauthorized',
        status: 401,
      };
    }

    const spaceSlug = extractSpaceFromRequest(request);
    if (!spaceSlug) {
      return {
        valid: false,
        error: 'space_slug parameter required',
        status: 400,
      };
    }

    const access = await verifySpaceAccess(user.id, spaceSlug);
    if (!access.hasAccess) {
      return {
        valid: false,
        error: access.error || 'Access denied',
        status: 403,
      };
    }

    if (requiredRole && access.role !== requiredRole && access.role !== 'owner') {
      return {
        valid: false,
        error: `${requiredRole} role required`,
        status: 403,
      };
    }

    return {
      valid: true,
      userId: user.id,
      spaceSlug,
      spaceId: access.spaceId,
      role: access.role,
    };
  } catch (error) {
    console.error('[v0] Space request validation error:', error);
    return {
      valid: false,
      error: 'Internal server error',
      status: 500,
    };
  }
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}
