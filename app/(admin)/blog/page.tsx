"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit2, Trash2, Eye } from "lucide-react"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  published: boolean
  publishedAt: string
}

// Mock data - will be replaced with Supabase data
const mockPosts: BlogPost[] = [
  {
    id: "1",
    title: "Welcome to GameVerse",
    slug: "welcome-to-gameverse",
    excerpt: "Discover the future of family gaming",
    published: true,
    publishedAt: "2025-01-15",
  },
  {
    id: "2",
    title: "New Games Released",
    slug: "new-games-released",
    excerpt: "Check out our latest gaming additions",
    published: true,
    publishedAt: "2025-01-10",
  },
]

export default function BlogManagement() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-muted-foreground mt-2">Manage your gaming platform blog</p>
        </div>
        <Link href="/blog/new">
          <Button className="bg-primary hover:bg-primary/90">Create New Post</Button>
        </Link>
      </div>

      {/* Blog Posts Table */}
      <Card className="bg-card/50 border-primary/30 overflow-hidden">
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Published Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockPosts.map((post) => (
                  <tr key={post.id} className="border-b border-border hover:bg-primary/5">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-foreground">{post.title}</p>
                        <p className="text-sm text-muted-foreground">{post.slug}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          post.published ? "bg-green-500/20 text-green-600" : "bg-yellow-500/20 text-yellow-600"
                        }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{post.publishedAt}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/blog/${post.id}/edit`}>
                          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/10">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
