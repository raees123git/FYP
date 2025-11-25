"use client";

import { motion } from "framer-motion";
import { 
  Download
} from "lucide-react";

// Import all the comprehensive Overall Report components
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

export const OverallReportViewer = ({ data, verbalData, nonVerbalData }) => {
  if (!data) return null;

  // Prepare chart data from correlations
  const chartData = [
    { 
      name: "Speech Rate", 
      metric: "Speech Rate Impact",
      value: Math.abs(data.correlations?.speechRateImpact?.score || 0), 
      impact: Math.abs(data.correlations?.speechRateImpact?.score || 0),
      type: (data.correlations?.speechRateImpact?.score || 0) >= 0 ? "positive" : "negative",
      description: data.correlations?.speechRateImpact?.impact || "Speech rate analysis"
    },
    { 
      name: "Filler Words", 
      metric: "Filler Words Impact",
      value: Math.abs(data.correlations?.fillerWordsImpact?.score || 0), 
      impact: Math.abs(data.correlations?.fillerWordsImpact?.score || 0),
      type: (data.correlations?.fillerWordsImpact?.score || 0) >= 0 ? "positive" : "negative",
      description: data.correlations?.fillerWordsImpact?.impact || "Filler words analysis"
    },
    { 
      name: "Pause Pattern", 
      metric: "Pause Pattern Impact",
      value: Math.abs(data.correlations?.pausePatternImpact?.score || 0), 
      impact: Math.abs(data.correlations?.pausePatternImpact?.score || 0),
      type: (data.correlations?.pausePatternImpact?.score || 0) >= 0 ? "positive" : "negative",
      description: data.correlations?.pausePatternImpact?.impact || "Pause pattern analysis"
    },
    { 
      name: "Confidence", 
      metric: "Confidence Alignment",
      value: Math.abs(data.correlations?.confidenceCorrelation?.score || 0), 
      impact: Math.abs(data.correlations?.confidenceCorrelation?.score || 0),
      type: (data.correlations?.confidenceCorrelation?.score || 0) >= 0 ? "positive" : "negative",
      description: data.correlations?.confidenceCorrelation?.alignment || "Confidence alignment analysis"
    }
  ];

  // Get correlation strength from data (nested in correlations.overallCorrelation)
  const correlationStrength = data.correlations?.overallCorrelation?.correlationStrength || 
    data.correlationStrength || 
    data.correlation_strength || 
    0;

  // Transform nonVerbalData to match the expected structure for timeline
  const transformedNonVerbalData = nonVerbalData ? {
    analytics: {
      wordsPerMinute: nonVerbalData.wordsPerMinute,
      questionScores: Array(verbalData?.individual_answers?.length || 3).fill(null).map((_, i) => {
        // Use confidence score or calculate based on available metrics
        return nonVerbalData.confidenceScores?.overallConfidence || 
               (nonVerbalData.audioMetrics?.confidence?.average * 100) || 
               70; // fallback
      })
    }
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black text-foreground">
      <motion.div
        className="max-w-7xl mx-auto px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <ReportHeader />

        {/* Overall Score Comparison */}
        <OverallScoreComparison 
          overallScore={data.overall_score || 0}
          verbalScore={data.verbal_score || 0}
          nonVerbalScore={data.nonverbal_score || 0}
          correlationStrength={correlationStrength}
          interviewReadiness={data.interview_readiness}
        />

        {/* Insights Panel */}
        {(data.executive_summary || data.insights || data.summary) && (
          <InsightsPanel 
            executiveSummary={data.executive_summary || data.summary}
            keyStrengths={data.key_strengths || data.insights?.strengths}
            areasForImprovement={data.areas_for_improvement || data.insights?.areas_for_improvement}
          />
        )}

        {/* Correlation Analysis */}
        {data.correlations && (
          <CorrelationAnalysis correlations={data.correlations} />
        )}

        {/* Impact Analysis Cards */}
        {data.correlations && (
          <ImpactAnalysisCards correlations={data.correlations} />
        )}

        {/* Performance Correlation Chart */}
        {chartData && chartData.length > 0 && (
          <PerformanceCorrelationChart 
            data={chartData}
            verbalData={verbalData}
            nonVerbalData={transformedNonVerbalData}
          />
        )}

        {/* Prioritized Action Items */}
        {data.action_items && data.action_items.length > 0 && (
          <PrioritizedActionItems actionItems={data.action_items} />
        )}

        {/* Action Recommendations */}
        {data.correlations && (
          <ActionRecommendations correlations={data.correlations} />
        )}

      </motion.div>
    </div>
  );
};