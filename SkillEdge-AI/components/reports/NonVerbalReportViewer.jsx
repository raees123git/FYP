"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Mic, 
  Volume2,
  Clock,
  Zap,
  TrendingUp,
  BarChart3,
  Headphones,
  Timer,
  MessageSquare,
  Activity,
  Gauge,
  Heart,
  Brain,
  Target,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Waves,
  Signal,
  VolumeX
} from "lucide-react";
import { 
  ProgressCircle, 
  MetricCard, 
  ProgressBar, 
  SectionCard, 
  StatusBadge, 
  ListItem 
} from './ReportComponents';

export const NonVerbalReportViewer = ({ data }) => {
  const [expandedSections, setExpandedSections] = useState({});
  
  if (!data) return null;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
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
  
  if (!analytics || !analytics.speakingStats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No non-verbal analytics data available</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Speech Analytics Overview */}
      <motion.div variants={itemVariants}>
        <SectionCard title="Speech Analytics Overview" icon={Mic} color="blue">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
              <Timer className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">
                {analytics.speakingStats?.totalSpeakingTime || 'N/A'}
                {analytics.speakingStats?.totalSpeakingTime && 's'}
              </div>
              <p className="text-gray-300 text-sm">Total Speaking Time</p>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <MessageSquare className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-400">
                {analytics.speakingStats?.totalWordsSpoken || 'N/A'}
              </div>
              <p className="text-gray-300 text-sm">Total Words</p>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
              <Zap className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">
                {analytics.speakingStats?.totalSpeakingTime && analytics.speakingStats?.totalWordsSpoken 
                  ? Math.round((analytics.speakingStats.totalWordsSpoken / analytics.speakingStats.totalSpeakingTime) * 60)
                  : 'N/A'
                }
              </div>
              <p className="text-gray-300 text-sm">Words Per Minute</p>
            </div>
            
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
              <VolumeX className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-400">
                {analytics.fillerWordsBreakdown?.totalCount || 0}
              </div>
              <p className="text-gray-300 text-sm">Filler Words</p>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Speech Rate Analysis */}
      {analytics.speakingStats && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Speech Rate Analysis" icon={Gauge} color="yellow">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-yellow-400 mb-2">Average WPM</h4>
                  <p className="text-3xl font-bold text-white">
                    {analytics.speakingStats?.totalSpeakingTime && analytics.speakingStats?.totalWordsSpoken 
                      ? Math.round((analytics.speakingStats.totalWordsSpoken / analytics.speakingStats.totalSpeakingTime) * 60)
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-yellow-400 mb-2">Speaking Time</h4>
                  <p className="text-3xl font-bold text-white">
                    {analytics.speakingStats.totalSpeakingTime || 'N/A'}s
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-yellow-400 mb-2">Total Words</h4>
                  <p className="text-3xl font-bold text-white">
                    {analytics.speakingStats.totalWordsSpoken || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Pause Analysis */}
      {analytics.pauseAnalysisDetailed && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Pause Pattern Analysis" icon={Activity} color="orange">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-orange-300 mb-3">{analytics.pauseAnalysisDetailed.title || analytics.pauseAnalysisDetailed.pattern}</h4>
                  <p className="text-gray-300 mb-4">{analytics.pauseAnalysisDetailed.description}</p>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-orange-300">Pattern Type: {analytics.pauseAnalysisDetailed.type}</span>
                  </div>
                </div>
                <div>
                  <h5 className="text-md font-semibold text-orange-300 mb-2">Recommendation</h5>
                  <p className="text-gray-300 bg-orange-500/10 p-3 rounded border border-orange-500/20">
                    {analytics.pauseAnalysisDetailed.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Audio Quality Metrics */}
      <motion.div variants={itemVariants}>
        <SectionCard title="Voice Quality Analysis" icon={Headphones} color="indigo">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Pitch Analysis */}
            {analytics.pitchProfile && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Waves className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-lg font-semibold text-indigo-300">Pitch Analysis</h4>
                </div>
                {/* Debug Pitch Fields */}
                <div className="mb-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
                  <p>pitchProfile keys: {Object.keys(analytics.pitchProfile).join(', ')}</p>
                </div>
                <div className="space-y-3">
                  {analytics.pitchProfile.averagePitch !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Average Pitch:</span>
                      <span className="text-indigo-400 font-bold">{analytics.pitchProfile.averagePitch} Hz</span>
                    </div>
                  )}
                  {analytics.pitchProfile.pitchRange !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Range:</span>
                      <span className="text-indigo-400 font-bold">{analytics.pitchProfile.pitchRange} Hz</span>
                    </div>
                  )}
                  {analytics.pitchProfile.pitchVariability !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Variability:</span>
                      <span className="text-indigo-400 font-bold">{analytics.pitchProfile.pitchVariability.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Voice Quality Analysis */}
            {analytics.voiceQuality && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-purple-400" />
                  <h4 className="text-lg font-semibold text-purple-300">Voice Quality</h4>
                </div>
                <div className="space-y-3">
                  {analytics.voiceQuality.clarity !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Clarity:</span>
                      <span className="text-purple-400 font-bold">{analytics.voiceQuality.clarity.toFixed(2)}</span>
                    </div>
                  )}
                  {analytics.voiceQuality.stability !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Stability:</span>
                      <span className="text-purple-400 font-bold">{analytics.voiceQuality.stability.toFixed(2)}</span>
                    </div>
                  )}
                  {analytics.voiceQuality.overallScore !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Overall Score:</span>
                      <span className="text-purple-400 font-bold">{analytics.voiceQuality.overallScore.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </motion.div>

      {/* Energy & Volume Analysis */}
      <motion.div variants={itemVariants}>
        <SectionCard title="Energy & Volume Analysis" icon={Volume2} color="green">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Energy Metrics */}
            {analytics.volumeEnergyConfidence && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-green-400" />
                  <h4 className="text-lg font-semibold text-green-300">Volume & Energy</h4>
                </div>
                {/* Debug Volume Energy Fields */}
                <div className="mb-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
                  <p>volumeEnergyConfidence keys: {Object.keys(analytics.volumeEnergyConfidence).join(', ')}</p>
                </div>
                <div className="space-y-3">
                  {analytics.volumeEnergyConfidence.averageVolume !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Average Volume:</span>
                      <span className="text-green-400 font-bold">{analytics.volumeEnergyConfidence.averageVolume.toFixed(2)}</span>
                    </div>
                  )}
                  {analytics.volumeEnergyConfidence.averageEnergy !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Average Energy:</span>
                      <span className="text-green-400 font-bold">{analytics.volumeEnergyConfidence.averageEnergy.toFixed(3)}</span>
                    </div>
                  )}
                  {analytics.volumeEnergyConfidence.averageConfidence !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Confidence:</span>
                      <span className="text-green-400 font-bold">{analytics.volumeEnergyConfidence.averageConfidence.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Voice Quality */}
            {(analytics.voiceQuality || analytics.audioMetrics?.voiceQuality) && (
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Signal className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-lg font-semibold text-cyan-300">Voice Quality</h4>
                </div>
                <div className="space-y-3">
                  {(analytics.voiceQuality?.overall || analytics.audioMetrics?.voiceQuality?.overall) && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Overall Quality:</span>
                      <StatusBadge 
                        status={analytics.voiceQuality?.overall || analytics.audioMetrics?.voiceQuality?.overall} 
                      />
                    </div>
                  )}
                  {(analytics.voiceQuality?.averageScore !== undefined || analytics.audioMetrics?.voiceQuality?.score !== undefined) && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Score:</span>
                      <span className="text-cyan-400 font-bold">
                        {analytics.voiceQuality?.averageScore !== undefined 
                          ? (analytics.voiceQuality.averageScore * 100).toFixed(0) 
                          : analytics.audioMetrics?.voiceQuality?.score || 'N/A'
                        }%
                      </span>
                    </div>
                  )}
                  {(analytics.voiceQuality?.averageBreathiness !== undefined || analytics.audioMetrics?.voiceQuality?.breathiness !== undefined) && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Breathiness:</span>
                      <span className="text-cyan-400 font-bold">
                        {analytics.voiceQuality?.averageBreathiness?.toFixed(2) || analytics.audioMetrics?.voiceQuality?.breathiness || 'N/A'}
                      </span>
                    </div>
                  )}
                  {(analytics.voiceQuality?.averageStrain !== undefined || analytics.audioMetrics?.voiceQuality?.strain !== undefined) && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Strain:</span>
                      <span className="text-cyan-400 font-bold">
                        {analytics.voiceQuality?.averageStrain?.toFixed(2) || analytics.audioMetrics?.voiceQuality?.strain || 'N/A'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </motion.div>

      {/* Confidence Analysis */}
      <motion.div variants={itemVariants}>
        <SectionCard title="Confidence Analysis" icon={Brain} color="teal">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Overall Confidence */}
            {analytics.confidence && (
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-teal-400" />
                  <h4 className="text-lg font-semibold text-teal-300">Voice Confidence</h4>
                </div>
                {analytics.confidence.average !== undefined && (
                  <div className="text-center mb-4">
                    <ProgressCircle 
                      score={(analytics.confidence.average * 100).toFixed(0)} 
                      size="md" 
                      color="teal" 
                    />
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  {analytics.confidence.consistency !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Consistency:</span>
                      <span className="text-teal-400">{(analytics.confidence.consistency * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  {analytics.confidence.trend && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Trend:</span>
                      <StatusBadge text={analytics.confidence.trend} color="teal" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confidence Scores Breakdown */}
            {analytics.confidenceScores && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <h4 className="text-lg font-semibold text-blue-300">Confidence Breakdown</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Voice Modulation:</span>
                    <div className="flex items-center gap-2">
                      <ProgressCircle score={analytics.confidenceScores.voiceModulationScore} size="sm" color="blue" />
                      <span className="text-blue-400 font-bold">{analytics.confidenceScores.voiceModulationScore}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Speech Rate:</span>
                    <div className="flex items-center gap-2">
                      <ProgressCircle score={analytics.confidenceScores.speechrate} size="sm" color="blue" />
                      <span className="text-blue-400 font-bold">{analytics.confidenceScores.speechrate}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Fluency:</span>
                    <div className="flex items-center gap-2">
                      <ProgressCircle score={analytics.confidenceScores.fluency} size="sm" color="blue" />
                      <span className="text-blue-400 font-bold">{analytics.confidenceScores.fluency}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Overall:</span>
                    <div className="flex items-center gap-2">
                      <ProgressCircle score={analytics.confidenceScores.overallConfidence} size="sm" color="blue" />
                      <span className="text-blue-400 font-bold">{analytics.confidenceScores.overallConfidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </motion.div>

      {/* Insights & Feedback */}
      {analytics.insights && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Performance Insights" icon={TrendingUp} color="purple">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Strengths */}
              {analytics.insights.strengths && analytics.insights.strengths.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h4 className="text-lg font-semibold text-green-300">
                      Key Strengths ({analytics.insights.strengths.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {analytics.insights.strengths.map((strength, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-gray-300 leading-relaxed">{strength}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {analytics.insights.improvements && analytics.insights.improvements.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-orange-400" />
                    <h4 className="text-lg font-semibold text-orange-300">
                      Areas for Improvement ({analytics.insights.improvements.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {analytics.insights.improvements.map((improvement, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-gray-300 leading-relaxed">{improvement}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Overall Feedback */}
            {analytics.insights.feedback && (
              <div className="mt-6 bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-purple-300 mb-2">Overall Feedback</h4>
                <p className="text-gray-300 leading-relaxed">{analytics.insights.feedback}</p>
              </div>
            )}
          </SectionCard>
        </motion.div>
      )}

      {/* Speaking Statistics */}
      {analytics.speakingStats && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Speaking Statistics Summary" icon={BarChart3} color="indigo">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-center">
                <Clock className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-indigo-400">{analytics.speakingStats.totalSpeakingTime}s</div>
                <p className="text-gray-300 text-sm">Total Speaking Time</p>
              </div>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-center">
                <MessageSquare className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-indigo-400">{analytics.speakingStats.totalWordsSpoken}</div>
                <p className="text-gray-300 text-sm">Words Spoken</p>
              </div>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-center">
                <Activity className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-indigo-400">{analytics.speakingStats.questionsAnswered}</div>
                <p className="text-gray-300 text-sm">Questions Answered</p>
              </div>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-center">
                <TrendingUp className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-indigo-400">{analytics.speakingStats.avgWordsPerAnswer}</div>
                <p className="text-gray-300 text-sm">Avg Words/Answer</p>
              </div>
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Filler Words Detailed Analysis */}
      {analytics.fillerWordsBreakdown && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Filler Words Analysis" icon={VolumeX} color="orange">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-orange-300 mb-3">Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Filler Words:</span>
                    <span className="text-orange-400 font-bold text-xl">{analytics.fillerWordsBreakdown.totalCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Filler Percentage:</span>
                    <span className="text-orange-400 font-bold">{analytics.fillerWordsBreakdown.percentage}%</span>
                  </div>
                </div>
              </div>
              
              {analytics.fillerWordsBreakdown.detectedWords && Object.keys(analytics.fillerWordsBreakdown.detectedWords).length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-orange-300 mb-3">Breakdown by Type</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.fillerWordsBreakdown.detectedWords).map(([filler, count]) => (
                      <div key={filler} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300 capitalize">"{filler}":</span>
                        <span className="text-orange-400 font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </motion.div>
      )}
    </motion.div>
  );
};