import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface CreateSpaceInput {
  name: string;
  slug: string;
  description?: string;
}

export async function createSpace(input: CreateSpaceInput, userId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('spaces')
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description || '',
      owner_id: userId,
      plan_tier: 'free',
      invite_limit: 5,
    })
    .select()
    .single();

  if (error) throw error;

  // Add owner as admin member
  await supabase.from('space_memberships').insert({
    space_id: data.id,
    user_id: userId,
    role: 'owner',
  });

  return data;
}

export async function getUserSpaces(userId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('space_memberships')
    .select('spaces(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map((m: any) => m.spaces) || [];
}

export async function getSpaceBySlug(slug: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

export async function getSpaceMembers(spaceId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('space_memberships')
    .select('*, profiles(*)')
    .eq('space_id', spaceId);

  if (error) throw error;
  return data || [];
}

export async function inviteToSpace(
  spaceId: string,
  invitedEmail: string,
  userId: string
) {
  const supabase = await createServerClient();

  // Check invite limit
  const { data: space } = await supabase
    .from('spaces')
    .select('plan_tier, invite_limit')
    .eq('id', spaceId)
    .single();

  if (!space) throw new Error('Space not found');

  const { data: pendingInvites, error: countError } = await supabase
    .from('space_invites')
    .select('id')
    .eq('space_id', spaceId)
    .eq('status', 'pending');

  if (countError) throw countError;

  const memberCount = (pendingInvites?.length || 0) + 1;
  if (memberCount > space.invite_limit) {
    throw new Error(`Invite limit (${space.invite_limit}) exceeded`);
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const { data, error } = await supabase
    .from('space_invites')
    .insert({
      space_id: spaceId,
      invited_email: invitedEmail,
      invited_by: userId,
      token,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function acceptInvite(token: string, userId: string, userEmail: string) {
  const supabase = await createServerClient();

  const { data: invite, error: inviteError } = await supabase
    .from('space_invites')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single();

  if (inviteError) throw inviteError;
  if (!invite) throw new Error('Invalid or expired invite');

  // Check expiry
  if (new Date(invite.expires_at) < new Date()) {
    throw new Error('Invite has expired');
  }

  // Verify email matches
  if (invite.invited_email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error('Email does not match invite');
  }

  // Create membership
  const { error: memberError } = await supabase
    .from('space_memberships')
    .insert({
      space_id: invite.space_id,
      user_id: userId,
      role: 'member',
    });

  if (memberError && !memberError.message.includes('duplicate')) {
    throw memberError;
  }

  // Mark invite as accepted
  await supabase
    .from('space_invites')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invite.id);

  return invite.space_id;
}

export async function removeMember(spaceId: string, userId: string, requestingUserId: string) {
  const supabase = await createServerClient();

  // Check if requester is owner or admin
  const { data: requester } = await supabase
    .from('space_memberships')
    .select('role')
    .eq('space_id', spaceId)
    .eq('user_id', requestingUserId)
    .single();

  if (!requester || !['owner', 'admin'].includes(requester.role)) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('space_memberships')
    .delete()
    .eq('space_id', spaceId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function updateSpaceSubscription(
  spaceId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string
) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('space_subscriptions')
    .upsert({
      space_id: spaceId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      status: 'active',
      period_start: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Update space plan tier
  await supabase
    .from('spaces')
    .update({
      plan_tier: 'paid',
      invite_limit: 50,
    })
    .eq('id', spaceId);

  return data;
}
