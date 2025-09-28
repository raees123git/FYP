// Overall analysis utilities extracted from interview/complete page

export function generateOverallAnalysis(verbalReport, nonVerbalReport, interviewData) {
  const verbalScore = verbalReport?.overall_score || 0;
  
  // FIXED: Use comprehensive report's overallConfidence for consistent scoring
  // This ensures UI and database use the same non-verbal score
  const nonVerbalScore = nonVerbalReport?.confidenceScores?.overallConfidence || 
                          nonVerbalReport?.overall_confidence || 0;
  
  console.log('📊 Overall Analysis Score Calculation:', {
    verbalScore,
    nonVerbalScore,
    nonVerbalSource: nonVerbalReport?.confidenceScores?.overallConfidence ? 'comprehensive.overallConfidence' : 
                     nonVerbalReport?.overall_confidence ? 'fallback.overall_confidence' : 'default(0)',
    comprehensiveExists: !!nonVerbalReport?.confidenceScores,
    overallConfidence: nonVerbalReport?.confidenceScores?.overallConfidence
  });
  
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

  // Calculate detailed correlation analyses needed by the report components
  const calculateDetailedAnalyses = (verbalReport, nonVerbalReport, interviewData) => {
    console.log('🔍 Detailed Analysis - Input Data:', {
      hasNonVerbalReport: !!nonVerbalReport,
      hasAnalytics: !!nonVerbalReport?.analytics,
      hasAudioMetrics: !!nonVerbalReport?.audioMetrics,
      wordsPerMinute: nonVerbalReport?.analytics?.wordsPerMinute,
      fillerWords: nonVerbalReport?.analytics?.fillerWords,
      confidence: nonVerbalReport?.audioMetrics?.confidence?.average
    });

    // Speech Rate Impact Analysis - handle both basic and comprehensive structures
    const speechRate = nonVerbalReport?.analytics?.wordsPerMinute || 
                       nonVerbalReport?.speakingStats?.totalWordsSpoken ? 
                       Math.round((nonVerbalReport.speakingStats.totalWordsSpoken / nonVerbalReport.speakingStats.totalSpeakingTime) * 60) : 
                       120;
    
    const speechRateImpact = {
      score: speechRate >= 120 && speechRate <= 180 ? 15 : 
             speechRate >= 100 && speechRate <= 200 ? 5 : -10,
      level: speechRate >= 120 && speechRate <= 180 ? "positive" : 
             speechRate >= 100 && speechRate <= 200 ? "neutral" : "negative",
      impact: speechRate >= 120 && speechRate <= 180 ? "Optimal speech rate enhances comprehension" : 
              speechRate > 180 ? "Fast speech may reduce clarity" : "Slow speech may lose listener attention",
      affectedAreas: speechRate >= 120 && speechRate <= 180 ? ["clarity", "engagement"] : 
                     speechRate > 180 ? ["clarity", "comprehension"] : ["engagement", "confidence"],
      metrics: { wpm: speechRate, optimal: "120-180 WPM" }
    };

    // Filler Words Impact Analysis - handle both structures
    const fillerCount = nonVerbalReport?.analytics?.fillerWords || 
                        nonVerbalReport?.fillerWordsBreakdown?.totalCount || 0;
    const totalWords = nonVerbalReport?.analytics?.totalWords || 
                       nonVerbalReport?.speakingStats?.totalWordsSpoken || 100;
    const fillerPercentage = nonVerbalReport?.analytics?.fillerPercentage || 
                            nonVerbalReport?.fillerWordsBreakdown?.percentage || 
                            (totalWords > 0 ? (fillerCount / totalWords) * 100 : 0);
    const fillerWordsImpact = {
      score: fillerPercentage <= 2 ? 10 : fillerPercentage <= 5 ? 0 : -15,
      level: fillerPercentage <= 2 ? "positive" : fillerPercentage <= 5 ? "neutral" : "negative",
      severity: fillerPercentage <= 2 ? "low" : fillerPercentage <= 5 ? "moderate" : "high",
      impact: fillerPercentage <= 2 ? "Minimal filler words show good preparation" : 
              fillerPercentage <= 5 ? "Moderate filler word usage" : "High filler word usage affects professionalism",
      affectedAreas: fillerPercentage <= 2 ? ["professionalism"] : 
                     fillerPercentage <= 5 ? ["clarity"] : ["professionalism", "clarity", "confidence"],
      metrics: { count: fillerCount, percentage: fillerPercentage }
    };

    // Pause Pattern Impact Analysis - handle both structures  
    const pauseAnalysis = nonVerbalReport?.analytics?.pauseAnalysis || 
                          nonVerbalReport?.pauseAnalysisDetailed || {};
    const avgPause = pauseAnalysis?.averagePause || 1;
    const pausePattern = pauseAnalysis?.pattern || pauseAnalysis?.title || "Balanced";
    
    const pausePatternImpact = {
      score: pausePattern === "Balanced" ? 10 : avgPause > 2 ? -5 : -10,
      level: pausePattern === "Balanced" ? "positive" : "negative", 
      pattern: pausePattern,
      impact: pausePattern === "Balanced" ? "Well-timed pauses enhance delivery" : 
              pausePattern.includes("Long") ? "Long pauses may indicate uncertainty" : 
              pausePattern.includes("Short") || pausePattern.includes("Rushed") ? "Short pauses may rush the message" :
              "Pause pattern could be improved for better delivery",
      affectedAreas: pausePattern === "Balanced" ? ["clarity", "engagement"] : 
                     pausePattern.includes("Long") ? ["confidence", "flow"] : ["clarity", "comprehension"],
      metrics: { averagePause: avgPause, pattern: pausePattern, optimal: "0.5-2 seconds" }
    };

    // Confidence Correlation Analysis - handle both structures
    const confidence = nonVerbalReport?.audioMetrics?.confidence?.average || 
                       nonVerbalReport?.volumeEnergyConfidence?.confidence?.average || 0.5;
    const confidenceTrend = nonVerbalReport?.audioMetrics?.confidence?.trend || 
                           nonVerbalReport?.volumeEnergyConfidence?.confidence?.trend || "stable";
    
    const confidenceCorrelation = {
      score: confidence >= 0.7 ? 20 : confidence >= 0.5 ? 5 : -10,
      alignment: confidence >= 0.6 ? "aligned" : "misaligned",
      trend: confidenceTrend,
      impact: confidence >= 0.7 ? "High confidence supports strong performance" : 
              confidence >= 0.5 ? "Moderate confidence with room for growth" : "Low confidence may undermine competence",
      affectedAreas: confidence >= 0.6 ? ["delivery", "presence"] : ["confidence", "engagement"],
      metrics: { confidence: Math.round(confidence * 100), trend: confidenceTrend }
    };

    // Fluency Impact Analysis - comprehensive calculation
    const fluencyFromConfidence = nonVerbalReport?.confidenceScores?.fluency || 70;
    const fluencyScore = fluencyFromConfidence || Math.max(0, 100 - (fillerPercentage * 10) - (pausePattern !== "Balanced" ? 20 : 0));
    
    const fluencyImpact = {
      score: fluencyScore >= 80 ? 15 : fluencyScore >= 60 ? 5 : -10,
      level: fluencyScore >= 80 ? "excellent" : fluencyScore >= 60 ? "good" : "needs improvement",
      impact: fluencyScore >= 80 ? "Excellent fluency enhances overall communication" : 
              fluencyScore >= 60 ? "Good fluency with minor areas for improvement" : "Fluency challenges may distract from content",
      issues: fluencyScore < 80 ? [
        fillerPercentage > 5 ? "Excessive filler words" : null,
        pausePattern.includes("Long") || pausePattern.includes("Too") ? "Pause timing issues" : null,
        speechRate > 200 ? "Speaking too fast" : null,
        speechRate < 100 ? "Speaking too slow" : null
      ].filter(Boolean) : [],
      metrics: { fluencyScore: Math.round(fluencyScore), factors: ["speech_rate", "pauses", "fillers"], sourceScore: fluencyFromConfidence }
    };

    console.log('✅ Detailed Analysis Generated:', {
      speechRate: speechRateImpact.score,
      fillerWords: fillerWordsImpact.score,
      pausePattern: pausePatternImpact.score,
      confidence: confidenceCorrelation.score,
      fluency: fluencyImpact.score
    });

    return {
      speechRateImpact,
      fillerWordsImpact,
      pausePatternImpact,
      confidenceCorrelation,
      fluencyImpact
    };
  };

  // Generate detailed analyses
  const detailedAnalyses = calculateDetailedAnalyses(verbalReport, nonVerbalReport, interviewData);
  
  // Calculate Impact Analysis data (same logic as ImpactAnalysisCards component)
  const impacts = [
    {
      name: "Speech Rate",
      score: detailedAnalyses.speechRateImpact?.score || 0,
      level: detailedAnalyses.speechRateImpact?.level || "neutral",
      areas: detailedAnalyses.speechRateImpact?.affectedAreas || []
    },
    {
      name: "Filler Words", 
      score: detailedAnalyses.fillerWordsImpact?.score || 0,
      level: detailedAnalyses.fillerWordsImpact?.level || "neutral",
      severity: detailedAnalyses.fillerWordsImpact?.severity || "low",
      areas: detailedAnalyses.fillerWordsImpact?.affectedAreas || []
    },
    {
      name: "Pause Pattern",
      score: detailedAnalyses.pausePatternImpact?.score || 0,
      level: detailedAnalyses.pausePatternImpact?.level || "neutral", 
      pattern: detailedAnalyses.pausePatternImpact?.pattern || "Balanced",
      areas: detailedAnalyses.pausePatternImpact?.affectedAreas || []
    },
    {
      name: "Confidence",
      score: detailedAnalyses.confidenceCorrelation?.score || 0,
      alignment: detailedAnalyses.confidenceCorrelation?.alignment || "misaligned",
      trend: detailedAnalyses.confidenceCorrelation?.trend || "stable"
    },
    {
      name: "Fluency", 
      score: detailedAnalyses.fluencyImpact?.score || 0,
      level: detailedAnalyses.fluencyImpact?.level || "fair",
      issues: detailedAnalyses.fluencyImpact?.issues || []
    }
  ];

  const positiveImpacts = impacts.filter(i => i.score > 0);
  const negativeImpacts = impacts.filter(i => i.score < 0).sort((a, b) => a.score - b.score);
  const totalPositive = positiveImpacts.reduce((sum, i) => sum + i.score, 0);
  const totalNegative = Math.abs(negativeImpacts.reduce((sum, i) => sum + i.score, 0));
  const netImpact = totalPositive - totalNegative;

  const impactAnalysis = {
    positiveFactors: {
      total: totalPositive,
      impacts: positiveImpacts.map(impact => ({
        name: impact.name,
        score: impact.score,
        level: impact.level || "neutral"
      }))
    },
    areasForImprovement: {
      total: totalNegative,
      impacts: negativeImpacts.map(impact => ({
        name: impact.name, 
        score: impact.score,
        level: impact.level || "neutral",
        severity: impact.severity || "moderate"
      }))
    },
    netPerformanceImpact: netImpact,
    allImpacts: impacts
  };

  console.log('📊 Impact Analysis Generated:', {
    positiveTotal: totalPositive,
    negativeTotal: totalNegative,
    netImpact: netImpact,
    positiveCount: positiveImpacts.length,
    negativeCount: negativeImpacts.length
  });
  
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
      },
      // Add detailed impact analyses
      speechRateImpact: detailedAnalyses.speechRateImpact,
      fillerWordsImpact: detailedAnalyses.fillerWordsImpact,
      pausePatternImpact: detailedAnalyses.pausePatternImpact,
      confidenceCorrelation: detailedAnalyses.confidenceCorrelation,
      fluencyImpact: detailedAnalyses.fluencyImpact
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
    
    // Impact Analysis data for database storage
    impactAnalysis: impactAnalysis,
    
    summary: `Overall performance score: ${overallScore}/100. ${readiness === 'excellent' ? 'Excellent performance! You demonstrate strong technical knowledge and communication skills.' : readiness === 'ready' ? 'Good job! You are interview ready with minor areas for improvement.' : readiness === 'needs improvement' ? 'Keep practicing to improve your interview skills.' : 'Significant preparation needed before interviews.'}`
  };
  
  // Persist for report pages
  const sessionId = interviewData.sessionId || `interview_${Date.now()}`;
  localStorage.setItem("overallAnalysis", JSON.stringify(overallData));
  localStorage.setItem(`overallAnalysis_${sessionId}`, JSON.stringify(overallData));
  
  return overallData;
}
