"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Lock, Eye, Server, CheckCircle2 } from "lucide-react"

const securityFeatures = [
  {
    icon: Lock,
    title: "Data Encryption",
    description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.",
  },
  {
    icon: Shield,
    title: "SOC 2 Compliant",
    description: "We maintain SOC 2 Type II compliance and undergo regular security audits.",
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Our infrastructure is hosted on secure cloud providers with regular security updates and monitoring.",
  },
  {
    icon: Eye,
    title: "Access Controls",
    description: "Role-based access controls ensure that only authorized users can access sensitive data.",
  },
  {
    icon: CheckCircle2,
    title: "Regular Audits",
    description: "We conduct regular security audits and penetration testing to identify and fix vulnerabilities.",
  },
  {
    icon: Lock,
    title: "GDPR Compliant",
    description: "We comply with GDPR and other data protection regulations to protect user privacy.",
  },
]

const securityPractices = [
  {
    title: "Data Protection",
    description: "We implement industry-standard security measures to protect your data. All user data is encrypted and stored securely. We never share your data with third parties without your explicit consent.",
  },
  {
    title: "Authentication & Authorization",
    description: "We use secure authentication methods including OAuth 2.0 and API keys. All API requests are authenticated and authorized. We support two-factor authentication for enhanced security.",
  },
  {
    title: "Infrastructure Security",
    description: "Our infrastructure is built on secure cloud platforms with redundant systems and automated backups. We monitor our systems 24/7 for security threats and respond immediately to any incidents.",
  },
  {
    title: "Compliance & Certifications",
    description: "We maintain SOC 2 Type II compliance and are GDPR compliant. We regularly undergo security audits and penetration testing to ensure our systems meet the highest security standards.",
  },
]

export default function SecurityPage() {
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-400 mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Security
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your security and privacy are our top priorities. Learn about how we protect your data and maintain the highest security standards.
            </p>
          </div>

          {/* Security Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-400 mb-4">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Security Practices */}
          <div className="space-y-6 mb-12">
            {securityPractices.map((practice, index) => (
              <div
                key={index}
                className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-lg"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
                
                <h2 className="text-2xl font-semibold text-foreground mb-4">{practice.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{practice.description}</p>
              </div>
            ))}
          </div>

          {/* Reporting Security Issues */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-400 shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">Report a Security Issue</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you discover a security vulnerability, please report it to us immediately. We take security 
                  issues seriously and will respond promptly. Please do not publicly disclose the vulnerability 
                  until we have had a chance to address it.
                </p>
                <Button variant="gradient" asChild>
                  <Link href="mailto:security@architectai.com">Report Security Issue</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              For more information about our security practices, please review our Privacy Policy and Terms of Service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link href="/privacy">Privacy Policy</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/terms">Terms of Service</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

