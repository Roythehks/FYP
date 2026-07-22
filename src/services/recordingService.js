import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

export async function uploadRecordingAsync(localUri, options = {}) {
  if (!localUri) {
    throw new Error('Missing localUri for upload');
  }

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: 'base64',
  });

  const insertPayload = {
    user_id: options.userId || null,
    audio_base64: base64,
    duration_ms: options.durationMs || null,
    language: options.language || null,
    command_type: options.commandType || null,
    section_id: options.sectionId || null,
    section_title: options.sectionTitle || null,
    repetition: options.repetition || null,
    status: 'uploaded',
  };

  const { data: insertData, error: insertError } = await supabase
    .from('voice_recordings')
    .insert([insertPayload])
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return { recording: insertData };
}


