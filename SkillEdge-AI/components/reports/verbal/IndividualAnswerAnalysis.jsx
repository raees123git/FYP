import { motion } from "framer-motion";
import { FileText, Hash, CheckCircle, AlertCircle } from "lucide-react";
import { getScoreColor } from "./utils";

export default function IndividualAnswerAnalysis({ answers }) {
  return (
    <motion.div
      className="bg-card rounded-xl p-6 border border-border mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <FileText className="w-6 h-6 mr-2 text-primary" />
        Individual Answer Analysis
      </h2>
      <div className="space-y-4">
        {answers.map((answer, idx) => (
          <motion.div
            key={idx}
            className="bg-secondary/50 rounded-lg p-4 border border-border"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + idx * 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center">
                <Hash className="w-4 h-4 mr-1 text-primary" />
                Question {answer.question_number}
              </h3>
              <span className={`text-lg font-bold ${getScoreColor(answer.correctness)}`}>
                {answer.correctness}%
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Strengths
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {answer.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-accent mb-2 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Areas for Improvement
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {answer.improvements.map((improvement, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-accent mr-1">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}