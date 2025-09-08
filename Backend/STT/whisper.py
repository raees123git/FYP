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
from faster_whisper import WhisperModel  # Using faster_whisper for better performance

# ---- Constants ----
SAMPLE_RATE = 16000
FRAME_MS = 20
FRAME_SIZE = int(SAMPLE_RATE * FRAME_MS / 1000)
CHANNELS = 1

# ---- Configure model ----
MODEL_SIZE = "small.en"
model = WhisperModel(
    MODEL_SIZE,
    device="cuda",       # change to "cpu" if no GPU
    compute_type="int8", # or "int8_float16" / "float16"
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

# ---- Generator version of transcribe_stream ----
def transcribe_stream():
    with stream:
        while True:
            audio_chunk, start_time, end_time = next(collect_utterances())

            if (end_time - start_time) < 0.3:
                continue

            max_abs = np.max(np.abs(audio_chunk)) + 1e-8
            if max_abs < 1e-6:
                continue
            audio_chunk = (audio_chunk / max_abs * 0.8).astype(np.float32)

            segments, info = model.transcribe(
            audio_chunk,
            language="en",
            task="transcribe",
            beam_size=10,                # already good, but you can push to 10
            best_of=10,                  # try 10 if GPU allows
            temperature=0.0,            # keeps output deterministic
            vad_filter=True,
            condition_on_previous_text=True,   # 👈 give context, reduces hallucinations
            compression_ratio_threshold=2.0,   # stricter
            log_prob_threshold=-0.5,           # stricter, filter low-confidence
            no_speech_threshold=0.6,           # lower → detects speech more aggressively
            word_timestamps=False,
)

            if hasattr(info, "no_speech_prob") and info.no_speech_prob > 0.8:
                continue

            for seg in segments:
                text = seg.text.strip()
                if not text:
                    continue

                blacklist = ["thanks for watching!", "thank you for watching!", "subscribe", "bye."]
                if text.lower() in blacklist:
                    continue

                # yield instead of only printing
                yield text

# ---- WebSocket Server ----
clients = set()

async def broadcast(message: dict):
    if clients:
        msg = json.dumps(message)
        await asyncio.gather(*(client.send(msg) for client in clients))

async def handler(websocket):
    clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        clients.remove(websocket)

def whisper_loop():
    for text in transcribe_stream():
        asyncio.run(broadcast({"text": text}))

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        print("✅ WebSocket server running at ws://localhost:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    t = threading.Thread(target=whisper_loop, daemon=True)
    t.start()
    asyncio.run(main())
