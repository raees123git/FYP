// Overall analysis utilities extracted from interview/complete page

export function generateOverallAnalysis(verbalReport, nonVerbalReport, interviewData) {
  const verbalScore = verbalReport?.overall_score || 0;
  const nonVerbalScore = nonVerbalReport?.overall_confidence || 0;
  const overallScore = Math.round((verbalScore + nonVerbalScore) / 2);
  
  let readiness = "needs improvement";
  if (overallScore >= 80) readiness = "excellent";
  else if (overallScore >= 70) readiness = "ready";
  else if (overallScore >= 50) readiness = "needs improvement";
  else readiness = "not ready";
  
  const correlationStrength = Math.abs(verbalScore - nonVerbalScore) <= 15 ? 85 : 
                              Math.abs(verbalScore - nonVerbalScore) <= 30 ? 60 : 40;
  
  // Determine strengths and areas for improvement
  const strengths = [];
  const improvements = [];
  
  if (verbalScore >= 80) strengths.push("Excellent technical knowledge and domain expertise");
  else if (verbalScore >= 70) strengths.push("Good understanding of concepts");
  else improvements.push("Strengthen technical knowledge and domain expertise");
  
  if (nonVerbalScore >= 80) strengths.push("Outstanding communication delivery and confidence");
  else if (nonVerbalScore >= 70) strengths.push("Good presentation skills");
  else improvements.push("Improve communication delivery and confidence");
  
  if (Math.abs(verbalScore - nonVerbalScore) <= 15) {
    strengths.push("Well-balanced content and delivery skills");
  } else if (Math.abs(verbalScore - nonVerbalScore) > 30) {
    improvements.push("Work on balancing content knowledge with presentation skills");
  }
  
  // Generate detailed correlation data
  const correlations = {
    overallCorrelation: {
      correlationStrength: correlationStrength,
      alignment: verbalScore > nonVerbalScore ? "content-strong" : "delivery-strong",
      description: correlationStrength >= 80 ? "Excellent alignment between content and delivery" :
                   correlationStrength >= 60 ? "Good balance with room for improvement" :
                   "Significant gap between content and delivery skills"
    },
    specificCorrelations: {
      knowledgeToConfidence: {
        score: Math.round(100 - Math.abs(verbalScore - nonVerbalScore)),
        description: "How well your knowledge translates to confident delivery"
      },
      structureToFluency: {
        score: verbalReport?.metrics?.response_structure?.score && nonVerbalReport?.analytics?.wordsPerMinute ?
               Math.round((verbalReport.metrics.response_structure.score + 
               (nonVerbalReport.analytics.wordsPerMinute >= 120 && nonVerbalReport.analytics.wordsPerMinute <= 160 ? 85 : 60)) / 2) : 70,
        description: "Alignment between answer structure and speech fluency"
      },
      vocabularyToClarity: {
        score: verbalReport?.metrics?.vocabulary_richness?.score || 70,
        description: "Technical vocabulary usage and communication clarity"
      }
    },
    performanceGaps: [
      verbalScore > nonVerbalScore + 20 ? {
        area: "Delivery Enhancement",
        gap: Math.round(verbalScore - nonVerbalScore),
        priority: "High",
        recommendation: "Focus on improving non-verbal communication to match your strong technical knowledge"
      } : null,
      nonVerbalScore > verbalScore + 20 ? {
        area: "Knowledge Depth",
        gap: Math.round(nonVerbalScore - verbalScore),
        priority: "High",
        recommendation: "Strengthen technical knowledge to match your good presentation skills"
      } : null
    ].filter(Boolean)
  };
  
  // Store ONLY the data that is displayed in the overall report page
  const overallData = {
    // Core scores displayed
    overall_score: overallScore,
    verbal_score: verbalScore,
    nonverbal_score: nonVerbalScore,
    interview_readiness: readiness,
    
    // Correlation data shown in report
    correlations: {
      overallCorrelation: {
        correlationStrength: correlationStrength,
        alignment: verbalScore > nonVerbalScore ? "content-strong" : "delivery-strong",
        description: correlationStrength >= 80 ? "Excellent alignment between content and delivery" :
                     correlationStrength >= 60 ? "Good balance with room for improvement" :
                     "Significant gap between content and delivery skills"
      }
    },
    
    // Action items displayed in the report
    action_items: [
      verbalScore < 70 ? {
        item: "Improve technical knowledge and domain expertise",
        priority: "high",
        category: "verbal"
      } : null,
      nonVerbalScore < 70 ? {
        item: "Work on communication delivery and confidence",
        priority: "high",
        category: "non-verbal"
      } : null,
      Math.abs(verbalScore - nonVerbalScore) > 30 ? {
        item: "Balance content knowledge with presentation skills",
        priority: "medium",
        category: "overall"
      } : null
    ].filter(Boolean),
    
    // Insights section
    insights: {
      strengths: strengths,
      areas_for_improvement: improvements
    },
    
    summary: `Overall performance score: ${overallScore}/100. ${readiness === 'excellent' ? 'Excellent performance! You demonstrate strong technical knowledge and communication skills.' : readiness === 'ready' ? 'Good job! You are interview ready with minor areas for improvement.' : readiness === 'needs improvement' ? 'Keep practicing to improve your interview skills.' : 'Significant preparation needed before interviews.'}`
  };
  
  // Persist for report pages
  const sessionId = interviewData.sessionId || `interview_${Date.now()}`;
  localStorage.setItem("overallAnalysis", JSON.stringify(overallData));
  localStorage.setItem(`overallAnalysis_${sessionId}`, JSON.stringify(overallData));
  
  return overallData;
}
