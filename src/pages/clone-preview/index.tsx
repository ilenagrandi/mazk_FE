import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Play, Pause, Settings, ArrowRight, Check, Loader2, Volume2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import AudioPlayer from '../../components/AudioPlayer';
import Textarea from '../../components/ui/Textarea';
import { generateVoice } from '../../services/elevenlabs';

interface CloneData {
  name?: string;
  audioPreview?: string;
  commonPhrases?: string;
  personalityDescription?: string;
  personalityTraits?: string[];
  voiceCloneId?: string;
}

const ClonePreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cloneData = (location.state as CloneData) || {};

  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoAudioUrl, setDemoAudioUrl] = useState<string | null>(null);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>('');
  const [hasGeneratedInitialDemo, setHasGeneratedInitialDemo] = useState(false);
  
  // Create initial demo text from user inputs
  // Priority: commonPhrases > personalityDescription > default text
  const initialDemoText = (() => {
    if (cloneData.commonPhrases && cloneData.commonPhrases.trim()) {
      // Use common phrases, taking first 300 characters to ensure good quality
      const phrases = cloneData.commonPhrases.trim();
      return phrases.length > 300 ? phrases.substring(0, 300) + '...' : phrases;
    } else if (cloneData.personalityDescription && cloneData.personalityDescription.trim()) {
      // Fallback to personality description if no phrases provided
      const desc = cloneData.personalityDescription.trim();
      return desc.length > 300 ? desc.substring(0, 300) + '...' : desc;
    } else {
      // Default demo text for sales
      return 'Hola, entiendo que estás buscando una solución que realmente transforme tu negocio. Déjame contarte cómo podemos ayudarte a alcanzar tus objetivos.';
    }
  })();

  // Set initial custom text
  useEffect(() => {
    if (!customText && initialDemoText) {
      setCustomText(initialDemoText);
    }
  }, [initialDemoText]);

  // Generate demo audio function
  const generateDemoAudio = async (text: string) => {
    if (!cloneData.voiceCloneId || !text.trim()) {
      setDemoError('Por favor ingresa un texto para generar el audio');
      return;
    }

    setIsGeneratingDemo(true);
    setDemoError(null);
    setDemoAudioUrl(null); // Clear previous audio
    
    try {
      // Generate audio using the cloned voice
      const audioUrl = await generateVoice(
        cloneData.voiceCloneId,
        text.trim(),
        {
          model: 'eleven_multilingual_v2',
          stability: 0.5,
          similarity_boost: 0.75,
        }
      );
      
      setDemoAudioUrl(audioUrl);
      setHasGeneratedInitialDemo(true);
    } catch (error) {
      console.error('Error generating demo audio:', error);
      setDemoError(error instanceof Error ? error.message : 'Error al generar el audio de demo');
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  // Generate initial demo audio when component mounts
  useEffect(() => {
    if (cloneData.voiceCloneId && !hasGeneratedInitialDemo && initialDemoText) {
      generateDemoAudio(initialDemoText);
    }
  }, [cloneData.voiceCloneId]);

  const handleGenerateAudio = () => {
    if (customText.trim()) {
      generateDemoAudio(customText);
    }
  };

  const handleAdjust = () => {
    // Navigate back to create-ai-closer with the data
    navigate('/create-ai-closer', { state: cloneData });
  };

  const handleContinue = () => {
    // Navigate to product context first
    navigate('/product-context', { state: { cloneData } });
  };

  return (
    <>
      <Helmet>
        <title>Preview del Clon - MAZK</title>
        <meta name="description" content="Revisa cómo quedó tu gemelo digital de ventas" />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <Button
              variant="ghost"
              iconName="ArrowLeft"
              iconPosition="left"
              onClick={() => navigate('/create-ai-closer')}
              className="mb-6 text-gray-400 hover:text-white"
            >
              Volver
            </Button>
            
            <div className="mb-2">
              <div className="text-sm text-cyan-400 mb-2 uppercase tracking-wider">Paso 2 de 3</div>
              <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
                Tu gemelo digital está listo
              </h1>
              <p className="text-lg text-gray-400 font-light">
                Revisa cómo quedó tu clon y escucha una muestra
              </p>
            </div>
          </div>

          {/* Preview Card */}
          <div className="border-2 border-zinc-800 rounded-lg p-8 bg-zinc-950 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center">
                  <Icon name="User" size={32} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-white mb-1">
                    {cloneData.name || 'Tu Gemelo Digital'}
                  </h2>
                  <p className="text-sm text-gray-400">Clon de vendedor configurado</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-cyan-400">Listo</span>
              </div>
            </div>

            {/* Personality Traits */}
            {cloneData.personalityTraits && cloneData.personalityTraits.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Traits de personalidad</p>
                <div className="flex flex-wrap gap-2">
                  {cloneData.personalityTraits.map((trait, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 text-sm bg-cyan-400/20 border border-cyan-400/50 text-cyan-400 rounded-md"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Personality Description */}
            {cloneData.personalityDescription && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Descripción</p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {cloneData.personalityDescription}
                </p>
              </div>
            )}

            {/* Demo Section */}
            <div className="border-t border-zinc-800 pt-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Demo de voz clonada</p>
              
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 mb-4 space-y-4">
                {/* Text Input */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Ingresa el texto que quieres escuchar con la voz clonada
                  </label>
                  <Textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Escribe aquí el texto que quieres que reproduzca la voz clonada..."
                    rows={4}
                    className="bg-zinc-950 border-zinc-800 text-white placeholder:text-gray-600 resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      type="button"
                      variant="default"
                      iconName="Volume2"
                      iconPosition="left"
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingDemo || !customText.trim() || !cloneData.voiceCloneId}
                      className="bg-cyan-400 text-black hover:bg-cyan-500 disabled:opacity-50"
                    >
                      {isGeneratingDemo ? 'Generando...' : 'Generar audio'}
                    </Button>
                  </div>
                </div>

                {/* Audio Player */}
                {isGeneratingDemo ? (
                  <div className="bg-zinc-800 rounded-lg p-6 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      Generando demo de voz clonada...
                    </p>
                  </div>
                ) : demoError ? (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                    <p className="text-sm text-red-400 mb-2">Error al generar el demo</p>
                    <p className="text-xs text-gray-500">{demoError}</p>
                  </div>
                ) : demoAudioUrl ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Audio generado:</p>
                    <AudioPlayer 
                      src={demoAudioUrl} 
                      showControls={true}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div className="bg-zinc-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">
                      Ingresa un texto y haz clic en "Generar audio" para escuchar tu voz clonada
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-cyan-400/10 border border-cyan-400/30 rounded-lg p-4">
                <p className="text-xs text-cyan-400 mb-1">💡 Nota</p>
                <p className="text-sm text-gray-400">
                  Esta es una muestra de cómo sonará tu gemelo digital. El clon usará tu voz y personalidad para cada llamada.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-4 pt-6 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              iconName="Settings"
              iconPosition="left"
              onClick={handleAdjust}
              className="border-zinc-700 text-gray-400 hover:border-zinc-600"
            >
              Hacer ajustes
            </Button>
            <Button
              type="button"
              variant="default"
              iconName="ArrowRight"
              iconPosition="right"
              onClick={handleContinue}
              className="bg-cyan-400 text-black hover:bg-cyan-500"
            >
              Continuar con leads
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClonePreview;

