import { useState, useEffect } from "react";
import { format, isSameDay, addDays } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";
import { PeriodLog } from "@/integrations/firebase/types";
import { predictNextCycle, getCycleInsights } from "@/utils/cycle-predictions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { PeriodLogger } from "@/components/period-logger";
import { PeriodHistoryList } from "@/components/PeriodHistoryList";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  date: string;
  type: 'period' | 'fertile' | 'ovulation' | 'prediction';
}

export default function Calendar() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [predictions, setPredictions] = useState<CalendarEvent[]>([]);
  const [hasUserData, setHasUserData] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [openPeriodLogger, setOpenPeriodLogger] = useState(false);
  const [editingPeriodLog, setEditingPeriodLog] = useState<PeriodLog | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchPeriodLogs = async () => {
      const periodLogsQuery = query(
        collection(db, 'period_logs'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(periodLogsQuery, (snapshot) => {
        const logs: PeriodLog[] = [];
        snapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() } as PeriodLog);
        });

        setPeriodLogs(logs);
        
        if (logs.length > 0) {
          setHasUserData(true);
          
          // Convert period logs to calendar events based on durationDays
          const calendarEvents: CalendarEvent[] = [];
          logs.forEach(log => {
            if (log.startDate && log.durationDays) {
              const start = new Date(log.startDate);
              for (let i = 0; i < log.durationDays; i++) {
                calendarEvents.push({
                  date: format(addDays(start, i), 'yyyy-MM-dd'),
                  type: 'period'
                });
              }
            } else if (log.startDate) { // Fallback for logs without durationDays
              calendarEvents.push({
                date: log.startDate,
                type: 'period'
              });
            }
            // Removed log.endDate handling as durationDays now defines the period range
          });
          
          setEvents(calendarEvents);
          
          // Generate predictions and insights
          if (logs.length >= 2) {
            const prediction = predictNextCycle(logs);
            const predictionEvents: CalendarEvent[] = [
              {
                date: prediction.periodStart.toISOString(),
                type: 'prediction'
              },
              {
                date: prediction.ovulationDate.toISOString(),
                type: 'ovulation'
              }
            ];

            // Add fertile window days
            let currentDate = prediction.fertileStart;
            while (currentDate <= prediction.fertileEnd) {
              predictionEvents.push({
                date: currentDate.toISOString(),
                type: 'fertile'
              });
              currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
            }

            setPredictions(predictionEvents);
            setInsights(getCycleInsights(logs));
          }
        } else {
          setPeriodLogs([]);
          setEvents([]);
          setPredictions([]);
          setHasUserData(false);
          setInsights([]);
        }
      });

      return () => unsubscribe();
    };

    fetchPeriodLogs();
  }, [user, refreshKey]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const getSelectedDateInfo = () => {
    if (!selectedDate) return null;

    const event = [...events, ...predictions].find(e => 
      e.date && isSameDay(new Date(e.date), selectedDate)
    );

    if (!event) return "No events on this day";

    switch (event.type) {
      case 'period':
        return "Period Day";
      case 'fertile':
        return "Fertile Window";
      case 'ovulation':
        return "Ovulation Day";
      case 'prediction':
        return "Predicted Period Start";
      default:
        return "No Events";
    }
  };

  const handlePeriodLogged = () => {
    setRefreshKey(prev => prev + 1);
    setOpenPeriodLogger(false);
    setEditingPeriodLog(null); // Clear editing state
  };

  const handleEditPeriod = (log: PeriodLog) => {
    setEditingPeriodLog(log);
    setOpenPeriodLogger(true);
  };

  const handleDeletePeriod = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Period Calendar</CardTitle>
          <CardDescription>
            Track your periods and predict your cycle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                className="rounded-md border"
              />
              {selectedDate && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">{format(selectedDate, 'MMMM d, yyyy')}</h3>
                  <p>{getSelectedDateInfo()}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {insights.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Cycle Insights Title</h3>
                  {insights.map((insight, index) => (
                    <Alert key={index}>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Insight Alert Title</AlertTitle>
                      <AlertDescription>{insight}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
              {!hasUserData && (
                <Alert>
                  <AlertTitle>No data yet</AlertTitle>
                  <AlertDescription>
                    Log your periods to see your cycle insights.
                  </AlertDescription>
                </Alert>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Log New Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => {
                    setEditingPeriodLog(null); // Ensure no log is being edited for a new log
                    setOpenPeriodLogger(true);
                  }} className="w-full">Log New Period</Button>
                </CardContent>
              </Card>
              <PeriodHistoryList
                refreshKey={refreshKey}
                onEditPeriod={handleEditPeriod}
                onDeletePeriod={handleDeletePeriod}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <PeriodLogger
        open={openPeriodLogger}
        onOpenChange={setOpenPeriodLogger}
        onPeriodLogged={handlePeriodLogged}
        initialLogToEdit={editingPeriodLog}
      />
    </div>
  );
}
