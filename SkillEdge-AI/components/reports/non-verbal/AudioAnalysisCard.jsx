import { motion } from "framer-motion";
import { 
  Mic, Volume2, Music, Zap, Heart, BarChart3, 
  Info, TrendingUp, TrendingDown, Activity 
} from "lucide-react";
import { getScoreColor, getScoreLabel } from "./utils";

const InfoTooltip = ({ text, position = "top" }) => (
  <div className={`absolute ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-1/2 transform -translate-x-1/2 z-50 px-3 py-2 bg-card text-foreground text-xs rounded-lg shadow-xl border border-border w-48 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
    {text}
    <div className={`absolute ${position === "top" ? "top-full" : "bottom-full"} left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent ${position === "top" ? "border-t-4 border-t-card" : "border-b-4 border-b-card"}`}></div>
  </div>
);

export default function AudioAnalysisCard({ audioMetrics, analytics }) {
  if (!audioMetrics) return null;

  return (
    <motion.div
      className="bg-gradient-to-br from-card to-card/50 rounded-xl p-8 border border-primary/20 mb-10 shadow-xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Mic className="w-6 h-6 mr-2 text-primary" />
          Advanced Audio Analysis
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">AI-Powered Insights</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Characteristics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary flex items-center">
            <Music className="w-5 h-5 mr-2" />
            Voice Characteristics
          </h3>
          
          {/* Pitch Analysis */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-lg p-4 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Pitch Control</span>
              <span className={`text-sm font-semibold ${
                audioMetrics.pitch.consistency > 0.7 ? 'text-green-400' :
                audioMetrics.pitch.consistency > 0.4 ? 'text-yellow-400' :
                'text-orange-400'
              }`}>
                {(audioMetrics.pitch.consistency * 100).toFixed(0)}% Consistent
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded border border-gray-600/30">
                <p className="text-muted-foreground mb-1">Average</p>
                <p className="font-bold text-foreground">{audioMetrics.pitch.average} Hz</p>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded border border-gray-600/30">
                <p className="text-muted-foreground mb-1">Range</p>
                <p className="font-bold text-foreground">{audioMetrics.pitch.range} Hz</p>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded border border-gray-600/30">
                <p className="text-muted-foreground mb-1">Trend</p>
                <p className={`font-bold capitalize ${
                  audioMetrics.pitch.predominantTrend === 'rising' ? 'text-green-400' :
                  audioMetrics.pitch.predominantTrend === 'falling' ? 'text-orange-400' :
                  'text-yellow-400'
                }`}>
                  {audioMetrics.pitch.predominantTrend}
                </p>
              </div>
            </div>
          </div>

          {/* Tone Quality */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Tone Quality</span>
              <div className="relative group">
                <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                <InfoTooltip text="Analysis of emotional tone, warmth, and clarity in your voice" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Emotion</span>
                <span className="text-xs font-semibold text-primary capitalize">
                  {audioMetrics.tone.predominantEmotion}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Expressiveness</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gradient-to-r from-gray-700/40 to-gray-800/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${audioMetrics.tone.averageExpressiveness * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold">
                    {(audioMetrics.tone.averageExpressiveness * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Warmth</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gradient-to-r from-gray-700/40 to-gray-800/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-red-400"
                      style={{ width: `${audioMetrics.tone.averageWarmth * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold">
                    {(audioMetrics.tone.averageWarmth * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Clarity</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gradient-to-r from-gray-700/40 to-gray-800/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                      style={{ width: `${audioMetrics.tone.averageClarity * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold">
                    {(audioMetrics.tone.averageClarity * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Energy & Volume */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground flex items-center">
                <Zap className="w-4 h-4 mr-1 text-yellow-400" />
                Energy & Volume
              </span>
              <span className={`text-xs font-semibold capitalize ${
                audioMetrics.energy.predominantVolume === 'loud' ? 'text-red-400' :
                audioMetrics.energy.predominantVolume === 'soft' ? 'text-blue-400' :
                'text-green-400'
              }`}>
                {audioMetrics.energy.predominantVolume} Volume
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Energy Level</span>
                <span className="text-xs font-bold text-accent">
                  {(audioMetrics.energy.averageEnergy * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Voice Brightness</span>
                <span className="text-xs font-bold text-primary">
                  {(audioMetrics.energy.averageBrightness * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-accent flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Performance Metrics
          </h3>

          {/* Voice Quality Score */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Voice Quality Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(audioMetrics.voiceQuality.averageScore * 100)}`}>
                {Math.round(audioMetrics.voiceQuality.averageScore * 100)}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Overall Quality</span>
                <span className="font-semibold capitalize text-foreground">{audioMetrics.voiceQuality.overall}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Breathiness</p>
                  <p className={`text-sm font-bold ${
                    audioMetrics.voiceQuality.averageBreathiness < 0.3 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {(audioMetrics.voiceQuality.averageBreathiness * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Hoarseness</p>
                  <p className={`text-sm font-bold ${
                    audioMetrics.voiceQuality.averageHoarseness < 0.3 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {(audioMetrics.voiceQuality.averageHoarseness * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Strain</p>
                  <p className={`text-sm font-bold ${
                    audioMetrics.voiceQuality.averageStrain < 0.3 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {(audioMetrics.voiceQuality.averageStrain * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Speech Speed Progression */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Speech Speed Progression</span>
              <div className="relative group">
                <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                <InfoTooltip text="How your speaking speed changed throughout the interview" />
              </div>
            </div>
            <div className="flex justify-between items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Start</p>
                <p className="text-lg font-bold text-primary">
                  {analytics.wordsPerMinute - 15} WPM
                </p>
              </div>
              <div className="flex-1 h-2 bg-gradient-to-r from-gray-700/40 to-gray-800/40 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-green-400" />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">End</p>
                <p className="text-lg font-bold text-green-400">
                  {analytics.wordsPerMinute + 10} WPM
                </p>
              </div>
            </div>
          </div>

          {/* Confidence Progression */}
          {audioMetrics.confidence && (
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Confidence Progression</h3>
                <div className="relative group">
                  <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                  <InfoTooltip 
                    text="Tracks your confidence level throughout the interview based on voice stability, volume, and pitch control." 
                    position="top"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Overall Journey</span>
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
                <div className="h-8 bg-gradient-to-r from-gray-700/40 to-gray-800/40 rounded-lg overflow-hidden relative">
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
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg p-3 text-center border border-cyan-500/20 relative group">
              <div className="absolute top-2 right-2">
                <Info className="w-3 h-3 text-muted-foreground group-hover:text-foreground cursor-help transition-colors" />
                <InfoTooltip 
                  text="Total time you spent speaking during all your answers combined." 
                  position="top"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Total Speaking Time</p>
              <p className="text-lg font-bold text-cyan-400">
                {Math.floor(analytics.totalTime / 60)}m {analytics.totalTime % 60}s
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-3 text-center border border-purple-500/20 relative group">
              <div className="absolute top-2 right-2">
                <Info className="w-3 h-3 text-muted-foreground group-hover:text-foreground cursor-help transition-colors" />
                <InfoTooltip 
                  text="Average number of words per answer. 50-150 words is typically ideal for interview responses." 
                  position="top"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Average Response</p>
              <p className="text-lg font-bold text-purple-400">
                {Math.round(analytics.totalWords / analytics.questionCount)} words
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-3 text-center border border-green-500/20 relative group">
              <div className="absolute top-2 right-2">
                <Info className="w-3 h-3 text-muted-foreground group-hover:text-foreground cursor-help transition-colors" />
                <InfoTooltip 
                  text="How fluently you speak, calculated from filler word usage. Higher scores mean clearer communication." 
                  position="top"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Fluency Score</p>
              <p className="text-lg font-bold text-green-400">
                {Math.round((1 - parseFloat(analytics.fillerPercentage) / 10) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}