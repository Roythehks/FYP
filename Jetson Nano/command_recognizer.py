"""Command recognition module for mapping transcribed text to smart-home intents."""

from sentence_transformers import SentenceTransformer
import numpy as np
import os

# Set your model directory (this is where you want the model to be)
LOCAL_MODEL_PATH = "models/all-MiniLM-L6-v2"

def find_model_folder(base):
    """Return the path to the folder containing config.json."""
    # Direct folder check
    config_path = os.path.join(base, 'config.json')
    if os.path.isfile(config_path):
        return base

    # Search subdirectories for config.json
    for root, dirs, files in os.walk(base):
        if 'config.json' in files and 'pytorch_model.bin' in files:
            return root
    return None

# Check if model exists
model_folder = find_model_folder(LOCAL_MODEL_PATH)

if model_folder:
    print(f"Loading model from {model_folder}")
    model = SentenceTransformer(model_folder)
else:
    print(f"Model not found locally, downloading to {LOCAL_MODEL_PATH}")
    model = SentenceTransformer('all-MiniLM-L6-v2', cache_folder=LOCAL_MODEL_PATH)
    model_folder = find_model_folder(LOCAL_MODEL_PATH)  # For next run

INTENT_EXAMPLES = {
    "turn_on_light": ["turn on the light", "light on", "it's dark", "lights please", "open light"],
    "turn_off_light": ["turn off the light", "light off", "too bright", "lights off", "of light"],
    "turn_on_fan": ["turn on the fan", "fan on", "open the fan"],
    "turn_off_fan": ["turn off the fan", "fan off", "of fan"],
    "open_door": ["open the door", "unlock door", "let me in", "open gate"],
    "close_door": ["close the door", "lock the door", "lock it"]
}

texts = [s for sent_list in INTENT_EXAMPLES.values() for s in sent_list]
labels = [intent for intent, sents in INTENT_EXAMPLES.items() for _ in sents]
embeddings = model.encode(texts, normalize_embeddings=True)

def recognize_command(text: str):
    if not text.strip():
        return {"intent": "unknown", "device": "", "action": "", "confidence": 0.0}
    query = model.encode([text], normalize_embeddings=True)
    scores = np.dot(query, embeddings.T).flatten()
    idx = np.argmax(scores)
    confidence = float(scores[idx])
    if confidence < 0.65:
        return {"intent": "unknown", "device": "", "action": "", "confidence": confidence}
    intent = labels[idx]
    device = "light" if "light" in intent else "fan" if "fan" in intent else "door"
    action = ("on" if "on" in intent else 
              "off" if "off" in intent else 
              "open" if "open" in intent else 
              "close")
    return {
        "intent": action,
        "device": device,
        "action": action,
        "confidence": confidence
    }
