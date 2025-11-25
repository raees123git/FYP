"use client";

import { motion } from "framer-motion";
import { BookOpen, Lightbulb, TrendingUp, Users, Award } from "lucide-react";
// REMOVED: import { generateOverallReportData, downloadOverallReport } from "./utils"; - now using official overall analysis data

const ActionRecommendations = ({ verbalData, nonVerbalData, correlations, actionItems }) => {
  // SIMPLIFIED: Use official overall analysis data
  const storedOverallAnalysis = localStorage.getItem("overallAnalysis");
  const overallData = storedOverallAnalysis ? JSON.parse(storedOverallAnalysis) : null;
  
  if (!actionItems || actionItems.length === 0) return null;

  const handleDownloadReport = () => {
    // Simple download functionality 
    const reportContent = `
Overall Performance Analysis
===========================
Verbal Score: ${overallData?.verbal_score || 0}
Non-Verbal Score: ${overallData?.nonverbal_score || 0}
Overall Score: ${overallData?.overall_score || 0}

Action Items:
${actionItems.map(item => `- ${item.item} (Priority: ${item.priority})`).join('\n')}

Generated: ${new Date().toLocaleString()}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'overall-analysis-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getIcon = (priority) => {
    if (priority === "immediate") return <TrendingUp className="w-5 h-5 text-destructive" />;
    if (priority === "high") return <Lightbulb className="w-5 h-5 text-accent" />;
    return <BookOpen className="w-5 h-5 text-primary" />;
  };

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
    >
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Comprehensive Recommendations
      </h2>

      <div className="grid gap-4 mb-6">
        {actionItems.map((item, index) => (
          <motion.div
            key={index}
            className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20 hover:border-primary/30 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="flex items-start gap-4">
              {getIcon(item.priority)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{item.item}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.priority === "immediate" ? "bg-destructive/20 text-destructive" :
                    item.priority === "high" ? "bg-accent/20 text-accent" :
                    "bg-primary/20 text-primary"
                  }`}>
                    {item.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Category: {item.category || "General"}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <Award className="w-3 h-3 text-green-500" />
                  <span className="text-green-500 font-semibold">
                    Focus Area: {item.category}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Simplified Practice Section */}
      {actionItems.length > 0 && (
        <motion.div
          className="mb-6 p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Focus Areas
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {actionItems.map((item, index) => (
              <div key={index} className="p-3 bg-gradient-to-br from-gray-800/50 to-indigo-900/50 rounded-lg border border-indigo-500/20">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium">{item.item}</p>
                  <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                    {item.priority}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 bg-secondary rounded-full">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Resources and Next Steps */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
          <h4 className="font-semibold mb-3">📚 Recommended Resources</h4>
          <ul className="space-y-2">
            <li className="text-sm text-muted-foreground">
              • Practice mock interviews with AI feedback
            </li>
            <li className="text-sm text-muted-foreground">
              • Record yourself answering common questions
            </li>
            <li className="text-sm text-muted-foreground">
              • Join speaking clubs or practice groups
            </li>
            <li className="text-sm text-muted-foreground">
              • Study successful interview examples
            </li>
          </ul>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
          <h4 className="font-semibold mb-3">🎯 Your Next Steps</h4>
          <ol className="space-y-2">
            <li className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">1.</span> Focus on your most critical issue first
            </li>
            <li className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">2.</span> Practice daily exercises for 2 weeks
            </li>
            <li className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">3.</span> Record progress and adjust approach
            </li>
            <li className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">4.</span> Take another assessment to measure improvement
            </li>
          </ol>
        </div>
      </motion.div>

      {/* Download Button */}
      <motion.div
        className="mt-8 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <button
          onClick={handleDownloadReport}
          className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
        >
          <BookOpen className="w-5 h-5" />
          Download Complete Report
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ActionRecommendations;