"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  Home, 
  ArrowLeft,
  Info
} from "lucide-react";

// Import all the same components used in the post-interview non-verbal report
import {
  ReportHeader,
  MainStatsGrid,
  VoiceAnalysisCards,
  VolumeEnergyConfidence,
  VoiceRecommendations,
  NarrativeRecommendations,
  SpeechPatternTimeline,
  DetailedAnalysis,
  ActionButtons,
  generateReportContent
} from "@/components/reports/non-verbal";

export const NonVerbalReportViewer = ({ data }) => {
  const [flippedCards, setFlippedCards] = useState({
    speechRate: false,
    wordsPerMinute: false,
    pausePattern: false,
    fillerWords: false
  });
  
  if (!data) return null;

  const toggleCard = (cardName) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // The data structure after backend unwrapping has all fields at root level
  // Use data directly since it's already unwrapped
  const analytics = data;
  const audioMetrics = data.audioMetrics;
  
  if (!analytics || !analytics.speakingStats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No non-verbal analytics data available</p>
      </div>
    );
  }

  const downloadReport = () => {
    if (!analytics) return;
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
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black text-foreground">
        <motion.div
          className="max-w-6xl mx-auto px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Header */}
          <ReportHeader />

          {/* Main Stats Grid with Flippable Cards */}
          <MainStatsGrid analytics={analytics} flippedCards={flippedCards} toggleCard={toggleCard} />

          {/* Voice Analysis Cards - Advanced Audio Metrics */}
          {audioMetrics && (
            <>
              <VoiceAnalysisCards audioMetrics={audioMetrics} />
              <VolumeEnergyConfidence audioMetrics={audioMetrics} />
              <VoiceRecommendations audioMetrics={audioMetrics} />
              <SpeechPatternTimeline analytics={analytics} audioMetrics={audioMetrics} />
            </>
          )}

          {/* Narrative Recommendations & Ideal Response Commentary */}
          <NarrativeRecommendations analytics={analytics} />

          {/* Detailed Analysis Section */}
          <DetailedAnalysis analytics={analytics} />

          {/* Download Action Button */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Report
            </button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};