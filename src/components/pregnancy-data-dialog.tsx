
import { useState } from "react";
import { format, subWeeks } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface PregnancyDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PregnancyDataDialog({ open, onOpenChange }: PregnancyDataDialogProps) {
  const { updatePregnancyData, isNewUser } = useAuth();
  const { toast } = useToast();
  const [inputMethod, setInputMethod] = useState<"dueDate" | "lastPeriod">("dueDate");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [lastPeriod, setLastPeriod] = useState<Date | undefined>(undefined);

  const handleSave = () => {
    if (inputMethod === "dueDate" && dueDate) {
      // Calculate last period from due date (approximately 40 weeks before)
      const calculatedLastPeriod = subWeeks(dueDate, 40);
      
      updatePregnancyData({
        dueDate: dueDate.toISOString(),
        lastPeriod: calculatedLastPeriod.toISOString(),
        hasEnteredData: true
      });
      
      toast({
        title: "Pregnancy data saved",
        description: `Your due date is set to ${format(dueDate, "MMMM d, yyyy")}`,
      });
      
      onOpenChange(false);
    } 
    else if (inputMethod === "lastPeriod" && lastPeriod) {
      // Calculate due date from last period (approximately 40 weeks after)
      const calculatedDueDate = new Date(lastPeriod);
      calculatedDueDate.setDate(calculatedDueDate.getDate() + 280); // ~40 weeks
      
      updatePregnancyData({
        dueDate: calculatedDueDate.toISOString(),
        lastPeriod: lastPeriod.toISOString(),
        hasEnteredData: true
      });
      
      toast({
        title: "Pregnancy data saved",
        description: `Based on your last period, your due date is ${format(calculatedDueDate, "MMMM d, yyyy")}`,
      });
      
      onOpenChange(false);
    } 
    else {
      toast({
        title: "Please select a date",
        description: "You need to select either a due date or last period date",
        variant: "destructive",
      });
    }
  };

  // Modified to allow the dialog to be closed regardless of user status
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter your pregnancy information</DialogTitle>
          <DialogDescription>
            To provide accurate pregnancy tracking, we need either your due date or the first day of your last period.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          defaultValue="dueDate" 
          value={inputMethod} 
          onValueChange={(value) => setInputMethod(value as "dueDate" | "lastPeriod")}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dueDate">Due Date</TabsTrigger>
            <TabsTrigger value="lastPeriod">Last Period</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dueDate" className="mt-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                <span className="font-medium">Select your due date</span>
              </div>
              <CalendarComponent
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
                disabled={{ before: new Date() }}
              />
              {dueDate && (
                <div className="text-center text-sm p-2 bg-muted rounded-md">
                  Your due date is {format(dueDate, "MMMM d, yyyy")}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="lastPeriod" className="mt-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                <span className="font-medium">Select the first day of your last period</span>
              </div>
              <CalendarComponent
                mode="single"
                selected={lastPeriod}
                onSelect={setLastPeriod}
                initialFocus
                disabled={{ after: new Date() }}
              />
              {lastPeriod && (
                <div className="text-center text-sm p-2 bg-muted rounded-md">
                  Last period started on {format(lastPeriod, "MMMM d, yyyy")}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
