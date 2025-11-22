import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Upload, FileText, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Textarea from '../../components/ui/Textarea';

const ProductContext = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cloneData } = (location.state as { cloneData?: any }) || {};

  const [contextText, setContextText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept text files
    if (!file.type.startsWith('text/') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setError('Por favor sube un archivo de texto (.txt o .md)');
      return;
    }

    try {
      const text = await file.text();
      setContextText(text);
      setUploadedFile(file);
      setFileName(file.name);
      setError(null);
    } catch (err) {
      setError('Error al leer el archivo. Por favor intenta de nuevo.');
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileName(null);
    setContextText('');
  };

  const handleContinue = () => {
    if (!contextText.trim()) {
      setError('Por favor proporciona información sobre el producto o servicio');
      return;
    }

    // Navigate to import leads with context
    navigate('/import-leads', {
      state: {
        cloneData: {
          ...cloneData,
          productContext: contextText.trim(),
        }
      }
    });
  };

  return (
    <>
      <Helmet>
        <title>Contexto del Producto - MAZK</title>
        <meta name="description" content="Proporciona información sobre el producto o servicio" />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              iconName="ArrowLeft"
              iconPosition="left"
              onClick={() => {
                // Go back to previous step based on flow
                if (cloneData?.isDefault) {
                  navigate('/ai-closers-management');
                } else {
                  navigate('/clone-preview', { state: cloneData });
                }
              }}
              className="mb-6 text-gray-400 hover:text-white"
            >
              Volver
            </Button>
            
            <div className="mb-2">
              <div className="text-sm text-cyan-400 mb-2 uppercase tracking-wider">
                {cloneData?.isDefault ? 'Paso 2 de 3' : 'Paso 3 de 4'}
              </div>
              <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
                Contexto del producto
              </h1>
              <p className="text-lg text-gray-400 font-light">
                Proporciona información detallada sobre el producto o servicio que se está vendiendo
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-cyan-400/10 border border-cyan-400/30 rounded-lg p-6 mb-8">
            <p className="text-sm text-cyan-400 mb-2 font-medium">💡 Información necesaria</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Incluye detalles sobre: qué es el producto/servicio, precio, beneficios principales, 
              características, casos de uso, objeciones comunes y cómo responderlas, y cualquier 
              información relevante que tu gemelo digital necesite para cerrar ventas efectivamente.
            </p>
          </div>

          {/* Upload or Text Input */}
          <div className="space-y-6 mb-8">
            {!uploadedFile ? (
              <div className="grid md:grid-cols-2 gap-4">
                {/* Upload File Option */}
                <div className="border-2 border-dashed border-zinc-800 rounded-lg p-8 text-center hover:border-cyan-400/50 transition-colors bg-zinc-950">
                  <input
                    type="file"
                    accept=".txt,.md,text/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="context-file-upload"
                  />
                  <label
                    htmlFor="context-file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Subir archivo de texto</p>
                      <p className="text-sm text-gray-500">.txt o .md</p>
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

                {/* Or Divider */}
                <div className="flex items-center justify-center md:hidden">
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 h-px bg-zinc-800"></div>
                    <span className="text-sm text-gray-500">o</span>
                    <div className="flex-1 h-px bg-zinc-800"></div>
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <span className="text-sm text-gray-500">o</span>
                </div>
              </div>
            ) : (
              <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-950">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{fileName}</p>
                      <p className="text-sm text-gray-500">
                        {contextText.split('\n').length} líneas
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Text Input */}
            <div>
              <Textarea
                label="Información del producto o servicio"
                description="Escribe o pega aquí toda la información sobre el producto, servicio, oferta, etc."
                required
                value={contextText}
                onChange={(e) => {
                  setContextText(e.target.value);
                  setError(null);
                }}
                error={error || undefined}
                rows={12}
                placeholder="Ejemplo:&#10;&#10;Producto: Curso de Marketing Digital Premium&#10;Precio: $2,997 USD&#10;&#10;Beneficios principales:&#10;- 12 módulos con estrategias probadas&#10;- Acceso de por vida&#10;- Comunidad exclusiva&#10;- Certificado de finalización&#10;&#10;Objetivo: Ayudar a emprendedores a escalar sus negocios usando marketing digital...&#10;&#10;Objeciones comunes y respuestas:&#10;- 'Es muy caro' → Enfocarse en el ROI y el valor a largo plazo..."
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-gray-600 font-mono text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (cloneData?.isDefault) {
                  navigate('/ai-closers-management');
                } else {
                  navigate('/clone-preview', { state: cloneData });
                }
              }}
              className="border-zinc-700 text-gray-400 hover:border-zinc-600"
            >
              Cancelar
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

export default ProductContext;

