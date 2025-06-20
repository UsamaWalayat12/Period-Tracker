import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Copy, Mail, Share2, MessageCircle, FileDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { PeriodLog } from "@/integrations/firebase/types";
import jsPDF from 'jspdf';

interface CycleSummaryData {
  averageCycleLength: string;
  averagePeriodLength: string;
  cycleRegularity: string;
  shortestCycle: string;
}

interface ShareWithDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleSummary: CycleSummaryData;
  periodLogs: PeriodLog[];
}

export function ShareWithDoctorDialog({ open, onOpenChange, cycleSummary, periodLogs }: ShareWithDoctorDialogProps) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    to: new Date()
  });
  
  const [dataToShare, setDataToShare] = useState({
    periods: true,
    symptoms: true,
    moods: true
  });
  
  // Generated unique share link - in a real app, this would be a proper URL
  const shareLink = `https://app.cyclehealth.com/share/${Math.random().toString(36).substring(2, 15)}`;

  const generateReportText = () => {
    let reportText = "";
    if (cycleSummary) {
      reportText += `Cycle Summary:\n\n`;
      reportText += `- Average Cycle Length: ${cycleSummary.averageCycleLength}\n`;
      reportText += `- Average Period Length: ${cycleSummary.averagePeriodLength}\n`;
      reportText += `- Cycle Regularity: ${cycleSummary.cycleRegularity}\n`;
      reportText += `- Shortest Cycle: ${cycleSummary.shortestCycle}\n\n`;
    }
    
    return reportText;
  };

  const generatePdfBlob = (): Promise<Blob> => {
    const doc = new jsPDF();
    const reportText = generateReportText();

    let yOffset = 10;
    doc.text("Cycle Insights Report", 10, yOffset);
    yOffset += 10;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, yOffset);
    yOffset += 20;

    doc.text(reportText, 10, yOffset);
    yOffset += 50; // Adjust for spacing

    if (periodLogs.length > 0) {
      doc.text("Recent Period Logs:", 10, yOffset);
      yOffset += 10;
      periodLogs.slice(0, 5).forEach(log => {
        doc.text(`- Type: ${log.type}, Start: ${log.startDate}, End: ${log.endDate || 'N/A'}`, 10, yOffset);
        yOffset += 7;
      });
    }

    return new Promise((resolve) => {
      resolve(doc.output('blob'));
    });
  };

  const handleSharePdf = async () => {
    const pdfBlob = await generatePdfBlob();
    const pdfFile = new File([pdfBlob], "cycle_insights_report.pdf", { type: "application/pdf" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: "My Cycle Insights Report",
          text: "Here is my cycle insights report.",
        });
        toast({
          title: "Report Shared",
          description: "Your cycle insights PDF has been shared.",
          variant: "default"
        });
      } catch (error) {
        console.error("Error sharing:", error);
        toast({
          title: "Sharing Failed",
          description: "Could not share the report. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "cycle_insights_report.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Sharing not supported",
        description: "Your browser does not support sharing files. The PDF has been downloaded instead.",
        variant: "default"
      });
    }
    onOpenChange(false);
  };

  const handleShareViaWhatsApp = () => {
    const reportText = generateReportText();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(reportText + "\nCheck out my cycle insights from Lunarash Periods: " + shareLink)}`;
    window.open(whatsappUrl, "_blank");
    onOpenChange(false);
  };
  
  const handleSendEmail = () => {
    if (!doctorEmail) {
      toast({
        title: "Email required",
        description: "Please enter your doctor's email address",
        variant: "destructive"
      });
      return;
    }
    
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Date range required",
        description: "Please select a valid date range to share",
        variant: "destructive"
      });
      return;
    }
    
    setIsSharing(true);
    
    // Simulate API call to send email
    setTimeout(() => {
      setIsSharing(false);
      setIsSuccess(true);
      
      toast({
        title: "Email sent",
        description: `Share link has been sent to ${doctorEmail}`,
        variant: "default"
      });
      
      // Reset success state after a delay
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }, 1500);
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard",
      variant: "default"
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share with Doctor</DialogTitle>
          <DialogDescription>
            Create a secure link to share your health data with a healthcare provider.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Date Range to Share</Label>
            <DateRangePicker 
              date={dateRange} 
              onDateChange={setDateRange} 
            />
          </div>
          
          <div className="space-y-4">
            <Label>Data to Include</Label>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="periods" 
                  checked={dataToShare.periods} 
                  onCheckedChange={(checked) => 
                    setDataToShare({...dataToShare, periods: !!checked})
                  }
                />
                <Label htmlFor="periods" className="cursor-pointer font-normal">
                  Period Data
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="symptoms" 
                  checked={dataToShare.symptoms} 
                  onCheckedChange={(checked) => 
                    setDataToShare({...dataToShare, symptoms: !!checked})
                  }
                />
                <Label htmlFor="symptoms" className="cursor-pointer font-normal">
                  Symptoms
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="moods" 
                  checked={dataToShare.moods} 
                  onCheckedChange={(checked) => 
                    setDataToShare({...dataToShare, moods: !!checked})
                  }
                />
                <Label htmlFor="moods" className="cursor-pointer font-normal">
                  Mood & Sleep Data
                </Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="doctor-email">Doctor's Email (Optional)</Label>
            <Input
              id="doctor-email"
              type="email"
              placeholder="doctor@example.com"
              value={doctorEmail}
              onChange={(e) => setDoctorEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We'll send the secure link directly to your doctor
            </p>
          </div>
          
          {doctorEmail && (
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Include a message for your doctor..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          )}
          
          <div className="bg-muted/50 p-3 rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Secure Share Link:</p>
              {isSuccess ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Link Sent!
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4 mr-1" /> Copy Link
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground break-all">{shareLink}</p>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button onClick={handleSharePdf} variant="outline" className="w-full">
            <FileDown className="mr-2 h-4 w-4" />
            Share PDF
          </Button>
          <Button onClick={handleShareViaWhatsApp} className="w-full">
            <MessageCircle className="mr-2 h-4 w-4" />
            Share via WhatsApp
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isSharing}
            className="w-full sm:w-auto"
          >
            {isSharing ? "Sending..." : "Send via Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
