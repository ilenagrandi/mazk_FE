import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Upload, FileSpreadsheet, X, Play, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  extraInfo: string;
}

const ImportLeads = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cloneData } = (location.state as { cloneData?: any }) || {};

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      let headers: string[] = [];
      let rows: string[][] = [];

      if (isExcel) {
        // Handle Excel files
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        
        if (data.length === 0) {
          throw new Error('El archivo Excel está vacío');
        }

        // First row is headers
        headers = data[0].map((h: any) => String(h || '').trim().toLowerCase());
        // Rest are rows
        rows = data.slice(1).map(row => row.map((cell: any) => String(cell || '').trim()));
      } else {
        // Handle CSV files
        const text = await file.text();
        
        // Check if it looks like binary data
        if (text.startsWith('PK') || (text.charCodeAt(0) < 32 && text.length > 0 && !text.startsWith('\n') && !text.startsWith('\r'))) {
          throw new Error(
            'El archivo parece ser un archivo Excel binario. ' +
            'Por favor, exporta tu archivo como CSV desde Excel: ' +
            'Archivo > Guardar como > CSV (delimitado por comas)'
          );
        }
        
        // Parse CSV - handle different line endings and separators
        let lines = text.split(/\r?\n/).filter(line => line.trim());
      
        if (lines.length < 2) {
          throw new Error('El archivo debe tener al menos una fila de encabezados y una fila de datos');
        }

        // Try to detect separator (comma, semicolon, tab)
        const firstLine = lines[0];
        let separator = ',';
        if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
          separator = ';';
        } else if (firstLine.includes('\t')) {
          separator = '\t';
        }

        // Parse headers - handle quoted values
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === separator && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        headers = parseCSVLine(lines[0]).map(h => 
          h.replace(/^"|"$/g, '').trim().toLowerCase()
        );
        
        // Parse rows
        rows = lines.slice(1).map(line => parseCSVLine(line).map(v => v.replace(/^"|"$/g, '').trim()));
      }
      
      // Find column indices with more variations
      const findColumnIndex = (patterns: string[]): number => {
        for (const pattern of patterns) {
          const idx = headers.findIndex(h => 
            h.includes(pattern) || h === pattern || h.startsWith(pattern) || h.endsWith(pattern)
          );
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const firstNameIdx = findColumnIndex([
        'nombre', 'name', 'first name', 'firstname', 'nombres', 'nombre completo',
        'nombre_completo', 'nombre-completo', 'primer nombre', 'primer_nombre'
      ]);
      
      const lastNameIdx = findColumnIndex([
        'apellido', 'last name', 'lastname', 'apellidos', 'surname', 'last',
        'apellido_completo', 'apellido-completo', 'segundo nombre'
      ]);
      
      const phoneIdx = findColumnIndex([
        'telefono', 'teléfono', 'phone', 'tel', 'telephone', 'celular', 'cel',
        'movil', 'móvil', 'numero', 'número', 'number', 'phone number',
        'telefono_completo', 'telefono-completo', 'whatsapp', 'wa'
      ]);
      
      const emailIdx = findColumnIndex([
        'email', 'correo', 'mail', 'e-mail', 'e_mail', 'correo electronico',
        'correo_electronico', 'correo-electronico'
      ]);
      
      const extraInfoIdx = findColumnIndex([
        'info', 'informacion', 'información', 'extra', 'notas', 'notes', 'comentarios',
        'comentario', 'observaciones', 'observacion', 'descripcion', 'descripción',
        'detalles', 'detalle', 'como se entero', 'cómo se enteró', 'historial',
        'llamadas anteriores', 'contexto', 'background'
      ]);

      // Check if we have at least name or phone
      if (firstNameIdx === -1 && phoneIdx === -1) {
        throw new Error(
          `No se encontraron las columnas requeridas. Columnas detectadas: ${headers.join(', ')}. ` +
          `El archivo debe contener al menos una columna de "Nombre" o "Teléfono".`
        );
      }

      // Parse rows
      const parsedLeads: Lead[] = [];
      for (let i = 0; i < rows.length; i++) {
        const values = rows[i];
        if (values.every(v => !v)) continue; // Skip empty rows
        
        // Try to get name - if firstNameIdx is -1, try to split from a combined name column
        let firstName = firstNameIdx !== -1 ? values[firstNameIdx] || '' : '';
        let lastName = lastNameIdx !== -1 ? values[lastNameIdx] || '' : '';
        
        // If no separate name columns, try to find a combined name column
        if (!firstName && firstNameIdx === -1) {
          const nameIdx = findColumnIndex(['nombre completo', 'nombre_completo', 'nombre-completo', 'name']);
          if (nameIdx !== -1) {
            const fullName = values[nameIdx] || '';
            const nameParts = fullName.split(/\s+/);
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
        }
        
        const phone = phoneIdx !== -1 ? values[phoneIdx] || '' : '';
        const email = emailIdx !== -1 ? values[emailIdx] || '' : '';
        const extraInfo = extraInfoIdx !== -1 ? values[extraInfoIdx] || '' : '';

        // At least need name or phone
        if (firstName || phone) {
          parsedLeads.push({
            id: `lead-${i}`,
            firstName: firstName || 'Sin nombre',
            lastName: lastName || '',
            phone: phone || 'Sin teléfono',
            email: email || '',
            extraInfo: extraInfo || '',
          });
        }
      }

      if (parsedLeads.length === 0) {
        throw new Error('No se encontraron leads válidos en el archivo. Asegúrate de que haya datos además de los encabezados.');
      }

      setLeads(parsedLeads);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
      console.error('Error parsing file:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveLead = (id: string) => {
    setLeads(leads.filter(lead => lead.id !== id));
  };

  const handleStartCalls = () => {
    if (leads.length === 0) {
      setError('Debes importar al menos un lead');
      return;
    }
    // Navigate to calls management
    navigate('/leads-management', { 
      state: { 
        cloneData, 
        leads 
      } 
    });
  };

  return (
    <>
      <Helmet>
        <title>Importar Leads - MAZK</title>
        <meta name="description" content="Importa tus leads para comenzar las llamadas" />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <Button
              variant="ghost"
              iconName="ArrowLeft"
              iconPosition="left"
              onClick={() => navigate('/product-context', { state: { cloneData } })}
              className="mb-6 text-gray-400 hover:text-white"
            >
              Volver
            </Button>
            
            <div className="mb-2">
              <div className="text-sm text-cyan-400 mb-2 uppercase tracking-wider">
                {cloneData?.isDefault ? 'Paso 3 de 3' : 'Paso 4 de 4'}
              </div>
              <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
                Importa tus leads
              </h1>
              <p className="text-lg text-gray-400 font-light">
                Sube un archivo Excel o CSV con la información de tus leads
              </p>
            </div>
          </div>

          {/* Upload Section */}
          {leads.length === 0 && (
            <div className="border-2 border-dashed border-zinc-800 rounded-lg p-12 text-center hover:border-cyan-400/50 transition-colors bg-zinc-950 mb-8">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="leads-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="leads-upload"
                className="cursor-pointer flex flex-col items-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Subir archivo de leads</p>
                  <p className="text-sm text-gray-500">
                    Formatos soportados: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  iconName="Upload"
                  className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Procesando...' : 'Seleccionar archivo'}
                </Button>
              </label>

              {/* Format Info */}
              <div className="mt-8 text-left max-w-2xl mx-auto">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Formato requerido</p>
                <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                  <p className="text-sm text-gray-400 mb-2">El archivo debe contener las siguientes columnas:</p>
                  <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
                    <li><strong className="text-gray-400">Nombre</strong> (requerido)</li>
                    <li><strong className="text-gray-400">Apellido</strong> (opcional)</li>
                    <li><strong className="text-gray-400">Teléfono</strong> (requerido)</li>
                    <li><strong className="text-gray-400">Email</strong> (opcional)</li>
                    <li><strong className="text-gray-400">Información extra</strong> (opcional) - Notas sobre el lead, cómo se enteró, historial, etc.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Leads List */}
          {leads.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light text-white mb-1">
                    {leads.length} {leads.length === 1 ? 'lead importado' : 'leads importados'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Revisa la información y elimina los que no necesites
                  </p>
                </div>
                <div className="flex gap-3">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="leads-upload-again"
                  />
                  <label htmlFor="leads-upload-again">
                    <Button
                      type="button"
                      variant="outline"
                      iconName="Upload"
                      className="border-zinc-700 text-gray-400 hover:border-zinc-600"
                    >
                      Importar más
                    </Button>
                  </label>
                  <Button
                    type="button"
                    variant="default"
                    iconName="Play"
                    iconPosition="left"
                    onClick={handleStartCalls}
                    className="bg-cyan-400 text-black hover:bg-cyan-500"
                  >
                    Iniciar llamadas
                  </Button>
                </div>
              </div>

              {/* Leads Table */}
              <div className="border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-900 border-b border-zinc-800">
                      <tr>
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
                          Información extra
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-zinc-900/50 transition-colors">
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
                            <div className="text-sm text-gray-400 max-w-md truncate">
                              {lead.extraInfo || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveLead(lead.id)}
                              className="text-gray-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ImportLeads;

