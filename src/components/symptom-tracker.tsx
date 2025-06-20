import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { addSymptomLog } from '@/integrations/firebase/utils';
import { toast } from 'sonner';
import { 
  Smile, 
  Bed, 
  Clock, 
  Save,
  Thermometer,
  Heart,
  Brain,
  AlertCircle
} from 'lucide-react';

const SYMPTOMS = [
  { id: 'cramps', name: 'Cramps', icon: Thermometer },
  { id: 'headache', name: 'Headache', icon: Brain },
  { id: 'nausea', name: 'Nausea', icon: AlertCircle },
  { id: 'fatigue', name: 'Fatigue', icon: Bed },
  { id: 'mood_swings', name: 'Mood Swings', icon: Heart }
];

const MOODS = [
  { value: 'happy', label: 'Happy' },
  { value: 'calm', label: 'Calm' },
  { value: 'irritable', label: 'Irritable' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'sad', label: 'Sad' }
];

const SLEEP_QUALITY = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
];

export function SymptomTracker() {
  const { user } = useAuth();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<string>('');
  const [sleepHours, setSleepHours] = useState<number>(0);
  const [sleepQuality, setSleepQuality] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSymptomToggle = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId)
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      toast.error('Please log in to track symptoms');
      return;
    }

    setIsSubmitting(true);
    try {
      await addSymptomLog(user.uid, {
        date: new Date().toISOString().split('T')[0],
        symptoms: selectedSymptoms,
        mood: mood || null,
        sleepHours: sleepHours || null,
        sleepQuality: sleepQuality || null,
        notes: notes || null,
        createdAt: new Date().toISOString()
      });
      
      toast.success('Symptoms logged successfully');
      setSelectedSymptoms([]);
      setMood('');
      setSleepHours(0);
      setSleepQuality('');
      setNotes('');
    } catch (error) {
      console.error('Error logging symptoms:', error);
      toast.error('Failed to log symptoms');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Symptom Tracker</CardTitle>
        <CardDescription>
          Log your symptoms, mood, and sleep for today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Symptoms</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {SYMPTOMS.map(symptom => {
              const Icon = symptom.icon;
              return (
                <Button
                  key={symptom.id}
                  variant={selectedSymptoms.includes(symptom.id) ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                  onClick={() => handleSymptomToggle(symptom.id)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{symptom.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Mood</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger>
                <SelectValue placeholder="Select your mood" />
              </SelectTrigger>
              <SelectContent>
                {MOODS.map(mood => (
                  <SelectItem key={mood.value} value={mood.value}>
                    {mood.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sleep Quality</Label>
            <Select value={sleepQuality} onValueChange={setSleepQuality}>
              <SelectTrigger>
                <SelectValue placeholder="Select sleep quality" />
              </SelectTrigger>
              <SelectContent>
                {SLEEP_QUALITY.map(quality => (
                  <SelectItem key={quality.value} value={quality.value}>
                    {quality.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Sleep Hours</Label>
          <Input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(Number(e.target.value))}
            placeholder="Enter hours of sleep"
          />
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Entry
        </Button>
      </CardContent>
    </Card>
  );
}
