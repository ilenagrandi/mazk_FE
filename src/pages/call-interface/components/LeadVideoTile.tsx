import React, { useRef, useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { LeadVideoState } from '../types';

interface LeadVideoTileProps {
  videoState: LeadVideoState;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleFullscreen: () => void;
  className?: string;
}

const LeadVideoTile = ({ 
  videoState, 
  onToggleVideo, 
  onToggleAudio, 
  onToggleFullscreen,
  className = '' 
}: LeadVideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const initializeVideo = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoState.isVideoEnabled,
          audio: videoState.isAudioEnabled
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    if (videoState.isVideoEnabled || videoState.isAudioEnabled) {
      initializeVideo();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoState.isVideoEnabled, videoState.isAudioEnabled]);

  const getAudioLevelBars = () => {
    const bars = 5;
    const activeBars = Math.ceil((videoState.audioLevel / 100) * bars);
    
    return (
      <div className="flex items-end space-x-0.5 h-4">
        {[...Array(bars)].map((_, index) => (
          <div
            key={index}
            className={`w-1 rounded-sm transition-all duration-150 ${
              index < activeBars 
                ? 'bg-cyan-400' : 'bg-white/20'
            }`}
            style={{ height: `${((index + 1) / bars) * 100}%` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div 
      className={`bg-zinc-900 border-2 border-cyan-400/30 rounded-lg overflow-hidden transition-all duration-300 ${className} ${
        videoState.isFullscreen ? 'fixed inset-4 z-50' : 'w-64 h-48'
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <div className="relative w-full h-full bg-black">
        {videoState.isVideoEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={!videoState.isAudioEnabled}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-950">
            <Icon name="VideoOff" size={32} className="text-gray-600" />
          </div>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleVideo}
              className="bg-black/50 hover:bg-black/70 text-white border-cyan-400/50"
            >
              <Icon name={videoState.isVideoEnabled ? "Video" : "VideoOff"} size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleAudio}
              className="bg-black/50 hover:bg-black/70 text-white border-cyan-400/50"
            >
              <Icon name={videoState.isAudioEnabled ? "Mic" : "MicOff"} size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              className="bg-black/50 hover:bg-black/70 text-white border-cyan-400/50"
            >
              <Icon name={videoState.isFullscreen ? "Minimize2" : "Maximize2"} size={20} />
            </Button>
          </div>
        )}

        {/* Audio Level Indicator */}
        {videoState.isAudioEnabled && (
          <div className="absolute bottom-2 left-2">
            {getAudioLevelBars()}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              videoState.isVideoEnabled ? 'bg-cyan-400' : 'bg-gray-500'
            }`} />
            <span className="text-xs text-white">
              {videoState.isVideoEnabled ? 'Video' : 'Audio'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadVideoTile;

