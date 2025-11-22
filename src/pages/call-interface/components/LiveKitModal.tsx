import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

interface LiveKitModalProps {
  roomName: string;
  token: string;
  url: string;
  onClose: () => void;
}

const LiveKitModal = ({ roomName, token, url, onClose }: LiveKitModalProps) => {
  const [copied, setCopied] = useState(false);
  const meetingUrl = `${window.location.origin}/call-interface?room=${roomName}&token=${encodeURIComponent(token)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    window.open(meetingUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border-2 border-cyan-400/50 rounded-lg max-w-2xl w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 bg-cyan-400/20 border-2 border-cyan-400 rounded-full flex items-center justify-center mb-4">
            <Icon name="ExternalLink" size={24} className="text-cyan-400" />
          </div>
          <h2 className="text-2xl font-light text-white mb-2">
            Sala de Reunión Lista
          </h2>
          <p className="text-gray-400">
            Comparte este link con el lead para que se una a la llamada
          </p>
        </div>

        {/* Room Info */}
        <div className="bg-zinc-900 rounded-lg p-4 mb-4 border border-zinc-800">
          <div className="mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nombre de la Sala</p>
            <p className="text-sm text-white font-mono">{roomName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">URL de LiveKit</p>
            <p className="text-sm text-gray-400 font-mono break-all">{url}</p>
          </div>
        </div>

        {/* Meeting Link */}
        <div className="mb-6">
          <label className="text-sm font-medium text-white mb-2 block">
            Link de la Reunión
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={meetingUrl}
              readOnly
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white font-mono break-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <Icon name={copied ? "Check" : "Copy"} size={16} />
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="default"
            iconName="ExternalLink"
            iconPosition="left"
            onClick={handleJoin}
            className="flex-1 bg-cyan-400 text-black hover:bg-cyan-500"
          >
            Unirse a la Reunión
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-zinc-700 text-gray-400 hover:border-zinc-600"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveKitModal;

