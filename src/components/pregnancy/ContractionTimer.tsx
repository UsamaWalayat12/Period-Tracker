import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, differenceInSeconds, parseISO, isWithinInterval, subHours } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { addContractionLog, getContractionLogs } from '@/integrations/firebase/utils';
import { ContractionLog } from '@/integrations/firebase/types';
import { Timer, Play, Pause, StopCircle, List } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Timestamp } from 'firebase/firestore';

// Helper to format seconds into mm:ss
const formatDuration = (secs: number): string => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    // Pad with leading zero if necessary
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
};

// Helper to convert Timestamp to Date (can be moved to utils)
const timestampToDate = (timestamp: Timestamp): Date => {
    return timestamp.toDate();
};

export function ContractionTimer() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [contractions, setContractions] = useState<ContractionLog[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch existing contraction logs on component mount
  useEffect(() => {
    const fetchContractions = async () => {
      if (user) {
        try {
          const fetchedLogs = await getContractionLogs(user.uid);
          // Ensure timestamps are treated as Dates for local state sorting/display
          setContractions(fetchedLogs);
        } catch (error) {
          console.error('Error fetching contraction logs:', error);
        }
      }
    };
    fetchContractions();
  }, [user]); // Re-run when user changes

  // Update current time every second when running
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);
    setCurrentTime(now); // Reset current time display
  };

  const handleStop = async () => {
    if (!startTime) return; // Should not happen if button is enabled correctly

    setIsRunning(false);
    const now = new Date();
    const durationSeconds = differenceInSeconds(now, startTime);

    const newContraction: Omit<ContractionLog, 'id' | 'userId' | 'timestamp'> = {
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      duration: durationSeconds,
    };

    // Save to Firebase
    if (user) {
        try {
            const addedLog = await addContractionLog(user.uid, newContraction);
            // Add to local state after successful save. The addedLog from Firebase will have the Timestamp
            setContractions(prevLogs => [
                addedLog,
                ...prevLogs
            ].sort((a, b) => timestampToDate(b.timestamp).getTime() - timestampToDate(a.timestamp).getTime())); // Sort descending by timestamp
            console.log('Contraction logged to Firebase', addedLog);
        } catch (error) {
            console.error('Error logging contraction to Firebase:', error);
            // Optionally handle error in UI
        }
    }

    setStartTime(null); // Reset for next contraction
  };

  // Calculate duration of the current contraction if running
  const currentDuration = useMemo(() => {
    if (!isRunning || !startTime) return 0;
    return differenceInSeconds(currentTime, startTime);
  }, [isRunning, startTime, currentTime]);

  // Calculate frequency (time between the start of the last two contractions)
  const calculateFrequency = (logs: ContractionLog[]) => {
    if (logs.length < 2) return 'N/A';
    // Sort by timestamp ascending temporarily for frequency calculation
    const sortedLogs = [...logs].sort((a, b) => timestampToDate(a.timestamp).getTime() - timestampToDate(b.timestamp).getTime());
    const lastContraction = sortedLogs[sortedLogs.length - 1];
    const secondLastContraction = sortedLogs[sortedLogs.length - 2];

    if (!lastContraction || !secondLastContraction) return 'N/A';

    const frequencySeconds = differenceInSeconds(timestampToDate(lastContraction.timestamp), timestampToDate(secondLastContraction.timestamp));
    const minutes = Math.floor(frequencySeconds / 60);
    const seconds = frequencySeconds % 60;
    return `${minutes}m ${seconds}s ago`; // Time since last contraction start
  };
  
  // Calculate average duration and frequency from logged contractions
  const summary = useMemo(() => {
    if (contractions.length === 0) return null;
    
    const totalDuration = contractions.reduce((sum, log) => sum + log.duration, 0);
    const averageDuration = totalDuration / contractions.length;

    let totalFrequency = 0;
    let frequencyCount = 0;
    // Sort by timestamp ascending temporarily for frequency calculation
    const sortedLogs = [...contractions].sort((a, b) => timestampToDate(a.timestamp).getTime() - timestampToDate(b.timestamp).getTime());

    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const freq = differenceInSeconds(timestampToDate(sortedLogs[i + 1].timestamp), timestampToDate(sortedLogs[i].timestamp));
      totalFrequency += freq;
      frequencyCount++;
    }

    const averageFrequency = frequencyCount > 0 ? totalFrequency / frequencyCount : null;

    return {
      total: contractions.length,
      averageDuration: formatDuration(Math.round(averageDuration)),
      averageFrequency: averageFrequency !== null ? `${formatDuration(Math.round(averageFrequency))} apart` : 'N/A',
    };

  }, [contractions]);

  return (
    <Card className="p-6">
      <CardHeader className="!p-0 mb-4">
        <CardTitle className="text-xl font-semibold flex items-center"><Timer className="mr-2" /> Contraction Timer</CardTitle>
      </CardHeader>
      <CardContent className="!p-0 space-y-4">
        <div className="text-center">
          <div className="text-muted-foreground text-sm">Current Contraction Duration</div>
          <div className="text-4xl font-bold text-pink-600">
            {formatDuration(currentDuration)}
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          {!isRunning ? (
            <Button onClick={handleStart}><Play className="mr-2" /> Start Contraction</Button>
          ) : (
            <Button onClick={handleStop} variant="destructive"><StopCircle className="mr-2" /> Stop Contraction</Button>
          )}
          {/* Add a pause button if needed, but Start/Stop is common for contractions */}
        </div>
        
        {/* Summary */}
        {summary && (
            <div className="text-center mt-4 space-y-1">
                <div className="text-sm font-medium">Summary of Logged Contractions</div>
                <div className="text-sm text-muted-foreground">Total: {summary.total}</div>
                <div className="text-sm text-muted-foreground">Avg Duration: {summary.averageDuration}</div>
                <div className="text-sm text-muted-foreground">Avg Frequency: {summary.averageFrequency}</div>
            </div>
        )}

        {/* Logged Contractions List */}
        {contractions.length > 0 && (
          <div className="mt-6">
             <h3 className="text-lg font-medium flex items-center mb-2"><List className="mr-2" /> Contraction History</h3>
             {/* Use ScrollArea if list gets long */}
             <ScrollArea className="h-[150px] pr-4">
                <div className="space-y-3">
                  {/* Display contractions in descending order of timestamp */}
                  {[...contractions].sort((a, b) => timestampToDate(b.timestamp).getTime() - timestampToDate(a.timestamp).getTime()).map((con, index, arr) => (
                    <div key={con.id} className="text-sm bg-secondary p-3 rounded-md flex justify-between items-center">
                      <div>
                         <div className="font-medium">Duration: {formatDuration(con.duration)}</div>
                         <div className="text-muted-foreground">Start: {format(timestampToDate(con.timestamp), 'MMM d, yyyy p')}</div>
                      </div>
                      {index < arr.length - 1 && ( // Show frequency for all but the last item
                         <div className="text-right text-muted-foreground flex-shrink-0 ml-4">
                           <div className="font-medium">Frequency:</div>
                           {/* Calculate frequency using the current contraction and the *next* one in the original (descending) order list */}
                           <div>{calculateFrequency([arr[index + 1], con])}</div> 
                         </div>
                      )}
                    </div>
                  ))}
                </div>
             </ScrollArea>
          </div>
        )}

      </CardContent>
    </Card>
  );
} 