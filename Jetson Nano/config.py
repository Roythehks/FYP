"""Central configuration for audio, model paths, permissions, and thresholds."""


# paths
KNOWN_SPEAKERS = [
    "voice_sample/CWM1.wav",
    "voice_sample/me1.wav",
    "voice_sample/melon1.wav",
    "voice_sample/recording1.wav",
    "voice_sample/recording5.wav",
    "voice_sample/cwm3.wav",
    "voice_sample/roy1.wav"

]


ACCESS_KEY = "YOUR_PICOVOICE_ACCESS_KEY"
CONTEXT_PATH = "models/home_en_mac_v3_0_0.rhn"

# Audio setting
SAMPLE_RATE = 16000
FRAME_LENGTH = 512
CHANNELS = 1
FORMAT = 'int16'
MICROPHONE_INDEX = 1

# Speaker identification threshold
SPEAKERTHRESHOLD = 0.35

