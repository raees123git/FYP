"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Brain,
  Eye,
  ChartBar,
  Calendar,
  Briefcase,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";

export default function InterviewDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [interview, setInterview] = useState(null);
  const [verbalReport, setVerbalReport] = useState(null);
  const [nonVerbalReport, setNonVerbalReport] = useState(null);
  const [overallReport, setOverallReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  useEffect(() => {
    if (id) {
      fetchInterviewDetails();
    }
  }, [id]);

  const fetchInterviewDetails = async () => {
    try {
      const response = await fetch(`/api/reports/interview/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch interview details");
      }

      const data = await response.json();
      setInterview(data.interview);
      setVerbalReport(data.verbal_report);
      setNonVerbalReport(data.nonverbal_report);
      setOverallReport(data.overall_report);  // Use the stored overall report directly
    } catch (error) {
      console.error("Error fetching interview details:", error);
      toast.error("Failed to load interview details");
      router.push("/past-interviews");
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (index) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-green-500/20 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Interview not found</p>
          <button
            onClick={() => router.push("/past-interviews")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

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
          className="mb-8"
        >
          <button
            onClick={() => router.push("/past-interviews")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Interviews
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Interview Details
              </h1>
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  <span className="text-lg">{interview.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{formatDate(interview.created_at)}</span>
                </div>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              interview.interview_type === "technical" 
                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                : interview.interview_type === "behavioral"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-purple-500/20 text-purple-400 border-purple-500/30"
            }`}>
              {interview.interview_type?.charAt(0).toUpperCase() + 
               interview.interview_type?.slice(1)} Interview
            </div>
          </div>
        </motion.div>

        {/* Reports Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Verbal Report Card */}
          {verbalReport && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 cursor-pointer hover:border-blue-500/50 transition-all"
              onClick={() => setSelectedReport("verbal")}
            >
              <div className="flex items-center justify-between mb-4">
                <Brain className="w-8 h-8 text-blue-400" />
                <span className={`text-2xl font-bold ${getScoreColor(verbalReport.overall_score)}`}>
                  {verbalReport.overall_score}%
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Verbal Report</h3>
              <p className="text-gray-400 text-sm mb-4">{verbalReport.summary?.substring(0, 100)}...</p>
              <button className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
                View Full Report →
              </button>
            </motion.div>
          )}

          {/* Non-Verbal Report Card */}
          {nonVerbalReport && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 cursor-pointer hover:border-green-500/50 transition-all"
              onClick={() => setSelectedReport("nonverbal")}
            >
              <div className="flex items-center justify-between mb-4">
                <Eye className="w-8 h-8 text-green-400" />
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-400">
                    {nonVerbalReport.analytics?.wordsPerMinute || 0}
                  </span>
                  <span className="text-sm text-gray-400 block">WPM</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Non-Verbal Report</h3>
              <p className="text-gray-400 text-sm mb-4">
                Speech Rate: {nonVerbalReport.analytics?.speechRate || 'N/A'}, 
                Filler Words: {nonVerbalReport.analytics?.fillerPercentage || 0}%
              </p>
              <button className="text-green-400 text-sm hover:text-green-300 transition-colors">
                View Full Report →
              </button>
            </motion.div>
          )}

          {/* Overall Report Card */}
          {overallReport && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 cursor-pointer hover:border-purple-500/50 transition-all"
              onClick={() => setSelectedReport("overall")}
            >
              <div className="flex items-center justify-between mb-4">
                <ChartBar className="w-8 h-8 text-purple-400" />
                <span className={`text-2xl font-bold ${getScoreColor(overallReport.overall_score)}`}>
                  {overallReport.overall_score}%
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Overall Report</h3>
              <p className="text-gray-400 text-sm mb-4">{overallReport.summary}</p>
              <button className="text-purple-400 text-sm hover:text-purple-300 transition-colors">
                View Full Report →
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Questions and Answers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Interview Questions & Answers</h2>
          
          <div className="space-y-4">
            {interview.questions?.map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-700/50 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full px-6 py-4 bg-gray-800/50 hover:bg-gray-800/70 transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-400 font-semibold">Q{index + 1}.</span>
                    <span className="text-white">{question}</span>
                  </div>
                  {expandedQuestions.has(index) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedQuestions.has(index) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 py-4 bg-gray-900/30 border-t border-gray-700/50"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-green-400 font-semibold">A{index + 1}.</span>
                        <p className="text-gray-300 leading-relaxed">
                          {interview.answers?.[index] || "No answer provided"}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Report Modal */}
      <AnimatePresence>
        {selectedReport && (
          <ReportModal
            type={selectedReport}
            report={
              selectedReport === "verbal"
                ? verbalReport
                : selectedReport === "nonverbal"
                ? nonVerbalReport
                : overallReport
            }
            onClose={() => setSelectedReport(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Report Modal Component
function ReportModal({ type, report, onClose }) {
  if (!report) return null;

  const getTitle = () => {
    switch (type) {
      case "verbal":
        return "Verbal Analysis Report";
      case "nonverbal":
        return "Non-Verbal Analysis Report";
      case "overall":
        return "Overall Performance Report";
      default:
        return "Report";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "verbal":
        return <Brain className="w-8 h-8 text-blue-400" />;
      case "nonverbal":
        return <Eye className="w-8 h-8 text-green-400" />;
      case "overall":
        return <ChartBar className="w-8 h-8 text-purple-400" />;
      default:
        return <FileText className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getIcon()}
              <div>
                <h2 className="text-2xl font-semibold text-white">{getTitle()}</h2>
                <p className="text-gray-400 text-sm mt-1">Detailed performance analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Overall Score / Summary */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {type === "verbal" ? "Overall Score" : 
               type === "nonverbal" ? "Speech Analysis Summary" : 
               "Overall Performance"}
            </h3>
            {type === "nonverbal" && report.analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <span className="text-sm text-gray-400">Speech Rate</span>
                    <p className="text-xl font-bold text-white">{report.analytics.speechRate}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <span className="text-sm text-gray-400">Words/Min</span>
                    <p className="text-xl font-bold text-white">{report.analytics.wordsPerMinute}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <span className="text-sm text-gray-400">Filler Words</span>
                    <p className="text-xl font-bold text-white">{report.analytics.fillerPercentage}%</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <span className="text-sm text-gray-400">Pause Pattern</span>
                    <p className="text-xl font-bold text-white">{report.analytics.pauseAnalysis?.pattern}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  {report.analytics.speechRateDescription}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="text-5xl font-bold text-white">
                  {report.overall_score}%
                </div>
                <div className="flex-1">
                  <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                      style={{ width: `${report.overall_score}%` }}
                    />
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    {report.summary}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Metrics for Verbal Report */}
          {type === "verbal" && report.metrics && (
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(report.metrics).map(([key, value]) => (
                  <div key={key} className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">
                      {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-white">
                        {value.score}%
                      </span>
                      <span className={`text-sm ${value.score >= 70 ? "text-green-400" : "text-yellow-400"}`}>
                        {value.score >= 70 ? "Good" : "Needs Work"}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics for Non-Verbal Report */}
{type === "nonverbal" && (
  /* Speech Analytics if available */
  report.analytics && (
    <div className="bg-gray-800/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Speech Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <span className="text-gray-400 text-sm">Words Per Minute</span>
          <p className="text-2xl font-bold text-white">{report.analytics.wordsPerMinute}</p>
          <p className="text-sm text-gray-400 mt-1">{report.analytics.speechRate}</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-4">
          <span className="text-gray-400 text-sm">Filler Words</span>
          <p className="text-2xl font-bold text-white">{report.analytics.fillerPercentage}%</p>
          <p className="text-sm text-gray-400 mt-1">{report.analytics.fillerWords} total</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-4">
          <span className="text-gray-400 text-sm">Pause Pattern</span>
          <p className="text-lg font-bold text-white">{report.analytics.pauseAnalysis?.pattern}</p>
          <p className="text-sm text-gray-400 mt-1">{report.analytics.pauseAnalysis?.description}</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-4">
          <span className="text-gray-400 text-sm">Total Speaking Time</span>
          <p className="text-2xl font-bold text-white">{report.analytics.totalTime}s</p>
          <p className="text-sm text-gray-400 mt-1">{report.analytics.questionCount} questions</p>
        </div>
      </div>
    </div>
  )
)}


          {/* Strengths and Improvements */}
          {report.strengths && report.improvements && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {report.strengths.map((strength, index) => (
                    <li key={index} className="text-gray-300 flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-yellow-400" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {report.improvements.map((improvement, index) => (
                    <li key={index} className="text-gray-300 flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Overall Report Specific */}
          {type === "overall" && report && (
            <>
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Score Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Verbal Score</span>
                      <span className="text-2xl font-bold text-blue-400">{report.verbal_score}%</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-1000"
                        style={{ width: `${report.verbal_score}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Non-Verbal Score</span>
                      <span className="text-2xl font-bold text-green-400">{report.nonverbal_score}%</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-1000"
                        style={{ width: `${report.nonverbal_score}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-gray-300">
                    <span className="font-semibold text-white">Interview Readiness: </span>
                    <span className={`font-semibold ${
                      report.interview_readiness === "excellent" ? "text-green-400" :
                      report.interview_readiness === "ready" ? "text-yellow-400" :
                      report.interview_readiness === "needs improvement" ? "text-orange-400" :
                      "text-red-400"
                    }`}>
                      {report.interview_readiness}
                    </span>
                  </p>
                </div>
              </div>
              
              {/* Correlations and Insights if available */}
              {report.correlations && (
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Correlations</h3>
                  {report.correlations.overallCorrelation && (
                    <div className="mb-4 p-4 bg-gray-900/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Alignment Strength</span>
                        <span className="text-xl font-bold text-white">
                          {report.correlations.overallCorrelation.correlationStrength}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {report.correlations.overallCorrelation.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Items if available */}
              {report.action_items && report.action_items.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recommended Actions</h3>
                  <div className="space-y-3">
                    {report.action_items.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          item.priority === "high" ? "bg-red-500/20 text-red-400" :
                          item.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {item.priority}
                        </span>
                        <span className="text-gray-300 flex-1">{item.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}