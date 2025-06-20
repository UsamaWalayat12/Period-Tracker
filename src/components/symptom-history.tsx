import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { db } from "@/integrations/firebase/config";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

interface SymptomLog {
  id: string;
  date: string;
  mood: string | null;
  sleep_hours: number | null;
  sleep_quality: string | null;
  symptoms: string[];
  notes: string | null;
}

const getMoodEmoji = (mood: string | null) => {
  switch (mood) {
    case "great": return "😄";
    case "good": return "🙂";
    case "okay": return "😐";
    case "poor": return "😔";
    case "bad": return "😞";
    default: return "❓";
  }
};

const getSleepQualityColor = (quality: string | null) => {
  switch (quality) {
    case "good": return "bg-mood-good";
    case "fair": return "bg-mood-neutral";
    case "poor": return "bg-mood-poor";
    default: return "bg-gray-300";
  }
};

export function SymptomHistory({ days = 7 }: { days?: number }) {
  const { user } = useAuth();
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSymptomLogs = async () => {
      if (!user?.uid) {
        setError('Please log in to view symptom history');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const endDate = new Date();
        const startDate = subDays(endDate, days);
        
        const symptomLogsRef = collection(db, 'symptom_logs');
        const q = query(
          symptomLogsRef,
          where('user_id', '==', user.uid),
          where('date', '>=', format(startDate, 'yyyy-MM-dd')),
          where('date', '<=', format(endDate, 'yyyy-MM-dd')),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const logs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SymptomLog[];
        
        const typedData = logs.map(log => ({
          ...log,
          symptoms: Array.isArray(log.symptoms) 
            ? log.symptoms.map(item => String(item)).filter(item => typeof item === 'string')
            : []
        }));
        
        setSymptomLogs(typedData);
      } catch (error) {
        console.error('Error fetching symptom logs:', error);
        setError('Failed to fetch symptom history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSymptomLogs();
  }, [user, days]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (symptomLogs.length === 0) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="text-muted-foreground">No symptom logs found for the past {days} days</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {symptomLogs.map((log) => (
        <GlassCard key={log.id} className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-medium">{format(new Date(log.date), 'MMM d, yyyy')}</h3>
            <div className="text-2xl">{getMoodEmoji(log.mood)}</div>
          </div>
          
          {(log.sleep_hours || log.sleep_quality) && (
            <div className="mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <span>Sleep:</span>
                {log.sleep_hours && <span>{log.sleep_hours} hrs</span>}
                {log.sleep_quality && (
                  <div className="flex items-center gap-1">
                    <div className={cn("h-2 w-2 rounded-full", getSleepQualityColor(log.sleep_quality))}></div>
                    <span className="capitalize">{log.sleep_quality}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {log.symptoms && log.symptoms.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {log.symptoms.map((symptom, index) => (
                  <span 
                    key={index} 
                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {log.notes && (
            <div className="text-sm mt-2 border-t border-border pt-2">
              <p className="text-muted-foreground">{log.notes}</p>
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );
}
