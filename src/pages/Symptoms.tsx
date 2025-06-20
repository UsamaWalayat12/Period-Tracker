import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SymptomForm } from "@/components/symptom-form";
import { SymptomHistory } from "@/components/symptom-history";
import { SymptomChart } from "@/components/symptom-chart";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TrackSymptomDialog } from "@/components/track-symptom-dialog";

const Symptoms = () => {
  const [activeTab, setActiveTab] = useState("track");
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [openTrackDialog, setOpenTrackDialog] = useState(false);
  
  const handleSymptomSuccess = () => {
    // Switch to history tab and refresh the data
    setActiveTab("history");
    setRefreshHistory(prev => prev + 1);
  };
  
  return (
    <div className="page-container pb-32">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold">Symptom Tracker</h1>
        <p className="text-muted-foreground">Monitor your symptoms throughout your cycle</p>
      </div>
      
      <Tabs defaultValue="track" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="track">Track Symptoms</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="track">
          <SymptomForm onSuccess={handleSymptomSuccess} />
        </TabsContent>
        
        <TabsContent value="history">
          <div className="space-y-6">
            <h2 className="text-lg font-medium">Recent Symptoms</h2>
            <SymptomHistory key={refreshHistory} days={14} />
            
            <div className="pt-4">
              <h2 className="text-lg font-medium mb-3">Pattern Insights</h2>
              <div className="space-y-3">
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Your Common Symptoms</h3>
                  <p className="text-sm text-muted-foreground">
                    Track more entries to receive personalized insights about your symptoms patterns.
                  </p>
                </div>
                
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Cycle Correlations</h3>
                  <p className="text-sm text-muted-foreground">
                    Continue logging your symptoms to see how they correlate with different phases of your cycle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="trends">
          <div className="space-y-6">
            <h2 className="text-lg font-medium">Symptom Trends</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize how your symptoms, mood, and sleep patterns change over time
            </p>
            
            <SymptomChart key={refreshHistory} days={30} />
            
            <p className="text-xs text-muted-foreground mt-4">
              Note: This chart shows data from the past 30 days. The more regularly you track your symptoms,
              the more accurate your trend visualization will be.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Fixed floating button for quick symptom tracking */}
      <div className="fixed bottom-20 right-4 z-10">
        <Button 
          size="lg" 
          className="rounded-full w-12 h-12 shadow-lg" 
          onClick={() => setOpenTrackDialog(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Track symptom dialog */}
      <TrackSymptomDialog 
        open={openTrackDialog} 
        onOpenChange={setOpenTrackDialog}
        onSuccess={handleSymptomSuccess}
      />
    </div>
  );
};

export default Symptoms;
