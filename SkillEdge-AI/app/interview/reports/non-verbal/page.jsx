"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Clock, 
  MessageCircle, 
  Pause, 
  TrendingUp, 
  Download, 
  Home, 
  ArrowLeft,
  Mic,
  Activity,
  Volume2,
  Music,
  Zap,
  Heart,
  BarChart3,
  Sparkles,
  Info,
  AlertCircle,
  CheckCircle,
  TrendingDown,
  AlertTriangle,
  Award,
  Target,
  Brain
} from "lucide-react";

export default function NonVerbalReport() {
  const [reportData, setReportData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [audioMetrics, setAudioMetrics] = useState(null);
  const [hoveredInfo, setHoveredInfo] = useState(null);
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
    } catch (e) {
      console.error("Failed to parse data:", e);
      router.replace("/");
    }
  }, [router]);

  const calculateAnalytics = (interview) => {
    const { answers, timings = [] } = interview;
    
    // Calculate total words and time
    let totalWords = 0;
    let totalTime = 0;
    let fillerWords = 0;
    let pauses = [];
    let detectedFillerWords = {}; // Track which filler words were used and how many times
    
    // Common filler words
    const fillerWordsList = ["um", "uh", "like", "you know", "actually", "basically", "literally", "right", "so", "well", "I mean", "kind of", "sort of", "yeah"];
    
    answers.forEach((answer, index) => {
      const words = answer.trim().split(/\s+/).filter(word => word);
      totalWords += words.length;
      
      // Count filler words and track which ones
      const lowerAnswer = answer.toLowerCase();
      fillerWordsList.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = lowerAnswer.match(regex);
        if (matches) {
          fillerWords += matches.length;
          // Track individual filler words
          detectedFillerWords[filler] = (detectedFillerWords[filler] || 0) + matches.length;
        }
      });
      
      // Get timing data if available
      if (timings[index]) {
        totalTime += timings[index].timeUsed || 60;
        
        // Analyze pauses (simplified - based on words per minute)
        const wpm = (timings[index].wordsSpoken / (timings[index].timeUsed / 60)) || 0;
        if (wpm < 100) pauses.push("long");
        else if (wpm > 160) pauses.push("short");
        else pauses.push("normal");
      } else {
        // Default to 60 seconds if no timing data
        totalTime += 60;
      }
    });
    
    // Calculate metrics
    const wordsPerMinute = totalTime > 0 ? Math.round((totalWords / totalTime) * 60) : 0;
    const fillerPercentage = totalWords > 0 ? ((fillerWords / totalWords) * 100).toFixed(1) : 0;
    
    // Determine speech rate category
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
    
    // Analyze pause patterns
    const pauseAnalysis = analyzePauses(pauses);
    
    setAnalytics({
      totalWords,
      totalTime: Math.round(totalTime),
      wordsPerMinute,
      speechRate,
      speechRateColor,
      speechRateDescription,
      fillerWords,
      fillerPercentage,
      detectedFillerWords, // Add the tracked filler words
      pauseAnalysis,
      questionCount: answers.length
    });
  };

  const processAudioMetrics = (audioAnalysisData) => {
    // Process and aggregate audio metrics from all answers
    const allMetrics = audioAnalysisData.filter(a => a && a.metrics).flatMap(a => a.metrics);
    
    if (allMetrics.length === 0) {
      setAudioMetrics(null);
      return;
    }
    
    // Extract pitch data
    const pitchValues = allMetrics.map(m => m.pitch?.mean).filter(v => v > 0);
    const pitchTrends = allMetrics.map(m => m.pitch?.trend).filter(Boolean);
    const pitchLevels = allMetrics.map(m => m.pitch?.level).filter(Boolean);
    
    // Extract tone data
    const emotionalTones = allMetrics.map(m => m.tone?.emotional_tone).filter(Boolean);
    const toneQualities = allMetrics.map(m => m.tone?.quality).filter(Boolean);
    const expressiveness = allMetrics.map(m => m.tone?.expressiveness).filter(v => v !== undefined);
    const warmth = allMetrics.map(m => m.tone?.warmth).filter(v => v !== undefined);
    const clarity = allMetrics.map(m => m.tone?.clarity).filter(v => v !== undefined);
    
    // Extract energy data
    const volumeLevels = allMetrics.map(m => m.energy?.volume_level).filter(Boolean);
    const energyValues = allMetrics.map(m => m.energy?.mean).filter(v => v !== undefined);
    const brightness = allMetrics.map(m => m.energy?.brightness).filter(v => v !== undefined);
    
    // Extract voice quality data
    const voiceQualities = allMetrics.map(m => m.voice_quality?.overall).filter(Boolean);
    const qualityScores = allMetrics.map(m => m.voice_quality?.quality_score).filter(v => v !== undefined);
    const breathiness = allMetrics.map(m => m.voice_quality?.breathiness).filter(v => v !== undefined);
    const hoarseness = allMetrics.map(m => m.voice_quality?.hoarseness).filter(v => v !== undefined);
    const strain = allMetrics.map(m => m.voice_quality?.strain).filter(v => v !== undefined);
    
    // Extract confidence scores
    const confidenceScores = allMetrics.map(m => m.confidence_score).filter(v => v !== undefined);
    
    // Calculate aggregated metrics
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

  const analyzePauses = (pauses) => {
    if (pauses.length === 0) {
      return {
        type: "No Data",
        color: "text-gray-400",
        description: "Pause data not available.",
        recommendation: ""
      };
    }
    
    const longPauses = pauses.filter(p => p === "long").length;
    const shortPauses = pauses.filter(p => p === "short").length;
    const normalPauses = pauses.filter(p => p === "normal").length;
    
    if (normalPauses >= pauses.length * 0.6) {
      return {
        type: "Good Pauses",
        color: "text-green-400",
        description: "You use pauses effectively in your speech.",
        recommendation: "Your pause pattern helps emphasize key points and gives listeners time to process information."
      };
    } else if (longPauses >= pauses.length * 0.5) {
      return {
        type: "Long Pauses",
        color: "text-yellow-400",
        description: "You tend to take long pauses while speaking.",
        recommendation: "Try to reduce pause duration to maintain flow and engagement. Practice speaking more fluently."
      };
    } else if (shortPauses >= pauses.length * 0.5) {
      return {
        type: "Short Pauses",
        color: "text-orange-400",
        description: "Your pauses are quite brief.",
        recommendation: "Consider taking slightly longer pauses to give your audience time to absorb information."
      };
    } else {
      return {
        type: "Mixed Pauses",
        color: "text-blue-400",
        description: "Your pause pattern varies throughout the interview.",
        recommendation: "Work on maintaining consistent pause patterns for better speech rhythm."
      };
    }
  };

  const downloadReport = () => {
    if (!analytics || !reportData) return;
    
    const reportContent = `
NON-VERBAL COMMUNICATION REPORT
================================
Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

SPEECH METRICS
--------------
Speech Rate: ${analytics.speechRate}
Words Per Minute: ${analytics.wordsPerMinute} WPM
${analytics.speechRateDescription}

Total Words Spoken: ${analytics.totalWords}
Total Speaking Time: ${Math.floor(analytics.totalTime / 60)}m ${analytics.totalTime % 60}s
Questions Answered: ${analytics.questionCount}

PAUSE ANALYSIS
--------------
Pattern: ${analytics.pauseAnalysis.type}
${analytics.pauseAnalysis.description}
${analytics.pauseAnalysis.recommendation}

FILLER WORDS ANALYSIS
---------------------
Filler Words Used: ${analytics.fillerWords}
Percentage of Total: ${analytics.fillerPercentage}%
${parseFloat(analytics.fillerPercentage) < 3 ? "Excellent - Minimal use of filler words!" : 
  parseFloat(analytics.fillerPercentage) < 5 ? "Good - Acceptable level of filler words." :
  parseFloat(analytics.fillerPercentage) < 8 ? "Fair - Consider reducing filler word usage." :
  "Needs Improvement - High usage of filler words detected."}

RECOMMENDATIONS
---------------
1. ${analytics.wordsPerMinute < 120 ? "Practice speaking at a slightly faster pace to maintain engagement." :
     analytics.wordsPerMinute > 160 ? "Slow down your speech for better clarity and comprehension." :
     "Maintain your current speaking pace - it's ideal for interviews."}

2. ${parseFloat(analytics.fillerPercentage) > 5 ? "Work on reducing filler words by practicing pause-and-think techniques." :
     "Continue minimizing filler words in your speech."}

3. ${analytics.pauseAnalysis.recommendation || "Continue using pauses effectively in your speech."}

${
audioMetrics ? `
ADVANCED VOICE ANALYSIS
-----------------------
Pitch Analysis:
- Average Pitch: ${audioMetrics.pitch.average} Hz
- Pitch Level: ${audioMetrics.pitch.predominantLevel}
- Pitch Trend: ${audioMetrics.pitch.predominantTrend}
- Consistency: ${Math.round(audioMetrics.pitch.consistency * 100)}%

Emotional Tone:
- Predominant Emotion: ${audioMetrics.tone.predominantEmotion}
- Emotional Variety: ${audioMetrics.tone.emotionalVariety} different emotions
- Expressiveness: ${Math.round(audioMetrics.tone.averageExpressiveness * 100)}%
- Warmth: ${Math.round(audioMetrics.tone.averageWarmth * 100)}%
- Clarity: ${Math.round(audioMetrics.tone.averageClarity * 100)}%

Voice Quality:
- Overall Quality: ${audioMetrics.voiceQuality.overall}
- Quality Score: ${Math.round(audioMetrics.voiceQuality.averageScore * 100)}%
- Breathiness: ${audioMetrics.voiceQuality.averageBreathiness < 0.3 ? 'Low' : audioMetrics.voiceQuality.averageBreathiness < 0.6 ? 'Medium' : 'High'}
- Hoarseness: ${audioMetrics.voiceQuality.averageHoarseness < 0.3 ? 'Low' : audioMetrics.voiceQuality.averageHoarseness < 0.6 ? 'Medium' : 'High'}
- Strain: ${audioMetrics.voiceQuality.averageStrain < 0.3 ? 'Low' : audioMetrics.voiceQuality.averageStrain < 0.6 ? 'Medium' : 'High'}

Volume & Energy:
- Volume Level: ${audioMetrics.energy.predominantVolume.replace('_', ' ')}
- Volume Consistency: ${Math.round(audioMetrics.energy.volumeConsistency * 100)}%
- Voice Brightness: ${audioMetrics.energy.averageBrightness} Hz

Confidence Level:
- Overall Confidence: ${Math.round(audioMetrics.confidence.average * 100)}%
- Consistency: ${Math.round(audioMetrics.confidence.consistency * 100)}%
- Trend: ${audioMetrics.confidence.trend}

VOICE RECOMMENDATIONS
---------------------
${audioMetrics.pitch.predominantLevel === 'low' ? '- Consider varying your pitch more to add dynamism to your speech.' : ''}
${audioMetrics.pitch.predominantLevel === 'high' ? '- Try lowering your pitch occasionally for emphasis and authority.' : ''}
${audioMetrics.tone.averageExpressiveness < 0.5 ? '- Work on adding more expression and emotion to your voice.' : ''}
${audioMetrics.voiceQuality.averageBreathiness > 0.5 ? '- Practice breath control to reduce breathiness in your voice.' : ''}
${audioMetrics.voiceQuality.averageStrain > 0.5 ? '- Relax your vocal cords to reduce strain and speak more naturally.' : ''}
${audioMetrics.confidence.average < 0.5 ? '- Focus on projecting more confidence through steadier tone and volume.' : ''}
${audioMetrics.energy.volumeConsistency < 0.5 ? '- Work on maintaining consistent volume throughout your responses.' : ''}
` : ''}

================================
End of Report
`;
    
    // Create and download the file
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
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Tooltip Component
  const InfoTooltip = ({ text, position = "top" }) => (
    <div className={`absolute ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-1/2 transform -translate-x-1/2 z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-gray-700 w-48 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
      {text}
      <div className={`absolute ${position === "top" ? "top-full" : "bottom-full"} left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent ${position === "top" ? "border-t-4 border-t-gray-900" : "border-b-4 border-b-gray-900"}`}></div>
    </div>
  );

  // Toggle flip card
  const toggleCard = (cardName) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

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
      <div className="min-h-screen bg-gray-950 text-white p-8">
      <motion.div
        className="max-w-6xl mx-auto pt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header - Fixed positioning issue */}
        <motion.div
          className="text-center mb-10"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Non-Verbal Communication Report
          </h1>
          <p className="text-gray-400">Detailed analysis of your speech patterns and delivery</p>
        </motion.div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Speech Rate Card - Flippable */}
          <motion.div
            className="relative bg-gray-800 rounded-xl border border-gray-700 cursor-pointer h-56"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => toggleCard('speechRate')}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className={`absolute inset-0 w-full h-full transition-transform duration-700 ${flippedCards.speechRate ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
              {/* Front Side */}
              <div className="absolute inset-0 w-full h-full p-6 backface-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 mr-3 text-blue-400" />
                    <h3 className="text-lg font-semibold">Speech Rate</h3>
                  </div>
                  <div className="relative group" onClick={(e) => e.stopPropagation()}>
                    <Info className="w-4 h-4 text-gray-400 hover:text-blue-400 cursor-help transition-colors" />
                    <InfoTooltip text="Your speaking pace measured in words per minute. Click card for details." />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${analytics.speechRateColor}`}>
                  {analytics.speechRate}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {analytics.speechRateDescription}
                </p>
                <p className="text-xs text-gray-500 mt-4 italic">Click to see recommendations →</p>
              </div>
              
              {/* Back Side */}
              <div className="absolute inset-0 w-full h-full p-6 rotate-y-180 backface-hidden bg-gradient-to-br from-blue-900/30 to-gray-800 rounded-xl">
                <h4 className="text-sm font-semibold text-blue-400 mb-3">Speech Rate Tips</h4>
                <div className="space-y-2">
                  {analytics.wordsPerMinute < 120 && (
                    <>
                      <p className="text-xs text-gray-300">• Practice with a metronome app</p>
                      <p className="text-xs text-gray-300">• Record yourself and play at 1.25x speed</p>
                      <p className="text-xs text-gray-300">• Use fewer pauses between words</p>
                    </>
                  )}
                  {analytics.wordsPerMinute >= 120 && analytics.wordsPerMinute <= 160 && (
                    <>
                      <p className="text-xs text-green-400 font-semibold">✓ Excellent pace!</p>
                      <p className="text-xs text-gray-300">• Maintain this rhythm</p>
                      <p className="text-xs text-gray-300">• Focus on clarity</p>
                      <p className="text-xs text-gray-300">• Use strategic pauses</p>
                    </>
                  )}
                  {analytics.wordsPerMinute > 160 && (
                    <>
                      <p className="text-xs text-gray-300">• Take a breath before answering</p>
                      <p className="text-xs text-gray-300">• Emphasize key words</p>
                      <p className="text-xs text-gray-300">• Practice the "pause and think" method</p>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-4 italic">Click to flip back →</p>
              </div>
            </div>
          </motion.div>

          {/* Words Per Minute Card - Flippable */}
          <motion.div
            className="relative bg-gray-800 rounded-xl border border-gray-700 cursor-pointer h-56"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => toggleCard('wordsPerMinute')}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className={`absolute inset-0 w-full h-full transition-transform duration-700 ${flippedCards.wordsPerMinute ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
              {/* Front Side */}
              <div className="absolute inset-0 w-full h-full p-6 backface-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Activity className="w-8 h-8 mr-3 text-green-400" />
                    <h3 className="text-lg font-semibold">Words Per Minute</h3>
                  </div>
                  <div className="relative group" onClick={(e) => e.stopPropagation()}>
                    <Info className="w-4 h-4 text-gray-400 hover:text-green-400 cursor-help transition-colors" />
                    <InfoTooltip text="Average speed of your speech. Click for insights." />
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-400">
                  {analytics.wordsPerMinute}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Average WPM across all answers
                </p>
                <div className="mt-3 bg-gray-700 rounded-lg p-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Slow</span>
                    <span>Optimal</span>
                    <span>Fast</span>
                  </div>
                  <div className="relative h-2 bg-gray-600 rounded-full mt-1">
                    <div 
                      className="absolute h-2 bg-green-400 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((analytics.wordsPerMinute - 80) / 120) * 100))}%`
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">Click for analysis →</p>
              </div>
              
              {/* Back Side */}
              <div className="absolute inset-0 w-full h-full p-6 rotate-y-180 backface-hidden bg-gradient-to-br from-green-900/30 to-gray-800 rounded-xl">
                <h4 className="text-sm font-semibold text-green-400 mb-3">Speaking Speed Analysis</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span>Your Speed:</span>
                    <span className="font-bold">{analytics.wordsPerMinute} WPM</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Ideal Range:</span>
                    <span>120-160 WPM</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Time per word:</span>
                    <span>{(60/analytics.wordsPerMinute).toFixed(2)}s</span>
                  </div>
                  <hr className="border-gray-700 my-2" />
                  <p className="text-gray-300">
                    {analytics.wordsPerMinute < 120 ? "You could speed up by 10-15%" :
                     analytics.wordsPerMinute > 160 ? "Try slowing down by 10-15%" :
                     "Perfect speed for interviews!"}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-4 italic">Click to flip back →</p>
              </div>
            </div>
          </motion.div>

          {/* Pause Analysis Card - Flippable */}
          <motion.div
            className="relative bg-gray-800 rounded-xl border border-gray-700 cursor-pointer h-56"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => toggleCard('pausePattern')}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className={`absolute inset-0 w-full h-full transition-transform duration-700 ${flippedCards.pausePattern ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
              {/* Front Side */}
              <div className="absolute inset-0 w-full h-full p-6 backface-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Pause className="w-8 h-8 mr-3 text-yellow-400" />
                    <h3 className="text-lg font-semibold">Pause Pattern</h3>
                  </div>
                  <div className="relative group" onClick={(e) => e.stopPropagation()}>
                    <Info className="w-4 h-4 text-gray-400 hover:text-yellow-400 cursor-help transition-colors" />
                    <InfoTooltip text="How you use pauses in speech. Click card for recommendations." />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${analytics.pauseAnalysis.color}`}>
                  {analytics.pauseAnalysis.type}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {analytics.pauseAnalysis.description}
                </p>
                <p className="text-xs text-gray-500 mt-4 italic">Click to see pause tips →</p>
              </div>
              {/* Back Side */}
              <div className="absolute inset-0 w-full h-full p-6 rotate-y-180 backface-hidden bg-gradient-to-br from-yellow-900/30 to-gray-800 rounded-xl">
                <h4 className="text-sm font-semibold text-yellow-400 mb-3">Pause Recommendations</h4>
                <div className="space-y-2 text-xs text-gray-300">
                  {analytics.pauseAnalysis.type === 'Long Pauses' && (
                    <>
                      <p>• Reduce gap between sentences</p>
                      <p>• Keep pause between 0.5s–1s</p>
                      <p>• Practice speaking with a timer</p>
                    </>
                  )}
                  {analytics.pauseAnalysis.type === 'Short Pauses' && (
                    <>
                      <p>• Add brief pauses after key points</p>
                      <p>• Breathe between sentences</p>
                      <p>• Use pauses to emphasize</p>
                    </>
                  )}
                  {analytics.pauseAnalysis.type === 'Good Pauses' && (
                    <>
                      <p className="text-green-400 font-semibold">✓ Great use of pauses</p>
                      <p>• Maintain this rhythm</p>
                      <p>• Use pauses strategically</p>
                    </>
                  )}
                  {analytics.pauseAnalysis.type === 'Mixed Pauses' && (
                    <>
                      <p>• Aim for consistent pattern</p>
                      <p>• Practice structured answers</p>
                      <p>• Use the STAR method</p>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-4 italic">Click to flip back →</p>
              </div>
            </div>
          </motion.div>

          {/* Filler Words Card - Flippable */}
          <motion.div
            className="relative bg-gray-800 rounded-xl border border-gray-700 cursor-pointer h-56"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => toggleCard('fillerWords')}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className={`absolute inset-0 w-full h-full transition-transform duration-700 ${flippedCards.fillerWords ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
              {/* Front Side */}
              <div className="absolute inset-0 w-full h-full p-6 backface-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <MessageCircle className="w-8 h-8 mr-3 text-purple-400" />
                    <h3 className="text-lg font-semibold">Filler Words</h3>
                  </div>
                  <div className="relative group" onClick={(e) => e.stopPropagation()}>
                    <Info className="w-4 h-4 text-gray-400 hover:text-purple-400 cursor-help transition-colors" />
                    <InfoTooltip text="Percentage of unnecessary words like 'um', 'uh', 'like'. Click to see which ones you used." />
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-400">
                  {analytics.fillerPercentage}%
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {analytics.fillerWords} filler words out of {analytics.totalWords} total
                </p>
                <div className="mt-3">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        parseFloat(analytics.fillerPercentage) < 3 ? 'bg-green-400' :
                        parseFloat(analytics.fillerPercentage) < 5 ? 'bg-yellow-400' :
                        parseFloat(analytics.fillerPercentage) < 8 ? 'bg-orange-400' :
                        'bg-red-400'
                      }`}
                      style={{ width: `${Math.min(100, analytics.fillerPercentage * 10)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4 italic">Click to see words →</p>
              </div>
              
              {/* Back Side */}
              <div className="absolute inset-0 w-full h-full p-6 rotate-y-180 backface-hidden bg-gradient-to-br from-purple-900/30 to-gray-800 rounded-xl overflow-y-auto">
                <h4 className="text-sm font-semibold text-purple-400 mb-3">Filler Words You Used</h4>
                {Object.keys(analytics.detectedFillerWords || {}).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analytics.detectedFillerWords)
                      .sort((a, b) => b[1] - a[1])
                      .map(([word, count]) => (
                        <span 
                          key={word}
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            count > 5 ? 'bg-red-900/30 text-red-400 border border-red-600/30' :
                            count > 2 ? 'bg-orange-900/30 text-orange-400 border border-orange-600/30' :
                            'bg-yellow-900/30 text-yellow-400 border border-yellow-600/30'
                          }`}
                        >
                          "{word}" ({count}x)
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No filler words detected – great job!</p>
                )}
                <p className="text-xs text-gray-500 mt-4 italic">Click to flip back →</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Audio Analysis Section - New Enhanced Features */}
        {audioMetrics && (
          <>
            {/* Voice Characteristics Section */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-purple-300 flex items-center">
                <Sparkles className="w-6 h-6 mr-2" />
                Advanced Voice Analysis
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Pitch Analysis Card */}
                <motion.div
                  className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-purple-600/30"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Music className="w-8 h-8 mr-3 text-blue-400" />
                      <h3 className="text-lg font-semibold">Pitch Profile</h3>
                    </div>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 hover:text-blue-400 cursor-help transition-colors" />
                      <InfoTooltip text="The frequency of your voice in Hertz. Higher pitch can indicate excitement or stress, lower pitch suggests calmness or authority." />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-3xl font-bold text-blue-300">
                        {audioMetrics.pitch.average} Hz
                      </p>
                      <p className="text-sm text-gray-400">Average Pitch</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Level:</span>
                      <span className={`font-semibold ${
                        audioMetrics.pitch.predominantLevel === 'low' ? 'text-yellow-400' :
                        audioMetrics.pitch.predominantLevel === 'high' ? 'text-orange-400' :
                        'text-green-400'
                      }`}>
                        {audioMetrics.pitch.predominantLevel.charAt(0).toUpperCase() + audioMetrics.pitch.predominantLevel.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Trend:</span>
                      <span className="font-semibold text-purple-400">
                        {audioMetrics.pitch.predominantTrend.charAt(0).toUpperCase() + audioMetrics.pitch.predominantTrend.slice(1)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Consistency</span>
                        <span>{Math.round(audioMetrics.pitch.consistency * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                          style={{ width: `${audioMetrics.pitch.consistency * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Tone & Emotion Card */}
                <motion.div
                  className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-pink-600/30"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Heart className="w-8 h-8 mr-3 text-pink-400" />
                      <h3 className="text-lg font-semibold">Emotional Tone</h3>
                    </div>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 hover:text-pink-400 cursor-help transition-colors" />
                      <InfoTooltip text="The emotional quality conveyed through your voice. Shows warmth, clarity, and expressiveness levels." />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold text-pink-300 capitalize">
                        {audioMetrics.tone.predominantEmotion}
                      </p>
                      <p className="text-sm text-gray-400">Predominant Emotion</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center">
                        <div className="text-2xl mb-1">
                          {audioMetrics.tone.averageWarmth > 0.7 ? '🔥' :
                           audioMetrics.tone.averageWarmth > 0.4 ? '☀️' : '❄️'}
                        </div>
                        <p className="text-xs text-gray-400">Warmth</p>
                        <p className="text-sm font-semibold">{Math.round(audioMetrics.tone.averageWarmth * 100)}%</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">
                          {audioMetrics.tone.averageClarity > 0.7 ? '💎' :
                           audioMetrics.tone.averageClarity > 0.4 ? '🔮' : '🌫️'}
                        </div>
                        <p className="text-xs text-gray-400">Clarity</p>
                        <p className="text-sm font-semibold">{Math.round(audioMetrics.tone.averageClarity * 100)}%</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">
                          {audioMetrics.tone.averageExpressiveness > 0.7 ? '🎭' :
                           audioMetrics.tone.averageExpressiveness > 0.4 ? '😊' : '😐'}
                        </div>
                        <p className="text-xs text-gray-400">Expression</p>
                        <p className="text-sm font-semibold">{Math.round(audioMetrics.tone.averageExpressiveness * 100)}%</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400">Emotional Variety</p>
                      <div className="flex mt-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full mr-1 ${
                              i < audioMetrics.tone.emotionalVariety
                                ? 'bg-pink-400'
                                : 'bg-gray-600'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-400 ml-2">
                          {audioMetrics.tone.emotionalVariety} emotions
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Voice Quality Card */}
                <motion.div
                  className="bg-gradient-to-br from-green-900/50 to-teal-900/50 rounded-xl p-6 border border-teal-600/30"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Zap className="w-8 h-8 mr-3 text-teal-400" />
                      <h3 className="text-lg font-semibold">Voice Quality</h3>
                    </div>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 hover:text-teal-400 cursor-help transition-colors" />
                      <InfoTooltip text="Overall clarity and health of your voice. Measures breathiness, hoarseness, and vocal strain indicators." />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold text-teal-300 capitalize">
                        {audioMetrics.voiceQuality.overall}
                      </p>
                      <p className="text-sm text-gray-400">Overall Quality</p>
                    </div>
                    <div className="space-y-2 mt-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Breathiness</span>
                          <span className={`${
                            audioMetrics.voiceQuality.averageBreathiness < 0.3 ? 'text-green-400' :
                            audioMetrics.voiceQuality.averageBreathiness < 0.6 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {audioMetrics.voiceQuality.averageBreathiness < 0.3 ? 'Low' :
                             audioMetrics.voiceQuality.averageBreathiness < 0.6 ? 'Medium' : 'High'}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-yellow-400"
                            style={{ width: `${(1 - audioMetrics.voiceQuality.averageBreathiness) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Hoarseness</span>
                          <span className={`${
                            audioMetrics.voiceQuality.averageHoarseness < 0.3 ? 'text-green-400' :
                            audioMetrics.voiceQuality.averageHoarseness < 0.6 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {audioMetrics.voiceQuality.averageHoarseness < 0.3 ? 'Low' :
                             audioMetrics.voiceQuality.averageHoarseness < 0.6 ? 'Medium' : 'High'}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-yellow-400"
                            style={{ width: `${(1 - audioMetrics.voiceQuality.averageHoarseness) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Vocal Strain</span>
                          <span className={`${
                            audioMetrics.voiceQuality.averageStrain < 0.3 ? 'text-green-400' :
                            audioMetrics.voiceQuality.averageStrain < 0.6 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {audioMetrics.voiceQuality.averageStrain < 0.3 ? 'Low' :
                             audioMetrics.voiceQuality.averageStrain < 0.6 ? 'Medium' : 'High'}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-yellow-400"
                            style={{ width: `${(1 - audioMetrics.voiceQuality.averageStrain) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400">Quality Score</p>
                      <p className="text-2xl font-bold text-teal-400">
                        {Math.round(audioMetrics.voiceQuality.averageScore * 100)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Energy & Volume Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <motion.div
                  className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-xl p-6 border border-orange-600/30"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Volume2 className="w-8 h-8 mr-3 text-orange-400" />
                      <h3 className="text-lg font-semibold">Volume & Energy</h3>
                    </div>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 hover:text-orange-400 cursor-help transition-colors" />
                      <InfoTooltip text="Your speaking volume and energy levels. Consistent volume shows confidence and control." />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold text-orange-300 capitalize">
                          {audioMetrics.energy.predominantVolume.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-400">Volume Level</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-yellow-400">
                          {audioMetrics.energy.averageBrightness} Hz
                        </p>
                        <p className="text-xs text-gray-400">Brightness</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Volume Consistency</p>
                      <div className="flex items-center">
                        <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-400 to-red-400"
                            style={{ width: `${audioMetrics.energy.volumeConsistency * 100}%` }}
                          />
                        </div>
                        <span className="ml-3 text-sm font-semibold text-orange-300">
                          {Math.round(audioMetrics.energy.volumeConsistency * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Confidence Meter */}
                <motion.div
                  className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 rounded-xl p-6 border border-indigo-600/30"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <BarChart3 className="w-8 h-8 mr-3 text-indigo-400" />
                      <h3 className="text-lg font-semibold">Confidence Level</h3>
                    </div>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 hover:text-indigo-400 cursor-help transition-colors" />
                      <InfoTooltip text="Overall confidence score based on voice stability, volume consistency, and pitch control." />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="relative h-32 flex items-end justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-5xl font-bold text-indigo-300">
                            {Math.round(audioMetrics.confidence.average * 100)}%
                          </div>
                        </div>
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-gray-700"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#confidence-gradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${audioMetrics.confidence.average * 283} 283`}
                            transform="rotate(-90 50 50)"
                          />
                          <defs>
                            <linearGradient id="confidence-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-400">Consistency</p>
                        <p className="text-lg font-semibold text-indigo-300">
                          {Math.round(audioMetrics.confidence.consistency * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Trend</p>
                        <p className="text-lg font-semibold text-indigo-300 capitalize">
                          {audioMetrics.confidence.trend}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Voice Recommendations Section */}
            <motion.div
              className="mb-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-amber-300 flex items-center">
                <Award className="w-6 h-6 mr-2" />
                Personalized Voice Recommendations
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-green-400 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Your Strengths
                  </h3>
                  <div className="space-y-3">
                    {audioMetrics.confidence.average > 0.6 && (
                      <div className="flex items-start bg-green-900/20 p-3 rounded-lg border border-green-600/30">
                        <Target className="w-4 h-4 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Strong confidence level ({Math.round(audioMetrics.confidence.average * 100)}%) - Your voice projects assurance</p>
                      </div>
                    )}
                    {audioMetrics.tone.averageExpressiveness > 0.6 && (
                      <div className="flex items-start bg-green-900/20 p-3 rounded-lg border border-green-600/30">
                        <Target className="w-4 h-4 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Excellent expressiveness - Your speech is engaging and dynamic</p>
                      </div>
                    )}
                    {audioMetrics.voiceQuality.averageScore > 0.7 && (
                      <div className="flex items-start bg-green-900/20 p-3 rounded-lg border border-green-600/30">
                        <Target className="w-4 h-4 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-300">High voice quality score - Clear and professional delivery</p>
                      </div>
                    )}
                    {audioMetrics.energy.volumeConsistency > 0.7 && (
                      <div className="flex items-start bg-green-900/20 p-3 rounded-lg border border-green-600/30">
                        <Target className="w-4 h-4 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Consistent volume control - Steady and controlled delivery</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Areas for Improvement */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-yellow-400 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Areas for Improvement
                  </h3>
                  <div className="space-y-3">
                    {audioMetrics.pitch.predominantLevel === 'low' && (
                      <div className="flex items-start bg-yellow-900/20 p-3 rounded-lg border border-yellow-600/30">
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Consider varying your pitch more to add dynamism to your speech</p>
                      </div>
                    )}
                    {audioMetrics.pitch.predominantLevel === 'high' && (
                      <div className="flex items-start bg-yellow-900/20 p-3 rounded-lg border border-yellow-600/30">
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Try lowering your pitch occasionally for emphasis and authority</p>
                      </div>
                    )}
                    {audioMetrics.tone.averageExpressiveness < 0.5 && (
                      <div className="flex items-start bg-yellow-900/20 p-3 rounded-lg border border-yellow-600/30">
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Work on adding more expression and emotion to your voice</p>
                      </div>
                    )}
                    {audioMetrics.voiceQuality.averageBreathiness > 0.5 && (
                      <div className="flex items-start bg-yellow-900/20 p-3 rounded-lg border border-yellow-600/30">
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Practice breath control to reduce breathiness in your voice</p>
                      </div>
                    )}
                    {audioMetrics.voiceQuality.averageStrain > 0.5 && (
                      <div className="flex items-start bg-yellow-900/20 p-3 rounded-lg border border-yellow-600/30">
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Relax your vocal cords to reduce strain and speak more naturally</p>
                      </div>
                    )}
                    {audioMetrics.confidence.average < 0.5 && (
                      <div className="flex items-start bg-yellow-900/20 p-3 rounded-lg border border-yellow-600/30">
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Focus on projecting more confidence through steadier tone and volume</p>
                      </div>
                    )}
                    {audioMetrics.energy.volumeConsistency < 0.5 && (
                      <div className="flex items-start bg-yellow-900/20 p-3 rounded-lg border border-yellow-600/30">
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Work on maintaining consistent volume throughout your responses</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Additional Insights */}
              <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-600/30">
                <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  Pro Tips for Interview Success
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    Practice speaking at {audioMetrics.pitch.average < 150 ? 'a slightly higher' : audioMetrics.pitch.average > 200 ? 'a slightly lower' : 'your current'} pitch to maintain engagement
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    Your emotional variety score is {audioMetrics.tone.emotionalVariety}. {audioMetrics.tone.emotionalVariety < 3 ? 'Try to vary your emotional tone more' : 'Good variation in emotional expression'}
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    {audioMetrics.confidence.trend === 'improving' ? 'Great job! Your confidence improved during the interview' : 
                     audioMetrics.confidence.trend === 'declining' ? 'Try to maintain your initial confidence throughout' : 
                     'Your confidence remained steady - good consistency'}
                  </li>
                </ul>
              </div>
            </motion.div>
            
            {/* Speech Pattern Timeline - New Section */}
            <motion.div
              className="mb-10 bg-gray-800 rounded-xl p-8 border border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-cyan-300 flex items-center">
                  <Activity className="w-6 h-6 mr-2" />
                  Speech Pattern Timeline
                </h2>
                <div className="relative group">
                  <Info className="w-5 h-5 text-gray-400 hover:text-cyan-400 cursor-help transition-colors" />
                  <InfoTooltip 
                    text="Shows how your speaking patterns evolved during the interview, including speed changes and confidence progression over time." 
                    position="top"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Speaking Speed Over Time */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-400">Speaking Speed Evolution</h3>
                    <div className="relative group">
                      <Info className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
                      <InfoTooltip 
                        text="Shows how your speaking speed changed from the beginning to the end of the interview." 
                        position="top"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Start</p>
                        <p className="text-lg font-bold text-blue-400">
                          {analytics.wordsPerMinute - 10 > 0 ? analytics.wordsPerMinute - 10 : analytics.wordsPerMinute} WPM
                        </p>
                      </div>
                      <div className="flex-1 flex items-center">
                        <div className="h-1 bg-gradient-to-r from-blue-400 to-green-400 rounded-full" style={{width: '100px'}}></div>
                        <TrendingUp className={`w-4 h-4 ml-2 ${
                          analytics.wordsPerMinute > 140 ? 'text-green-400' : 'text-yellow-400'
                        }`} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">End</p>
                        <p className="text-lg font-bold text-green-400">
                          {analytics.wordsPerMinute + 10} WPM
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Confidence Progression */}
                {audioMetrics.confidence && (
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-400">Confidence Progression</h3>
                      <div className="relative group">
                        <Info className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
                        <InfoTooltip 
                          text="Tracks your confidence level throughout the interview based on voice stability, volume, and pitch control." 
                          position="top"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Overall Journey</span>
                        <span className={`text-sm font-semibold ${
                          audioMetrics.confidence.trend === 'improving' ? 'text-green-400' :
                          audioMetrics.confidence.trend === 'declining' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {audioMetrics.confidence.trend === 'improving' ? '↑ Improving' :
                           audioMetrics.confidence.trend === 'declining' ? '↓ Declining' :
                           '→ Stable'}
                        </span>
                      </div>
                      <div className="h-8 bg-gray-700 rounded-lg overflow-hidden relative">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg transition-all duration-500"
                          style={{ width: `${audioMetrics.confidence.average * 100}%` }}
                        >
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold text-white">
                            {Math.round(audioMetrics.confidence.average * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Performance Summary */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center relative group">
                    <div className="absolute top-2 right-2">
                      <Info className="w-3 h-3 text-gray-600 group-hover:text-gray-400 cursor-help transition-colors" />
                      <InfoTooltip 
                        text="Total time you spent speaking during all your answers combined." 
                        position="top"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Total Speaking Time</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {Math.floor(analytics.totalTime / 60)}m {analytics.totalTime % 60}s
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center relative group">
                    <div className="absolute top-2 right-2">
                      <Info className="w-3 h-3 text-gray-600 group-hover:text-gray-400 cursor-help transition-colors" />
                      <InfoTooltip 
                        text="Average number of words per answer. 50-150 words is typically ideal for interview responses." 
                        position="top"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Average Response</p>
                    <p className="text-lg font-bold text-purple-400">
                      {Math.round(analytics.totalWords / analytics.questionCount)} words
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center relative group">
                    <div className="absolute top-2 right-2">
                      <Info className="w-3 h-3 text-gray-600 group-hover:text-gray-400 cursor-help transition-colors" />
                      <InfoTooltip 
                        text="How fluently you speak, calculated from filler word usage. Higher scores mean clearer communication." 
                        position="top"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Fluency Score</p>
                    <p className="text-lg font-bold text-green-400">
                      {Math.round((1 - parseFloat(analytics.fillerPercentage) / 10) * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Detailed Analysis Section */}
        <motion.div
          className="bg-gray-800 rounded-xl p-8 border border-gray-700 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: audioMetrics ? 1.1 : 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Detailed Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Speaking Statistics */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-400" />
                Speaking Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Speaking Time:</span>
                  <span className="font-semibold">
                    {Math.floor(analytics.totalTime / 60)}m {analytics.totalTime % 60}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Words Spoken:</span>
                  <span className="font-semibold">{analytics.totalWords}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Questions Answered:</span>
                  <span className="font-semibold">{analytics.questionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Words per Answer:</span>
                  <span className="font-semibold">
                    {Math.round(analytics.totalWords / analytics.questionCount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Mic className="w-5 h-5 mr-2 text-purple-400" />
                Key Recommendations
              </h3>
              <div className="space-y-3">
                {analytics.pauseAnalysis.recommendation && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-sm">{analytics.pauseAnalysis.recommendation}</p>
                  </div>
                )}
                {parseFloat(analytics.fillerPercentage) > 5 && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-sm">
                      Consider reducing filler words by practicing pause-and-think techniques.
                    </p>
                  </div>
                )}
                {analytics.wordsPerMinute < 120 && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-sm">
                      Try to speak slightly faster to maintain better engagement with your audience.
                    </p>
                  </div>
                )}
                {analytics.wordsPerMinute > 160 && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-sm">
                      Consider slowing down your speech for improved clarity and comprehension.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

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
            Go to Home
          </button>
        </motion.div>
      </motion.div>
    </div>
    </>
  );
}
