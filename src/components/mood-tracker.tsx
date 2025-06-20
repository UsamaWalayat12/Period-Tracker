import { useState, useEffect } from 'react';
import { format, subDays, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Smile, Frown, Meh } from 'lucide-react';
import { GlassCard } from './ui/glass-card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db, COLLECTIONS } from '@/integrations/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';

interface MoodOption {
  value: string;
  label: string;
  emoji: string;
  color: string;
}

const moods: MoodOption[] = [
  { value: 'great', label: 'Great', emoji: '😄', color: 'bg-mood-great' },
  { value: 'good', label: 'Good', emoji: '🙂', color: 'bg-mood-good' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: 'bg-mood-neutral' },
  { value: 'poor', label: 'Poor', emoji: '😔', color: 'bg-mood-poor' },
  { value: 'bad', label: 'Bad', emoji: '😞', color: 'bg-mood-bad' },
];

export function MoodTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentMoods, setRecentMoods] = useState<{date: string, mood: string | null}[]>([]);
  
  // Fetch today's mood if exists
  useEffect(() => {
    const fetchTodaysMood = async () => {
      if (!user) return;
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const symptomLogsRef = collection(db, COLLECTIONS.SYMPTOM_LOGS);
        const q = query(symptomLogsRef, where('user_id', '==', user.uid), where('date', '==', today));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const log = querySnapshot.docs[0].data();
          setSelectedMood(log.mood || null);
        }
      } catch (error) {
        console.error("Error fetching today's mood:", error);
      }
    };
    fetchTodaysMood();
  }, [user]);
  
  // Fetch recent moods for the history display
  useEffect(() => {
    const fetchRecentMoods = async () => {
      if (!user) return;
      try {
        const endDate = new Date();
        const startDate = subDays(endDate, 6);
        const symptomLogsRef = collection(db, COLLECTIONS.SYMPTOM_LOGS);
        const q = query(
          symptomLogsRef,
          where('user_id', '==', user.uid),
          where('date', '>=', format(startDate, 'yyyy-MM-dd')),
          where('date', '<=', format(endDate, 'yyyy-MM-dd'))
        );
        const querySnapshot = await getDocs(q);
        const logs = querySnapshot.docs.map(doc => doc.data());
        // Create an array with all 7 days
        const allDays = Array.from({ length: 7 }).map((_, i) => {
          const date = format(subDays(endDate, 6 - i), 'yyyy-MM-dd');
          return { date, mood: null };
        });
        // Fill in the moods we have data for
        logs.forEach(item => {
          const index = allDays.findIndex(day => day.date === item.date);
          if (index !== -1) {
            allDays[index].mood = item.mood;
          }
        });
        setRecentMoods(allDays);
      } catch (error) {
        console.error("Error fetching recent moods:", error);
      }
    };
    fetchRecentMoods();
  }, [user]);

  const saveMood = async (mood: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to track your mood",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const symptomLogsRef = collection(db, COLLECTIONS.SYMPTOM_LOGS);
      const q = query(symptomLogsRef, where('user_id', '==', user.uid), where('date', '==', today));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        // Update existing log
        const logId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, COLLECTIONS.SYMPTOM_LOGS, logId), { mood });
      } else {
        // Create new log
        await setDoc(doc(symptomLogsRef), {
          user_id: user.uid,
          date: today,
          mood
        });
      }
      setSelectedMood(mood);
      toast({
        title: "Mood logged",
        description: `You're feeling ${mood.toLowerCase()} today`
      });
    } catch (error) {
      console.error("Error saving mood:", error);
      toast({
        title: "Failed to save mood",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMoodSelect = (mood: string) => {
    saveMood(mood);
  };
  
  const getMoodEmoji = (mood: string | null) => {
    const foundMood = moods.find(m => m.value === mood);
    return foundMood ? foundMood.emoji : '❓';
  };
  
  const getMoodColor = (mood: string | null) => {
    const foundMood = moods.find(m => m.value === mood);
    return foundMood ? foundMood.color : 'bg-gray-300';
  };
  
  const goToDetailedTracking = () => {
    navigate('/symptoms');
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="section-title mb-0">How are you feeling today?</h2>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={goToDetailedTracking}
        >
          Track Details
        </Button>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {moods.map(mood => (
          <GlassCard
            key={mood.value}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-1 gap-1 cursor-pointer",
              "transition-all hover:scale-105",
              selectedMood === mood.value && "border-2",
              selectedMood === mood.value && mood.value === 'great' && "border-mood-great",
              selectedMood === mood.value && mood.value === 'good' && "border-mood-good", 
              selectedMood === mood.value && mood.value === 'okay' && "border-mood-neutral",
              selectedMood === mood.value && mood.value === 'poor' && "border-mood-poor",
              selectedMood === mood.value && mood.value === 'bad' && "border-mood-bad"
            )}
            onClick={() => handleMoodSelect(mood.value)}
          >
            <div className="text-3xl">{mood.emoji}</div>
            <div className="text-xs font-medium text-center">{mood.label}</div>
            <div className={cn(
              "h-1 w-8 rounded-full mt-1",
              mood.color
            )} />
          </GlassCard>
        ))}
      </div>
      
      {recentMoods.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Mood History</h3>
          <GlassCard className="p-4">
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {recentMoods.map((day, index) => {
                const date = new Date(day.date);
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-xs text-muted-foreground">
                      {format(date, 'EEE')}
                    </div>
                    <div className="text-xl my-1">
                      {day.mood ? getMoodEmoji(day.mood) : '–'}
                    </div>
                    <div className={cn(
                      "h-1 w-6 rounded-full",
                      day.mood ? getMoodColor(day.mood) : 'bg-gray-200'
                    )} />
                    {isToday(date) && (
                      <div className="w-1 h-1 bg-primary rounded-full mt-1"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
