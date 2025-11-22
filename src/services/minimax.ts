// Minimax API Configuration
// Documentation: https://platform.minimax.io/document/api-docs
const MINIMAX_API_KEY = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJJTEVOQSBHUkFOREkiLCJVc2VyTmFtZSI6Ik1BWksiLCJBY2NvdW50IjoiIiwiU3ViamVjdElEIjoiMTk5MjMwMjI3ODEwMjQ4NzcyNCIsIlBob25lIjoiIiwiR3JvdXBJRCI6IjE5OTIzMDIyNzgwOTgyOTc1MTYiLCJQYWdlTmFtZSI6IiIsIk1haWwiOiJpbGVuYS5ncmFuZGlAZ21haWwuY29tIiwiQ3JlYXRlVGltZSI6IjIwMjUtMTEtMjMgMDM6MzY6NTEiLCJUb2tlblR5cGUiOjEsImlzcyI6Im1pbmltYXgifQ.Xw2b4XB-0XXD6s_pqc6ot-cDxTJUj27MCK0lsWa2J1IPNfuFbVjPySww9eusfPA-UyIV4aoO_i_dsDjX9KR0RSGfxzEMk4iJZez8BV2Oj7STmMyQs8Oq1KsRsehCe8qQd2DnmHgWCEx9ryhO6Zc_sXO4FPo2BMLipeoObKtWGSEDXHXMLDUorKL2UJaTU49NxBxySrAVPD0Q_vn1zGfEBZoIUCHEYou0CHLK_pbCMXeU2musZxzfSyiPDTDu9pJ2qWfHwUv6JIQ-6zKgnc-eVn_KPgt2-XB_y8dv-eUNBpeHp1_D0YkVRrk1YTRu9WYma6a3BodykXAt7LUzcWLSCA';
const MINIMAX_BASE_URL = 'https://api.minimax.io';

// Development mode: Set to true to simulate voice cloning without API calls
// This is useful when you don't have balance in Minimax account
const DEV_MODE = import.meta.env.DEV && import.meta.env.VITE_MINIMAX_DEV_MODE === 'true';

export interface VoiceCloneResponse {
  voiceId: string;
  status: 'processing' | 'completed' | 'failed';
  message?: string;
  demoAudio?: string; // URL to preview audio if provided
}

interface UploadFileResponse {
  file: {
    file_id: number;
    bytes: number;
    created_at: number;
    filename: string;
    purpose: string;
  };
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

interface VoiceCloneApiResponse {
  input_sensitive?: {
    type: number;
  };
  demo_audio?: string;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

/**
 * Sube un archivo de audio a Minimax
 * Paso 1: Subir el archivo para obtener el file_id
 */
const uploadAudioFile = async (audioFile: File | Blob): Promise<number> => {
  const formData = new FormData();
  formData.append('purpose', 'voice_clone');
  formData.append('file', audioFile);

  const response = await fetch(`${MINIMAX_BASE_URL}/v1/files/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { base_resp: { status_msg: errorText || 'Error desconocido' } };
    }
    throw new Error(
      errorData.base_resp?.status_msg || 
      `Error ${response.status}: ${response.statusText}`
    );
  }

  const data: UploadFileResponse = await response.json();
  
  if (data.base_resp.status_code !== 0) {
    throw new Error(data.base_resp.status_msg || 'Error al subir el archivo');
  }

  return data.file.file_id;
};

/**
 * Clona una voz usando Minimax API
 * Paso 2: Usar el file_id para clonar la voz
 */
export const cloneVoice = async (
  audioFile: File | Blob,
  options?: {
    previewText?: string;
    model?: 'speech-2.6-hd' | 'speech-2.6-turbo' | 'speech-02-hd' | 'speech-02-turbo';
  }
): Promise<VoiceCloneResponse> => {
  try {
    // Development mode: Simulate voice cloning without API calls
    if (DEV_MODE) {
      console.warn('⚠️ DEV MODE: Simulando clonación de voz sin llamar a la API');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
      const voiceId = `MAZK_DEV_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return {
        voiceId: voiceId,
        status: 'completed',
        message: 'Voz clonada exitosamente (modo desarrollo)',
        demoAudio: undefined,
      };
    }

    // Step 1: Upload the audio file
    const fileId = await uploadAudioFile(audioFile);
    console.log('File uploaded successfully, file_id:', fileId);

    // Step 2: Clone the voice
    // Generate a unique voice_id
    const voiceId = `MAZK_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const requestBody: any = {
      file_id: fileId,
      voice_id: voiceId,
    };

    // Add optional preview text and model
    // Note: According to Minimax docs, previews within this API are excluded from charges
    if (options?.previewText) {
      requestBody.text = options.previewText;
      requestBody.model = options.model || 'speech-2.6-hd';
    }

    const response = await fetch(`${MINIMAX_BASE_URL}/v1/voice_clone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { base_resp: { status_msg: errorText || 'Error desconocido' } };
      }
      
      // Handle specific error codes
      const statusCode = errorData.base_resp?.status_code;
      let errorMessage = errorData.base_resp?.status_msg || `Error ${response.status}: ${response.statusText}`;
      
      if (statusCode === 1008) {
        errorMessage = 'Saldo insuficiente en la cuenta de Minimax.\n\n' +
          'Para clonar voces realmente, necesitas:\n' +
          '1. Verificar tu cuenta en https://platform.minimax.io\n' +
          '2. Agregar saldo a tu cuenta (plan mínimo: $5/mes)\n' +
          '3. Asegurarte de tener permisos para clonación de voz\n\n' +
          'Nota: Aunque la clonación no debería cobrar inmediatamente según la documentación, ' +
          'la cuenta necesita tener saldo inicial o estar verificada.';
      } else if (statusCode === 2038) {
        errorMessage = 'No tienes permisos para clonar voces. Por favor verifica el estado de tu cuenta en https://platform.minimax.io';
      } else if (statusCode === 1004 || statusCode === 2049) {
        errorMessage = 'Error de autenticación. Por favor verifica que la API key sea correcta.';
      } else if (statusCode === 2013) {
        errorMessage = 'Parámetros inválidos. Por favor verifica el formato del audio (mp3, m4a, wav, mínimo 10 segundos, máximo 5 minutos, máximo 20MB).';
      }
      
      throw new Error(errorMessage);
    }

    const data: VoiceCloneApiResponse = await response.json();
    
    if (data.base_resp.status_code !== 0) {
      const statusCode = data.base_resp.status_code;
      let errorMessage = data.base_resp.status_msg || 'Error al clonar la voz';
      
      // Handle specific error codes
      if (statusCode === 1008) {
        errorMessage = 'Saldo insuficiente en la cuenta de Minimax.\n\n' +
          'Para clonar voces realmente, necesitas:\n' +
          '1. Verificar tu cuenta en https://platform.minimax.io\n' +
          '2. Agregar saldo a tu cuenta (plan mínimo: $5/mes)\n' +
          '3. Asegurarte de tener permisos para clonación de voz\n\n' +
          'Nota: Aunque la clonación no debería cobrar inmediatamente según la documentación, ' +
          'la cuenta necesita tener saldo inicial o estar verificada.';
      } else if (statusCode === 2038) {
        errorMessage = 'No tienes permisos para clonar voces. Por favor verifica el estado de tu cuenta en https://platform.minimax.io';
      } else if (statusCode === 2013) {
        errorMessage = 'Parámetros inválidos. Por favor verifica el formato del audio (mp3, m4a, wav, mínimo 10 segundos, máximo 5 minutos, máximo 20MB).';
      }
      
      throw new Error(errorMessage);
    }

    return {
      voiceId: voiceId,
      status: 'completed',
      message: data.base_resp.status_msg || 'Voz clonada exitosamente',
      demoAudio: data.demo_audio,
    };
  } catch (error) {
    console.error('Error cloning voice:', error);
    throw error;
  }
};

/**
 * Genera audio usando una voz clonada
 */
export const generateVoice = async (
  voiceId: string,
  text: string
): Promise<string> => {
  try {
    const response = await fetch(`${MINIMAX_BASE_URL}/tts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        voice_id: voiceId,
        text: text,
        format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Error desconocido' };
      }
      throw new Error(errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    return audioUrl;
  } catch (error) {
    console.error('Error generating voice:', error);
    throw error;
  }
};

/**
 * Verifica el estado de una voz clonada
 */
export const checkVoiceStatus = async (voiceId: string): Promise<VoiceCloneResponse> => {
  try {
    const response = await fetch(`${MINIMAX_BASE_URL}/voices/${voiceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      voiceId: data.voice_id || data.id || voiceId,
      status: data.status || 'processing',
      message: data.message,
    };
  } catch (error) {
    console.error('Error checking voice status:', error);
    throw error;
  }
};

