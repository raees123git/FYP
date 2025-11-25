"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Lightbulb, TrendingUp } from "lucide-react";
// REMOVED: import { generateInsights } from "./utils"; - now using official overall analysis data
import { useEffect, useState } from "react";

const InsightsPanel = ({ correlations, verbalData, nonVerbalData, summaryText }) => {
  // SIMPLIFIED: Use insights from official overall analysis data stored in localStorage
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    // Get insights from the official overall analysis
    const storedOverallAnalysis = localStorage.getItem("overallAnalysis");
    if (storedOverallAnalysis) {
      try {
        const overallData = JSON.parse(storedOverallAnalysis);
        const officialInsights = [
          ...(overallData.insights?.strengths || []).map(strength => ({
            type: "positive",
            title: "Strength Identified",
            message: strength,
            impact: "positive"
          })),
          ...(overallData.insights?.areas_for_improvement || []).map(improvement => ({
            type: "opportunity", 
            title: "Improvement Opportunity",
            message: improvement,
            impact: "actionable"
          }))
        ];
        setInsights(officialInsights);
      } catch (error) {
        console.error("Error parsing overall analysis for insights:", error);
      }
    }
  }, [correlations, verbalData, nonVerbalData]);

  if (!insights || insights.length === 0) return null;

  const getInsightIcon = (type) => {
    if (type === "critical") return <AlertCircle className="w-5 h-5 text-destructive" />;
    if (type === "positive") return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (type === "opportunity") return <TrendingUp className="w-5 h-5 text-primary" />;
    return <Lightbulb className="w-5 h-5 text-accent" />;
  };

  const getInsightColor = (type) => {
    if (type === "critical") return "border-destructive/50 bg-destructive/5";
    if (type === "positive") return "border-green-500/50 bg-green-500/5";
    if (type === "opportunity") return "border-primary/50 bg-primary/5";
    return "border-accent/50 bg-accent/5";
  };

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Key Insights
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            className={`p-4 rounded-xl border ${getInsightColor(insight.type)}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="flex items-start gap-3">
              {getInsightIcon(insight.type)}
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{insight.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{insight.message || insight.description}</p>
                {insight.dataPoint && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-card rounded-lg text-xs">
                    <span className="font-mono font-semibold">{insight.dataPoint}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI-Generated Summary */}
      <motion.div
        className="mt-6 p-4 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl border border-primary/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-5 h-5 text-accent" />
          <h3 className="font-semibold">AI Analysis Summary</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {summaryText ? (
            summaryText
          ) : insights.some(i => i.type === "critical") ? (
            <>
              <span className="font-semibold text-destructive">Critical areas require immediate attention.</span> 
              {" "}Your non-verbal communication patterns are significantly impacting your overall performance. 
              Addressing the top 2 critical issues could improve your interview success rate by up to 40%.
            </>
          ) : insights.some(i => i.type === "positive") ? (
            <>
              <span className="font-semibold text-green-500">Strong performance detected!</span> 
              {" "}Your verbal and non-verbal communication show good alignment. 
              Minor refinements in identified areas will help you achieve excellence.
            </>
          ) : (
            <>
              <span className="font-semibold text-primary">Balanced performance with improvement opportunities.</span> 
              {" "}Focus on the recommended action items to enhance your overall interview effectiveness.
            </>
          )}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default InsightsPanel;