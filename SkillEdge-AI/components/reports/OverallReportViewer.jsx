"use client";

import { motion } from "framer-motion";
import { 
  BarChart3, 
  Target, 
  Trophy,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Award,
  Star,
  AlertCircle,
  Lightbulb,
  Calendar,
  Zap
} from "lucide-react";
import { 
  ProgressCircle, 
  MetricCard, 
  ProgressBar, 
  SectionCard, 
  StatusBadge, 
  ListItem 
} from './ReportComponents';

export const OverallReportViewer = ({ data }) => {
  if (!data) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Calculate performance level based on overall score
  const getPerformanceLevel = (score) => {
    if (score >= 90) return { level: "Excellent", color: "green", icon: Trophy };
    if (score >= 80) return { level: "Very Good", color: "blue", icon: Award };
    if (score >= 70) return { level: "Good", color: "purple", icon: Star };
    if (score >= 60) return { level: "Average", color: "yellow", icon: Target };
    return { level: "Needs Improvement", color: "red", icon: AlertCircle };
  };

  const performanceLevel = getPerformanceLevel(data.overall_score || 0);
  const PerformanceIcon = performanceLevel.icon;

  // Calculate score difference (if available)
  const scoreDifference = (data.verbal_score || 0) - (data.nonverbal_score || 0);
  const strongerArea = scoreDifference > 0 ? "Verbal Communication" : "Non-Verbal Presence";
  const weakerArea = scoreDifference > 0 ? "Non-Verbal Presence" : "Verbal Communication";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Performance Overview Dashboard */}
      <motion.div variants={itemVariants}>
        <SectionCard title="Performance Dashboard" icon={BarChart3} color="green">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Score Display */}
            <div className="text-center">
              <div className="relative">
                <ProgressCircle 
                  score={(() => {
                    const score = data.overall_score;
                    if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) return 0;
                    return Math.max(0, Math.min(100, score));
                  })()} 
                  color={performanceLevel.color} 
                  size="lg"
                />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <StatusBadge status={performanceLevel.level} size="lg" />
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-2xl font-bold text-white mb-2">Overall Performance</h3>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <PerformanceIcon className={`w-5 h-5 text-${performanceLevel.color}-400`} />
                  <span>Interview Assessment Score</span>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-6">
              <h4 className="text-xl font-semibold text-white mb-4">Score Breakdown</h4>
              
              {/* Verbal Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-white font-medium">Verbal Communication</span>
                </div>
                <div className="flex items-center gap-3">
                  <ProgressCircle score={(() => {
                    const score = data.verbal_score;
                    if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) return 0;
                    return Math.max(0, Math.min(100, score));
                  })()} size="sm" color="blue" />
                  <span className="text-white font-semibold">{(() => {
                    const score = data.verbal_score;
                    if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) return '0%';
                    return Math.round(score) + '%';
                  })()}</span>
                </div>
              </div>

              {/* Non-Verbal Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span className="text-white font-medium">Non-Verbal Presence</span>
                </div>
                <div className="flex items-center gap-3">
                  <ProgressCircle score={(() => {
                    const score = data.nonverbal_score;
                    if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) return 0;
                    return Math.max(0, Math.min(100, score));
                  })()} size="sm" color="purple" />
                  <span className="text-white font-semibold">{(() => {
                    const score = data.nonverbal_score;
                    if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) return '0%';
                    return Math.round(score) + '%';
                  })()}</span>
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {scoreDifference > 5 ? (
                    <ArrowUpRight className="w-5 h-5 text-green-400" />
                  ) : scoreDifference < -5 ? (
                    <ArrowDownRight className="w-5 h-5 text-orange-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  )}
                  <span className="text-white font-medium">Performance Analysis</span>
                </div>
                <p className="text-gray-300 text-sm">
                  {Math.abs(scoreDifference) <= 5 
                    ? "Well-balanced performance across verbal and non-verbal communication"
                    : `Stronger in ${strongerArea} (+${Math.abs(scoreDifference).toFixed(1)} points)`
                  }
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Interview Readiness */}
      {data.interview_readiness && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Interview Readiness Assessment" icon={Target} color="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                  <Award className="w-12 h-12 text-blue-400" />
                </div>
                <StatusBadge status={data.interview_readiness} size="lg" />
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-lg font-semibold text-white mb-3">Readiness Factors</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Communication Skills Assessment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Professional Presence Evaluation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Response Quality Analysis</span>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Executive Summary */}
      {data.summary && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Executive Summary" icon={Zap} color="purple">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
              <p className="text-gray-300 leading-relaxed text-lg mb-4">{data.summary}</p>
              <div className="flex items-center gap-2 text-purple-400">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">AI-Generated Performance Analysis</span>
              </div>
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Action Items */}
      {data.action_items && data.action_items.length > 0 && (
        <motion.div variants={itemVariants}>
          <SectionCard title={`Personalized Action Plan (${data.action_items.length} items)`} icon={Target} color="orange">
            <div className="space-y-4">
              {data.action_items.map((item, index) => {
                const priority = index < 2 ? 'high' : index < 4 ? 'medium' : 'low';
                const priorityColors = {
                  high: 'border-l-red-400 bg-red-500/10',
                  medium: 'border-l-yellow-400 bg-yellow-500/10', 
                  low: 'border-l-green-400 bg-green-500/10'
                };

                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-l-4 ${priorityColors[priority]}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-semibold text-white">
                            {typeof item === 'object' ? (item.title || `Action Item ${index + 1}`) : `Action Item ${index + 1}`}
                          </h5>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {priority} priority
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {typeof item === 'string' ? item : 
                           typeof item === 'object' ? (item.description || JSON.stringify(item)) :
                           String(item)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Performance Insights */}
      {data.insights && Object.keys(data.insights).length > 0 && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Performance Insights" icon={Lightbulb} color="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.insights).map(([key, value]) => (
                <motion.div 
                  key={key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-400" />
                    <h5 className="font-semibold text-white capitalize">
                      {key.replace(/_/g, ' ')}
                    </h5>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Correlations Analysis */}
      {data.correlations && Object.keys(data.correlations).length > 0 && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Performance Correlations" icon={TrendingUp} color="green">
            <div className="space-y-4">
              <p className="text-gray-400 text-sm mb-4">
                Analysis of how different performance aspects relate to each other:
              </p>
              {Object.entries(data.correlations).map(([key, value]) => {
                // Handle object values properly
                let displayValue = 'N/A';
                if (typeof value === 'number') {
                  displayValue = value.toFixed(2);
                } else if (typeof value === 'object' && value !== null) {
                  // Extract meaningful information from object
                  if (value.impact !== undefined) {
                    displayValue = `Impact: ${value.impact}`;
                  } else if (value.correlation !== undefined) {
                    displayValue = `Correlation: ${value.correlation}`;
                  } else if (value.score !== undefined) {
                    displayValue = `Score: ${value.score}`;
                  } else if (value.level !== undefined) {
                    displayValue = `Level: ${value.level}`;
                  } else if (value.description) {
                    displayValue = value.description;
                  } else if (value.value !== undefined) {
                    displayValue = String(value.value);
                  } else {
                    // Show the first meaningful key-value pair
                    const keys = Object.keys(value);
                    if (keys.length > 0) {
                      const firstKey = keys[0];
                      displayValue = `${firstKey}: ${value[firstKey]}`;
                    }
                  }
                } else {
                  displayValue = String(value);
                }
                
                return (
                  <div key={key} className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span className="text-gray-400">
                        {displayValue}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Next Steps */}
      <motion.div variants={itemVariants}>
        <SectionCard title="Next Steps & Recommendations" icon={Calendar} color="purple">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-lg font-semibold text-white mb-4">Immediate Actions</h5>
              <ul className="space-y-3">
                <ListItem color="purple" icon={Target}>
                  Review and practice areas identified for improvement
                </ListItem>
                <ListItem color="purple" icon={TrendingUp}>
                  Focus on strengthening {weakerArea.toLowerCase()} skills
                </ListItem>
                <ListItem color="purple" icon={CheckCircle2}>
                  Continue leveraging your strength in {strongerArea.toLowerCase()}
                </ListItem>
              </ul>
            </div>
            
            <div>
              <h5 className="text-lg font-semibold text-white mb-4">Long-term Development</h5>
              <ul className="space-y-3">
                <ListItem color="green" icon={Award}>
                  Schedule regular practice interviews
                </ListItem>
                <ListItem color="green" icon={Lightbulb}>
                  Seek feedback from mentors or career counselors
                </ListItem>
                <ListItem color="green" icon={Star}>
                  Track progress with follow-up assessments
                </ListItem>
              </ul>
            </div>
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
};