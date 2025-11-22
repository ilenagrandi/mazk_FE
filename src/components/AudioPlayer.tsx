import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../utils/cn';

interface AudioPlayerProps {
    src: string;
    className?: string;
    showControls?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, className, showControls = true }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !src) return;

        // Reset state when src changes
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);

        const updateTime = () => {
            if (isFinite(audio.currentTime) && !isNaN(audio.currentTime)) {
                setCurrentTime(audio.currentTime);
            }
        };
        
        const updateDuration = () => {
            const dur = audio.duration;
            if (isFinite(dur) && !isNaN(dur) && dur > 0) {
                setDuration(dur);
            }
        };
        
        const handleCanPlay = () => {
            // Force duration update when audio can play
            updateDuration();
        };
        
        const handleLoadedData = () => {
            updateDuration();
        };
        
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('durationchange', updateDuration);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('loadeddata', handleLoadedData);
        audio.addEventListener('ended', handleEnded);

        // Force load the audio
        audio.load();

        // Try to get duration after a short delay to ensure metadata is loaded
        const timeoutId = setTimeout(() => {
            if (audio.readyState >= 1) {
                updateDuration();
            }
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('durationchange', updateDuration);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('loadeddata', handleLoadedData);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [src]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newVolume = parseFloat(e.target.value);
        audio.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isMuted) {
            audio.volume = volume || 0.5;
            setIsMuted(false);
        } else {
            audio.volume = 0;
            setIsMuted(true);
        }
    };

    const formatTime = (time: number) => {
        if (!isFinite(time) || isNaN(time) || time < 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!src) {
        return (
            <div className={cn("flex items-center gap-3 text-gray-500", className)}>
                <p className="text-sm">Audio no disponible</p>
            </div>
        );
    }

    return (
        <div className={cn("w-full", className)}>
            <audio ref={audioRef} src={src} preload="auto" />
            
            <div className="w-full space-y-3">
                {/* Play button and progress bar */}
                <div className="flex items-center gap-3 w-full">
                    <button
                        onClick={togglePlay}
                        className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/50 text-cyan-400 transition-colors"
                    >
                        {isPlaying ? (
                            <Pause className="w-5 h-5" />
                        ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                        )}
                    </button>

                    {showControls && (
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                            <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">
                                {formatTime(currentTime)}
                            </span>
                            <input
                                type="range"
                                min="0"
                                max={duration > 0 ? duration : 100}
                                value={duration > 0 ? currentTime : 0}
                                onChange={handleSeek}
                                step="0.1"
                                className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 min-w-0"
                            />
                            <span className="text-xs text-gray-400 w-10 flex-shrink-0">
                                {formatTime(duration)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Volume control - below progress bar */}
                {showControls && (
                    <div className="flex items-center gap-2 justify-end pl-13">
                        <button
                            onClick={toggleMute}
                            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            {isMuted ? (
                                <VolumeX className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-32 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudioPlayer;

