import { motion } from "framer-motion";
import { TrendingUp, Activity, Pause, MessageCircle, Info } from "lucide-react";

const InfoTooltip = ({ text, position = "top" }) => (
  <div className={`absolute ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-1/2 transform -translate-x-1/2 z-50 px-3 py-2 bg-card text-foreground text-xs rounded-lg shadow-xl border border-border w-48 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
    {text}
    <div className={`absolute ${position === "top" ? "top-full" : "bottom-full"} left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent ${position === "top" ? "border-t-4 border-t-card" : "border-b-4 border-b-card"}`}></div>
  </div>
);

export default function MainStatsGrid({ analytics, flippedCards, toggleCard }) {
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Speech Rate Card */}
        <motion.div
          className="relative bg-gradient-to-br from-gray-800/50 to-indigo-900/50 rounded-xl border border-indigo-500/20 cursor-pointer h-72 hover:border-primary/50 transition-all"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => toggleCard('speechRate')}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className={`absolute inset-0 w-full h-full transition-transform duration-700 ${flippedCards.speechRate ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
            {/* Front Side */}
            <div className="absolute inset-0 w-full h-full p-6 backface-hidden bg-gradient-to-br from-gray-800/50 to-indigo-900/50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 mr-3 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Speech Rate</h3>
                </div>
                <div className="relative group" onClick={(e) => e.stopPropagation()}>
                  <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
                  <InfoTooltip text="Your speaking pace measured in words per minute. Click card for details." />
                </div>
              </div>
              <p className={`text-2xl font-bold ${analytics.speechRateColor ? analytics.speechRateColor.replace('text-', '') : ''} text-primary`}>
                {analytics.speechRate || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {analytics.speechRateDescription || 'No description available'}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-4 italic">Click to see recommendations →</p>
            </div>
            
            {/* Back Side */}
            <div className="absolute inset-0 w-full h-full p-6 rotate-y-180 backface-hidden bg-gradient-to-br from-primary/10 to-card rounded-xl border border-primary/20">
              <h4 className="text-sm font-semibold text-primary mb-3">Speech Rate Tips</h4>
              <div className="space-y-2">
                {analytics.speech_rate_tips && analytics.speech_rate_tips.length > 0 ? (
                  analytics.speech_rate_tips.map((tip, idx) => (
                    <p key={idx} className="text-xs text-foreground/80">• {tip}</p>
                  ))
                ) : (
                  // Fallback to hardcoded tips if not available
                  <>
                    {analytics.wordsPerMinute < 120 && (
                      <>
                        <p className="text-xs text-foreground/80">• Practice with a metronome app</p>
                        <p className="text-xs text-foreground/80">• Record yourself and play at 1.25x speed</p>
                        <p className="text-xs text-foreground/80">• Use fewer pauses between words</p>
                      </>
                    )}
                    {analytics.wordsPerMinute >= 120 && analytics.wordsPerMinute <= 160 && (
                      <>
                        <p className="text-xs text-green-400 font-semibold">✓ Excellent pace!</p>
                        <p className="text-xs text-foreground/80">• Maintain this rhythm</p>
                        <p className="text-xs text-foreground/80">• Focus on clarity</p>
                        <p className="text-xs text-foreground/80">• Use strategic pauses</p>
                      </>
                    )}
                    {analytics.wordsPerMinute > 160 && (
                      <>
                        <p className="text-xs text-foreground/80">• Take a breath before answering</p>
                        <p className="text-xs text-foreground/80">• Emphasize key words</p>
                        <p className="text-xs text-foreground/80">• Practice the "pause and think" method</p>
                      </>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-4 italic">Click to flip back →</p>
            </div>
          </div>
        </motion.div>

        {/* Words Per Minute Card */}
        <motion.div
          className="relative bg-gradient-to-br from-gray-800/50 to-indigo-900/50 rounded-xl border border-indigo-500/20 cursor-pointer h-72 hover:border-primary/50 transition-all"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => toggleCard('wordsPerMinute')}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className={`absolute inset-0 w-full h-full transition-transform duration-700 ${flippedCards.wordsPerMinute ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
            {/* Front Side */}
            <div className="absolute inset-0 w-full h-full p-6 backface-hidden bg-gradient-to-br from-gray-800/50 to-indigo-900/50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 mr-3 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Words Per Minute</h3>
                </div>
                <div className="relative group" onClick={(e) => e.stopPropagation()}>
                  <Info className="w-4 h-4 text-muted-foreground hover:text-accent cursor-help transition-colors" />
                  <InfoTooltip text="Average speed of your speech. Click for insights." />
                </div>
              </div>
              <p className="text-3xl font-bold text-accent">
                {analytics.wordsPerMinute || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Average WPM across all answers
              </p>
              <div className="mt-3 bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-lg p-2 border border-gray-600/30">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slow</span>
                  <span>Optimal</span>
                  <span>Fast</span>
                </div>
                <div className="relative h-2 bg-muted rounded-full mt-1">
                  <div 
                    className="absolute h-2 bg-accent rounded-full"
                    style={{
                      width: `${analytics.wordsPerMinute ? Math.min(100, Math.max(0, ((analytics.wordsPerMinute - 80) / 120) * 100)) : 0}%`
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-2 italic">Click for analysis →</p>
            </div>
            
            {/* Back Side */}
            <div className="absolute inset-0 w-full h-full p-6 rotate-y-180 backface-hidden bg-gradient-to-br from-accent/10 to-card rounded-xl border border-accent/20">
              <h4 className="text-sm font-semibold text-accent mb-3">Speaking Speed Analysis</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-foreground/80">
                  <span>Your Speed:</span>
                  <span className="font-bold">{analytics.wordsPerMinute || 'N/A'} WPM</span>
                </div>
                <div className="flex justify-between text-foreground/80">
                  <span>Ideal Range:</span>
                  <span>120-160 WPM</span>
                </div>
                <div className="flex justify-between text-foreground/80">
                  <span>Time per word:</span>
                  <span>{analytics.time_per_word ? analytics.time_per_word.toFixed(2) : analytics.wordsPerMinute ? (60/analytics.wordsPerMinute).toFixed(2) : 'N/A'}s</span>
                </div>
                <hr className="border-border my-2" />
                <p className="text-foreground/80">
                  {analytics.wordsPerMinute ? (analytics.wordsPerMinute < 120 ? "You could speed up by 10-15%" :
                   analytics.wordsPerMinute > 160 ? "Try slowing down by 10-15%" :
                   "Perfect speed for interviews!") : "Speed analysis unavailable"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-4 italic">Click to flip back →</p>
            </div>
          </div>
        </motion.div>

        {/* Pause Pattern Card */}
        <motion.div
          className="relative bg-gradient-to-br from-gray-800/50 to-indigo-900/50 rounded-xl border border-indigo-500/20 cursor-pointer h-72 hover:border-primary/50 transition-all"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => toggleCard('pausePattern')}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className={`absolute inset-0 w-full h-full transition-transform duration-700 ${flippedCards.pausePattern ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
            {/* Front Side */}
            <div className="absolute inset-0 w-full h-full p-6 backface-hidden bg-gradient-to-br from-gray-800/50 to-indigo-900/50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Pause className="w-8 h-8 mr-3 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Pause Pattern</h3>
                </div>
                <div className="relative group" onClick={(e) => e.stopPropagation()}>
                  <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
                  <InfoTooltip text="How you use pauses in speech. Click card for recommendations." />
                </div>
              </div>
              <p className={`text-2xl font-bold text-primary`}>
                {analytics.pauseAnalysis?.type || analytics.pauseAnalysis?.pattern || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {analytics.pauseAnalysis?.description || 'No pause analysis available'}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-4 italic">Click to see pause tips →</p>
            </div>
            {/* Back Side */}
            <div className="absolute inset-0 w-full h-full p-6 rotate-y-180 backface-hidden bg-gradient-to-br from-primary/10 to-card rounded-xl border border-primary/20">
              <h4 className="text-sm font-semibold text-primary mb-3">Pause Recommendations</h4>
              <div className="space-y-2 text-xs text-foreground/80">
                {analytics.pause_recommendations && analytics.pause_recommendations.length > 0 ? (
                  analytics.pause_recommendations.map((rec, idx) => (
                    <p key={idx}>• {rec}</p>
                  ))
                ) : (
                  // Fallback to hardcoded recommendations
                  <>
                    {(analytics.pauseAnalysis.type === 'Long Pauses' || analytics.pauseAnalysis.pattern === 'Too Many Long Pauses') && (
                      <>
                        <p>• Reduce gap between sentences</p>
                        <p>• Keep pause between 0.5s–1s</p>
                        <p>• Practice speaking with a timer</p>
                      </>
                    )}
                    {(analytics.pauseAnalysis.type === 'Short Pauses' || analytics.pauseAnalysis.pattern === 'Rushed Speech') && (
                      <>
                        <p>• Add brief pauses after key points</p>
                        <p>• Breathe between sentences</p>
                        <p>• Use pauses to emphasize</p>
                      </>
                    )}
                    {(analytics.pauseAnalysis.type === 'Good Pauses' || analytics.pauseAnalysis.pattern === 'Balanced') && (
                      <>
                        <p className="text-green-400 font-semibold">✓ Great use of pauses</p>
                        <p>• Maintain this rhythm</p>
                        <p>• Use pauses strategically</p>
                      </>
                    )}
                    {(analytics.pauseAnalysis.type === 'Mixed Pauses' || analytics.pauseAnalysis.pattern === 'Mixed Pauses') && (
                      <>
                        <p>• Aim for consistent pattern</p>
                        <p>• Practice structured answers</p>
                        <p>• Use the STAR method</p>
                      </>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-4 italic">Click to flip back →</p>
            </div>
          </div>
        </motion.div>

        {/* Filler Words Card */}
        <motion.div
          className="relative bg-gradient-to-br from-gray-800/50 to-indigo-900/50 rounded-xl border border-indigo-500/20 cursor-pointer h-72 hover:border-primary/50 transition-all"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => toggleCard('fillerWords')}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className={`absolute inset-0 w-full h-full transition-transform duration-700 ${flippedCards.fillerWords ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
            {/* Front Side */}
            <div className="absolute inset-0 w-full h-full p-6 backface-hidden bg-gradient-to-br from-gray-800/50 to-indigo-900/50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MessageCircle className="w-8 h-8 mr-3 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Filler Words</h3>
                </div>
                <div className="relative group" onClick={(e) => e.stopPropagation()}>
                  <Info className="w-4 h-4 text-muted-foreground hover:text-accent cursor-help transition-colors" />
                  <InfoTooltip text="Percentage of unnecessary words like 'um', 'uh', 'like'. Click to see which ones you used." />
                </div>
              </div>
              <p className="text-3xl font-bold text-accent">
                {analytics.fillerPercentage || 0}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {analytics.fillerWords || 0} filler words out of {analytics.totalWords || 0} total
              </p>
              <div className="mt-3">
                <div className="h-2 bg-gradient-to-r from-gray-700/40 to-gray-800/40 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      parseFloat(analytics.fillerPercentage || 0) < 3 ? 'bg-green-500' :
                      parseFloat(analytics.fillerPercentage || 0) < 5 ? 'bg-primary' :
                      parseFloat(analytics.fillerPercentage || 0) < 8 ? 'bg-accent' :
                      'bg-destructive'
                    }`}
                    style={{ width: `${Math.min(100, (analytics.fillerPercentage || 0) * 10)}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-4 italic">Click to see words →</p>
            </div>
            
            {/* Back Side */}
            <div className="absolute inset-0 w-full h-full p-6 rotate-y-180 backface-hidden bg-gradient-to-br from-accent/10 to-card rounded-xl border border-accent/20 overflow-y-auto">
              <h4 className="text-sm font-semibold text-accent mb-3">Filler Words You Used</h4>
              {Object.keys(analytics.detectedFillerWords || {}).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analytics.detectedFillerWords)
                    .sort((a, b) => b[1] - a[1])
                    .map(([word, count]) => (
                      <span 
                        key={word}
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          count > 5 ? 'bg-destructive/20 text-destructive border border-destructive/30' :
                          count > 2 ? 'bg-accent/20 text-accent border border-accent/30' :
                          'bg-primary/20 text-primary border border-primary/30'
                        }`}
                      >
                        "{word}" ({count}x)
                      </span>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No filler words detected – great job!</p>
              )}
              <p className="text-xs text-muted-foreground/70 mt-4 italic">Click to flip back →</p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}