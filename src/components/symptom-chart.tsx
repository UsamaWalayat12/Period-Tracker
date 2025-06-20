import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { db } from "@/integrations/firebase/config";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";
import { AlertCircle } from "lucide-react";

interface SymptomChartProps {
  days?: number;
}

interface SymptomLog {
  id: string;
  date: string;
  mood: string | null;
  sleep_hours: number | null;
  sleep_quality: string | null;
  symptoms: string[];
  notes: string | null;
}

interface ChartData {
  date: string;
  mood: number;
  sleepHours: number;
  symptomCount: number;
}

const moodMap: { [key: string]: number } = {
  'happy': 5,
  'calm': 4,
  'neutral': 3,
  'irritable': 2,
  'anxious': 1,
  'sad': 0
};

export function SymptomChart({ days = 7 }: { days?: number }) {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSymptomData = async () => {
      if (!user?.uid) {
        setError('Please log in to view symptom data');
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
          orderBy('date', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const logs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SymptomLog[];
        
        const data = logs.map(log => ({
          date: format(new Date(log.date), 'MMM d'),
          mood: moodMap[log.mood?.toLowerCase() || 'neutral'] || 3,
          sleepHours: log.sleep_hours || 0,
          symptomCount: Array.isArray(log.symptoms) ? log.symptoms.length : 0
        }));
        
        setChartData(data);
      } catch (error) {
        console.error('Error fetching symptom data:', error);
        setError('Failed to fetch symptom data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSymptomData();
  }, [user, days]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-[300px] bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (chartData.length === 0) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="text-muted-foreground">No symptom data available for the past {days} days</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="mood"
              stroke="#8884d8"
              name="Mood"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="sleepHours"
              stroke="#82ca9d"
              name="Sleep Hours"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="symptomCount"
              stroke="#ff7300"
              name="Symptom Count"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

// Custom tooltip component for better data display
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number | string | null;
    dataKey: string;
    name: string;
    stroke: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-background border border-border rounded-md shadow-md p-2 text-xs">
      <p className="font-medium">{label}</p>
      <div className="mt-1 space-y-1">
        {payload.map((entry) => {
          const value = entry.value;
          
          // Format value based on data type
          let displayValue = value;
          if (entry.dataKey === "mood" && value !== null && value !== undefined) {
            displayValue = getMoodLabel(value as number);
          } else if (value === 1 || value === 0) {
            // For binary symptom indicators
            displayValue = value === 1 ? "Yes" : "No";
          }
          
          return (
            <div key={`item-${entry.dataKey}`} className="flex items-center gap-2">
              <div 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: entry.stroke }}
              ></div>
              <span>{entry.name}: </span>
              <span className="font-medium">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to get mood label
const getMoodLabel = (value: number): string => {
  const moodLabels: { [key: number]: string } = {
    5: 'Happy',
    4: 'Calm',
    3: 'Neutral',
    2: 'Irritable',
    1: 'Anxious',
    0: 'Sad'
  };
  return moodLabels[value] || 'Unknown';
};
