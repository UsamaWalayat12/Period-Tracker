import { CycleCalendar } from "@/components/cycle-calendar";
import { MoodTracker } from "@/components/mood-tracker";
import { SymptomTracker } from "@/components/symptom-tracker";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();
  return (
    <div className="page-container pb-24">
      <div className="text-center mb-8">
        <div className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider animate-fade-in animate-delay-100">
          {format(new Date(), 'MMMM d, yyyy')}
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold mt-1 mb-1 animate-fade-in animate-delay-200">Luna</h1>
        <p className="text-lg sm:text-xl text-primary/80 animate-fade-in animate-delay-300">{t('homepage.tagline')}</p>
      </div>
      
      <div className="space-y-8">
        <div className="animate-fade-in animate-delay-400"><CycleCalendar /></div>
        <div className="animate-fade-in animate-delay-500"><MoodTracker /></div>
        <div className="animate-fade-in animate-delay-600"><SymptomTracker /></div>
      </div>
    </div>
  );
};

export default Index;
