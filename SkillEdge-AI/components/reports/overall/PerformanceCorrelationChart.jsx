"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, Area, ComposedChart } from "recharts";
import { useState } from "react";

const PerformanceCorrelationChart = ({ data, verbalData, nonVerbalData }) => {
  const [chartType, setChartType] = useState("bar");

  if (!data || data.length === 0) return null;

  // Prepare data for different chart types
  const barChartData = data.map(item => ({
    ...item,
    positiveImpact: item.type === "positive" ? item.impact : 0,
    negativeImpact: item.type !== "positive" ? -item.impact : 0,
  }));

  const radarData = data.map(item => ({
    metric: item.metric,
    value: item.type === "positive" ? 100 - item.impact : 100 - (item.impact * 2),
    fullMark: 100
  }));

  // Prepare timeline data if available
  const timelineData = verbalData?.individual_answers?.map((answer, index) => ({
    question: `Q${index + 1}`,
    verbal: answer.correctness || 0,
    nonVerbal: nonVerbalData?.analytics?.questionScores?.[index] || 
              (nonVerbalData?.analytics?.wordsPerMinute || 140) / 2,
    gap: Math.abs((answer.correctness || 0) - ((nonVerbalData?.analytics?.wordsPerMinute || 140) / 2))
  })) || [];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gradient-to-br from-gray-800/90 to-indigo-900/90 p-3 rounded-lg border border-indigo-500/30 shadow-lg">
          <p className="font-semibold text-sm">{data.metric}</p>
          <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
          <p className="text-sm mt-2">
            Impact: <span className={`font-bold ${data.type === "positive" ? "text-green-500" : "text-destructive"}`}>
              {data.type === "positive" ? "+" : "-"}{data.impact}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Performance Correlation Visualization
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1 rounded-lg text-sm transition-all ${
              chartType === "bar" 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            Impact Chart
          </button>
          <button
            onClick={() => setChartType("radar")}
            className={`px-3 py-1 rounded-lg text-sm transition-all ${
              chartType === "radar" 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            Radar View
          </button>
          {timelineData.length > 0 && (
            <button
              onClick={() => setChartType("timeline")}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                chartType === "timeline" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              Timeline
            </button>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800/50 to-indigo-900/50 p-6 rounded-xl border border-indigo-500/20">
        {chartType === "bar" && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="metric" 
                tick={{ fill: "currentColor", fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fill: "currentColor", fontSize: 12 }}
                className="text-muted-foreground"
                label={{ value: 'Impact Score', angle: -90, position: 'insideLeft', style: { fill: "currentColor" } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="positiveImpact" 
                fill="rgb(34, 197, 94)" 
                name="Positive Impact"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="negativeImpact" 
                fill="rgb(239, 68, 68)" 
                name="Negative Impact"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === "radar" && (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid strokeDasharray="3 3" className="opacity-30" />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fill: "currentColor", fontSize: 12 }}
                className="text-muted-foreground"
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fill: "currentColor", fontSize: 10 }}
                className="text-muted-foreground"
              />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {chartType === "timeline" && timelineData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="question" 
                tick={{ fill: "currentColor", fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fill: "currentColor", fontSize: 12 }}
                className="text-muted-foreground"
                label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fill: "currentColor" } }}
              />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="gap"
                fill="hsl(var(--destructive))"
                fillOpacity={0.1}
                stroke="none"
                name="Performance Gap"
              />
              <Line
                type="monotone"
                dataKey="verbal"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Verbal Score"
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="nonVerbal"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                name="Non-Verbal Score"
                dot={{ fill: "hsl(var(--accent))", r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-secondary rounded-lg">
          <p className="text-xs font-semibold mb-1">Interpretation</p>
          <p className="text-xs text-muted-foreground">
            {chartType === "bar" && "Bar heights show the magnitude of impact each factor has on your performance."}
            {chartType === "radar" && "Larger area indicates better overall performance balance."}
            {chartType === "timeline" && "Track how verbal and non-verbal scores align across questions."}
          </p>
        </div>
        <div className="p-3 bg-secondary rounded-lg">
          <p className="text-xs font-semibold mb-1">Key Pattern</p>
          <p className="text-xs text-muted-foreground">
            {data.filter(d => d.type !== "positive").length > 2 
              ? "Multiple non-verbal factors are impacting performance."
              : "Performance is generally well-balanced."}
          </p>
        </div>
        <div className="p-3 bg-secondary rounded-lg">
          <p className="text-xs font-semibold mb-1">Focus Area</p>
          <p className="text-xs text-muted-foreground">
            {data.reduce((max, item) => 
              item.type !== "positive" && item.impact > max.impact ? item : max, 
              { metric: "None", impact: 0 }
            ).metric} needs immediate attention.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PerformanceCorrelationChart;