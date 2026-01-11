"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Briefcase, Clock, ArrowRight } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const openPositions = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build and scale our AI-powered architecture diagram generation platform. Work with modern web technologies, Node.js, and cutting-edge AI models.",
  },
  {
    title: "AI/ML Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Improve our multi-agent AI system for generating architecture diagrams. Work on prompt engineering and model optimization.",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description: "Design beautiful and intuitive experiences for developers. Create interfaces that make complex architecture visualization simple.",
  },
  {
    title: "Developer Advocate",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    description: "Help developers discover and adopt ArchitectAI. Create content, speak at conferences, and build our developer community.",
  },
]

const benefits = [
  {
    title: "Remote First",
    description: "Work from anywhere in the world. We're a fully remote team.",
  },
  {
    title: "Competitive Salary",
    description: "We offer competitive salaries and equity packages.",
  },
  {
    title: "Health & Wellness",
    description: "Comprehensive health, dental, and vision insurance.",
  },
  {
    title: "Learning Budget",
    description: "Annual budget for courses, conferences, and books.",
  },
  {
    title: "Flexible PTO",
    description: "Take time off when you need it. No strict vacation policies.",
  },
  {
    title: "Latest Equipment",
    description: "We provide the best tools and equipment for your work.",
  },
]

export default function CareersPage() {
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
              Join Our Team
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help us build the future of architecture planning. We're looking for talented people who share our passion for developer tools.
            </p>
          </div>

          {/* Why Work With Us */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl mb-12">
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />

            <h2 className="text-2xl font-semibold text-foreground mb-6">Why Work With Us</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="p-4 rounded-lg border border-border bg-card/50">
                  <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Open Positions */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Open Positions</h2>
            <div className="space-y-4">
              {openPositions.map((position, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 border-border bg-card/80 backdrop-blur-sm"
                >
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{position.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {position.department}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {position.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {position.type}
                          </div>
                        </div>
                        <CardDescription>{position.description}</CardDescription>
                      </div>
                      <Button variant="gradient" size="sm" asChild>
                        <Link href="#">
                          Apply
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Don't See a Role? */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl text-center">
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Don't See a Role That Fits?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              We're always looking for talented people. Send us your resume and let us know how you'd like to contribute.
            </p>
            <Button variant="gradient" asChild>
              <Link href="mailto:careers@architectai.com">Send Us Your Resume</Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

