import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const WelcomeOnboarding = () => {
  const navigate = useNavigate();
  const [hoveredOption, setHoveredOption] = useState<'clone' | 'default' | null>(null);

  const handleCloneVendor = () => {
    navigate('/create-ai-closer?mode=clone');
  };

  const handleUseDefault = () => {
    navigate('/ai-closers-management?mode=default');
  };

  return (
    <>
      <Helmet>
        <title>Bienvenido a MAZK</title>
        <meta name="description" content="Clona tu voz. Cierra más ventas. Escala sin límites." />
      </Helmet>

      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-6xl w-full">
          {/* Header - Logo y tagline */}
          <div className="mb-20">
            <div className="inline-block mb-6">
              <div className="text-[100px] md:text-[120px] font-light leading-none tracking-tighter text-white">
                MAZK
              </div>
              <div className="h-1 w-32 bg-gradient-to-r from-cyan-400 to-cyan-600 mt-4"></div>
            </div>
            <div className="text-2xl md:text-3xl text-gray-400 font-light max-w-2xl leading-relaxed">
              Clona tu voz. Cierra más ventas. <br/>
              Escala sin límites.
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-12">
            {/* Hero Text */}
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white leading-tight">
                Tu gemelo digital<br/>
                <span className="text-gray-500">de ventas</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
                Mazk clona tu voz y personalidad para cerrar ventas high-ticket mientras tú escalas tu negocio
              </p>
            </div>

            {/* Options Grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Option 1: Clonar Vendedor */}
              <div
                className={`relative border-2 rounded-lg p-10 transition-all duration-300 cursor-pointer group ${
                  hoveredOption === 'clone'
                    ? 'border-cyan-400 bg-zinc-900/50'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
                }`}
                onMouseEnter={() => setHoveredOption('clone')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={handleCloneVendor}
              >
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      hoveredOption === 'clone'
                        ? 'bg-cyan-400/20 border-2 border-cyan-400'
                        : 'bg-zinc-900 border-2 border-zinc-800'
                    }`}>
                      <Icon 
                        name="Mic" 
                        size={32} 
                        className={hoveredOption === 'clone' ? 'text-cyan-400' : 'text-gray-500'}
                      />
                    </div>
                    <div>
                      <div className="text-sm text-cyan-400 mb-1 uppercase tracking-wider font-medium">
                        Opción 1
                      </div>
                      <h3 className="text-2xl font-light text-white">
                        Clona tu vendedor
                      </h3>
                    </div>
                  </div>

                  <p className="text-gray-400 text-lg leading-relaxed">
                    Configura tu gemelo digital con tu voz, estilo y toda la información de tu producto o campaña
                  </p>

                  <div className="border-l-2 border-cyan-400 pl-4 space-y-2">
                    <p className="text-sm text-gray-500">Incluye:</p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} className="text-cyan-400" />
                        <span>Clonación de voz</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} className="text-cyan-400" />
                        <span>Personalidad replicada</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} className="text-cyan-400" />
                        <span>Configuración personalizada</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    iconName="ArrowRight"
                    iconPosition="right"
                    className={`w-full border-2 transition-all duration-300 ${
                      hoveredOption === 'clone'
                        ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400/10'
                        : 'border-zinc-700 text-gray-400 hover:border-zinc-600'
                    }`}
                  >
                    Comenzar clonación
                  </Button>
                </div>

                {/* Hover effect overlay */}
                {hoveredOption === 'clone' && (
                  <div className="absolute inset-0 border-2 border-cyan-400 rounded-lg opacity-20 animate-pulse pointer-events-none"></div>
                )}
              </div>

              {/* Option 2: Closer por Default */}
              <div
                className={`relative border-2 rounded-lg p-10 transition-all duration-300 cursor-pointer group ${
                  hoveredOption === 'default'
                    ? 'border-cyan-400 bg-zinc-900/50'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
                }`}
                onMouseEnter={() => setHoveredOption('default')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={handleUseDefault}
              >
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      hoveredOption === 'default'
                        ? 'bg-cyan-400/20 border-2 border-cyan-400'
                        : 'bg-zinc-900 border-2 border-zinc-800'
                    }`}>
                      <Icon 
                        name="Sparkles" 
                        size={32} 
                        className={hoveredOption === 'default' ? 'text-cyan-400' : 'text-gray-500'}
                      />
                    </div>
                    <div>
                      <div className="text-sm text-cyan-400 mb-1 uppercase tracking-wider font-medium">
                        Opción 2
                      </div>
                      <h3 className="text-2xl font-light text-white">
                        Usar closer por defecto
                      </h3>
                    </div>
                  </div>

                  <p className="text-gray-400 text-lg leading-relaxed">
                    Comienza rápido con un AI Closer pre-configurado y personalízalo después según tus necesidades
                  </p>

                  <div className="border-l-2 border-cyan-400 pl-4 space-y-2">
                    <p className="text-sm text-gray-500">Incluye:</p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} className="text-cyan-400" />
                        <span>Configuración lista para usar</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} className="text-cyan-400" />
                        <span>Personalización posterior</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} className="text-cyan-400" />
                        <span>Inicio inmediato</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    iconName="ArrowRight"
                    iconPosition="right"
                    className={`w-full border-2 transition-all duration-300 ${
                      hoveredOption === 'default'
                        ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400/10'
                        : 'border-zinc-700 text-gray-400 hover:border-zinc-600'
                    }`}
                  >
                    Ver closers disponibles
                  </Button>
                </div>

                {/* Hover effect overlay */}
                {hoveredOption === 'default' && (
                  <div className="absolute inset-0 border-2 border-cyan-400 rounded-lg opacity-20 animate-pulse pointer-events-none"></div>
                )}
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-16 pt-8 border-t border-zinc-800">
              <p className="text-sm text-gray-600 uppercase tracking-widest">
                El futuro de las ventas es <span className="italic text-gray-500">personal</span> y <span className="italic text-gray-500">escalable</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WelcomeOnboarding;

