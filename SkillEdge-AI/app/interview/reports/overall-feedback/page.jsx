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
  ActionRecommendations
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
        // FIXED: Use the same overall analysis data that gets saved to database
        // This ensures UI displays the same values that are stored
        const storedOverallAnalysis = localStorage.getItem("overallAnalysis");
        const storedVerbalAnalysis = localStorage.getItem("verbalAnalysisReport");
        const storedNonVerbalAnalysis = localStorage.getItem("nonVerbalAnalysis");
        
        if (!storedOverallAnalysis || !storedVerbalAnalysis) {
          setError("Analysis data not found. Please complete the interview analysis first.");
          setLoading(false);
          return;
        }

        const parsedOverallData = JSON.parse(storedOverallAnalysis);
        const parsedVerbalData = JSON.parse(storedVerbalAnalysis);
        const parsedNonVerbalData = storedNonVerbalAnalysis ? JSON.parse(storedNonVerbalAnalysis) : null;
        
        console.log('🎯 Overall Feedback Report using SAME data as database save:', {
          verbal_score: parsedOverallData.verbal_score,
          nonverbal_score: parsedOverallData.nonverbal_score,
          overall_score: parsedOverallData.overall_score,
          correlation_strength: parsedOverallData.correlations?.overallCorrelation?.correlationStrength,
          detailed_analyses: {
            speechRate: parsedOverallData.correlations?.speechRateImpact,
            fillerWords: parsedOverallData.correlations?.fillerWordsImpact,
            pausePattern: parsedOverallData.correlations?.pausePatternImpact
          }
        });
        
        setVerbalData(parsedVerbalData);
        setNonVerbalData(parsedNonVerbalData);
        
        // Use the official overall analysis data instead of recalculating
        setCorrelations(parsedOverallData.correlations);
        setActionItems(parsedOverallData.action_items || []);
        
        // Enhanced chart data with detailed correlation analyses
        const formattedData = [
          { 
            name: "Speech Rate", 
            metric: "Speech Rate Impact",
            value: Math.abs(parsedOverallData.correlations?.speechRateImpact?.score || 0), 
            impact: Math.abs(parsedOverallData.correlations?.speechRateImpact?.score || 0),
            type: (parsedOverallData.correlations?.speechRateImpact?.score || 0) >= 0 ? "positive" : "negative",
            description: parsedOverallData.correlations?.speechRateImpact?.impact || "Speech rate analysis"
          },
          { 
            name: "Filler Words", 
            metric: "Filler Words Impact",
            value: Math.abs(parsedOverallData.correlations?.fillerWordsImpact?.score || 0), 
            impact: Math.abs(parsedOverallData.correlations?.fillerWordsImpact?.score || 0),
            type: (parsedOverallData.correlations?.fillerWordsImpact?.score || 0) >= 0 ? "positive" : "negative",
            description: parsedOverallData.correlations?.fillerWordsImpact?.impact || "Filler words analysis"
          },
          { 
            name: "Pause Pattern", 
            metric: "Pause Pattern Impact",
            value: Math.abs(parsedOverallData.correlations?.pausePatternImpact?.score || 0), 
            impact: Math.abs(parsedOverallData.correlations?.pausePatternImpact?.score || 0),
            type: (parsedOverallData.correlations?.pausePatternImpact?.score || 0) >= 0 ? "positive" : "negative",
            description: parsedOverallData.correlations?.pausePatternImpact?.impact || "Pause pattern analysis"
          },
          { 
            name: "Confidence", 
            metric: "Confidence Alignment",
            value: Math.abs(parsedOverallData.correlations?.confidenceCorrelation?.score || 0), 
            impact: Math.abs(parsedOverallData.correlations?.confidenceCorrelation?.score || 0),
            type: (parsedOverallData.correlations?.confidenceCorrelation?.score || 0) >= 0 ? "positive" : "negative",
            description: parsedOverallData.correlations?.confidenceCorrelation?.impact || "Confidence correlation analysis"
          },
          { 
            name: "Fluency", 
            metric: "Fluency Analysis",
            value: Math.abs(parsedOverallData.correlations?.fluencyImpact?.score || 0), 
            impact: Math.abs(parsedOverallData.correlations?.fluencyImpact?.score || 0),
            type: (parsedOverallData.correlations?.fluencyImpact?.score || 0) >= 0 ? "positive" : "negative",
            description: parsedOverallData.correlations?.fluencyImpact?.impact || "Fluency analysis"
          }
        ];
        setChartData(formattedData);
        
        // Create report data from the official overall analysis
        const reportData = {
          timestamp: new Date().toISOString(),
          summary: {
            nonVerbalScore: parsedOverallData.nonverbal_score, // Use the SAME score that gets saved to database
            readinessLevel: parsedOverallData.interview_readiness,
            overallScore: parsedOverallData.overall_score,
            summaryText: parsedOverallData.summary // Add the actual summary text from database
          }
        };
        setReportData(reportData);
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading report data:", error);
        setError("Failed to load report data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // REMOVED: processNonVerbalData function - no longer needed as we use the official overallAnalysis data
  // This eliminates the duplicate calculation system that was causing score mismatches
  
  // Legacy function kept for backward compatibility (not used in main flow)
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
          summaryText={reportData?.summary?.summaryText}
        />

        {/* Overall Score Comparison - Using SAME data as database save */}
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
          summaryText={reportData?.summary?.summaryText}
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
        </motion.div>
      </motion.div>
    </div>
  );
}