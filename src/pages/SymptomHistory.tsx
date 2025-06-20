import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getSymptomLogs } from '@/integrations/firebase/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Thermometer,
  Heart,
  Brain,
  Droplet,
  Bed,
  Calendar
} from 'lucide-react';
import { SymptomLog } from '@/integrations/firebase/types';
import { useTranslation } from "react-i18next";

const SYMPTOM_ICONS = {
  cramps: Thermometer,
  headache: Brain,
  nausea: Droplet,
  fatigue: Bed,
  mood_swings: Heart
};

const MOOD_COLORS = {
  happy: '#4CAF50',
  calm: '#2196F3',
  irritable: '#FF9800',
  anxious: '#9C27B0',
  sad: '#607D8B'
};

export default function SymptomHistory() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const fetchSymptomLogs = async () => {
      if (!user) return;

      try {
        const startDate = subDays(new Date(), timeRange === 'week' ? 7 : 30);
        const logs = await getSymptomLogs(user.uid, startDate);
        setSymptomLogs(logs);
      } catch (error) {
        console.error('Error fetching symptom logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSymptomLogs();
  }, [user, timeRange]);

  const getSymptomFrequency = () => {
    const frequency: Record<string, number> = {};
    symptomLogs.forEach(log => {
      log.symptoms.forEach((symptom: string) => {
        frequency[symptom] = (frequency[symptom] || 0) + 1;
      });
    });
    return frequency;
  };

  const getMoodData = () => {
    return symptomLogs
      .filter(log => log.mood)
      .map(log => ({
        date: format(new Date(log.date), t('symptomHistory.dateFormat')),
        mood: log.mood,
        value: 1
      }));
  };

  const getSleepData = () => {
    return symptomLogs
      .filter(log => log.sleep_hours)
      .map(log => ({
        date: format(new Date(log.date), t('symptomHistory.dateFormat')),
        hours: log.sleep_hours,
        quality: log.sleep_quality
      }));
  };

  const symptomFrequency = getSymptomFrequency();
  const moodData = getMoodData();
  const sleepData = getSleepData();

  if (isLoading) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('symptomHistory.title')}</h1>
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as 'week' | 'month')}>
          <TabsList>
            <TabsTrigger value="week">{t('symptomHistory.week')}</TabsTrigger>
            <TabsTrigger value="month">{t('symptomHistory.month')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('symptomHistory.symptomFrequency')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(symptomFrequency).map(([symptom, count]) => {
                const Icon = SYMPTOM_ICONS[symptom as keyof typeof SYMPTOM_ICONS];
                return (
                  <div key={symptom} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-5 w-5" />}
                      <span className="capitalize">{t(`symptoms.${symptom}`)}</span>
                    </div>
                    <span className="font-medium">{t('symptomHistory.times', { count })}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('symptomHistory.moodTrends')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('symptomHistory.sleepPatterns')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#82ca9d"
                    dot={{ fill: '#82ca9d' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('symptomHistory.recentNotes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {symptomLogs
                .filter(log => log.notes)
                .slice(0, 5)
                .map((log, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(log.date), t('symptomHistory.dateFormat'))}</span>
                    </div>
                    <p className="text-sm">{log.notes}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 