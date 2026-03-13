'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_username?: string;
  created_at: string;
  updated_at: string;
}

export default function SpaceBlogPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.slug as string;
  const supabase = createBrowserClient();

  const [space, setSpace] = useState<any>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    loadBlogData();
  }, [spaceSlug]);

  const loadBlogData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Get space
      const { data: spaceData } = await supabase
        .from('spaces')
        .select('*')
        .eq('slug', spaceSlug)
        .single();

      setSpace(spaceData);

      // Check if user is admin
      const { data: memberData } = await supabase
        .from('space_memberships')
        .select('role')
        .eq('space_id', spaceData?.id)
        .eq('user_id', user.id)
        .single();

      setIsAdmin(memberData?.role === 'admin' || memberData?.role === 'owner');

      // Fetch blog posts (filtered by space_id)
      const { data: postsData } = await supabase
        .from('blogs')
        .select('*, profiles:author_id(username)')
        .eq('space_id', spaceData?.id)
        .order('created_at', { ascending: false });

      setPosts(
        postsData?.map((post: any) => ({
          ...post,
          author_username: post.profiles?.username,
        })) || []
      );
    } catch (error) {
      console.error('[v0] Error loading blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async () => {
    if (!formData.title || !formData.content || !space || !currentUser) return;

    try {
      if (editingId) {
        // Update existing post
        await supabase
          .from('blogs')
          .update({
            title: formData.title,
            content: formData.content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);
      } else {
        // Create new post
        await supabase.from('blogs').insert([
          {
            space_id: space.id,
            title: formData.title,
            content: formData.content,
            author_id: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }

      setFormData({ title: '', content: '' });
      setEditingId(null);
      setIsCreating(false);
      loadBlogData();
    } catch (error) {
      console.error('[v0] Error saving post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await supabase.from('blogs').delete().eq('id', postId);
      loadBlogData();
    } catch (error) {
      console.error('[v0] Error deleting post:', error);
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setFormData({ title: post.title, content: post.content });
    setEditingId(post.id);
    setIsCreating(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Loading blog...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {isCreating ? (
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setIsCreating(false);
              setEditingId(null);
              setFormData({ title: '', content: '' });
            }}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Blog Post' : 'Create New Blog Post'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter blog title..."
                  className="bg-input"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your blog post..."
                  className="bg-input min-h-64"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setFormData({ title: '', content: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSavePost} disabled={!formData.title || !formData.content}>
                  {editingId ? 'Update Post' : 'Publish Post'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">Blog</h1>
              <p className="text-muted-foreground mt-2">Stories and guides from {spaceSlug}</p>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsCreating(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            )}
          </div>

          {posts.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Blog Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {isAdmin ? 'No blog posts yet. Create one to get started!' : 'No blog posts yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl">{post.title}</CardTitle>
                        <CardDescription className="mt-2">
                          By {post.author_username} • {new Date(post.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditPost(post)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap line-clamp-3">{post.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
