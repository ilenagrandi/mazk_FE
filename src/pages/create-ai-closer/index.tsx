import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Upload, X, Mic, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Icon from '../../components/AppIcon';
import AudioPlayer from '../../components/AudioPlayer';
import AudioRecorder from '../../components/AudioRecorder';
import { cloneVoice } from '../../services/elevenlabs';

const CreateAICloser = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  const [formData, setFormData] = useState({
    audioFile: null as File | null,
    audioPreview: null as string | null,
    audioBlob: null as Blob | null,
    cloneName: '',
    commonPhrases: '',
    personalityDescription: '',
    personalityTraits: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [audioDuration, setAudioDuration] = useState(0);
  const [traitInput, setTraitInput] = useState('');
  const [audioSource, setAudioSource] = useState<'upload' | 'record' | null>(null);
  const [isCloningVoice, setIsCloningVoice] = useState(false);
  const [voiceCloneId, setVoiceCloneId] = useState<string | null>(null);
  
  // Recommended minimum duration for better cloning quality
  const MIN_AUDIO_DURATION = 30; // 30 seconds for better quality (was 10)
  const RECOMMENDED_DURATION = 60; // 60 seconds recommended for best results

  const personalityTraitOptions = [
    'Empático',
    'Persuasivo',
    'Directo',
    'Amigable',
    'Profesional',
    'Enérgico',
    'Calmado',
    'Confiable',
    'Entusiasta',
    'Analítico',
    'Intuitivo',
    'Asertivo',
  ];

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setErrors({ ...errors, audioFile: 'Por favor selecciona un archivo de audio válido' });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Get audio duration
    const audio = new Audio(previewUrl);
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      setAudioDuration(duration);
      
      if (duration < MIN_AUDIO_DURATION) {
        setErrors({ ...errors, audioFile: `El audio debe tener al menos ${MIN_AUDIO_DURATION} segundos de duración` });
        return;
      }
      
      setErrors({ ...errors, audioFile: '' });
    });

    setFormData({
      ...formData,
      audioFile: file,
      audioPreview: previewUrl,
      audioBlob: null,
    });
    setAudioSource('upload');
  };

  const handleRecordingComplete = (audioBlob: Blob, audioUrl: string, duration: number) => {
    // Set duration immediately from recording time (most reliable)
    // This avoids delays and ensures the UI updates instantly
    if (duration > 0) {
      setAudioDuration(duration);
      
      // Validate duration immediately
        if (duration < MIN_AUDIO_DURATION) {
          setErrors(prev => ({ ...prev, audioFile: `El audio debe tener al menos ${MIN_AUDIO_DURATION} segundos de duración` }));
      } else {
        setErrors(prev => ({ ...prev, audioFile: '' }));
      }
    }

    // Update form data immediately
    setFormData({
      ...formData,
      audioFile: null,
      audioPreview: audioUrl,
      audioBlob: audioBlob,
    });
    setAudioSource('record');
    
    // Optionally try to get more accurate duration from audio element (non-blocking)
    // This is just for verification, the recording time is already set above
    const audio = new Audio(audioUrl);
    audio.addEventListener('loadedmetadata', () => {
      const audioDuration = audio.duration;
      if (isFinite(audioDuration) && !isNaN(audioDuration) && audioDuration > 0) {
        // Only update if significantly different (more than 1 second difference)
        // This helps if the recording time was slightly off
        if (Math.abs(audioDuration - duration) > 1) {
          setAudioDuration(audioDuration);
          if (audioDuration < MIN_AUDIO_DURATION) {
            setErrors(prev => ({ ...prev, audioFile: `El audio debe tener al menos ${MIN_AUDIO_DURATION} segundos de duración` }));
          } else {
            setErrors(prev => ({ ...prev, audioFile: '' }));
          }
        }
      }
    });
    audio.load();
  };

  const handleDeleteRecording = () => {
    if (formData.audioPreview) {
      URL.revokeObjectURL(formData.audioPreview);
    }
    setFormData({
      ...formData,
      audioFile: null,
      audioPreview: null,
      audioBlob: null,
    });
    setAudioDuration(0);
    setAudioSource(null);
  };

  const removeAudio = () => {
    if (formData.audioPreview) {
      URL.revokeObjectURL(formData.audioPreview);
    }
    setFormData({
      ...formData,
      audioFile: null,
      audioPreview: null,
      audioBlob: null,
    });
    setAudioDuration(0);
    setAudioSource(null);
  };

  const handleAddTrait = () => {
    if (traitInput.trim() && !formData.personalityTraits.includes(traitInput.trim())) {
      setFormData({
        ...formData,
        personalityTraits: [...formData.personalityTraits, traitInput.trim()],
      });
      setTraitInput('');
    }
  };

  const handleRemoveTrait = (trait: string) => {
    setFormData({
      ...formData,
      personalityTraits: formData.personalityTraits.filter(t => t !== trait),
    });
  };

  const handleSelectTrait = (trait: string) => {
    if (!formData.personalityTraits.includes(trait)) {
      setFormData({
        ...formData,
        personalityTraits: [...formData.personalityTraits, trait],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};

    if (!formData.audioPreview) {
      newErrors.audioFile = 'Por favor sube un archivo de audio o graba uno';
    } else if (audioDuration > 0 && audioDuration < MIN_AUDIO_DURATION) {
      // Only show error if duration is known and less than minimum
      // If duration is 0, it might still be loading, so don't show error yet
      newErrors.audioFile = `El audio debe tener al menos ${MIN_AUDIO_DURATION} segundos. Para mejor calidad, se recomienda ${RECOMMENDED_DURATION}+ segundos.`;
    } else if (audioDuration > 0 && audioDuration < RECOMMENDED_DURATION) {
      // Show warning (not error) if between minimum and recommended
      console.warn(`Audio duration (${audioDuration}s) is below recommended (${RECOMMENDED_DURATION}s). Quality may be affected.`);
    }

    if (!formData.cloneName.trim()) {
      newErrors.cloneName = 'Por favor ingresa un nombre para el clon';
    }

    if (!formData.commonPhrases.trim()) {
      newErrors.commonPhrases = 'Por favor ingresa frases comunes';
    }

    if (!formData.personalityDescription.trim()) {
      newErrors.personalityDescription = 'Por favor ingresa una descripción de la personalidad';
    }

    if (formData.personalityTraits.length === 0) {
      newErrors.personalityTraits = 'Por favor agrega al menos un trait de personalidad';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clone voice with Minimax before navigating
    setIsCloningVoice(true);
    setErrors({});

    try {
      const audioToClone = formData.audioBlob || formData.audioFile;
      if (!audioToClone) {
        throw new Error('No hay audio para clonar');
      }

      // Clone voice with ElevenLabs
      // Include personality description and traits in labels for better context
      const cloneName = formData.cloneName.trim() || 'Tu Gemelo Digital';
      const cloneResult = await cloneVoice(audioToClone, {
        name: cloneName,
        description: `Voz clonada: ${formData.personalityDescription.substring(0, 100)}`,
        labels: {
          personality: formData.personalityTraits.join(', '),
          common_phrases: formData.commonPhrases.substring(0, 200),
          audio_duration: `${Math.floor(audioDuration)}s`,
        },
      });
      setVoiceCloneId(cloneResult.voiceId);

      // Navigate to preview page with form data and voice clone ID
      navigate('/clone-preview', {
        state: {
          name: cloneName,
          audioPreview: formData.audioPreview,
          commonPhrases: formData.commonPhrases,
          personalityDescription: formData.personalityDescription,
          personalityTraits: formData.personalityTraits,
          voiceCloneId: cloneResult.voiceId,
        }
      });
    } catch (error) {
      console.error('Error cloning voice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al clonar la voz. Por favor intenta de nuevo.';
      
      setErrors({
        audioFile: errorMessage,
      });
    } finally {
      setIsCloningVoice(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Clona tu Vendedor - MAZK</title>
        <meta name="description" content="Configura tu gemelo digital con tu voz y personalidad" />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              iconName="ArrowLeft"
              iconPosition="left"
              onClick={() => navigate('/')}
              className="mb-6 text-gray-400 hover:text-white"
            >
              Volver
            </Button>
            
            <div className="mb-2">
              <div className="text-sm text-cyan-400 mb-2 uppercase tracking-wider">Paso 1 de 3</div>
              <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
                Clona tu vendedor
              </h1>
              <p className="text-lg text-gray-400 font-light">
                Necesitamos algunos datos para crear tu gemelo digital de ventas
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Audio Upload/Record */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Audio de voz (mínimo {MIN_AUDIO_DURATION} segundos) <span className="text-destructive">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Sube un archivo de audio o grábate directamente. 
                  <span className="text-cyan-400"> Mínimo {MIN_AUDIO_DURATION} segundos</span> (recomendado {RECOMMENDED_DURATION}+ segundos para mejor calidad).
                </p>
                <div className="bg-cyan-400/10 border border-cyan-400/30 rounded-lg p-3 mb-4">
                  <p className="text-xs text-cyan-300 font-medium mb-1">💡 Consejos para mejor calidad:</p>
                  <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                    <li>Audio claro, sin ruido de fondo</li>
                    <li>Habla de forma natural y variada</li>
                    <li>Incluye diferentes entonaciones y emociones</li>
                    <li>Más tiempo = mejor clonación (ideal {RECOMMENDED_DURATION}+ segundos)</li>
                  </ul>
                </div>
              </div>

              {!formData.audioPreview ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Upload Option */}
                  <div className="border-2 border-dashed border-zinc-800 rounded-lg p-8 text-center hover:border-cyan-400/50 transition-colors bg-zinc-950">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label
                      htmlFor="audio-upload"
                      className="cursor-pointer flex flex-col items-center space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center">
                        <Icon name="Upload" size={32} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium mb-1">Subir archivo</p>
                        <p className="text-sm text-gray-500">Haz clic para seleccionar</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        iconName="Upload"
                        className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
                      >
                        Seleccionar archivo
                      </Button>
                    </label>
                  </div>

                  {/* Record Option */}
                  <div className="border-2 border-dashed border-zinc-800 rounded-lg p-8 text-center hover:border-cyan-400/50 transition-colors bg-zinc-950">
                    <AudioRecorder
                      onRecordingComplete={handleRecordingComplete}
                      onDelete={handleDeleteRecording}
                      minDuration={MIN_AUDIO_DURATION}
                    />
                  </div>
                </div>
              ) : (
                <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-950">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center">
                        <Icon name="Music" size={24} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {audioSource === 'record' ? 'Grabación' : formData.audioFile?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {audioDuration > 0 ? `${Math.floor(audioDuration)} segundos` : 'Cargando duración...'}
                          {audioDuration >= RECOMMENDED_DURATION ? (
                            <span className="text-cyan-400 ml-2">✓ Óptimo</span>
                          ) : audioDuration >= MIN_AUDIO_DURATION ? (
                            <span className="text-yellow-400 ml-2">✓ Válido (recomendado {RECOMMENDED_DURATION}+s)</span>
                          ) : audioDuration > 0 ? (
                            <span className="text-red-400 ml-2">✗ Mínimo {MIN_AUDIO_DURATION}s</span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeAudio}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  {formData.audioPreview && (
                    <AudioPlayer src={formData.audioPreview} />
                  )}
                </div>
              )}
              {errors.audioFile && (
                <p className="text-sm text-destructive">{errors.audioFile}</p>
              )}
            </div>

            {/* Clone Name */}
            <Input
              label="Nombre del clon"
              description="Asigna un nombre a tu gemelo digital de ventas"
              required
              value={formData.cloneName}
              onChange={(e) => setFormData({ ...formData, cloneName: e.target.value })}
              error={errors.cloneName}
              placeholder="Ejemplo: Juan el Vendedor, María Closer, etc."
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-gray-600"
            />

            {/* Common Phrases */}
            <Textarea
              label="Frases o expresiones comunes"
              description="Escribe frases, expresiones o formas de hablar características de esta persona"
              required
              value={formData.commonPhrases}
              onChange={(e) => setFormData({ ...formData, commonPhrases: e.target.value })}
              error={errors.commonPhrases}
              rows={4}
              placeholder="Ejemplo: 'Como te decía...', 'La verdad es que...', 'Mira, lo importante es...'"
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-gray-600"
            />

            {/* Personality Description */}
            <Textarea
              label="Descripción de la personalidad"
              description="Describe cómo es esta persona: su estilo de comunicación, forma de expresarse, etc."
              required
              value={formData.personalityDescription}
              onChange={(e) => setFormData({ ...formData, personalityDescription: e.target.value })}
              error={errors.personalityDescription}
              rows={5}
              placeholder="Ejemplo: Es una persona muy directa y clara en sus explicaciones. Habla con confianza y siempre busca conectar con el cliente de forma empática..."
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-gray-600"
            />

            {/* Personality Traits */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Traits de personalidad <span className="text-destructive">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Selecciona o agrega traits que caracterizan a esta persona
                </p>
              </div>

              {/* Quick select options */}
              <div className="flex flex-wrap gap-2 mb-4">
                {personalityTraitOptions.map((trait) => (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => handleSelectTrait(trait)}
                    disabled={formData.personalityTraits.includes(trait)}
                    className={`
                      px-4 py-2 rounded-md text-sm border transition-colors
                      ${formData.personalityTraits.includes(trait)
                        ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400 cursor-not-allowed'
                        : 'bg-zinc-950 border-zinc-800 text-gray-400 hover:border-cyan-400/50 hover:text-white'
                      }
                    `}
                  >
                    {trait}
                  </button>
                ))}
              </div>

              {/* Custom trait input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar trait personalizado..."
                  value={traitInput}
                  onChange={(e) => setTraitInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTrait();
                    }
                  }}
                  className="bg-zinc-950 border-zinc-800 text-white placeholder:text-gray-600"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTrait}
                  className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
                >
                  Agregar
                </Button>
              </div>

              {/* Selected traits */}
              {formData.personalityTraits.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {formData.personalityTraits.map((trait) => (
                    <div
                      key={trait}
                      className="flex items-center gap-2 px-3 py-1.5 bg-cyan-400/20 border border-cyan-400 rounded-md text-cyan-400"
                    >
                      <span className="text-sm">{trait}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTrait(trait)}
                        className="hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.personalityTraits && (
                <p className="text-sm text-destructive">{errors.personalityTraits}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="border-zinc-700 text-gray-400 hover:border-zinc-600"
                disabled={isCloningVoice}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="default"
                iconName={isCloningVoice ? undefined : "ArrowRight"}
                iconPosition="right"
                className="bg-cyan-400 text-black hover:bg-cyan-500 disabled:opacity-50"
                disabled={isCloningVoice}
              >
                {isCloningVoice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Clonando voz...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateAICloser;

