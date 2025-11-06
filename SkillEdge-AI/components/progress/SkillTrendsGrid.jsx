"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const SKILL_INFO = {
  communication: {
    name: "Communication Skills",
    description: "Your ability to articulate thoughts clearly and effectively",
    color: "#3B82F6",
    icon: "💬",
  },
  technical_knowledge: {
    name: "Technical Knowledge",
    description: "Your expertise and depth in technical concepts",
    color: "#10B981",
    icon: "💻",
  },
  filler_words: {
    name: "Filler Words Reduction",
    description: "Minimizing 'um', 'uh', and other filler words",
    color: "#F59E0B",
    icon: "🗣️",
  },
  speaking_speed: {
    name: "Speaking Speed",
    description: "Maintaining optimal speaking pace (130-150 WPM)",
    color: "#8B5CF6",
    icon: "⚡",
  },
  clarity: {
    name: "Clarity & Structure",
    description: "How well-organized and clear your responses are",
    color: "#EC4899",
    icon: "🎯",
  },
  confidence: {
    name: "Confidence Level",
    description: "Your vocal confidence and presence",
    color: "#06B6D4",
    icon: "💪",
  },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl">
        <p className="text-gray-300 font-semibold mb-1 text-sm">
          {new Date(label).toLocaleDateString()}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            Score: {entry.value.toFixed(1)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const TrendBadge = ({ trend, improvement }) => {
  if (trend === "improving") {
    return (
      <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
        <TrendingUp className="w-3 h-3" />
        <span className="text-xs font-medium">+{improvement.toFixed(1)}%</span>
      </div>
    );
  } else if (trend === "declining") {
    return (
      <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
        <TrendingDown className="w-3 h-3" />
        <span className="text-xs font-medium">{improvement.toFixed(1)}%</span>
      </div>
    );
  } else if (trend === "stable") {
    return (
      <div className="flex items-center gap-1 bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
        <Minus className="w-3 h-3" />
        <span className="text-xs font-medium">Stable</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-1 bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
        <Activity className="w-3 h-3" />
        <span className="text-xs font-medium">Need more data</span>
      </div>
    );
  }
};

const SkillCard = ({ skillKey, skillData }) => {
  const info = SKILL_INFO[skillKey] || {
    name: skillKey,
    description: "",
    color: "#3B82F6",
    icon: "📊",
  };

  // Prepare chart data
  const chartData = skillData.scores_history.map((score, index) => ({
    index: index + 1,
    score: score,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{info.icon}</span>
          <div>
            <h3 className="text-lg font-bold text-white">{info.name}</h3>
            <p className="text-sm text-gray-400">{info.description}</p>
          </div>
        </div>
        <TrendBadge trend={skillData.trend} improvement={skillData.improvement} />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Average</p>
          <p className="text-xl font-bold" style={{ color: info.color }}>
            {skillData.average_score.toFixed(1)}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Sessions</p>
          <p className="text-xl font-bold text-white">
            {skillData.total_sessions}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Best</p>
          <p className="text-xl font-bold text-green-400">
            {Math.max(...skillData.scores_history).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Mini Chart */}
      {chartData.length > 1 && (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="index"
              stroke="#6B7280"
              tick={{ fill: "#6B7280", fontSize: 10 }}
              label={{ value: "Session", position: "insideBottom", offset: -5, fill: "#6B7280", fontSize: 10 }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fill: "#6B7280", fontSize: 10 }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke={info.color}
              strokeWidth={2}
              dot={{ fill: info.color, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {chartData.length <= 1 && (
        <div className="text-center py-6 text-gray-500 text-sm">
          Complete more interviews to see trend
        </div>
      )}
    </motion.div>
  );
};

export default function SkillTrendsGrid({ skillBreakdown }) {
  if (!skillBreakdown || Object.keys(skillBreakdown).length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 text-center">
        <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Skill Data Yet</h3>
        <p className="text-gray-400">
          Complete some interviews to start tracking your skill improvements!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Skill Trends Analysis</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(skillBreakdown).map(([skillKey, skillData]) => (
          <SkillCard key={skillKey} skillKey={skillKey} skillData={skillData} />
        ))}
      </div>

      {/* Summary Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-500/30"
      >
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2">
              📈 Improving Skills
            </h4>
            <ul className="space-y-1">
              {Object.entries(skillBreakdown)
                .filter(([_, data]) => data.trend === "improving")
                .map(([key, _]) => (
                  <li key={key} className="text-sm text-gray-300">
                    • {SKILL_INFO[key]?.name || key}
                  </li>
                ))}
              {Object.entries(skillBreakdown).filter(
                ([_, data]) => data.trend === "improving"
              ).length === 0 && (
                <li className="text-sm text-gray-500">
                  Keep practicing to see improvements!
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-yellow-400 mb-2">
              🎯 Focus Areas
            </h4>
            <ul className="space-y-1">
              {Object.entries(skillBreakdown)
                .filter(([_, data]) => data.trend === "declining" || data.average_score < 60)
                .map(([key, _]) => (
                  <li key={key} className="text-sm text-gray-300">
                    • {SKILL_INFO[key]?.name || key}
                  </li>
                ))}
              {Object.entries(skillBreakdown).filter(
                ([_, data]) => data.trend === "declining" || data.average_score < 60
              ).length === 0 && (
                <li className="text-sm text-gray-500">
                  You're doing great! Keep it up! 🎉
                </li>
              )}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
