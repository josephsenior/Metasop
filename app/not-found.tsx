"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Home, ArrowLeft } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          {/* 404 Visual */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold gradient-primary-text mb-4">404</h1>
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-600/20 blur-3xl rounded-full" />
              <div className="relative h-32 w-32 mx-auto rounded-full bg-gradient-to-br from-blue-600/10 to-cyan-500/10 border-2 border-blue-600/20 flex items-center justify-center">
                <Home className="h-16 w-16 text-blue-700 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl mb-8">
            {/* Decorative gradient */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Page not found
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              The page you're looking for doesn't exist or has been moved. 
              Let's get you back on track.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="gradient" asChild>
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Go Home
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-border hover:bg-accent hover:text-accent-foreground"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>

          {/* Helpful links */}
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Or try one of these:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                Home
              </Link>
              <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                Login
              </Link>
              <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
                Sign Up
              </Link>
              <Link href="#features" className="text-blue-600 dark:text-blue-400 hover:underline">
                Features
              </Link>
              <Link href="#pricing" className="text-blue-600 dark:text-blue-400 hover:underline">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

