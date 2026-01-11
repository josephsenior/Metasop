"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ArrowLeft, HelpCircle, MessageCircle, Mail, Book, Search } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const faqs = [
  {
    question: "How does ArchitectAI generate architecture diagrams?",
    answer: "ArchitectAI uses a sophisticated multi-agent system that includes a Product Manager, Architect, and Engineer. Each agent analyzes your description and contributes their expertise to create a comprehensive architecture diagram. The system understands modern patterns, component relationships, and best practices to generate production-ready diagrams.",
  },
  {
    question: "What information do I need to provide?",
    answer: "Just describe your app idea in plain English! For example: 'Create a todo app with user authentication and real-time sync.' Our AI extracts all the key requirements and generates a complete architecture including components, data flow, APIs, and state management.",
  },
  {
    question: "Can I export the diagrams?",
    answer: "Yes! You can export diagrams in multiple formats: JSON (for direct integration), PNG (high-resolution images), or SVG (vector graphics). Free users get watermarked PNG exports, while Pro users get unlimited high-res exports in all formats.",
  },
  {
    question: "How accurate are the generated diagrams?",
    answer: "Our AI is trained on thousands of applications and understands modern patterns, frameworks, state management, and architectural best practices. While the diagrams are comprehensive starting points, we recommend reviewing and customizing them for your specific needs.",
  },
  {
    question: "Can I share diagrams with my team?",
    answer: "Yes! Pro and Teams plans include shareable links that allow you to collaborate with your team. You can also export diagrams and share them via your preferred communication tools.",
  },
  {
    question: "What patterns and frameworks does ArchitectAI support?",
    answer: "ArchitectAI understands modern patterns across various frameworks and technologies. It supports component-based architectures, state management patterns, routing strategies, and architectural best practices for building scalable applications.",
  },
  {
    question: "Is there an API available?",
    answer: "Yes! Teams plan includes API access, allowing you to integrate ArchitectAI into your development workflow, CI/CD pipelines, or custom tools. Check our API Reference documentation for details.",
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of the current billing period, and you'll continue to have access to all Pro features until then.",
  },
]

const helpCategories = [
  {
    icon: Book,
    title: "Documentation",
    description: "Comprehensive guides and tutorials",
    href: "/documentation",
    color: "blue",
  },
  {
    icon: MessageCircle,
    title: "Community Support",
    description: "Get help from our community",
    href: "#",
    color: "cyan",
  },
  {
    icon: Mail,
    title: "Contact Support",
    description: "Reach out to our support team",
    href: "mailto:support@architectai.com",
    color: "blue",
  },
]

export default function HelpPage() {
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
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-400 mb-4">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Help Center
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Find answers to common questions and get the support you need.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for help..."
                  className="pl-10 h-12"
                />
              </div>
            </div>
          </div>

          {/* Help Categories */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {helpCategories.map((category, index) => (
              <Link
                key={index}
                href={category.href}
                className="group rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg mb-4 ${
                  category.color === "blue" 
                    ? "bg-blue-600/10 text-blue-700 dark:text-blue-400" 
                    : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
                }`}>
                  <category.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                  {category.title}
                </h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </Link>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <h2 className="text-2xl font-semibold text-foreground mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-border">
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Still Need Help */}
          <div className="mt-12 text-center">
            <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
              
              <h2 className="text-2xl font-semibold text-foreground mb-4">Still need help?</h2>
              <p className="text-muted-foreground mb-6">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  className="border-border hover:bg-accent hover:text-accent-foreground"
                  asChild
                >
                  <Link href="mailto:support@architectai.com">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </Link>
                </Button>
                <Button variant="gradient" asChild>
                  <Link href="/documentation">
                    <Book className="h-4 w-4 mr-2" />
                    View Documentation
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

