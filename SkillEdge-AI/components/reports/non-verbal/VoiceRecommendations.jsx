import { motion } from "framer-motion";
import { Award, CheckCircle, AlertTriangle, AlertCircle, Target, Brain } from "lucide-react";

export default function VoiceRecommendations({ audioMetrics }) {
  if (!audioMetrics) return null;

  return (
    <motion.div
      className="mb-10 mt-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700"
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
  );
}