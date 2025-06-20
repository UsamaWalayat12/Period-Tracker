import { useState, useEffect } from "react";
import { format } from "date-fns";
import { collection, query, where, orderBy, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { PeriodLog } from "@/integrations/firebase/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, SquarePen, Trash2 } from "lucide-react";

const getFlowIcon = (flow: PeriodLog['flow']) => {
  switch (flow) {
    case 'light': return <Droplet className="h-4 w-4 text-blue-400" />;
    case 'medium': return <Droplet className="h-4 w-4 text-purple-400" />;
    case 'heavy': return <Droplet className="h-4 w-4 text-red-400" />;
    default: return null;
  }
};

// Common symptoms for easy selection
const commonSymptoms = [
  { id: "cramps", label: "Cramps", emoji: "🤕" },
  { id: "headache", label: "Headache", emoji: "🤕" },
  { id: "bloating", label: "Bloating", emoji: "🎈" },
  { id: "fatigue", label: "Fatigue", emoji: "😴" },
  { id: "nausea", label: "Nausea", emoji: "🤢" },
  { id: "backPain", label: "Back Pain", emoji: "⚡" },
  { id: "breastTenderness", label: "Breast Tenderness", emoji: "💞" },
  { id: "acne", label: "Acne", emoji: "🙁" },
  { id: "spotting", label: "Spotting", emoji: "🩸" },
  { id: "cravings", label: "Cravings", emoji: "🍫" },
  { id: "moodSwings", label: "Mood Swings", emoji: "🔄" },
  { id: "insomnia", label: "Insomnia", emoji: "🌙" },
];
const getSymptomEmoji = (symptomId: string) => {
  const symptom = commonSymptoms.find(s => s.id === symptomId);
  return symptom ? symptom.emoji : "";
};

interface PeriodHistoryListProps {
  refreshKey?: number;
  onEditPeriod: (log: PeriodLog) => void;
  onDeletePeriod: () => void;
  periodLogs?: PeriodLog[];
  title?: string;
}

export function PeriodHistoryList({ refreshKey, onEditPeriod, onDeletePeriod, periodLogs: propPeriodLogs, title }: PeriodHistoryListProps) {
  const { user } = useAuth();
  const [internalPeriodLogs, setInternalPeriodLogs] = useState<PeriodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propPeriodLogs) {
      setInternalPeriodLogs(propPeriodLogs);
      setIsLoading(false);
      return;
    }

    const fetchPeriodLogs = async () => {
      if (!user?.uid) {
        setError("Login required to view period history.");
        setIsLoading(false);
        setInternalPeriodLogs([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const periodLogsRef = collection(db, 'period_logs');
        const q = query(
          periodLogsRef,
          where('userId', '==', user.uid),
          orderBy('date', 'desc') // Order by date descending
        );
        
        const querySnapshot = await getDocs(q);
        const logs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PeriodLog[];
        
        const typedLogs = logs.map(log => ({
          ...log,
          symptoms: Array.isArray(log.symptoms) ? log.symptoms : [],
          notes: log.notes || null,
        }));

        setInternalPeriodLogs(typedLogs);
      } catch (err) {
        console.error('Error fetching period logs:', err);
        setError("Failed to load period history. Please try again.");
        setInternalPeriodLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPeriodLogs();
  }, [user, refreshKey, propPeriodLogs]);

  const handleDelete = async (logId: string) => {
    if (!user?.uid) {
      toast.error("Login required to delete a period entry.");
      return;
    }

    if (!confirm("Are you sure you want to delete this period entry?")) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteDoc(doc(db, 'period_logs', logId));
      toast.success("Period entry deleted successfully!");
      onDeletePeriod();
    } catch (error) {
      console.error("Error deleting period entry:", error);
      toast.error("Failed to delete period entry. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const displayLogs = propPeriodLogs || internalPeriodLogs;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "Your Period History"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse h-20 bg-muted rounded-lg"></div>
          <div className="animate-pulse h-20 bg-muted rounded-lg"></div>
          <div className="animate-pulse h-20 bg-muted rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "Your Period History"}</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500">{error}</CardContent>
      </Card>
    );
  }

  if (displayLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "Your Period History"}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-center">
          No period entries yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Your Period History"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayLogs.map((log) => (
          <div key={log.id} className="border rounded-lg p-4 bg-background/50">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-lg">{format(new Date(log.date), 'MMM d, yyyy')}</h4>
              <span className="text-sm text-muted-foreground capitalize">{log.type.replace('_', ' ')}</span>
            </div>
            {log.flow && (
              <div className="flex items-center gap-2 text-sm mb-1">
                {getFlowIcon(log.flow)}
                <span className="capitalize">
                  {log.flow
                    .replace('PeriodHistory.Flow.', '')
                    .replace('periodHistory.flow.', '')
                    .charAt(0).toUpperCase() + 
                   log.flow.replace('PeriodHistory.Flow.', '').replace('periodHistory.flow.', '').slice(1)}
                </span>
              </div>
            )}
            {log.durationDays && (
              <div className="flex items-center gap-2 text-sm mb-1 text-muted-foreground">
                <span>Duration: {log.durationDays} days</span>
              </div>
            )}
            {log.symptoms && log.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {log.symptoms.map((symptom, index) => {
                  const commonSymptom = commonSymptoms.find(s => s.id === symptom);
                  return (
                    <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {getSymptomEmoji(symptom)} {commonSymptom?.label || (symptom.charAt(0).toUpperCase() + symptom.slice(1).replace(/_/g, ' '))}
                    </span>
                  );
                })}
              </div>
            )}
            {log.notes && (
              <p className="text-sm text-muted-foreground mt-2">{log.notes}</p>
            )}
            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditPeriod(log)}
                disabled={isLoading}
              >
                <SquarePen className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(log.id)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 