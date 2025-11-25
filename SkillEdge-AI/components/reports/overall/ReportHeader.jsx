"use client";

import { motion } from "framer-motion";
import { FileText, Calendar, Target } from "lucide-react";

const ReportHeader = ({ timestamp, readiness, summaryText }) => {
  return (
    <motion.div
      className="mb-8 text-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
        Overall Performance Analysis
      </h1>
      <p className="text-lg text-muted-foreground mb-6">
        Comprehensive analysis of your interview performance correlating verbal and non-verbal communication
      </p>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm">Integrated Analysis Report</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
          <Calendar className="w-4 h-4 text-accent" />
          <span className="text-sm">
            {timestamp ? new Date(timestamp).toLocaleDateString() : new Date().toLocaleDateString()}
          </span>
        </div>
        {readiness && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
            <Target className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-green-500">{readiness}</span>
          </div>
        )}
      </div>
      
      <div className="mt-6 max-w-3xl mx-auto space-y-4">
        {summaryText && (
          <div className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-accent">Performance Summary</h3>
            </div>
            <p className="text-sm text-foreground font-medium">
              {summaryText}
            </p>
          </div>
        )}
        
        <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            This report analyzes the <span className="font-semibold text-primary">causal relationships</span> between 
            your non-verbal behaviors and verbal performance, providing <span className="font-semibold text-accent">actionable insights</span> to 
            enhance your overall interview effectiveness.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportHeader;