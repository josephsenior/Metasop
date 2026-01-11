"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Clock, Activity } from "lucide-react"

const services = [
  { name: "API", status: "operational", uptime: "99.9%" },
  { name: "Diagram Generation", status: "operational", uptime: "99.8%" },
  { name: "Authentication", status: "operational", uptime: "100%" },
  { name: "Export Service", status: "operational", uptime: "99.9%" },
]

const incidents = [
  {
    date: "2024-01-15",
    title: "Scheduled Maintenance",
    status: "resolved",
    description: "Planned maintenance window completed successfully. All services restored.",
  },
]

export default function StatusPage() {
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 mb-4">
              <Activity className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Service Status
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              All systems operational. We're monitoring our services 24/7.
            </p>
          </div>

          {/* Overall Status */}
          <div className="relative rounded-2xl border border-green-500/20 bg-green-500/5 backdrop-blur-xl p-8 shadow-2xl mb-8">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-1">All Systems Operational</h2>
                <p className="text-muted-foreground">All services are running normally.</p>
              </div>
            </div>
          </div>

          {/* Services Status */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl mb-8">
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />

            <h2 className="text-2xl font-semibold text-foreground mb-6">Service Status</h2>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-semibold text-foreground">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">Uptime: {service.uptime}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                    Operational
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />

            <h2 className="text-2xl font-semibold text-foreground mb-6">Recent Incidents</h2>
            {incidents.length > 0 ? (
              <div className="space-y-4">
                {incidents.map((incident, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border bg-card/50"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{incident.title}</h3>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                            Resolved
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{incident.date}</p>
                        <p className="text-sm text-muted-foreground">{incident.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No recent incidents. All systems are running smoothly.</p>
              </div>
            )}
          </div>

          {/* Subscribe to Updates */}
          <div className="mt-12 text-center">
            <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
              <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />

              <h2 className="text-2xl font-semibold text-foreground mb-4">Stay Updated</h2>
              <p className="text-muted-foreground mb-6">
                Subscribe to status updates and get notified about incidents and maintenance.
              </p>
              <Button variant="gradient">
                Subscribe to Updates
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

