'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { FileText } from "lucide-react"
import {
    containerVariants as container
} from "../../shared-components"

interface UserStoriesSectionProps {
    userStories: any[]
    UserStoryCard: React.ComponentType<{ story: any, index: number }>
}

export function UserStoriesSection({
    userStories,
    UserStoryCard
}: UserStoriesSectionProps) {
    return (
        <TabsContent key="stories" value="stories" className="m-0 outline-none">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
            >
                {userStories.length === 0 ? (
                    <div className="col-span-full text-center py-12 border-2 border-dashed rounded-2xl border-muted">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-muted-foreground">No user stories defined yet.</p>
                    </div>
                ) : (
                    userStories.map((item: any, i: number) => (
                        <UserStoryCard key={i} story={item} index={i} />
                    ))
                )}
            </motion.div>
        </TabsContent>
    )
}
