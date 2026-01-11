"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const blogPosts = [
  {
    title: "How to Plan Your Architecture with AI",
    description: "Learn how to use AI-powered tools to plan and visualize your application architecture before writing code.",
    date: "2024-01-20",
    readTime: "5 min read",
    category: "Tutorial",
    href: "#",
  },
  {
    title: "Best Practices for Component Architecture",
    description: "Explore modern patterns and best practices for organizing components in large-scale applications.",
    date: "2024-01-15",
    readTime: "8 min read",
    category: "Best Practices",
    href: "#",
  },
  {
    title: "Introducing ArchitectAI: Visualize Your Apps",
    description: "We're excited to announce ArchitectAI, a new tool that helps developers visualize application architecture in seconds.",
    date: "2024-01-10",
    readTime: "3 min read",
    category: "Product",
    href: "#",
  },
  {
    title: "State Management Patterns",
    description: "A comprehensive guide to choosing the right state management solution for your application.",
    date: "2024-01-05",
    readTime: "10 min read",
    category: "Guide",
    href: "#",
  },
  {
    title: "Building Scalable Applications",
    description: "Key principles and patterns for building applications that scale with your team and user base.",
    date: "2024-01-01",
    readTime: "12 min read",
    category: "Architecture",
    href: "#",
  },
  {
    title: "Visualizing Complex Data Structures",
    description: "How to create interactive diagrams and visualizations for your applications.",
    date: "2023-12-28",
    readTime: "7 min read",
    category: "Tutorial",
    href: "#",
  },
]

const categories = ["All", "Tutorial", "Best Practices", "Product", "Guide", "Architecture"]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Back to home link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Blog
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn about architecture, best practices, and how to build better applications.
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  index === 0
                    ? "gradient-primary text-white"
                    : "border border-border hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Blog Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {blogPosts.map((post, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-border bg-card/80 backdrop-blur-sm cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-600/10 text-blue-700 dark:text-blue-400">
                      {post.category}
                    </span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{post.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.readTime}
                    </div>
                  </div>
                  <Link
                    href={post.href}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 group/link"
                  >
                    Read more
                    <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Newsletter CTA */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl text-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <h2 className="text-2xl font-semibold text-foreground mb-4">Stay Updated</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter and get the latest articles, tutorials, and product updates delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Button variant="gradient">Subscribe</Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

