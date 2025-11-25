import { motion } from "framer-motion";
import { Volume2, BarChart3, Info } from "lucide-react";

const InfoTooltip = ({ text, position = "top" }) => (
  <div className={`absolute ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-1/2 transform -translate-x-1/2 z-50 px-3 py-2 bg-card text-foreground text-xs rounded-lg shadow-xl border border-border w-48 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
    {text}
    <div className={`absolute ${position === "top" ? "top-full" : "bottom-full"} left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent ${position === "top" ? "border-t-4 border-t-card" : "border-b-4 border-b-card"}`}></div>
  </div>
);

export default function VolumeEnergyConfidence({ audioMetrics }) {
  if (!audioMetrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Volume & Energy Analysis */}
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
                {audioMetrics.energy?.predominantVolume ? audioMetrics.energy.predominantVolume.replace('_', ' ') : 'N/A'}
              </p>
              <p className="text-sm text-gray-400">Volume Level</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-yellow-400">
                {audioMetrics.energy?.averageBrightness || 'N/A'} {audioMetrics.energy?.averageBrightness ? 'Hz' : ''}
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
                  style={{ width: `${audioMetrics.energy?.volumeConsistency ? audioMetrics.energy.volumeConsistency * 100 : 0}%` }}
                />
              </div>
              <span className="ml-3 text-sm font-semibold text-orange-300">
                {audioMetrics.energy?.volumeConsistency ? Math.round(audioMetrics.energy.volumeConsistency * 100) : 0}%
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
                  {audioMetrics.confidence?.average ? Math.round(audioMetrics.confidence.average * 100) : 0}%
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
                  strokeDasharray={`${audioMetrics.confidence?.average ? audioMetrics.confidence.average * 283 : 0} 283`}
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
                {audioMetrics.confidence?.consistency ? Math.round(audioMetrics.confidence.consistency * 100) : 0}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Trend</p>
              <p className="text-lg font-semibold text-indigo-300 capitalize">
                {audioMetrics.confidence?.trend || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}