import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

const testimonials = [
  {
    quote:
      "Saved me 10 hours of planning time. The architecture diagram was exactly what I needed to visualize my app structure before coding. Game changer!",
    author: "Sarah Chen",
    role: "Senior Frontend Developer",
    avatar: "/professional-woman-headshot.png",
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    quote:
      "The AI-generated diagrams are incredibly detailed. It caught patterns I would have missed and suggested better component organization. Highly recommend!",
    author: "Marcus Johnson",
    role: "Full-Stack Developer",
    avatar: "/professional-man-headshot.png",
    gradient: "from-purple-500/10 to-pink-500/10",
  },
  {
    quote:
      "We use this for every new project now. The diagrams help our team align on architecture before we start coding. It's like having an architect on demand.",
    author: "Emily Rodriguez",
    role: "Engineering Lead",
    avatar: "/professional-latina-woman-headshot.png",
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-32 bg-secondary/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="mb-4">
            Testimonials
          </Badge>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground text-balance">
            Loved by teams worldwide
          </h2>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              
              <CardContent className="p-6 md:p-8">
                {/* Star rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                
                <blockquote className="text-foreground leading-relaxed mb-6 relative">
                  <span className="absolute -top-2 -left-2 text-4xl text-muted-foreground/20 leading-none">"</span>
                  <span className="relative">{testimonial.quote}"</span>
                </blockquote>
                
                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                  <Avatar className="h-12 w-12 ring-2 ring-border/50 group-hover:ring-primary/20 transition-all">
                  <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.author} />
                    <AvatarFallback className="bg-muted text-foreground">
                    {testimonial.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
