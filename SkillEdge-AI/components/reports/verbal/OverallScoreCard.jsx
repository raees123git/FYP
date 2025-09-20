import { motion } from "framer-motion";
import { getScoreColor, getScoreLabel, getReadinessColor } from "./utils";

export default function OverallScoreCard({ overallScore, summary, readiness }) {
  return (
    <motion.div
      className="bg-card rounded-xl p-8 border border-border mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2 text-foreground">Overall Performance</h2>
          <p className="text-muted-foreground mb-4">{summary}</p>
          <div className={`inline-block px-4 py-2 rounded-lg border ${getReadinessColor(readiness)}`}>
            <span className="font-semibold">Interview Readiness: </span>
            <span className="capitalize">{readiness}</span>
          </div>
        </div>
        <div className="text-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-secondary"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallScore / 100)}`}
                className={getScoreColor(overallScore)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </span>
              <span className="text-xs text-muted-foreground">out of 100</span>
            </div>
          </div>
          <p className={`mt-2 font-semibold ${getScoreColor(overallScore)}`}>
            {getScoreLabel(overallScore)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
