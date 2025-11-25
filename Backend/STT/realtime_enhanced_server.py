import asyncio
import websockets
import json
import threading
import sys
import time
import numpy as np
import queue
import sounddevice as sd
import webrtcvad
from faster_whisper import WhisperModel

# Try to import audio analyzer
try:
    from audio_analyzer import AudioAnalyzer
    AUDIO_ANALYSIS_AVAILABLE = True
    audio_analyzer = AudioAnalyzer(sample_rate=16000)
except Exception as e:
    print(f"Audio analysis not available: {e}")
    AUDIO_ANALYSIS_AVAILABLE = False

# ---- Constants ----
SAMPLE_RATE = 16000
FRAME_MS = 20
FRAME_SIZE = int(SAMPLE_RATE * FRAME_MS / 1000)
CHANNELS = 1

# ---- Configure model ----
MODEL_SIZE = "medium.en"
model = WhisperModel(
    MODEL_SIZE,
    device="cuda",
    compute_type="int8",
)

# ---- Audio capture ----
audio_q = queue.Queue()

def audio_callback(indata, frames, time_info, status):
    if status:
        print(f"[Audio status] {status}", file=sys.stderr)
    mono = indata if indata.ndim == 1 else indata.mean(axis=1)
    audio_q.put(mono.copy())

stream = sd.InputStream(
    channels=CHANNELS,
    samplerate=SAMPLE_RATE,
    dtype="float32",
    blocksize=FRAME_SIZE,
    callback=audio_callback,
)

vad = webrtcvad.Vad(2)  # 0–3 (3 = most aggressive)

def float_to_int16(x):
    x = np.clip(x, -1.0, 1.0)
    return (x * 32767).astype(np.int16)

# ---- Global frame counter ----
global_frame_index = 0

def frame_generator():
    global global_frame_index
    buf = np.array([], dtype=np.float32)
    while True:
        block = audio_q.get()
        buf = np.concatenate([buf, block])
        while len(buf) >= FRAME_SIZE:
            frame = buf[:FRAME_SIZE]
            buf = buf[FRAME_SIZE:]
            global_frame_index += 1
            yield frame

def is_speech(frame_f32):
    pcm16 = float_to_int16(frame_f32).tobytes()
    return vad.is_speech(pcm16, SAMPLE_RATE)

def has_significant_audio(audio_chunk, energy_threshold=0.002):
    rms = np.sqrt(np.mean(audio_chunk ** 2))
    return rms > energy_threshold

def collect_utterances(
    max_silence_ms=300,
    min_voiced_ms=200,
    prepad_ms=100,
    max_utterance_ms=5000,
):
    frames = []
    voiced_count = 0
    silence_count = 0
    total_voiced_frames = 0
    utterance_start_time = None

    prepad_frames = int(prepad_ms / FRAME_MS)
    max_silence_frames = int(max_silence_ms / FRAME_MS)
    min_voiced_frames = int(min_voiced_ms / FRAME_MS)
    max_frames = int(max_utterance_ms / FRAME_MS)

    for frame in frame_generator():
        speech = is_speech(frame)
        frames.append(frame)

        if speech:
            if utterance_start_time is None:
                utterance_start_time = (global_frame_index - len(frames)) * FRAME_MS / 1000.0
            voiced_count += 1
            total_voiced_frames += 1
            silence_count = 0
        else:
            silence_count += 1

        if voiced_count >= min_voiced_frames:
            if silence_count >= max_silence_frames or len(frames) >= max_frames:
                end_time = global_frame_index * FRAME_MS / 1000.0
                if total_voiced_frames >= min_voiced_frames:
                    end_idx = len(frames) - silence_count
                    start_idx = max(0, end_idx - max_frames + prepad_frames)
                    voiced = np.concatenate(frames[start_idx:end_idx]).astype(np.float32)

                    if has_significant_audio(voiced):
                        yield voiced, utterance_start_time, end_time

                frames = []
                voiced_count = 0
                silence_count = 0
                total_voiced_frames = 0
                utterance_start_time = None
        else:
            if len(frames) > max_frames:
                frames = frames[-prepad_frames:]
                total_voiced_frames = 0
                utterance_start_time = None

# ---- Store for session metrics ----
session_audio_metrics = []

# ---- Generator version of transcribe_stream with audio analysis ----
def transcribe_stream():
    global session_audio_metrics
    
    with stream:
        while True:
            audio_chunk, start_time, end_time = next(collect_utterances())

            if (end_time - start_time) < 0.3:
                continue

            max_abs = np.max(np.abs(audio_chunk)) + 1e-8
            if max_abs < 1e-6:
                continue
            audio_chunk = (audio_chunk / max_abs * 0.8).astype(np.float32)

            # Analyze audio if available
            audio_metrics = None
            if AUDIO_ANALYSIS_AVAILABLE:
                try:
                    audio_metrics = audio_analyzer.analyze_audio_chunk(audio_chunk)
                    session_audio_metrics.append(audio_metrics)
                except Exception as e:
                    print(f"Audio analysis warning: {e}")

            # Transcribe with aggressive anti-hallucination settings
            t0 = time.time()
            segments, info = model.transcribe(
                audio_chunk,
                language="en",
                task="transcribe",
                beam_size=3,  # Reduced further
                best_of=3,  # Reduced further
                temperature=0.0,
                vad_filter=True,
                condition_on_previous_text=False,
                compression_ratio_threshold=2.8,  # More aggressive
                log_prob_threshold=-0.8,  # Stricter
                no_speech_threshold=0.5,  # Lower to detect actual speech better
                word_timestamps=True,  # Enable to check word-level confidence
                initial_prompt=None,
                repetition_penalty=1.2,  # Add penalty for repetition
            )
            t1 = time.time()
            elapsed = t1 - t0

            # Stricter no-speech filtering
            if hasattr(info, "no_speech_prob") and info.no_speech_prob > 0.7:
                continue

            for seg in segments:
                seg_start = start_time + seg.start
                seg_end = start_time + seg.end
                text = seg.text.strip()
                
                if not text:
                    continue

                # Check average log probability first (aggressive filter)
                if hasattr(seg, 'avg_logprob') and seg.avg_logprob < -0.8:
                    continue

                # Enhanced blacklist with common Whisper hallucinations
                blacklist = [
                    "Do you realize anything in a better way",
                    "see you next week",
                    "That's how it is",
                    "it is beautiful",
                    "thanks for watching",
                    "thank you for watching",
                    "thank you",
                    "thank you very much",
                    "thanks",
                    "subscribe",
                    "bye",
                    "bye bye",
                    "see ya",
                    "have a good week",
                    "have a good day",
                    "good morning",
                    "good night",
                    "i love you",
                    "confidence",
                    "hello",
                    "wait",
                    "whoa",
                    "oh my god",
                    "oh my gosh",
                    "this is our",
                    "video",
                    "of this video",
                ]
                
                # Normalize text
                normalized_text = text.lower().rstrip('.!?,')
                
                # Exact match check
                if normalized_text in blacklist:
                    continue
                
                # Aggressive partial match check for hallucination patterns
                hallucination_patterns = [
                    "thank you",
                    "thanks",
                    "subscribe",
                    "this is our",
                    "video",
                    "have a good",
                    "good morning",
                    "good night",
                    "see ya",
                    "oh my god",
                    "oh my gosh",
                    "path of god",
                    "didn't hurt",
                    "what's ever",
                    "who are you",
                    "i'll be there",
                    "he's here",
                    "whoa",
                ]
                
                if any(pattern in normalized_text for pattern in hallucination_patterns):
                    continue
                
                # Filter segments with religious/dramatic phrases (common hallucinations)
                religious_dramatic = ["god", "lord", "heaven", "hell", "pray", "soul"]
                if any(word in normalized_text.split() for word in religious_dramatic):
                    continue
                
                # Filter very short or very generic segments
                words = text.split()
                if len(words) < 3:
                    generic_short = ["hello", "wait", "bye", "thank you", "thanks", "yes", "no", "okay", "ok"]
                    if normalized_text in generic_short:
                        continue
                
                # Check compression ratio (repetitive text indicator)
                if hasattr(seg, 'compression_ratio') and seg.compression_ratio > 2.8:
                    continue

                # Print to console
                print(f"[{seg_start:.2f} - {seg_end:.2f}] {text} (⏱ {elapsed:.2f}s)")
                if audio_metrics:
                    tone = audio_metrics.get("tone", {}).get("emotional_tone", "unknown")
                    confidence = audio_metrics.get("confidence_score", 0)
                    print(f"  Tone: {tone}, Confidence: {confidence}")

                # Yield the result with optional audio analysis
                result = {"text": text}
                if audio_metrics:
                    result["audio_analysis"] = {
                        "pitch": audio_metrics.get("pitch", {}),
                        "tone": audio_metrics.get("tone", {}),
                        "energy": audio_metrics.get("energy", {}),
                        "voice_quality": audio_metrics.get("voice_quality", {}),
                        "confidence_score": audio_metrics.get("confidence_score", 0.5)
                    }
                
                yield result

# ---- WebSocket Server ----
clients = set()

async def broadcast(message: dict):
    """Broadcast message to all connected clients immediately."""
    if clients:
        msg = json.dumps(message)
        # Send to all clients concurrently
        await asyncio.gather(
            *(client.send(msg) for client in clients),
            return_exceptions=True  # Don't fail if one client has issues
        )

async def handler(websocket):
    """Handle WebSocket connection."""
    clients.add(websocket)
    print(f"✅ Client connected: {websocket.remote_address}")
    try:
        await websocket.wait_closed()
    finally:
        clients.remove(websocket)
        print(f"❌ Client disconnected: {websocket.remote_address}")
        
        # Send session summary if available
        if AUDIO_ANALYSIS_AVAILABLE and session_audio_metrics and websocket in clients:
            try:
                session_summary = audio_analyzer.aggregate_session_metrics(session_audio_metrics)
                summary_msg = {
                    "type": "session_summary",
                    "audio_summary": session_summary
                }
                await websocket.send(json.dumps(summary_msg))
            except:
                pass

def whisper_loop():
    """Run transcription in a separate thread and broadcast results immediately."""
    for result in transcribe_stream():
        # Use asyncio.run to immediately broadcast each transcription
        asyncio.run(broadcast(result))

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        print("🎤 Real-time Enhanced STT Server")
        print("📊 Listening on ws://localhost:8765")
        print("✨ Audio analysis:", "enabled" if AUDIO_ANALYSIS_AVAILABLE else "disabled")
        print("🚀 Real-time streaming enabled")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    # Start the transcription thread (like original whisper.py)
    t = threading.Thread(target=whisper_loop, daemon=True)
    t.start()
    
    # Run the WebSocket server
    asyncio.run(main())