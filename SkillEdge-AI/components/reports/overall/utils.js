// Utility functions for Overall Feedback Report

// Analyze correlations between verbal and non-verbal performance
export const correlateVerbalNonVerbal = (verbalData, nonVerbalData) => {
  if (!verbalData || !nonVerbalData) return null;

  const correlations = {
    speechRateImpact: analyzeSpeechRateImpact(verbalData, nonVerbalData),
    fillerWordsImpact: analyzeFillerWordsImpact(verbalData, nonVerbalData),
    pausePatternImpact: analyzePausePatternImpact(verbalData, nonVerbalData),
    confidenceCorrelation: analyzeConfidenceCorrelation(verbalData, nonVerbalData),
    fluencyImpact: analyzeFluencyImpact(verbalData, nonVerbalData),
    overallCorrelation: calculateOverallCorrelation(verbalData, nonVerbalData)
  };

  return correlations;
};

// Analyze impact of speech rate on verbal performance
const analyzeSpeechRateImpact = (verbalData, nonVerbalData) => {
  const speechRate = nonVerbalData?.analytics?.wordsPerMinute || 140;
  const verbalScore = verbalData?.overall_score || 0;
  const depthScore = verbalData?.metrics?.depth_of_explanation?.score || 0;
  const structureScore = verbalData?.metrics?.response_structure?.score || 0;
  
  let impact = {
    level: "neutral",
    score: 0,
    description: "",
    recommendation: "",
    affectedAreas: []
  };

  if (speechRate < 120) {
    impact.level = "negative";
    impact.score = -15;
    impact.description = "Your slow speech pace may be causing you to lose momentum and engagement during explanations.";
    impact.recommendation = "Practice timed speaking exercises to maintain a steady pace of 140-150 words per minute.";
    impact.affectedAreas = ["Engagement", "Time Management", "Energy Level"];
  } else if (speechRate > 180) {
    impact.level = "negative";
    impact.score = -20;
    impact.description = "Speaking too quickly is preventing you from fully articulating complex concepts and may confuse interviewers.";
    impact.recommendation = "Use breathing exercises and deliberate pauses to slow down your delivery.";
    impact.affectedAreas = ["Clarity", "Depth of Explanation", "Comprehension"];
    
    if (depthScore < 60) {
      impact.score = -25;
      impact.description += " This is directly impacting your ability to provide detailed explanations.";
    }
  } else {
    impact.level = "positive";
    impact.score = 10;
    impact.description = "Your speech pace is optimal, allowing clear articulation of ideas.";
    impact.recommendation = "Maintain your current pace while focusing on content quality.";
    impact.affectedAreas = ["Overall Clarity"];
  }

  return impact;
};

// Analyze impact of filler words on verbal performance
const analyzeFillerWordsImpact = (verbalData, nonVerbalData) => {
  const fillerPercentage = parseFloat(nonVerbalData?.analytics?.fillerPercentage) || 0;
  const vocabularyScore = verbalData?.metrics?.vocabulary_richness?.score || 0;
  const structureScore = verbalData?.metrics?.response_structure?.score || 0;
  
  let impact = {
    level: "neutral",
    score: 0,
    description: "",
    recommendation: "",
    affectedAreas: [],
    severity: "low"
  };

  if (fillerPercentage > 10) {
    impact.level = "highly negative";
    impact.score = -30;
    impact.severity = "high";
    impact.description = "Excessive filler words are severely disrupting your thought flow and reducing the perceived confidence in your answers.";
    impact.recommendation = "Practice the 'pause and think' technique: pause silently instead of using fillers.";
    impact.affectedAreas = ["Fluency", "Confidence", "Professional Image", "Clarity"];
  } else if (fillerPercentage > 5) {
    impact.level = "negative";
    impact.score = -15;
    impact.severity = "moderate";
    impact.description = "Moderate use of filler words is affecting the smoothness of your delivery.";
    impact.recommendation = "Record yourself speaking and identify your most common fillers to consciously avoid them.";
    impact.affectedAreas = ["Fluency", "Professional Image"];
  } else if (fillerPercentage > 2) {
    impact.level = "slightly negative";
    impact.score = -5;
    impact.severity = "low";
    impact.description = "Minor filler word usage is acceptable but can be improved.";
    impact.recommendation = "Continue practicing to eliminate remaining filler words.";
    impact.affectedAreas = ["Polish"];
  } else {
    impact.level = "positive";
    impact.score = 15;
    impact.severity = "none";
    impact.description = "Excellent control over filler words demonstrates strong communication skills.";
    impact.recommendation = "Your minimal filler usage is exemplary - maintain this standard.";
    impact.affectedAreas = [];
  }

  // Additional correlation with vocabulary
  if (fillerPercentage > 5 && vocabularyScore < 60) {
    impact.score -= 10;
    impact.description += " This is compounded by limited vocabulary, creating noticeable communication gaps.";
  }

  return impact;
};

// Analyze impact of pause patterns on verbal performance
const analyzePausePatternImpact = (verbalData, nonVerbalData) => {
  const pausePattern = nonVerbalData?.analytics?.pauseAnalysis?.pattern || "Balanced";
  const conceptScore = verbalData?.metrics?.concepts_understanding?.score || 0;
  const structureScore = verbalData?.metrics?.response_structure?.score || 0;
  
  let impact = {
    level: "neutral",
    score: 0,
    description: "",
    recommendation: "",
    affectedAreas: [],
    pattern: pausePattern
  };

  switch (pausePattern) {
    case "Too Many Long Pauses":
      impact.level = "negative";
      impact.score = -20;
      impact.description = "Frequent long pauses suggest uncertainty and may indicate difficulty recalling information or organizing thoughts.";
      impact.recommendation = "Practice structured thinking using frameworks like STAR or PREP to organize responses quickly.";
      impact.affectedAreas = ["Confidence", "Fluency", "Time Management"];
      
      if (conceptScore < 60) {
        impact.score = -25;
        impact.description += " Combined with lower concept understanding, this indicates need for deeper preparation.";
      }
      break;
      
    case "Rushed Speech":
      impact.level = "negative";
      impact.score = -15;
      impact.description = "Minimal pauses create a rushed delivery that doesn't allow key points to resonate with the listener.";
      impact.recommendation = "Practice strategic pausing: pause after key points for 1-2 seconds to let them sink in.";
      impact.affectedAreas = ["Emphasis", "Comprehension", "Memorable Delivery"];
      break;
      
    case "Balanced":
      impact.level = "positive";
      impact.score = 10;
      impact.description = "Your pause pattern effectively balances fluency with thoughtful delivery.";
      impact.recommendation = "Continue using strategic pauses to emphasize important points.";
      impact.affectedAreas = [];
      break;
  }

  return impact;
};

// Analyze confidence correlation between verbal and non-verbal
const analyzeConfidenceCorrelation = (verbalData, nonVerbalData) => {
  const verbalConfidence = calculateVerbalConfidence(verbalData);
  const nonVerbalConfidence = nonVerbalData?.audioMetrics?.confidence?.average || 0.5;
  const confidenceTrend = nonVerbalData?.audioMetrics?.confidence?.trend || "stable";
  
  const correlation = Math.abs(verbalConfidence - nonVerbalConfidence);
  
  let analysis = {
    verbalConfidence: (verbalConfidence * 100).toFixed(1),
    nonVerbalConfidence: (nonVerbalConfidence * 100).toFixed(1),
    alignment: "misaligned",
    trend: confidenceTrend,
    description: "",
    recommendation: "",
    score: 0
  };

  if (correlation < 0.1) {
    analysis.alignment = "well-aligned";
    analysis.score = 20;
    analysis.description = "Your verbal content and vocal delivery show consistent confidence levels, creating authentic communication.";
    analysis.recommendation = "Your confidence alignment is excellent. Focus on maintaining this consistency.";
  } else if (correlation < 0.25) {
    analysis.alignment = "moderately aligned";
    analysis.score = 5;
    analysis.description = "Minor discrepancy between content confidence and vocal delivery.";
    analysis.recommendation = "Work on aligning your vocal tone with your content knowledge through practice.";
  } else {
    analysis.alignment = "misaligned";
    analysis.score = -15;
    
    if (verbalConfidence > nonVerbalConfidence) {
      analysis.description = "Your knowledge is strong but vocal delivery lacks confidence. This undermines your credibility.";
      analysis.recommendation = "Practice power posing and vocal projection exercises to match your delivery with your knowledge.";
    } else {
      analysis.description = "Your vocal confidence exceeds content depth. This may appear as overconfidence without substance.";
      analysis.recommendation = "Focus on deepening subject knowledge to match your confident delivery style.";
    }
  }

  // Analyze trend impact
  if (confidenceTrend === "improving") {
    analysis.score += 5;
    analysis.description += " Positively, your confidence improved throughout the interview.";
  } else if (confidenceTrend === "declining") {
    analysis.score -= 10;
    analysis.description += " Your confidence declined during the interview, suggesting fatigue or increasing difficulty.";
    analysis.recommendation += " Practice longer mock interviews to build endurance.";
  }

  return analysis;
};

// Calculate verbal confidence based on metrics
const calculateVerbalConfidence = (verbalData) => {
  if (!verbalData || !verbalData.metrics) return 0.5;
  
  const weights = {
    answer_correctness: 0.3,
    concepts_understanding: 0.2,
    domain_knowledge: 0.2,
    response_structure: 0.15,
    depth_of_explanation: 0.15
  };
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const [metric, weight] of Object.entries(weights)) {
    if (verbalData.metrics[metric]?.score !== undefined) {
      weightedSum += (verbalData.metrics[metric].score / 100) * weight;
      totalWeight += weight;
    }
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
};

// Analyze overall fluency impact
const analyzeFluencyImpact = (verbalData, nonVerbalData) => {
  const fillerWords = nonVerbalData?.analytics?.fillerWords || 0;
  const speechRate = nonVerbalData?.analytics?.wordsPerMinute || 140;
  const pausePattern = nonVerbalData?.analytics?.pauseAnalysis?.pattern || "Balanced";
  const structureScore = verbalData?.metrics?.response_structure?.score || 0;
  
  let fluencyScore = 100;
  let issues = [];
  let recommendations = [];
  
  // Deduct for filler words
  if (fillerWords > 20) {
    fluencyScore -= 30;
    issues.push("Excessive filler words");
    recommendations.push("Filler reduction exercises");
  } else if (fillerWords > 10) {
    fluencyScore -= 15;
    issues.push("Moderate filler usage");
  }
  
  // Deduct for pace issues
  if (speechRate < 120 || speechRate > 180) {
    fluencyScore -= 20;
    issues.push(speechRate < 120 ? "Too slow" : "Too fast");
    recommendations.push("Paced reading practice");
  }
  
  // Deduct for pause issues
  if (pausePattern !== "Balanced") {
    fluencyScore -= 15;
    issues.push("Irregular pause pattern");
    recommendations.push("Rhythmic speaking drills");
  }
  
  // Bonus for good structure despite fluency issues
  if (structureScore > 70 && fluencyScore < 70) {
    fluencyScore += 10;
    recommendations.push("Your strong structure compensates for fluency issues - build on this strength");
  }
  
  return {
    score: Math.max(0, fluencyScore),
    level: fluencyScore >= 80 ? "excellent" : fluencyScore >= 60 ? "good" : fluencyScore >= 40 ? "fair" : "needs improvement",
    issues,
    recommendations,
    description: generateFluencyDescription(fluencyScore, issues)
  };
};

const generateFluencyDescription = (score, issues) => {
  if (score >= 80) {
    return "Your speech fluency enhances your message delivery effectively.";
  } else if (score >= 60) {
    return `Good fluency with minor issues: ${issues.join(", ")}. These are easily correctable with practice.`;
  } else if (score >= 40) {
    return `Fluency challenges (${issues.join(", ")}) are noticeably affecting your communication effectiveness.`;
  } else {
    return `Significant fluency issues (${issues.join(", ")}) are creating barriers to effective communication.`;
  }
};

// Calculate overall correlation score
const calculateOverallCorrelation = (verbalData, nonVerbalData) => {
  const verbalScore = verbalData?.overall_score || 0;
  const nonVerbalQuality = calculateNonVerbalQuality(nonVerbalData);
  
  const correlation = 1 - Math.abs(verbalScore - nonVerbalQuality) / 100;
  
  return {
    verbalScore,
    nonVerbalScore: nonVerbalQuality,
    correlationStrength: (correlation * 100).toFixed(1),
    interpretation: interpretCorrelation(correlation, verbalScore, nonVerbalQuality)
  };
};

const calculateNonVerbalQuality = (nonVerbalData) => {
  if (!nonVerbalData) return 50;
  
  let score = 100;
  
  // Deductions
  const fillerPercentage = parseFloat(nonVerbalData?.analytics?.fillerPercentage) || 0;
  score -= Math.min(30, fillerPercentage * 3);
  
  const wpm = nonVerbalData?.analytics?.wordsPerMinute || 140;
  if (wpm < 120) score -= 15;
  else if (wpm > 180) score -= 20;
  
  const pausePattern = nonVerbalData?.analytics?.pauseAnalysis?.pattern;
  if (pausePattern !== "Balanced") score -= 10;
  
  // Add audio metrics if available
  if (nonVerbalData?.audioMetrics) {
    const confidence = nonVerbalData.audioMetrics.confidence?.average || 0.5;
    score = score * 0.7 + (confidence * 100 * 0.3); // 30% weight to confidence
  }
  
  return Math.max(0, Math.min(100, score));
};

const interpretCorrelation = (correlation, verbalScore, nonVerbalScore) => {
  if (correlation > 0.8) {
    return {
      level: "excellent",
      message: "Strong alignment between content and delivery creates powerful communication.",
      action: "Maintain this excellent balance while refining minor areas."
    };
  } else if (correlation > 0.6) {
    return {
      level: "good",
      message: "Good alignment with room for improvement in synchronizing content and delivery.",
      action: "Focus on the weaker component to achieve better balance."
    };
  } else {
    if (verbalScore > nonVerbalScore) {
      return {
        level: "content-strong",
        message: "Your content knowledge exceeds your delivery skills, limiting your impact.",
        action: "Prioritize delivery skills training to match your strong content."
      };
    } else {
      return {
        level: "delivery-strong",
        message: "Your delivery style is stronger than content depth, risking style over substance perception.",
        action: "Deepen domain knowledge and practice structured responses."
      };
    }
  }
};

// Generate prioritized action items based on correlations
export const generateActionItems = (correlations) => {
  const actionItems = [];
  let priority = 1;
  let itemId = 1; // Separate counter for unique IDs
  
  // Check speech rate impact
  if (correlations.speechRateImpact.level === "negative") {
    actionItems.push({
      id: `action-${itemId++}`, // Use separate itemId counter
      priority: priority++,
      category: "Speech Pace",
      title: correlations.speechRateImpact.score <= -20 ? "Critical: Adjust Speech Rate" : "Optimize Speech Pace",
      description: correlations.speechRateImpact.description,
      action: correlations.speechRateImpact.recommendation,
      impact: "High",
      timeframe: "1-2 weeks",
      exercises: [
        "Read aloud for 5 minutes daily at target pace",
        "Record and review your practice sessions",
        "Use a metronome app to maintain rhythm"
      ]
    });
  }
  
  // Check filler words impact
  if (correlations.fillerWordsImpact.level !== "positive") {
    const fillerPriority = correlations.fillerWordsImpact.severity === "high" ? 1 : priority++;
    actionItems.push({
      id: `action-${itemId++}`, // Use separate itemId counter
      priority: fillerPriority,
      category: "Fluency",
      title: "Eliminate Filler Words",
      description: correlations.fillerWordsImpact.description,
      action: correlations.fillerWordsImpact.recommendation,
      impact: correlations.fillerWordsImpact.severity === "high" ? "Critical" : "High",
      timeframe: "2-3 weeks",
      exercises: [
        "Practice the 'pause and think' technique",
        "Record yourself for filler word awareness",
        "Use the 'chunking' method for structured responses",
        "Practice with a filler word counter app"
      ]
    });
  }
  
  // Check pause pattern impact
  if (correlations.pausePatternImpact.level === "negative") {
    actionItems.push({
      id: `action-${itemId++}`, // Use separate itemId counter
      priority: priority++,
      category: "Rhythm & Flow",
      title: "Improve Pause Patterns",
      description: correlations.pausePatternImpact.description,
      action: correlations.pausePatternImpact.recommendation,
      impact: "Medium",
      timeframe: "2 weeks",
      exercises: [
        "Practice strategic pausing exercises",
        "Use breath control techniques",
        "Study great speakers' pause patterns"
      ]
    });
  }
  
  // Check confidence alignment
  if (correlations.confidenceCorrelation.alignment === "misaligned") {
    actionItems.push({
      id: `action-${itemId++}`, // Use separate itemId counter
      priority: priority++,
      category: "Confidence",
      title: "Align Verbal and Non-Verbal Confidence",
      description: correlations.confidenceCorrelation.description,
      action: correlations.confidenceCorrelation.recommendation,
      impact: "High",
      timeframe: "3-4 weeks",
      exercises: [
        "Power posing before interviews",
        "Vocal projection exercises",
        "Mirror practice for body language",
        "Confidence affirmations"
      ]
    });
  }
  
  // Check fluency issues
  if (correlations.fluencyImpact.level === "needs improvement" || correlations.fluencyImpact.level === "fair") {
    actionItems.push({
      id: `action-${itemId++}`, // Use separate itemId counter
      priority: priority++,
      category: "Overall Fluency",
      title: "Comprehensive Fluency Improvement",
      description: correlations.fluencyImpact.description,
      action: correlations.fluencyImpact.recommendations.join("; "),
      impact: "Critical",
      timeframe: "4 weeks",
      exercises: [
        "Daily tongue twisters for articulation",
        "Storytelling practice for flow",
        "Improv exercises for spontaneous speaking",
        "Structured response frameworks (STAR, PREP)"
      ]
    });
  }
  
  // Sort by priority
  return actionItems.sort((a, b) => {
    // First by impact criticality
    const impactOrder = { "Critical": 0, "High": 1, "Medium": 2, "Low": 3 };
    const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
    if (impactDiff !== 0) return impactDiff;
    // Then by priority number
    return a.priority - b.priority;
  });
};

// Format correlation data for visualization
export const formatCorrelationData = (correlations) => {
  if (!correlations) return [];
  
  const data = [
    {
      metric: "Speech Rate",
      impact: Math.abs(correlations.speechRateImpact?.score || 0),
      type: correlations.speechRateImpact?.level || "neutral",
      description: correlations.speechRateImpact?.description || ""
    },
    {
      metric: "Filler Words",
      impact: Math.abs(correlations.fillerWordsImpact?.score || 0),
      type: correlations.fillerWordsImpact?.level || "neutral",
      description: correlations.fillerWordsImpact?.description || ""
    },
    {
      metric: "Pause Pattern",
      impact: Math.abs(correlations.pausePatternImpact?.score || 0),
      type: correlations.pausePatternImpact?.level || "neutral",
      description: correlations.pausePatternImpact?.description || ""
    },
    {
      metric: "Confidence",
      impact: Math.abs(correlations.confidenceCorrelation?.score || 0),
      type: correlations.confidenceCorrelation?.alignment === "well-aligned" ? "positive" : "negative",
      description: correlations.confidenceCorrelation?.description || ""
    },
    {
      metric: "Fluency",
      impact: correlations.fluencyImpact?.score || 0,
      type: correlations.fluencyImpact?.level === "excellent" || correlations.fluencyImpact?.level === "good" ? "positive" : "negative",
      description: correlations.fluencyImpact?.description || ""
    }
  ];
  
  return data;
};

// Generate insights for AI analysis
export const generateInsights = async (correlations, verbalData, nonVerbalData) => {
  const insights = [];
  
  // Critical insights
  if (correlations.fillerWordsImpact?.severity === "high") {
    insights.push({
      type: "critical",
      title: "Filler Words Severely Impacting Performance",
      description: "Your excessive use of filler words is the most critical issue affecting your interview performance.",
      dataPoint: `${nonVerbalData?.analytics?.fillerPercentage}% of words are fillers`
    });
  }
  
  if (correlations.speechRateImpact?.score <= -20) {
    insights.push({
      type: "critical",
      title: "Speech Pace Hindering Communication",
      description: correlations.speechRateImpact.description,
      dataPoint: `${nonVerbalData?.analytics?.wordsPerMinute} words per minute`
    });
  }
  
  // Positive insights
  if (correlations.confidenceCorrelation?.alignment === "well-aligned") {
    insights.push({
      type: "positive",
      title: "Excellent Confidence Alignment",
      description: "Your verbal content and delivery show remarkable consistency.",
      dataPoint: `${correlations.confidenceCorrelation.verbalConfidence}% alignment`
    });
  }
  
  if (correlations.overallCorrelation?.correlationStrength > 80) {
    insights.push({
      type: "positive",
      title: "Strong Overall Performance",
      description: "Your verbal and non-verbal communication are well-balanced.",
      dataPoint: `${correlations.overallCorrelation.correlationStrength}% correlation`
    });
  }
  
  // Opportunity insights
  const maxImprovement = Math.max(
    Math.abs(correlations.speechRateImpact?.score || 0),
    Math.abs(correlations.fillerWordsImpact?.score || 0),
    Math.abs(correlations.pausePatternImpact?.score || 0)
  );
  
  if (maxImprovement > 15) {
    insights.push({
      type: "opportunity",
      title: "Quick Win Opportunity",
      description: "Addressing your top non-verbal issue could improve overall performance by up to " + maxImprovement + "%",
      dataPoint: "Focus on top 2 action items"
    });
  }
  
  return insights;
};

// Generate comprehensive report data
export const generateOverallReportData = (verbalData, nonVerbalData, correlations, actionItems) => {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      verbalScore: verbalData?.overall_score || 0,
      nonVerbalScore: calculateNonVerbalQuality(nonVerbalData),
      correlationStrength: correlations?.overallCorrelation?.correlationStrength || 0,
      topIssues: actionItems.slice(0, 3).map(item => item.title),
      readinessLevel: determineReadinessLevel(verbalData, nonVerbalData, correlations)
    },
    correlations,
    actionItems,
    recommendations: generateRecommendations(correlations, actionItems),
    exercises: generateExercises(correlations, actionItems)
  };
};

const determineReadinessLevel = (verbalData, nonVerbalData, correlations) => {
  const verbalScore = verbalData?.overall_score || 0;
  const nonVerbalScore = calculateNonVerbalQuality(nonVerbalData);
  const avgScore = (verbalScore + nonVerbalScore) / 2;
  
  if (avgScore >= 80 && correlations?.overallCorrelation?.correlationStrength > 70) {
    return "Highly Ready";
  } else if (avgScore >= 65) {
    return "Ready with Minor Improvements";
  } else if (avgScore >= 50) {
    return "Needs Practice";
  } else {
    return "Requires Significant Preparation";
  }
};

const generateRecommendations = (correlations, actionItems) => {
  const recommendations = [];
  
  // Top priority recommendation
  if (actionItems.length > 0) {
    recommendations.push({
      priority: "immediate",
      title: actionItems[0].title,
      description: actionItems[0].action,
      expectedImprovement: "15-25% overall performance increase"
    });
  }
  
  // Correlation-based recommendations
  if (correlations?.overallCorrelation?.interpretation?.level === "content-strong") {
    recommendations.push({
      priority: "high",
      title: "Focus on Delivery Skills",
      description: "Your content is strong. Invest time in presentation and delivery techniques.",
      expectedImprovement: "Better impression and engagement"
    });
  } else if (correlations?.overallCorrelation?.interpretation?.level === "delivery-strong") {
    recommendations.push({
      priority: "high",
      title: "Deepen Domain Knowledge",
      description: "Your delivery is good. Focus on building deeper technical knowledge.",
      expectedImprovement: "More substantive responses"
    });
  }
  
  return recommendations;
};

const generateExercises = (correlations, actionItems) => {
  const exercises = [];
  
  // Compile unique exercises from action items
  actionItems.forEach(item => {
    item.exercises?.forEach(exercise => {
      if (!exercises.find(e => e.name === exercise)) {
        exercises.push({
          name: exercise,
          category: item.category,
          frequency: "Daily",
          duration: "10-15 minutes"
        });
      }
    });
  });
  
  return exercises;
};

// Export functions for report download
export const downloadOverallReport = (reportData, verbalData, nonVerbalData, correlations, actionItems) => {
  const timestamp = new Date().toLocaleString();
  
  let content = `
OVERALL FEEDBACK REPORT
======================
Generated: ${timestamp}

EXECUTIVE SUMMARY
-----------------
Interview Readiness: ${reportData.summary.readinessLevel}
Verbal Performance: ${reportData.summary.verbalScore}/100
Non-Verbal Performance: ${reportData.summary.nonVerbalScore}/100
Correlation Strength: ${reportData.summary.correlationStrength}%

KEY FINDINGS
------------
${reportData.summary.topIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

DETAILED CORRELATION ANALYSIS
-----------------------------

1. SPEECH RATE IMPACT
   Status: ${correlations.speechRateImpact.level}
   Impact Score: ${correlations.speechRateImpact.score}
   ${correlations.speechRateImpact.description}
   Recommendation: ${correlations.speechRateImpact.recommendation}

2. FILLER WORDS IMPACT
   Status: ${correlations.fillerWordsImpact.level}
   Severity: ${correlations.fillerWordsImpact.severity}
   Impact Score: ${correlations.fillerWordsImpact.score}
   ${correlations.fillerWordsImpact.description}
   Recommendation: ${correlations.fillerWordsImpact.recommendation}

3. PAUSE PATTERN IMPACT
   Pattern: ${correlations.pausePatternImpact.pattern}
   Status: ${correlations.pausePatternImpact.level}
   Impact Score: ${correlations.pausePatternImpact.score}
   ${correlations.pausePatternImpact.description}
   Recommendation: ${correlations.pausePatternImpact.recommendation}

4. CONFIDENCE CORRELATION
   Verbal Confidence: ${correlations.confidenceCorrelation.verbalConfidence}%
   Non-Verbal Confidence: ${correlations.confidenceCorrelation.nonVerbalConfidence}%
   Alignment: ${correlations.confidenceCorrelation.alignment}
   Trend: ${correlations.confidenceCorrelation.trend}
   ${correlations.confidenceCorrelation.description}
   Recommendation: ${correlations.confidenceCorrelation.recommendation}

5. FLUENCY ANALYSIS
   Score: ${correlations.fluencyImpact.score}/100
   Level: ${correlations.fluencyImpact.level}
   ${correlations.fluencyImpact.description}
   Issues: ${correlations.fluencyImpact.issues.join(', ') || 'None'}

PRIORITIZED ACTION PLAN
-----------------------
${actionItems.map((item, i) => `
${i + 1}. ${item.title} [${item.impact}]
   Category: ${item.category}
   Timeframe: ${item.timeframe}
   Action: ${item.action}
   
   Exercises:
   ${item.exercises.map(e => `   - ${e}`).join('\n')}
`).join('\n')}

RECOMMENDATIONS
---------------
${reportData.recommendations.map((rec, i) => `
${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}
   ${rec.description}
   Expected Improvement: ${rec.expectedImprovement}
`).join('\n')}

PRACTICE EXERCISES
------------------
${reportData.exercises.map((ex, i) => `
${i + 1}. ${ex.name}
   Category: ${ex.category}
   Frequency: ${ex.frequency}
   Duration: ${ex.duration}
`).join('\n')}

================================
End of Overall Feedback Report
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `overall-feedback-report-${new Date().getTime()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};