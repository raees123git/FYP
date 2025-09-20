import { motion } from "framer-motion";
import { Lightbulb, Sparkles } from "lucide-react";

export default function RecommendationsSection({ recommendations }) {
  return (
    <motion.div
      className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
    >
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <Lightbulb className="w-6 h-6 mr-2 text-accent" />
        Recommendations for Improvement
      </h2>
      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={idx}
            className="flex items-start"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3 + idx * 0.1 }}
          >
            <Sparkles className="w-5 h-5 text-accent mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-foreground">{rec}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
