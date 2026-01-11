const stats = [
  { 
    value: "50,000+", 
    label: "diagrams generated", 
    company: "Trusted by developers",
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  { 
    value: "10 seconds", 
    label: "average generation time", 
    company: "Lightning fast",
    gradient: "from-cyan-500/10 to-teal-500/10",
  },
  { 
    value: "95%", 
    label: "developer satisfaction", 
    company: "Love our tool",
    gradient: "from-purple-500/10 to-pink-500/10",
  },
  { 
    value: "10,000+", 
    label: "active users", 
    company: "Growing community",
    gradient: "from-emerald-500/10 to-green-500/10",
  },
]

export function Stats() {
  return (
    <section className="border-y border-border/50 bg-card/30 backdrop-blur-sm relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-purple-500/5 pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border/50">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="group relative p-6 md:p-8 hover:bg-card/60 transition-all duration-300"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              
              <div className="relative">
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  <span className="font-bold text-foreground gradient-primary-text group-hover:scale-105 inline-block transition-transform duration-300">
                  {stat.value}
                </span>{" "}
                  {stat.label}
                </p>
                <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {stat.company}
              </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
