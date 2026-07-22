"""Wake word detection module used to trigger the voice processing pipeline."""

import pvporcupine
from pvrecorder import PvRecorder

class WakeWordDetector:
    def __init__(self, wakeword_cb, access_key, keyword_path="models/wakeword/jetson_en_mac_v3_0_0.ppn"):
        
        self.wakeword_cb = wakeword_cb
        self.running = True

        # Initialize Porcupine with your custom .ppn file
        self.porcupine = pvporcupine.create(
            access_key=access_key,
            keyword_paths=[keyword_path]
        )
        # PvRecorder sets up an audio stream with correct frame length
        self.recorder = PvRecorder(device_index=-1, frame_length=self.porcupine.frame_length)

    def listen_forever(self):
        # Start microphone recording, check frames for wake word
        self.recorder.start()
        print("Listening for wake word...")
        try:
            while self.running:
                pcm = self.recorder.read()
                keyword_index = self.porcupine.process(pcm)
                if keyword_index >= 0:
                    print("Wake word detected!")
                    self.wakeword_cb()  # Call your callback to trigger further action
        except Exception as e:
            print(f"WakeWordDetector error: {e}")
        finally:
            self.recorder.stop()
            self.porcupine.delete()
            self.recorder.delete()
            print("Wake word listener stopped.")

    def stop(self):
        # Stop the listening loop
        self.running = False
