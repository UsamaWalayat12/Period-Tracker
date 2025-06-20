import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon, Clock, NotepadText, Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, setHours, setMinutes, isValid } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentDialog({ open, onOpenChange }: AppointmentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointmentType, setAppointmentType] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("10:00"); // Default time
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAppointment = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to save appointments.", variant: "destructive" });
      return;
    }
    if (!selectedDate || !appointmentType) {
       toast({ title: "Error", description: "Please select a date and enter the appointment type.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      let appointmentDateTime = selectedDate;
      if (isValid(appointmentDateTime)) {
         appointmentDateTime = setHours(appointmentDateTime, hours);
         appointmentDateTime = setMinutes(appointmentDateTime, minutes);
      } else {
         toast({ title: "Error", description: "Invalid date selected.", variant: "destructive" });
         setIsSaving(false);
         return;
      }

      await addDoc(collection(db, "user_appointments"), {
        userId: user.uid,
        date: Timestamp.fromDate(appointmentDateTime), // Store as Timestamp
        type: appointmentType,
        notes: notes,
        createdAt: Timestamp.now(),
      });

      toast({ title: "Appointment saved", description: "Your appointment has been logged successfully." });
      setAppointmentType("");
      setSelectedDate(new Date());
      setSelectedTime("10:00");
      setNotes("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast({ title: "Error saving appointment", description: "Failed to save your appointment. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Your Appointment</DialogTitle>
          <DialogDescription>
            Enter details for an upcoming or past pregnancy appointment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Input
              id="type"
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Ultrasound, Midwife Check-up"
            />
          </div>
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
                />
              </PopoverContent>
            </Popover>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">Time</Label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="col-span-3"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Remember to ask about..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveAppointment} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 