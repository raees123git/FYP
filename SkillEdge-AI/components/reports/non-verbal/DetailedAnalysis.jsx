import { motion } from "framer-motion";
import { Clock, Mic } from "lucide-react";
import { formatTime } from "./utils";

export default function DetailedAnalysis({ analytics }) {
  return (
    <motion.div
      className="bg-card rounded-xl p-8 border border-border mb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-primary">Detailed Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Speaking Statistics */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            Speaking Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Speaking Time:</span>
              <span className="font-semibold">
                {formatTime(analytics.totalTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Words Spoken:</span>
              <span className="font-semibold">{analytics.totalWords}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Questions Answered:</span>
              <span className="font-semibold">{analytics.questionCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Words per Answer:</span>
              <span className="font-semibold">
                {Math.round(analytics.totalWords / analytics.questionCount)}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Mic className="w-5 h-5 mr-2 text-accent" />
            Key Recommendations
          </h3>
          <div className="space-y-3">
            {analytics.pauseAnalysis.recommendation && (
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-sm">{analytics.pauseAnalysis.recommendation}</p>
              </div>
            )}
            {parseFloat(analytics.fillerPercentage) > 5 && (
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-sm">
                  Consider reducing filler words by practicing pause-and-think techniques.
                </p>
              </div>
            )}
            {analytics.wordsPerMinute < 120 && (
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-sm">
                  Try to speak slightly faster to maintain better engagement with your audience.
                </p>
              </div>
            )}
            {analytics.wordsPerMinute > 160 && (
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-sm">
                  Consider slowing down your speech for improved clarity and comprehension.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}