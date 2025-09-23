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
  const [nonVerbalAnalysis, setNonVerbalAnalysis] = useState(null);
  const [overallAnalysis, setOverallAnalysis] = useState(null);
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
      // Generate all reports for the interview
      generateAllReports(parsedData);
    }
  } catch (e) {
    console.error("Failed to parse interviewResults:", e);
    router.replace("/");
  }
}, [router]);


  // Generate all three reports
  const generateAllReports = async (interviewData) => {
    try {
      // 1. Generate verbal analysis
      const verbal = await fetchVerbalAnalysis(interviewData);
      if (!verbal) return;
      
      // 2. Generate non-verbal analysis
      const nonVerbal = generateNonVerbalAnalysis(interviewData);
      setNonVerbalAnalysis(nonVerbal);
      
      // 3. Generate overall analysis
      const overall = generateOverallAnalysis(verbal, nonVerbal, interviewData);
      setOverallAnalysis(overall);
      
      // 4. Save all reports together to database
      if (!interviewSaved && !isSavingRef.current && !savedInterviewIdRef.current) {
        await saveAllReportsToDatabase(interviewData, verbal, nonVerbal, overall);
      }
    } catch (error) {
      console.error("Failed to generate all reports:", error);
      setAnalysisError(error.message || "Failed to generate reports. Please try again.");
      setAnalysisLoading(false);
    }
  };

  // Generate non-verbal analysis from interview data
  const generateNonVerbalAnalysis = (interviewData) => {
    const { answers, timings = [] } = interviewData;
    
    let totalWords = 0;
    let totalTime = 0;
    let fillerWords = 0;
    let detectedFillerWords = {};
    let pauses = [];
    
    const fillerWordsList = [
      "um", "uh", "like", "you know", "actually", "basically", 
      "literally", "right", "so", "well", "I mean", "kind of", 
      "sort of", "yeah", "ohh", "hmm", "huh", "er", "ah", "mm"
    ];
    
    answers.forEach((answer, index) => {
      const words = answer.trim().split(/\s+/).filter(word => word);
      totalWords += words.length;
      
      const lowerAnswer = answer.toLowerCase();
      fillerWordsList.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = lowerAnswer.match(regex);
        if (matches) {
          fillerWords += matches.length;
          detectedFillerWords[filler] = (detectedFillerWords[filler] || 0) + matches.length;
        }
      });
      
      if (timings[index]) {
        totalTime += timings[index].timeUsed || 60;
        const wpm = (timings[index].wordsSpoken / (timings[index].timeUsed / 60)) || 0;
        if (wpm < 100) pauses.push("long");
        else if (wpm > 160) pauses.push("short");
        else pauses.push("normal");
      } else {
        totalTime += 60;
        pauses.push("normal");
      }
    });
    
    const wordsPerMinute = totalTime > 0 ? Math.round((totalWords / totalTime) * 60) : 0;
    const fillerPercentage = totalWords > 0 ? ((fillerWords / totalWords) * 100).toFixed(1) : 0;
    
    // Analyze pauses
    const pauseCounts = {
      long: pauses.filter(p => p === "long").length,
      normal: pauses.filter(p => p === "normal").length,
      short: pauses.filter(p => p === "short").length
    };
    
    let pausePattern = "Balanced";
    let pauseDescription = "Your pause pattern shows good variety.";
    let pauseRecommendation = "Continue maintaining your current pause pattern.";
    
    if (pauseCounts.long > pauseCounts.normal + pauseCounts.short) {
      pausePattern = "Too Many Long Pauses";
      pauseDescription = "You tend to have lengthy pauses between thoughts.";
      pauseRecommendation = "Practice maintaining a steady flow with shorter pauses.";
    } else if (pauseCounts.short > pauseCounts.normal + pauseCounts.long) {
      pausePattern = "Rushed Speech";
      pauseDescription = "You speak with minimal pauses.";
      pauseRecommendation = "Add strategic pauses to emphasize key points.";
    }
    
    // Speech rate analysis
    let speechRate = "Good Pace";
    let speechRateColor = "text-green-400";
    let speechRateDescription = "Your speech rate is optimal for clear communication.";
    
    if (wordsPerMinute < 120) {
      speechRate = "Slow Pace";
      speechRateColor = "text-yellow-400";
      speechRateDescription = "You speak relatively slowly. Consider picking up the pace slightly to maintain engagement.";
    } else if (wordsPerMinute > 160) {
      speechRate = "Fast Pace";
      speechRateColor = "text-orange-400";
      speechRateDescription = "You speak quite quickly. Consider slowing down slightly for better clarity.";
    }
    
    // Calculate scores
    const eyeContactScore = Math.min(100, Math.max(0, 100 - (parseFloat(fillerPercentage) * 2)));
    const bodyLanguageScore = wordsPerMinute >= 120 && wordsPerMinute <= 160 ? 85 : 65;
    const voiceModulationScore = pausePattern === "Balanced" ? 90 : pausePattern === "Rushed Speech" ? 60 : 75;
    const facialExpressionsScore = 75; // Default value
    const overallConfidence = Math.round((eyeContactScore + bodyLanguageScore + voiceModulationScore + facialExpressionsScore) / 4);
    
    // Store ONLY the data that is actually displayed in the non-verbal report page
    const nonVerbalData = {
      
      // The ACTUAL data displayed in the non-verbal report (MainStatsGrid component)
      analytics: {
        // Data for Words Per Minute card
        totalWords,
        totalTime: Math.round(totalTime),
        wordsPerMinute,
        
        // Data for Speech Rate card
        speechRate,
        speechRateColor,
        speechRateDescription,
        
        // Data for Filler Words card
        fillerWords,
        fillerPercentage,
        detectedFillerWords,
        
        // Data for Pause Pattern card
        pauseAnalysis: {
          pattern: pausePattern,
          description: pauseDescription,
          type: pausePattern, // Used in the card
          recommendation: pauseRecommendation
        },
        
        // Question count for DetailedAnalysis component
        questionCount: answers.length
      }
    };
    
    // Store in localStorage for report pages
    const sessionId = interviewData.sessionId || `interview_${Date.now()}`;
    localStorage.setItem("nonVerbalAnalysis", JSON.stringify(nonVerbalData));
    localStorage.setItem(`nonVerbalAnalysis_${sessionId}`, JSON.stringify(nonVerbalData));
    
    return nonVerbalData;
  };

  // Generate overall analysis from verbal and non-verbal reports
  const generateOverallAnalysis = (verbalReport, nonVerbalReport, interviewData) => {
    const verbalScore = verbalReport?.overall_score || 0;
    const nonVerbalScore = nonVerbalReport?.overall_confidence || 0;
    const overallScore = Math.round((verbalScore + nonVerbalScore) / 2);
    
    let readiness = "needs improvement";
    if (overallScore >= 80) readiness = "excellent";
    else if (overallScore >= 70) readiness = "ready";
    else if (overallScore >= 50) readiness = "needs improvement";
    else readiness = "not ready";
    
    const correlationStrength = Math.abs(verbalScore - nonVerbalScore) <= 15 ? 85 : 
                                Math.abs(verbalScore - nonVerbalScore) <= 30 ? 60 : 40;
    
    // Determine strengths and areas for improvement
    const strengths = [];
    const improvements = [];
    
    if (verbalScore >= 80) strengths.push("Excellent technical knowledge and domain expertise");
    else if (verbalScore >= 70) strengths.push("Good understanding of concepts");
    else improvements.push("Strengthen technical knowledge and domain expertise");
    
    if (nonVerbalScore >= 80) strengths.push("Outstanding communication delivery and confidence");
    else if (nonVerbalScore >= 70) strengths.push("Good presentation skills");
    else improvements.push("Improve communication delivery and confidence");
    
    if (Math.abs(verbalScore - nonVerbalScore) <= 15) {
      strengths.push("Well-balanced content and delivery skills");
    } else if (Math.abs(verbalScore - nonVerbalScore) > 30) {
      improvements.push("Work on balancing content knowledge with presentation skills");
    }
    
    // Generate detailed correlation data
    const correlations = {
      overallCorrelation: {
        correlationStrength: correlationStrength,
        alignment: verbalScore > nonVerbalScore ? "content-strong" : "delivery-strong",
        description: correlationStrength >= 80 ? "Excellent alignment between content and delivery" :
                     correlationStrength >= 60 ? "Good balance with room for improvement" :
                     "Significant gap between content and delivery skills"
      },
      specificCorrelations: {
        knowledgeToConfidence: {
          score: Math.round(100 - Math.abs(verbalScore - nonVerbalScore)),
          description: "How well your knowledge translates to confident delivery"
        },
        structureToFluency: {
          score: verbalReport?.metrics?.response_structure?.score && nonVerbalReport?.analytics?.wordsPerMinute ?
                 Math.round((verbalReport.metrics.response_structure.score + 
                 (nonVerbalReport.analytics.wordsPerMinute >= 120 && nonVerbalReport.analytics.wordsPerMinute <= 160 ? 85 : 60)) / 2) : 70,
          description: "Alignment between answer structure and speech fluency"
        },
        vocabularyToClarity: {
          score: verbalReport?.metrics?.vocabulary_richness?.score || 70,
          description: "Technical vocabulary usage and communication clarity"
        }
      },
      performanceGaps: [
        verbalScore > nonVerbalScore + 20 ? {
          area: "Delivery Enhancement",
          gap: Math.round(verbalScore - nonVerbalScore),
          priority: "High",
          recommendation: "Focus on improving non-verbal communication to match your strong technical knowledge"
        } : null,
        nonVerbalScore > verbalScore + 20 ? {
          area: "Knowledge Depth",
          gap: Math.round(nonVerbalScore - verbalScore),
          priority: "High",
          recommendation: "Strengthen technical knowledge to match your good presentation skills"
        } : null
      ].filter(Boolean)
    };
    
    // Store ONLY the data that is displayed in the overall report page
    const overallData = {
      // Core scores displayed
      overall_score: overallScore,
      verbal_score: verbalScore,
      nonverbal_score: nonVerbalScore,
      interview_readiness: readiness,
      
      // Correlation data shown in report
      correlations: {
        overallCorrelation: {
          correlationStrength: correlationStrength,
          alignment: verbalScore > nonVerbalScore ? "content-strong" : "delivery-strong",
          description: correlationStrength >= 80 ? "Excellent alignment between content and delivery" :
                       correlationStrength >= 60 ? "Good balance with room for improvement" :
                       "Significant gap between content and delivery skills"
        }
      },
      
      // Action items displayed in the report
      action_items: [
        verbalScore < 70 ? {
          item: "Improve technical knowledge and domain expertise",
          priority: "high",
          category: "verbal"
        } : null,
        nonVerbalScore < 70 ? {
          item: "Work on communication delivery and confidence",
          priority: "high",
          category: "non-verbal"
        } : null,
        Math.abs(verbalScore - nonVerbalScore) > 30 ? {
          item: "Balance content knowledge with presentation skills",
          priority: "medium",
          category: "overall"
        } : null
      ].filter(Boolean),
      
      // Insights section
      insights: {
        strengths: strengths,
        areas_for_improvement: improvements
      },
      
      summary: `Overall performance score: ${overallScore}/100. ${readiness === 'excellent' ? 'Excellent performance! You demonstrate strong technical knowledge and communication skills.' : readiness === 'ready' ? 'Good job! You are interview ready with minor areas for improvement.' : readiness === 'needs improvement' ? 'Keep practicing to improve your interview skills.' : 'Significant preparation needed before interviews.'}`
    };
    
    // Store in localStorage for report pages
    const sessionId = interviewData.sessionId || `interview_${Date.now()}`;
    localStorage.setItem("overallAnalysis", JSON.stringify(overallData));
    localStorage.setItem(`overallAnalysis_${sessionId}`, JSON.stringify(overallData));
    
    return overallData;
  };

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
      
      // Return the analysis for further processing
      return analysis;
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

  // Function to save all reports to database at once
  const saveAllReportsToDatabase = async (interviewData, verbalReport, nonVerbalReport, overallReport) => {
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
      // Log the data we're about to save
      console.log("Preparing to save interview with reports:");
      console.log("Verbal report available:", !!verbalReport);
      console.log("Non-verbal report available:", !!nonVerbalReport);
      console.log("Overall report available:", !!overallReport);
      
      const saveData = {
        interview_type: interviewData.type || "technical",
        role: interviewData.role || "Software Engineer",
        questions: interviewData.questions || [],
        answers: interviewData.answers || [],
        verbal_report: verbalReport || null,
        nonverbal_report: nonVerbalReport || null,
        overall_report: overallReport || null
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
        console.log("Interview with all reports saved successfully:", result);
        setInterviewSaved(true);
        
        // Store the interview ID for future updates
        if (result.data?.interview_id) {
          savedInterviewIdRef.current = result.data.interview_id;
          localStorage.setItem("lastInterviewId", result.data.interview_id);
          localStorage.setItem(`savedInterview_${sessionId}`, result.data.interview_id);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to save interview:", errorData);
        console.error("Error details:", errorData.error || errorData.detail || "Unknown error");
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
                  generateAllReports(data);
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
