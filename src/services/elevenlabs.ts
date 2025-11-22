// ElevenLabs API Configuration
// Documentation: https://elevenlabs.io/docs/api-reference
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const ELEVENLABS_API_KEY = 'sk_5387586fa99f7eecf2b8b0b9333d44f7c1074e8f1d9903c6';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

export interface VoiceCloneResponse {
  voiceId: string;
  status: 'processing' | 'completed' | 'failed';
  message?: string;
  demoAudio?: string; // URL to preview audio if provided
}

interface ElevenLabsVoiceResponse {
  voice_id: string;
  name: string;
  samples?: Array<{
    sample_id: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    hash: string;
  }>;
  category?: string;
  fine_tuning?: {
    model_id?: string;
    is_allowed_to_fine_tune: boolean;
    finetuning_state: string;
    verification_failures: string[];
    verification_attempts_count: number;
    language?: string;
  };
  labels?: Record<string, string>;
  description?: string;
  preview_url?: string;
  available_for_tiers?: string[];
  settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  sharing?: {
    status: string;
    history_item_sample_id?: string;
    original_voice_id?: string;
    public_owner_id?: string;
    liked_by_count: number;
    cloned_by_count: number;
    name?: string;
    labels?: Record<string, string>;
    created_at_unix?: number;
    voice_mixing?: boolean;
    permission_on_resource?: string;
  };
  high_quality_base_model_ids?: string[];
  safety_control?: string;
  permission_on_resource?: string;
  voice_verification?: {
    requires_verification: boolean;
    is_verified: boolean;
    verification_failures: string[];
    verification_attempts_count: number;
    language?: string;
  };
  permission_on_resource?: string;
}

interface ElevenLabsErrorResponse {
  detail?: {
    status?: string;
    message?: string;
  };
  message?: string;
}

/**
 * Clona una voz usando ElevenLabs API (Instant Voice Cloning)
 * ElevenLabs permite clonar voces directamente subiendo el archivo de audio
 */
export const cloneVoice = async (
  audioFile: File | Blob,
  options?: {
    name?: string;
    description?: string;
    labels?: Record<string, string>;
    // Additional options for better cloning
    useProfessionalCloning?: boolean; // Use Professional Voice Cloning if available
    additionalFiles?: (File | Blob)[]; // Additional audio samples for better quality
  }
): Promise<VoiceCloneResponse> => {
  try {
    // Use the ElevenLabs SDK for Instant Voice Cloning
    const voiceName = options?.name || `MAZK_Voice_${Date.now()}`;
    
    // Prepare files array - include main file and any additional files
    const files: File[] = [audioFile as File];
    if (options?.additionalFiles && options.additionalFiles.length > 0) {
      files.push(...(options.additionalFiles as File[]));
    }
    
    // Log audio file info for debugging
    console.log('Cloning voice with:', {
      mainFileSize: audioFile.size,
      mainFileType: audioFile.type,
      additionalFiles: options?.additionalFiles?.length || 0,
      totalFiles: files.length,
    });
    
    // Create the voice clone using the SDK
    // Note: Instant Voice Cloning (IVC) typically uses 1 file, but we can try multiple
    // For Professional Voice Cloning, multiple files are recommended
    // Note: Labels are not supported in Instant Voice Cloning (IVC) API
    // They are only available in Professional Voice Cloning
    const createOptions: any = {
      name: voiceName,
      files: files,
    };
    
    // Add description if provided
    if (options?.description) {
      createOptions.description = options.description;
    }
    
    // Do not include labels - Instant Voice Cloning does not support them
    // If you need labels, you would need to use Professional Voice Cloning instead
    
    const voice = await elevenlabs.voices.ivc.create(createOptions);

    if (!voice.voiceId) {
      throw new Error('No se recibió un voice_id válido de ElevenLabs');
    }

    return {
      voiceId: voice.voiceId,
      status: 'completed',
      message: 'Voz clonada exitosamente con ElevenLabs',
      demoAudio: undefined, // SDK doesn't return preview URL directly
    };
  } catch (error: any) {
    console.error('Error cloning voice with ElevenLabs:', error);
    
    // Handle specific error cases
    const errorMessage = error?.message || 'Error desconocido al clonar la voz';
    
    if (errorMessage.toLowerCase().includes('subscription') || 
        errorMessage.toLowerCase().includes('upgrade') ||
        errorMessage.toLowerCase().includes('access')) {
      throw new Error(
        'Tu suscripción de ElevenLabs no tiene acceso a Instant Voice Cloning.\n\n' +
        'Para usar esta funcionalidad, necesitas:\n' +
        '1. Actualizar tu plan en https://elevenlabs.io\n' +
        '2. Asegurarte de que tu plan incluya Instant Voice Cloning\n' +
        '3. Verificar los límites de tu suscripción actual'
      );
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Genera audio usando una voz clonada de ElevenLabs
 */
export const generateVoice = async (
  voiceId: string,
  text: string,
  options?: {
    model?: string;
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  }
): Promise<string> => {
  try {
    // Use the SDK for text-to-speech
    // Optimized settings for better voice cloning quality:
    // - Higher similarity_boost (0.8-0.9) for closer match to original
    // - Moderate stability (0.4-0.6) for natural variation
    // - Speaker boost enabled for clearer voice
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text,
      model_id: options?.model || 'eleven_multilingual_v2',
      voice_settings: {
        stability: options?.stability ?? 0.5, // Balance between consistency and naturalness
        similarity_boost: options?.similarity_boost ?? 0.85, // Higher = closer to original voice
        style: options?.style ?? 0.0, // Style exaggeration (0.0 = natural)
        use_speaker_boost: options?.use_speaker_boost ?? true, // Enhance voice clarity
      },
    });

    // Convert the audio stream to a blob URL
    const chunks: Uint8Array[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    
    const blob = new Blob(chunks, { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(blob);
    return audioUrl;
  } catch (error: any) {
    console.error('Error generating voice with ElevenLabs:', error);
    const errorMessage = error?.message || 'Error desconocido al generar audio';
    throw new Error(errorMessage);
  }
};

/**
 * Obtiene información sobre una voz clonada
 */
export const getVoiceInfo = async (voiceId: string): Promise<ElevenLabsVoiceResponse> => {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices/${voiceId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: ElevenLabsErrorResponse;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Error desconocido' };
      }
      throw new Error(
        errorData.detail?.message || errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting voice info from ElevenLabs:', error);
    throw error;
  }
};

/**
 * Lista todas las voces disponibles en la cuenta
 */
export const listVoices = async (): Promise<ElevenLabsVoiceResponse[]> => {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: ElevenLabsErrorResponse;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Error desconocido' };
      }
      throw new Error(
        errorData.detail?.message || errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Error listing voices from ElevenLabs:', error);
    throw error;
  }
};

