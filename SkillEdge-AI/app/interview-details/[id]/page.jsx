"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Briefcase, 
  FileText, 
  MessageSquare,
  BarChart3,
  User,
  Loader2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { VerbalReportViewer } from "../../../components/reports/VerbalReportViewer";
import { NonVerbalReportViewer } from "../../../components/reports/NonVerbalReportViewer";
import { OverallReportViewer } from "../../../components/reports/OverallReportViewer";

export default function InterviewDetailsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch interview details
  useEffect(() => {
    if (interviewId && isAuthenticated && !authLoading) {
      fetchInterviewDetails();
    }
  }, [interviewId, isAuthenticated, authLoading]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the component if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const fetchInterviewDetails = async () => {
    try {
      const response = await fetch(`/api/reports/interview/${interviewId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Interview not found");
          router.push("/past-interviews");
          return;
        }
        throw new Error("Failed to fetch interview details");
      }

      const data = await response.json();
      setInterviewData(data);
    } catch (error) {
      console.error("Error fetching interview details:", error);
      toast.error("Failed to load interview details");
      router.push("/past-interviews");
    } finally {
      setLoading(false);
    }
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

  const getInterviewTypeColor = (type) => {
    switch (type) {
      case "technical":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "behavioral":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "resume":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getInterviewTypeIcon = (type) => {
    switch (type) {
      case "technical":
        return "💻";
      case "behavioral":
        return "🗣️";
      case "resume":
        return "📄";
      default:
        return "📝";
    }
  };

  const handleReportClick = (reportType) => {
    if (!interviewData?.has_reports?.[reportType]) {
      toast.error(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report not available`);
      return;
    }
    setSelectedReport(reportType);
  };

  const ReportViewer = ({ type, data }) => {
    if (!data) return null;

    switch (type) {
      case 'verbal':
        return <VerbalReportViewer data={data} />;
      case 'nonverbal':
        return <NonVerbalReportViewer data={data} />;
      case 'overall':
        return <OverallReportViewer 
          data={data} 
          verbalData={interviewData?.verbal_report}
          nonVerbalData={interviewData?.nonverbal_report}
        />;
      default:
        return null;
    }
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

  if (!interviewData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-20 h-20 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Interview not found</h3>
          <Link href="/past-interviews">
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              Back to Past Interviews
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const { interview, verbal_report, nonverbal_report, overall_report, has_reports } = interviewData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 max-w-7xl"
      >
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link href="/past-interviews">
            <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Past Interviews
            </button>
          </Link>
        </motion.div>

        {/* Interview Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getInterviewTypeColor(interview.interview_type)}`}
                >
                  <span className="text-lg">{getInterviewTypeIcon(interview.interview_type)}</span>
                  {interview.interview_type?.charAt(0).toUpperCase() + interview.interview_type?.slice(1)}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {interview.role}
              </h1>
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(interview.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{interview.questions?.length || 0} Questions</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reports Selection */}
        {!selectedReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Available Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Verbal Report */}
              <motion.button
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleReportClick('verbal')}
                disabled={!has_reports?.verbal}
                className={`p-6 rounded-xl text-left transition-all duration-300 ${
                  has_reports?.verbal
                    ? 'bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 cursor-pointer'
                    : 'bg-gray-700/30 border border-gray-600/30 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">Verbal Analysis</h3>
                </div>
                <p className="text-gray-400 mb-4">
                  Detailed analysis of your verbal responses, communication skills, and content quality.
                </p>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-medium">
                    {has_reports?.verbal ? 'View Report' : 'Report Not Available'}
                  </span>
                </div>
              </motion.button>

              {/* Non-Verbal Report */}
              <motion.button
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleReportClick('nonverbal')}
                disabled={!has_reports?.nonverbal}
                className={`p-6 rounded-xl text-left transition-all duration-300 ${
                  has_reports?.nonverbal
                    ? 'bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 cursor-pointer'
                    : 'bg-gray-700/30 border border-gray-600/30 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-8 h-8 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">Non-Verbal Analysis</h3>
                </div>
                <p className="text-gray-400 mb-4">
                  Analysis of your body language, facial expressions, voice tone, and overall presentation.
                </p>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 font-medium">
                    {has_reports?.nonverbal ? 'View Report' : 'Report Not Available'}
                  </span>
                </div>
              </motion.button>

              {/* Overall Report */}
              <motion.button
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleReportClick('overall')}
                disabled={!has_reports?.overall}
                className={`p-6 rounded-xl text-left transition-all duration-300 ${
                  has_reports?.overall
                    ? 'bg-green-500/20 border border-green-500/30 hover:border-green-500/50 cursor-pointer'
                    : 'bg-gray-700/30 border border-gray-600/30 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="w-8 h-8 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Overall Feedback</h3>
                </div>
                <p className="text-gray-400 mb-4">
                  Comprehensive overview combining verbal and non-verbal analysis with overall performance scores.
                </p>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">
                    {has_reports?.overall ? 'View Report' : 'Report Not Available'}
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Report Viewer */}
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report
              </h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Back to Reports
              </button>
            </div>
            
            <ReportViewer 
              type={selectedReport} 
              data={
                selectedReport === 'verbal' ? verbal_report :
                selectedReport === 'nonverbal' ? nonverbal_report :
                overall_report
              } 
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}