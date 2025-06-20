import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { addKickLog, getKickLogs } from '@/integrations/firebase/utils';
import { KickLog } from '@/integrations/firebase/types';
import { Timer, Plus, List, Play, StopCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, differenceInSeconds } from 'date-fns';

export function KickCounter() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [kicks, setKicks] = useState<KickLog[]>([]);
  const [kickCount, setKickCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch existing kick logs on component mount
  useEffect(() => {
    const fetchKicks = async () => {
      if (user) {
        try {
          const fetchedLogs = await getKickLogs(user.uid);
          setKicks(fetchedLogs);
        } catch (error) {
          console.error('Error fetching kick logs:', error);
        }
      }
    };
    fetchKicks();
  }, [user]);

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
    setCurrentTime(now);
    setKickCount(0);
  };

  const handleStop = async () => {
    if (!startTime) return;

    setIsRunning(false);
    const now = new Date();

    // Save to Firebase
    if (user) {
      try {
        const addedLog = await addKickLog(user.uid, {
          kickCount: kickCount
        });
        setKicks(prevKicks => [addedLog, ...prevKicks]);
        console.log('Kick session logged to Firebase', addedLog);
      } catch (error) {
        console.error('Error logging kick session to Firebase:', error);
      }
    }

    setStartTime(null);
    setKickCount(0);
  };

  const handleKick = () => {
    setKickCount(prev => prev + 1);
  };

  // Calculate duration of the current session if running
  const currentDuration = useMemo(() => {
    if (!isRunning || !startTime) return 0;
    return differenceInSeconds(currentTime, startTime);
  }, [isRunning, startTime, currentTime]);

  return (
    <Card className="p-6">
      <CardHeader className="!p-0 mb-4">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Timer className="mr-2" /> Kick Counter
        </CardTitle>
      </CardHeader>
      <CardContent className="!p-0 space-y-4">
        <div className="text-center">
          <div className="text-muted-foreground text-sm">Current Session Duration</div>
          <div className="text-4xl font-bold text-pink-600">
            {formatDuration(currentDuration)}
          </div>
          <div className="text-2xl font-bold mt-2">
            Kicks: {kickCount}
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          {!isRunning ? (
            <Button onClick={handleStart}>
              <Play className="mr-2" /> Start Session
            </Button>
          ) : (
            <>
              <Button onClick={handleKick} variant="secondary">
                <Plus className="mr-2" /> Count Kick
              </Button>
              <Button onClick={handleStop} variant="destructive">
                <StopCircle className="mr-2" /> End Session
              </Button>
            </>
          )}
        </div>

        {/* Kick History */}
        {kicks.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium flex items-center mb-2">
              <List className="mr-2" /> Kick History
            </h3>
            <ScrollArea className="h-[150px] pr-4">
              <div className="space-y-3">
                {kicks.map((kick) => (
                  <div key={kick.id} className="text-sm bg-secondary p-3 rounded-md">
                    <div className="font-medium">
                      {kick.kickCount} kicks
                    </div>
                    <div className="text-muted-foreground">
                      {format(kick.timestamp.toDate(), 'MMM d, yyyy p')}
                    </div>
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

// Helper to format seconds into mm:ss
const formatDuration = (secs: number): string => {
  const minutes = Math.floor(secs / 60);
  const remainingSeconds = secs % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  return `${formattedMinutes}:${formattedSeconds}`;
}; 