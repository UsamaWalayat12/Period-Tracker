import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { DateRange } from "react-day-picker";
import { db, COLLECTIONS } from "@/integrations/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

interface DataExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataExportDialog({ open, onOpenChange }: DataExportDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [includePeriods, setIncludePeriods] = useState(true);

  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const exportData: Record<string, unknown> = {};
      if (includeSymptoms) {
        const symptomLogsRef = collection(db, COLLECTIONS.SYMPTOM_LOGS);
        let q = query(symptomLogsRef, where('user_id', '==', user.uid));
        if (dateRange?.from && dateRange?.to) {
          q = query(
            symptomLogsRef,
            where('user_id', '==', user.uid),
            where('date', '>=', format(dateRange.from, 'yyyy-MM-dd')),
            where('date', '<=', format(dateRange.to, 'yyyy-MM-dd'))
          );
        }
        const querySnapshot = await getDocs(q);
        exportData.symptom_logs = querySnapshot.docs.map(doc => doc.data());
      }
      if (includePeriods) {
        const periodLogsRef = collection(db, COLLECTIONS.PERIOD_LOGS);
        let q = query(periodLogsRef, where('userId', '==', user.uid));
        if (dateRange?.from && dateRange?.to) {
          q = query(
            periodLogsRef,
            where('userId', '==', user.uid),
            where('startDate', '>=', format(dateRange.from, 'yyyy-MM-dd')),
            where('endDate', '<=', format(dateRange.to, 'yyyy-MM-dd'))
          );
        }
        const querySnapshot = await getDocs(q);
        exportData.period_logs = querySnapshot.docs.map(doc => doc.data());
      }
      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exported_data.json';
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Export successful",
        description: "Your data has been exported as JSON.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Export your symptom and period logs as a JSON file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <div className="flex items-center space-x-2">
            <Checkbox id="symptoms" checked={includeSymptoms} onCheckedChange={v => setIncludeSymptoms(!!v)} />
            <Label htmlFor="symptoms">Include Symptom Logs</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="periods" checked={includePeriods} onCheckedChange={v => setIncludePeriods(!!v)} />
            <Label htmlFor="periods">Include Period Logs</Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : (
              <><Download className="mr-2 h-4 w-4" />Export</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
