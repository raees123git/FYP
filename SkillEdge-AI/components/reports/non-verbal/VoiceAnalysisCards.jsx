import { motion } from "framer-motion";
import { Music, Heart, Zap, Info, Sparkles } from "lucide-react";

const InfoTooltip = ({ text, position = "top" }) => (
  <div className={`absolute ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-1/2 transform -translate-x-1/2 z-50 px-3 py-2 bg-card text-foreground text-xs rounded-lg shadow-xl border border-border w-48 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
    {text}
    <div className={`absolute ${position === "top" ? "top-full" : "bottom-full"} left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent ${position === "top" ? "border-t-4 border-t-card" : "border-b-4 border-b-card"}`}></div>
  </div>
);

export default function VoiceAnalysisCards({ audioMetrics }) {
  if (!audioMetrics) return null;

  return (
    <motion.div
      className="mb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center">
        <Sparkles className="w-6 h-6 mr-2 text-accent" />
        Advanced Voice Analysis
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pitch Analysis Card */}
        <motion.div
          className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Music className="w-8 h-8 mr-3 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Pitch Profile</h3>
            </div>
            <div className="relative group">
              <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
              <InfoTooltip text="The frequency of your voice in Hertz. Higher pitch can indicate excitement or stress, lower pitch suggests calmness or authority." />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-3xl font-bold text-primary">
                {audioMetrics.pitch.average} Hz
              </p>
              <p className="text-sm text-muted-foreground">Average Pitch</p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Level:</span>
              <span className={`font-semibold ${
                audioMetrics.pitch.predominantLevel === 'low' ? 'text-accent' :
                audioMetrics.pitch.predominantLevel === 'high' ? 'text-primary' :
                'text-green-500'
              }`}>
                {audioMetrics.pitch.predominantLevel.charAt(0).toUpperCase() + audioMetrics.pitch.predominantLevel.slice(1)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trend:</span>
              <span className="font-semibold text-accent">
                {audioMetrics.pitch.predominantTrend.charAt(0).toUpperCase() + audioMetrics.pitch.predominantTrend.slice(1)}
              </span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Consistency</span>
                <span>{Math.round(audioMetrics.pitch.consistency * 100)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${audioMetrics.pitch.consistency * 100}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Tone & Emotion Card */}
        <motion.div
          className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Heart className="w-8 h-8 mr-3 text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Emotional Tone</h3>
            </div>
            <div className="relative group">
              <Info className="w-4 h-4 text-muted-foreground hover:text-accent cursor-help transition-colors" />
              <InfoTooltip text="The emotional quality conveyed through your voice. Shows warmth, clarity, and expressiveness levels." />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-accent capitalize">
                {audioMetrics.tone.predominantEmotion}
              </p>
              <p className="text-sm text-muted-foreground">Predominant Emotion</p>
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
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Emotional Variety</p>
              <div className="flex mt-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full mr-1 ${
                      i < audioMetrics.tone.emotionalVariety
                        ? 'bg-accent'
                        : 'bg-secondary'
                    }`}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  {audioMetrics.tone.emotionalVariety} emotions
                </span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Voice Quality Card */}
        <motion.div
          className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Zap className="w-8 h-8 mr-3 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Voice Quality</h3>
            </div>
            <div className="relative group">
              <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
              <InfoTooltip text="Overall clarity and health of your voice. Measures breathiness, hoarseness, and vocal strain indicators." />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-primary capitalize">
                {audioMetrics.voiceQuality.overall}
              </p>
              <p className="text-sm text-muted-foreground">Overall Quality</p>
            </div>
            <div className="space-y-2 mt-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Breathiness</span>
                  <span className={`${
                    audioMetrics.voiceQuality.averageBreathiness < 0.3 ? 'text-green-500' :
                    audioMetrics.voiceQuality.averageBreathiness < 0.6 ? 'text-primary' :
                    'text-destructive'
                  }`}>
                    {audioMetrics.voiceQuality.averageBreathiness < 0.3 ? 'Low' :
                     audioMetrics.voiceQuality.averageBreathiness < 0.6 ? 'Medium' : 'High'}
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent"
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
    </motion.div>
  );
}