'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function CreateSpacePage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    // Auto-generate slug from name
    setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from('spaces')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        setError('This space slug is already taken');
        setLoading(false);
        return;
      }

      // Create space
      const { data, error: createError } = await supabase
        .from('spaces')
        .insert({
          name,
          slug,
          description,
          owner_id: user.id,
          plan_tier: 'free',
          invite_limit: 5,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add owner as member
      await supabase
        .from('space_memberships')
        .insert({
          space_id: data.id,
          user_id: user.id,
          role: 'owner',
        });

      router.push(`/spaces/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create space');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" className="mb-8" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Create a Private Space</CardTitle>
            <CardDescription>Start building your community with full privacy and control</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSpace} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <p>{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Space Name</label>
                <Input
                  placeholder="My Gaming Community"
                  value={name}
                  onChange={handleNameChange}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Space URL</label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">gameverse.app/spaces/</span>
                  <Input
                    placeholder="my-community"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    required
                    disabled={loading}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Only letters, numbers, and hyphens allowed</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <Textarea
                  placeholder="Describe your space..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  rows={4}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Free Plan Includes:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Private chat and leaderboards</li>
                  <li>✓ Invite up to 5 members (including you)</li>
                  <li>✓ Full game access</li>
                  <li>✓ Moderation tools</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !name || !slug} size="lg" className="flex-1">
                  {loading ? 'Creating...' : 'Create Space'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
