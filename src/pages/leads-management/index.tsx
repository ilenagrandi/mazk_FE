import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Play, Pause, Phone, PhoneOff, CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import { initiateOutboundCall, formatPhoneNumber, getCallStatus, TranscriptEntry as MetatronTranscriptEntry } from '../../services/metatron';
import TranscriptFloatingPanel from '../call-interface/components/TranscriptFloatingPanel';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  extraInfo: string;
  status?: 'pending' | 'calling' | 'completed' | 'failed';
  callResult?: string;
}

const LeadsManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cloneData, leads: initialLeads } = (location.state as { cloneData?: any; leads?: Lead[] }) || {};

  const [leads, setLeads] = useState<Lead[]>(
    initialLeads?.map(lead => ({ ...lead, status: 'pending' as const })) || []
  );
  const [isCalling, setIsCalling] = useState(false);
  const [currentCallIndex, setCurrentCallIndex] = useState<number | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [currentCallLeadId, setCurrentCallLeadId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<MetatronTranscriptEntry[]>([]);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false);
  const transcriptPollingRef = useRef<number | null>(null);

  const handleStartCalls = async () => {
    if (leads.length === 0) return;
    
    // Get first pending lead
    const firstPendingLead = leads.find(lead => lead.status === 'pending') || leads[0];
    if (!firstPendingLead) return;
    
    // Check if we have voice_id from cloneData
    const voiceId = cloneData?.voiceCloneId;
    if (!voiceId) {
      alert('Error: No se encontró el ID de la voz clonada. Por favor, vuelve a crear el clon.');
      return;
    }
    
    // Format phone number to E.164 format
    const phoneNumber = formatPhoneNumber(firstPendingLead.phone);
    
    try {
      // Update lead status to calling
      setLeads(prev => prev.map(lead => 
        lead.id === firstPendingLead.id 
          ? { ...lead, status: 'calling' as const }
          : lead
      ));
      
      // Initiate outbound call via Metatron/Twilio
      const callResponse = await initiateOutboundCall({
        phone_number: phoneNumber,
        voice_id: voiceId,
        metadata: {
          lead_id: firstPendingLead.id,
          campaign: 'mazk_sales',
          lead_name: `${firstPendingLead.firstName} ${firstPendingLead.lastName}`,
        },
      });
      
      console.log('Call initiated:', callResponse);
      
      // Store call information and stay on this page
      setCurrentCallId(callResponse.call_id);
      setCurrentCallLeadId(firstPendingLead.id);
      setIsCalling(true);
      setShowTranscriptPanel(true);
      
      // Start polling for transcript
      startTranscriptPolling(callResponse.call_id);
    } catch (error) {
      console.error('Error initiating call:', error);
      let errorMessage = error instanceof Error ? error.message : 'Error desconocido al iniciar la llamada';
      
      // Provide more helpful error messages
      if (errorMessage.includes('No se pudo conectar') || errorMessage.includes('Failed to fetch')) {
        errorMessage = 
          'No se pudo conectar al servidor de Metatron.\n\n' +
          'Por favor verifica que:\n' +
          '1. El servidor de Metatron esté corriendo en el puerto 8000 o 5885\n' +
          '2. Puedes iniciarlo con: cd metatron && docker-compose up\n' +
          '3. O ejecutando: cd metatron/metatron && python3 run.py';
      }
      
      alert(`Error al iniciar la llamada:\n\n${errorMessage}`);
      
      // Reset lead status on error
      setLeads(prev => prev.map(lead => 
        lead.id === firstPendingLead.id 
          ? { ...lead, status: 'pending' as const }
          : lead
      ));
    }
  };

  const startTranscriptPolling = (callId: string) => {
    // Stop any existing polling
    if (transcriptPollingRef.current) {
      clearInterval(transcriptPollingRef.current);
    }

    const pollTranscript = async () => {
      try {
        const status = await getCallStatus(callId);
        if (status.transcript && status.transcript.length > 0) {
          setTranscript(status.transcript);
        }
        
        // Update call status
        if (status.status === 'completed' || status.status === 'failed') {
          // Call ended, update lead status
          setLeads(prev => prev.map(lead => 
            lead.id === currentCallLeadId 
              ? { 
                  ...lead, 
                  status: status.status === 'completed' ? 'completed' as const : 'failed' as const,
                  callResult: status.status === 'completed' ? 'Llamada completada exitosamente' : 'Llamada fallida'
                }
              : lead
          ));
          
          // Stop polling
          if (transcriptPollingRef.current) {
            clearInterval(transcriptPollingRef.current);
            transcriptPollingRef.current = null;
          }
          
          setIsCalling(false);
          setCurrentCallId(null);
          setCurrentCallLeadId(null);
        }
      } catch (error) {
        console.error('Error fetching transcript:', error);
      }
    };

    // Poll every 2 seconds
    transcriptPollingRef.current = window.setInterval(pollTranscript, 2000);
    
    // Initial poll
    pollTranscript();
  };

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (transcriptPollingRef.current) {
        clearInterval(transcriptPollingRef.current);
      }
    };
  }, []);

  const simulateCall = (index: number) => {
    if (index >= leads.length) {
      setIsCalling(false);
      setCurrentCallIndex(null);
      return;
    }

    setCurrentCallIndex(index);
    setLeads(prev => prev.map((lead, i) => 
      i === index ? { ...lead, status: 'calling' as const } : lead
    ));

    // Simulate call duration (3-5 seconds)
    const callDuration = 3000 + Math.random() * 2000;
    
    setTimeout(() => {
      // Simulate success/failure (80% success rate)
      const isSuccess = Math.random() > 0.2;
      setLeads(prev => prev.map((lead, i) => 
        i === index 
          ? { 
              ...lead, 
              status: isSuccess ? 'completed' as const : 'failed' as const,
              callResult: isSuccess 
                ? 'Llamada completada exitosamente' 
                : 'No se pudo contactar al lead'
            } 
          : lead
      ));

      // Continue with next call
      setTimeout(() => {
        simulateCall(index + 1);
      }, 1000);
    }, callDuration);
  };

  const handleStopCalls = () => {
    // Stop polling
    if (transcriptPollingRef.current) {
      clearInterval(transcriptPollingRef.current);
      transcriptPollingRef.current = null;
    }
    
    setIsCalling(false);
    setCurrentCallIndex(null);
    setCurrentCallId(null);
    setCurrentCallLeadId(null);
    setShowTranscriptPanel(false);
    setTranscript([]);
    
    setLeads(prev => prev.map(lead => 
      lead.status === 'calling' ? { ...lead, status: 'pending' as const } : lead
    ));
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'calling':
        return <Phone className="w-4 h-4 text-cyan-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'calling':
        return 'Llamando...';
      case 'completed':
        return 'Completada';
      case 'failed':
        return 'Fallida';
      default:
        return 'Pendiente';
    }
  };

  const completedCount = leads.filter(l => l.status === 'completed').length;
  const failedCount = leads.filter(l => l.status === 'failed').length;
  const pendingCount = leads.filter(l => l.status === 'pending').length;

  return (
    <>
      <Helmet>
        <title>Gestión de Leads - MAZK</title>
        <meta name="description" content="Gestiona y ejecuta llamadas con tu gemelo digital" />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              iconName="ArrowLeft"
              iconPosition="left"
              onClick={() => navigate('/import-leads', { state: { cloneData, leads: initialLeads } })}
              className="mb-6 text-gray-400 hover:text-white"
            >
              Volver
            </Button>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-light text-white mb-2">
                  Gestión de Leads
                </h1>
                <p className="text-lg text-gray-400 font-light">
                  Tu gemelo digital está listo para llamar
                </p>
              </div>
              
              {!isCalling ? (
                <Button
                  type="button"
                  variant="default"
                  iconName="Play"
                  iconPosition="left"
                  onClick={handleStartCalls}
                  disabled={leads.length === 0 || pendingCount === 0}
                  className="bg-cyan-400 text-black hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Iniciar llamadas
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  iconName="PhoneOff"
                  iconPosition="left"
                  onClick={handleStopCalls}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Detener llamadas
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total</p>
                <p className="text-2xl font-light text-white">{leads.length}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pendientes</p>
                <p className="text-2xl font-light text-gray-400">{pendingCount}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Completadas</p>
                <p className="text-2xl font-light text-green-400">{completedCount}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fallidas</p>
                <p className="text-2xl font-light text-red-400">{failedCount}</p>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-900 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Información
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Resultado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {leads.map((lead, index) => (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-zinc-900/50 transition-colors ${
                        (currentCallIndex === index || lead.id === currentCallLeadId) ? 'bg-cyan-400/10 border-l-2 border-cyan-400' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(lead.status)}
                          <span className={`text-sm ${
                            lead.status === 'calling' ? 'text-cyan-400' :
                            lead.status === 'completed' ? 'text-green-400' :
                            lead.status === 'failed' ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                            {getStatusText(lead.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {lead.firstName} {lead.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">{lead.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400 max-w-md">
                          {lead.extraInfo || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400">
                          {lead.callResult || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {leads.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No hay leads para mostrar</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/import-leads', { state: { cloneData } })}
                className="mt-4 border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
              >
                Importar leads
              </Button>
            </div>
          )}
        </div>

        {/* Transcript Floating Panel */}
        {currentCallId && (
          <TranscriptFloatingPanel
            entries={transcript}
            isVisible={showTranscriptPanel}
            onClose={() => setShowTranscriptPanel(false)}
          />
        )}
      </div>
    </>
  );
};

export default LeadsManagement;

