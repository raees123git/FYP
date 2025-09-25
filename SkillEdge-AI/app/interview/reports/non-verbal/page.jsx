"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Clock, MessageCircle, Pause, TrendingUp, 
  Download, Home, ArrowLeft, Mic, Info, FileText
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
      
      // Use the SAME non-verbal analysis data that was calculated in completion page
      console.log('📋 Loading non-verbal report from SINGLE SOURCE...');
      
      const existingNonVerbalData = localStorage.getItem("nonVerbalAnalysis");
      if (existingNonVerbalData) {
        const parsedData = JSON.parse(existingNonVerbalData);
        setAnalytics(parsedData.analytics);
        
        // Use audio metrics from single source (processed in completion page)
        if (parsedData.audioMetrics) {
          setAudioMetrics(parsedData.audioMetrics);
          console.log('✅ Using SINGLE SOURCE audio metrics:', {
            pitch: parsedData.audioMetrics.pitch?.average + 'Hz',
            emotion: parsedData.audioMetrics.tone?.predominantEmotion,
            voiceQuality: parsedData.audioMetrics.voiceQuality?.overall
          });
        }
        
        console.log('✅ Using SINGLE SOURCE analytics data:', {
          fillerWords: parsedData.analytics?.fillerWords,
          fillerPercentage: parsedData.analytics?.fillerPercentage,
          wordsPerMinute: parsedData.analytics?.wordsPerMinute,
          hasAudioMetrics: !!parsedData.audioMetrics
        });
      } else {
        console.error('No non-verbal analysis data found! Please complete interview first.');
        router.replace('/interview/complete');
        return;
      }
      
    } catch (e) {
      console.error("Failed to parse data:", e);
      router.replace("/");
    }
  }, [router]);

  
  // Function to create comprehensive non-verbal report data
  const createComprehensiveNonVerbalReport = (analyticsData, audioMetrics) => {
    // Calculate confidence scores
    const eyeContactScore = Math.min(100, Math.max(0, 100 - (analyticsData.fillerPercentage * 2)));
    const bodyLanguageScore = analyticsData.wordsPerMinute >= 120 && analyticsData.wordsPerMinute <= 160 ? 85 : 65;
    const pausePattern = analyticsData.pauseAnalysis?.pattern || "Balanced";
    const voiceModulationScore = pausePattern === "Balanced" ? 90 : 
                                 pausePattern === "Rushed Speech" ? 60 : 75;
    const facialExpressionsScore = 75; // Default as we don't have facial tracking
    const overallConfidence = Math.round((eyeContactScore + bodyLanguageScore + voiceModulationScore + facialExpressionsScore) / 4);
    
    // Generate strengths and areas for improvement
    const strengths = [];
    const improvements = [];
    
    if (analyticsData.speechRate === "Good Pace") {
      strengths.push("Excellent speech pacing for clear communication");
    } else if (analyticsData.speechRate === "Slow Pace") {
      improvements.push("Consider speaking slightly faster to maintain audience engagement");
    } else if (analyticsData.speechRate === "Fast Pace") {
      improvements.push("Try speaking slightly slower to improve clarity and comprehension");
    }
    
    if (analyticsData.fillerPercentage < 3) {
      strengths.push("Minimal use of filler words - very articulate speech");
    } else if (analyticsData.fillerPercentage < 6) {
      strengths.push("Good control over filler words usage");
    } else {
      improvements.push(`Reduce filler words usage (currently ${analyticsData.fillerPercentage}%)`);
    }
    
    if (pausePattern === "Balanced") {
      strengths.push("Well-balanced pause pattern enhances speech flow");
    } else {
      improvements.push(`Improve pause timing: ${analyticsData.pauseAnalysis?.recommendation || 'Practice strategic pausing'}`);
    }
    
    if (analyticsData.wordsPerMinute >= 120 && analyticsData.wordsPerMinute <= 160) {
      strengths.push("Optimal speaking speed for professional communication");
    }
    
    if (overallConfidence >= 80) {
      strengths.push("Strong overall confidence in speech delivery");
    } else if (overallConfidence < 70) {
      improvements.push("Focus on building confidence through practice and preparation");
    }
    
    // Audio-based insights
    if (audioMetrics) {
      if (audioMetrics.confidence?.average >= 0.7) {
        strengths.push("High vocal confidence detected throughout the interview");
      } else if (audioMetrics.confidence?.average < 0.5) {
        improvements.push("Work on vocal confidence - practice speaking with more conviction");
      }
      
      if (audioMetrics.tone?.averageClarity >= 0.8) {
        strengths.push("Excellent voice clarity and articulation");
      } else if (audioMetrics.tone?.averageClarity < 0.6) {
        improvements.push("Focus on clearer articulation and voice projection");
      }
      
      if (audioMetrics.pitch?.consistency >= 0.7) {
        strengths.push("Consistent and engaging voice pitch variation");
      } else if (audioMetrics.pitch?.consistency < 0.5) {
        improvements.push("Practice varying your voice pitch to maintain listener interest");
      }
    }
    
    // Enhanced pause analysis with detailed recommendations
    const pauseAnalysisDetailed = {
      ...analyticsData.pauseAnalysis,
      title: analyticsData.pauseAnalysis?.type || analyticsData.pauseAnalysis?.pattern || "Balanced",
      description: analyticsData.pauseAnalysis?.description || "Your pause pattern appears balanced for natural flow.",
      recommendations: {
        longPauses: [
          "Reduce gap between sentences",
          "Keep pause between 0.5s–1s",
          "Practice speaking with a timer"
        ],
        shortPauses: [
          "Add brief pauses after key points",
          "Breathe between sentences",
          "Use pauses to emphasize"
        ],
        balanced: [
          "Great use of pauses",
          "Maintain this rhythm",
          "Use pauses strategically"
        ],
        mixed: [
          "Aim for consistent pattern",
          "Practice structured answers",
          "Use the STAR method"
        ]
      }
    };
    
    // Enhanced audio metrics with default fallbacks for display
    const enhancedAudioMetrics = audioMetrics ? {
      ...audioMetrics,
      // Ensure all required fields exist with defaults
      pitch: {
        average: audioMetrics.pitch?.average || 150,
        range: audioMetrics.pitch?.range || 50,
        predominantLevel: audioMetrics.pitch?.predominantLevel || "medium",
        predominantTrend: audioMetrics.pitch?.predominantTrend || "stable",
        consistency: audioMetrics.pitch?.consistency || 0.7
      },
      tone: {
        predominantEmotion: audioMetrics.tone?.predominantEmotion || "confident",
        averageWarmth: audioMetrics.tone?.averageWarmth || 0.6,
        averageClarity: audioMetrics.tone?.averageClarity || 0.75,
        averageExpressiveness: audioMetrics.tone?.averageExpressiveness || 0.65,
        emotionalVariety: audioMetrics.tone?.emotionalVariety || 3
      },
      voiceQuality: {
        overall: audioMetrics.voiceQuality?.overall || "good",
        averageScore: audioMetrics.voiceQuality?.averageScore || 0.75,
        averageBreathiness: audioMetrics.voiceQuality?.averageBreathiness || 0.3,
        averageHoarseness: audioMetrics.voiceQuality?.averageHoarseness || 0.2,
        averageStrain: audioMetrics.voiceQuality?.averageStrain || 0.25
      },
      energy: {
        predominantVolume: audioMetrics.energy?.predominantVolume || "medium_volume",
        averageBrightness: audioMetrics.energy?.averageBrightness || 2800,
        volumeConsistency: audioMetrics.energy?.volumeConsistency || 0.7
      },
      confidence: {
        average: audioMetrics.confidence?.average || 0.72,
        consistency: audioMetrics.confidence?.consistency || 0.68,
        trend: audioMetrics.confidence?.trend || "stable"
      }
    } : {
      // Fallback data when no audio metrics available
      pitch: {
        average: 150,
        range: 50,
        predominantLevel: "medium",
        predominantTrend: "stable",
        consistency: 0.7
      },
      tone: {
        predominantEmotion: "confident",
        averageWarmth: 0.6,
        averageClarity: 0.75,
        averageExpressiveness: 0.65,
        emotionalVariety: 3
      },
      voiceQuality: {
        overall: "good",
        averageScore: 0.75,
        averageBreathiness: 0.3,
        averageHoarseness: 0.2,
        averageStrain: 0.25
      },
      energy: {
        predominantVolume: "medium_volume",
        averageBrightness: 2800,
        volumeConsistency: 0.7
      },
      confidence: {
        average: 0.72,
        consistency: 0.68,
        trend: "stable"
      }
    };
    
    // Speaking statistics (used by DetailedAnalysis component)
    const speakingStats = {
      totalSpeakingTime: analyticsData.totalTime,
      totalWordsSpoken: analyticsData.totalWords,
      questionsAnswered: analyticsData.questionCount,
      avgWordsPerAnswer: Math.round(analyticsData.totalWords / analyticsData.questionCount)
    };
    
    return {
      // Basic analytics (what we had before)
      analytics: analyticsData,
      
      // Enhanced audio metrics (rich voice analysis with all UI requirements)
      audioMetrics: enhancedAudioMetrics,
      
      // Confidence scores
      confidenceScores: {
        eyeContactScore,
        bodyLanguageScore,
        voiceModulationScore,
        facialExpressionsScore,
        overallConfidence
      },
      
      // Performance insights
      insights: {
        strengths: strengths.slice(0, 10), // Limit to top 10
        improvements: improvements.slice(0, 10), // Limit to top 10
      },
      
      // Overall feedback summary
      feedback: `Speech rate: ${analyticsData.speechRate}. ${analyticsData.speechRateDescription} ` +
                `Filler words usage: ${analyticsData.fillerPercentage}%. ` +
                `Pause pattern: ${pausePattern}. ` +
                `Overall confidence level: ${overallConfidence}%.`,
                
      // Pitch profile (enhanced for UI compatibility)
      pitchProfile: {
        average: enhancedAudioMetrics.pitch.average,
        range: enhancedAudioMetrics.pitch.range,
        level: enhancedAudioMetrics.pitch.predominantLevel,
        trend: enhancedAudioMetrics.pitch.predominantTrend,
        consistency: Math.round(enhancedAudioMetrics.pitch.consistency * 100)
      },
      
      // Voice quality metrics (enhanced with all UI fields)
      voiceQuality: {
        overall: enhancedAudioMetrics.voiceQuality.overall,
        score: Math.round(enhancedAudioMetrics.voiceQuality.averageScore * 100),
        clarity: Math.round(enhancedAudioMetrics.tone.averageClarity * 100),
        warmth: Math.round(enhancedAudioMetrics.tone.averageWarmth * 100),
        expressiveness: Math.round(enhancedAudioMetrics.tone.averageExpressiveness * 100),
        breathiness: enhancedAudioMetrics.voiceQuality.averageBreathiness,
        hoarseness: enhancedAudioMetrics.voiceQuality.averageHoarseness,
        strain: enhancedAudioMetrics.voiceQuality.averageStrain
      },
      
      // Enhanced pause analysis with detailed recommendations
      pauseAnalysisDetailed,
      
      // Filler words breakdown (used by MainStatsGrid flip cards)
      fillerWordsBreakdown: {
        totalCount: analyticsData.fillerWords,
        percentage: analyticsData.fillerPercentage,
        detectedWords: analyticsData.detectedFillerWords || {},
        categories: Object.keys(analyticsData.detectedFillerWords || {}).length > 0 ? 
          Object.keys(analyticsData.detectedFillerWords) : ["um", "uh", "like"]
      },
      
      // Speaking statistics for DetailedAnalysis component
      speakingStats,
      
      // Volume, energy and confidence data for VolumeEnergyConfidence component
      volumeEnergyConfidence: {
        volume: {
          level: enhancedAudioMetrics.energy.predominantVolume.replace('_', ' '),
          brightness: enhancedAudioMetrics.energy.averageBrightness,
          consistency: enhancedAudioMetrics.energy.volumeConsistency
        },
        confidence: {
          average: enhancedAudioMetrics.confidence.average,
          consistency: enhancedAudioMetrics.confidence.consistency,
          trend: enhancedAudioMetrics.confidence.trend
        }
      },
      
      // Generation timestamp
      generatedAt: new Date().toISOString()
    };
  };
  
  // Make this function globally available for database saves
  if (typeof window !== 'undefined') {
    window.createComprehensiveNonVerbalReport = createComprehensiveNonVerbalReport;
  }
  
  

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
            
            <ActionButtons analytics={analytics} audioMetrics={audioMetrics} />
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}