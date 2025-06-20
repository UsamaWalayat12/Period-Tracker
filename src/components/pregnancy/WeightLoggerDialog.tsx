import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isAfter, startOfDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getWeightLogByDate, updateWeightLog } from "@/integrations/firebase/utils";

interface WeightLoggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWeightLogged: () => void;
}

export function WeightLoggerDialog({ open, onOpenChange, onWeightLogged }: WeightLoggerDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weight, setWeight] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveWeight = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to save weight.", variant: "destructive" });
      return;
    }
    if (!selectedDate || !weight) {
       toast({ title: "Error", description: "Please select a date and enter your weight.", variant: "destructive" });
      return;
    }

    // Check if selected date is in the future
    if (isAfter(startOfDay(selectedDate), startOfDay(new Date()))) {
      toast({ title: "Error", description: "Cannot log weight for future dates.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const weightValue = parseFloat(weight);
      if (isNaN(weightValue) || weightValue <= 0) {
        toast({ title: "Error", description: "Please enter a valid positive number for weight.", variant: "destructive" });
        setIsSaving(false);
        return;
      }

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      try {
        const existingLog = await getWeightLogByDate(user.uid, formattedDate);

        if (existingLog) {
          // Update existing log
          await updateWeightLog(existingLog.id, {
            weight: weightValue,
          });
          toast({ title: "Weight updated", description: "Your weight has been updated successfully." });
        } else {
          // Create new log
          await addDoc(collection(db, "user_weight_logs"), {
            userId: user.uid,
            date: formattedDate,
            weight: weightValue,
            createdAt: Timestamp.now(),
          });
          toast({ title: "Weight saved", description: "Your weight has been logged successfully." });
        }

        setWeight("");
        setSelectedDate(new Date());
        onOpenChange(false);
        onWeightLogged();
      } catch (error) {
        console.error("Error saving weight:", error);
        toast({ 
          title: "Connection Error", 
          description: "There was a problem connecting to the server. Please check your internet connection and try again.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Error processing weight:", error);
      toast({ 
        title: "Error", 
        description: "There was a problem processing your weight. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Your Weight</DialogTitle>
          <DialogDescription>
            Enter your weight for a specific date during your pregnancy.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={
                    "w-[240px] justify-start text-left font-normal"
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={{ after: new Date() }} // Disable future dates
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="weight" className="text-right">Weight (kg/lbs)</Label>
            <Input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 65"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveWeight} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Weight"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 