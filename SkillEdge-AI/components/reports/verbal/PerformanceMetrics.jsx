import { motion } from "framer-motion";
import { 
  CheckCircle, Brain, BookOpen, Layers, Zap, MessageSquare 
} from "lucide-react";
import { getScoreColor } from "./utils";

const MetricCard = ({ icon: Icon, iconColor, title, score, description, delay, children, gradientFrom = "primary", gradientTo = "accent" }) => (
  <motion.div
    className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <Icon className={`w-8 h-8 mr-3 ${iconColor}`} />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
        {score}%
      </span>
    </div>
    <p className="text-sm text-muted-foreground mb-3">
      {description}
    </p>
    <div className="h-2 bg-secondary rounded-full overflow-hidden">
      <div 
        className={`h-full bg-gradient-to-r from-${gradientFrom} to-${gradientTo} transition-all`}
        style={{ width: `${score}%` }}
      />
    </div>
    {children}
  </motion.div>
);

export default function PerformanceMetrics({ metrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Answer Correctness */}
      <MetricCard
        icon={CheckCircle}
        iconColor="text-primary"
        title="Answer Correctness"
        score={metrics.answer_correctness.score}
        description={metrics.answer_correctness.description}
        delay={0.2}
      />

      {/* Concepts Understanding */}
      <MetricCard
        icon={Brain}
        iconColor="text-accent"
        title="Concepts"
        score={metrics.concepts_understanding.score}
        description={metrics.concepts_understanding.description}
        delay={0.3}
        gradientFrom="accent"
        gradientTo="primary"
      >
        {metrics.concepts_understanding.key_concepts.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1">Key concepts demonstrated:</p>
            <div className="flex flex-wrap gap-1">
              {metrics.concepts_understanding.key_concepts.slice(0, 3).map((concept, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}
      </MetricCard>

      {/* Domain Knowledge */}
      <MetricCard
        icon={BookOpen}
        iconColor="text-primary"
        title="Domain Knowledge"
        score={metrics.domain_knowledge.score}
        description={metrics.domain_knowledge.description}
        delay={0.4}
      />

      {/* Response Structure */}
      <MetricCard
        icon={Layers}
        iconColor="text-accent"
        title="Response Structure"
        score={metrics.response_structure.score}
        description={metrics.response_structure.description}
        delay={0.5}
        gradientFrom="accent"
        gradientTo="primary"
      >
        <div className="mt-3 text-xs">
          <p className="text-muted-foreground">
            <span className="font-semibold">Flow:</span> {metrics.response_structure.logical_flow}
          </p>
          <p className="text-muted-foreground">
            <span className="font-semibold">Completeness:</span> {metrics.response_structure.completeness}
          </p>
        </div>
      </MetricCard>

      {/* Depth of Explanation */}
      <MetricCard
        icon={Zap}
        iconColor="text-primary"
        title="Depth"
        score={metrics.depth_of_explanation.score}
        description={metrics.depth_of_explanation.description}
        delay={0.6}
      >
        <div className="mt-3 flex justify-between text-xs">
          <span className="text-muted-foreground">Technical Depth:</span>
          <span className={`font-semibold capitalize ${
            metrics.depth_of_explanation.technical_depth === 'deep' ? 'text-green-500' :
            metrics.depth_of_explanation.technical_depth === 'moderate' ? 'text-primary' :
            'text-accent'
          }`}>
            {metrics.depth_of_explanation.technical_depth}
          </span>
        </div>
      </MetricCard>

      {/* Vocabulary Richness */}
      <MetricCard
        icon={MessageSquare}
        iconColor="text-accent"
        title="Vocabulary"
        score={metrics.vocabulary_richness.score}
        description={metrics.vocabulary_richness.description}
        delay={0.7}
        gradientFrom="accent"
        gradientTo="primary"
      >
        <div className="mt-3 flex justify-between text-xs">
          <span className="text-muted-foreground">Level:</span>
          <span className={`font-semibold capitalize ${
            metrics.vocabulary_richness.vocabulary_level === 'advanced' ? 'text-green-500' :
            metrics.vocabulary_richness.vocabulary_level === 'intermediate' ? 'text-primary' :
            'text-accent'
          }`}>
            {metrics.vocabulary_richness.vocabulary_level}
          </span>
        </div>
      </MetricCard>
    </div>
  );
}