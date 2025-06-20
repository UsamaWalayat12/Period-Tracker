
import { GlassCard } from './ui/glass-card';
import { Heart, Book, BarChart3, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

function InsightCard({ title, description, icon, className }: InsightCardProps) {
  return (
    <GlassCard className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-full bg-primary/10">{icon}</div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button variant="link" className="self-end px-0 py-0 h-auto">Learn More</Button>
    </GlassCard>
  );
}

export function InsightsSection() {
  return (
    <div className="space-y-4">
      <h2 className="section-title">Health Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightCard
          title="Your Fertility Window"
          description="Your fertility window typically starts 5 days before ovulation and ends on the day of ovulation. During this time, your chances of conceiving are higher."
          icon={<Heart className="h-5 w-5 text-primary" />}
        />
        
        <InsightCard
          title="Understanding PMS"
          description="Premenstrual Syndrome (PMS) refers to physical and emotional symptoms that occur before your period. Symptoms can include mood swings, tender breasts, food cravings, and fatigue."
          icon={<Droplets className="h-5 w-5 text-primary" />}
        />
        
        <InsightCard
          title="Cycle Trends & Patterns"
          description="Your cycle data shows that your average cycle length is 28 days, with period duration of 5 days. Understanding your unique patterns helps predict future cycles."
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
        />
        
        <InsightCard
          title="Maintaining Cycle Health"
          description="Regular exercise, balanced nutrition, adequate sleep, and stress management can help regulate your cycle and reduce symptoms."
          icon={<Book className="h-5 w-5 text-primary" />}
        />
      </div>
    </div>
  );
}
