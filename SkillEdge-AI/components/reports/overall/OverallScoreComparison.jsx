"use client";

import { motion } from "framer-motion";
import { Brain, Mic, Link, TrendingUp } from "lucide-react";

const OverallScoreComparison = ({ verbalScore, nonVerbalScore, correlationStrength }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-accent";
    return "text-destructive";
  };

  const getCorrelationColor = (strength) => {
    const value = parseFloat(strength);
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-primary";
    if (value >= 40) return "text-accent";
    return "text-destructive";
  };

  const getProgressWidth = (score) => `${Math.min(100, Math.max(0, score))}%`;

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Verbal Score Card */}
        <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Verbal Performance</h3>
            </div>
            <span className={`text-3xl font-bold ${getScoreColor(verbalScore)}`}>
              {verbalScore}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60"
              initial={{ width: 0 }}
              animate={{ width: getProgressWidth(verbalScore) }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Content, structure, and knowledge
          </p>
        </div>

        {/* Non-Verbal Score Card */}
        <div className="bg-card p-6 rounded-xl border border-border hover:border-accent/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Non-Verbal Performance</h3>
            </div>
            <span className={`text-3xl font-bold ${getScoreColor(nonVerbalScore)}`}>
              {Math.round(nonVerbalScore)}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-accent/60"
              initial={{ width: 0 }}
              animate={{ width: getProgressWidth(nonVerbalScore) }}
              transition={{ duration: 1, delay: 0.4 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Delivery, fluency, and confidence
          </p>
        </div>

        {/* Correlation Strength Card */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-xl border border-primary/30 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Correlation Strength</h3>
            </div>
            <span className={`text-3xl font-bold ${getCorrelationColor(correlationStrength)}`}>
              {correlationStrength}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-accent to-primary"
              initial={{ width: 0 }}
              animate={{ width: getProgressWidth(correlationStrength) }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Alignment between content & delivery
          </p>
        </div>
      </div>

      {/* Overall Assessment */}
      <motion.div
        className="mt-6 p-4 bg-card rounded-xl border border-border"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">Overall Assessment</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          {correlationStrength >= 80 ? (
            <>
              <span className="text-green-500 font-semibold">Excellent alignment!</span> Your verbal content and non-verbal delivery are well-synchronized, creating impactful communication.
            </>
          ) : correlationStrength >= 60 ? (
            <>
              <span className="text-primary font-semibold">Good balance</span> with room for improvement. Focus on better aligning your delivery with your content knowledge.
            </>
          ) : verbalScore > nonVerbalScore ? (
            <>
              <span className="text-accent font-semibold">Content-strong profile:</span> Your knowledge exceeds your delivery skills. Prioritize improving non-verbal communication.
            </>
          ) : (
            <>
              <span className="text-accent font-semibold">Delivery-strong profile:</span> Your presentation style is good but needs stronger content depth.
            </>
          )}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default OverallScoreComparison;