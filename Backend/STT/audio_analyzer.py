import numpy as np
import librosa
import scipy.stats
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')

class AudioAnalyzer:
    """
    Analyzes audio properties for non-verbal communication assessment.
    Extracts features like pitch, tone, energy, speaking rate variations, etc.
    """
    
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        
    def analyze_audio_chunk(self, audio_data: np.ndarray) -> Dict:
        """
        Analyze a chunk of audio and extract various properties.
        
        Args:
            audio_data: Audio samples as numpy array
            
        Returns:
            Dictionary containing audio analysis metrics
        """
        try:
            # Ensure audio is float32 and normalized
            if audio_data.dtype != np.float32:
                audio_data = audio_data.astype(np.float32)
            
            # Basic validation
            if len(audio_data) < self.sample_rate * 0.1:  # Less than 100ms
                return self._get_default_metrics()
            
            # Extract all features
            pitch_metrics = self._analyze_pitch(audio_data)
            energy_metrics = self._analyze_energy(audio_data)
            tone_metrics = self._analyze_tone(audio_data)
            voice_quality = self._analyze_voice_quality(audio_data)
            rhythm_metrics = self._analyze_rhythm(audio_data)
            
            return {
                "pitch": pitch_metrics,
                "energy": energy_metrics,
                "tone": tone_metrics,
                "voice_quality": voice_quality,
                "rhythm": rhythm_metrics,
                "confidence_score": self._calculate_confidence_score(audio_data)
            }
            
        except Exception as e:
            print(f"Audio analysis error: {e}")
            return self._get_default_metrics()
    
    def _analyze_pitch(self, audio: np.ndarray) -> Dict:
        """
        Analyze pitch-related features.
        """
        try:
            # Extract pitch using librosa's pitch detection
            pitches, magnitudes = librosa.piptrack(
                y=audio, 
                sr=self.sample_rate,
                hop_length=512,
                fmin=50,
                fmax=500
            )
            
            # Get pitch values where magnitude is significant
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)
            
            if not pitch_values:
                return {
                    "mean": 0,
                    "range": 0,
                    "variability": 0,
                    "trend": "stable"
                }
            
            pitch_array = np.array(pitch_values)
            
            # Calculate pitch metrics
            mean_pitch = float(np.mean(pitch_array))
            pitch_range = float(np.ptp(pitch_array))  # Peak to peak
            pitch_std = float(np.std(pitch_array))
            
            # Determine pitch trend (rising, falling, stable)
            if len(pitch_values) > 10:
                x = np.arange(len(pitch_values))
                slope, _ = np.polyfit(x, pitch_values, 1)
                if slope > 5:
                    trend = "rising"
                elif slope < -5:
                    trend = "falling"
                else:
                    trend = "stable"
            else:
                trend = "stable"
            
            # Categorize pitch level
            if mean_pitch < 120:
                pitch_level = "low"
            elif mean_pitch < 200:
                pitch_level = "medium"
            else:
                pitch_level = "high"
            
            return {
                "mean": round(mean_pitch, 2),
                "range": round(pitch_range, 2),
                "variability": round(pitch_std, 2),
                "trend": trend,
                "level": pitch_level
            }
            
        except Exception as e:
            print(f"Pitch analysis error: {e}")
            return {
                "mean": 0,
                "range": 0,
                "variability": 0,
                "trend": "stable",
                "level": "medium"
            }
    
    def _analyze_energy(self, audio: np.ndarray) -> Dict:
        """
        Analyze energy and volume-related features.
        """
        try:
            # Calculate RMS energy
            rms = librosa.feature.rms(y=audio, hop_length=512)[0]
            
            # Calculate spectral centroid (brightness)
            spectral_centroid = librosa.feature.spectral_centroid(
                y=audio, 
                sr=self.sample_rate
            )[0]
            
            # Energy statistics
            mean_energy = float(np.mean(rms))
            energy_variability = float(np.std(rms))
            
            # Volume level categorization
            if mean_energy < 0.01:
                volume_level = "very_quiet"
            elif mean_energy < 0.03:
                volume_level = "quiet"
            elif mean_energy < 0.1:
                volume_level = "normal"
            elif mean_energy < 0.3:
                volume_level = "loud"
            else:
                volume_level = "very_loud"
            
            # Calculate dynamic range
            dynamic_range = float(np.ptp(rms))
            
            return {
                "mean": round(mean_energy, 4),
                "variability": round(energy_variability, 4),
                "volume_level": volume_level,
                "dynamic_range": round(dynamic_range, 4),
                "brightness": round(float(np.mean(spectral_centroid)), 2)
            }
            
        except Exception as e:
            print(f"Energy analysis error: {e}")
            return {
                "mean": 0,
                "variability": 0,
                "volume_level": "normal",
                "dynamic_range": 0,
                "brightness": 0
            }
    
    def _analyze_tone(self, audio: np.ndarray) -> Dict:
        """
        Analyze tone and emotional indicators.
        """
        try:
            # Extract MFCCs for tone analysis
            mfccs = librosa.feature.mfcc(
                y=audio, 
                sr=self.sample_rate, 
                n_mfcc=13
            )
            
            # Spectral features for tone
            spectral_rolloff = librosa.feature.spectral_rolloff(
                y=audio, 
                sr=self.sample_rate
            )[0]
            
            zero_crossing_rate = librosa.feature.zero_crossing_rate(audio)[0]
            
            # Analyze tone characteristics
            mfcc_mean = np.mean(mfccs, axis=1)
            
            # Simple tone classification based on spectral features
            mean_rolloff = float(np.mean(spectral_rolloff))
            mean_zcr = float(np.mean(zero_crossing_rate))
            
            # Determine tone quality
            if mean_rolloff < 2000:
                if mean_zcr < 0.05:
                    tone_quality = "warm"
                else:
                    tone_quality = "soft"
            elif mean_rolloff < 4000:
                tone_quality = "neutral"
            else:
                if mean_zcr > 0.1:
                    tone_quality = "sharp"
                else:
                    tone_quality = "bright"
            
            # Estimate emotional tone (simplified)
            energy_level = float(np.mean(librosa.feature.rms(y=audio)))
            pitch_var = float(np.std(self._get_pitch_contour(audio)))
            
            if energy_level > 0.1 and pitch_var > 30:
                emotional_tone = "excited"
            elif energy_level > 0.05 and pitch_var > 20:
                emotional_tone = "engaged"
            elif energy_level < 0.02 and pitch_var < 10:
                emotional_tone = "monotone"
            elif energy_level < 0.03:
                emotional_tone = "calm"
            else:
                emotional_tone = "neutral"
            
            return {
                "quality": tone_quality,
                "emotional_tone": emotional_tone,
                "warmth": round(1 - (mean_rolloff / 8000), 2),  # 0-1 scale
                "clarity": round(mean_zcr * 10, 2),  # 0-1 scale
                "expressiveness": round(pitch_var / 50, 2)  # 0-1 scale
            }
            
        except Exception as e:
            print(f"Tone analysis error: {e}")
            return {
                "quality": "neutral",
                "emotional_tone": "neutral",
                "warmth": 0.5,
                "clarity": 0.5,
                "expressiveness": 0.5
            }
    
    def _analyze_voice_quality(self, audio: np.ndarray) -> Dict:
        """
        Analyze voice quality metrics.
        """
        try:
            # Spectral features for voice quality
            spectral_contrast = librosa.feature.spectral_contrast(
                y=audio, 
                sr=self.sample_rate
            )
            
            spectral_bandwidth = librosa.feature.spectral_bandwidth(
                y=audio, 
                sr=self.sample_rate
            )[0]
            
            # Harmonic-to-noise ratio (simplified)
            harmonic, percussive = librosa.effects.hpss(audio)
            hnr = float(np.mean(np.abs(harmonic)) / (np.mean(np.abs(percussive)) + 1e-6))
            
            # Voice quality metrics
            breathiness = min(1.0, float(np.mean(spectral_bandwidth) / 4000))
            hoarseness = min(1.0, 1.0 / (hnr + 1))
            strain = min(1.0, float(np.std(spectral_contrast)) / 10)
            
            # Overall voice quality score
            quality_score = (1 - breathiness) * 0.3 + (1 - hoarseness) * 0.3 + (1 - strain) * 0.4
            
            if quality_score > 0.8:
                overall_quality = "excellent"
            elif quality_score > 0.6:
                overall_quality = "good"
            elif quality_score > 0.4:
                overall_quality = "fair"
            else:
                overall_quality = "needs_improvement"
            
            return {
                "overall": overall_quality,
                "breathiness": round(breathiness, 2),
                "hoarseness": round(hoarseness, 2),
                "strain": round(strain, 2),
                "quality_score": round(quality_score, 2)
            }
            
        except Exception as e:
            print(f"Voice quality analysis error: {e}")
            return {
                "overall": "good",
                "breathiness": 0.3,
                "hoarseness": 0.2,
                "strain": 0.2,
                "quality_score": 0.7
            }
    
    def _analyze_rhythm(self, audio: np.ndarray) -> Dict:
        """
        Analyze speech rhythm and fluency.
        """
        try:
            # Onset detection for rhythm analysis
            onset_env = librosa.onset.onset_strength(
                y=audio, 
                sr=self.sample_rate
            )
            
            tempo, beats = librosa.beat.beat_track(
                onset_envelope=onset_env, 
                sr=self.sample_rate
            )
            
            # Convert tempo to scalar if it's an array
            if isinstance(tempo, np.ndarray):
                tempo = float(tempo.item()) if tempo.size > 0 else 120.0
            else:
                tempo = float(tempo)
            
            # Calculate rhythm regularity
            if len(beats) > 2:
                beat_intervals = np.diff(beats)
                rhythm_regularity = 1 - (float(np.std(beat_intervals)) / (float(np.mean(beat_intervals)) + 1e-6))
                rhythm_regularity = max(0, min(1, rhythm_regularity))
            else:
                rhythm_regularity = 0.5
            
            # Speech rate estimation (simplified)
            syllable_rate = tempo / 60  # Convert to per second
            
            if syllable_rate < 3:
                pace = "slow"
            elif syllable_rate < 5:
                pace = "moderate"
            else:
                pace = "fast"
            
            return {
                "tempo": round(tempo, 2),
                "regularity": round(rhythm_regularity, 2),
                "pace": pace,
                "fluency_score": round(rhythm_regularity * 0.7 + min(1, syllable_rate / 5) * 0.3, 2)
            }
            
        except Exception as e:
            print(f"Rhythm analysis error: {e}")
            return {
                "tempo": 120,
                "regularity": 0.5,
                "pace": "moderate",
                "fluency_score": 0.5
            }
    
    def _get_pitch_contour(self, audio: np.ndarray) -> np.ndarray:
        """
        Helper function to extract pitch contour.
        """
        try:
            pitches, magnitudes = librosa.piptrack(
                y=audio, 
                sr=self.sample_rate,
                hop_length=512
            )
            
            pitch_contour = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_contour.append(pitch)
            
            return np.array(pitch_contour) if pitch_contour else np.array([0])
            
        except:
            return np.array([0])
    
    def _calculate_confidence_score(self, audio: np.ndarray) -> float:
        """
        Calculate overall confidence score based on various factors.
        """
        try:
            # Factors that indicate confidence
            energy = float(np.mean(librosa.feature.rms(y=audio)))
            pitch_stability = 1 - min(1, float(np.std(self._get_pitch_contour(audio)) / 100))
            
            # Volume consistency
            rms = librosa.feature.rms(y=audio, hop_length=512)[0]
            volume_consistency = 1 - min(1, float(np.std(rms) / (np.mean(rms) + 1e-6)))
            
            # Combined confidence score
            confidence = (energy * 10) * 0.3 + pitch_stability * 0.4 + volume_consistency * 0.3
            confidence = max(0, min(1, confidence))
            
            return round(confidence, 2)
            
        except:
            return 0.5
    
    def _get_default_metrics(self) -> Dict:
        """
        Return default metrics when analysis fails.
        """
        return {
            "pitch": {
                "mean": 0,
                "range": 0,
                "variability": 0,
                "trend": "stable",
                "level": "medium"
            },
            "energy": {
                "mean": 0,
                "variability": 0,
                "volume_level": "normal",
                "dynamic_range": 0,
                "brightness": 0
            },
            "tone": {
                "quality": "neutral",
                "emotional_tone": "neutral",
                "warmth": 0.5,
                "clarity": 0.5,
                "expressiveness": 0.5
            },
            "voice_quality": {
                "overall": "good",
                "breathiness": 0.3,
                "hoarseness": 0.2,
                "strain": 0.2,
                "quality_score": 0.7
            },
            "rhythm": {
                "tempo": 120,
                "regularity": 0.5,
                "pace": "moderate",
                "fluency_score": 0.5
            },
            "confidence_score": 0.5
        }
    
    def aggregate_session_metrics(self, chunk_metrics: List[Dict]) -> Dict:
        """
        Aggregate metrics from multiple audio chunks into session-level statistics.
        """
        if not chunk_metrics:
            return self._get_default_metrics()
        
        try:
            # Aggregate pitch metrics
            pitch_means = [m["pitch"]["mean"] for m in chunk_metrics if m["pitch"]["mean"] > 0]
            pitch_vars = [m["pitch"]["variability"] for m in chunk_metrics]
            
            # Aggregate energy metrics  
            energy_means = [m["energy"]["mean"] for m in chunk_metrics]
            volume_levels = [m["energy"]["volume_level"] for m in chunk_metrics]
            
            # Aggregate tone metrics
            emotional_tones = [m["tone"]["emotional_tone"] for m in chunk_metrics]
            expressiveness = [m["tone"]["expressiveness"] for m in chunk_metrics]
            
            # Aggregate voice quality
            quality_scores = [m["voice_quality"]["quality_score"] for m in chunk_metrics]
            
            # Aggregate confidence
            confidence_scores = [m["confidence_score"] for m in chunk_metrics]
            
            # Calculate session-level metrics
            session_metrics = {
                "average_pitch": round(float(np.mean(pitch_means)), 2) if pitch_means else 0,
                "pitch_consistency": round(1 - min(1, float(np.std(pitch_means)) / (float(np.mean(pitch_means)) + 1e-6)), 2) if pitch_means else 0.5,
                "energy_level": round(float(np.mean(energy_means)), 4),
                "predominant_volume": max(set(volume_levels), key=volume_levels.count),
                "emotional_variety": len(set(emotional_tones)),
                "predominant_emotion": max(set(emotional_tones), key=emotional_tones.count),
                "average_expressiveness": round(float(np.mean(expressiveness)), 2),
                "voice_quality_score": round(float(np.mean(quality_scores)), 2),
                "overall_confidence": round(float(np.mean(confidence_scores)), 2),
                "consistency_score": round(1 - float(np.std(confidence_scores)), 2) if len(confidence_scores) > 1 else 0.5
            }
            
            return session_metrics
            
        except Exception as e:
            print(f"Session aggregation error: {e}")
            return {
                "average_pitch": 150,
                "pitch_consistency": 0.5,
                "energy_level": 0.05,
                "predominant_volume": "normal",
                "emotional_variety": 1,
                "predominant_emotion": "neutral",
                "average_expressiveness": 0.5,
                "voice_quality_score": 0.7,
                "overall_confidence": 0.5,
                "consistency_score": 0.5
            }
