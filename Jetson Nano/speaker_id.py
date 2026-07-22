"""Speaker identification module based on SpeechBrain embeddings and cosine similarity."""

from speechbrain.inference import SpeakerRecognition
import torchaudio
import torch
import numpy as np
from pathlib import Path
from glob import glob
import os
from config import SPEAKER_THRESHOLD

class SpeakerIdentifier:
    def __init__(self):
        print("Loading SpeechBrain speaker recognition model...")
        self.model = SpeakerRecognition.from_hparams(
            source="./pretrained_models/spkrec-ecapa-voxceleb",
            savedir="./pretrained_models/spkrec-ecapa-voxceleb"
        )
        self.known_speakers = self._load_known_speakers()

    def _load_known_speakers(self):
        known = []
        loaded_count = 0

        SPEAKER_SAMPLE_PATH = "./voice_samples"  
        
        if not os.path.exists(SPEAKER_SAMPLE_PATH):
            print(f"Warning: {SPEAKER_SAMPLE_PATH} not found!")
            return known

        # Auto-detect all speakers from file names (prefix before first '_')
        speakers = set()
        for file in os.listdir(SPEAKER_SAMPLE_PATH):
            if file.endswith(".wav"):
                spk = file.split("_")[0]  # e.g., "me1" from "me1_command1.wav"
                speakers.add(spk)
        
        for name in speakers:
            # Find all files belonging to this speaker
            files = glob(f"{SPEAKER_SAMPLE_PATH}/{name}_*.wav")
            emb_list = []
            
            for file_path in files:
                path = Path(file_path)
                if not path.exists():
                    continue
                try:
                    waveform, sr = torchaudio.load(path)
                    # Resample to 16kHz if needed
                    if sr != 16000:
                        resampler = torchaudio.transforms.Resample(sr, 16000)
                        waveform = resampler(waveform)
                    # Convert stereo to mono
                    if waveform.shape[0] > 1:
                        waveform = waveform.mean(0, keepdim=True)
                    
                    # Extract embedding
                    emb = self.model.encode_batch(waveform).squeeze().cpu().numpy()
                    emb_list.append(emb)
                except Exception as e:
                    print(f"Error loading {file_path}: {e}")
            
            if emb_list:
                # Average all embeddings for this speaker
                mean_emb = np.mean(emb_list, axis=0)
                known.append((name, mean_emb))
                loaded_count += 1
                print(f"Loaded speaker: {name} with {len(emb_list)} samples")
        
        print(f"Successfully loaded {loaded_count} known speaker(s)")
        return known

    def identify(self, audio_np_float32):
        
        total_len = len(audio_np_float32)
        sr = 16000
        
        if total_len < sr * 0.5:  # Too short (<0.5s)
            return None, 0.0

        # Prepare chunks for verification
        chunks = []
        
        if total_len > sr * 2.0:
            # Strategy: Split into 3 segments (head, middle, tail) + full audio
            # 1. First 1 second
            chunks.append(audio_np_float32[:sr])
            # 2. Middle 1 second
            mid = total_len // 2
            chunks.append(audio_np_float32[mid - sr//2 : mid + sr//2])
            # 3. Last 1 second
            chunks.append(audio_np_float32[-sr:])
            # 4. Full segment (backup)
            chunks.append(audio_np_float32)
        else:
            # Short audio: use full segment only
            chunks.append(audio_np_float32)

        # Voting system
        votes = {}       # Count votes for each speaker
        scores_sum = {}  # Sum of scores for averaging

        for chunk in chunks:
            waveform = torch.tensor(chunk).unsqueeze(0)
            embedding = self.model.encode_batch(waveform).squeeze().cpu().numpy()

            best_chunk_name = None
            best_chunk_score = 0.0

            # Find best match for this chunk
            for name, known_emb in self.known_speakers:
                score = np.dot(embedding, known_emb) / (
                        np.linalg.norm(embedding) * np.linalg.norm(known_emb)
                )
                if score > best_chunk_score:
                    best_chunk_score = score
                    best_chunk_name = name
            
            # Only count votes that pass threshold
            if best_chunk_score >= SPEAKER_THRESHOLD:
                votes[best_chunk_name] = votes.get(best_chunk_name, 0) + 1
                scores_sum[best_chunk_name] = scores_sum.get(best_chunk_name, 0.0) + best_chunk_score

        # Tally results
        if not votes:
            return None, 0.0
            
        # Winner is speaker with most votes
        winner = max(votes, key=votes.get)
        vote_count = votes[winner]
        avg_score = scores_sum[winner] / vote_count
        
        # Strict mode: If 4 chunks (3 segments + 1 full), need at least 2 votes
        # If only 1 chunk (short audio), 1 vote is enough
        required_votes = 2 if len(chunks) > 1 else 1
        
        if vote_count >= required_votes:
            print(f"Speaker verified: {winner} (Votes: {vote_count}/{len(chunks)}, Avg: {avg_score:.3f})")
            return winner, avg_score
        else:
            print(f"Speaker rejected: {winner} only got {vote_count}/{len(chunks)} votes")
            return None, avg_score
