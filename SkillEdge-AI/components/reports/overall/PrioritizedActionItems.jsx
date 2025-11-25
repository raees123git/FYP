"use client";

import { motion } from "framer-motion";
import { Target, Clock, AlertTriangle, CheckSquare, ChevronRight, Zap } from "lucide-react";
import { useState } from "react";

const PrioritizedActionItems = ({ actionItems }) => {
  const [expandedItem, setExpandedItem] = useState(null);

  if (!actionItems || actionItems.length === 0) return null;

  // Get dynamic values from stored overall analysis
  const storedOverallAnalysis = typeof localStorage !== 'undefined' ? localStorage.getItem("overallAnalysis") : null;
  const overallData = storedOverallAnalysis ? JSON.parse(storedOverallAnalysis) : null;
  const estimatedTime = overallData?.estimated_time_to_complete || "4-6 weeks";
  const proTip = overallData?.pro_tip || "Focus on completing the top 2 critical actions first for maximum impact on your interview performance.";

  const getImpactIcon = (priority) => {
    if (priority === "high") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (priority === "medium") return <Zap className="w-4 h-4 text-accent" />;
    return <Target className="w-4 h-4 text-primary" />;
  };

  const getImpactColor = (priority) => {
    if (priority === "high") return "border-destructive/50 bg-destructive/5";
    if (priority === "medium") return "border-accent/50 bg-accent/5";
    return "border-primary/30 bg-primary/5";
  };

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Prioritized Action Plan
      </h2>

      <div className="space-y-4">
        {actionItems.map((item, index) => (
          <motion.div
            key={`action-${index}-${item.item?.substring(0, 20) || index}`}
            className={`rounded-xl border ${getImpactColor(item.priority)} overflow-hidden transition-all`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <div
              className="p-4 cursor-pointer hover:bg-indigo-500/10 transition-colors"
              onClick={() => setExpandedItem(expandedItem === index ? null : index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border">
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>
                    {getImpactIcon(item.priority)}
                    <span className="px-2 py-1 text-xs bg-secondary rounded-full">
                      {item.category}
                    </span>
                    <span className="px-2 py-1 text-xs bg-card rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.priority}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{item.item}</h3>
                  <p className="text-sm text-muted-foreground">Priority: {item.priority} | Category: {item.category}</p>
                </div>
                <ChevronRight 
                  className={`w-5 h-5 transition-transform ${
                    expandedItem === index ? "rotate-90" : ""
                  }`} 
                />
              </div>
            </div>

            {expandedItem === index && (
              <motion.div
                className="px-4 pb-4 border-t border-border/50"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
              >
                <div className="pt-4 space-y-4">
                  {/* Action Details */}
                  <div className="p-3 bg-card rounded-lg">
                    <p className="text-xs font-semibold mb-2 text-primary">Action Item:</p>
                    <p className="text-sm">{item.item}</p>
                  </div>


                  {/* Progress Tracking */}
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs font-semibold">Expected Impact</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.abs(actionItems[index]?.score || 15)}-{Math.abs(actionItems[index]?.score || 15) + 10}% improvement
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary Card */}
      <motion.div
        className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">Action Plan Summary</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <div>
            <p className="text-xs text-muted-foreground">Total Actions</p>
            <p className="text-xl font-bold">{actionItems.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">High Priority</p>
            <p className="text-xl font-bold text-destructive">
              {actionItems.filter(i => i.priority?.toLowerCase() === "high").length}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Est. Time to Complete</p>
            <p className="text-xl font-bold">{estimatedTime}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          💡 <span className="font-semibold">Pro Tip:</span> {proTip}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default PrioritizedActionItems;