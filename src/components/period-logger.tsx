import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, doc, updateDoc, Timestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { PeriodLog } from "@/integrations/firebase/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isFuture, isSameDay } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Droplet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";

const formSchema = z.object({
  flow: z.enum(['light', 'medium', 'heavy']).nullable().optional(),
  symptoms: z.array(z.string()).optional(),
  notes: z.string().optional(),
  durationDays: z.number().int().min(1).max(10).nullable().optional(),
});

const commonSymptoms = [
  { id: 'cramps', label: 'Cramps', emoji: '腹' },
  { id: 'headache', label: 'Headache', emoji: '🤯' },
  { id: 'bloating', label: 'Bloating', emoji: '🎈' },
  { id: 'fatigue', label: 'Fatigue', emoji: 'ired' },
  { id: 'mood_swings', label: 'Mood Swings', emoji: '🎢' },
  { id: 'acne', label: 'Acne', emoji: ' pimple' },
  { id: 'breast_tenderness', label: 'Breast Tenderness', emoji: '🍈' },
  { id: 'nausea', label: 'Nausea', emoji: '🤢' },
  { id: 'backache', label: 'Backache', emoji: '🦴' },
  { id: 'insomnia', label: 'Insomnia', emoji: '😴' },
];

const flowOptions = [
  { value: 'light', label: 'Light', color: 'text-blue-400' },
  { value: 'medium', label: 'Medium', color: 'text-purple-400' },
  { value: 'heavy', label: 'Heavy', color: 'text-red-400' },
];

interface PeriodLogFormData {
  startDate: Date;
  endDate: Date | null;
  flow: 'light' | 'medium' | 'heavy' | null;
  symptoms: string[];
  notes: string;
}

interface PeriodLoggerProps {
  onPeriodLogged: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLogToEdit?: PeriodLog | null;
}

export function PeriodLogger({ onPeriodLogged, open, onOpenChange, initialLogToEdit }: PeriodLoggerProps) {
  const { user } = useAuth();
  const { trackingOption1, trackingOption2 } = useAppPreferences();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      flow: initialLogToEdit?.flow || null,
      symptoms: initialLogToEdit?.symptoms || [],
      notes: initialLogToEdit?.notes || "",
      durationDays: initialLogToEdit?.durationDays || null,
    },
  });

  useEffect(() => {
    if (initialLogToEdit) {
      setSelectedDate(initialLogToEdit.startDate ? new Date(initialLogToEdit.startDate) : undefined);
      setSelectedSymptoms(initialLogToEdit.symptoms || []);
      form.reset({
        flow: initialLogToEdit.flow || null,
        symptoms: initialLogToEdit.symptoms || [],
        notes: initialLogToEdit.notes || "",
        durationDays: initialLogToEdit.durationDays || null,
      });
    } else {
      setSelectedDate(new Date());
      setSelectedSymptoms([]);
      form.reset({
        flow: null,
        symptoms: [],
        notes: "",
        durationDays: null,
      });
    }
  }, [initialLogToEdit, form]);

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms(prev => [...prev, customSymptom.trim()]);
      setCustomSymptom("");
    }
  };

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => prev.filter(s => s !== symptom));
  };

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(s => s !== symptomId) 
        : [...prev, symptomId]
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // Unified submission handler
  const handleLogSubmission = async (values: z.infer<typeof formSchema>) => {
    if (!selectedDate || !user?.uid) {
      toast.error("Login required to log period.");
      return;
    }

    // 1. Prevent logging for future dates
    if (isFuture(selectedDate)) {
      toast.error("Cannot log period for a future date.");
      return;
    }

    setIsLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const periodLogsRef = collection(db, 'period_logs');

      // Clean the flow value before saving
      const cleanedFlow = values.flow 
        ? values.flow.replace('PeriodHistory.Flow.', '').replace('periodHistory.flow.', '')
        : null;

      let logData: Partial<PeriodLog> = {
        userId: user.uid,
        date: formattedDate,
        flow: cleanedFlow as 'light' | 'medium' | 'heavy' | null, // Use the cleaned flow
        symptoms: selectedSymptoms,
        notes: values.notes,
        durationDays: values.durationDays,
        createdAt: Timestamp.now(),
      };

      if (initialLogToEdit && initialLogToEdit.id) {
        // Validate initialLogToEdit.id
        if (!initialLogToEdit.id || typeof initialLogToEdit.id !== 'string') {
          toast.error("Invalid period entry ID for update. Please try again.");
          setIsLoading(false);
          return;
        }

        // Editing an existing log: preserve original type and dates, ensuring null for undefined
        logData = {
          ...logData,
          type: initialLogToEdit.type, // Preserve existing type (e.g., 'period_start' or 'period_end')
          startDate: initialLogToEdit.startDate || null, 
          endDate: initialLogToEdit.endDate || null,     
        };
        await updateDoc(doc(db, 'period_logs', initialLogToEdit.id), logData);
        toast.success("Period entry updated successfully!");
      } else {
        // 2. Prevent duplicate logs for the same date (only for new entries)
        const q = query(
          periodLogsRef,
          where('userId', '==', user.uid),
          where('date', '==', formattedDate)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          toast.error("A period entry already exists for this date.");
          setIsLoading(false); // Make sure to reset loading state if we return early
          return;
        }

        // Logging a new period: assume it's a period start
        logData = {
          ...logData,
          type: 'period_start', 
          startDate: formattedDate,
        };
        await addDoc(periodLogsRef, logData);
        toast.success("Period start logged!", {
          description: format(selectedDate, 'MMMM d, yyyy')
        });
      }
      
      onOpenChange(false);
      onPeriodLogged();
    } catch (error) {
      console.error("Error logging period:", error);
      if (error && typeof error === 'object' && 'code' in error && error.code === 'firestore/not-found') {
        toast.error("The period entry you are trying to edit was not found. It might have been deleted.");
      } else {
        toast.error("Failed to log period. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      return initialLogToEdit ? "Saving changes..." : "Logging...";
    }
    return initialLogToEdit ? "Save Changes" : "Log Period";
  };

  const getDialogTitle = () => {
    return initialLogToEdit ? "Edit Period Entry" : "Log Your Period";
  };

  const getDialogDescription = () => {
    return initialLogToEdit ? "Update the details for this period log." : "Record the details of your period start or end.";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Period Logger</CardTitle>
        <CardDescription>
          Log the start and end dates of your period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          className="rounded-md border"
        />
      </CardContent>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>
              {getDialogDescription()}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogSubmission)} className="space-y-4">
              <FormField
                control={form.control}
                name="flow"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Period Flow</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                        className="flex flex-wrap gap-2"
                      >
                        {flowOptions.map(option => (
                          <Button
                            key={option.value}
                            type="button"
                            variant={field.value === option.value ? 'default' : 'outline'}
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              "min-w-[80px]",
                              option.color,
                              field.value === option.value && 'bg-primary text-primary-foreground hover:bg-primary/90'
                            )}
                          >
                            <Droplet className="h-4 w-4 mr-1" />
                            {option.label}
                          </Button>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Duration (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 5"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about this period."
                        className="resize-none"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {getButtonText()}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
