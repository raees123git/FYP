"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Clock, MessageCircle, Pause, TrendingUp, 
  Download, Home, ArrowLeft, Mic, Info
} from "lucide-react";

// Import all components and utilities
import {
  ReportHeader,
  MainStatsGrid,
  VoiceAnalysisCards,
  VolumeEnergyConfidence,
  VoiceRecommendations,
  SpeechPatternTimeline,
  DetailedAnalysis,
  ActionButtons,
  analyzePauses,
  calculateFillerWordsList,
  generateReportContent
} from "@/components/reports/non-verbal";


export default function NonVerbalReport() {
  const [reportData, setReportData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [audioMetrics, setAudioMetrics] = useState(null);
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [reportSaved, setReportSaved] = useState(false);
  const [flippedCards, setFlippedCards] = useState({
    speechRate: false,
    wordsPerMinute: false,
    pausePattern: false,
    fillerWords: false
  });
  const router = useRouter();

  useEffect(() => {
    // Get interview data from localStorage
    const interviewData = localStorage.getItem("interviewResults");
    const reportDataRaw = localStorage.getItem("interviewReportData");
    
    if (!interviewData || !reportDataRaw) {
      router.replace("/");
      return;
    }

    try {
      const interview = JSON.parse(interviewData);
      const report = JSON.parse(reportDataRaw);
      setReportData(report);
      
      // Calculate analytics
      calculateAnalytics(interview);
      
      // Process audio analysis if available
      if (interview.audioAnalysis && interview.audioAnalysis.length > 0) {
        processAudioMetrics(interview.audioAnalysis);
      }
      
      // Check if report was already saved
      const sessionId = interview.sessionId || "";
      const savedFlag = localStorage.getItem(`nonVerbalReportSaved_${sessionId}`);
      if (savedFlag) {
        setReportSaved(true);
      }
    } catch (e) {
      console.error("Failed to parse data:", e);
      router.replace("/");
    }
  }, [router]);

  const calculateAnalytics = (interview) => {
    const { answers, timings = [] } = interview;
    
    let totalWords = 0;
    let totalTime = 0;
    let fillerWords = 0;
    let pauses = [];
    let detectedFillerWords = {};
    
    const fillerWordsList = calculateFillerWordsList();
    
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
      }
    });
    
    const wordsPerMinute = totalTime > 0 ? Math.round((totalWords / totalTime) * 60) : 0;
    const fillerPercentage = totalWords > 0 ? ((fillerWords / totalWords) * 100).toFixed(1) : 0;
    
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
    
    const pauseAnalysis = analyzePauses(pauses);
    
    const analyticsData = {
      totalWords,
      totalTime: Math.round(totalTime),
      wordsPerMinute,
      speechRate,
      speechRateColor,
      speechRateDescription,
      fillerWords,
      fillerPercentage,
      detectedFillerWords,
      pauseAnalysis,
      questionCount: answers.length
    };
    
    setAnalytics(analyticsData);
    
    // Save non-verbal report to database if not already saved
    if (!reportSaved && interview) {
      saveNonVerbalReport(interview, analyticsData);
    }
  };
  
  const saveNonVerbalReport = async (interview, analyticsData) => {
    try {
      // Get the saved interview ID
      const lastInterviewId = localStorage.getItem("lastInterviewId");
      if (!lastInterviewId) {
        console.log("No interview ID found, skipping non-verbal save");
        return;
      }
      
      // Calculate scores based on analytics
      const eyeContactScore = Math.min(100, Math.max(0, 100 - (analyticsData.fillerPercentage * 2)));
      const bodyLanguageScore = analyticsData.wordsPerMinute >= 120 && analyticsData.wordsPerMinute <= 160 ? 85 : 65;
      const voiceModulationScore = analyticsData.pauseAnalysis.quality === "Good" ? 90 : 
                                   analyticsData.pauseAnalysis.quality === "Needs Improvement" ? 60 : 75;
      const facialExpressionsScore = 75; // Default as we don't have facial tracking
      const overallConfidence = Math.round((eyeContactScore + bodyLanguageScore + voiceModulationScore + facialExpressionsScore) / 4);
      
      const nonVerbalData = {
        eye_contact_score: eyeContactScore,
        body_language_score: bodyLanguageScore,
        voice_modulation_score: voiceModulationScore,
        facial_expressions_score: facialExpressionsScore,
        overall_confidence: overallConfidence,
        feedback: `Speech rate: ${analyticsData.speechRate}. ${analyticsData.speechRateDescription} ` +
                  `Filler words usage: ${analyticsData.fillerPercentage}%. ` +
                  `Pause pattern: ${analyticsData.pauseAnalysis.quality}.`
      };
      
      // Save to localStorage for immediate access
      localStorage.setItem("nonVerbalAnalysis", JSON.stringify(nonVerbalData));
      
      // Update the interview with non-verbal report
      const response = await fetch(`/api/reports/update-nonverbal/${lastInterviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nonVerbalData),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Non-verbal report saved:", result);
        setReportSaved(true);
        
        // Mark as saved for this session
        const sessionId = interview.sessionId || "";
        localStorage.setItem(`nonVerbalReportSaved_${sessionId}`, "true");
      } else {
        console.error("Failed to save non-verbal report");
      }
    } catch (error) {
      console.error("Error saving non-verbal report:", error);
    }
  };

  const processAudioMetrics = (audioAnalysisData) => {
    const allMetrics = audioAnalysisData.filter(a => a && a.metrics).flatMap(a => a.metrics);
    
    if (allMetrics.length === 0) {
      setAudioMetrics(null);
      return;
    }
    
    // Helper functions for audio metrics
    const mode = (arr) => {
      const frequency = {};
      arr.forEach(item => {
        frequency[item] = (frequency[item] || 0) + 1;
      });
      return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
    };
    
    const average = (arr) => {
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    };
    
    const calculateConsistency = (values) => {
      if (values.length < 2) return 0.5;
      const avg = average(values);
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / (avg || 1);
      return Math.max(0, Math.min(1, 1 - cv));
    };
    
    const calculateVolumeConsistency = (levels) => {
      const uniqueLevels = new Set(levels).size;
      return Math.max(0, Math.min(1, 1 - (uniqueLevels - 1) / 4));
    };
    
    const calculateTrend = (values) => {
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      const firstAvg = average(firstHalf);
      const secondAvg = average(secondHalf);
      
      if (secondAvg > firstAvg + 0.1) return "improving";
      if (secondAvg < firstAvg - 0.1) return "declining";
      return "stable";
    };
    
    // Extract all metrics
    const pitchValues = allMetrics.map(m => m.pitch?.mean).filter(v => v > 0);
    const pitchTrends = allMetrics.map(m => m.pitch?.trend).filter(Boolean);
    const pitchLevels = allMetrics.map(m => m.pitch?.level).filter(Boolean);
    
    const emotionalTones = allMetrics.map(m => m.tone?.emotional_tone).filter(Boolean);
    const toneQualities = allMetrics.map(m => m.tone?.quality).filter(Boolean);
    const expressiveness = allMetrics.map(m => m.tone?.expressiveness).filter(v => v !== undefined);
    const warmth = allMetrics.map(m => m.tone?.warmth).filter(v => v !== undefined);
    const clarity = allMetrics.map(m => m.tone?.clarity).filter(v => v !== undefined);
    
    const volumeLevels = allMetrics.map(m => m.energy?.volume_level).filter(Boolean);
    const energyValues = allMetrics.map(m => m.energy?.mean).filter(v => v !== undefined);
    const brightness = allMetrics.map(m => m.energy?.brightness).filter(v => v !== undefined);
    
    const voiceQualities = allMetrics.map(m => m.voice_quality?.overall).filter(Boolean);
    const qualityScores = allMetrics.map(m => m.voice_quality?.quality_score).filter(v => v !== undefined);
    const breathiness = allMetrics.map(m => m.voice_quality?.breathiness).filter(v => v !== undefined);
    const hoarseness = allMetrics.map(m => m.voice_quality?.hoarseness).filter(v => v !== undefined);
    const strain = allMetrics.map(m => m.voice_quality?.strain).filter(v => v !== undefined);
    
    const confidenceScores = allMetrics.map(m => m.confidence_score).filter(v => v !== undefined);
    
    const metrics = {
      pitch: {
        average: pitchValues.length > 0 ? Math.round(pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length) : 0,
        range: pitchValues.length > 0 ? Math.round(Math.max(...pitchValues) - Math.min(...pitchValues)) : 0,
        predominantLevel: pitchLevels.length > 0 ? mode(pitchLevels) : "medium",
        predominantTrend: pitchTrends.length > 0 ? mode(pitchTrends) : "stable",
        consistency: pitchValues.length > 1 ? calculateConsistency(pitchValues) : 0.5
      },
      tone: {
        predominantEmotion: emotionalTones.length > 0 ? mode(emotionalTones) : "neutral",
        emotionalVariety: new Set(emotionalTones).size,
        predominantQuality: toneQualities.length > 0 ? mode(toneQualities) : "neutral",
        averageExpressiveness: expressiveness.length > 0 ? average(expressiveness) : 0.5,
        averageWarmth: warmth.length > 0 ? average(warmth) : 0.5,
        averageClarity: clarity.length > 0 ? average(clarity) : 0.5
      },
      energy: {
        predominantVolume: volumeLevels.length > 0 ? mode(volumeLevels) : "normal",
        averageEnergy: energyValues.length > 0 ? average(energyValues) : 0.05,
        averageBrightness: brightness.length > 0 ? Math.round(average(brightness)) : 0,
        volumeConsistency: volumeLevels.length > 0 ? calculateVolumeConsistency(volumeLevels) : 0.5
      },
      voiceQuality: {
        overall: voiceQualities.length > 0 ? mode(voiceQualities) : "good",
        averageScore: qualityScores.length > 0 ? average(qualityScores) : 0.7,
        averageBreathiness: breathiness.length > 0 ? average(breathiness) : 0.3,
        averageHoarseness: hoarseness.length > 0 ? average(hoarseness) : 0.2,
        averageStrain: strain.length > 0 ? average(strain) : 0.2
      },
      confidence: {
        average: confidenceScores.length > 0 ? average(confidenceScores) : 0.5,
        consistency: confidenceScores.length > 1 ? calculateConsistency(confidenceScores) : 0.5,
        trend: confidenceScores.length > 2 ? calculateTrend(confidenceScores) : "stable"
      }
    };
    
    setAudioMetrics(metrics);
  };

  const toggleCard = (cardName) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  const downloadReport = () => {
    if (!analytics || !reportData) return;
    const reportContent = generateReportContent(analytics, audioMetrics);
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `non-verbal-report-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }


  return (
    <>
      <style jsx>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
      <div className="min-h-screen bg-background text-foreground p-8">
        <motion.div
          className="max-w-6xl mx-auto pt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Header */}
          <ReportHeader />

          {/* Main Stats Grid */}
          <MainStatsGrid analytics={analytics} flippedCards={flippedCards} toggleCard={toggleCard} />

          {/* Voice Analysis Cards */}
          {audioMetrics && (
            <>
              <VoiceAnalysisCards audioMetrics={audioMetrics} />
              <VolumeEnergyConfidence audioMetrics={audioMetrics} />
              <VoiceRecommendations audioMetrics={audioMetrics} />
              <SpeechPatternTimeline analytics={analytics} audioMetrics={audioMetrics} />
            </>
          )}

          {/* Detailed Analysis Section */}
          <DetailedAnalysis analytics={analytics} />

          {/* Action Buttons */}
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={downloadReport}
              className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl shadow-lg transition-transform hover:scale-105"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Report
            </button>
            
            <button
              onClick={() => router.push("/interview/complete")}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-transform hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Results
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem("interviewResults");
                localStorage.removeItem("interviewReportData");
                router.push("/");
              }}
              className="flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg transition-transform hover:scale-105"
            >
              <Home className="w-5 h-5 mr-2" />
              Home
            </button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}