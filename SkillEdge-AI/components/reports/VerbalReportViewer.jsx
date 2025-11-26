"use client";

import { motion } from "framer-motion";
import { 
  MessageSquare, 
  TrendingUp, 
  Target, 
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Star,
  Award,
  BookOpen,
  Brain,
  FileText,
  Layers,
  Search,
  Gauge,
  Type,
  List,
  ChevronDown,
  ChevronRight,
  Info,
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
import { 
  extractValue, 
  formatDisplayValue, 
  shouldDisplayAsProgressBar, 
  getProgressBarValue, 
  getDetailedInfo 
} from '../../utils/reportUtils';
import { useState } from 'react';

export const VerbalReportViewer = ({ data }) => {
  if (!data) return null;

  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

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

  // Helper function to safely get score from nested objects
  const getScore = (obj) => {
    if (!obj) return 0;
    if (typeof obj.score === 'number' && !isNaN(obj.score)) return obj.score;
    return 0;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with Main Score */}
      <motion.div variants={itemVariants}>
        <SectionCard title="Verbal Analysis Overview" icon={MessageSquare} color="blue">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Main Score Circle */}
            <div className="flex flex-col items-center">
              <ProgressCircle 
                score={data.overall_score || 0} 
                color="blue" 
                size="lg"
                label="/100"
              />
              <div className="text-center mt-3">
                <h4 className="text-lg font-semibold text-white">Overall Score</h4>
                <p className="text-gray-400 text-sm">Communication Performance</p>
              </div>
            </div>

            {/* Readiness Status */}
            <div className="flex flex-col justify-center items-center">
              <Award className="w-12 h-12 text-yellow-400 mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">Interview Readiness</h4>
              {data.interview_readiness && (
                <StatusBadge status={data.interview_readiness} size="lg" />
              )}
            </div>

            {/* Key Metrics Preview */}
            <div className="space-y-2">
              <MetricCard 
                title="Answer Correctness"
                value={`${getScore(data.metrics?.answer_correctness)}%`}
                color="green"
              />
              <MetricCard 
                title="Domain Knowledge" 
                value={`${getScore(data.metrics?.domain_knowledge)}%`}
                color="purple"
              />
            </div>

            <div className="space-y-2">
              <MetricCard 
                title="Concept Understanding"
                value={`${getScore(data.metrics?.concepts_understanding)}%`}
                color="blue"
              />
              <MetricCard 
                title="Response Structure"
                value={`${getScore(data.metrics?.response_structure)}%`}
                color="orange"
              />
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Core Competency Analysis */}
      <motion.div variants={itemVariants}>
        <SectionCard title="Core Competency Analysis" icon={Brain} color="blue">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Answer Correctness */}
            {data.metrics?.answer_correctness && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <h4 className="text-lg font-semibold text-white">Answer Correctness</h4>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <ProgressCircle score={getScore(data.metrics.answer_correctness)} size="sm" color="green" />
                  <span className="text-2xl font-bold text-green-400">{getScore(data.metrics.answer_correctness)}%</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{data.metrics.answer_correctness.description}</p>
                {data.metrics.answer_correctness.details && (
                  <div>
                    <button 
                      onClick={() => toggleSection('answer_correctness')}
                      className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm"
                    >
                      {expandedSections.answer_correctness ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      View Details
                    </button>
                    {expandedSections.answer_correctness && (
                      <div className="mt-2 space-y-1">
                        {data.metrics.answer_correctness.details.map((detail, idx) => (
                          <p key={idx} className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded">• {detail}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Concepts Understanding */}
            {data.metrics?.concepts_understanding && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Brain className="w-6 h-6 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">Concept Understanding</h4>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <ProgressCircle score={getScore(data.metrics.concepts_understanding)} size="sm" color="blue" />
                  <span className="text-2xl font-bold text-blue-400">{getScore(data.metrics.concepts_understanding)}%</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{data.metrics.concepts_understanding.description}</p>
                
                <div className="space-y-2">
                  {data.metrics.concepts_understanding.key_concepts && (
                    <div>
                      <button 
                        onClick={() => toggleSection('key_concepts')}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        {expandedSections.key_concepts ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Key Concepts ({data.metrics.concepts_understanding.key_concepts.length})
                      </button>
                      {expandedSections.key_concepts && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {data.metrics.concepts_understanding.key_concepts.map((concept, idx) => (
                            <span key={idx} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                              {concept}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {data.metrics.concepts_understanding.missing_concepts && (
                    <div>
                      <button 
                        onClick={() => toggleSection('missing_concepts')}
                        className="flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm"
                      >
                        {expandedSections.missing_concepts ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Areas for Growth ({data.metrics.concepts_understanding.missing_concepts.length})
                      </button>
                      {expandedSections.missing_concepts && (
                        <div className="mt-2 space-y-1">
                          {data.metrics.concepts_understanding.missing_concepts.map((concept, idx) => (
                            <p key={idx} className="text-xs text-orange-300 bg-orange-500/10 p-2 rounded">• {concept}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Domain Knowledge */}
            {data.metrics?.domain_knowledge && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-6 h-6 text-purple-400" />
                  <h4 className="text-lg font-semibold text-white">Domain Knowledge</h4>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <ProgressCircle score={getScore(data.metrics.domain_knowledge)} size="sm" color="purple" />
                  <span className="text-2xl font-bold text-purple-400">{getScore(data.metrics.domain_knowledge)}%</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{data.metrics.domain_knowledge.description}</p>
                
                <div className="space-y-2">
                  {data.metrics.domain_knowledge.strengths && (
                    <div>
                      <button 
                        onClick={() => toggleSection('domain_strengths')}
                        className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                      >
                        {expandedSections.domain_strengths ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Domain Strengths ({data.metrics.domain_knowledge.strengths.length})
                      </button>
                      {expandedSections.domain_strengths && (
                        <div className="mt-2 space-y-1">
                          {data.metrics.domain_knowledge.strengths.map((strength, idx) => (
                            <p key={idx} className="text-xs text-green-300 bg-green-500/10 p-2 rounded">✓ {strength}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {data.metrics.domain_knowledge.gaps && data.metrics.domain_knowledge.gaps.length > 0 && (
                    <div>
                      <button 
                        onClick={() => toggleSection('domain_gaps')}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
                      >
                        {expandedSections.domain_gaps ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Knowledge Gaps ({data.metrics.domain_knowledge.gaps.length})
                      </button>
                      {expandedSections.domain_gaps && (
                        <div className="mt-2 space-y-1">
                          {data.metrics.domain_knowledge.gaps.map((gap, idx) => (
                            <p key={idx} className="text-xs text-red-300 bg-red-500/10 p-2 rounded">• {gap}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </motion.div>

      {/* Communication Analysis */}
      <motion.div variants={itemVariants}>
        <SectionCard title="Communication & Structure Analysis" icon={FileText} color="orange">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Response Structure */}
            {data.metrics?.response_structure && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Layers className="w-6 h-6 text-orange-400" />
                  <h4 className="text-lg font-semibold text-white">Response Structure</h4>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <ProgressCircle score={getScore(data.metrics.response_structure)} size="sm" color="orange" />
                  <span className="text-2xl font-bold text-orange-400">{getScore(data.metrics.response_structure)}%</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{data.metrics.response_structure.description}</p>
                
                <div className="space-y-2 text-sm">
                  {data.metrics.response_structure.logical_flow && (
                    <div className="bg-gray-700/30 p-2 rounded">
                      <span className="text-orange-400 font-medium">Logical Flow:</span>
                      <p className="text-gray-300">{data.metrics.response_structure.logical_flow}</p>
                    </div>
                  )}
                  {data.metrics.response_structure.completeness && (
                    <div className="bg-gray-700/30 p-2 rounded">
                      <span className="text-orange-400 font-medium">Completeness:</span>
                      <p className="text-gray-300">{data.metrics.response_structure.completeness}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Depth of Explanation */}
            {data.metrics?.depth_of_explanation && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Search className="w-6 h-6 text-indigo-400" />
                  <h4 className="text-lg font-semibold text-white">Depth of Explanation</h4>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <ProgressCircle score={getScore(data.metrics.depth_of_explanation)} size="sm" color="indigo" />
                  <span className="text-2xl font-bold text-indigo-400">{getScore(data.metrics.depth_of_explanation)}%</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{data.metrics.depth_of_explanation.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-400">Examples Used:</span>
                    <span className={`px-2 py-1 rounded text-xs ${data.metrics.depth_of_explanation.examples_used ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {data.metrics.depth_of_explanation.examples_used ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-400">Technical Depth:</span>
                    <span className="text-gray-300 capitalize">{data.metrics.depth_of_explanation.technical_depth}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </motion.div>

      {/* Vocabulary Analysis */}
      {data.metrics?.vocabulary_richness && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Vocabulary & Language Analysis" icon={Type} color="cyan">
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Type className="w-6 h-6 text-cyan-400" />
                    <h4 className="text-lg font-semibold text-white">Vocabulary Richness</h4>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <ProgressCircle score={getScore(data.metrics.vocabulary_richness)} size="sm" color="cyan" />
                    <span className="text-2xl font-bold text-cyan-400">{getScore(data.metrics.vocabulary_richness)}%</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{data.metrics.vocabulary_richness.description}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-400 text-sm">Vocabulary Level:</span>
                    <span className="text-white capitalize font-medium">{data.metrics.vocabulary_richness.vocabulary_level}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {data.metrics.vocabulary_richness.technical_terms_used && (
                    <div>
                      <button 
                        onClick={() => toggleSection('technical_terms')}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm mb-2"
                      >
                        {expandedSections.technical_terms ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Technical Terms ({data.metrics.vocabulary_richness.technical_terms_used.length})
                      </button>
                      {expandedSections.technical_terms && (
                        <div className="flex flex-wrap gap-1">
                          {data.metrics.vocabulary_richness.technical_terms_used.map((term, idx) => (
                            <span key={idx} className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {data.metrics.vocabulary_richness.repetitive_words && data.metrics.vocabulary_richness.repetitive_words.length > 0 && (
                    <div>
                      <button 
                        onClick={() => toggleSection('repetitive_words')}
                        className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm mb-2"
                      >
                        {expandedSections.repetitive_words ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Repetitive Words ({data.metrics.vocabulary_richness.repetitive_words.length})
                      </button>
                      {expandedSections.repetitive_words && (
                        <div className="flex flex-wrap gap-1">
                          {data.metrics.vocabulary_richness.repetitive_words.map((word, idx) => (
                            <span key={idx} className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                              {word}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Question-by-Question Analysis */}
      {data.individual_answers && data.individual_answers.length > 0 && (
        <motion.div variants={itemVariants}>
          <SectionCard title={`Question-by-Question Analysis (${data.individual_answers.length} Questions)`} icon={MessageSquare} color="teal">
            <div className="space-y-3">
              {data.individual_answers.map((answer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-teal-500/10 border border-teal-500/20 rounded-lg overflow-hidden"
                >
                  {/* Question Header - Clickable */}
                  <button
                    onClick={() => toggleSection(`question_${index}`)}
                    className="w-full flex items-center justify-between p-4 hover:bg-teal-500/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center">
                        <span className="text-teal-400 font-bold text-sm">
                          {answer.question_number || index + 1}
                        </span>
                      </div>
                      <div className="text-left">
                        <h4 className="text-lg font-semibold text-white">
                          Question {answer.question_number || index + 1}
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-2">
                            {answer.correctness !== undefined && (
                              <>
                                <ProgressCircle score={answer.correctness} size="sm" color="teal" />
                                <span className="text-teal-400 font-bold">{answer.correctness}%</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            {answer.strengths?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-400" />
                                {answer.strengths.length} strengths
                              </span>
                            )}
                            {answer.improvements?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-orange-400" />
                                {answer.improvements.length} improvements
                              </span>
                            )}
                            {answer.missing_points?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-red-400" />
                                {answer.missing_points.length} missing
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {answer.correctness !== undefined && (
                        <div className="text-right mr-3">
                          <div className="text-sm text-gray-400">Score</div>
                          <div className="text-xl font-bold text-teal-400">{answer.correctness}%</div>
                        </div>
                      )}
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedSections[`question_${index}`] ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </button>

                  {/* Expandable Content */}
                  {expandedSections[`question_${index}`] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-teal-500/20"
                    >
                      <div className="p-6">
                        {/* Question and Answer Display */}
                        {(data.questions?.[index] || data.answers?.[index]) && (
                          <div className="mb-6 space-y-4">
                            {/* Question */}
                            {data.questions?.[index] && (
                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-1">
                                    <span className="text-blue-400 font-bold text-xs">Q</span>
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-sm font-semibold text-blue-300 mb-2">Question</h5>
                                    <p className="text-gray-300 leading-relaxed">{data.questions[index]}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Answer */}
                            {data.answers?.[index] && (
                              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-1">
                                    <span className="text-purple-400 font-bold text-xs">A</span>
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-sm font-semibold text-purple-300 mb-2">Your Answer</h5>
                                    <p className="text-gray-300 leading-relaxed">{data.answers[index]}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Left Column - Positive Aspects */}
                          <div className="space-y-4">
                            
                            {/* Strengths */}
                            {answer.strengths && answer.strengths.length > 0 && (
                              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                  <h5 className="text-lg font-semibold text-green-300">
                                    Strengths ({answer.strengths.length})
                                  </h5>
                                </div>
                                <div className="space-y-2">
                                  {answer.strengths.map((strength, idx) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className="flex items-start gap-2 text-sm text-gray-300"
                                    >
                                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                      <p className="leading-relaxed">{strength}</p>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Key Points Covered */}
                            {answer.key_points_covered && answer.key_points_covered.length > 0 && (
                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <button 
                                  onClick={() => toggleSection(`key_points_${index}`)}
                                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-3 w-full text-left"
                                >
                                  {expandedSections[`key_points_${index}`] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                  <Award className="w-5 h-5" />
                                  <h5 className="text-lg font-semibold">
                                    Key Points Covered ({answer.key_points_covered.length})
                                  </h5>
                                </button>
                                {expandedSections[`key_points_${index}`] && (
                                  <div className="space-y-2">
                                    {answer.key_points_covered.map((point, idx) => (
                                      <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-start gap-2 text-sm"
                                      >
                                        <CheckCircle className="w-3 h-3 text-blue-400 mt-1 flex-shrink-0" />
                                        <p className="text-gray-300 leading-relaxed">{point}</p>
                                      </motion.div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right Column - Areas for Growth */}
                          <div className="space-y-4">
                            
                            {/* Areas for Improvement */}
                            {answer.improvements && answer.improvements.length > 0 && (
                              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Target className="w-5 h-5 text-orange-400" />
                                  <h5 className="text-lg font-semibold text-orange-300">
                                    Areas for Improvement ({answer.improvements.length})
                                  </h5>
                                </div>
                                <div className="space-y-2">
                                  {answer.improvements.map((improvement, idx) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, x: 10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className="flex items-start gap-2 text-sm text-gray-300"
                                    >
                                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                                      <p className="leading-relaxed">{improvement}</p>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Missing Points */}
                            {answer.missing_points && answer.missing_points.length > 0 && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                <button 
                                  onClick={() => toggleSection(`missing_points_${index}`)}
                                  className="flex items-center gap-2 text-red-400 hover:text-red-300 mb-3 w-full text-left"
                                >
                                  {expandedSections[`missing_points_${index}`] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                  <AlertCircle className="w-5 h-5" />
                                  <h5 className="text-lg font-semibold">
                                    Missing Key Points ({answer.missing_points.length})
                                  </h5>
                                </button>
                                {expandedSections[`missing_points_${index}`] && (
                                  <div className="space-y-2">
                                    {answer.missing_points.map((point, idx) => (
                                      <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-start gap-2 text-sm"
                                      >
                                        <AlertCircle className="w-3 h-3 text-red-400 mt-1 flex-shrink-0" />
                                        <p className="text-gray-300 leading-relaxed">{point}</p>
                                      </motion.div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Performance Summary Footer */}
                        <div className="mt-6 pt-4 border-t border-gray-600/30">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-gray-400">
                                <span className="text-green-400 font-medium">{answer.strengths?.length || 0}</span> strengths identified
                              </span>
                              <span className="text-gray-400">
                                <span className="text-blue-400 font-medium">{answer.key_points_covered?.length || 0}</span> key points covered
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-gray-400">
                                <span className="text-orange-400 font-medium">{answer.improvements?.length || 0}</span> improvement areas
                              </span>
                              <span className="text-gray-400">
                                <span className="text-red-400 font-medium">{answer.missing_points?.length || 0}</span> missing points
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Executive Summary */}
      {data.summary && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Executive Summary" icon={BookOpen} color="purple">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
              <p className="text-gray-300 leading-relaxed text-lg">{data.summary}</p>
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        {data.strengths && data.strengths.length > 0 && (
          <motion.div variants={itemVariants}>
            <SectionCard title={`Key Strengths (${data.strengths.length})`} icon={CheckCircle} color="green">
              <ul className="space-y-3">
                {data.strengths.map((strength, index) => (
                  <ListItem key={index} color="green" icon={Star}>
                    {strength}
                  </ListItem>
                ))}
              </ul>
            </SectionCard>
          </motion.div>
        )}

        {/* Areas for Improvement */}
        {data.improvements && data.improvements.length > 0 && (
          <motion.div variants={itemVariants}>
            <SectionCard title={`Improvement Areas (${data.improvements.length})`} icon={TrendingUp} color="orange">
              <ul className="space-y-3">
                {data.improvements.map((improvement, index) => (
                  <ListItem key={index} color="orange" icon={Target}>
                    {improvement}
                  </ListItem>
                ))}
              </ul>
            </SectionCard>
          </motion.div>
        )}
      </div>

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <motion.div variants={itemVariants}>
          <SectionCard title={`Personalized Recommendations (${data.recommendations.length})`} icon={Lightbulb} color="purple">
            <div className="grid gap-4">
              {data.recommendations.map((recommendation, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-300 leading-relaxed">{recommendation}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Detailed Metrics */}
      {data.metrics && Object.keys(data.metrics).length > 0 && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Detailed Performance Metrics" icon={TrendingUp} color="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.metrics).map(([key, value]) => {
                if (shouldDisplayAsProgressBar(value, key)) {
                  return (
                    <div key={key} className="space-y-2">
                      <ProgressBar 
                        value={getProgressBarValue(value)} 
                        label={key.replace(/_/g, ' ').toUpperCase()} 
                        color="blue"
                      />
                    </div>
                  );
                }
                
                const displayValue = formatDisplayValue(value, key);
                const detailedInfo = getDetailedInfo(value);
                
                return (
                  <div key={key} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
                    <h5 className="text-blue-400 font-medium mb-2 capitalize">
                      {key.replace(/_/g, ' ')}
                    </h5>
                    <div className="text-gray-300 text-sm">
                      {detailedInfo.length > 100 ? (
                        <details>
                          <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                            {displayValue.substring(0, 50)}...
                          </summary>
                          <div className="mt-2 text-xs bg-gray-800/50 p-2 rounded whitespace-pre-line">
                            {detailedInfo}
                          </div>
                        </details>
                      ) : (
                        <span>{displayValue}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>
      )}
    </motion.div>
  );
};