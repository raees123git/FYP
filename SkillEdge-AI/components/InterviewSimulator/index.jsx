"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AvatarSection from "./AvatarSection";
import QuestionDisplay from "./QuestionDisplay";
import AnswerSection from "./AnswerSection";
import LoadingOverlay from "./LoadingOverlay";

// ---- Main Component ----
export default function InterviewSimulatorWithVoice() {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [answerTimings, setAnswerTimings] = useState([]);
  const [answerStartTime, setAnswerStartTime] = useState(null);
  const [audioAnalysis, setAudioAnalysis] = useState([]);
  const [currentAudioMetrics, setCurrentAudioMetrics] = useState([]);
  const [timeLeft, setTimeLeft] = useState(180);
  const [transcribing, setTranscribing] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [timerActive, setTimerActive] = useState(false);

  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const wsRef = useRef(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "technical";
  const role = useMemo(() =>
    type === "technical"
      ? searchParams.get("role") || "Software Engineer"
      : type === "behavioral"
        ? "behavioral"
        : searchParams.get("position") || "Software Engineer",
    [type, searchParams]
  );
  const resumeId = searchParams.get("resume_id");
  

  const count = parseInt(searchParams.get("count") || "5", 10);
  const canStart = useMemo(() => !transcribing, [transcribing]);
  const canStop = useMemo(() => transcribing, [transcribing]);
  const canSubmit = useMemo(() => !transcribing && spoken, [transcribing, spoken]);
  const startLabel = useMemo(() =>
    transcribing
      ? "Speaking..."
      : spoken
        ? "Continue Speaking"
        : "Start Speaking",
    [transcribing, spoken]
  );
  const isLast = useMemo(() => currentIndex === questions.length - 1, [currentIndex, questions.length]);
  const submitLabel = useMemo(() => isLast ? "Finish Interview" : "Submit & Next", [isLast]);

  // ---- Timer functions ----
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          stopListening();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // ---- Whisper STT functions ----
  const startListening = useCallback(() => {
    if (timeLeft <= 0) {
      alert("You have used all your time for this question!");
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      const ws = new WebSocket("ws://localhost:8765");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ Connected to Whisper server");
        setTranscribing(true);
        setTimerActive(true);
        setAnswerStartTime(Date.now());
        startTimer();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "session_summary") {
            // Store session summary for later use
            if (data.audio_summary) {
              setAudioAnalysis(prev => [...prev, data.audio_summary]);
            }
          } else if (data.text) {
            setAnswer((prev) => prev + " " + data.text);
            setSpoken(true);
            // Store audio metrics for current answer
            if (data.audio_analysis) {
              setCurrentAudioMetrics(prev => [...prev, data.audio_analysis]);
            }
          }
        } catch (err) {
          console.error("WebSocket parse error:", err);
        }
      };

      ws.onclose = () => {
        console.log("❌ Whisper connection closed");
        setTranscribing(false);
        setTimerActive(false);
        stopTimer();
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        alert("Whisper connection error. Check backend server.");
      };
    }
  }, [timeLeft, startTimer]);

  const stopListening = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setTranscribing(false);
    setTimerActive(false);
    stopTimer();
    setSpoken(true);
  }, [stopTimer]);

  // ---- Helpers ----
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Helper function to aggregate audio metrics
  const aggregateAudioMetrics = (metrics) => {
    if (!metrics || metrics.length === 0) return null;
    
    const avgConfidence = metrics.reduce((sum, m) => sum + (m.confidence_score || 0), 0) / metrics.length;
    const tones = metrics.map(m => m.tone?.emotional_tone).filter(Boolean);
    const pitchLevels = metrics.map(m => m.pitch?.level).filter(Boolean);
    
    return {
      averageConfidence: avgConfidence.toFixed(2),
      predominantTone: tones.length > 0 ? tones[Math.floor(tones.length / 2)] : "neutral",
      pitchVariation: pitchLevels.length > 1 ? "varied" : "consistent",
      metricsCount: metrics.length
    };
  };

  const enableWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Media access denied or not supported:", err);
    }
  }, []);

  const fetchAllQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    try {
      let requestBody = { type, role, count };
      
      // If this is a resume-based interview, fetch and parse the resume first
      if (type === "resume" && resumeId) {
        try {
          // Fetch the parsed resume content through Next.js API
          const parseRes = await fetch(`/api/interview/parse-resume/${resumeId}`, {
            method: "GET",
            headers: { 
              "Content-Type": "application/json",
            },
          });
          
          if (parseRes.ok) {
            const parseData = await parseRes.json();
            // Add the resume content to the request
            requestBody.resume_content = parseData.interview_content;
            console.log("Resume parsed successfully for interview");
          } else {
            console.error("Failed to parse resume, falling back to generic questions");
            // Fall back to generic questions if resume parsing fails
            requestBody.type = "technical";
          }
        } catch (parseErr) {
          console.error("Error parsing resume:", parseErr);
          // Fall back to generic questions
          requestBody.type = "technical";
        }
      }
      
      // Generate questions (either resume-based or regular)
      const res = await fetch(`http://localhost:8000/api/interview/generate-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const { question: fetched } = await res.json();
      const firstSeven = Array.isArray(fetched) ? fetched.slice(0, 7) : [];
      setQuestions(firstSeven);
      playQuestion(0, firstSeven);
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  }, [type, role, resumeId, count]);

  const playQuestion = useCallback(async (index, qs) => {
    setCurrentIndex(index);
    const text = qs[index];
    setSpoken(false);
    setAnswer("");
    setAnswerStartTime(null);
    setCurrentAudioMetrics([]); // Reset audio metrics for new question
    setTimeLeft(180);
    setCountdown(3);
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((res) => setTimeout(res, 1000));
    }
    setCountdown(null);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onstart = () => setSpoken(true);
    utterance.onend = () => setSpoken(false);
    speechSynthesis.speak(utterance);
  }, []);

  const handleSubmit = useCallback(() => {
    // Calculate timing for this answer
    const timeTaken = answerStartTime ? (Date.now() - answerStartTime) / 1000 : 180 - timeLeft;
    const timing = {
      timeTaken: Math.round(timeTaken),
      wordsSpoken: answer.trim().split(/\s+/).filter(word => word).length,
      timeUsed: 180 - timeLeft
    };
    
    setAnswers((prev) => [...prev, answer]);
    setAnswerTimings((prev) => [...prev, timing]);
    
    if (currentIndex < questions.length - 1) {
      playQuestion(currentIndex + 1, questions);
    } else {
      const payload = { 
        questions, 
        answers: [...answers, answer],
        timings: [...answerTimings, timing],
        audioAnalysis: [...audioAnalysis, ...(currentAudioMetrics.length > 0 ? [{
          metrics: currentAudioMetrics,
          aggregated: aggregateAudioMetrics(currentAudioMetrics)
        }] : [])],
        type: type,  // Add interview type
        role: role   // Add role
      };
      localStorage.setItem("interviewResults", JSON.stringify(payload));
      router.push("/interview/complete");
    }
  }, [questions, currentIndex, answer, answers, answerTimings, answerStartTime, timeLeft, playQuestion, router]);

  const handleTerminate = useCallback(() => {
    if (window.confirm("Terminating now will lose all progress. Are you sure?")) {
      router.push("/");
    }
  }, [router]);

  // ---- Effects ----
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (started) {
      if (!isMobile) enableWebcam();
      fetchAllQuestions();
    }
  }, [started, isMobile]);

  useEffect(() => {
    return () => {
      stopTimer();
      stopListening();
    };
  }, [stopTimer, stopListening]);

  // ---- Render ----
  if (!started) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8">
        <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Ready to Start Your Interview?
        </h1>
        <button
          onClick={() => {
            // Clear any previous interview data to prevent stale reports
            localStorage.removeItem("verbalAnalysisReport");
            localStorage.removeItem("interviewReportData");
            localStorage.removeItem("nonVerbalAnalysis");
            localStorage.removeItem("lastInterviewId");
            
            // Clear session-specific report data from previous interviews
            // Get all localStorage keys and remove any interview-related ones
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && (
                key.startsWith("verbalAnalysisReport_") ||
                key.startsWith("nonVerbalAnalysis_") ||
                key.startsWith("nonVerbalReportSaved_") ||
                key.startsWith("nonVerbalDatabaseSaved_") ||
                key.startsWith("savedInterview_")
              )) {
                localStorage.removeItem(key);
              }
            }
            
            setStarted(true);
          }}
          className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-primary/25 w-full sm:w-auto max-w-xs"
        >
          Start Interview
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground p-4 sm:p-8">
      {loadingQuestions && <LoadingOverlay />}
      <button
        onClick={handleTerminate}
        className="absolute bottom-4 right-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-3 sm:px-4 py-2 rounded-lg shadow-lg transition-all text-sm sm:text-base"
      >
        Terminate Interview
      </button>

      <h1 className="absolute top-20 sm:top-24 left-1/2 transform -translate-x-1/2 text-xl sm:text-3xl font-bold text-center w-full px-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {`Interview of ${role}`}
      </h1>

      <div className="mt-28 sm:mt-32 flex flex-col sm:flex-row items-center justify-center w-full max-w-7xl mx-auto gap-6 sm:gap-10">
        {!isMobile && <AvatarSection videoRef={videoRef} />}

        <div className={`w-full ${!isMobile ? "sm:w-2/3" : ""} space-y-4 sm:space-y-6`}>
          {countdown !== null && (
            <div className="text-center text-4xl sm:text-5xl font-bold text-accent animate-pulse mb-4">
              {countdown}
            </div>
          )}
          <QuestionDisplay currentIndex={currentIndex} question={questions[currentIndex]} />
          <AnswerSection
            answer={answer}
            setAnswer={setAnswer}
            setSpoken={setSpoken}
            transcribing={transcribing}
            timeLeft={timeLeft}
            formatTime={formatTime}
            startListening={startListening}
            stopListening={stopListening}
            handleSubmit={handleSubmit}
            canStart={canStart}
            canStop={canStop}
            canSubmit={canSubmit}
            startLabel={startLabel}
            submitLabel={submitLabel}
            hoveredButton={hoveredButton}
            setHoveredButton={setHoveredButton}
          />
        </div>
      </div>
    </div>
  );
}
