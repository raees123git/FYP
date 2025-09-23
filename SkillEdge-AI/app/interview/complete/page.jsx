"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function InterviewComplete() {
  const [data, setData] = useState({ questions: [], answers: [] });
  const [showWordCount, setShowWordCount] = useState(false);
  const [wordFrequency, setWordFrequency] = useState({});
  const [verbalAnalysis, setVerbalAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [interviewSaved, setInterviewSaved] = useState(false);
  const isSavingRef = useRef(false);  // Use ref for immediate tracking
  const savedInterviewIdRef = useRef(null);  // Track saved interview ID
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("interviewResults");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      const parsedData = JSON.parse(raw);
      setData(parsedData);
      
      // Create a unique session ID for this interview if not exists
      const sessionId = parsedData.sessionId || `interview_${Date.now()}`;
      if (!parsedData.sessionId) {
        parsedData.sessionId = sessionId;
        localStorage.setItem("interviewResults", JSON.stringify(parsedData));
      }
      
      // Check if this interview was already saved
      const savedInterviewId = localStorage.getItem(`savedInterview_${sessionId}`);
      if (savedInterviewId) {
        setInterviewSaved(true);
        savedInterviewIdRef.current = savedInterviewId;
      }
      
      // Check if verbal analysis already exists for this session
      const existingAnalysis = localStorage.getItem(`verbalAnalysisReport_${sessionId}`);
      if (existingAnalysis) {
        try {
          const analysis = JSON.parse(existingAnalysis);
          setVerbalAnalysis(analysis);
          // Also set it in the general localStorage key for backward compatibility
          localStorage.setItem("verbalAnalysisReport", JSON.stringify(analysis));
          setAnalysisLoading(false);
          
          // Don't save here if already saved - it was saved when analysis was first generated
          if (savedInterviewId) {
            console.log("Interview already saved, skipping save on reload");
          }
        } catch (e) {
          console.error("Failed to parse existing analysis:", e);
          // If parsing fails, fetch new analysis
          fetchVerbalAnalysis(parsedData);
        }
      } else {
        // Fetch verbal analysis in the background
        fetchVerbalAnalysis(parsedData);
      }
    } catch (e) {
      console.error("Failed to parse interviewResults:", e);
      router.replace("/");
    }
  }, [router]);

  const fetchVerbalAnalysis = async (interviewData, isRetry = false) => {
    try {
      setAnalysisError(null);
      
      const response = await fetch("http://localhost:8000/api/interview/analyze-verbal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: interviewData.questions,
          answers: interviewData.answers,
          interview_type: interviewData.type || "technical",
          role: interviewData.role || "Software Engineer"
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const analysis = await response.json();
      
      // Store the analysis with session-specific key
      const sessionId = interviewData.sessionId || `interview_${Date.now()}`;
      localStorage.setItem(`verbalAnalysisReport_${sessionId}`, JSON.stringify(analysis));
      // Also store in general key for backward compatibility
      localStorage.setItem("verbalAnalysisReport", JSON.stringify(analysis));
      
      setVerbalAnalysis(analysis);
      setAnalysisLoading(false);
      setRetryCount(0);
      
      // Save interview to database after analysis is complete
      if (!interviewSaved && !isSavingRef.current && !savedInterviewIdRef.current) {
        saveInterviewToDatabase(interviewData, analysis);
      }
    } catch (error) {
      console.error("Failed to fetch verbal analysis:", error);
      
      // Implement retry logic
      if (!isRetry && retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchVerbalAnalysis(interviewData, true);
        }, 2000); // Retry after 2 seconds
      } else {
        setAnalysisError(error.message || "Failed to generate verbal analysis. Please try again later.");
        setAnalysisLoading(false);
      }
    }
  };

  // Function to save interview to database
  const saveInterviewToDatabase = async (interviewData, verbalReport) => {
    // Prevent duplicate saves using ref for immediate check
    if (interviewSaved || isSavingRef.current || savedInterviewIdRef.current) {
      console.log("Interview already saved or save in progress, skipping...");
      return;
    }
    
    // Mark as saving immediately
    isSavingRef.current = true;
    
    const sessionId = interviewData.sessionId || `interview_${Date.now()}`;
    
    // Double-check in localStorage before saving
    const existingSavedId = localStorage.getItem(`savedInterview_${sessionId}`);
    if (existingSavedId) {
      console.log("Found existing saved interview in localStorage, skipping...");
      setInterviewSaved(true);
      savedInterviewIdRef.current = existingSavedId;
      isSavingRef.current = false;
      return;
    }
    
    try {
      const saveData = {
        interview_type: interviewData.type || "technical",
        role: interviewData.role || "Software Engineer",
        questions: interviewData.questions || [],
        answers: interviewData.answers || [],
        verbal_report: verbalReport ? {
          overall_score: verbalReport.overall_score || 0,
          summary: verbalReport.summary || "",
          metrics: verbalReport.metrics || {},
          strengths: verbalReport.recommendations?.filter(r => r.toLowerCase().includes("strength") || r.toLowerCase().includes("good")) || [],
          improvements: verbalReport.recommendations?.filter(r => r.toLowerCase().includes("improve") || r.toLowerCase().includes("work on")) || verbalReport.recommendations || []
        } : null,
        nonverbal_report: null  // Will be updated later when non-verbal report is generated
      };

      const response = await fetch("/api/reports/save-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saveData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Interview saved successfully:", result);
        setInterviewSaved(true);
        
        // Store the interview ID for future updates
        if (result.data?.interview_id) {
          savedInterviewIdRef.current = result.data.interview_id;
          localStorage.setItem("lastInterviewId", result.data.interview_id);
          localStorage.setItem(`savedInterview_${sessionId}`, result.data.interview_id);
        }
      } else {
        console.error("Failed to save interview");
        isSavingRef.current = false;  // Reset on failure
      }
    } catch (error) {
      console.error("Error saving interview to database:", error);
      isSavingRef.current = false;  // Reset on error
    } finally {
      // Always reset the saving flag after operation completes
      isSavingRef.current = false;
    }
  };

  const { questions, answers } = data;

  // Function to calculate word frequency from all answers
  const calculateWordFrequency = () => {
    const allText = answers.join(" ");
    const words = allText.split(/\s+/);
    const frequency = {};
    
    words.forEach(word => {
      if (word) { // Skip empty strings
        const cleanWord = word.toLowerCase();
        frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
      }
    });
    
    // Sort by frequency (descending)
    const sortedFrequency = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [word, count]) => {
        acc[word] = count;
        return acc;
      }, {});
    
    setWordFrequency(sortedFrequency);
    setShowWordCount(true);
  };

  return (
    <div className="absolute top-24 left-0 w-full bg-background text-foreground min-h-screen p-8">
      <motion.h1
        className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Your Interview Review
      </motion.h1>

      {/* center everything and constrain width */}
      <div className="max-w-4xl mx-auto space-y-6">
        {questions.map((q, i) => (
          <motion.div
            key={i}
            className="bg-card p-6 rounded-xl border border-border hover:border-primary/30 transition-all"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <h2 className="text-xl font-semibold mb-2 text-primary">
              {`Question ${i + 1}`}
            </h2>
            <p className="mb-4 text-foreground">{q}</p>
            <h3 className="text-lg font-semibold mb-1 text-accent">Your Answer:</h3>
            <p className="whitespace-pre-wrap text-muted-foreground">{answers[i]}</p>
          </motion.div>
        ))}
      </div>

      {/* Report Buttons Section */}
      <div className="max-w-4xl mx-auto mt-8 bg-card p-6 rounded-xl border border-border">
        <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Interview Analysis Reports
        </h2>
        
        {/* Analysis Status Banner */}
        {analysisLoading && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-primary">
              AI is analyzing your responses... This may take a moment.
            </span>
          </div>
        )}
        {analysisError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">
                Analysis failed: {analysisError}
              </span>
            </div>
            <div className="flex justify-center mt-2">
              <button
                onClick={() => {
                  setAnalysisLoading(true);
                  setAnalysisError(null);
                  setRetryCount(0);
                  fetchVerbalAnalysis(data);
                }}
                className="px-4 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg text-sm transition-all"
              >
                Retry Analysis
              </button>
            </div>
          </div>
        )}
        {!analysisLoading && !analysisError && verbalAnalysis && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500">
              Analysis complete! Your verbal report is ready.
            </span>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => {
              if (verbalAnalysis) {
                router.push("/interview/reports/verbal");
              }
            }}
            disabled={analysisLoading || analysisError}
            className={`px-6 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
              analysisLoading 
                ? "bg-primary/50 text-primary-foreground/70 cursor-wait" 
                : analysisError
                ? "bg-destructive/50 text-destructive-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 hover:shadow-primary/25 cursor-pointer"
            }`}
          >
            {analysisLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Preparing Analysis...
              </>
            ) : analysisError ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Analysis Failed
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Verbal Report
              </>
            )}
          </button>
          <button
            onClick={() => {
              // Store the current interview data for the non-verbal report
              const reportData = {
                questions,
                answers,
                timestamp: new Date().toISOString()
              };
              localStorage.setItem("interviewReportData", JSON.stringify(reportData));
              router.push("/interview/reports/non-verbal");
            }}
            className="px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-accent/25"
          >
            Non-Verbal Report
          </button>
          <button
            onClick={() => {
              // Store the current interview data for the overall feedback report
              const reportData = {
                questions,
                answers,
                timestamp: new Date().toISOString()
              };
              localStorage.setItem("interviewReportData", JSON.stringify(reportData));
              router.push("/interview/reports/overall-feedback");
            }}
            className={`px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2 ${
              analysisLoading 
                ? "bg-gradient-to-r from-primary/50 to-accent/50 text-white/70 cursor-wait" 
                : analysisError
                ? "bg-destructive/50 text-destructive-foreground cursor-not-allowed"
                : "bg-gradient-to-r from-primary to-accent text-white hover:scale-105 hover:shadow-accent/25 cursor-pointer"
            }`}
            disabled={analysisLoading || analysisError}
          >
            {analysisLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing Analysis...</span>
              </>
            ) : analysisError ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Analysis Failed</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Overall Feedback</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Word Frequency Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={calculateWordFrequency}
          className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-primary/25"
        >
          {showWordCount ? "Refresh Word Count" : "Show Word Count"}
        </button>
      </div>

      {/* Word Frequency Display */}
      {showWordCount && (
        <motion.div
          className="max-w-4xl mx-auto mt-8 bg-card p-6 rounded-xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Word Frequency Analysis
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
            {Object.entries(wordFrequency).map(([word, count], index) => (
              <motion.div
                key={index}
                className="bg-secondary p-2 rounded-lg text-center hover:bg-secondary/80 transition-colors"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
              >
                <span className="text-sm text-muted-foreground break-all">{word}</span>
                <span className="block text-lg font-semibold text-primary">{count}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 text-center text-muted-foreground">
            Total unique words: {Object.keys(wordFrequency).length}
          </div>
        </motion.div>
      )}

      <div className="flex justify-center mt-8">
        <button
          onClick={() => {
            localStorage.removeItem("interviewResults");
            router.push("/");
          }}
          className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-primary/25"
        >
          Back to Home
        </button>
      </div>
    </div>

  );
}
