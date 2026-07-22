"""Speech-to-text module using a local or cached Whisper model."""

import torch
from transformers import pipeline
import pyaudio
import numpy as np
import io
import wave
import os
from config import SAMPLE_RATE, MICROPHONE_INDEX

# Use 1024 chunk (standard and safe)
CHUNK_SIZE = 1024

# Local Model Path
LOCAL_WHISPER_BASE = "models/whisper-small"

def find_model_folder(base):
    """Find the subfolder containing config.json"""
    if os.path.isfile(os.path.join(base, 'config.json')):
        return base
    for root, dirs, files in os.walk(base):
        if 'config.json' in files and 'pytorch_model.bin' in files:
            return root
    return base

class STTEngine:
    def __init__(self, model_name="openai/whisper-small"):
        print(f"Loading Whisper model: {model_name} ...")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        real_model_path = find_model_folder(LOCAL_WHISPER_BASE)
        print(f"Using Whisper model from: {real_model_path}")

        if os.path.exists(os.path.join(real_model_path, 'config.json')):
            self.pipe = pipeline(
                "automatic-speech-recognition",
                model=real_model_path,
                device=self.device
            )
        else:
            self.pipe = pipeline(
                "automatic-speech-recognition",
                model=model_name,
                device=self.device,
                model_kwargs={"cache_dir": LOCAL_WHISPER_BASE}
            )
            
        print("Whisper loaded!")

        self.SECONDS = 3
        self.FRAMES = int(SAMPLE_RATE / CHUNK_SIZE * self.SECONDS)

        self.p = pyaudio.PyAudio()
        self.stream = self.p.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=SAMPLE_RATE,
            input=True,
            input_device_index=MICROPHONE_INDEX,
            frames_per_buffer=CHUNK_SIZE
        )

    def record_3_seconds(self):
        print("Recording... (3 seconds)")
        frames = []
        for _ in range(self.FRAMES):
            data = self.stream.read(CHUNK_SIZE, exception_on_overflow=False)
            frames.append(data)

        audio_bytes = self._raw_to_wav(b''.join(frames))
        audio_np = np.frombuffer(b''.join(frames), dtype=np.int16).astype(np.float32) / 32768.0

        print("Recording finished")
        return audio_bytes, audio_np

    def _raw_to_wav(self, raw_data):
        byte_io = io.BytesIO()
        with wave.open(byte_io, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(SAMPLE_RATE)
            wav_file.writeframes(raw_data)
        return byte_io.getvalue()

    def transcribe(self, wav_bytes):
        """Input: valid WAV bytes (with header)"""
        with io.BytesIO(wav_bytes) as f:
            with wave.open(f, 'rb') as wf:
                audio_array = np.frombuffer(
                    wf.readframes(wf.getnframes()),
                    dtype=np.int16
                ).astype(np.float32) / 32768.0

        result = self.pipe(audio_array, generate_kwargs={"language": "en"})
        return result["text"].strip()

    def close(self):
        self.stream.stop_stream()
        self.stream.close()
        self.p.terminate()
        print("Audio stream closed.")
