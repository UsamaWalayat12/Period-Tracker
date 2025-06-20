import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Smile, Frown, Meh, Moon, Plus, X, Sun, Cloud, CloudLightning } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  date: z.string(),
  mood: z.string().min(1, "Please select your mood"),
  sleep_hours: z.string().optional(),
  sleep_quality: z.string().min(1, "Please select your sleep quality"),
  notes: z.string().optional(),
});

// Define the common symptoms that users can select from
const commonSymptoms = [
  { id: "cramps", label: "Cramps", emoji: "😖" },
  { id: "headache", label: "Headache", emoji: "🤕" },
  { id: "bloating", label: "Bloating", emoji: "🎈" },
  { id: "fatigue", label: "Fatigue", emoji: "😴" },
  { id: "nausea", label: "Nausea", emoji: "🤢" },
  { id: "backPain", label: "Back Pain", emoji: "⚡" },
  { id: "breastTenderness", label: "Breast Tenderness", emoji: "💞" },
  { id: "acne", label: "Acne", emoji: "🙁" },
  { id: "spotting", label: "Spotting", emoji: "🩸" },
  { id: "cravings", label: "Cravings", emoji: "🍫" },
  { id: "moodSwings", label: "Mood Swings", emoji: "🔄" },
  { id: "insomnia", label: "Insomnia", emoji: "🌙" },
];

// Mood options with more detailed configuration
const moodOptions = [
  { value: "great", emoji: "😄", label: "Great", color: "border-mood-great bg-mood-great/20" },
  { value: "good", emoji: "🙂", label: "Good", color: "border-mood-good bg-mood-good/20" },
  { value: "okay", emoji: "😐", label: "Okay", color: "border-mood-neutral bg-mood-neutral/20" },
  { value: "poor", emoji: "😔", label: "Poor", color: "border-mood-poor bg-mood-poor/20" },
  { value: "bad", emoji: "😞", label: "Bad", color: "border-mood-bad bg-mood-bad/20" },
];

// Sleep quality options with more detailed configuration
const sleepQualityOptions = [
  { value: "good", icon: <Sun className="h-5 w-5" />, label: "Good", color: "border-mood-good bg-mood-good/20" },
  { value: "fair", icon: <Cloud className="h-5 w-5" />, label: "Fair", color: "border-mood-neutral bg-mood-neutral/20" },
  { value: "poor", icon: <CloudLightning className="h-5 w-5" />, label: "Poor", color: "border-mood-poor bg-mood-poor/20" },
];

export function SymptomForm({ date = new Date(), onSuccess }: { date?: Date, onSuccess?: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [sleepHours, setSleepHours] = useState(8);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(date, "yyyy-MM-dd"),
      mood: "okay",
      sleep_hours: "8.0",
      sleep_quality: "fair",
      notes: "",
    },
  });

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom)) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom]);
      setCustomSymptom("");
    }
  };

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
  };

  const toggleSymptom = (symptomId: string) => {
    if (selectedSymptoms.includes(symptomId)) {
      removeSymptom(symptomId);
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomId]);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("SymptomForm: onSubmit triggered");
    console.log("SymptomForm: values submitted", values);
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to track your symptoms",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const symptomLogRef = doc(db, 'symptom_logs', `${user.uid}_${values.date}`);
      
      // First check if there's an existing entry for this date
      const existingLog = await getDoc(symptomLogRef);
      
      const symptomData = {
        user_id: user.uid,
        date: values.date,
        mood: values.mood,
        sleep_hours: values.sleep_hours ? parseFloat(values.sleep_hours) : null,
        sleep_quality: values.sleep_quality,
        symptoms: selectedSymptoms,
        notes: values.notes || null,
        updated_at: new Date().toISOString()
      };
      
      if (existingLog.exists()) {
        // Update existing log
        await setDoc(symptomLogRef, symptomData, { merge: true });
      } else {
        // Insert new log
        await setDoc(symptomLogRef, {
          ...symptomData,
          created_at: new Date().toISOString()
        });
      }
      
      toast({
        title: "Success!",
        description: "Your symptoms have been logged",
      });
      
      if (onSuccess) {
        console.log("SymptomForm: onSuccess callback triggered.");
        onSuccess();
      }
    } catch (error) {
      console.error("Error logging symptoms:", error);
      toast({
        title: "Failed to log symptoms",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliderChange = (value: number[]) => {
    const hours = value[0];
    setSleepHours(hours);
    form.setValue("sleep_hours", hours.toString());
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
        console.error("SymptomForm: Form submission errors", errors);
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields and correct any errors.",
          variant: "destructive",
        });
      })} className="space-y-6 flex-1 overflow-y-auto pb-10">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={isLoading} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-5">
          <h3 className="font-medium text-lg flex items-center gap-2">
            <Smile className="h-5 w-5 text-primary" />
            <span>How are you feeling today?</span>
          </h3>
          
          <FormField
            control={form.control}
            name="mood"
            render={({ field }) => {
              console.log("Mood field value:", field.value);
              return (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value || null)}
                      value={field.value || ""}
                      className="grid grid-cols-2 md:grid-cols-5 gap-3"
                      disabled={isLoading}
                    >
                      {moodOptions.map(option => (
                        <div
                          key={option.value}
                          className={cn(
                            "relative transition-all duration-300 transform",
                            field.value === option.value ? "scale-105" : "hover:scale-102"
                          )}
                        >
                          <GlassCard
                            className={cn(
                              "flex flex-col items-center p-3 cursor-pointer transition-all w-full text-center aspect-square justify-center",
                              field.value === option.value ? `border-2 ${option.color}` : "hover:bg-background/50",
                              "rounded-lg" // Ensure consistent rounded corners
                            )}
                          >
                            <div className="text-3xl mb-1">{option.emoji}</div>
                            <RadioGroupItem value={option.value} className="sr-only" />
                            <span className="text-xs font-medium">{option.label}</span>
                          </GlassCard>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              );
            }}
          />
        </div>

        <div className="space-y-5">
          <h3 className="font-medium text-lg flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            <span>How did you sleep?</span>
          </h3>
          
          <div className="bg-background/50 p-5 rounded-lg border border-border">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium">Hours of Sleep</span>
                <span className="text-lg font-semibold">{sleepHours} hrs</span>
              </div>
              
              <FormField
                control={form.control}
                name="sleep_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="px-2">
                        <Slider
                          defaultValue={[8]}
                          max={12}
                          min={0}
                          step={0.5}
                          onValueChange={handleSliderChange}
                          disabled={isLoading}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0</span>
                          <span>4</span>
                          <span>8</span>
                          <span>12</span>
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div>
              <div className="mb-3">
                <span className="text-sm font-medium">Sleep Quality</span>
              </div>
              
              <FormField
                control={form.control}
                name="sleep_quality"
                render={({ field }) => {
                  console.log("Sleep Quality field value:", field.value);
                  return (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value || null)}
                          value={field.value || ""}
                          className="grid grid-cols-3 gap-3"
                          disabled={isLoading}
                        >
                          {sleepQualityOptions.map(option => (
                            <div
                              key={option.value}
                              className={cn(
                                "relative transition-all duration-300 transform",
                                field.value === option.value ? "scale-105" : "hover:scale-102"
                              )}
                            >
                              <GlassCard
                                className={cn(
                                  "flex flex-col items-center p-3 cursor-pointer transition-all w-full text-center aspect-square justify-center",
                                  field.value === option.value ? `border-2 ${option.color}` : "hover:bg-background/50",
                                  "rounded-lg" // Ensure consistent rounded corners
                                )}
                              >
                                <div className="text-3xl mb-1">{option.icon}</div>
                                <RadioGroupItem value={option.value} className="sr-only" />
                                <span className="text-xs font-medium">{option.label}</span>
                              </GlassCard>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <h3 className="font-medium text-lg flex items-center gap-2">
            <CloudLightning className="h-5 w-5 text-primary" />
            <span>Symptoms</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {commonSymptoms.map(symptom => (
              <GlassCard
                key={symptom.id}
                className={cn(
                  "flex flex-col items-center p-3 cursor-pointer transition-all w-full text-center aspect-square justify-center",
                  selectedSymptoms.includes(symptom.id) ? "border-2 border-primary bg-primary/20" : "hover:bg-background/50",
                  "rounded-lg" // Ensure consistent rounded corners
                )}
                onClick={() => toggleSymptom(symptom.id)}
              >
                <div className="text-3xl mb-1">{symptom.emoji}</div>
                <span className="text-xs font-medium">{symptom.label}</span>
              </GlassCard>
            ))}
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Input
              placeholder="Add custom symptom"
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // Prevent form submission
                  addCustomSymptom();
                }
              }}
              className="flex-grow"
            />
            <Button type="button" onClick={addCustomSymptom} disabled={!customSymptom.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {selectedSymptoms.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedSymptoms.map(symptomId => {
                const common = commonSymptoms.find(s => s.id === symptomId);
                const label = common ? common.label : symptomId;
                const emoji = common ? common.emoji : null;

                return (
                  <div
                    key={symptomId}
                    className="flex items-center bg-secondary text-secondary-foreground text-sm px-3 py-1 rounded-full border border-border"
                  >
                    {emoji && <span className="mr-2 text-base">{emoji}</span>}
                    {label}
                    <button
                      type="button"
                      onClick={() => removeSymptom(symptomId)}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <h3 className="font-medium text-lg">Notes</h3>
          <Textarea
            placeholder="Any additional details you want to record"
            {...form.register("notes")}
            disabled={isLoading}
            rows={4}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Symptoms"}
        </Button>
      </form>
    </Form>
  );
}
