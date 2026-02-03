"use client"

import { useState } from "react"
import { Search, Palette, Tag, Brain } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import {
    promptTemplates,
    templateCategories,
    type PromptTemplate
} from "@/lib/data/prompt-templates"

interface TemplateSidebarProps {
    onSelectTemplate: (template: PromptTemplate) => void
}

export function TemplateSidebar({ onSelectTemplate }: TemplateSidebarProps) {
    const [activeCategory, setActiveCategory] = useState("All")
    const [searchQuery, setSearchQuery] = useState("")

    const filteredTemplates = promptTemplates.filter(template => {
        const matchesCategory = activeCategory === "All" || template.category === activeCategory
        const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <div className="h-full border-r border-border bg-card/98 backdrop-blur-xl flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-sm font-semibold">Templates</h3>
                        </div>
                        <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                            {promptTemplates.length} Available
                        </Badge>
                    </div>

                    <ScrollArea className="w-full whitespace-nowrap" type="hover">
                        <div className="flex gap-1.5 pb-2 no-scrollbar">
                            {templateCategories.map((category) => (
                                <Button
                                    key={category}
                                    variant={activeCategory === category ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setActiveCategory(category)}
                                    className={`h-7 px-3 text-[10px] rounded-full transition-all duration-300 ${activeCategory === category
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                        : "hover:bg-blue-50 hover:text-blue-600 border-border/50"
                                        }`}
                                >
                                    {category}
                                </Button>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" className="h-1.5" />
                    </ScrollArea>

                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-8 text-[11px] bg-background/50 border-border/50 focus-visible:ring-blue-500/30"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredTemplates.map((template) => (
                            <motion.button
                                key={template.id}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelectTemplate(template)}
                                className="group text-left p-3 rounded-xl border border-border/50 bg-card hover:border-blue-500/30 hover:bg-linear-to-br hover:from-blue-500/2 hover:to-purple-500/2 transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <h4 className="text-[11px] font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">
                                        {template.title}
                                    </h4>
                                    <div className="p-1 rounded-md bg-muted/50 group-hover:bg-blue-500/10 group-hover:text-blue-600 transition-colors shrink-0">
                                        <Tag className="h-3 w-3" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-2 group-hover:text-muted-foreground/80 transition-colors">
                                    {template.description}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {template.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground group-hover:bg-blue-500/5 group-hover:text-blue-600/70 transition-colors">
                                            {tag}
                                        </span>
                                    ))}
                                    {template.tags.length > 3 && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground/50">
                                            +{template.tags.length - 3}
                                        </span>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    <div className="p-3 rounded-xl border border-blue-500/20 bg-linear-to-br from-blue-500/5 to-purple-500/5">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Brain className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Pro Tip</h4>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Be specific about your <span className="text-foreground font-medium">tech stack</span> and <span className="text-foreground font-medium">features</span> for the best architectural results.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
