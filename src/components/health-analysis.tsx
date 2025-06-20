import { useState, useEffect } from 'react';
import { format, differenceInDays, isWithinInterval, subMonths } from 'date-fns';
import { PeriodLog, calculateCycleLength } from '@/utils/cycle-predictions';
import { GlassCard } from './ui/glass-card';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { 
  AlertCircle, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  BarChart 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InsightsSection } from './insights-section';
import { db, COLLECTIONS } from '@/integrations/firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

interface Insight {
  id: string;
  title: string;
  description: string;
  severity: 'normal' | 'info' | 'warning' | 'critical';
  actionable: boolean;
  recommendation: string;
  icon: React.ReactNode;
}

interface HealthAnalysisProps {
  periodLogs: PeriodLog[];
}

export function HealthAnalysis({ periodLogs }: HealthAnalysisProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  
  useEffect(() => {
    if (periodLogs.length === 0) {
      setIsLoading(false);
      return;
    }
    
    const analyzeHealthData = () => {
      const newInsights: Insight[] = [];
      
      // Filter to get only period starts for analysis
      const periodStarts = periodLogs
        .filter(log => log.type === 'period_start' && log.startDate)
        .map(log => new Date(log.startDate!))
        .sort((a, b) => b.getTime() - a.getTime());
      
      // Check if we have enough data for analysis
      if (periodStarts.length < 2) {
        newInsights.push({
          id: 'not-enough-data',
          title: 'Not Enough Data',
          description: 'Log at least two periods to get cycle insights.',
          severity: 'info',
          actionable: false,
          recommendation: 'Continue tracking your periods regularly.',
          icon: <Clock className="h-5 w-5 text-blue-500" />
        });
      } else {
        // Calculate cycle lengths
        const cycleLengths: number[] = [];
        for (let i = 1; i < periodStarts.length; i++) {
          const cycleDays = differenceInDays(periodStarts[i-1], periodStarts[i]);
          if (cycleDays > 0 && cycleDays < 60) { // Filter out likely errors
            cycleLengths.push(cycleDays);
          }
        }
        
        const avgCycleLength = calculateCycleLength(periodLogs);
        
        // Check for irregularity
        if (cycleLengths.length >= 2) {
          const maxDifference = Math.max(...cycleLengths) - Math.min(...cycleLengths);
          
          if (maxDifference > 7) {
            newInsights.push({
              id: 'irregular-cycles',
              title: 'Irregular Cycle Pattern Detected',
              description: `Your cycles varied by ${maxDifference} days in the last ${cycleLengths.length} cycles.`,
              severity: 'warning',
              actionable: true,
              recommendation: 'Consider consulting with a healthcare provider if this pattern continues.',
              icon: <AlertCircle className="h-5 w-5 text-amber-500" />
            });
          }
        }
        
        // Check for consistently short cycles
        if (avgCycleLength < 21 && cycleLengths.length >= 2) {
          newInsights.push({
            id: 'short-cycles',
            title: 'Short Cycle Pattern',
            description: `Your average cycle length is ${avgCycleLength} days, which is shorter than typical.`,
            severity: 'warning',
            actionable: true,
            recommendation: 'Short cycles can sometimes indicate hormonal imbalances. Consider discussing with a healthcare provider.',
            icon: <AlertCircle className="h-5 w-5 text-amber-500" />
          });
        }
        
        // Check for consistently long cycles
        if (avgCycleLength > 35 && cycleLengths.length >= 2) {
          newInsights.push({
            id: 'long-cycles',
            title: 'Long Cycle Pattern',
            description: `Your average cycle length is ${avgCycleLength} days, which is longer than typical.`,
            severity: 'warning',
            actionable: true,
            recommendation: 'Long cycles can sometimes indicate conditions like PCOS. Consider discussing with a healthcare provider.',
            icon: <AlertCircle className="h-5 w-5 text-amber-500" />
          });
        }
        
        // Check for recent missed period
        const mostRecentPeriod = periodStarts[0];
        const daysSinceLastPeriod = differenceInDays(new Date(), mostRecentPeriod);
        if (daysSinceLastPeriod > avgCycleLength + 7) {
          newInsights.push({
            id: 'missed-period',
            title: 'Possible Missed Period',
            description: `It's been ${daysSinceLastPeriod} days since your last period, which is longer than your average cycle length.`,
            severity: 'warning',
            actionable: true,
            recommendation: 'Consider taking a pregnancy test or consulting with a healthcare provider.',
            icon: <AlertCircle className="h-5 w-5 text-amber-500" />
          });
        }
        
        // If everything looks normal
        if (newInsights.length === 0) {
          newInsights.push({
            id: 'healthy-pattern',
            title: 'Healthy Cycle Pattern',
            description: `Your cycles appear regular with an average length of ${avgCycleLength} days.`,
            severity: 'normal',
            actionable: false,
            recommendation: 'Continue tracking your cycle for the most accurate predictions.',
            icon: <CheckCircle className="h-5 w-5 text-green-500" />
          });
        }
      }
      
      setInsights(newInsights);
    };
    analyzeHealthData();
  }, [periodLogs, isLoading]);
  
  const getSeverityColor = (severity: Insight['severity']) => {
    switch (severity) {
      case 'normal': return 'bg-green-100 border-green-200 text-green-800';
      case 'info': return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'warning': return 'bg-amber-100 border-amber-200 text-amber-800';
      case 'critical': return 'bg-red-100 border-red-200 text-red-800';
      default: return 'bg-gray-100 border-gray-200';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="section-title">Health Analysis</h2>
        
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading personalized health insights...
          </div>
        ) : (
          <>
            {insights.map(insight => (
              <GlassCard 
                key={insight.id} 
                className={`p-4 border-l-4 ${getSeverityColor(insight.severity)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{insight.title}</h3>
                    <p className="mt-1 text-muted-foreground">{insight.description}</p>
                    
                    {insight.actionable && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-primary" />
                          <p className="font-medium">Recommendation:</p>
                        </div>
                        <p className="mt-1 text-muted-foreground">{insight.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
            
            {insights.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No insights available</AlertTitle>
                <AlertDescription>
                  Start tracking your period to get personalized health insights.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
      
      <div className="mt-6 flex justify-between">
        <Button variant="outline" className="text-sm">
          <Calendar className="mr-2 h-4 w-4" />
          Export Health Report
        </Button>
        <Button variant="outline" className="text-sm">
          <BarChart className="mr-2 h-4 w-4" />
          Request Professional Analysis
        </Button>
      </div>
    </div>
  );
}
