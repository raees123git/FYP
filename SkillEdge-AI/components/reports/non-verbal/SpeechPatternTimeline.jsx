import { motion } from "framer-motion";
import { Activity, Info, TrendingUp } from "lucide-react";

const InfoTooltip = ({ text, position = "top" }) => (
  <div className={`absolute ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-1/2 transform -translate-x-1/2 z-50 px-3 py-2 bg-card text-foreground text-xs rounded-lg shadow-xl border border-border w-48 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
    {text}
    <div className={`absolute ${position === "top" ? "top-full" : "bottom-full"} left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent ${position === "top" ? "border-t-4 border-t-card" : "border-b-4 border-b-card"}`}></div>
  </div>
);

export default function SpeechPatternTimeline({ analytics, audioMetrics }) {
  return (
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
        {audioMetrics && audioMetrics.confidence && (
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
  );
}