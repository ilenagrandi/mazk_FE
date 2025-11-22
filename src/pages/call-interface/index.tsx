import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import AICloserOrb from './components/AICloserOrb';
import LeadVideoTile from './components/LeadVideoTile';
import TranscriptBar from './components/TranscriptBar';
import InterviewControls from './components/InterviewControls';
import DeviceStatusIndicator from './components/DeviceStatusIndicator';
import LiveKitModal from './components/LiveKitModal';
import TranscriptFloatingPanel from './components/TranscriptFloatingPanel';
import { getCallStatus, TranscriptEntry as MetatronTranscriptEntry } from '../../services/metatron';
import {
  CallSession,
  AICloserState,
  LeadVideoState,
  TranscriptEntry,
  CallControls,
  DeviceCapabilities,
} from './types';

const CallInterface = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    cloneData, 
    lead, 
    callId, 
    roomName 
  } = (location.state as { 
    cloneData?: any; 
    lead?: any; 
    callId?: string;
    roomName?: string;
  }) || {};

  // Core Call State
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showLiveKitModal, setShowLiveKitModal] = useState(false);
  const [liveKitRoom, setLiveKitRoom] = useState<{ room_name: string; token: string; url: string } | null>(null);

  // AI Closer State
  const [aiState, setAiState] = useState<AICloserState>({
    isListening: false,
    isSpeaking: false,
    isThinking: false,
    currentEmotion: 'neutral',
    brightness: 0.8
  });

  // Lead Video State
  const [videoState, setLeadVideoState] = useState<LeadVideoState>({
    isVideoEnabled: true,
    isAudioEnabled: true,
    isFullscreen: false,
    audioLevel: 0,
    videoQuality: 'high'
  });

  // Transcript State
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(true);
  
  // Real-time transcript from Metatron
  const [metatronTranscript, setMetatronTranscript] = useState<MetatronTranscriptEntry[]>([]);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(true);
  const transcriptPollingRef = useRef<number | null>(null);

  // Device Capabilities
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>({
    hasCamera: true,
    hasMicrophone: true,
    cameraPermission: 'prompt',
    microphonePermission: 'prompt',
    browserSupported: true
  });

  // Call Controls
  const [callControls] = useState<CallControls>({
    canPause: true,
    canExit: true,
    canRequestHelp: true,
    emergencyExitAvailable: true
  });

  // Create LiveKit Room (defined first to avoid hoisting issues)
  const createLiveKitRoom = useCallback(async () => {
    try {
      // Call Metatron API to create room
      // Try both ports: 8000 (docker-compose) and 5885 (local dev)
      // In Vite, use import.meta.env instead of process.env
      const apiUrls = [
        import.meta.env.VITE_METATRON_API_URL || 'http://localhost:8000',
        'http://localhost:5885'
      ];
      
      let response: Response | null = null;
      let lastError: Error | null = null;
      
      for (const apiUrl of apiUrls) {
        try {
          response = await fetch(`${apiUrl}/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participant_name: lead?.firstName || 'Lead',
              room_name: `mazk-call-${Date.now()}`,
              metadata: {
                lead_id: lead?.id,
                voice_id: cloneData?.voiceCloneId,
              }
            })
          });
          
          if (response.ok) {
            break; // Success, exit loop
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
      
      if (!response || !response.ok) {
        throw lastError || new Error('No se pudo conectar al servidor de Metatron. Verifica que esté corriendo en el puerto 8000 o 5885.');
      }
      
      const roomData = await response.json();
      setLiveKitRoom(roomData);
      setShowLiveKitModal(true);
      setIsCallActive(true);
      setCallSession(prev => prev ? { ...prev, status: 'active', startTime: new Date() } : null);
    } catch (error) {
      console.error('Error creating LiveKit room:', error);
      alert('Error al crear la sala de LiveKit. Por favor intenta de nuevo.');
    }
  }, [lead, cloneData]);

  // Initialize Call Session
  useEffect(() => {
    const initializeSession = () => {
      const session: CallSession = {
        id: `call_${Date.now()}`,
        leadId: lead?.id || 'lead_123',
        status: 'waiting',
        startTime: null,
        endTime: null,
        duration: 0,
      };
      setCallSession(session);
    };

    initializeSession();
  }, [lead]);

  // Poll for transcript updates if we have a callId
  useEffect(() => {
    if (!callId || !isCallActive) return;

    const pollTranscript = async () => {
      try {
        const status = await getCallStatus(callId);
        if (status.transcript && status.transcript.length > 0) {
          setMetatronTranscript(status.transcript);
        }
      } catch (error) {
        console.error('Error fetching transcript:', error);
      }
    };

    // Poll every 2 seconds
    transcriptPollingRef.current = window.setInterval(pollTranscript, 2000);
    
    // Initial poll
    pollTranscript();

    return () => {
      if (transcriptPollingRef.current) {
        clearInterval(transcriptPollingRef.current);
      }
    };
  }, [callId, isCallActive]);

  // Auto-start call when component mounts (only if we don't have callId from outbound call)
  useEffect(() => {
    if (callId) {
      // We already have a call initiated, just set it as active
      setIsCallActive(true);
      setCallSession(prev => prev ? { ...prev, status: 'active', startTime: new Date() } : null);
    } else if (callSession && cloneData?.voiceCloneId && !liveKitRoom) {
      // Automatically create LiveKit room and start call (for manual calls)
      createLiveKitRoom();
    }
  }, [callSession, cloneData, createLiveKitRoom, liveKitRoom, callId]);

  // Check Device Capabilities
  useEffect(() => {
    const checkDeviceCapabilities = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        const hasMicrophone = devices.some(device => device.kind === 'audioinput');

        // Check permissions
        try {
          const permissions = await Promise.all([
            navigator.permissions.query({ name: 'camera' as PermissionName }).catch(() => ({ state: 'prompt' })),
            navigator.permissions.query({ name: 'microphone' as PermissionName }).catch(() => ({ state: 'prompt' }))
          ]);

          setDeviceCapabilities({
            hasCamera,
            hasMicrophone,
            cameraPermission: permissions[0].state as 'granted' | 'denied' | 'prompt',
            microphonePermission: permissions[1].state as 'granted' | 'denied' | 'prompt',
            browserSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
          });
        } catch {
          setDeviceCapabilities({
            hasCamera,
            hasMicrophone,
            cameraPermission: 'prompt',
            microphonePermission: 'prompt',
            browserSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
          });
        }
      } catch (error) {
        console.error('Error checking device capabilities:', error);
        setDeviceCapabilities(prev => ({ ...prev, browserSupported: false }));
      }
    };

    checkDeviceCapabilities();
  }, []);

  const handleRequestPermissions = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Re-check capabilities after permission grant
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDeviceCapabilities(prev => ({
        ...prev,
        hasCamera: devices.some(d => d.kind === 'videoinput'),
        hasMicrophone: devices.some(d => d.kind === 'audioinput'),
        cameraPermission: 'granted',
        microphonePermission: 'granted'
      }));
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  }, []);

  const handleToggleVideo = useCallback(() => {
    setLeadVideoState(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
  }, []);

  const handleToggleAudio = useCallback(() => {
    setLeadVideoState(prev => ({ ...prev, isAudioEnabled: !prev.isAudioEnabled }));
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    setLeadVideoState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, []);

  const handleStartPause = useCallback(() => {
    // Only pause/resume functionality, no start button needed
    setIsPaused(prev => !prev);
  }, []);

  const handleRequestHelp = useCallback(() => {
    // TODO: Implement help functionality
    console.log('Help requested');
  }, []);

  const handleEmergencyExit = useCallback(() => {
    setIsCallActive(false);
    setIsPaused(false);
    setCallSession(prev => prev ? { ...prev, status: 'ended', endTime: new Date() } : null);
    navigate('/leads-management', { state: { cloneData, leads: [lead] } });
  }, [navigate, cloneData, lead]);

  if (!callSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-cyan-400 rounded-full mx-auto mb-4 animate-pulse" />
          <p className="text-lg">Inicializando sesión de llamada...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Llamada con Lead - MAZK</title>
        <meta name="description" content="Interfaz de llamada con lead usando tu gemelo digital" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black overflow-hidden relative">
        {/* Device Status Indicator */}
        <DeviceStatusIndicator
          capabilities={deviceCapabilities}
          onRequestPermissions={handleRequestPermissions}
        />

        {/* Transcript Bar */}
        <TranscriptBar
          entries={transcriptEntries}
          isVisible={isTranscriptVisible}
          onToggleVisibility={() => setIsTranscriptVisible(!isTranscriptVisible)}
        />

        {/* Main Call Area */}
        <div className="flex items-center justify-center min-h-screen p-4">
          {/* AI Closer Orb */}
          <AICloserOrb
            state={aiState}
            className="z-10"
          />
        </div>

        {/* Lead Video Tile */}
        <LeadVideoTile
          videoState={videoState}
          onToggleVideo={handleToggleVideo}
          onToggleAudio={handleToggleAudio}
          onToggleFullscreen={handleToggleFullscreen}
          className={`fixed ${videoState.isFullscreen ? '' : 'bottom-6 right-6'} z-30`}
        />

        {/* Call Controls */}
        <InterviewControls
          controls={callControls}
          isInterviewActive={isCallActive}
          isPaused={isPaused}
          onStartPause={handleStartPause}
          onRequestHelp={handleRequestHelp}
          onEmergencyExit={handleEmergencyExit}
        />

        {/* LiveKit Modal */}
        {showLiveKitModal && liveKitRoom && (
          <LiveKitModal
            roomName={liveKitRoom.room_name}
            token={liveKitRoom.token}
            url={liveKitRoom.url}
            onClose={() => setShowLiveKitModal(false)}
          />
        )}

        {/* Transcript Floating Panel */}
        {callId && (
          <TranscriptFloatingPanel
            entries={metatronTranscript}
            isVisible={showTranscriptPanel}
            onClose={() => setShowTranscriptPanel(false)}
          />
        )}

        {/* Call Completion Overlay */}
        {callSession.status === 'ended' && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center text-white max-w-md mx-4">
              <div className="w-20 h-20 bg-cyan-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Llamada Finalizada</h2>
              <p className="text-white/80 mb-6">
                La llamada ha sido completada. Redirigiendo a la gestión de leads...
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CallInterface;

