"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle, Zap } from "lucide-react";

const ImpactAnalysisCards = ({ correlations }) => {
  if (!correlations) return null;

  // Calculate total impact scores
  const impacts = [
    {
      name: "Speech Rate",
      score: correlations.speechRateImpact?.score || 0,
      level: correlations.speechRateImpact?.level || "neutral",
      areas: correlations.speechRateImpact?.affectedAreas || []
    },
    {
      name: "Filler Words",
      score: correlations.fillerWordsImpact?.score || 0,
      level: correlations.fillerWordsImpact?.level || "neutral",
      severity: correlations.fillerWordsImpact?.severity || "low",
      areas: correlations.fillerWordsImpact?.affectedAreas || []
    },
    {
      name: "Pause Pattern",
      score: correlations.pausePatternImpact?.score || 0,
      level: correlations.pausePatternImpact?.level || "neutral",
      pattern: correlations.pausePatternImpact?.pattern || "Balanced",
      areas: correlations.pausePatternImpact?.affectedAreas || []
    },
    {
      name: "Confidence",
      score: correlations.confidenceCorrelation?.score || 0,
      alignment: correlations.confidenceCorrelation?.alignment || "misaligned",
      trend: correlations.confidenceCorrelation?.trend || "stable"
    },
    {
      name: "Fluency",
      score: correlations.fluencyImpact?.score || 0,
      level: correlations.fluencyImpact?.level || "fair",
      issues: correlations.fluencyImpact?.issues || []
    }
  ];

  const positiveImpacts = impacts.filter(i => i.score > 0);
  const negativeImpacts = impacts.filter(i => i.score < 0).sort((a, b) => a.score - b.score);
  const totalPositive = positiveImpacts.reduce((sum, i) => sum + i.score, 0);
  const totalNegative = Math.abs(negativeImpacts.reduce((sum, i) => sum + i.score, 0));

  const getImpactColor = (score) => {
    if (score > 0) return "text-green-500";
    if (score < -20) return "text-destructive";
    if (score < 0) return "text-accent";
    return "text-muted-foreground";
  };

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Impact Analysis
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Positive Impacts */}
        <motion.div
          className="bg-green-500/5 border border-green-500/30 rounded-xl p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">Positive Factors</h3>
            </div>
            <span className="text-2xl font-bold text-green-500">+{totalPositive}</span>
          </div>
          
          {positiveImpacts.length > 0 ? (
            <div className="space-y-3">
              {positiveImpacts.map((impact) => (
                <div key={impact.name} className="flex items-center justify-between p-3 bg-card rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{impact.name}</span>
                  </div>
                  <span className="text-sm font-bold text-green-500">+{impact.score}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No significant positive factors identified</p>
          )}
        </motion.div>

        {/* Negative Impacts */}
        <motion.div
          className="bg-destructive/5 border border-destructive/30 rounded-xl p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold">Areas for Improvement</h3>
            </div>
            <span className="text-2xl font-bold text-destructive">-{totalNegative}</span>
          </div>
          
          {negativeImpacts.length > 0 ? (
            <div className="space-y-3">
              {negativeImpacts.slice(0, 3).map((impact) => (
                <div key={impact.name} className="flex items-center justify-between p-3 bg-card rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium">{impact.name}</span>
                    {impact.severity === "high" && (
                      <span className="px-2 py-0.5 text-xs bg-destructive/20 text-destructive rounded-full">Critical</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-destructive">{impact.score}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Excellent performance across all factors</p>
          )}
        </motion.div>
      </div>

      {/* Net Impact Summary */}
      <motion.div
        className="p-6 bg-card rounded-xl border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Net Performance Impact</h3>
          </div>
          <span className={`text-3xl font-bold ${getImpactColor(totalPositive - totalNegative)}`}>
            {totalPositive - totalNegative > 0 ? "+" : ""}{totalPositive - totalNegative}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Most Critical Issue */}
          {negativeImpacts.length > 0 && (
            <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
              <p className="text-xs font-semibold text-destructive mb-1">Most Critical Issue</p>
              <p className="text-sm font-medium">{negativeImpacts[0].name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Impact: {negativeImpacts[0].score} points
              </p>
            </div>
          )}

          {/* Biggest Strength */}
          {positiveImpacts.length > 0 && (
            <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
              <p className="text-xs font-semibold text-green-500 mb-1">Biggest Strength</p>
              <p className="text-sm font-medium">{positiveImpacts[0].name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Impact: +{positiveImpacts[0].score} points
              </p>
            </div>
          )}

          {/* Quick Win Opportunity */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs font-semibold text-primary mb-1">Quick Win</p>
            <p className="text-sm font-medium">
              {negativeImpacts.length > 0 ? `Fix ${negativeImpacts[0].name}` : "Maintain Excellence"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Potential: +{Math.abs(negativeImpacts[0]?.score || 0)} points
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-secondary rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Key Insight:</span> 
            {totalNegative > totalPositive ? (
              <> Addressing your top 2-3 improvement areas could boost your overall performance by up to <span className="font-bold text-primary">{Math.round(totalNegative * 0.7)}%</span>.</>
            ) : (
              <> Your strong performance areas are effectively compensating for minor weaknesses. Focus on maintaining these strengths while gradually improving weak areas.</>
            )}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImpactAnalysisCards;