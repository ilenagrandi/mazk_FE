// Metatron API Service
// Documentation: See metatron/LIVEKIT_INTEGRATION.md

const METATRON_API_URL = import.meta.env.VITE_METATRON_API_URL || 'http://localhost:8000';
const METATRON_API_URL_ALT = 'http://localhost:5885';

export interface OutboundCallRequest {
  phone_number: string; // E.164 format: +1234567890
  voice_id?: string; // ElevenLabs voice ID
  metadata?: {
    campaign?: string;
    lead_id?: string;
    [key: string]: any;
  };
}

export interface OutboundCallResponse {
  call_id: string;
  room_name: string;
  phone_number: string;
  status: 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed';
}

export interface TranscriptEntry {
  speaker: 'agent' | 'customer';
  text: string;
  timestamp: string;
}

export interface CallStatus {
  call_id: string;
  status: string;
  duration?: number;
  transcript?: TranscriptEntry[];
}

/**
 * Initiate an outbound call via Metatron/Twilio
 */
export const initiateOutboundCall = async (
  request: OutboundCallRequest
): Promise<OutboundCallResponse> => {
  const apiUrls = [METATRON_API_URL, METATRON_API_URL_ALT];
  
  let response: Response | null = null;
  let lastError: Error | null = null;
  
  for (const apiUrl of apiUrls) {
    try {
      response = await fetch(`${apiUrl}/calls/outbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorText = await response.text();
        console.log(`API ${apiUrl} failed:`, response.status, errorText);
        lastError = new Error(`Error ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.log(`API ${apiUrl} error:`, err);
      lastError = err instanceof Error ? err : new Error('Error desconocido');
    }
  }
  
  const finalError = lastError || new Error('No se pudo conectar al servidor de Metatron');
  
  // Provide more helpful error message
  if (finalError.message.includes('fetch') || finalError.message.includes('Failed to fetch')) {
    throw new Error(
      'No se pudo conectar al servidor de Metatron.\n\n' +
      'El servidor no está corriendo. Por favor:\n' +
      '1. Inicia el servidor con: cd metatron && docker-compose up\n' +
      '2. O ejecuta: cd metatron/metatron && python3 run.py\n' +
      '3. Verifica que esté corriendo en http://localhost:8000 o http://localhost:5885'
    );
  }
  
  throw finalError;
};

/**
 * Get call status and transcript
 */
export const getCallStatus = async (callId: string): Promise<CallStatus> => {
  const apiUrls = [METATRON_API_URL, METATRON_API_URL_ALT];
  
  let response: Response | null = null;
  let lastError: Error | null = null;
  
  for (const apiUrl of apiUrls) {
    try {
      response = await fetch(`${apiUrl}/calls/${callId}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorText = await response.text();
        console.log(`API ${apiUrl} failed:`, response.status, errorText);
        lastError = new Error(`Error ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.log(`API ${apiUrl} error:`, err);
      lastError = err instanceof Error ? err : new Error('Error desconocido');
    }
  }
  
  throw lastError || new Error('No se pudo obtener el estado de la llamada');
};

/**
 * Format phone number to E.164 format
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it doesn't start with +, add it
  if (!phone.startsWith('+')) {
    // Assume it's a local number, you might want to add country code detection
    // For now, we'll just add + if it's not there
    cleaned = '+' + cleaned;
  } else {
    cleaned = phone.replace(/\D/g, '');
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

