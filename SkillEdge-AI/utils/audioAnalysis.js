/**
 * Audio Analysis Utility Functions
 * Handles advanced voice analysis including pitch, tone, voice quality, and confidence metrics
 */

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

/**
 * Process audio metrics to extract advanced voice analysis data
 * @param {Array} audioAnalysisData - Raw audio analysis data from speech processing
 * @returns {Object|null} Processed audio metrics or null if no data available
 */
export const processAudioMetrics = (audioAnalysisData) => {
  const allMetrics = audioAnalysisData.filter(a => a && a.metrics).flatMap(a => a.metrics);
  
  if (allMetrics.length === 0) {
    console.log('🎤 No audio metrics available');
    return null;
  }
  
  console.log('🎤 Processing audio metrics for Advanced Voice Analysis...');
  
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
};