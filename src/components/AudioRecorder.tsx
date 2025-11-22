import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Check } from 'lucide-react';
import { cn } from '../utils/cn';
import Button from './ui/Button';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, audioUrl: string, duration: number) => void;
  onDelete?: () => void;
  className?: string;
  minDuration?: number; // in seconds
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onDelete,
  className,
  minDuration = 10,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio);
      }
    };
  }, [recordedAudio]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      // Check if MediaRecorder is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta la grabación de audio. Por favor, usa un navegador moderno como Chrome, Firefox o Edge.');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      // Determine the best MIME type for the browser
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      // Create MediaRecorder with options
      const options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options.mimeType = mimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle errors from MediaRecorder
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Error durante la grabación. Por favor, intenta de nuevo.');
        stopRecording();
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Capture the current recording time immediately
        const capturedTime = recordingTime;
        console.log('MediaRecorder stopped, captured time:', capturedTime);
        
        // Wait a bit to ensure all data is collected
        setTimeout(() => {
          if (audioChunksRef.current.length === 0) {
            console.error('No audio data recorded');
            alert('No se grabó ningún audio. Por favor, intenta de nuevo.');
            stream.getTracks().forEach(track => track.stop());
            return;
          }

          // Determine blob type based on MIME type used
          const blobType = mimeType.includes('webm') ? 'audio/webm' : 
                          mimeType.includes('mp4') ? 'audio/mp4' : 
                          mimeType.includes('ogg') ? 'audio/ogg' : 'audio/webm';

          const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
          console.log('Audio blob created:', {
            size: audioBlob.size,
            type: audioBlob.type,
            chunks: audioChunksRef.current.length,
            capturedTime: capturedTime
          });

          if (audioBlob.size === 0) {
            console.error('Audio blob is empty');
            alert('No se grabó ningún audio. Por favor, intenta de nuevo.');
            stream.getTracks().forEach(track => track.stop());
            return;
          }

          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudio(audioUrl);
          
          // Always use captured recording time as initial duration
          // This ensures the duration is set immediately
          setAudioDuration(capturedTime);
          console.log('Set initial duration from captured time:', capturedTime);
          
          // Get audio duration from the actual audio file
          const audio = new Audio(audioUrl);
          
          // Multiple attempts to get duration
          const tryGetDuration = () => {
            const duration = audio.duration;
            console.log('Audio duration check:', {
              duration,
              isFinite: isFinite(duration),
              isNaN: isNaN(duration),
              readyState: audio.readyState,
              capturedTime
            });
            
            if (isFinite(duration) && !isNaN(duration) && duration > 0) {
              setAudioDuration(duration);
              console.log('Duration set to:', duration);
            } else if (capturedTime > 0) {
              // Use captured recording time as fallback
              setAudioDuration(capturedTime);
              console.log('Using captured time as duration:', capturedTime);
            }
          };

          audio.addEventListener('loadedmetadata', tryGetDuration);
          audio.addEventListener('durationchange', tryGetDuration);
          audio.addEventListener('canplay', tryGetDuration);
          audio.addEventListener('loadeddata', tryGetDuration);
          
          // Try to load the audio immediately
          audio.load();
          
          // Also try after a short delay
          setTimeout(() => {
            tryGetDuration();
          }, 100);
          
          // Final fallback after longer delay - use capturedTime
          setTimeout(() => {
            setAudioDuration(prev => {
              if (prev === 0 && capturedTime > 0) {
                console.log('Final fallback: using captured time', capturedTime);
                return capturedTime;
              }
              return prev;
            });
          }, 500);
          
          audio.addEventListener('error', (e) => {
            console.error('Audio playback error:', e);
            // If audio fails to load, use captured time
            if (capturedTime > 0) {
              setAudioDuration(capturedTime);
            }
          });

          // Call onRecordingComplete with the captured time as duration
          // The duration will be updated later if the audio loads successfully
          onRecordingComplete(audioBlob, audioUrl, capturedTime);
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        }, 100);
      };

      // Start recording with timeslice to ensure data is available
      // Use a smaller timeslice to ensure data is captured more frequently
      mediaRecorder.start(250); // Collect data every 250ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      let errorMessage = 'No se pudo acceder al micrófono.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en la configuración de tu navegador.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'No se encontró ningún micrófono. Por favor, conecta un micrófono e intenta de nuevo.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'El micrófono está siendo usado por otra aplicación. Por favor, cierra otras aplicaciones que usen el micrófono.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Capture the current recording time before stopping
      const finalTime = recordingTime;
      console.log('Stopping recording, current time:', finalTime);
      
      // Stop the timer first to capture the final time
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop the media recorder
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Ensure we have the final time set
      if (finalTime > 0) {
        setAudioDuration(finalTime);
        console.log('Set initial duration to:', finalTime);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const playRecording = () => {
    if (audioRef.current && recordedAudio) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDelete = () => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
      setRecordedAudio(null);
      setRecordingTime(0);
      setAudioDuration(0);
      setIsPlaying(false);
      onDelete?.();
    }
  };

  const isValidDuration = audioDuration >= minDuration;

  return (
    <div className={cn("w-full", className)}>
      {!recordedAudio ? (
        <div className="w-full">
          {!isRecording ? (
            <div className="space-y-4 w-full">
              <div className="w-16 h-16 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center mx-auto">
                <Mic className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">Grabar audio directamente</p>
                <p className="text-sm text-gray-500">
                  Haz clic en el botón para comenzar a grabar. Mínimo {minDuration} segundos.
                </p>
              </div>
              <Button
                type="button"
                onClick={startRecording}
                variant="outline"
                iconName="Mic"
                className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
              >
                Comenzar grabación
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto animate-pulse">
                <div className="w-12 h-12 rounded-full bg-red-500"></div>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Grabando...</p>
                <p className="text-2xl font-light text-cyan-400">{formatTime(recordingTime)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {recordingTime < minDuration
                    ? `Mínimo ${minDuration}s (faltan ${minDuration - recordingTime}s)`
                    : '✓ Duración válida'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                {isPaused ? (
                  <Button
                    type="button"
                    onClick={resumeRecording}
                    variant="outline"
                    iconName="Play"
                    className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
                  >
                    Continuar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={pauseRecording}
                    variant="outline"
                    iconName="Pause"
                    className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
                  >
                    Pausar
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={stopRecording}
                  variant="outline"
                  iconName="Square"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Detener
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center">
                <Check className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium">Grabación completada</p>
                <p className="text-sm text-gray-500">
                  {formatTime(audioDuration)} segundos
                  {isValidDuration ? (
                    <span className="text-cyan-400 ml-2">✓ Válido</span>
                  ) : (
                    <span className="text-red-400 ml-2">✗ Mínimo {minDuration}s</span>
                  )}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-gray-400 hover:text-white"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>

          <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
            <div className="flex items-center gap-3">
              <button
                onClick={playRecording}
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/50 text-cyan-400 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Previsualización</p>
                <p className="text-sm text-gray-400">
                  {isPlaying ? 'Reproduciendo...' : 'Haz clic para escuchar'}
                </p>
              </div>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={recordedAudio}
            preload="auto"
            onEnded={() => setIsPlaying(false)}
            onLoadedMetadata={(e) => {
              const target = e.target as HTMLAudioElement;
              const dur = target.duration;
              if (isFinite(dur) && !isNaN(dur) && dur > 0) {
                setAudioDuration(dur);
              }
            }}
            onDurationChange={(e) => {
              const target = e.target as HTMLAudioElement;
              const dur = target.duration;
              if (isFinite(dur) && !isNaN(dur) && dur > 0) {
                setAudioDuration(dur);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;

