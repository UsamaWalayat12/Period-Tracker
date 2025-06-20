import { useState } from 'react';
import { format, addMonths, subMonths, isToday, addDays } from 'date-fns';
import { CalendarHeatmap } from './ui/calendar-heatmap';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { GlassCard } from './ui/glass-card';

// Sample data - in a real app, this would come from a database
const generateSampleEvents = () => {
  const today = new Date();
  const events = [];
  
  // Period days (5 days)
  for (let i = -3; i <= 1; i++) {
    events.push({
      date: addDays(today, i),
      type: 'period' as const
    });
  }
  
  // Fertile window (6 days before ovulation)
  for (let i = 10; i <= 15; i++) {
    events.push({
      date: addDays(today, i),
      type: 'fertile' as const
    });
  }
  
  // Ovulation day
  events.push({
    date: addDays(today, 14),
    type: 'ovulation' as const
  });
  
  // Predicted next period (5 days)
  for (let i = 25; i <= 29; i++) {
    events.push({
      date: addDays(today, i),
      type: 'prediction' as const
    });
  }
  
  return events;
};

export function CycleCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events] = useState(generateSampleEvents());
  
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  const eventForSelectedDate = selectedDate 
    ? events.find(e => isToday(new Date(e.date)))
    : null;
    
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const getStatusText = () => {
    if (!selectedDate) return "Select a date to see details";
    
    const event = events.find(e => 
      format(new Date(e.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    );
    
    if (!event) return "No events on this day";
    
    switch (event.type) {
      case 'period':
        return "Period day";
      case 'fertile':
        return "Fertile window";
      case 'ovulation':
        return "Ovulation day";
      case 'prediction':
        return "Predicted period";
      default:
        return "No events";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Cycle Calendar</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={prevMonth}
            className="h-8 w-8 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={nextMonth}
            className="h-8 w-8 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <GlassCard className="px-3 py-6">
        <CalendarHeatmap 
          currentDate={currentMonth}
          events={events}
          onSelectDate={handleSelectDate}
        />
      </GlassCard>
      
      {selectedDate && (
        <GlassCard className="flex items-center justify-between">
          <div>
            <p className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</p>
            <p className="text-sm text-muted-foreground">{getStatusText()}</p>
          </div>
          <div>
            <Button 
              variant={getStatusText().includes("Period") ? "default" : "outline"}
              size="sm"
              className={getStatusText().includes("Period") ? "bg-luna-500" : ""}
            >
              Log Period
            </Button>
          </div>
        </GlassCard>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-luna-100 text-luna-900">
          <div className="w-3 h-3 rounded-full bg-luna-500"></div>
          <span className="text-sm font-medium">Period</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-fertility-low text-blue-900">
          <div className="w-3 h-3 rounded-full bg-fertility-medium"></div>
          <span className="text-sm font-medium">Fertile</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-fertility-medium/20 text-blue-900">
          <div className="w-3 h-3 rounded-full bg-fertility-high"></div>
          <span className="text-sm font-medium">Ovulation</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-luna-50 text-luna-900">
          <div className="w-3 h-3 rounded-full bg-luna-300"></div>
          <span className="text-sm font-medium">Predicted</span>
        </div>
      </div>
    </div>
  );
}
