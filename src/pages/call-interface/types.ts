export interface CallSession {
  id: string;
  leadId: string;
  status: 'waiting' | 'active' | 'paused' | 'ended';
  startTime: Date | null;
  endTime: Date | null;
  duration: number;
}

export interface AICloserState {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  currentEmotion: 'neutral' | 'happy' | 'concerned' | 'excited';
  brightness: number;
}

export interface LeadVideoState {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isFullscreen: boolean;
  audioLevel: number;
  videoQuality: 'low' | 'medium' | 'high';
}

export interface TranscriptEntry {
  id: string;
  speaker: 'ai' | 'lead';
  text: string;
  timestamp: Date;
  confidence?: number;
}

export interface CallControls {
  canPause: boolean;
  canExit: boolean;
  canRequestHelp: boolean;
  emergencyExitAvailable: boolean;
}

export interface DeviceCapabilities {
  hasCamera: boolean;
  hasMicrophone: boolean;
  cameraPermission: 'granted' | 'denied' | 'prompt';
  microphonePermission: 'granted' | 'denied' | 'prompt';
  browserSupported: boolean;
}

