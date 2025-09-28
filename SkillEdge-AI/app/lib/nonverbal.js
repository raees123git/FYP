// Non-verbal analysis utilities extracted from interview/complete page

// Generate basic non-verbal analysis for UI display and localStorage
export async function generateBasicNonVerbalAnalysis(interviewData) {
  // Add debug info about when this function is called
  console.log('⚠️ generateBasicNonVerbalAnalysis called at:', new Date().toISOString());
  // console.trace('📍 Call stack trace'); // Disabled trace to prevent performance impact
  
  const { answers, timings = [] } = interviewData;

  let totalWords = 0;
  let totalTime = 0;
  let fillerWords = 0;
  let detectedFillerWords = {};
  let pauses = [];

  // Use the same filler words list that the non-verbal components use
  const fillerWordsList = [
    "um", "uh", "like", "you know", "actually", "basically",
    "literally", "right", "so", "well", "I mean", "kind of",
    "sort of", "yeah", "ohh", "hmm", "huh", "er", "ah", "mm"
  ];

  answers.forEach((answer, index) => {
    const words = answer.trim().split(/\s+/).filter(word => word);
    totalWords += words.length;

    const lowerAnswer = answer.toLowerCase();
    fillerWordsList.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = lowerAnswer.match(regex);
      if (matches) {
        fillerWords += matches.length;
        detectedFillerWords[filler] = (detectedFillerWords[filler] || 0) + matches.length;
      }
    });

    if (timings[index]) {
      totalTime += timings[index].timeUsed || 60;
      const wpm = (timings[index].wordsSpoken / (timings[index].timeUsed / 60)) || 0;
      if (wpm < 100) pauses.push("long");
      else if (wpm > 160) pauses.push("short");
      else pauses.push("normal");
    } else {
      totalTime += 60;
      pauses.push("normal");
    }
  });

  const wordsPerMinute = totalTime > 0 ? Math.round((totalWords / totalTime) * 60) : 0;
  const fillerPercentage = totalWords > 0 ? ((fillerWords / totalWords) * 100).toFixed(1) : 0;

  // Analyze pauses
  const pauseCounts = {
    long: pauses.filter(p => p === "long").length,
    normal: pauses.filter(p => p === "normal").length,
    short: pauses.filter(p => p === "short").length
  };

  let pausePattern = "Balanced";
  let pauseDescription = "Your pause pattern shows good variety.";
  let pauseRecommendation = "Continue maintaining your current pause pattern.";

  if (pauseCounts.long > pauseCounts.normal + pauseCounts.short) {
    pausePattern = "Too Many Long Pauses";
    pauseDescription = "You tend to have lengthy pauses between thoughts.";
    pauseRecommendation = "Practice maintaining a steady flow with shorter pauses.";
  } else if (pauseCounts.short > pauseCounts.normal + pauseCounts.long) {
    pausePattern = "Rushed Speech";
    pauseDescription = "You speak with minimal pauses.";
    pauseRecommendation = "Add strategic pauses to emphasize key points.";
  }

  // Speech rate analysis
  let speechRate = "Good Pace";
  let speechRateColor = "text-green-400";
  let speechRateDescription = "Your speech rate is optimal for clear communication.";

  if (wordsPerMinute < 120) {
    speechRate = "Slow Pace";
    speechRateColor = "text-yellow-400";
    speechRateDescription = "You speak relatively slowly. Consider picking up the pace slightly to maintain engagement.";
  } else if (wordsPerMinute > 160) {
    speechRate = "Fast Pace";
    speechRateColor = "text-orange-400";
    speechRateDescription = "You speak quite quickly. Consider slowing down slightly for better clarity.";
  }

  // Basic analytics data for UI display
  const analyticsData = {
    totalWords,
    totalTime: Math.round(totalTime),
    wordsPerMinute,
    speechRate,
    speechRateColor,
    speechRateDescription,
    fillerWords,
    fillerPercentage,
    detectedFillerWords,
    pauseAnalysis: {
      pattern: pausePattern,
      description: pauseDescription,
      type: pausePattern,
      recommendation: pauseRecommendation
    },
    questionCount: answers.length
  };

  console.log('📊 SINGLE SOURCE non-verbal analytics generated:', {
    totalWords: analyticsData.totalWords,
    fillerWords: analyticsData.fillerWords,
    fillerPercentage: analyticsData.fillerPercentage,
    detectedFillerWords: analyticsData.detectedFillerWords,
    wordsPerMinute: analyticsData.wordsPerMinute,
    speechRate: analyticsData.speechRate,
    timestamp: new Date().toISOString()
  });

  console.log('💾 STORING to localStorage as SINGLE SOURCE OF TRUTH');

  // Process audio metrics if available
  console.log('🔍 DEBUGGING: Checking for audio analysis data...', {
    hasAudioAnalysis: !!interviewData.audioAnalysis,
    audioAnalysisLength: interviewData.audioAnalysis?.length || 0,
    audioAnalysisType: typeof interviewData.audioAnalysis,
    audioAnalysisKeys: interviewData.audioAnalysis ? Object.keys(interviewData.audioAnalysis) : 'No keys'
  });

  // Check if audio processing was already done to prevent duplicate processing
  const cacheKey = `audioMetrics_${interviewData.sessionId || 'default'}`;
  let audioMetrics = null;
  
  // Try to get from cache first
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const cached = window.sessionStorage.getItem(cacheKey);
    if (cached) {
      console.log('🔄 Using cached audio metrics to prevent duplicate processing');
      audioMetrics = JSON.parse(cached);
    }
  }
  
  // Only process if not cached
  if (!audioMetrics && interviewData.audioAnalysis && interviewData.audioAnalysis.length > 0) {
    console.log('🎤 Processing audio analysis for Advanced Voice Analysis...');
    console.log('📊 Raw audio analysis data sample:', interviewData.audioAnalysis.slice(0, 2));
    
    // Defer heavy processing to prevent blocking
    audioMetrics = await new Promise((resolve) => {
      // Use setTimeout to yield control to the event loop
      setTimeout(() => {
        console.log('🎤 Starting deferred audio processing...');
        const result = processAudioMetricsSync(interviewData.audioAnalysis);
        console.log('🎤 Deferred audio processing complete');
        resolve(result);
      }, 0);
    });

    if (audioMetrics) {
      console.log('✅ Audio metrics successfully generated:', {
        pitch: audioMetrics.pitch?.average + 'Hz',
        emotion: audioMetrics.tone?.predominantEmotion,
        voiceQuality: audioMetrics.voiceQuality?.overall,
        confidence: Math.round(audioMetrics.confidence?.average * 100) + '%'
      });
      
      // Cache the result
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(cacheKey, JSON.stringify(audioMetrics));
      }
    } else {
      console.log('❌ Audio metrics generation returned null');
    }
  } else if (!audioMetrics) {
    console.log('⚠️ No audio analysis data available - Advanced Voice Analysis will use defaults');
  }

  // Store COMPLETE data for UI display - this is the SINGLE SOURCE OF TRUTH
  const nonVerbalData = {
    analytics: analyticsData,
    audioMetrics: audioMetrics // Include audio metrics in single source
  };

  console.log('📊 COMPLETE non-verbal data with audio metrics:', {
    hasBasicAnalytics: !!nonVerbalData.analytics,
    hasAudioMetrics: !!nonVerbalData.audioMetrics,
    audioMetricsInclude: audioMetrics ? {
      pitch: audioMetrics.pitch?.average + 'Hz',
      emotion: audioMetrics.tone?.predominantEmotion,
      voiceQuality: audioMetrics.voiceQuality?.overall
    } : 'No audio data'
  });

  // Store in localStorage for report pages
  const sessionId = interviewData.sessionId || `interview_${Date.now()}`;
  localStorage.setItem("nonVerbalAnalysis", JSON.stringify(nonVerbalData));
  localStorage.setItem(`nonVerbalAnalysis_${sessionId}`, JSON.stringify(nonVerbalData));

  return nonVerbalData; // Return complete data for completion page
}

// Process audio metrics to extract advanced voice analysis data
// Synchronous version of processAudioMetrics - used internally
function processAudioMetricsSync(audioAnalysisData) {
  const allMetrics = audioAnalysisData.filter(a => a && a.metrics).flatMap(a => a.metrics);

  if (allMetrics.length === 0) {
    return null;
  }

  console.log('🎤 Processing audio metrics for Advanced Voice Analysis (sync)...');

  // Helper functions for audio metrics
  const mode = (arr) => {
    const frequency = {};
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
  };

  const average = (arr) => {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  const calculateConsistency = (values) => {
    if (values.length < 2) return 0.5;
    const avg = average(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / (avg || 1);
    return Math.max(0, Math.min(1, 1 - cv));
  };

  const calculateVolumeConsistency = (levels) => {
    const uniqueLevels = new Set(levels).size;
    return Math.max(0, Math.min(1, 1 - (uniqueLevels - 1) / 4));
  };

  const calculateTrend = (values) => {
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = average(firstHalf);
    const secondAvg = average(secondHalf);

    if (secondAvg > firstAvg + 0.1) return "improving";
    if (secondAvg < firstAvg - 0.1) return "declining";
    return "stable";
  };

  // Extract all metrics
  const pitchValues = allMetrics.map(m => m.pitch?.mean).filter(v => v > 0);
  const pitchTrends = allMetrics.map(m => m.pitch?.trend).filter(Boolean);
  const pitchLevels = allMetrics.map(m => m.pitch?.level).filter(Boolean);

  const emotionalTones = allMetrics.map(m => m.tone?.emotional_tone).filter(Boolean);
  const toneQualities = allMetrics.map(m => m.tone?.quality).filter(Boolean);
  const expressiveness = allMetrics.map(m => m.tone?.expressiveness).filter(v => v !== undefined);
  const warmth = allMetrics.map(m => m.tone?.warmth).filter(v => v !== undefined);
  const clarity = allMetrics.map(m => m.tone?.clarity).filter(v => v !== undefined);

  const volumeLevels = allMetrics.map(m => m.energy?.volume_level).filter(Boolean);
  const energyValues = allMetrics.map(m => m.energy?.mean).filter(v => v !== undefined);
  const brightness = allMetrics.map(m => m.energy?.brightness).filter(v => v !== undefined);

  const voiceQualities = allMetrics.map(m => m.voice_quality?.overall).filter(Boolean);
  const qualityScores = allMetrics.map(m => m.voice_quality?.quality_score).filter(v => v !== undefined);
  const breathiness = allMetrics.map(m => m.voice_quality?.breathiness).filter(v => v !== undefined);
  const hoarseness = allMetrics.map(m => m.voice_quality?.hoarseness).filter(v => v !== undefined);
  const strain = allMetrics.map(m => m.voice_quality?.strain).filter(v => v !== undefined);

  const confidenceScores = allMetrics.map(m => m.confidence_score).filter(v => v !== undefined);

  const metrics = {
    pitch: {
      average: pitchValues.length > 0 ? Math.round(pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length) : 0,
      range: pitchValues.length > 0 ? Math.round(Math.max(...pitchValues) - Math.min(...pitchValues)) : 0,
      predominantLevel: pitchLevels.length > 0 ? mode(pitchLevels) : "medium",
      predominantTrend: pitchTrends.length > 0 ? mode(pitchTrends) : "stable",
      consistency: pitchValues.length > 1 ? calculateConsistency(pitchValues) : 0.5
    },
    tone: {
      predominantEmotion: emotionalTones.length > 0 ? mode(emotionalTones) : "neutral",
      emotionalVariety: new Set(emotionalTones).size,
      predominantQuality: toneQualities.length > 0 ? mode(toneQualities) : "neutral",
      averageExpressiveness: expressiveness.length > 0 ? average(expressiveness) : 0.5,
      averageWarmth: warmth.length > 0 ? average(warmth) : 0.5,
      averageClarity: clarity.length > 0 ? average(clarity) : 0.5
    },
    energy: {
      predominantVolume: volumeLevels.length > 0 ? mode(volumeLevels) : "normal",
      averageEnergy: energyValues.length > 0 ? average(energyValues) : 0.05,
      averageBrightness: brightness.length > 0 ? Math.round(average(brightness)) : 0,
      volumeConsistency: volumeLevels.length > 0 ? calculateVolumeConsistency(volumeLevels) : 0.5
    },
    voiceQuality: {
      overall: voiceQualities.length > 0 ? mode(voiceQualities) : "good",
      averageScore: qualityScores.length > 0 ? average(qualityScores) : 0.7,
      averageBreathiness: breathiness.length > 0 ? average(breathiness) : 0.3,
      averageHoarseness: hoarseness.length > 0 ? average(hoarseness) : 0.2,
      averageStrain: strain.length > 0 ? average(strain) : 0.2
    },
    confidence: {
      average: confidenceScores.length > 0 ? average(confidenceScores) : 0.5,
      consistency: confidenceScores.length > 1 ? calculateConsistency(confidenceScores) : 0.5,
      trend: confidenceScores.length > 2 ? calculateTrend(confidenceScores) : "stable"
    }
  };

  console.log('✅ Audio metrics processed:', {
    pitch: metrics.pitch.average + 'Hz',
    emotion: metrics.tone.predominantEmotion,
    voiceQuality: metrics.voiceQuality.overall,
    confidence: Math.round(metrics.confidence.average * 100) + '%'
  });

  return metrics;
}

// Comprehensive non-verbal report builder (fallback if global is not available)
export function createComprehensiveNonVerbalReport(analyticsData, audioMetrics) {
  // Add debug info about when this function is called
  console.log('⚠️ createComprehensiveNonVerbalReport called at:', new Date().toISOString());
  // console.trace('📍 Call stack trace'); // Disabled trace to prevent performance impact
  
  // Prevent duplicate comprehensive report generation
  const reportCacheKey = `comprehensiveReport_${analyticsData?.totalWords || 'default'}_${audioMetrics?.pitch?.average || 'default'}`;
  
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const cached = window.sessionStorage.getItem(reportCacheKey);
    if (cached) {
      console.log('🔄 Using cached comprehensive report to prevent duplicate generation');
      return JSON.parse(cached);
    }
  }
  
  console.log('🔧 Using comprehensive non-verbal report builder');
  console.log('🎤 Received audio metrics:', {
    hasAudioMetrics: !!audioMetrics,
    audioMetricsDetails: audioMetrics ? {
      pitch: audioMetrics.pitch?.average + 'Hz',
      emotion: audioMetrics.tone?.predominantEmotion,
      voiceQuality: audioMetrics.voiceQuality?.overall
    } : 'No audio data received'
  });

  // Calculate confidence scores
  const fluency = Math.min(100, Math.max(0, 100 - (analyticsData.fillerPercentage * 2)));
  const speechrate = analyticsData.wordsPerMinute >= 120 && analyticsData.wordsPerMinute <= 160 ? 85 : 65;
  const pausePattern = analyticsData.pauseAnalysis?.pattern || "Balanced";
  const voiceModulationScore = pausePattern === "Balanced" ? 90 :
                               pausePattern === "Rushed Speech" ? 60 : 75;
  // const facialExpressionsScore = 75;
  const overallConfidence = Math.round(( voiceModulationScore + speechrate + fluency) / 3);

  // Generate strengths and improvements
  const strengths = [];
  const improvements = [];

  if (analyticsData.speechRate === "Good Pace") {
    strengths.push("Excellent speech pacing for clear communication");
  } else if (analyticsData.speechRate === "Slow Pace") {
    improvements.push("Consider speaking slightly faster to maintain audience engagement");
  } else if (analyticsData.speechRate === "Fast Pace") {
    improvements.push("Try speaking slightly slower to improve clarity and comprehension");
  }

  if (analyticsData.fillerPercentage < 3) {
    strengths.push("Minimal use of filler words - very articulate speech");
  } else if (analyticsData.fillerPercentage < 6) {
    strengths.push("Good control over filler words usage");
  } else {
    improvements.push(`Reduce filler words usage (currently ${analyticsData.fillerPercentage}%)`);
  }

  if (pausePattern === "Balanced") {
    strengths.push("Well-balanced pause pattern enhances speech flow");
  } else {
    improvements.push(`Improve pause timing: ${analyticsData.pauseAnalysis?.recommendation || 'Practice strategic pausing'}`);
  }

  if (analyticsData.wordsPerMinute >= 120 && analyticsData.wordsPerMinute <= 160) {
    strengths.push("Optimal speaking speed for professional communication");
  }

  if (overallConfidence >= 80) {
    strengths.push("Strong overall confidence in speech delivery");
  } else if (overallConfidence < 70) {
    improvements.push("Focus on building confidence through practice and preparation");
  }

  // Enhanced audio metrics with defaults
  const enhancedAudioMetrics = audioMetrics || {
    pitch: { average: 150, range: 50, predominantLevel: "medium", predominantTrend: "stable", consistency: 0.7 },
    tone: { predominantEmotion: "confident", averageWarmth: 0.6, averageClarity: 0.75, averageExpressiveness: 0.65, emotionalVariety: 3 },
    voiceQuality: { overall: "good", averageScore: 0.75, averageBreathiness: 0.3, averageHoarseness: 0.2, averageStrain: 0.25 },
    energy: { predominantVolume: "medium_volume", averageBrightness: 2800, volumeConsistency: 0.7 },
    confidence: { average: 0.72, consistency: 0.68, trend: "stable" }
  };

  const report = {
    analytics: analyticsData,
    audioMetrics: enhancedAudioMetrics,
    confidenceScores: { voiceModulationScore,speechrate , fluency, overallConfidence },
    insights: { strengths: strengths.slice(0, 10), improvements: improvements.slice(0, 10) },
    feedback: `Speech rate: ${analyticsData.speechRate}. ${analyticsData.speechRateDescription} Filler words usage: ${analyticsData.fillerPercentage}%. Pause pattern: ${pausePattern}. Overall confidence level: ${overallConfidence}%.`,
    pitchProfile: {
      average: enhancedAudioMetrics.pitch.average,
      range: enhancedAudioMetrics.pitch.range,
      level: enhancedAudioMetrics.pitch.predominantLevel,
      trend: enhancedAudioMetrics.pitch.predominantTrend,
      consistency: Math.round(enhancedAudioMetrics.pitch.consistency * 100)
    },
    voiceQuality: {
      overall: enhancedAudioMetrics.voiceQuality.overall,
      score: Math.round(enhancedAudioMetrics.voiceQuality.averageScore * 100),
      clarity: Math.round(enhancedAudioMetrics.tone.averageClarity * 100),
      warmth: Math.round(enhancedAudioMetrics.tone.averageWarmth * 100),
      expressiveness: Math.round(enhancedAudioMetrics.tone.averageExpressiveness * 100),
      breathiness: enhancedAudioMetrics.voiceQuality.averageBreathiness,
      hoarseness: enhancedAudioMetrics.voiceQuality.averageHoarseness,
      strain: enhancedAudioMetrics.voiceQuality.averageStrain
    },
    pauseAnalysisDetailed: {
      ...analyticsData.pauseAnalysis,
      title: analyticsData.pauseAnalysis?.type || analyticsData.pauseAnalysis?.pattern || "Balanced",
      description: analyticsData.pauseAnalysis?.description || "Your pause pattern appears balanced for natural flow."
    },
    fillerWordsBreakdown: {
      totalCount: analyticsData.fillerWords,
      percentage: analyticsData.fillerPercentage,
      detectedWords: analyticsData.detectedFillerWords || {},
      categories: Object.keys(analyticsData.detectedFillerWords || {}).length > 0 ? Object.keys(analyticsData.detectedFillerWords) : ["um", "uh", "like"]
    },
    speakingStats: {
      totalSpeakingTime: analyticsData.totalTime,
      totalWordsSpoken: analyticsData.totalWords,
      questionsAnswered: analyticsData.questionCount,
      avgWordsPerAnswer: Math.round(analyticsData.totalWords / analyticsData.questionCount)
    },
    volumeEnergyConfidence: {
      volume: {
        level: enhancedAudioMetrics.energy.predominantVolume.replace('_', ' '),
        brightness: enhancedAudioMetrics.energy.averageBrightness,
        consistency: enhancedAudioMetrics.energy.volumeConsistency
      },
      confidence: {
        average: enhancedAudioMetrics.confidence.average,
        consistency: enhancedAudioMetrics.confidence.consistency,
        trend: enhancedAudioMetrics.confidence.trend
      }
    },
    generatedAt: new Date().toISOString()
  };
  
  // Cache the result to prevent duplicate generation
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.setItem(reportCacheKey, JSON.stringify(report));
    console.log('💾 Comprehensive report cached for future use');
  }
  
  return report;
}
