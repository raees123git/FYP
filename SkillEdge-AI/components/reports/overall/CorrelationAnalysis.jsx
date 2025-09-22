"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Info, TrendingDown, TrendingUp } from "lucide-react";

const CorrelationAnalysis = ({ correlations }) => {
  if (!correlations) return null;

  const getImpactIcon = (level) => {
    if (level === "positive") return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (level === "negative" || level === "highly negative") return <AlertTriangle className="w-5 h-5 text-destructive" />;
    return <Info className="w-5 h-5 text-primary" />;
  };

  const getImpactColor = (level) => {
    if (level === "positive") return "border-green-500/30 bg-green-500/5";
    if (level === "highly negative") return "border-destructive/50 bg-destructive/5";
    if (level === "negative") return "border-destructive/30 bg-destructive/5";
    if (level === "slightly negative") return "border-accent/30 bg-accent/5";
    return "border-primary/30 bg-primary/5";
  };

  const analyses = [
    {
      title: "Speech Rate Impact",
      data: correlations.speechRateImpact,
      icon: "🎯",
    },
    {
      title: "Filler Words Impact",
      data: correlations.fillerWordsImpact,
      icon: "💬",
    },
    {
      title: "Pause Pattern Impact",
      data: correlations.pausePatternImpact,
      icon: "⏸️",
    },
    {
      title: "Confidence Alignment",
      data: correlations.confidenceCorrelation,
      icon: "💪",
    },
    {
      title: "Fluency Analysis",
      data: correlations.fluencyImpact,
      icon: "🌊",
    }
  ];

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Correlation Analysis
      </h2>

      <div className="grid gap-4">
        {analyses.map((analysis, index) => (
          <motion.div
            key={analysis.title}
            className={`p-6 rounded-xl border ${getImpactColor(analysis.data?.level || analysis.data?.alignment)}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl">{analysis.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{analysis.title}</h3>
                  <div className="flex items-center gap-2">
                    {getImpactIcon(analysis.data?.level || (analysis.data?.alignment === "well-aligned" ? "positive" : "negative"))}
                    {analysis.data?.score !== undefined && (
                      <span className={`font-bold ${analysis.data.score > 0 ? "text-green-500" : "text-destructive"}`}>
                        {analysis.data.score > 0 ? "+" : ""}{analysis.data.score}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {analysis.data?.description}
                </p>

                {/* Special handling for confidence correlation */}
                {analysis.data?.verbalConfidence && (
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="p-3 bg-card rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Verbal Confidence</p>
                      <p className="font-semibold text-primary">{analysis.data.verbalConfidence}%</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Non-Verbal Confidence</p>
                      <p className="font-semibold text-accent">{analysis.data.nonVerbalConfidence}%</p>
                    </div>
                  </div>
                )}

                {/* Affected areas */}
                {analysis.data?.affectedAreas && analysis.data.affectedAreas.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold mb-2">Affected Areas:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.data.affectedAreas.map((area) => (
                        <span key={area} className="px-2 py-1 text-xs bg-secondary rounded-full">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Issues for fluency */}
                {analysis.data?.issues && analysis.data.issues.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold mb-2">Identified Issues:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.data.issues.map((issue) => (
                        <span key={issue} className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-full">
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                {analysis.data?.recommendation && (
                  <div className="mt-3 p-3 bg-card rounded-lg border border-border">
                    <p className="text-xs font-semibold mb-1 text-primary">Recommendation:</p>
                    <p className="text-sm">{analysis.data.recommendation}</p>
                  </div>
                )}

                {/* Confidence trend */}
                {analysis.data?.trend && (
                  <div className="mt-2 flex items-center gap-2">
                    {analysis.data.trend === "improving" ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : analysis.data.trend === "declining" ? (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    ) : (
                      <Info className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-xs">Trend: {analysis.data.trend}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CorrelationAnalysis;