"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Zap,
} from "lucide-react";

export default function ProgressInsights({ dashboardData }) {
  if (!dashboardData) return null;

  const { skill_breakdown, statistics, recent_performance, trends } = dashboardData;

  // Calculate insights
  const insights = [];

  // Overall performance insight
  if (statistics.average_score >= 75) {
    insights.push({
      type: "success",
      icon: <Award className="w-5 h-5" />,
      title: "Excellent Performance",
      message: `Your average score of ${statistics.average_score.toFixed(1)}% shows strong interview skills!`,
      color: "green",
    });
  } else if (statistics.average_score >= 60) {
    insights.push({
      type: "info",
      icon: <Target className="w-5 h-5" />,
      title: "Good Progress",
      message: `You're doing well with ${statistics.average_score.toFixed(1)}% average. Keep practicing!`,
      color: "blue",
    });
  } else {
    insights.push({
      type: "warning",
      icon: <AlertCircle className="w-5 h-5" />,
      title: "Room for Growth",
      message: `Your average of ${statistics.average_score.toFixed(1)}% shows potential. Focus on consistent practice!`,
      color: "yellow",
    });
  }

  // Improvement trend
  if (trends && trends.length >= 3) {
    const recentScores = trends.slice(-3).map((t) => t.overall_score);
    const oldScores = trends.slice(0, 3).map((t) => t.overall_score);

    const recentAvg =
      recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const oldAvg = oldScores.reduce((a, b) => a + b, 0) / oldScores.length;
    const improvement = recentAvg - oldAvg;

    if (improvement > 5) {
      insights.push({
        type: "success",
        icon: <TrendingUp className="w-5 h-5" />,
        title: "Strong Improvement",
        message: `You've improved by ${improvement.toFixed(1)}% in your recent interviews!`,
        color: "green",
      });
    } else if (improvement < -5) {
      insights.push({
        type: "warning",
        icon: <TrendingDown className="w-5 h-5" />,
        title: "Performance Dip",
        message: `Recent scores dropped by ${Math.abs(improvement).toFixed(1)}%. Take a break and refocus!`,
        color: "yellow",
      });
    }
  }

  // Skill-specific insights
  if (skill_breakdown) {
    const improvingSkills = Object.entries(skill_breakdown)
      .filter(([_, data]) => data.trend === "improving")
      .map(([key, _]) => key.replace(/_/g, " "));

    const decliningSkills = Object.entries(skill_breakdown)
      .filter(([_, data]) => data.trend === "declining")
      .map(([key, _]) => key.replace(/_/g, " "));

    const strongSkills = Object.entries(skill_breakdown)
      .filter(([_, data]) => data.average_score >= 75)
      .map(([key, _]) => key.replace(/_/g, " "));

    const weakSkills = Object.entries(skill_breakdown)
      .filter(([_, data]) => data.average_score < 60)
      .map(([key, _]) => key.replace(/_/g, " "));

    if (improvingSkills.length > 0) {
      insights.push({
        type: "success",
        icon: <CheckCircle2 className="w-5 h-5" />,
        title: "Skills Improving",
        message: `Great job! These skills are trending up: ${improvingSkills.join(", ")}`,
        color: "green",
      });
    }

    if (strongSkills.length > 0) {
      insights.push({
        type: "success",
        icon: <Zap className="w-5 h-5" />,
        title: "Your Strengths",
        message: `You excel in: ${strongSkills.slice(0, 3).join(", ")}`,
        color: "green",
      });
    }

    if (weakSkills.length > 0) {
      insights.push({
        type: "tip",
        icon: <Lightbulb className="w-5 h-5" />,
        title: "Focus Areas",
        message: `Practice more on: ${weakSkills.slice(0, 3).join(", ")}`,
        color: "purple",
      });
    }

    if (decliningSkills.length > 0) {
      insights.push({
        type: "warning",
        icon: <AlertCircle className="w-5 h-5" />,
        title: "Needs Attention",
        message: `These skills need focus: ${decliningSkills.join(", ")}`,
        color: "orange",
      });
    }
  }

  // Practice frequency insight
  if (dashboardData.total_interviews < 5) {
    insights.push({
      type: "tip",
      icon: <Lightbulb className="w-5 h-5" />,
      title: "Practice More",
      message: "Complete at least 10 interviews to get comprehensive analytics and better insights!",
      color: "blue",
    });
  }

  const getColorClasses = (color) => {
    const colors = {
      green: "from-green-500/20 to-green-700/20 border-green-500/30",
      blue: "from-blue-500/20 to-blue-700/20 border-blue-500/30",
      yellow: "from-yellow-500/20 to-yellow-700/20 border-yellow-500/30",
      orange: "from-orange-500/20 to-orange-700/20 border-orange-500/30",
      purple: "from-purple-500/20 to-purple-700/20 border-purple-500/30",
      red: "from-red-500/20 to-red-700/20 border-red-500/30",
    };
    return colors[color] || colors.blue;
  };

  const getIconColor = (color) => {
    const colors = {
      green: "text-green-400",
      blue: "text-blue-400",
      yellow: "text-yellow-400",
      orange: "text-orange-400",
      purple: "text-purple-400",
      red: "text-red-400",
    };
    return colors[color] || colors.blue;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb className="w-6 h-6 text-yellow-400" />
        <h2 className="text-2xl font-bold text-white">AI-Powered Insights</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${getColorClasses(insight.color)} rounded-xl p-4 border`}
          >
            <div className="flex items-start gap-3">
              <div className={`${getIconColor(insight.color)} mt-1`}>
                {insight.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">{insight.title}</h3>
                <p className="text-gray-300 text-sm">{insight.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actionable Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-indigo-500/20 to-purple-700/20 rounded-xl p-6 border border-indigo-500/30 mt-6"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" />
          Next Steps to Improve
        </h3>
        <ul className="space-y-3">
          {skill_breakdown &&
            Object.entries(skill_breakdown)
              .filter(([_, data]) => data.average_score < 70)
              .slice(0, 3)
              .map(([key, data]) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="text-indigo-400 font-bold">•</span>
                  <div>
                    <p className="text-white font-medium">
                      {key.replace(/_/g, " ").charAt(0).toUpperCase() +
                        key.replace(/_/g, " ").slice(1)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Current: {data.average_score.toFixed(1)}% | Target: 75%+
                    </p>
                  </div>
                </li>
              ))}
          {(!skill_breakdown ||
            Object.entries(skill_breakdown).filter(
              ([_, data]) => data.average_score < 70
            ).length === 0) && (
            <li className="text-gray-300">
              Great job! All your skills are performing well. Keep practicing to maintain
              excellence! 🎉
            </li>
          )}
        </ul>
      </motion.div>
    </motion.div>
  );
}
