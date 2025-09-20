"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Home, ArrowLeft, AlertCircle } from "lucide-react";

// Import all Overall Report components
import {
  ReportHeader,
  OverallScoreComparison,
  CorrelationAnalysis,
  ImpactAnalysisCards,
  PerformanceCorrelationChart,
  InsightsPanel,
  PrioritizedActionItems,
  ActionRecommendations,
  correlateVerbalNonVerbal,
  generateActionItems,
  formatCorrelationData,
  generateOverallReportData
} from "@/components/reports/overall";

export default function OverallFeedbackReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verbalData, setVerbalData] = useState(null);
  const [nonVerbalData, setNonVerbalData] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get verbal analysis data
        const storedVerbalAnalysis = localStorage.getItem("verbalAnalysisReport");
        if (!storedVerbalAnalysis) {
          setError("Verbal analysis data not found. Please complete the verbal report first.");
          setLoading(false);
          return;
        }

        // Get interview results for non-verbal data
        const storedInterviewResults = localStorage.getItem("interviewResults");
        if (!storedInterviewResults) {
          setError("Interview data not found. Please complete an interview first.");
          setLoading(false);
          return;
        }

        const parsedVerbalData = JSON.parse(storedVerbalAnalysis);
        const parsedInterviewResults = JSON.parse(storedInterviewResults);
        
        // Process non-verbal data from interview results
        const processedNonVerbalData = processNonVerbalData(parsedInterviewResults);
        
        setVerbalData(parsedVerbalData);
        setNonVerbalData(processedNonVerbalData);
        
        // Generate correlations between verbal and non-verbal data
        const generatedCorrelations = correlateVerbalNonVerbal(parsedVerbalData, processedNonVerbalData);
        setCorrelations(generatedCorrelations);
        
        // Generate prioritized action items
        const generatedActionItems = generateActionItems(generatedCorrelations);
        setActionItems(generatedActionItems);
        
        // Format data for visualization
        const formattedData = formatCorrelationData(generatedCorrelations);
        setChartData(formattedData);
        
        // Generate overall report data
        const overallReport = generateOverallReportData(parsedVerbalData, processedNonVerbalData, generatedCorrelations, generatedActionItems);
        setReportData(overallReport);
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading report data:", error);
        setError("Failed to load report data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Process non-verbal data from interview results
  const processNonVerbalData = (interviewResults) => {
    const { answers, timings = [], audioAnalysis = [] } = interviewResults;
    
    let totalWords = 0;
    let totalTime = 0;
    let fillerWords = 0;
    let pauses = [];
    let detectedFillerWords = {};
    
    const fillerWordsList = [
      "um", "uh", "like", "you know", "actually", "basically", 
      "literally", "right", "so", "well", "I mean", "kind of", 
      "sort of", "yeah"
    ];
    
    answers.forEach((answer, index) => {
      const words = answer.trim().split(/\s+/).filter(word => word);
      totalWords += words.length;
      
      const lowerAnswer = answer.toLowerCase();
      fillerWordsList.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = lowerAnswer.match(regex);
        if (matches) {
          fillerWords += matches.length;
          detectedFillerWords[filler] = (detectedFillerWords[filler] || 0) + matches.length;
        }
      });
      
      if (timings[index]) {
        totalTime += timings[index].timeUsed || 60;
        const wpm = (timings[index].wordsSpoken / (timings[index].timeUsed / 60)) || 0;
        if (wpm < 100) pauses.push("long");
        else if (wpm > 160) pauses.push("short");
        else pauses.push("normal");
      } else {
        totalTime += 60;
        pauses.push("normal");
      }
    });
    
    const wordsPerMinute = totalTime > 0 ? Math.round((totalWords / totalTime) * 60) : 0;
    const fillerPercentage = totalWords > 0 ? ((fillerWords / totalWords) * 100).toFixed(1) : 0;
    
    // Analyze pause pattern
    const pauseCounts = {
      long: pauses.filter(p => p === "long").length,
      normal: pauses.filter(p => p === "normal").length,
      short: pauses.filter(p => p === "short").length
    };
    
    let pausePattern = "Balanced";
    if (pauseCounts.long > pauseCounts.normal + pauseCounts.short) {
      pausePattern = "Too Many Long Pauses";
    } else if (pauseCounts.short > pauseCounts.normal + pauseCounts.long) {
      pausePattern = "Rushed Speech";
    }
    
    // Process audio metrics if available
    let audioMetrics = null;
    if (audioAnalysis && audioAnalysis.length > 0) {
      const allMetrics = audioAnalysis.filter(a => a && a.metrics).flatMap(a => a.metrics);
      
      if (allMetrics.length > 0) {
        // Calculate confidence average
        const confidenceScores = allMetrics.map(m => m.confidence_score).filter(v => v !== undefined);
        const avgConfidence = confidenceScores.length > 0 
          ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length 
          : 0.5;
        
        // Determine confidence trend
        let confidenceTrend = "stable";
        if (confidenceScores.length > 2) {
          const firstHalf = confidenceScores.slice(0, Math.floor(confidenceScores.length / 2));
          const secondHalf = confidenceScores.slice(Math.floor(confidenceScores.length / 2));
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          
          if (secondAvg > firstAvg + 0.1) confidenceTrend = "improving";
          else if (secondAvg < firstAvg - 0.1) confidenceTrend = "declining";
        }
        
        audioMetrics = {
          confidence: {
            average: avgConfidence,
            trend: confidenceTrend,
            consistency: 0.7 // Default value
          }
        };
      }
    }
    
    return {
      analytics: {
        totalWords,
        totalTime: Math.round(totalTime),
        wordsPerMinute,
        fillerWords,
        fillerPercentage,
        detectedFillerWords,
        pauseAnalysis: {
          pattern: pausePattern,
          description: `Your pause pattern is ${pausePattern.toLowerCase()}.`,
          recommendation: pausePattern === "Balanced" 
            ? "Continue maintaining your current pause pattern." 
            : "Practice modulating your pause patterns for better delivery."
        },
        questionCount: answers.length
      },
      audioMetrics
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Analyzing correlations...</p>
        <p className="text-sm text-muted-foreground/70 mt-2">This comprehensive analysis may take a moment</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Analysis Error</h1>
        <p className="text-muted-foreground text-center max-w-md mb-6">{error}</p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/interview/complete")}
            className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-all"
          >
            Back to Results
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 pt-32">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <ReportHeader 
          timestamp={reportData?.timestamp} 
          readiness={reportData?.summary?.readinessLevel} 
        />

        {/* Overall Score Comparison */}
        <OverallScoreComparison
          verbalScore={verbalData?.overall_score || 0}
          nonVerbalScore={reportData?.summary?.nonVerbalScore || 0}
          correlationStrength={correlations?.overallCorrelation?.correlationStrength || 0}
        />

        {/* Key Insights Panel */}
        <InsightsPanel
          correlations={correlations}
          verbalData={verbalData}
          nonVerbalData={nonVerbalData}
        />

        {/* Correlation Analysis */}
        <CorrelationAnalysis correlations={correlations} />

        {/* Impact Analysis Cards */}
        <ImpactAnalysisCards correlations={correlations} />

        {/* Performance Correlation Chart */}
        <PerformanceCorrelationChart 
          data={chartData}
          verbalData={verbalData}
          nonVerbalData={nonVerbalData}
        />

        {/* Prioritized Action Items */}
        <PrioritizedActionItems actionItems={actionItems} />

        {/* Comprehensive Recommendations */}
        <ActionRecommendations
          verbalData={verbalData}
          nonVerbalData={nonVerbalData}
          correlations={correlations}
          actionItems={actionItems}
        />

        {/* Navigation Buttons */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center mt-8 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <button
            onClick={() => router.push("/interview/reports/verbal")}
            className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl shadow-lg transition-all hover:scale-105 flex items-center gap-2"
          >
            View Verbal Report
          </button>
          
          <button
            onClick={() => router.push("/interview/reports/non-verbal")}
            className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl shadow-lg transition-all hover:scale-105 flex items-center gap-2"
          >
            View Non-Verbal Report
          </button>
          
          <button
            onClick={() => router.push("/interview/complete")}
            className="px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-lg transition-all hover:scale-105 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Results
          </button>
          
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-primary/25 flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}