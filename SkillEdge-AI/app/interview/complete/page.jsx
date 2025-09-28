"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { generateBasicNonVerbalAnalysis, createComprehensiveNonVerbalReport } from "@/app/lib/nonverbal";
import { generateOverallAnalysis } from "@/app/lib/overall";
import { useUser } from "@clerk/nextjs";

export default function InterviewComplete() {
  const { user } = useUser();
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
  const isSavingRef = useRef(false);  // Use ref for immediate tracking
  const savedInterviewIdRef = useRef(null);  // Track saved interview ID
  const pollingIntervalRef = useRef(null);  // Track polling interval
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

      // Check if non-verbal report was already saved to database
      const nonVerbalSaved = localStorage.getItem(`nonVerbalDatabaseSaved_${sessionId}`);
      if (nonVerbalSaved === 'true') {
        setDatabaseSaved(true);
        console.log('✅ Non-verbal report already saved to database for this session');
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
          await generateComprehensiveReport(parsedData);
        } catch (e) {
          console.error("Failed to parse existing analysis:", e);
          // If parsing fails, fetch new analysis
          fetchVerbalAnalysis(parsedData);
        }
      } else {
        // Generate non-verbal analysis immediately for better UX
        await generateNonVerbalReportImmediately(parsedData);
        
        // Generate remaining reports (verbal and overall) in the background
        await generateAllReports(parsedData);
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
          console.log('🔄 Existing overall analysis found, loading...');
          setOverallAnalysis(overall);
        } catch (e) {
          console.error("Failed to parse existing overall analysis:", e);
        }
      }

      // Generate overall analysis if we have both reports but no existing overall (use latest values)
      if (newVerbalAnalysis && nonVerbalAnalysis && !overallAnalysis && !existingOverallAnalysis) {
        console.log('🔄 Generating overall analysis from available reports...');
        console.log('📊 Report data available:', {
          verbalScore: newVerbalAnalysis?.overall_score,
          nonVerbalScore: nonVerbalAnalysis?.overall_confidence
        });
        try {
          const overall = generateOverallAnalysis(newVerbalAnalysis, nonVerbalAnalysis, parsedData);
          console.log('📊 Generated overall analysis:', overall);
          setOverallAnalysis(overall);
          localStorage.setItem(`overallAnalysisReport_${sessionId}`, JSON.stringify(overall));
          console.log('✅ Overall analysis generated and saved successfully');
        } catch (e) {
          console.error("Failed to generate overall analysis:", e);
        }
      }

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

  // Generate overall analysis when both verbal and non-verbal reports become available
  useEffect(() => {
    if (verbalAnalysis && nonVerbalAnalysis && !overallAnalysis) {
      const raw = localStorage.getItem("interviewResults");
      if (raw) {
        try {
          const parsedData = JSON.parse(raw);
          const sessionId = parsedData.sessionId;
          console.log('🎯 Both reports available, generating overall analysis...');
          const overall = generateOverallAnalysis(verbalAnalysis, nonVerbalAnalysis, parsedData);
          setOverallAnalysis(overall);
          
          // Store overall analysis in localStorage for persistence
          if (sessionId) {
            localStorage.setItem(`overallAnalysisReport_${sessionId}`, JSON.stringify(overall));
            console.log('💾 Overall analysis saved to localStorage for session:', sessionId);
          }
          console.log('✅ Overall analysis generated from state update');
        } catch (e) {
          console.error("Failed to generate overall analysis:", e);
        }
      }
    }
  }, [verbalAnalysis, nonVerbalAnalysis, overallAnalysis]);

  // Generate comprehensive report when all basic reports are available
  useEffect(() => {
    if (verbalAnalysis && nonVerbalAnalysis && !comprehensiveReportReady && !comprehensiveNonVerbalReport) {
      console.log('🎯 All basic reports available, generating comprehensive report...');
      try {
        let comprehensiveData;
        if (typeof window !== 'undefined' && window.createComprehensiveNonVerbalReport) {
          comprehensiveData = window.createComprehensiveNonVerbalReport(
            nonVerbalAnalysis.analytics,
            nonVerbalAnalysis.audioMetrics
          );
        } else {
          comprehensiveData = createComprehensiveNonVerbalReport(
            nonVerbalAnalysis.analytics,
            nonVerbalAnalysis.audioMetrics
          );
        }
        setComprehensiveNonVerbalReport(comprehensiveData);
        setComprehensiveReportReady(true);
        setAnalysisLoading(false); // Ensure loading state is cleared
        console.log('✅ Comprehensive report generated after report detection!');
      } catch (error) {
        console.error('🔴 Failed to generate comprehensive report after detection:', error);
      }
    }
  }, [verbalAnalysis, nonVerbalAnalysis, comprehensiveReportReady, comprehensiveNonVerbalReport]);

  // Stop polling when all reports are ready
  useEffect(() => {
    if (verbalAnalysis && nonVerbalAnalysis && pollingIntervalRef.current) {
      console.log('✅ All reports ready, stopping polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, [verbalAnalysis, nonVerbalAnalysis]);

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

  // Generate all three reports without localStorage cache for comprehensive data
  const generateAllReports = async (interviewData) => {
    // Prevent duplicate execution during database save
    if (databaseSaving) {
      console.log('🚫 Blocking generateAllReports during database save to prevent interference');
      return;
    }
    
    // If we already have comprehensive report ready, don't regenerate
    if (comprehensiveReportReady && comprehensiveNonVerbalReport) {
      console.log('✅ Reports already generated, skipping regeneration');
      return;
    }
    
    // Prevent duplicate execution (React Strict Mode protection)
    if (window.generatingAllReports) {
      console.log('🔄 generateAllReports already in progress, skipping duplicate...');
      return;
    }
    
    window.generatingAllReports = true;
    
    try {
      console.log('🎯 Starting generateAllReports execution');
      // 1. Generate verbal analysis
      const verbal = await fetchVerbalAnalysis(interviewData);
      if (!verbal) return;
      
      // 2. Use existing non-verbal analysis or generate if not available
      let nonVerbal = nonVerbalAnalysis;
      if (!nonVerbal) {
        console.log('🔄 Non-verbal analysis not found, generating now...');
        nonVerbal = await generateBasicNonVerbalAnalysis(interviewData);
        setNonVerbalAnalysis(nonVerbal);
        setNonVerbalReady(true);
      } else {
        console.log('✅ Using existing non-verbal analysis');
      }
      
      // 3. Generate overall analysis
      const overall = generateOverallAnalysis(verbal, nonVerbal, interviewData);
      setOverallAnalysis(overall);
      
      // Save overall analysis to localStorage
      const sessionId = interviewData.sessionId;
      if (sessionId) {
        localStorage.setItem(`overallAnalysisReport_${sessionId}`, JSON.stringify(overall));
        console.log('💾 Overall analysis saved to localStorage in generateAllReports');
      }
      
      // 4. Generate comprehensive non-verbal report IN MEMORY and mark ready
      let comprehensiveData;
      try {
        if (typeof window !== 'undefined' && window.createComprehensiveNonVerbalReport) {
          comprehensiveData = window.createComprehensiveNonVerbalReport(
            nonVerbal.analytics,
            nonVerbal.audioMetrics
          );
        } else {
          comprehensiveData = createComprehensiveNonVerbalReport(
            nonVerbal.analytics,
            nonVerbal.audioMetrics
          );
        }
        setComprehensiveNonVerbalReport(comprehensiveData);
        setComprehensiveReportReady(true);
        console.log('✅ Comprehensive non-verbal report generated in memory and ready for save');
      } catch (comprehensiveError) {
        console.error('🔴 Failed to generate comprehensive report:', comprehensiveError.message);
        setAnalysisError('Failed to generate comprehensive report: ' + comprehensiveError.message);
        return; // Don't continue if this fails
      }

      console.log("Reports generated. Database saving can proceed without localStorage.");
      
      // 🚀 OPPORTUNISTIC CONNECTION WARMING: Warm connection while user sees reports
      console.log('🔥 Warming database connection in background...');
      fetch('http://localhost:8000/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(12000) // Increased timeout for better success rate
      }).then(() => {
        console.log('✅ Database connection warmed! Save will be instant.');
        window.dbConnectionWarmed = true;
      }).catch((error) => {
        console.log('⚠️ Background warming failed:', error.message);
        console.log('💡 Save will work but may take a few seconds on first try.');
      });

    } catch (error) {
      console.error("Failed to generate all reports:", error);
      setAnalysisError(error.message || "Failed to generate reports. Please try again.");
      setAnalysisLoading(false);
    } finally {
      window.generatingAllReports = false;
    }
  };

  // Generate comprehensive report when verbal analysis already exists
  const generateComprehensiveReport = async (interviewData) => {
    // Prevent duplicate execution
    if (comprehensiveReportReady || window.generatingComprehensiveReport) {
      console.log('✅ Comprehensive report already ready or being generated, skipping...');
      return;
    }
    
    window.generatingComprehensiveReport = true;
    try {
      console.log('🎯 Generating comprehensive report from existing data...');
      
      // Use existing non-verbal analysis or generate if not available
      let nonVerbal = nonVerbalAnalysis;
      if (!nonVerbal) {
        console.log('🔄 Non-verbal analysis not found, generating for comprehensive report...');
        nonVerbal = await generateBasicNonVerbalAnalysis(interviewData);
        setNonVerbalAnalysis(nonVerbal);
        setNonVerbalReady(true);
      } else {
        console.log('✅ Using existing non-verbal analysis for comprehensive report');
      }
      
      // Generate overall analysis
      const verbal = verbalAnalysis; // Use existing verbal analysis
      const overall = generateOverallAnalysis(verbal, nonVerbal, interviewData);
      setOverallAnalysis(overall);
      
      // Save overall analysis to localStorage
      const sessionId = interviewData.sessionId;
      if (sessionId) {
        localStorage.setItem(`overallAnalysisReport_${sessionId}`, JSON.stringify(overall));
        console.log('💾 Overall analysis saved to localStorage in generateComprehensiveReport');
      }
      
      // Generate comprehensive non-verbal report IN MEMORY
      let comprehensiveData;
      if (typeof window !== 'undefined' && window.createComprehensiveNonVerbalReport) {
        comprehensiveData = window.createComprehensiveNonVerbalReport(
          nonVerbal.analytics,
          nonVerbal.audioMetrics
        );
      } else {
        comprehensiveData = createComprehensiveNonVerbalReport(
          nonVerbal.analytics,
          nonVerbal.audioMetrics
        );
      }
      setComprehensiveNonVerbalReport(comprehensiveData);
      setComprehensiveReportReady(true);
      console.log('✅ Comprehensive report ready! Save button should now be enabled.');
      
      // 🚀 OPPORTUNISTIC CONNECTION WARMING: Warm connection while user sees reports
      console.log('🔥 Warming database connection in background...');
      fetch('http://localhost:8000/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(8000)
      }).then(() => {
        console.log('✅ Database connection warmed! Save will be instant.');
        window.dbConnectionWarmed = true;
      }).catch((error) => {
        console.log('⚠️ Background warming failed:', error.message);
        console.log('💡 Save will work but may take a few seconds on first try.');
      });
      
    } catch (error) {
      console.error('🔴 Failed to generate comprehensive report:', error);
      setAnalysisError('Failed to generate comprehensive report: ' + error.message);
    } finally {
      window.generatingComprehensiveReport = false;
    }
  };
  
  
  // Optimized function to save in-memory comprehensive non-verbal report to database
  const saveNonVerbalToDatabase = async () => {
    if (databaseSaving || databaseSaved) {
      console.log('Save already in progress or completed, skipping...');
      return;
    }

    if (!comprehensiveReportReady || !comprehensiveNonVerbalReport) {
      console.log('⚠️ Cannot save yet - comprehensive report still being generated. Please wait...');
      setDatabaseError('Please wait for report generation to complete before saving.');
      return;
    }

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
      console.log('🚀 Starting non-verbal report database save (no localStorage)...');

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

      // Create save payload using in-memory comprehensive report
      const saveData = {
        interview_type: interviewData.type || "technical",
        role: interviewData.role || "Software Engineer",
        questions: interviewData.questions || [],
        answers: interviewData.answers || [],
        verbal_report: null, // Only saving non-verbal for now
        nonverbal_report: comprehensiveNonVerbalReport,
        overall_report: null,
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
        has_nonverbal_report: !!saveData.nonverbal_report,
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

      // Proceed with save
      const response = await fetch('http://localhost:8000/api/reports/save-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
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
        
        // Mark non-verbal report as saved for this session to persist across page reloads
        const sessionId = data.sessionId || `interview_${Date.now()}`;
        localStorage.setItem(`nonVerbalDatabaseSaved_${sessionId}`, 'true');
        console.log(`✅ Marked non-verbal report as saved for session: ${sessionId}`);

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
              ✅ Comprehensive non-verbal report saved to database successfully!
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
                  saveNonVerbalToDatabase();
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
            onClick={saveNonVerbalToDatabase}
            disabled={databaseSaving || databaseSaved || analysisLoading || analysisError || !comprehensiveReportReady}
            className={`px-8 py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 text-lg font-semibold ${
              databaseSaving 
                ? "bg-yellow-500/50 text-yellow-100 cursor-wait" 
                : databaseSaved
                ? "bg-green-500/50 text-green-100 cursor-not-allowed"
                : analysisLoading || analysisError || !comprehensiveReportReady
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
            ) : !comprehensiveReportReady ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing Reports...
              </>

            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Save Non-Verbal Report to Database
              </>
            )}
          </button>
        </div>
        
        <p className="text-center text-muted-foreground text-sm mt-3">
          {databaseSaved 
            ? "Your comprehensive non-verbal analysis has been permanently stored in the database."
            : !comprehensiveReportReady
            ? "Please wait while we prepare your comprehensive report for instant database saving..."
            : "Click to save your detailed non-verbal analysis with all metrics to the database."
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