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
        : "resume",
    [type, searchParams]
  );
  

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
        startTimer();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.text) {
            setAnswer((prev) => prev + " " + data.text);
            setSpoken(true);
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
      const res = await fetch(`http://localhost:8000/api/interview/generate-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, role, count }),
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
  }, [type, role]);

  const playQuestion = useCallback(async (index, qs) => {
    setCurrentIndex(index);
    const text = qs[index];
    setSpoken(false);
    setAnswer("");
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
    setAnswers((prev) => [...prev, answer]);
    if (currentIndex < questions.length - 1) {
      playQuestion(currentIndex + 1, questions);
    } else {
      const payload = { questions, answers: [...answers, answer] };
      localStorage.setItem("interviewResults", JSON.stringify(payload));
      router.push("/interview/complete");
    }
  }, [questions, currentIndex, answer, answers, playQuestion, router]);

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
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 sm:p-8">
        <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center">
          Ready to Start Your Interview?
        </h1>
        <button
          onClick={() => setStarted(true)}
          className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-transform hover:scale-105 w-full sm:w-auto max-w-xs"
        >
          Start Interview
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-950 text-white p-4 sm:p-8">
      {loadingQuestions && <LoadingOverlay />}
      <button
        onClick={handleTerminate}
        className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg shadow-lg text-sm sm:text-base"
      >
        Terminate Interview
      </button>

      <h1 className="absolute top-20 sm:top-24 left-1/2 transform -translate-x-1/2 text-xl sm:text-3xl font-bold text-white text-center w-full px-4">
        {`Interview of ${role}`}
      </h1>

      <div className="mt-28 sm:mt-32 flex flex-col sm:flex-row items-center justify-center w-full max-w-7xl mx-auto gap-6 sm:gap-10 opacity-90">
        {!isMobile && <AvatarSection videoRef={videoRef} />}

        <div className={`w-full ${!isMobile ? "sm:w-2/3" : ""} space-y-4 sm:space-y-6`}>
          {countdown !== null && (
            <div className="text-center text-4xl sm:text-5xl font-bold text-yellow-400 animate-pulse mb-4">
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
