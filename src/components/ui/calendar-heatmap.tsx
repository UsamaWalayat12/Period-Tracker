import { useEffect, useState } from 'react';
import { addDays, format, startOfWeek, isToday, isSameMonth, getDay, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { cn } from "@/lib/utils";

interface CalendarHeatmapProps {
  currentDate: Date;
  events: {
    date: Date;
    type: 'period' | 'fertile' | 'ovulation' | 'prediction';
  }[];
  onSelectDate: (date: Date) => void;
  className?: string;
}

export function CalendarHeatmap({ currentDate, events, onSelectDate, className }: CalendarHeatmapProps) {
  const [calendar, setCalendar] = useState<(Date | null)[][]>([]);
  
  useEffect(() => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    const startWeekday = getDay(startDate);
    
    const temp: (Date | null)[][] = [];
    const day = startOfWeek(startDate);
    
    for (let i = 0; i < 6; i++) {
      const week: (Date | null)[] = [];
      for (let j = 0; j < 7; j++) {
        const currentDay = addDays(day, i * 7 + j);
        if (
          (i === 0 && j < startWeekday) || 
          currentDay > endDate
        ) {
          week.push(null);
        } else {
          week.push(currentDay);
        }
      }
      temp.push(week);
    }
    
    setCalendar(temp);
  }, [currentDate]);
  
  const getEventType = (date: Date) => {
    // First check for exact period logs since they are more accurate than predictions
    const periodEvent = events.find(e => 
      date && e.date && isSameDay(new Date(e.date), date) && e.type === 'period'
    );
    
    if (periodEvent) return 'period';
    
    // Then check for ovulation which is a key day
    const ovulationEvent = events.find(e => 
      date && e.date && isSameDay(new Date(e.date), date) && e.type === 'ovulation'
    );
    
    if (ovulationEvent) return 'ovulation';
    
    // Check for fertile days
    const fertileEvent = events.find(e => 
      date && e.date && isSameDay(new Date(e.date), date) && e.type === 'fertile'
    );
    
    if (fertileEvent) return 'fertile';
    
    // Lastly check for predicted period dates
    const predictionEvent = events.find(e => 
      date && e.date && isSameDay(new Date(e.date), date) && e.type === 'prediction'
    );
    
    if (predictionEvent) return 'prediction';
    
    return null;
  };
  
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendar.flat().map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }
          
          const eventType = getEventType(day);
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <button
              key={day.toString()}
              className={cn(
                "aspect-square flex items-center justify-center rounded-full text-sm transition-all",
                "hover:bg-muted/80 relative",
                isCurrentDay ? "font-bold" : "",
                !isCurrentMonth ? "text-muted-foreground/50" : "",
                eventType === 'period' && "bg-luna-200 hover:bg-luna-300",
                eventType === 'fertile' && "bg-fertility-medium hover:bg-fertility-high text-white",
                eventType === 'ovulation' && "bg-fertility-high hover:bg-fertility-high/90 text-white",
                eventType === 'prediction' && "bg-luna-100 hover:bg-luna-200",
              )}
              onClick={() => onSelectDate(day)}
            >
              <span className={cn(
                "z-10 flex items-center justify-center",
                isCurrentDay && "h-7 w-7 rounded-full border-2 border-primary"
              )}>
                {format(day, 'd')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
