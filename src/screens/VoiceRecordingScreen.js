import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Audio } from 'expo-av';
import { uploadRecordingAsync } from '../services/recordingService';
import { useUser } from '../context/UserContext';

const RECORDING_SECTIONS = [
  {
    id: 'free_talk',
    title: '10 Second Talk',
    subtitle: 'Please talk naturally for 10 seconds',
    count: 1,
    durationSec: 10,
  },
  {
    id: 'turn_on_light',
    title: 'Turn On Light',
    subtitle: 'Say "Turn On Light" clearly',
    count: 3,
    commandType: 'turn_on_light',
  },
  {
    id: 'turn_off_light',
    title: 'Turn Off Light',
    subtitle: 'Say "Turn Off Light" clearly',
    count: 3,
    commandType: 'turn_off_light',
  },
  {
    id: 'turn_on_fan',
    title: 'Turn On Fan',
    subtitle: 'Say "Turn On Fan" clearly',
    count: 3,
    commandType: 'turn_on_fan',
  },
  {
    id: 'turn_off_fan',
    title: 'Turn Off Fan',
    subtitle: 'Say "Turn Off Fan" clearly',
    count: 3,
    commandType: 'turn_off_fan',
  },
];

const TOTAL_RECORDINGS = RECORDING_SECTIONS.reduce((sum, s) => sum + s.count, 0);

export default function VoiceRecordingScreen({ navigation }) {
  const { currentUser } = useUser();

  // sectionIndex: which section we're on (0–4)
  // repIndex: which repetition within the section (0-based)
  const [sectionIndex, setSectionIndex] = useState(0);
  const [repIndex, setRepIndex] = useState(0);

  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // Count of completed recordings per section
  const [sectionDone, setSectionDone] = useState(RECORDING_SECTIONS.map(() => 0));

  const totalDone = sectionDone.reduce((sum, d) => sum + d, 0);
  const currentSection = RECORDING_SECTIONS[sectionIndex];
  const allDone = totalDone >= TOTAL_RECORDINGS;

  const goToUsers = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('UsersTab');
    } else {
      navigation.navigate('UserList');
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    if (!currentUser) return;

    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Microphone permission is needed to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync({
        isMeteringEnabled: false,
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 256000,
        },
      });
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
      startTimer();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecordingAndUpload = async () => {
    if (!recording) return;

    try {
      stopTimer();
      const status = await recording.getStatusAsync();
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);

      if (!uri) {
        Alert.alert('Error', 'No recording URI found.');
        return;
      }

      setIsUploading(true);
      await uploadRecordingAsync(uri, {
        userId: currentUser.id,
        durationMs: status?.durationMillis ?? null,
        sectionId: currentSection.id,
        sectionTitle: currentSection.title,
        repetition: repIndex + 1,
        commandType: currentSection.commandType || null,
      });
      setIsUploading(false);

      // Update progress
      const newSectionDone = [...sectionDone];
      newSectionDone[sectionIndex] += 1;
      setSectionDone(newSectionDone);

      const nextRep = repIndex + 1;
      if (nextRep >= currentSection.count) {
        // Move to next section
        const nextSection = sectionIndex + 1;
        if (nextSection >= RECORDING_SECTIONS.length) {
          Alert.alert(
            'All Done!',
            `All ${TOTAL_RECORDINGS} recordings completed for ${currentUser.name}!`,
            [{ text: 'Finish', onPress: () => navigation.goBack() }]
          );
        } else {
          setSectionIndex(nextSection);
          setRepIndex(0);
        }
      } else {
        setRepIndex(nextRep);
      }
    } catch (e) {
      console.error(e);
      stopTimer();
      setIsUploading(false);
      setIsRecording(false);
      if (recording) {
        try { await recording.stopAndUnloadAsync(); } catch (_) {}
        setRecording(null);
      }
      Alert.alert('Upload failed', e.message || 'Could not upload recording.');
    }
  };

  const handleRecordButton = () => {
    if (!currentUser) {
      Alert.alert(
        'No User Selected',
        'Please select a user before recording.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Users', onPress: goToUsers },
        ]
      );
      return;
    }
    if (isRecording) {
      stopRecordingAndUpload();
    } else {
      startRecording();
    }
  };

  const buttonLabel = isUploading ? 'Uploading...' : isRecording ? 'Stop' : 'Tap to Record';
  const buttonColor = isRecording ? '#FF3B30' : allDone ? '#34C759' : '#3A7BFF';

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.mainTitle}>Voice Recording</Text>

      {/* Progress */}
      <Text style={styles.progressText}>
        Progress: {totalDone} / {TOTAL_RECORDINGS} recordings
      </Text>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${(totalDone / TOTAL_RECORDINGS) * 100}%` }]} />
      </View>

      {/* Step indicators */}
      <View style={styles.stepsRow}>
        {RECORDING_SECTIONS.map((sec, i) => {
          const isDone = sectionDone[i] >= sec.count;
          const isCurrent = i === sectionIndex;
          return (
            <View
              key={sec.id}
              style={[
                styles.stepCircle,
                isDone && styles.stepDone,
                isCurrent && !isDone && styles.stepCurrent,
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  (isDone || isCurrent) && styles.stepTextActive,
                ]}
              >
                {i + 1}
              </Text>
            </View>
          );
        })}
      </View>

      {/* No user warning */}
      {!currentUser && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>No user selected</Text>
          <TouchableOpacity onPress={goToUsers}>
            <Text style={styles.warningLink}>Select a user to continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Current section card */}
      {!allDone && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{currentSection.title}</Text>
          <Text style={styles.sectionSubtitle}>{currentSection.subtitle}</Text>
          {currentSection.count > 1 && (
            <Text style={styles.sectionRep}>
              {repIndex + 1} / {currentSection.count}
            </Text>
          )}
          {isRecording && currentSection.durationSec && (
            <Text style={styles.timerText}>{elapsed}s / {currentSection.durationSec}s</Text>
          )}
        </View>
      )}

      {allDone && (
        <View style={[styles.sectionCard, { borderColor: '#34C759' }]}>
          <Text style={[styles.sectionTitle, { color: '#34C759' }]}>All recordings complete!</Text>
        </View>
      )}

      {/* Record button */}
      <TouchableOpacity
        style={[styles.recordButton, { backgroundColor: buttonColor }]}
        onPress={handleRecordButton}
        disabled={isUploading || allDone}
        activeOpacity={0.8}
      >
        <View style={styles.recordDot} />
      </TouchableOpacity>
      <Text style={styles.tapLabel}>{buttonLabel}</Text>

      {/* Recording sections list */}
      <ScrollView style={styles.sectionsList} contentContainerStyle={{ paddingBottom: 16 }}>
        <Text style={styles.sectionsHeader}>Recording Sections:</Text>
        {RECORDING_SECTIONS.map((sec, i) => (
          <Text key={sec.id} style={styles.sectionItem}>
            {i + 1}. {sec.title}{sec.count > 1 ? ` x${sec.count}` : ` (${sec.durationSec}s)`}{' '}
            ({sectionDone[i]}/{sec.count})
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#3A7BFF',
    borderRadius: 3,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCurrent: {
    backgroundColor: '#3A7BFF',
  },
  stepDone: {
    backgroundColor: '#34C759',
  },
  stepText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  stepTextActive: {
    color: '#fff',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1.5,
    borderColor: '#FFC107',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  warningLink: {
    fontSize: 13,
    color: '#3A7BFF',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  sectionCard: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  sectionRep: {
    fontSize: 13,
    color: '#3A7BFF',
    marginTop: 6,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 13,
    color: '#FF3B30',
    marginTop: 4,
    fontWeight: '600',
  },
  recordButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  recordDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  tapLabel: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionsList: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  sectionsHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
  },
  sectionItem: {
    fontSize: 13,
    color: '#444',
    marginBottom: 3,
  },
});
