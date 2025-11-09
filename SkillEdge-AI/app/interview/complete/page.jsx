"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { generateBasicNonVerbalAnalysis, createComprehensiveNonVerbalReport } from "@/app/lib/nonverbal";
import { generateOverallAnalysis } from "@/app/lib/overall";
import { useAuth } from "@/lib/auth-context";

export default function InterviewComplete() {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState({ questions: [], answers: [] });
  const [showWordCount, setShowWordCount] = useState(false);
  const [wordFrequency, setWordFrequency] = useState({});
  const [verbalAnalysis, setVerbalAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [interviewSaved, setInterviewSaved] = useState(false);
  const [nonVerbalAnalysis, setNonVerbalAnalysis] = useState(null);
  const [nonVerbalReady, setNonVerbalReady] = useState(false);
  const [overallAnalysis, setOverallAnalysis] = useState(null);
  const [databaseSaving, setDatabaseSaving] = useState(false);
  const [databaseSaved, setDatabaseSaved] = useState(false);
  const [databaseError, setDatabaseError] = useState(null);
  const [comprehensiveReportReady, setComprehensiveReportReady] = useState(false);
  const [comprehensiveNonVerbalReport, setComprehensiveNonVerbalReport] = useState(null);
  const [connectionWarmed, setConnectionWarmed] = useState(false);
  const [connectionWarming, setConnectionWarming] = useState(false);
  const isSavingRef = useRef(false);  
  const savedInterviewIdRef = useRef(null);  
  const pollingIntervalRef = useRef(null);  
  const router = useRouter();

  // Removed localStorage cleanup for comprehensive report cache (no longer used)

  useEffect(() => {
    const initializeInterview = async () => {
      const raw = localStorage.getItem("interviewResults");
      if (!raw) {
        router.replace("/");
        return;
      }
      try {
        const parsedData = JSON.parse(raw);
        setData(parsedData);

      // Create a TRULY unique session ID for this interview if not exists
      // Use Date.now() + Math.random() to ensure uniqueness even for rapid successive interviews
      const sessionId = parsedData.sessionId || `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (!parsedData.sessionId) {
        parsedData.sessionId = sessionId;
        localStorage.setItem("interviewResults", JSON.stringify(parsedData));
        console.log(`🆕 New interview session created: ${sessionId}`);
      } else {
        console.log(`🔄 Existing interview session loaded: ${parsedData.sessionId}`);
      }

      // 🚀 SINGLE CONNECTION WARMING: Prevent duplicate attempts
      if (!window.connectionWarmingStarted && !window.dbConnectionWarmed) {
        window.connectionWarmingStarted = true;
        console.log('🔥 Starting connection warming for optimized save performance...');
        setConnectionWarming(true);
        
        const warmConnection = async () => {
          try {
            console.log('🔄 Starting connection warming attempt...');
            
            const warmupResponse = await fetch('http://localhost:8000/ping', {
              method: 'GET',
              signal: AbortSignal.timeout(20000),
              headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (warmupResponse.ok && !window.dbConnectionWarmed) {
              console.log('✅ Connection established! Adding safety delay for instant saves...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log('🎯 Connection fully stabilized - save button will be instant!');
              setConnectionWarmed(true);
              setConnectionWarming(false);
              window.dbConnectionWarmed = true;
            }
          } catch (error) {
            // Only set failure state if no connection has been established yet
            if (!window.dbConnectionWarmed) {
              console.log('⚠️ Connection warming failed:', error.message);
              console.log('📝 Note: Saves will still work but may take longer');
              setConnectionWarmed(false);
              setConnectionWarming(false);
            }
          }
        };

        // Start connection warming
        setTimeout(() => warmConnection(), 100);
      } else if (window.dbConnectionWarmed) {
        console.log('💡 Connection already established from previous attempt');
        setConnectionWarmed(true);
        setConnectionWarming(false);
      } else {
        console.log('🔄 Connection warming already in progress...');
      }

      // Check if this interview was already saved
      const savedInterviewId = localStorage.getItem(`savedInterview_${sessionId}`);
      if (savedInterviewId) {
        setInterviewSaved(true);
        savedInterviewIdRef.current = savedInterviewId;
      }

      // Check if reports were already saved to database
      const reportsSaved = localStorage.getItem(`allReportsDatabaseSaved_${sessionId}`);
      if (reportsSaved === 'true') {
        setDatabaseSaved(true);
        console.log('✅ All reports already saved to database for this session');
      }

      // Check if verbal analysis already exists for this session
      const existingAnalysis = localStorage.getItem(`verbalAnalysisReport_${sessionId}`);
      const existingOverallAnalysis = localStorage.getItem(`overallAnalysisReport_${sessionId}`);
      
      // Load existing overall analysis if available
      if (existingOverallAnalysis) {
        try {
          const overall = JSON.parse(existingOverallAnalysis);
          setOverallAnalysis(overall);
          console.log('✅ Existing overall analysis loaded for session');
        } catch (e) {
          console.error("Failed to parse existing overall analysis:", e);
        }
      }
      
      // Check if we need to mark comprehensive report as ready
      // This happens when all reports are already available (e.g., on page reload)
      const checkComprehensiveReportStatus = () => {
        if (existingAnalysis && existingOverallAnalysis) {
          console.log('📋 All reports exist, ensuring comprehensive report is ready...');
          setComprehensiveReportReady(true);
          setAnalysisLoading(false); // Clear loading state since all reports are available
        }
      };
      
      // Check comprehensive status after a small delay to ensure all states are set
      setTimeout(checkComprehensiveReportStatus, 100);
      
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
          
          // Generate non-verbal analysis immediately for better UX
          await generateNonVerbalReportImmediately(parsedData);
          
          // Always generate comprehensive report (not stored in localStorage)
          // Comprehensive report is generated in the main flow
        } catch (e) {
          console.error("Failed to parse existing analysis:", e);
          // If parsing fails, fetch new analysis
          fetchVerbalAnalysis(parsedData);
        }
      } else {
        // Generate non-verbal analysis immediately for better UX
        await generateNonVerbalReportImmediately(parsedData);
        
        // Generate remaining reports (verbal and overall) in the background
        await generateAllReportsOnce(parsedData);
      }
      
      // Removed delayed cleanup of comprehensive report cache (no longer used)
      
      } catch (e) {
        console.error("Failed to parse interviewResults:", e);
        router.replace("/");
      }
    };
    
    // Execute the async initialization
    initializeInterview();
  }, [router]);

  // Function to check for newly generated reports
  const checkForNewReports = () => {
    const raw = localStorage.getItem("interviewResults");
    if (!raw) return;
    
    try {
      const parsedData = JSON.parse(raw);
      const sessionId = parsedData.sessionId;
      
      if (!sessionId) return;

      console.log('🔍 Checking for reports in session:', sessionId);

      // Check for newly generated verbal analysis
      const existingVerbalAnalysis = localStorage.getItem(`verbalAnalysisReport_${sessionId}`);
      let newVerbalAnalysis = verbalAnalysis;
      
      if (existingVerbalAnalysis && !verbalAnalysis) {
        try {
          const analysis = JSON.parse(existingVerbalAnalysis);
          console.log('🔄 New verbal analysis detected, updating state...');
          setVerbalAnalysis(analysis);
          setAnalysisLoading(false);
          setAnalysisError(null);
          newVerbalAnalysis = analysis; // Store for immediate use
        } catch (e) {
          console.error("Failed to parse newly detected verbal analysis:", e);
        }
      }

      // Check for existing overall analysis
      const existingOverallAnalysis = localStorage.getItem(`overallAnalysisReport_${sessionId}`);
      if (existingOverallAnalysis && !overallAnalysis) {
        try {
          const overall = JSON.parse(existingOverallAnalysis);
          console.log('✅ Existing overall analysis found, loading from localStorage');
          setOverallAnalysis(overall);
        } catch (e) {
          console.error("Failed to parse existing overall analysis:", e);
        }
      }

      // Note: Overall analysis is handled in the main generation flow, not here

      // If we have both verbal and non-verbal, stop analysis loading and ensure comprehensive report is ready
      if ((newVerbalAnalysis || verbalAnalysis) && nonVerbalAnalysis) {
        console.log('✅ All basic reports ready, updating states...');
        setAnalysisLoading(false);
        
        // Also check if comprehensive report should be marked as ready
        if (!comprehensiveReportReady) {
          console.log('🔄 Marking comprehensive report as ready since all reports are available');
          setComprehensiveReportReady(true);
        }
      }
    } catch (e) {
      console.error("Failed to check for new reports:", e);
    }
  };

  // Add visibility change listener to check for reports when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👀 Page became visible, checking for new reports...');
        console.log('📊 Current report states:', {
          verbal: !!verbalAnalysis,
          nonVerbal: !!nonVerbalAnalysis,
          overall: !!overallAnalysis,
          loading: analysisLoading
        });
        checkForNewReports();
        
        // Add a delayed check as a fallback
        setTimeout(() => {
          console.log('⏰ Delayed report check after visibility change...');
          checkForNewReports();
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [verbalAnalysis, nonVerbalAnalysis, overallAnalysis, analysisLoading]);

  // Add periodic polling to check for reports every 3 seconds
  useEffect(() => {
    // Only start polling if analysis is still loading and we don't have all reports
    if (analysisLoading || (!verbalAnalysis && !analysisError)) {
      console.log('🔄 Starting periodic report checking...');
      pollingIntervalRef.current = setInterval(() => {
        checkForNewReports();
      }, 3000); // Check every 3 seconds
    }

    // Cleanup interval when component unmounts or reports are ready
    return () => {
      if (pollingIntervalRef.current) {
        console.log('🛑 Stopping periodic report checking');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [analysisLoading, verbalAnalysis, analysisError]);

  // Note: Overall analysis generation is now handled in generateAllReportsOnce

  // Note: Overall analysis is now generated in the main flow, not separately

  // Note: Comprehensive report is generated in the main flow, no separate useEffect needed

  // Stop polling when all reports are ready
  useEffect(() => {
    if (verbalAnalysis && nonVerbalAnalysis && pollingIntervalRef.current) {
      console.log('✅ All reports ready, stopping polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, [verbalAnalysis, nonVerbalAnalysis]);

  // Debug logging for save button state
  useEffect(() => {
    const canSave = !!(verbalAnalysis && nonVerbalAnalysis && overallAnalysis);
    const saveButtonEnabled = !databaseSaving && !databaseSaved && !analysisLoading && !analysisError && canSave;
    
    console.log('💾 Save Button State Debug:', {
      timestamp: new Date().toLocaleTimeString(),
      canSave,
      saveButtonEnabled,
      reasons_disabled: {
        databaseSaving,
        databaseSaved,
        analysisLoading,
        analysisError: !!analysisError,
        missing_verbal: !verbalAnalysis,
        missing_nonverbal: !nonVerbalAnalysis,
        missing_overall: !overallAnalysis
      },
      reports_available: {
        verbal: !!verbalAnalysis,
        nonverbal: !!nonVerbalAnalysis,
        overall: !!overallAnalysis,
        comprehensive: !!comprehensiveNonVerbalReport
      }
    });
  }, [verbalAnalysis, nonVerbalAnalysis, overallAnalysis, databaseSaving, databaseSaved, analysisLoading, analysisError, comprehensiveNonVerbalReport]);

  // Generate non-verbal analysis immediately for better UX
  const generateNonVerbalReportImmediately = async (interviewData) => {
    try {
      console.log('🚀 Generating non-verbal analysis immediately for better UX...');
      
      // Generate basic non-verbal analysis for UI display
      const nonVerbal = await generateBasicNonVerbalAnalysis(interviewData);
      setNonVerbalAnalysis(nonVerbal);
      setNonVerbalReady(true);
      
      console.log('✅ Non-verbal report ready! User can now view it while other reports generate.');
    } catch (error) {
      console.error('❌ Failed to generate immediate non-verbal analysis:', error);
      // Don't set error state here, just log it - let the main flow handle errors
    }
  };

  // SINGLE GENERATION FLOW: Generate all 3 reports in sequence
  const generateAllReportsOnce = async (interviewData) => {
    // Prevent duplicate execution
    if (window.generatingReports) {
      console.log('🔄 Report generation already in progress, skipping...');
      return;
    }
    
    window.generatingReports = true;
    
    try {
      console.log('🎯 Starting SINGLE report generation flow...');
      
      // STEP 1: Generate verbal analysis
      console.log('📝 Step 1: Generating verbal analysis...');
      const verbal = await fetchVerbalAnalysis(interviewData);
      if (!verbal) {
        console.error('❌ Failed to generate verbal analysis');
        return;
      }
      console.log('✅ Verbal analysis generated:', verbal.overall_score);
      
      // STEP 2: Generate basic non-verbal analysis
      console.log('🎤 Step 2: Generating non-verbal analysis...');
      const nonVerbal = await generateBasicNonVerbalAnalysis(interviewData);
      setNonVerbalAnalysis(nonVerbal);
      setNonVerbalReady(true);
      console.log('✅ Non-verbal analysis generated');
      
      // STEP 3: Generate comprehensive non-verbal report (for database)
      console.log('📊 Step 3: Generating comprehensive non-verbal report...');
      const comprehensiveData = createComprehensiveNonVerbalReport(
        nonVerbal.analytics,
        nonVerbal.audioMetrics
      );
      setComprehensiveNonVerbalReport(comprehensiveData);
      setComprehensiveReportReady(true);
      console.log('✅ Comprehensive non-verbal report generated:', {
        hasConfidenceScores: !!comprehensiveData.confidenceScores,
        overallConfidence: comprehensiveData.confidenceScores?.overallConfidence
      });
      
      // STEP 4: Generate overall analysis using both reports
      console.log('� Step 4: Generating overall analysis...');
      const overall = generateOverallAnalysis(verbal, comprehensiveData, interviewData);
      setOverallAnalysis(overall);
      
      // Save to localStorage
      const sessionId = interviewData.sessionId;
      if (sessionId) {
        localStorage.setItem(`overallAnalysisReport_${sessionId}`, JSON.stringify(overall));
      }
      
      console.log('✅ Overall analysis generated:', {
        overall_score: overall.overall_score,
        verbal_score: overall.verbal_score,
        nonverbal_score: overall.nonverbal_score,
        interview_readiness: overall.interview_readiness
      });
      
      console.log('🎉 ALL REPORTS GENERATED SUCCESSFULLY!');
      
      // Warm database connection for faster saves
      try {
        await fetch('http://localhost:8000/ping', {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        console.log('✅ Database connection warmed');
        window.dbConnectionWarmed = true;
      } catch (e) {
        console.log('⚠️ Database warming failed, but reports are ready');
      }
      
    } catch (error) {
      console.error('🔴 Failed to generate reports:', error);
      setAnalysisError('Failed to generate reports: ' + error.message);
      setAnalysisLoading(false);
    } finally {
      window.generatingReports = false;
    }
  };

  // Generate comprehensive report when verbal analysis already exists
  // Note: Comprehensive report generation is now handled in generateAllReportsOnce
  
  
  // Optimized function to save all reports (verbal, non-verbal, and overall) to database
  const saveAllReportsToDatabase = async () => {
    if (databaseSaving || databaseSaved) {
      console.log('Save already in progress or completed, skipping...');
      return;
    }

    // Check if we have the essential reports available
    console.log('🔍 Validating reports for database save...');
    console.log('📊 Current report state:', {
      hasVerbalAnalysis: !!verbalAnalysis,
      hasNonVerbalAnalysis: !!nonVerbalAnalysis,
      hasOverallAnalysis: !!overallAnalysis,
      hasComprehensiveNonVerbalReport: !!comprehensiveNonVerbalReport,
      comprehensiveReportReady,
      analysisLoading,
      analysisError
    });

    // First check: Do we have the basic required reports?
    if (!verbalAnalysis || !nonVerbalAnalysis || !overallAnalysis) {
      console.log('⚠️ Missing basic reports - cannot save yet');
      console.log('📋 Missing reports:', {
        needsVerbal: !verbalAnalysis,
        needsNonVerbal: !nonVerbalAnalysis,
        needsOverall: !overallAnalysis
      });
      setDatabaseError('Please wait for all reports to be generated before saving.');
      return;
    }

    // Second check: Do we have comprehensive non-verbal report? If not, generate it on-demand
    let comprehensiveReport = comprehensiveNonVerbalReport;
    if (!comprehensiveReport && nonVerbalAnalysis) {
      console.log('🔧 Comprehensive report missing but basic non-verbal exists - generating on-demand...');
      try {
        comprehensiveReport = createComprehensiveNonVerbalReport(
          nonVerbalAnalysis.analytics,
          nonVerbalAnalysis.audioMetrics
        );
        setComprehensiveNonVerbalReport(comprehensiveReport);
        console.log('✅ Comprehensive report generated on-demand:', {
          hasConfidenceScores: !!comprehensiveReport.confidenceScores,
          overallConfidence: comprehensiveReport.confidenceScores?.overallConfidence
        });
      } catch (error) {
        console.error('❌ Failed to generate comprehensive report on-demand:', error);
        setDatabaseError('Failed to prepare comprehensive report. Please try again.');
        return;
      }
    }

    // Final validation: Ensure we now have all required data
    if (!comprehensiveReport) {
      console.log('⚠️ Still missing comprehensive report after on-demand generation');
      setDatabaseError('Unable to generate comprehensive report. Please refresh and try again.');
      return;
    }

    console.log('✅ All reports validated and ready for database save!');

    // START TIMING MEASUREMENT
    const startTime = performance.now();
    console.log('⏱️ Starting database save operation...');

    // Batch state updates to minimize re-renders during network request
    console.log('🔄 Setting database saving state...');
    setDatabaseSaving(true);
    setDatabaseError(null);
    
    // Add a small delay to let React finish any pending renders
    await new Promise(resolve => setTimeout(resolve, 10));

    try {
      console.log('🚀 Starting complete interview reports database save (verbal, non-verbal, and overall)...');

      const interviewData = data;
      const sessionId = interviewData.sessionId;

      if (!sessionId) {
        throw new Error('No session ID found for this interview. Please reload and try again.');
      }
      if (!user?.id) {
        throw new Error('You are not signed in. Please sign in and try again.');
      }

      console.log(`💾 Saving interview session: ${sessionId}`);

      const checkTime = performance.now();
      console.log(`⏱️ Phase 1 - Session validation: ${((checkTime - startTime) / 1000).toFixed(4)}s`);

      console.log('🎯 Preparing all 3 reports for database save...');

      // Validate all reports are ready
      console.log('� Final report validation before save:', {
        verbal_score: verbalAnalysis?.overall_score,
        nonverbal_confidence: comprehensiveReport?.confidenceScores?.overallConfidence,
        overall_score: overallAnalysis?.overall_score,
        overall_verbal_score: overallAnalysis?.verbal_score,
        overall_nonverbal_score: overallAnalysis?.nonverbal_score
      });

      // Create save payload with all reports (verbal, non-verbal, and overall)
      const saveData = {
        interview_type: interviewData.type || "technical",
        role: interviewData.role || "Software Engineer",
        questions: interviewData.questions || [],
        answers: interviewData.answers || [],
        verbal_report: verbalAnalysis,
        nonverbal_report: comprehensiveReport,
        overall_report: overallAnalysis,
        session_id: sessionId,
        created_at: new Date().toISOString()
      };

      // Calculate payload size for performance monitoring
      const payloadString = JSON.stringify(saveData);
      const payloadSizeKB = (payloadString.length / 1024).toFixed(2);

      console.log('📤 Sending payload to database...');
      console.log('📄 Payload summary:', {
        interview_type: saveData.interview_type,
        role: saveData.role,
        session_id: saveData.session_id,
        questions_count: saveData.questions?.length || 0,
        answers_count: saveData.answers?.length || 0,
        has_verbal_report: !!saveData.verbal_report,
        has_nonverbal_report: !!saveData.nonverbal_report,
        has_overall_report: !!saveData.overall_report,
        payload_size_kb: payloadSizeKB
      });

      const networkStartTime = performance.now();
      console.log(`⏱️ Phase 2 - Starting network request at: ${((networkStartTime - startTime) / 1000).toFixed(4)}s`);
      console.log(`📦 Network payload size: ${payloadSizeKB}KB`);
      
      // Quick connection warm-up (non-blocking)
      try {
        console.log('� Quick connection test before save...');
        await fetch('http://localhost:8000/ping', {
          method: 'GET',
          signal: AbortSignal.timeout(2000) // 2-second quick test
        });
        console.log('✅ Connection test successful - proceeding with optimized save');
      } catch (pingError) {
        console.log('⚠️ Connection test failed, but continuing with save:', pingError.message);
      }

      // Proceed with save - use Next.js API route which handles JWT authentication
      const response = await fetch('/api/reports/save-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payloadString,
      });

      console.log('⚡ Database save completed using pre-warmed connection!');

      const networkEndTime = performance.now();
      const networkLatency = networkEndTime - networkStartTime;
      console.log('🎯 Response headers received, starting response processing...');

      console.log('📥 Database response:', response.status, response.statusText);
      console.log(`⏱️ Phase 2 - Network request completed: ${(networkLatency / 1000).toFixed(4)}s`);

      if (response.ok) {
        const result = await response.json();

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const responseProcessingTime = endTime - networkEndTime;

        console.log(`⏱️ Phase 3 - Response processing: ${(responseProcessingTime / 1000).toFixed(4)}s`);
        console.log(`🏁 TOTAL DATABASE SAVE TIME: ${(totalTime / 1000).toFixed(4)}s`);

        setDatabaseSaved(true);
        
        // Mark all reports as saved for this session to persist across page reloads
        const sessionId = data.sessionId || `interview_${Date.now()}`;
        localStorage.setItem(`allReportsDatabaseSaved_${sessionId}`, 'true');
        console.log(`✅ Marked all reports (verbal, non-verbal, and overall) as saved for session: ${sessionId}`);

        if (result.data?.interview_id) {
          // Keep currentInterviewId for navigation/use elsewhere
          localStorage.setItem('currentInterviewId', result.data.interview_id);
        }

      } else {
        const errorText = await response.text();
        console.error('⚠️ Database save failed:', response.status, response.statusText, errorText);
        setDatabaseError(`Failed to save: ${response.statusText}`);
      }

    } catch (error) {
      const errorTime = performance.now();
      const totalErrorTime = errorTime - startTime;

      if (error.name === 'AbortError') {
        console.error(`🕐 Request timed out after ${(totalErrorTime / 1000).toFixed(4)}s`);
        setDatabaseError('Request timed out. Please try again.');
      } else {
        console.error(`🔴 Database save error after ${(totalErrorTime / 1000).toFixed(4)}s:`, error);
        setDatabaseError(error.message || 'Failed to save to database');
      }
    } finally {
      const finalTime = performance.now();
      console.log(`⏱️ Operation completed in ${((finalTime - startTime) / 1000).toFixed(4)}s`);
      setDatabaseSaving(false);
    }
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
        {analysisLoading && !verbalAnalysis && (
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
                  generateAllReportsOnce(data);
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
        {nonVerbalReady && nonVerbalAnalysis && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-500">
              Non-verbal analysis complete! Your report is ready to view.
            </span>
          </div>
        )}
        {overallAnalysis && verbalAnalysis && (
          <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-purple-500">
              Overall analysis complete! Your comprehensive feedback is ready.
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
            disabled={!nonVerbalReady}
            className={`px-6 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
              !nonVerbalReady
                ? "bg-accent/50 text-accent-foreground/70 cursor-wait"
                : "bg-accent hover:bg-accent/90 text-accent-foreground hover:scale-105 hover:shadow-accent/25 cursor-pointer"
            }`}
          >
            {!nonVerbalReady ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Non-Verbal Report
              </>
            )}
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
              (!verbalAnalysis || !overallAnalysis) && !analysisError
                ? "bg-gradient-to-r from-primary/50 to-accent/50 text-white/70 cursor-wait" 
                : analysisError
                ? "bg-destructive/50 text-destructive-foreground cursor-not-allowed"
                : "bg-gradient-to-r from-primary to-accent text-white hover:scale-105 hover:shadow-accent/25 cursor-pointer"
            }`}
            disabled={(!verbalAnalysis || !overallAnalysis) || analysisError}
          >
            {(!verbalAnalysis || !overallAnalysis) && !analysisError ? (
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
      
      {/* Save to Database Section */}
      <div className="max-w-4xl mx-auto mt-8 bg-card p-6 rounded-xl border border-border">
        <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Save Reports to Database
        </h2>
        
        {/* Database Save Status */}
        {databaseSaved && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500">
              ✅ All interview reports (verbal, non-verbal, and overall) saved to database successfully!
            </span>
          </div>
        )}
        
        {databaseError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">
                Database save error: {databaseError}
              </span>
            </div>
            <div className="flex justify-center mt-2">
              <button
                onClick={() => {
                  setDatabaseError(null);
                  saveAllReportsToDatabase();
                }}
                className="px-4 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg text-sm transition-all"
              >
                Retry Save
              </button>
            </div>
          </div>
        )}
        
        <div className="flex justify-center">
          <button
            onClick={saveAllReportsToDatabase}
            disabled={databaseSaving || databaseSaved || analysisLoading || analysisError || !verbalAnalysis || !nonVerbalAnalysis || !overallAnalysis}
            className={`px-8 py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 text-lg font-semibold ${
              databaseSaving 
                ? "bg-yellow-500/50 text-yellow-100 cursor-wait" 
                : databaseSaved
                ? "bg-green-500/50 text-green-100 cursor-not-allowed"
                : analysisLoading || analysisError || !verbalAnalysis || !nonVerbalAnalysis || !overallAnalysis
                ? "bg-gray-500/50 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-105 hover:shadow-xl cursor-pointer"
            }`}
          >
            {databaseSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving to Database...
              </>
            ) : databaseSaved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Saved to Database
              </>
            ) : analysisLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing Reports...
              </>
            ) : analysisError ? (
              <>
                <AlertCircle className="w-5 h-5" />
                Analysis Failed
              </>
            ) : !verbalAnalysis || !nonVerbalAnalysis || !overallAnalysis ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing Reports...
              </>

            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Save All Reports to Database
              </>
            )}
          </button>
        </div>
        
        <p className="text-center text-muted-foreground text-sm mt-3">
          {databaseSaved 
            ? "Your complete interview analysis (verbal, non-verbal, and overall reports) has been permanently stored in the database."
            : !verbalAnalysis || !nonVerbalAnalysis || !overallAnalysis
            ? "Please wait while we prepare your comprehensive reports for instant database saving..."
            : "Click to save your complete interview analysis including verbal, non-verbal, and overall reports to the database."
          }
        </p>
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