import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Baby, Ruler, Award, Calendar, Egg, BookOpen, Heart, BrainCircuit, Video, BookOpen as BookIcon, ArrowRight, FileText, CheckCircle, Info, Flame, Sparkles, Star, Thermometer, Clock, Timer, FlaskConical, BarChart, Pencil } from "lucide-react";
import { format, addWeeks, addDays, subWeeks, isWithinInterval, isSameDay, parseISO, isValid, startOfDay, endOfDay, isAfter, isBefore, subDays, differenceInDays } from "date-fns";
import { PeriodLog, CyclePrediction, predictNextCycle } from "@/utils/cycle-predictions";
import { CalendarHeatmap } from "@/components/ui/calendar-heatmap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EducationalContent } from "@/components/educational-content";
import { TrackSymptomDialog } from "@/components/track-symptom-dialog";
import { Progress } from "@/components/ui/progress";
import { PregnancyDataDialog } from "@/components/pregnancy-data-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { getPeriodLogs, getWeightLogs, getSymptomLogs, getAppointments } from '@/integrations/firebase/utils';
import { getCycleInsights } from '@/utils/cycle-predictions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WeightLoggerDialog } from "@/components/pregnancy/WeightLoggerDialog";
import { AppointmentDialog } from "@/components/pregnancy/AppointmentDialog";
import { WeightChart } from "@/components/pregnancy/WeightChart";
import { ContractionTimer } from "@/components/pregnancy/ContractionTimer";
import { KickCounter } from "@/components/pregnancy/KickCounter";
import { WeightLog, SymptomLog, Appointment } from '@/integrations/firebase/types';
import { useTranslation } from "react-i18next";
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Helper to format symptom string
const formatSymptomName = (symptomId: string) => {
  // Capitalize first letter and replace underscores with spaces
  return symptomId.charAt(0).toUpperCase() + symptomId.slice(1).replace(/_/g, ' ');
};

const Pregnancy = () => {
  const { pregnancyData, updatePregnancyData, user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showPregnancyDataDialog, setShowPregnancyDataDialog] = useState(false);
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [lastPeriodStart, setLastPeriodStart] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("timeline");
  const [selectedMode, setSelectedMode] = useState<"pregnancy" | "fertility">("pregnancy");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [cyclePhase, setCyclePhase] = useState<'follicular' | 'ovulation' | 'luteal' | 'menstrual'>('follicular');
  const [predictions, setPredictions] = useState<CyclePrediction | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showTrackSymptomDialog, setShowTrackSymptomDialog] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Removed the automatic display of pregnancy data dialog
    // This can be triggered based on user action or initial data availability
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        setHasEnoughData(false);
        setLastPeriodStart(null);
        setDueDate(null);
        setPredictions(null); // Clear predictions if user logs out
        setInsights([]); // Clear insights if user logs out
        setWeightLogs([]); // Clear weight logs if user logs out
        setSymptomLogs([]); // Clear symptom logs if user logs out
        setAppointments([]); // Clear appointments if user logs out
        return;
      }

      setIsLoading(true);

      // Fetch symptom logs regardless of pregnancy data source
      const fetchedSymptomLogs = await getSymptomLogs(user.uid);
      setSymptomLogs(fetchedSymptomLogs);

      // Fetch appointments regardless of pregnancy data source
      const fetchedAppointments = await getAppointments(user.uid);
      setAppointments(fetchedAppointments);

      // 1. Check for manually entered pregnancy data from AuthContext
      if (pregnancyData?.hasEnteredData && pregnancyData?.lastPeriod) {
        const lastLmp = parseISO(pregnancyData.lastPeriod);
        if (isValid(lastLmp)) {
          setLastPeriodStart(lastLmp);
          // Calculate EDD from stored LMP
          const calculatedDueDate = addDays(lastLmp, 280);
          setDueDate(calculatedDueDate);
          setHasEnoughData(true);
          
          // Fetch weight logs even if manual data is present
          const fetchedWeightLogs = await getWeightLogs(user.uid);
          setWeightLogs(fetchedWeightLogs);
          
          setIsLoading(false);
          // No need to fetch period logs if manual data is prioritized for EDD/Week
          return;
        }
      }

      // 2. If no manual data, try to calculate from period logs
      try {
        const logs = await getPeriodLogs(user.uid);
        
        // Fetch weight logs alongside period logs if not already fetched
        if (!pregnancyData?.hasEnteredData) {
          const fetchedWeightLogs = await getWeightLogs(user.uid);
          setWeightLogs(fetchedWeightLogs);
        }

        // Filter for period_start entries
        const periodStartLogs = logs
          .filter(log => log.type === 'period_start')
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); // Sort by date descending

        if (periodStartLogs.length >= 2) {
          setHasEnoughData(true);
          const lastLmp = parseISO(periodStartLogs[0].startDate); // Latest period start is the last menstrual period
          if (isValid(lastLmp)) {
            setLastPeriodStart(lastLmp);
            // Calculate EDD using Naegele's Rule: LMP + 280 days (40 weeks)
            const calculatedDueDate = addDays(lastLmp, 280);
            setDueDate(calculatedDueDate);
            // Note: You might want to store EDD and LMP in user_profiles/pregnancy_data
            // to avoid recalculating and fetching all logs every time.
          }

          // Use all logs for cycle predictions and insights if needed elsewhere
          if (logs.length >= 2) { // Check again with all logs for general cycle features
             const prediction = predictNextCycle(logs);
             setPredictions(prediction);
             setInsights(getCycleInsights(logs));
          }

        } else {
          setHasEnoughData(false);
          setLastPeriodStart(null);
          setDueDate(null);
          setPredictions(null); // Clear predictions if not enough logs
          setInsights([]); // Clear insights if not enough logs
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setHasEnoughData(false);
        setLastPeriodStart(null);
        setDueDate(null);
        setPredictions(null); // Clear predictions on error
        setInsights([]); // Clear insights on error
        setWeightLogs([]); // Clear weight logs on error
        setSymptomLogs([]); // Clear symptom logs on error
        setAppointments([]); // Clear appointments on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, pregnancyData]); // Re-run effect when user or pregnancyData changes

  // Filter symptom logs to the pregnancy period
  const pregnancySymptomLogs = useMemo(() => {
    if (!symptomLogs || !lastPeriodStart) return [];
    const lmp = startOfDay(lastPeriodStart);
    const today = endOfDay(new Date()); // Include symptoms logged today
    return symptomLogs.filter(log => {
      const logDate = parseISO(log.date);
      return isValid(logDate) && isAfter(logDate, subDays(lmp, 1)) && isBefore(logDate, addDays(today, 1)); // Filter from LMP onwards
    });
  }, [symptomLogs, lastPeriodStart]);

  // Summarize symptoms
  const symptomSummary = useMemo(() => {
    if (!pregnancySymptomLogs || pregnancySymptomLogs.length === 0) return null;
    
    const symptomCounts: { [key: string]: number } = {};
    pregnancySymptomLogs.forEach(log => {
      log.symptoms.forEach(symptom => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    });

    // Convert to array and sort by frequency (optional)
    const sortedSymptoms = Object.entries(symptomCounts)
      .sort(([, countA], [, countB]) => countB - countA);
      
    return sortedSymptoms;

  }, [pregnancySymptomLogs]);

  const calculateWeek = () => {
    if (!lastPeriodStart || !dueDate) return 0; // Not pregnant or not enough data
    const today = startOfDay(new Date());
    const lmp = startOfDay(lastPeriodStart);
    
    // Calculate weeks from LMP to today
    const diffTime = Math.abs(today.getTime() - lmp.getTime());
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    // Pregnancy is 40 weeks from LMP. Cap at 40.
    return Math.min(diffWeeks, 40);
  };
  
  const currentWeek = calculateWeek();
  
  const pregnancyProgress = hasEnoughData ? Math.min(Math.round((currentWeek / 40) * 100), 100) : 0;
  
  const weeklyMilestones = [
    { week: 8, title: t('pregnancy.milestones.week8.title'), description: t('pregnancy.milestones.week8.description') },
    { week: 12, title: t('pregnancy.milestones.week12.title'), description: t('pregnancy.milestones.week12.description') },
    { week: 20, title: t('pregnancy.milestones.week20.title'), description: t('pregnancy.milestones.week20.description') },
    { week: 24, title: t('pregnancy.milestones.week24.title'), description: t('pregnancy.milestones.week24.description') },
    { week: 28, title: t('pregnancy.milestones.week28.title'), description: t('pregnancy.milestones.week28.description') },
    { week: 37, title: t('pregnancy.milestones.week37.title'), description: t('pregnancy.milestones.week37.description') },
  ];

  const fetalDevelopmentByWeek = [
    { week: 4, title: t('pregnancy.fetalDevelopment.week4.title'), description: t('pregnancy.fetalDevelopment.week4.description'), image: "embryo-week-4.jpg", 
      facts: [t('pregnancy.fetalDevelopment.week4.fact1'), t('pregnancy.fetalDevelopment.week4.fact2'), t('pregnancy.fetalDevelopment.week4.fact3')] },
    { week: 8, title: t('pregnancy.fetalDevelopment.week8.title'), description: t('pregnancy.fetalDevelopment.week8.description'), image: "embryo-week-8.jpg",
      facts: [t('pregnancy.fetalDevelopment.week8.fact1'), t('pregnancy.fetalDevelopment.week8.fact2'), t('pregnancy.fetalDevelopment.week8.fact3')] },
    { week: 12, title: t('pregnancy.fetalDevelopment.week12.title'), description: t('pregnancy.fetalDevelopment.week12.description'), image: "fetus-week-12.jpg",
      facts: [t('pregnancy.fetalDevelopment.week12.fact1'), t('pregnancy.fetalDevelopment.week12.fact2'), t('pregnancy.fetalDevelopment.week12.fact3')] },
    { week: 16, title: t('pregnancy.fetalDevelopment.week16.title'), description: t('pregnancy.fetalDevelopment.week16.description'), image: "fetus-week-16.jpg",
      facts: [t('pregnancy.fetalDevelopment.week16.fact1'), t('pregnancy.fetalDevelopment.week16.fact2'), t('pregnancy.fetalDevelopment.week16.fact3')] },
    { week: 20, title: t('pregnancy.fetalDevelopment.week20.title'), description: t('pregnancy.fetalDevelopment.week20.description'), image: "fetus-week-20.jpg",
      facts: [t('pregnancy.fetalDevelopment.week20.fact1'), t('pregnancy.fetalDevelopment.week20.fact2'), t('pregnancy.fetalDevelopment.week20.fact3')] },
    { week: 24, title: t('pregnancy.fetalDevelopment.week24.title'), description: t('pregnancy.fetalDevelopment.week24.description'), image: "fetus-week-24.jpg",
      facts: [t('pregnancy.fetalDevelopment.week24.fact1'), t('pregnancy.fetalDevelopment.week24.fact2'), t('pregnancy.fetalDevelopment.week24.fact3')] },
    { week: 28, title: t('pregnancy.fetalDevelopment.week28.title'), description: t('pregnancy.fetalDevelopment.week28.description'), image: "fetus-week-28.jpg",
      facts: [t('pregnancy.fetalDevelopment.week28.fact1'), t('pregnancy.fetalDevelopment.week28.fact2'), t('pregnancy.fetalDevelopment.week28.fact3')] },
    { week: 32, title: t('pregnancy.fetalDevelopment.week32.title'), description: t('pregnancy.fetalDevelopment.week32.description'), image: "fetus-week-32.jpg",
      facts: [t('pregnancy.fetalDevelopment.week32.fact1'), t('pregnancy.fetalDevelopment.week32.fact2'), t('pregnancy.fetalDevelopment.week32.fact3')] },
    { week: 36, title: t('pregnancy.fetalDevelopment.week36.title'), description: t('pregnancy.fetalDevelopment.week36.description'), image: "fetus-week-36.jpg",
      facts: [t('pregnancy.fetalDevelopment.week36.fact1'), t('pregnancy.fetalDevelopment.week36.fact2'), t('pregnancy.fetalDevelopment.week36.fact3')] },
    { week: 40, title: t('pregnancy.fetalDevelopment.week40.title'), description: t('pregnancy.fetalDevelopment.week40.description'), image: "fetus-week-40.jpg",
      facts: [t('pregnancy.fetalDevelopment.week40.fact1'), t('pregnancy.fetalDevelopment.week40.fact2'), t('pregnancy.fetalDevelopment.week40.fact3')] }
  ];

  const trimesterContent = [
    {
      trimester: 1,
      title: t('pregnancy.trimesterGuide.firstTrimesterTitle'),
      description: t('pregnancy.trimesterGuide.firstTrimesterDescription'),
      keyPoints: [
        { title: t('pregnancy.trimesterGuide.nutritionTitle'), icon: Heart, content: t('pregnancy.trimesterGuide.nutritionContent') },
        { title: t('pregnancy.trimesterGuide.developmentTitle'), icon: BrainCircuit, content: t('pregnancy.trimesterGuide.developmentContent') },
        { title: t('pregnancy.trimesterGuide.careTipsTitle'), icon: BookIcon, content: t('pregnancy.trimesterGuide.careTipsContent') }
      ]
    },
    {
      trimester: 2,
      title: t('pregnancy.trimesterGuide.secondTrimesterTitle'),
      description: t('pregnancy.trimesterGuide.secondTrimesterDescription'),
      keyPoints: [
        { title: t('pregnancy.trimesterGuide.nutritionTitle'), icon: Heart, content: t('pregnancy.trimesterGuide.nutritionContent2') },
        { title: t('pregnancy.trimesterGuide.developmentTitle'), icon: BrainCircuit, content: t('pregnancy.trimesterGuide.developmentContent2') },
        { title: t('pregnancy.trimesterGuide.careTipsTitle'), icon: BookIcon, content: t('pregnancy.trimesterGuide.careTipsContent2') }
      ]
    },
    {
      trimester: 3,
      title: t('pregnancy.trimesterGuide.thirdTrimesterTitle'),
      description: t('pregnancy.trimesterGuide.thirdTrimesterDescription'),
      keyPoints: [
        { title: t('pregnancy.trimesterGuide.nutritionTitle'), icon: Heart, content: t('pregnancy.trimesterGuide.nutritionContent3') },
        { title: t('pregnancy.trimesterGuide.developmentTitle'), icon: BrainCircuit, content: t('pregnancy.trimesterGuide.developmentContent3') },
        { title: t('pregnancy.trimesterGuide.careTipsTitle'), icon: BookIcon, content: t('pregnancy.trimesterGuide.careTipsContent3') }
      ]
    }
  ];

  const generateCalendarEvents = () => {
    if (!predictions) return [];
    const events = [];

    // Predicted Period Start
    events.push({
      date: predictions.periodStart.toISOString().split('T')[0],
      type: 'prediction',
      description: t('pregnancy.calendar.predictedPeriodStart')
    });

    // Ovulation Day
    events.push({
      date: predictions.ovulationDate.toISOString().split('T')[0],
      type: 'ovulation',
      description: t('pregnancy.calendar.ovulationDay')
    });

    // Fertile Window
    let currentDate = predictions.fertileStart;
    while (currentDate <= predictions.fertileEnd) {
      events.push({
        date: currentDate.toISOString().split('T')[0],
        type: 'fertile',
        description: t('pregnancy.calendar.fertileWindow')
      });
      currentDate = addDays(currentDate, 1);
    }

    return events;
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const getCurrentTrimester = () => {
    if (!dueDate) return null;
    const today = new Date();
    const weeksPregnant = currentWeek;

    if (weeksPregnant >= 0 && weeksPregnant <= 13) return t('pregnancy.trimesters.first');
    if (weeksPregnant >= 14 && weeksPregnant <= 27) return t('pregnancy.trimesters.second');
    if (weeksPregnant >= 28) return t('pregnancy.trimesters.third');
    return null;
  };

  const getCurrentTrimesterContent = () => {
    const trimester = getCurrentTrimester();
    switch (trimester) {
      case t('pregnancy.trimesters.first'):
        return t('pregnancy.trimesterContent.first');
      case t('pregnancy.trimesters.second'):
        return t('pregnancy.trimesterContent.second');
      case t('pregnancy.trimesters.third'):
        return t('pregnancy.trimesterContent.third');
      default:
        return t('pregnancy.trimesterContent.unknown');
    }
  };

  const getCurrentWeekDevelopment = () => {
    const development = fetalDevelopmentByWeek.find(d => d.week === currentWeek);
    return development ? development.description : t('pregnancy.weekDevelopment.unknown');
  };

  return (
    <div className="page-container pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="section-title text-3xl font-bold">{t('pregnancy.title')}</h1>
        <Button onClick={() => setShowPregnancyDataDialog(true)} size="sm" variant="outline">
          <Pencil className="h-4 w-4 mr-2" />
          {t('pregnancy.editDataButton')}
        </Button>
      </div>

      {!hasEnoughData && !isLoading && selectedMode === "pregnancy" && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>{t('pregnancy.noDataAlertTitle')}</AlertTitle>
          <AlertDescription>
            {t('pregnancy.noDataAlertDescription')}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">{t('pregnancy.timelineTab')}</TabsTrigger>
          <TabsTrigger value="tools">{t('pregnancy.toolsTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="space-y-6 mt-6">
          {selectedMode === "pregnancy" ? (
            <>
              {dueDate && lastPeriodStart ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('pregnancy.overviewCard.title')}</CardTitle>
                    <CardDescription>{t('pregnancy.overviewCard.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <span>{t('pregnancy.overviewCard.currentWeek', { week: currentWeek })}</span>
                      </div>
                      <Progress value={(currentWeek / 40) * 100} className="w-1/2" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        <span>{t('pregnancy.overviewCard.dueDate', { date: format(dueDate, t('homepage.dateFormat')) })}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span>{t('pregnancy.overviewCard.lmp', { date: format(lastPeriodStart, t('homepage.dateFormat')) })}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowPregnancyDataDialog(true)} size="sm">
                      {t('pregnancy.overviewCard.editData')}
                    </Button>
                  </CardFooter>
                </Card>
              ) : null}

              {currentWeek > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('pregnancy.weekByWeekCard.title', { week: currentWeek })}</CardTitle>
                    <CardDescription>{getCurrentWeekDevelopment()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <GlassCard>
                        <h3 className="font-semibold text-lg mb-2">{t('pregnancy.weekByWeekCard.babyDevelopment')}</h3>
                        <p>{t('pregnancy.weekByWeekCard.babyDevelopmentContent', { week: currentWeek })}</p>
                      </GlassCard>
                      <GlassCard>
                        <h3 className="font-semibold text-lg mb-2">{t('pregnancy.weekByWeekCard.momChanges')}</h3>
                        <p>{t('pregnancy.weekByWeekCard.momChangesContent', { week: currentWeek })}</p>
                      </GlassCard>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('pregnancy.trimesterGuideCard.title')}</CardTitle>
                  <CardDescription>{getCurrentTrimesterContent()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="font-semibold text-lg">{t('pregnancy.trimesterGuideCard.articles')}</h3>
                  <div className="grid gap-4">
                    <a href="https://my.clevelandclinic.org/health/articles/9699-first-trimester" className="flex items-center justify-between hover:text-primary transition-colors">
                      <span className="flex items-center gap-2"><BookIcon className="h-4 w-4" /> {t('pregnancy.trimesterGuideCard.firstTrimesterArticle')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <a href="https://naitre.com/blogs/pregnancy-articles/your-second-trimester-embracing-the-journey" className="flex items-center justify-between hover:text-primary transition-colors">
                      <span className="flex items-center gap-2"><BookIcon className="h-4 w-4" /> {t('pregnancy.trimesterGuideCard.secondTrimesterArticle')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <a href="https://my.clevelandclinic.org/health/articles/third-trimester" className="flex items-center justify-between hover:text-primary transition-colors">
                      <span className="flex items-center gap-2"><BookIcon className="h-4 w-4" /> {t('pregnancy.trimesterGuideCard.thirdTrimesterArticle')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {pregnancySymptomLogs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Symptom Summary</CardTitle>
                    <CardDescription>A summary of your logged symptoms during pregnancy.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {symptomSummary && symptomSummary.length > 0 ? (
                      symptomSummary.map(([symptom, count]) => (
                        <div key={symptom} className="flex items-center justify-between text-sm">
                          <span>{formatSymptomName(symptom)}</span>
                          <span className="font-medium">{count} times</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No symptoms recorded yet for your pregnancy period.</p>
                    )}
                    <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigate('/symptoms')}>
                      View Full History
                    </Button>
                  </CardContent>
                </Card>
              )}

              {appointments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('pregnancy.upcomingAppointmentsCard.title')}</CardTitle>
                    <CardDescription>{t('pregnancy.upcomingAppointmentsCard.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {appointments
                      .filter(app => isAfter(parseISO(app.date.toDate().toISOString()), subDays(new Date(), 1)))
                      .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime())
                      .slice(0, 3)
                      .map((app) => (
                        <div key={app.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(app.date.toDate(), t('homepage.dateFormat'))} - {app.type}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setShowAppointmentDialog(true)}>{t('common.view')}</Button>
                        </div>
                      ))}
                    <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setShowAppointmentDialog(true)}>
                      {t('pregnancy.upcomingAppointmentsCard.viewAllAppointments')}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            // Fertility Mode
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('pregnancy.fertilityModeCard.title')}</CardTitle>
                <CardDescription>{t('pregnancy.fertilityModeCard.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {predictions ? (
                  <div className="space-y-2">
                    <p>{t('pregnancy.fertilityModeCard.nextPeriod', { date: format(predictions.periodStart, t('homepage.dateFormat')) })}</p>
                    <p>{t('pregnancy.fertilityModeCard.ovulation', { date: format(predictions.ovulationDate, t('homepage.dateFormat')) })}</p>
                    <p>{t('pregnancy.fertilityModeCard.fertileWindow', { start: format(predictions.fertileStart, t('homepage.dateFormat')), end: format(predictions.fertileEnd, t('homepage.dateFormat')) })}</p>
                  </div>
                ) : (
                  <Alert>
                    <AlertTitle>{t('pregnancy.fertilityModeCard.noPredictionDataTitle')}</AlertTitle>
                    <AlertDescription>
                      {t('pregnancy.fertilityModeCard.noPredictionDataDescription')}
                    </AlertDescription>
                  </Alert>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => { /* Navigate to period logger */ }}>
                  {t('pregnancy.fertilityModeCard.logPeriod')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="tools" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('pregnancy.toolsCard.title')}</CardTitle>
              <CardDescription>{t('pregnancy.toolsCard.description')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard onClick={() => setShowWeightDialog(true)} className="flex flex-col items-center justify-center p-4">
                <Ruler className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold text-lg">{t('pregnancy.toolsCard.weightTracker')}</h3>
                <p className="text-sm text-muted-foreground text-center">{t('pregnancy.toolsCard.trackWeight')}</p>
              </GlassCard>
              <GlassCard onClick={() => setShowAppointmentDialog(true)} className="flex flex-col items-center justify-center p-4">
                <CalendarIcon className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold text-lg">{t('pregnancy.toolsCard.appointmentTracker')}</h3>
                <p className="text-sm text-muted-foreground text-center">{t('pregnancy.toolsCard.logAppointments')}</p>
              </GlassCard>
              <GlassCard onClick={() => setShowTrackSymptomDialog(true)} className="flex flex-col items-center justify-center p-4">
                <FlaskConical className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold text-lg">{t('pregnancy.symptomsInsightsCard.trackSymptoms')}</h3>
                <p className="text-sm text-muted-foreground text-center">{t('pregnancy.symptomsInsightsCard.description')}</p>
              </GlassCard>
              <GlassCard onClick={() => { /* Open contraction timer */ }} className="flex flex-col items-center justify-center p-4">
                <Timer className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold text-lg">{t('pregnancy.toolsCard.contractionTimer')}</h3>
                <p className="text-sm text-muted-foreground text-center">{t('pregnancy.toolsCard.timeContractions')}</p>
              </GlassCard>
              <GlassCard onClick={() => { /* Open kick counter */ }} className="flex flex-col items-center justify-center p-4">
                <Baby className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold text-lg">{t('pregnancy.toolsCard.kickCounter')}</h3>
                <p className="text-sm text-muted-foreground text-center">{t('pregnancy.toolsCard.countKicks')}</p>
              </GlassCard>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('pregnancy.educationCard.title')}</CardTitle>
              <CardDescription>{t('pregnancy.educationCard.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <EducationalContent cyclePhase="follicular" /> {/* Placeholder, adjust as needed */}
            </CardContent>
          </Card>
          {pregnancySymptomLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Symptom Summary</CardTitle>
                <CardDescription>A summary of your logged symptoms during pregnancy.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {symptomSummary && symptomSummary.length > 0 ? (
                  symptomSummary.map(([symptom, count]) => (
                    <div key={symptom} className="flex items-center justify-between text-sm">
                      <span>{formatSymptomName(symptom)}</span>
                      <span className="font-medium">{count} times</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No symptoms recorded yet for your pregnancy period.</p>
                )}
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigate('/symptoms')}>
                  View Full History
                </Button>
              </CardContent>
            </Card>
          )}
          {appointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('pregnancy.upcomingAppointmentsCard.title')}</CardTitle>
                <CardDescription>{t('pregnancy.upcomingAppointmentsCard.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointments
                  .filter(app => isAfter(parseISO(app.date.toDate().toISOString()), subDays(new Date(), 1)))
                  .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime())
                  .slice(0, 3)
                  .map((app) => (
                    <div key={app.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(app.date.toDate(), t('homepage.dateFormat'))} - {app.type}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setShowAppointmentDialog(true)}>{t('common.view')}</Button>
                    </div>
                  ))
                }
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setShowAppointmentDialog(true)}>
                  {t('pregnancy.upcomingAppointmentsCard.viewAllAppointments')}
                </Button>
              </CardContent>
            </Card>
          )}
          {weightLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('pregnancy.toolsCard.weightTracker')} History</CardTitle>
                <CardDescription>Visual representation of your weight over time.</CardDescription>
              </CardHeader>
              <CardContent>
                <WeightChart weightLogs={weightLogs} />
              </CardContent>
            </Card>
          )}
          <ContractionTimer />
          <KickCounter />
        </TabsContent>
      </Tabs>

      <PregnancyDataDialog
        open={showPregnancyDataDialog}
        onOpenChange={setShowPregnancyDataDialog}
      />

      <WeightLoggerDialog
        open={showWeightDialog}
        onOpenChange={setShowWeightDialog}
        onWeightLogged={() => {
          // Refresh weight data
          const fetchWeightLogs = async () => {
            const fetchedWeightLogs = await getWeightLogs(user.uid);
            setWeightLogs(fetchedWeightLogs);
          };
          fetchWeightLogs();
        }}
      />

      <AppointmentDialog
        open={showAppointmentDialog}
        onOpenChange={setShowAppointmentDialog}
      />

      <TrackSymptomDialog
        open={showTrackSymptomDialog}
        onOpenChange={setShowTrackSymptomDialog}
        onSuccess={() => { /* Refresh symptoms if needed */ }}
      />

    </div>
  );
};

export default Pregnancy;
