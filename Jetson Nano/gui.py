"""Tkinter GUI for wake word detection, speaker identification, speech recognition, and access control."""

import tkinter as tk
from tkinter import ttk, messagebox
import pyaudio
import numpy as np
import threading
import time


# --- Backend Modules ---
from speaker_id import SpeakerIdentifier
from stt import STTEngine
from command_recognizer import recognize_command
from config import PERMISSIONS, ACCESS_KEY
from supabase_client import fetch_users_permissions # Supabase integration


# Wake word detection (import your detector from wake.py)
from wake import WakeWordDetector


# Audio Configuration
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
SILENCE_THRESHOLD = 500
RECORD_SECONDS = 3.0
BASE_RADIUS = 70


# GUI Color Configuration
BG_COLOR = "#ffffff"
TEXT_COLOR = "#222222"
ACCENT_COLOR = "#2196F3"
SUCCESS_COLOR = "#4CAF50"
ERROR_COLOR = "#F44336"
WARN_COLOR = "#FFC107"
GRAY_TEXT = "#888888"
BTN_BG = "#f9f9f9"
BTN_HOVER = "#e0e0e0"


class VoiceUIApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Voice Security System")
        self.root.geometry("450x750")  # Slightly taller for sync button
        self.root.configure(bg=BG_COLOR)


        # State variables for backend/model
        self.status_var = tk.StringVar(value="Initializing AI...")
        self.models_loaded = False
        threading.Thread(target=self._load_models, daemon=True).start()


        # Supabase permissions data (synced from database)
        self.permissions_data = {}  # Store: {"gordon": {"fan": false, "light": true, "door": false}}


        # State for audio recording
        self.listening = False
        self.recording = False
        self.volume = 0.0
        self.audio_frames = []
        self.p = pyaudio.PyAudio()
        self.stream = None


        # Wake word detector instance
        self.wake_detector = None


        self._setup_styles()
        self._build_ui()
        self._check_model_load()


        # Begin wake word detection after initializing the UI
        self._start_wakeword_detection()
        self.permissions_data = {}
        


    def _setup_styles(self):
        """Configure ttk styles for consistent appearance"""
        style = ttk.Style()
        style.theme_use('clam')


        # Configure treeview styles for user table
        style.configure(
            "Treeview",
            background="white",
            foreground=TEXT_COLOR,
            rowheight=30,
            font=("Segoe UI", 10),
            fieldbackground="white",
            borderwidth=0
        )
        style.configure(
            "Treeview.Heading",
            background="#f0f0f0",
            foreground=TEXT_COLOR,
            font=("Segoe UI", 10, "bold"),
            relief="flat"
        )
        style.map("Treeview", background=[('selected', ACCENT_COLOR)])


    def _load_models(self):
        """Load AI models in background thread"""
        try:
            self.speaker_id = SpeakerIdentifier()
            self.stt = STTEngine("openai/whisper-small")
            self.models_loaded = True
            self.status_var.set("Say \"Jetson\" to start.")
        except Exception as e:
            self.status_var.set("Error Loading Models")
            print(e)


    def _check_model_load(self):
        """Update UI styles after models are loaded"""
        if self.models_loaded:
            self.mic_canvas.itemconfig(self.mic_circle, outline="#ddd")
            self.mic_canvas.itemconfig(self.mic_icon, fill="#aaa")
        else:
            self.root.after(500, self._check_model_load)


    def _build_ui(self):
        """Build complete GUI layout"""
        # Header spacing
        tk.Frame(self.root, bg=BG_COLOR, height=30).pack()


        # Status header label
        self.header_lbl = tk.Label(
            self.root,
            textvariable=self.status_var,
            font=("Segoe UI", 14),
            bg=BG_COLOR,
            fg=GRAY_TEXT
        )
        self.header_lbl.pack(pady=5)


        # Mic visualizer
        self.mic_canvas = tk.Canvas(
            self.root,
            width=260,
            height=260,
            bg=BG_COLOR,
            highlightthickness=0
        )
        self.mic_canvas.pack(pady=15)


        # Draw mic visualization circles and icon
        cx, cy = 130, 130
        self.pulse_ring = self.mic_canvas.create_oval(
            cx, cy, cx, cy,
            outline=ACCENT_COLOR,
            width=3,
            state="hidden"
        )
        self.mic_circle = self.mic_canvas.create_oval(
            cx - BASE_RADIUS,
            cy - BASE_RADIUS,
            cx + BASE_RADIUS,
            cy + BASE_RADIUS,
            fill="white",
            outline="#eee",
            width=3,
            tags="btn"
        )
        self.mic_icon = self.mic_canvas.create_text(
            cx,
            cy,
            text="🎙",
            font=("Segoe UI", 50),
            fill="#ccc",
            tags="btn"
        )
        # Keep click-on-mic for testing and debugging
        self.mic_canvas.tag_bind("btn", "<Button-1>", lambda e: self.start_listening())


        # Command/action result
        self.action_lbl = tk.Label(
            self.root,
            text="",
            font=("Segoe UI", 22, "bold"),
            bg=BG_COLOR,
            fg=TEXT_COLOR
        )
        self.action_lbl.pack(pady=(20, 5))


        self.status_badge = tk.Label(
            self.root,
            text="",
            font=("Segoe UI", 12, "bold"),
            bg=BG_COLOR,
            fg=GRAY_TEXT
        )
        self.status_badge.pack(pady=5)


        self.user_lbl = tk.Label(
            self.root,
            text="",
            font=("Segoe UI", 11),
            bg=BG_COLOR,
            fg=GRAY_TEXT
        )
        self.user_lbl.pack()


        # --- Sync button frame (NEW: Supabase sync) - 
        btn_container = tk.Frame(self.root, bg=BG_COLOR)
        btn_container.pack(side="bottom", pady=25, fill="x")


        # sync button 
        self.sync_button = tk.Button(
            btn_container,
            text="🔄 Sync Permissions",
            font=("Segoe UI", 11, "bold"),
            bg=ACCENT_COLOR,
            fg="white",
            activebackground="#1976D2",
            relief="flat",
            bd=0,
            padx=30,
            pady=12,
            cursor="hand2",
            command=self.sync_permissions
        )
        self.sync_button.pack(side="left", padx=(25, 15), pady=8)


        # view users/permissions button
        self.view_btn = tk.Button(
            btn_container,
            text="👥 View Users & Permissions",
            font=("Segoe UI", 11, "bold"),
            bg="white",
            fg=ACCENT_COLOR,
            activebackground="#f0f8ff",
            activeforeground=ACCENT_COLOR,
            relief="flat",
            bd=2,
            padx=30,
            pady=12,
            cursor="hand2",
            command=self.open_user_page
        )
        self.view_btn.pack(side="right", padx=(15, 25), pady=8)


    def sync_permissions(self):
        """Sync permissions from database in simple dict format"""
        try:
            self.sync_button.config(text="🔄 Syncing...", state="disabled")
            self.status_var.set("Syncing permissions from database...")
            
            # FIXED: Use correct function from supabase_client.py
            self.permissions_data = fetch_users_permissions()
            
            if not self.permissions_data:
                self.status_var.set("No permissions found")
                messagebox.showwarning("Sync Warning", "No permissions found in database")
                return
            
            self.status_var.set(f"Synced {len(self.permissions_data)} users")
            messagebox.showinfo("Sync Success", f"Synced {len(self.permissions_data)} users!")
            print(f"Synced permissions: {self.permissions_data}")
            
        except Exception as e:
            self.status_var.set("Sync failed")
            messagebox.showerror("Sync Error", f"Failed to sync: {str(e)}")
            print(f"Sync error: {e}")
        
        finally:
            self.sync_button.config(text="✅ Synced", state="normal")
            self.root.after(2000, lambda: self.sync_button.config(text="🔄 Sync Permissions"))


    def open_user_page(self):
        """Display user permissions from synced database data in new window"""
        top = tk.Toplevel(self.root)
        top.title("Users & Permissions")
        top.geometry("500x500")
        top.configure(bg=BG_COLOR)


        tk.Label(
            top,
            text="User Permissions (Synced from DB)",
            font=("Segoe UI", 18, "bold"),
            bg=BG_COLOR,
            fg=TEXT_COLOR
        ).pack(pady=20)


        cols = ("User", "Fan", "Light", "Door")
        tree = ttk.Treeview(top, columns=cols, show="headings", height=12)
        
        tree.heading("User", text="User Name")
        tree.heading("Fan", text="Fan")
        tree.heading("Light", text="Light") 
        tree.heading("Door", text="Door")
        
        tree.column("User", width=120)
        tree.column("Fan", width=80)
        tree.column("Light", width=80)
        tree.column("Door", width=80)


        tree.pack(padx=20, pady=10, fill="both", expand=True)


        # database data
        perms_to_show = self.permissions_data
        
        if not perms_to_show:
            tree.insert("", "end", values=("No data", "", "", "Sync first!"))
        else:
            for user_name, perms in perms_to_show.items():
                fan = "✅" if perms.get("fan", False) else "❌"
                light = "✅" if perms.get("light", False) else "❌" 
                door = "✅" if perms.get("door", False) else "❌"
                
                tree.insert("", "end", values=(
                    user_name.title(),
                    fan,
                    light,
                    door
                ))


        tk.Button(
            top,
            text="Close",
            font=("Segoe UI", 10),
            bg=BTN_BG,
            fg=TEXT_COLOR,
            command=top.destroy,
            relief="flat",
            padx=20,
            pady=5
        ).pack(pady=15)


    def _start_wakeword_detection(self):
        """Start continuous wake word detection in background"""
        if ACCESS_KEY == "YOUR_PICOVOICE_ACCESS_KEY":
            print("ACCESS_KEY missing in config.py. Wake word will not start.")
            return


        # Callback to run after wake word detected
        def on_wake():
            # Use Tkinter's after to safely call GUI logic in main thread
            self.root.after(0, self.start_listening)


        # Use custom wake word model from local file
        custom_ppn = "models/wakeword/jetson_en_mac_v3_0_0.ppn"  
        self.wake_detector = WakeWordDetector(
            wakeword_cb=on_wake,
            access_key=ACCESS_KEY,
            keyword_path=custom_ppn
        )
        # Run detector in background thread
        threading.Thread(target=self.wake_detector.listen_forever, daemon=True).start()


    def start_listening(self):
        """Begin audio recording and processing after wake word is detected"""
        if not self.models_loaded:
            return
        if self.listening:
            return


        self.listening = True
        self.recording = False
        self.audio_frames = []


        self.status_var.set("Recording after wake word...")
        self.action_lbl.config(text="")
        self.status_badge.config(text="", fg=GRAY_TEXT)
        self.user_lbl.config(text="")


        self.mic_canvas.itemconfig(self.mic_circle, outline=ACCENT_COLOR)
        self.mic_canvas.itemconfig(self.mic_icon, fill=ACCENT_COLOR)
        self.mic_canvas.itemconfigure(self.pulse_ring, state="normal")
        self._animate_pulse()


        try:
            self.stream = self.p.open(
                format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK,
                stream_callback=self._audio_callback
            )
            self.stream.start_stream()
        except Exception as e:
            print("Error starting audio stream:", e)
            self.stop_listening()


    def stop_listening(self):
        """Stop the audio recording and reset the UI display"""
        self.listening = False
        self.recording = False
        self.mic_canvas.itemconfigure(self.pulse_ring, state="hidden")
        self.mic_canvas.itemconfig(self.mic_circle, outline="#eee")
        self.mic_canvas.itemconfig(self.mic_icon, fill="#aaa")
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
            self.stream = None


    def _audio_callback(self, in_data, frame_count, time_info, status):
        """Audio stream callback for collecting data and monitoring volume threshold"""
        if not self.listening:
            return (None, pyaudio.paComplete)
        
        audio_np = np.frombuffer(in_data, dtype=np.int16)
        rms = np.sqrt(np.mean(audio_np.astype(np.float64) ** 2)) if len(audio_np) > 0 else 0
        self.volume = min(rms / 2000.0, 1.0)
        
        if rms > SILENCE_THRESHOLD and not self.recording:
            self.recording = True
            self.record_start = time.time()
            self.audio_frames = [in_data]
            self.root.after(0, lambda: self.status_var.set("Recording..."))
        elif self.recording:
            self.audio_frames.append(in_data)
            if time.time() - self.record_start > RECORD_SECONDS:
                self.recording = False
                self.root.after(0, self._process_recording)
                return (None, pyaudio.paComplete)
        
        return (in_data, pyaudio.paContinue)


    def _process_recording(self):
        """After audio is captured, run backend (speaker ID, STT, intent) in a separate thread"""
        self.stop_listening()
        self.status_var.set("Processing...")
        threading.Thread(target=self._run_backend, daemon=True).start()


    def _run_backend(self):
        """Run all backend recognition tasks after audio is finished"""
        raw_data = b"".join(self.audio_frames)
        wav_bytes = self.stt._raw_to_wav(raw_data)
        audio_np = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
        
        text = self.stt.transcribe(wav_bytes)
        cmd = recognize_command(text)
        name, score = self.speaker_id.identify(audio_np)
        speaker = name if name else "Unknown"
        
        # Use database permissions if synced, otherwise fallback to config
        granted = False
        if name and cmd["intent"] != "unknown":
            # Priority 1: Use synced database permissions
            if self.permissions_data and name.lower() in self.permissions_data:
                user_perms = self.permissions_data[name.lower()]
                granted = user_perms.get(cmd["device"], False)
            # Priority 2: Fallback to local config
            else:
                perms = PERMISSIONS.get(name, {})
                granted = perms.get(cmd["device"], False)
        
        self.root.after(0, lambda: self._display_result(cmd, speaker, granted))


    def _display_result(self, cmd, speaker, granted):
        """Update UI widgets based on command and speaker recognition results"""
        self.status_var.set("Say \"Jetson\" to start.")
        if cmd["intent"] == "unknown":
            action_text = " UNKNOWN Command"
            action_color = WARN_COLOR
            status_text = "Command Not Recognized"
            status_color = WARN_COLOR
        else:
            action_text = f"{cmd['action'].upper()} {cmd['device'].upper()}"
            action_color = TEXT_COLOR
            if speaker == "Unknown":
                status_text = "❌ ACCESS DENIED (Unknown User)"
                status_color = ERROR_COLOR
            elif not granted:
                status_text = "⛔ ACCESS DENIED (No Permission)"
                status_color = ERROR_COLOR
            else:
                status_text = "✅ ACCESS"
                status_color = SUCCESS_COLOR
                action_color = SUCCESS_COLOR
        self.action_lbl.config(text=action_text, fg=action_color)
        self.status_badge.config(text=status_text, fg=status_color)
        self.user_lbl.config(text=f"User: {speaker}")


    def _animate_pulse(self):
        """
        UI animation to visualize audio volume feedback.
        """
        if not self.listening:
            return
        cx, cy = 130, 130
        r = BASE_RADIUS + (self.volume * 50)
        self.mic_canvas.coords(self.pulse_ring, cx - r, cy - r, cx + r, cy + r)
        self.root.after(30, self._animate_pulse)


    def on_close(self):
        """
        Clean up resources and stop all background threads before closing GUI.
        """
        if self.wake_detector:
            self.wake_detector.stop()
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        self.p.terminate()
        self.root.destroy()
        
if __name__ == "__main__":
    root = tk.Tk()
    app = VoiceUIApp(root)
    root.protocol("WM_DELETE_WINDOW", app.on_close)
    root.mainloop()
