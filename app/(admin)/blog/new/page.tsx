"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function NewBlogPost() {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    published: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Submitting blog post:", formData)
    // Handle submit
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ChevronLeft className="w-4 h-4" />
        Back to Blog Posts
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Create New Blog Post</h1>
        <p className="text-muted-foreground mt-2">Write and publish a new blog post</p>
      </div>

      {/* Blog Editor Form */}
      <Card className="bg-card/50 border-primary/30">
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                Post Title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="Enter post title"
                value={formData.title}
                onChange={handleChange}
                className="bg-input border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium text-foreground">
                Post Slug
              </label>
              <Input
                id="slug"
                name="slug"
                placeholder="post-slug-url"
                value={formData.slug}
                onChange={handleChange}
                className="bg-input border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="excerpt" className="text-sm font-medium text-foreground">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                placeholder="Brief summary of your post"
                value={formData.excerpt}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium text-foreground">
                Content
              </label>
              <textarea
                id="content"
                name="content"
                placeholder="Write your post content here..."
                value={formData.content}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                rows={10}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                name="published"
                checked={formData.published}
                onChange={handleChange}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="published" className="text-sm font-medium text-foreground cursor-pointer">
                Publish immediately
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {formData.published ? "Publish Post" : "Save as Draft"}
              </Button>
              <Link href="/blog">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
