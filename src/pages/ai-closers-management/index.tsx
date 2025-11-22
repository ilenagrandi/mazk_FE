import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Play, Pause, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import AudioPlayer from '../../components/AudioPlayer';

interface Agent {
  id: string;
  name: string;
  description: string;
  personalityTraits: string[];
  demoAudio: string;
  demoText: string;
  useCase: string;
}

const AIClosersManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [playingDemo, setPlayingDemo] = useState<string | null>(null);

  const agents: Agent[] = [
    {
      id: 'agent-1',
      name: 'Alex - El Persuasor',
      description: 'Especialista en ventas de alto valor con un enfoque empático y consultivo. Perfecto para productos premium y servicios de coaching.',
      personalityTraits: ['Empático', 'Persuasivo', 'Profesional', 'Confiable'],
      demoAudio: '/demo-audio-1.mp3', // Placeholder - you'll need actual audio files
      demoText: 'Hola, entiendo que estás buscando una solución que realmente transforme tu negocio. Déjame contarte cómo hemos ayudado a personas como tú a alcanzar resultados extraordinarios...',
      useCase: 'Ideal para cursos online, mentorías y productos digitales premium ($2K+)',
    },
    {
      id: 'agent-2',
      name: 'Sofia - La Directa',
      description: 'Comunicación clara y directa, sin rodeos. Ideal para clientes que valoran la transparencia y quieren respuestas rápidas.',
      personalityTraits: ['Directo', 'Asertivo', 'Analítico', 'Profesional'],
      demoAudio: '/demo-audio-2.mp3',
      demoText: 'Mira, vamos directo al grano. Tienes un problema y yo tengo la solución. No voy a perder tu tiempo con historias, te voy a mostrar exactamente cómo esto resuelve tu situación...',
      useCase: 'Perfecto para servicios B2B, software empresarial y soluciones técnicas',
    },
    {
      id: 'agent-3',
      name: 'Carlos - El Entusiasta',
      description: 'Energía contagiosa y pasión genuina. Convierte cada conversación en una experiencia motivadora y memorable.',
      personalityTraits: ['Entusiasta', 'Enérgico', 'Amigable', 'Persuasivo'],
      demoAudio: '/demo-audio-3.mp3',
      demoText: '¡Hola! Me encanta que estés aquí. Esto va a cambiar completamente tu perspectiva. Imagínate tener en tus manos exactamente lo que necesitas para dar ese salto que tanto buscas...',
      useCase: 'Excelente para eventos, lanzamientos, productos de consumo y comunidades',
    },
  ];

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgent(agentId);
  };

  const handlePlayDemo = (agentId: string) => {
    if (playingDemo === agentId) {
      setPlayingDemo(null);
    } else {
      setPlayingDemo(agentId);
    }
  };

  const handleUseAgent = (agent: Agent) => {
    // Navigate to product context first
    navigate('/product-context', {
      state: {
        cloneData: {
          name: agent.name,
          description: agent.description,
          personalityTraits: agent.personalityTraits,
          useCase: agent.useCase,
          demoAudio: agent.demoAudio,
          demoText: agent.demoText,
          isDefault: true, // Flag to indicate it's a default agent
        }
      }
    });
  };

  return (
    <>
      <Helmet>
        <title>Agentes por Defecto - MAZK</title>
        <meta name="description" content="Elige un agente pre-configurado para comenzar rápidamente" />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-12">
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
              <div className="text-sm text-cyan-400 mb-2 uppercase tracking-wider">Opción 2</div>
              <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
                Agentes por defecto
              </h1>
              <p className="text-lg text-gray-400 font-light max-w-2xl">
                Comienza rápido con un agente pre-configurado. Puedes personalizarlo después según tus necesidades.
              </p>
            </div>
          </div>

          {/* Agents Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`
                  border-2 rounded-lg p-6 transition-all duration-300 cursor-pointer
                  flex flex-col h-full
                  ${selectedAgent === agent.id
                    ? 'border-cyan-400 bg-zinc-900/50'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
                  }
                `}
                onClick={() => handleSelectAgent(agent.id)}
              >
                {/* Agent Header - Fixed height */}
                <div className="mb-4 min-h-[80px]">
                  <h3 className="text-xl font-light text-white mb-2">{agent.name}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{agent.description}</p>
                </div>

                {/* Personality Traits - Fixed height */}
                <div className="mb-4 min-h-[80px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Traits</p>
                  <div className="flex flex-wrap gap-2">
                    {agent.personalityTraits.map((trait) => (
                      <span
                        key={trait}
                        className="px-2 py-1 text-xs bg-cyan-400/20 border border-cyan-400/50 text-cyan-400 rounded"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Use Case - Fixed height */}
                <div className="mb-4 min-h-[60px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ideal para</p>
                  <p className="text-sm text-gray-400">{agent.useCase}</p>
                </div>

                {/* Demo Section - Fixed height container */}
                <div className="border-t border-zinc-800 pt-4 mt-auto">
                  <div className="mb-3 min-h-[100px]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Demo de voz</p>
                    <p className="text-sm text-gray-400 italic leading-relaxed">
                      "{agent.demoText}"
                    </p>
                  </div>

                  {/* Audio Player - Fixed container with reserved space */}
                  <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayDemo(agent.id);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-cyan-400/20 border border-cyan-400/50 text-cyan-400 rounded-md hover:bg-cyan-400/30 transition-colors text-sm"
                    >
                      {playingDemo === agent.id ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Reproducir demo
                        </>
                      )}
                    </button>
                    
                    {/* Reserved space for AudioPlayer - always present with fixed height */}
                    <div className="mt-3 pt-3 border-t border-zinc-800 h-[120px] flex flex-col">
                      {playingDemo === agent.id ? (
                        <>
                          <div className="text-xs text-gray-500 mb-2 text-center">
                            Nota: Los archivos de audio demo estarán disponibles próximamente
                          </div>
                          <div className="w-full flex-1">
                            <AudioPlayer 
                              src={agent.demoAudio} 
                              showControls={true}
                              className="text-sm w-full"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="h-full"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Select Indicator - Always at bottom, reserved space */}
                <div className="mt-4 pt-4 border-t border-zinc-800 min-h-[60px] flex items-center justify-center">
                  {selectedAgent === agent.id && (
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">Seleccionado</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              className="border-zinc-700 text-gray-400 hover:border-zinc-600"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="default"
              iconName="ArrowRight"
              iconPosition="right"
              onClick={() => {
                if (selectedAgent) {
                  const agent = agents.find(a => a.id === selectedAgent);
                  if (agent) handleUseAgent(agent);
                }
              }}
              disabled={!selectedAgent}
              className="bg-cyan-400 text-black hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Usar este agente
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIClosersManagement;

