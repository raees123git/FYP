"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReportHeader, CorrelationAnalysis, ActionRecommendations, PerformanceCorrelationChart, ImpactAnalysisCards, PrioritizedActionItems } from "@/components/reports/overall";
import { Loader2 } from "lucide-react";

export default function OverallFeedbackReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verbalData, setVerbalData] = useState(null);
  const [nonVerbalData, setNonVerbalData] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Fetch verbal and non-verbal report data from localStorage
    const fetchData = async () => {
      try {
        // UPDATED: Use official overall analysis data instead of duplicate calculation system
        const storedOverallAnalysis = localStorage.getItem("overallAnalysis");
        const storedVerbalData = localStorage.getItem("verbalAnalysisReport");
        
        if (!storedOverallAnalysis || !storedVerbalData) {
          // Redirect to home if data is not available
          router.push("/");
          return;
        }
        
        const parsedOverallData = JSON.parse(storedOverallAnalysis);
        const parsedVerbalData = JSON.parse(storedVerbalData);
        
        setVerbalData(parsedVerbalData);
        
        // Use official overall analysis data
        setCorrelations(parsedOverallData.correlations);
        setActionItems(parsedOverallData.action_items || []);
        
        // Simple chart data from official analysis
        const formattedData = [
          { name: "Verbal Score", value: parsedOverallData.verbal_score, type: "positive" },
          { name: "Non-Verbal Score", value: parsedOverallData.nonverbal_score, type: "positive" },
          { name: "Overall Score", value: parsedOverallData.overall_score, type: "positive" }
        ];
        setChartData(formattedData);
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading report data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Loading your overall feedback report...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <ReportHeader />
      
      {correlations && (
        <>
          <CorrelationAnalysis correlations={correlations} />
          <PerformanceCorrelationChart data={chartData} />
          <ImpactAnalysisCards correlations={correlations} />
          <PrioritizedActionItems actionItems={actionItems} />
          <ActionRecommendations 
            verbalData={verbalData} 
            nonVerbalData={nonVerbalData} 
            correlations={correlations} 
            actionItems={actionItems} 
          />
        </>
      )}
    </div>
  );
}