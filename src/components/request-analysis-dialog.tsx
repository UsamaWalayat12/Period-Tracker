
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Send } from "lucide-react";

interface RequestAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestAnalysisDialog({ open, onOpenChange }: RequestAnalysisDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [analysisType, setAnalysisType] = useState<string>("cycle");
  const [providerType, setProviderType] = useState<string>("gynecologist");
  const [concerns, setConcerns] = useState<string>("");
  
  const handleSubmit = () => {
    if (!analysisType || !providerType) {
      toast({
        title: "Missing information",
        description: "Please select the type of analysis and provider",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call to submit request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      toast({
        title: "Analysis requested",
        description: "Your request has been submitted successfully",
        variant: "default"
      });
      
      // Reset form and close dialog after a delay
      setTimeout(() => {
        setIsSuccess(false);
        setAnalysisType("cycle");
        setProviderType("gynecologist");
        setConcerns("");
        onOpenChange(false);
      }, 2000);
    }, 1500);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Professional Analysis</DialogTitle>
          <DialogDescription>
            Get personalized insights about your cycle from healthcare professionals.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="analysis-type">Analysis Type</Label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger>
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cycle">Cycle Irregularities</SelectItem>
                <SelectItem value="fertility">Fertility Assessment</SelectItem>
                <SelectItem value="hormonal">Hormonal Balance</SelectItem>
                <SelectItem value="symptoms">Symptom Pattern Analysis</SelectItem>
                <SelectItem value="general">General Health Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="provider-type">Provider Type</Label>
            <Select value={providerType} onValueChange={setProviderType}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gynecologist">Gynecologist</SelectItem>
                <SelectItem value="fertility">Fertility Specialist</SelectItem>
                <SelectItem value="endocrinologist">Endocrinologist</SelectItem>
                <SelectItem value="midwife">Midwife</SelectItem>
                <SelectItem value="np">Nurse Practitioner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="concerns">Specific Concerns (Optional)</Label>
            <Textarea
              id="concerns"
              placeholder="Describe any specific concerns or questions you have..."
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="bg-muted/50 p-3 rounded-md text-sm space-y-2">
            <p className="font-medium">How this works:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-sm">
              <li>Your encrypted health data will be shared with a qualified healthcare professional</li>
              <li>You'll receive personalized insights within 2-3 business days</li>
              <li>Follow-up consultations are available if needed</li>
            </ol>
          </div>
          
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="font-medium">Price</p>
              <p className="text-sm text-muted-foreground">Professional analysis fee</p>
            </div>
            <p className="font-medium">$29.99</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isSuccess}>
            {isSubmitting ? "Processing..." : isSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Submitted!
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Request Analysis
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
