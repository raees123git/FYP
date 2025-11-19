"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Award,
  Calendar,
  Loader2,
  BookOpen,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import {
  ProgressLineChart,
  SkillComparisonRadar,
  SkillBarChart,
} from "@/components/progress/ProgressCharts";
import SkillTrendsGrid from "@/components/progress/SkillTrendsGrid";
import ProgressInsights from "@/components/progress/ProgressInsights";

export default function ProgressDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/analytics/dashboard");

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const result = await response.json();
      console.log("📊 Dashboard data received:", result);
      // API route returns data directly, not wrapped in {data: ...}
      setDashboardData(result);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!dashboardData || !dashboardData.trends) return [];

    return dashboardData.trends.map((trend) => ({
      ...trend,
      date: new Date(trend.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
  };

  const prepareSkillRadarData = () => {
    if (!dashboardData || !dashboardData.skill_breakdown) return [];

    return Object.entries(dashboardData.skill_breakdown).map(([key, value]) => ({
      skill: key.replace(/_/g, " ").toUpperCase(),
      average_score: value.average_score,
    }));
  };

  const prepareSkillBarData = () => {
    if (!dashboardData || !dashboardData.verbal_breakdown) return [];

    console.log("🔍 Raw verbal_breakdown:", dashboardData.verbal_breakdown);
    console.log("🔍 Entries:", Object.entries(dashboardData.verbal_breakdown));
    
    const data = Object.entries(dashboardData.verbal_breakdown).map(([key, value]) => ({
      skill: key.replace(/_/g, " ").charAt(0).toUpperCase() + key.replace(/_/g, " ").slice(1),
      average_score: value.average_score,
    }));
    
    console.log("📊 Bar chart data (verbal):", data);
    return data;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData || dashboardData.total_interviews === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-12 border border-gray-700 text-center"
          >
            <BookOpen className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Start Your Progress Journey
            </h2>
            <p className="text-gray-400 text-lg mb-6">
              Complete your first interview to unlock progress tracking and analytics!
            </p>
            <a
              href="/interview-type"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <Activity className="w-5 h-5" />
              Start Interview
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  const chartData = prepareChartData();
  const radarData = prepareSkillRadarData();
  const barData = prepareSkillBarData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 max-w-7xl"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 mt-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
            Progress Tracking & Analytics
          </h1>
          <p className="text-gray-400 text-lg">
            Track your improvement and achieve your interview goals
          </p>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/20 to-blue-700/20 rounded-xl p-6 border border-blue-500/30"
          >
            <div className="flex items-center justify-between mb-3">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold text-blue-400">
                {dashboardData.statistics.average_score.toFixed(0)}
              </span>
            </div>
            <h3 className="text-white font-semibold mb-1">Average Score</h3>
            <p className="text-gray-400 text-sm">Overall performance</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/20 to-green-700/20 rounded-xl p-6 border border-green-500/30"
          >
            <div className="flex items-center justify-between mb-3">
              <Award className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold text-green-400">
                {dashboardData.statistics.best_score.toFixed(0)}
              </span>
            </div>
            <h3 className="text-white font-semibold mb-1">Best Score</h3>
            <p className="text-gray-400 text-sm">Your highest achievement</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 rounded-xl p-6 border border-purple-500/30"
          >
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-bold text-purple-400">
                {dashboardData.total_interviews}
              </span>
            </div>
            <h3 className="text-white font-semibold mb-1">Total Interviews</h3>
            <p className="text-gray-400 text-sm">Practice sessions completed</p>
          </motion.div>


        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ProgressLineChart
            data={chartData}
            title="Performance Trends Over Time"
          />
          <SkillComparisonRadar data={radarData} title="Skill Comparison" />
        </div>

        {/* Skill Bar Chart */}
        <div className="mb-8">
          <SkillBarChart
            data={barData}
            title="Verbal Skills Analysis"
          />
        </div>

        {/* Recent Performance */}
        {dashboardData.recent_performance &&
          dashboardData.recent_performance.recent_interviews && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">
                  Recent Performance
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400 mb-2">
                    Average Overall (Last 5)
                  </p>
                  <p className="text-3xl font-bold text-blue-400">
                    {dashboardData.recent_performance.average_overall.toFixed(1)}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400 mb-2">
                    Average Verbal (Last 5)
                  </p>
                  <p className="text-3xl font-bold text-green-400">
                    {dashboardData.recent_performance.average_verbal.toFixed(1)}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400 mb-2">
                    Average Non-Verbal (Last 5)
                  </p>
                  <p className="text-3xl font-bold text-purple-400">
                    {dashboardData.recent_performance.average_nonverbal.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Recent Interviews
                </h3>
                {dashboardData.recent_performance.recent_interviews.map(
                  (interview, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/30 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {interview.role} - {interview.interview_type}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {new Date(interview.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-blue-400 font-bold">
                          {interview.overall_score.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          )}

        {/* Skill Trends Grid */}
        {dashboardData.skill_breakdown && (
          <div className="mb-8">
            <SkillTrendsGrid skillBreakdown={dashboardData.skill_breakdown} />
          </div>
        )}

        {/* AI-Powered Insights */}
        <div className="mb-8">
          <ProgressInsights dashboardData={dashboardData} />
        </div>
      </motion.div>
    </div>
  );
}
