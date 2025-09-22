// Utility functions for Non-Verbal Report

export const analyzePauses = (pauses) => {
  const pauseCounts = {
    long: pauses.filter(p => p === "long").length,
    normal: pauses.filter(p => p === "normal").length,
    short: pauses.filter(p => p === "short").length
  };
  
  let pattern = "Balanced";
  let description = "Your pause pattern shows good variety.";
  let recommendation = "";
  
  if (pauseCounts.long > pauseCounts.normal + pauseCounts.short) {
    pattern = "Too Many Long Pauses";
    description = "You tend to have lengthy pauses between thoughts.";
    recommendation = "Practice maintaining a steady flow with shorter pauses.";
  } else if (pauseCounts.short > pauseCounts.normal + pauseCounts.long) {
    pattern = "Rushed Speech";
    description = "You speak with minimal pauses.";
    recommendation = "Add strategic pauses to emphasize key points.";
  }
  
  return {
    pattern,
    description,
    recommendation,
    counts: pauseCounts
  };
};

export const mode = (array) => {
  if (!array || array.length === 0) return null;
  
  const frequency = {};
  let maxFreq = 0;
  let result = array[0];
  
  array.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxFreq) {
      maxFreq = frequency[item];
      result = item;
    }
  });
  
  return result;
};

export const calculateConsistency = (values) => {
  if (!values || values.length <= 1) return 0.5;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean; // Coefficient of variation
  
  // Convert CV to a 0-1 consistency score (lower CV = higher consistency)
  return Math.max(0, Math.min(1, 1 - cv));
};

export const getScoreColor = (score) => {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
};

export const getScoreLabel = (score) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Improvement";
};

export const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const calculateFillerWordsList = () => {
  return [
    "um", "uh", "like", "you know", "actually", "basically", 
    "literally", "right", "so", "well", "I mean", "kind of", 
    "sort of", "yeah","ohh", "hmm", "huh", "er", "ah", "mm",
    " Mmm.","oooh","hmmm","Uh", "Uhh", "Uhhh","Ummmm","Ummmmm","Hello","Hi"
  ];
};

export const analyzeAudioMetrics = (audioAnalysisData) => {
  // Process and aggregate audio metrics from all answers
  const allMetrics = audioAnalysisData.filter(a => a && a.metrics).flatMap(a => a.metrics);
  
  if (allMetrics.length === 0) {
    return null;
  }
  
  // Extract pitch data
  const pitchValues = allMetrics.map(m => m.pitch?.mean).filter(v => v > 0);
  const pitchTrends = allMetrics.map(m => m.pitch?.trend).filter(Boolean);
  const pitchLevels = allMetrics.map(m => m.pitch?.level).filter(Boolean);
  
  // Extract tone data
  const emotionalTones = allMetrics.map(m => m.tone?.emotional_tone).filter(Boolean);
  const toneQualities = allMetrics.map(m => m.tone?.quality).filter(Boolean);
  const expressiveness = allMetrics.map(m => m.tone?.expressiveness).filter(v => v !== undefined);
  const warmth = allMetrics.map(m => m.tone?.warmth).filter(v => v !== undefined);
  const clarity = allMetrics.map(m => m.tone?.clarity).filter(v => v !== undefined);
  
  // Extract energy data
  const volumeLevels = allMetrics.map(m => m.energy?.volume_level).filter(Boolean);
  const energyValues = allMetrics.map(m => m.energy?.mean).filter(v => v !== undefined);
  const brightness = allMetrics.map(m => m.energy?.brightness).filter(v => v !== undefined);
  
  // Extract voice quality data
  const voiceQualities = allMetrics.map(m => m.voice_quality?.overall).filter(Boolean);
  const qualityScores = allMetrics.map(m => m.voice_quality?.quality_score).filter(v => v !== undefined);
  const breathiness = allMetrics.map(m => m.voice_quality?.breathiness).filter(v => v !== undefined);
  const hoarseness = allMetrics.map(m => m.voice_quality?.hoarseness).filter(v => v !== undefined);
  const strain = allMetrics.map(m => m.voice_quality?.strain).filter(v => v !== undefined);
  
  // Extract confidence scores
  const confidenceScores = allMetrics.map(m => m.confidence_score).filter(v => v !== undefined);
  
  // Calculate aggregated metrics
  return {
    pitch: {
      average: pitchValues.length > 0 ? Math.round(pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length) : 0,
      range: pitchValues.length > 0 ? Math.round(Math.max(...pitchValues) - Math.min(...pitchValues)) : 0,
      predominantLevel: pitchLevels.length > 0 ? mode(pitchLevels) : "medium",
      predominantTrend: pitchTrends.length > 0 ? mode(pitchTrends) : "stable",
      consistency: pitchValues.length > 1 ? calculateConsistency(pitchValues) : 0.5
    },
    tone: {
      predominantEmotion: emotionalTones.length > 0 ? mode(emotionalTones) : "neutral",
      quality: toneQualities.length > 0 ? mode(toneQualities) : "normal",
      averageExpressiveness: expressiveness.length > 0 ? expressiveness.reduce((a, b) => a + b, 0) / expressiveness.length : 0.5,
      averageWarmth: warmth.length > 0 ? warmth.reduce((a, b) => a + b, 0) / warmth.length : 0.5,
      averageClarity: clarity.length > 0 ? clarity.reduce((a, b) => a + b, 0) / clarity.length : 0.5
    },
    energy: {
      predominantVolume: volumeLevels.length > 0 ? mode(volumeLevels) : "moderate",
      averageEnergy: energyValues.length > 0 ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length : 0,
      averageBrightness: brightness.length > 0 ? brightness.reduce((a, b) => a + b, 0) / brightness.length : 0.5
    },
    voiceQuality: {
      overall: voiceQualities.length > 0 ? mode(voiceQualities) : "normal",
      averageScore: qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0.7,
      averageBreathiness: breathiness.length > 0 ? breathiness.reduce((a, b) => a + b, 0) / breathiness.length : 0.1,
      averageHoarseness: hoarseness.length > 0 ? hoarseness.reduce((a, b) => a + b, 0) / hoarseness.length : 0.1,
      averageStrain: strain.length > 0 ? strain.reduce((a, b) => a + b, 0) / strain.length : 0.1
    },
    confidence: {
      average: confidenceScores.length > 0 ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length : 0.5,
      trend: confidenceScores.length > 2 ? 
        (confidenceScores[confidenceScores.length - 1] > confidenceScores[0] ? 'improving' : 
         confidenceScores[confidenceScores.length - 1] < confidenceScores[0] ? 'declining' : 'stable') 
        : 'stable',
      consistency: confidenceScores.length > 1 ? calculateConsistency(confidenceScores) : 0.5
    }
  };
};

export const generateReportContent = (analytics, audioMetrics) => {
  const timestamp = new Date().toLocaleString();
  
  let reportContent = `
NON-VERBAL COMMUNICATION REPORT
================================
Generated: ${timestamp}

SPEECH METRICS
--------------
Speech Rate: ${analytics.speechRate}
Words Per Minute: ${analytics.wordsPerMinute}
Total Words Spoken: ${analytics.totalWords}
Total Speaking Time: ${formatTime(analytics.totalTime)}
Questions Answered: ${analytics.questionCount}

FLUENCY ANALYSIS
----------------
Filler Words Used: ${analytics.fillerWords}
Filler Word Percentage: ${analytics.fillerPercentage}%
`;

  if (analytics.detectedFillerWords && Object.keys(analytics.detectedFillerWords).length > 0) {
    reportContent += `\nMost Common Fillers:\n`;
    Object.entries(analytics.detectedFillerWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([word, count]) => {
        reportContent += `  - "${word}": ${count} times\n`;
      });
  }

  reportContent += `
PAUSE PATTERN ANALYSIS
----------------------
Pattern: ${analytics.pauseAnalysis.pattern}
Description: ${analytics.pauseAnalysis.description}
`;

  if (analytics.pauseAnalysis.recommendation) {
    reportContent += `Recommendation: ${analytics.pauseAnalysis.recommendation}\n`;
  }

  if (audioMetrics) {
    reportContent += `
AUDIO ANALYSIS
--------------
Voice Pitch:
  Average: ${audioMetrics.pitch.average} Hz
  Range: ${audioMetrics.pitch.range} Hz
  Level: ${audioMetrics.pitch.predominantLevel}
  Trend: ${audioMetrics.pitch.predominantTrend}
  Consistency: ${(audioMetrics.pitch.consistency * 100).toFixed(1)}%

Tone Quality:
  Emotional Tone: ${audioMetrics.tone.predominantEmotion}
  Voice Quality: ${audioMetrics.tone.quality}
  Expressiveness: ${(audioMetrics.tone.averageExpressiveness * 100).toFixed(1)}%
  Warmth: ${(audioMetrics.tone.averageWarmth * 100).toFixed(1)}%
  Clarity: ${(audioMetrics.tone.averageClarity * 100).toFixed(1)}%

Energy & Volume:
  Volume Level: ${audioMetrics.energy.predominantVolume}
  Energy Score: ${(audioMetrics.energy.averageEnergy * 100).toFixed(1)}%
  Voice Brightness: ${(audioMetrics.energy.averageBrightness * 100).toFixed(1)}%

Voice Quality:
  Overall Quality: ${audioMetrics.voiceQuality.overall}
  Quality Score: ${(audioMetrics.voiceQuality.averageScore * 100).toFixed(1)}%
  Breathiness: ${(audioMetrics.voiceQuality.averageBreathiness * 100).toFixed(1)}%
  Hoarseness: ${(audioMetrics.voiceQuality.averageHoarseness * 100).toFixed(1)}%
  Strain: ${(audioMetrics.voiceQuality.averageStrain * 100).toFixed(1)}%

Confidence:
  Average Confidence: ${(audioMetrics.confidence.average * 100).toFixed(1)}%
  Confidence Trend: ${audioMetrics.confidence.trend}
  Consistency: ${(audioMetrics.confidence.consistency * 100).toFixed(1)}%
`;
  }

  reportContent += `
================================
End of Report
`;

  return reportContent;
};