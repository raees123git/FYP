"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  AlertCircle,
  Download,
  Home,
  ArrowLeft,
  Loader2
} from "lucide-react";

// Import modular components
import ReportHeader from "@/components/reports/verbal/ReportHeader";
import OverallScoreCard from "@/components/reports/verbal/OverallScoreCard";
import PerformanceMetrics from "@/components/reports/verbal/PerformanceMetrics";
import IndividualAnswerAnalysis from "@/components/reports/verbal/IndividualAnswerAnalysis";
import RecommendationsSection from "@/components/reports/verbal/RecommendationsSection";
import { downloadReport } from "@/components/reports/verbal/utils";

export default function VerbalReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Load cached verbal analysis from localStorage
    const loadCachedReport = () => {
      try {
        // Check for cached verbal analysis
        const cachedAnalysis = localStorage.getItem("verbalAnalysisReport");
        
        if (!cachedAnalysis) {
          // If no cached analysis, redirect to complete page
          setError("No analysis found. Please complete an interview first.");
          setLoading(false);
          setTimeout(() => {
            router.push("/interview/complete");
          }, 2000);
          return;
        }

        // Parse and set the cached analysis
        const analysis = JSON.parse(cachedAnalysis);
        setReportData(analysis);
        setLoading(false);
      } catch (e) {
        console.error("Failed to load cached report:", e);
        setError("Failed to load report data");
        setLoading(false);
      }
    };

    loadCachedReport();
  }, [router]);

  const handleDownloadReport = () => {
    downloadReport(reportData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Analyzing your responses...</p>
        <p className="text-sm text-muted-foreground/70 mt-2">This may take a moment</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Analysis Failed</h1>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <button
          onClick={() => router.push("/interview/complete")}
          className="mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all"
        >
          Back to Results
        </button>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 pt-32">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <ReportHeader />

        {/* Overall Score Card */}
        <OverallScoreCard 
          overallScore={reportData.overall_score}
          summary={reportData.summary}
          readiness={reportData.interview_readiness}
        />

        {/* Performance Metrics Grid */}
        <PerformanceMetrics metrics={reportData.metrics} />

        {/* Individual Answer Analysis */}
        <IndividualAnswerAnalysis answers={reportData.individual_answers} />

        {/* Recommendations */}
        <RecommendationsSection recommendations={reportData.recommendations} />

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <button
            onClick={handleDownloadReport}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-primary/25 flex items-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Report
          </button>
          
          <button
            onClick={() => router.push("/interview/complete")}
            className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl shadow-lg transition-all hover:scale-105 flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Results
          </button>
          
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-accent/25 flex items-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
