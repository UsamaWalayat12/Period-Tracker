import * as React from "react";
import type { DetailedHTMLProps, HTMLAttributes, AnchorHTMLAttributes, SVGAttributes } from "react";
import { useState, useEffect, useMemo } from "react";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, BarChart, PieChart, Cell, ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Bar, Pie } from "recharts";
import { HealthAnalysis } from "@/components/health-analysis";
import { BarChart3, Calendar, Download, FileText, ArrowRight } from "lucide-react";
import { ShareWithDoctorDialog } from "@/components/share-with-doctor-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { PeriodLog, SymptomLog } from "@/integrations/firebase/types";
import { getPeriodLogs, getSymptomLogs } from "@/integrations/firebase/utils";
import { calculateCycleLength, predictNextCycle, getCycleInsights } from "@/utils/cycle-predictions";
import { format, differenceInDays, parseISO, isValid, startOfDay, endOfDay, addDays, addMinutes, addHours, isAfter, isBefore } from "date-fns";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import jsPDF from 'jspdf';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      p: DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      h1: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h4: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      a: DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
      svg: DetailedHTMLProps<SVGAttributes<SVGElement>, SVGElement>;
      path: DetailedHTMLProps<SVGAttributes<SVGPathElement>, SVGPathElement>;
    }
  }
}

const Insights: FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("trends");
  const [openDialog, setOpenDialog] = useState<"none" | "export" | "share" | "analysis">("none");
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sample data - in a real app, this would come from user data
  const moodData = [
    { name: "Week 1", happy: 4, stressed: 1, tired: 2 },
    { name: "Week 2", happy: 3, stressed: 3, tired: 1 },
    { name: "Week 3", happy: 2, stressed: 4, tired: 3 },
    { name: "Week 4", happy: 5, stressed: 1, tired: 1 },
  ];
  
  const symptomsData = [
    { name: "Cramps", value: 8 },
    { name: "Headache", value: 5 },
    { name: "Bloating", value: 7 },
    { name: "Fatigue", value: 6 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  useEffect(() => {
    const fetchLogs = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const fetchedPeriodLogs = await getPeriodLogs(user.uid);
          const fetchedSymptomLogs = await getSymptomLogs(user.uid);
          setPeriodLogs(fetchedPeriodLogs);
          setSymptomLogs(fetchedSymptomLogs);
          console.log("Fetched Period Logs:", fetchedPeriodLogs);
          console.log("Fetched Symptom Logs:", fetchedSymptomLogs);
        } catch (error) {
          console.error("Error fetching period logs:", error);
          // Optionally show a toast error
        } finally {
          setIsLoading(false);
        }
      } else {
        setPeriodLogs([]);
        setSymptomLogs([]);
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [user]);

  const cycleSummary = useMemo(() => {
    if (periodLogs.length < 2) {
      return {
        averageCycleLength: "N/A",
        averagePeriodLength: "N/A",
        cycleRegularity: "N/A",
        shortestCycle: "N/A",
      };
    }

    // Filter for 'period_start' logs and sort them in descending order by date
    const periodStarts = periodLogs
      .filter(log => log.type === 'period_start' && isValid(parseISO(log.startDate)))
      .map(log => parseISO(log.startDate))
      .sort((a, b) => b.getTime() - a.getTime());

    if (periodStarts.length < 2) {
      return {
        averageCycleLength: "N/A",
        averagePeriodLength: "N/A",
        cycleRegularity: "N/A",
        shortestCycle: "N/A",
      };
    }

    // Calculate cycle lengths
    const cycleLengths: number[] = [];
    for (let i = 0; i < periodStarts.length - 1; i++) {
      const diff = differenceInDays(periodStarts[i], periodStarts[i + 1]);
      if (diff > 0 && diff < 60) { // Filter out unrealistic cycle lengths
        cycleLengths.push(diff);
      }
    }

    const avgCycleLength = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length)
      : 28; // Default if not enough data

    const shortestCycle = cycleLengths.length > 0 
      ? Math.min(...cycleLengths)
      : 26; // Default if not enough data

    // Calculate average period length
    const periodDurations = periodLogs
      .filter(log => log.type === 'period_end' && isValid(parseISO(log.startDate)) && isValid(parseISO(log.endDate)))
      .map(log => differenceInDays(parseISO(log.endDate), parseISO(log.startDate)) + 1)
      .filter(duration => duration > 0); // Ensure positive duration

    const avgPeriodLength = periodDurations.length > 0
      ? Math.round(periodDurations.reduce((sum, dur) => sum + dur, 0) / periodDurations.length)
      : 5; // Default if not enough data

    // Determine regularity based on variation in cycle lengths
    let regularity = "N/A";
    if (cycleLengths.length >= 3) {
      const variations = cycleLengths.map((length, i, arr) => {
        if (i === 0) return 0; // First cycle has no previous to compare to
        return Math.abs(length - arr[i - 1]);
      });
      const totalVariation = variations.reduce((sum, v) => sum + v, 0);
      const averageVariation = totalVariation / (cycleLengths.length - 1);

      if (averageVariation <= 3) {
        regularity = "Regular";
      } else if (averageVariation <= 7) {
        regularity = "Slightly Irregular";
      } else {
        regularity = "Irregular";
      }
    } else if (cycleLengths.length >= 1) {
      regularity = "Needs More Data";
    }

    const summary = {
      averageCycleLength: `${avgCycleLength} days`,
      averagePeriodLength: `${avgPeriodLength} days`,
      cycleRegularity: regularity,
      shortestCycle: `${shortestCycle} days`,
    };

    console.log("Calculated Cycle Summary:", summary);

    return summary;
  }, [periodLogs]);

  const generateCycleReportPdf = async () => {
    if (!user) {
      console.error("User not logged in, cannot generate PDF.");
      return;
    }

    const doc = new jsPDF();
    let yOffset = 10;
    const margin = 10;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();

    const addText = (text: string, x: number, y: number, fontSize: number, style?: string) => {
      doc.setFontSize(fontSize);
      if (style) doc.setFont(undefined, style);
      const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin);
      doc.text(splitText, x, y);
      return splitText.length * lineHeight;
    };

    // Title
    yOffset += addText("Cycle and Symptom Report", margin, yOffset, 18, 'bold');
    yOffset += addText(`Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, margin, yOffset, 10);
    yOffset += 10; // Extra spacing

    // Add Cycle Summary
    yOffset += addText("Cycle Summary", margin, yOffset, 14, 'bold');
    yOffset += 5; // Spacing
    if (cycleSummary) {
      yOffset += addText(`Average Cycle Length: ${cycleSummary.averageCycleLength}`, margin, yOffset, 10);
      yOffset += addText(`Average Period Length: ${cycleSummary.averagePeriodLength}`, margin, yOffset, 10);
      yOffset += addText(`Cycle Regularity: ${cycleSummary.cycleRegularity}`, margin, yOffset, 10);
      yOffset += addText(`Shortest Cycle: ${cycleSummary.shortestCycle}`, margin, yOffset, 10);
      yOffset += 10; // Extra spacing
    } else {
      yOffset += addText("No cycle summary data available.", margin, yOffset, 10);
      yOffset += 10; // Extra spacing
    }

    // Add Period Logs
    yOffset += addText("Period Logs", margin, yOffset, 14, 'bold');
    yOffset += 5; // Spacing
    if (periodLogs.length > 0) {
      // Group period start and end dates
      const groupedPeriods: { startDate: string, endDate?: string }[] = [];
      const sortedPeriodLogs = [...periodLogs].sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());

      for (let i = 0; i < sortedPeriodLogs.length; i++) {
        const log = sortedPeriodLogs[i];
        if (log.type === 'period_start') {
          let endDate = log.endDate; // Prioritize endDate directly from log

          // If endDate not present, but durationDays is, calculate it
          if (!endDate && log.durationDays) {
            const calculatedEndDate = addDays(parseISO(log.startDate), log.durationDays - 1);
            endDate = format(calculatedEndDate, 'yyyy-MM-dd');
          }
          
          groupedPeriods.push({
            startDate: log.startDate,
            endDate: endDate
          });
        }
      }
      console.log("Symptom Logs in generateCycleReportPdf:", symptomLogs);

      if (groupedPeriods.length > 0) {
        groupedPeriods.forEach(period => {
          const periodText = `Start: ${format(parseISO(period.startDate), 'MMMM d, yyyy')}, End: ${period.endDate ? format(parseISO(period.endDate), 'MMMM d, yyyy') : 'Ongoing'}`;
          if (yOffset + lineHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yOffset = margin; 
          }
          yOffset += addText(periodText, margin, yOffset, 10);
        });
      } else {
        yOffset += addText("No period logs available.", margin, yOffset, 10);
      }
      yOffset += 10; // Extra spacing
    } else {
      yOffset += addText("No period logs available.", margin, yOffset, 10);
      yOffset += 10; // Extra spacing
    }

    // Add Symptom Logs
    yOffset += addText("Symptom Logs", margin, yOffset, 14, 'bold');
    yOffset += 5; // Spacing
    if (symptomLogs.length > 0) {
      symptomLogs.forEach(log => {
        const formattedSymptoms = log.symptoms && log.symptoms.length > 0 
          ? log.symptoms.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')).join(", ") 
          : "N/A";
        const logText = `Date: ${format(parseISO(log.date), 'MMMM d, yyyy')}, Mood: ${log.mood ? (log.mood.charAt(0).toUpperCase() + log.mood.slice(1)) : 'N/A'}, Sleep: ${log.sleepHours || 'N/A'} hrs (${log.sleepQuality ? (log.sleepQuality.charAt(0).toUpperCase() + log.sleepQuality.slice(1)) : 'N/A'}), Notes: ${log.notes || 'N/A'}, Symptoms: ${formattedSymptoms}`;
        if (yOffset + lineHeight > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          yOffset = margin;
        }
        yOffset += addText(logText, margin, yOffset, 10);
      });
    } else {
      yOffset += addText("No symptom logs available.", margin, yOffset, 10);
    }

    doc.save('luna_health_report.pdf');
    setOpenDialog("none");
    alert("Data exported successfully as PDF!");
  };

  return (
    <div className="page-container pb-24">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold">{t('insights.title')}</h1>
        <p className="text-muted-foreground">Understand your cycle patterns</p>
      </div>
      
      <Tabs defaultValue="trends" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends">
          <div className="space-y-6">
            <GlassCard className="p-4">
              <h2 className="text-lg font-medium mb-4">Mood Patterns</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="happy" stroke="#8884d8" />
                    <Line type="monotone" dataKey="stressed" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="tired" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <h2 className="text-lg font-medium mb-4">Symptom Frequency</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="happy" fill="#8884d8" />
                    <Bar dataKey="stressed" fill="#82ca9d" />
                    <Bar dataKey="tired" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <h2 className="text-lg font-medium mb-4">Common Symptoms</h2>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={symptomsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {symptomsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </TabsContent>
        
        <TabsContent value="reports">
          <div className="space-y-6">
            <GlassCard className="p-4">
              <h2 className="text-lg font-medium mb-4">Cycle Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('insights.cycleSummary.averageCycleLength')}</p>
                  <p className="text-2xl font-semibold">{cycleSummary.averageCycleLength}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('insights.cycleSummary.averagePeriodLength')}</p>
                  <p className="text-2xl font-semibold">{cycleSummary.averagePeriodLength}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('insights.cycleSummary.cycleRegularity')}</p>
                  <p className="text-2xl font-semibold">{cycleSummary.cycleRegularity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('insights.cycleSummary.shortestCycle')}</p>
                  <p className="text-2xl font-semibold">{cycleSummary.shortestCycle}</p>
                </div>
              </div>
            </GlassCard>
            
            <div className="flex justify-between gap-4">
              <Button 
                className="flex-1 gap-2" 
                onClick={() => setOpenDialog("export")}
              >
                <Download className="h-4 w-4" />
                {t('insights.exportDataButton')}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={() => setOpenDialog("share")}
              >
                <FileText className="h-4 w-4" />
                {t('insights.shareWithDoctorButton')}
              </Button>
            </div>

          </div>
        </TabsContent>
        
        <TabsContent value="health">
          <div className="space-y-6">
            <GlassCard className="p-4">
              <h2 className="text-lg font-medium mb-4">General Health Insights</h2>
              <p className="text-muted-foreground">Personalized insights based on your logged data.</p>
            </GlassCard>
            
            {/* Example sections for Health tab */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-medium mb-3">Hormonal Balance</h3>
              <p className="text-sm text-muted-foreground">Learn about how your diet and lifestyle can impact your hormones.</p>
            </GlassCard>
            
            <GlassCard className="p-4">
              <h3 className="text-lg font-medium mb-3">Wellness Tips</h3>
              <p className="text-sm text-muted-foreground">Suggestions for improving sleep, stress, and overall well-being.</p>
            </GlassCard>

            <HealthAnalysis periodLogs={periodLogs} />

          </div>
        </TabsContent>

        <TabsContent value="education">
          <div className="space-y-6">
            <GlassCard className="p-4">
              <h2 className="text-lg font-medium mb-4">Essential Terms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <h4 className="font-medium text-gray-900">{t('insights.essentialTerms.estrogen.title')}</h4>
                  <p className="text-sm text-gray-600 mt-1">{t('insights.essentialTerms.estrogen.description')}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <h4 className="font-medium text-gray-900">{t('insights.essentialTerms.progesterone.title')}</h4>
                  <p className="text-sm text-gray-600 mt-1">{t('insights.essentialTerms.progesterone.description')}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <h2 className="text-lg font-medium mb-4">Health Articles & Guides</h2>
              <div className="space-y-6">
                {/* General Cycle Health */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">General Cycle Health</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a 
                      href="https://my.clevelandclinic.org/health/diseases/14563-irregular-periods" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{t('insights.healthArticles.irregularCycles.title')}</p>
                          <p className="text-sm text-gray-500 mt-1">{t('insights.healthArticles.irregularCycles.description')}</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center text-primary hover:text-primary-dark font-medium">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </a>

                    <a 
                      href="https://www.womenshealthmag.com/health/a39521361/hormonal-imbalance-symptoms/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{t('insights.healthArticles.hormonalHealth.title')}</p>
                          <p className="text-sm text-gray-500 mt-1">{t('insights.healthArticles.hormonalHealth.description')}</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center text-primary hover:text-primary-dark font-medium">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </a>
                  </div>
                </div>

                {/* Pregnancy Trimesters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">Pregnancy Trimesters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a 
                      href="https://my.clevelandclinic.org/health/articles/9699-first-trimester" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{t('pregnancy.trimesterGuideCard.firstTrimesterArticle')}</p>
                          <p className="text-sm text-gray-500 mt-1">Cleveland Clinic</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center text-primary hover:text-primary-dark font-medium">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </a>

                    <a 
                      href="https://naitre.com/blogs/pregnancy-articles/your-second-trimester-embracing-the-journey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{t('pregnancy.trimesterGuideCard.secondTrimesterArticle')}</p>
                          <p className="text-sm text-gray-500 mt-1">Naitre.com</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center text-primary hover:text-primary-dark font-medium">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <h2 className="text-lg font-medium mb-4">Recommended Articles</h2>
              <div className="space-y-6">
                {/* Exercise & Your Cycle */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">Exercise & Your Cycle</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a 
                      href="https://www.healthline.com/health/exercise-during-period" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{t('insights.healthArticles.exerciseDuringPeriodHealthline.title')}</p>
                          <p className="text-sm text-gray-500 mt-1">{t('insights.healthArticles.exerciseDuringPeriodHealthline.source')}</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center text-primary hover:text-primary-dark font-medium">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </a>

                    <a 
                      href="https://www.verywellhealth.com/exercise-during-your-period-4160636" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{t('insights.healthArticles.exerciseDuringPeriodVerywell.title')}</p>
                          <p className="text-sm text-gray-500 mt-1">{t('insights.healthArticles.exerciseDuringPeriodVerywell.source')}</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center text-primary hover:text-primary-dark font-medium">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </a>

                    <a 
                      href="https://www.womenshealthmag.com/fitness/a19904797/should-you-exercise-on-your-period/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{t('insights.healthArticles.exerciseThroughoutCycle.title')}</p>
                          <p className="text-sm text-gray-500 mt-1">Women's Health Magazine</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center text-primary hover:text-primary-dark font-medium">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </a>
                  </div>
                </div>

                {/* Understanding PMS */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">Understanding PMS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a 
                      href="https://www.mayoclinic.org/diseases-conditions/premenstrual-syndrome/symptoms-causes/syc-20376780" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{t('insights.healthArticles.pmsMayoClinic.title')}</p>
                          <p className="text-sm text-gray-500 mt-1">{t('insights.healthArticles.pmsMayoClinic.source')}</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center text-primary hover:text-primary-dark font-medium">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </a>

                    <a 
                      href="https://www.acog.org/womens-health/faqs/premenstrual-syndrome-pms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{t('insights.healthArticles.pmsACOG.title')}</p>
                          <p className="text-sm text-gray-500 mt-1">{t('insights.healthArticles.pmsACOG.source')}</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center text-primary hover:text-primary-dark font-medium">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={openDialog !== "none"} onOpenChange={() => setOpenDialog("none")}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {openDialog === "export" ? t('insights.dialogs.exportData.title') : 
               openDialog === "share" ? t('insights.dialogs.shareWithDoctor.title') : 
               t('insights.dialogs.requestAnalysis.title')}
            </DialogTitle>
            <DialogDescription>
              {openDialog === "export" ? t('insights.dialogs.exportData.description') : 
               openDialog === "share" ? t('insights.dialogs.shareWithDoctor.description') : 
               t('insights.dialogs.requestAnalysis.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {openDialog === "export" && (
              <>
                <p>{t('insights.dialogs.exportData.info')}</p>
                <Button onClick={generateCycleReportPdf}>{t('insights.dialogs.exportData.button')}</Button>
              </>
            )}
            {openDialog === "share" && (
              <ShareWithDoctorDialog
                open={openDialog === "share"}
                onOpenChange={(isOpen) => setOpenDialog(isOpen ? "share" : "none")}
                cycleSummary={cycleSummary}
                periodLogs={periodLogs}
              />
            )}
            {openDialog === "analysis" && (
              <div className="space-y-4">
                <p>{t('insights.dialogs.requestAnalysis.info')}</p>
                <div className="space-y-2">
                  <Label htmlFor="analysis-email">{t('insights.dialogs.requestAnalysis.emailLabel')}</Label>
                  <Input 
                    id="analysis-email" 
                    type="email" 
                    placeholder={t('insights.dialogs.requestAnalysis.emailPlaceholder')} 
                    defaultValue={user?.email || ''}
                  />
                </div>
                <Button onClick={() => {
                  setOpenDialog("none");
                  alert(t('insights.dialogs.requestAnalysis.success'));
                }}>{t('insights.dialogs.requestAnalysis.button')}</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Insights;
