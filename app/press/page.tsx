"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Download, FileText, Image } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const pressKit = [
  {
    icon: Image,
    title: "Logo & Brand Assets",
    description: "Download our logo in various formats and sizes",
    href: "#",
    color: "blue",
  },
  {
    icon: FileText,
    title: "Press Release",
    description: "Latest press releases and announcements",
    href: "#",
    color: "cyan",
  },
  {
    icon: Image,
    title: "Screenshots",
    description: "High-resolution screenshots of ArchitectAI",
    href: "#",
    color: "blue",
  },
  {
    icon: FileText,
    title: "Fact Sheet",
    description: "Key facts and statistics about ArchitectAI",
    href: "#",
    color: "cyan",
  },
]

const recentNews = [
  {
    date: "2024-01-20",
    title: "ArchitectAI Raises $5M Series A to Accelerate AI-Powered Development Tools",
    outlet: "TechCrunch",
    href: "#",
  },
  {
    date: "2024-01-15",
    title: "How AI is Changing the Way Developers Plan Applications",
    outlet: "The Verge",
    href: "#",
  },
  {
    date: "2024-01-10",
    title: "ArchitectAI Launches Public Beta with 10,000+ Developers",
    outlet: "Product Hunt",
    href: "#",
  },
]

export default function PressPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
              Press & Media
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Resources for journalists, bloggers, and media professionals covering ArchitectAI.
            </p>
          </div>

          {/* Contact Section */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl mb-12">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-400 shrink-0">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">Media Inquiries</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For press inquiries, interview requests, or media partnerships, please contact our press team.
                </p>
                <Button variant="gradient" asChild>
                  <Link href="mailto:press@architectai.com">Contact Press Team</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Press Kit */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Press Kit</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {pressKit.map((item, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 border-border bg-card/80 backdrop-blur-sm"
                >
                  <CardHeader>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg mb-3 ${
                      item.color === "blue" 
                        ? "bg-blue-600/10 text-blue-700 dark:text-blue-400" 
                        : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
                    }`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href={item.href}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent News */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl mb-12">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <h2 className="text-2xl font-semibold text-foreground mb-6">Recent News</h2>
            <div className="space-y-4">
              {recentNews.map((news, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">{news.date} • {news.outlet}</p>
                      <h3 className="font-semibold text-foreground mb-2">{news.title}</h3>
                    </div>
                    <Link
                      href={news.href}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                    >
                      Read article →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* About Section */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <h2 className="text-2xl font-semibold text-foreground mb-4">About ArchitectAI</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                ArchitectAI is an AI-powered platform that helps developers visualize and plan application 
                architecture in seconds. Our multi-agent system combines the expertise of Product Managers, 
                Architects, and Engineers to generate comprehensive architecture diagrams from simple descriptions.
              </p>
              <p>
                Founded in 2024, ArchitectAI is used by thousands of developers worldwide to streamline their 
                development workflow and align their teams before writing code.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

