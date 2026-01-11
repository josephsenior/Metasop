"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { diagramsApi } from "@/lib/api/diagrams"
import { FloatingCreateButton } from "@/components/layout/floating-create-button"
import { useToast } from "@/components/ui/use-toast"
import type { Diagram } from "@/types/diagram"
import { Plus, Search, FileText, Calendar, MoreVertical, Download, Share2, Trash2, Filter, SortAsc, SortDesc, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia } from "@/components/ui/empty"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function MyDiagramsPage() {
  const { toast } = useToast()
  const [diagrams, setDiagrams] = useState<Diagram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "name">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadDiagrams()
  }, [statusFilter])

  const loadDiagrams = async () => {
    try {
      setIsLoading(true)
      const result = await diagramsApi.getAll({
        status: statusFilter !== "all" ? statusFilter as Diagram["status"] : undefined,
      })
      setDiagrams(result.diagrams)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load diagrams",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this diagram? This action cannot be undone.")) {
      return
    }

    try {
      await diagramsApi.delete(id)
      toast({
        title: "Diagram deleted",
        description: "The diagram has been permanently deleted.",
      })
      loadDiagrams()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete diagram",
        variant: "destructive",
      })
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  const filteredAndSortedDiagrams = useMemo(() => {
    let filtered = diagrams.filter((diagram) => {
      const matchesSearch =
        diagram.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        diagram.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || diagram.status === statusFilter
      return matchesSearch && matchesStatus
    })

    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      } else {
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      }
    })

    return filtered
  }, [searchQuery, sortBy, sortOrder, statusFilter])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <DashboardHeader />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">My Diagrams</h1>
              <p className="text-muted-foreground">Manage and view all your architecture diagrams</p>
            </div>
            <Link href="/dashboard/create">
              <Button variant="gradient">
                <Plus className="h-4 w-4" />
                Create Diagram
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search diagrams..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "name")}>
                <SelectTrigger className="w-[180px]">
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="border-border hover:bg-accent hover:text-accent-foreground"
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
            {searchQuery && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {filteredAndSortedDiagrams.length} result{filteredAndSortedDiagrams.length !== 1 ? "s" : ""}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Diagrams Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAndSortedDiagrams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedDiagrams.map((diagram) => (
                <Card
                  key={diagram.id}
                  className="group border-border bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          <Link href={`/dashboard/diagrams/${diagram.id}`}>{diagram.title}</Link>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">{diagram.description}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/diagrams/${diagram.id}`} className="cursor-pointer">
                              <FileText className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.preventDefault()
                              handleDelete(diagram.id)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatTimeAgo(diagram.updated_at)}</span>
                      </div>
                      <StatusBadge status={diagram.status as "completed" | "processing" | "failed" | "pending"} />
                    </div>
                    <Link href={`/dashboard/diagrams/${diagram.id}`}>
                      <Button
                        variant="outline"
                        className="w-full mt-4 border-border hover:bg-accent hover:text-accent-foreground"
                      >
                        Open Diagram
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchQuery || statusFilter !== "all" ? (
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardContent>
                <Empty>
                  <EmptyMedia variant="icon">
                    <Search className="h-12 w-12 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No diagrams found</EmptyTitle>
                    <EmptyDescription>Try adjusting your search or filter criteria</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("")
                        setStatusFilter("all")
                      }}
                    >
                      Clear Filters
                    </Button>
                  </EmptyContent>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardContent>
                <Empty>
                  <EmptyMedia variant="icon">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No diagrams yet</EmptyTitle>
                    <EmptyDescription>Get started by creating your first architecture diagram</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button variant="gradient" asChild>
                      <Link href="/dashboard/create">
                        <Plus className="h-4 w-4" />
                        Create Your First Diagram
                      </Link>
                    </Button>
                  </EmptyContent>
                </Empty>
              </CardContent>
            </Card>
          )}
        </main>
        <FloatingCreateButton />
      </div>
    </AuthGuard>
  )
}

