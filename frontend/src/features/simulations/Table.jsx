import { useState, useRef, useEffect } from 'react';
import { Ellipsis, Eye, Check, X, Clock, Trash2 } from 'lucide-react';

const columns = [
  { label: 'ID', key: 'id' },
  { label: 'Simulation Name', key: 'sim_name' },
  { label: 'Number of Emitters', key: 'n_transmitter' },
  { label: 'Number of Receivers', key: 'n_receiver' },
  { label: 'Emitters Pitch', key: 'emitters_pitch' },
  { label: 'Receivers Pitch', key: 'receivers_pitch' },
  { label: 'Distance', key: 'sensor_distance' },
  { label: 'Edge Margin', key: 'sensor_edge_margin' },
  { label: 'Mesh Size', key: 'typical_mesh_size' },
  { label: 'Plate Thickness', key: 'plate_thickness' },
  { label: 'Porosity', key: 'porosity' },
  { label: 'Attenuation', key: 'attenuation' },
  { label: 'Status', key: 'p_status' },
  // { label: '', key: 'actions' },
];
const getActionLabel = (status) => {
  if (status === 'Running') return 'Stop';
  if (status === 'Not started') return 'Execute';
  if (status === 'Failed' || status === 'Fallida') return 'Retry';
  if (status === 'Finished' || status === 'Completada') return 'Re-execute';
  return null;
};

const ActionMenu = ({ status, onView, simulation, visible, open, onOpen, onDelete }) => {
  const [openUp, setOpenUp] = useState(false);
  const btnRef = useRef(null);
  const actionLabel = getActionLabel(status);

  // Detectar si el menú debe abrir hacia arriba o abajo
  const handleOpen = (e) => {
    e.stopPropagation();
    onOpen(simulation.id);
    setTimeout(() => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUp(spaceBelow < 180);
      }
    }, 0);
  };

  useEffect(() => {
    if (!open) return;
    const handler = () => onOpen(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [open, onOpen]);

  return (
    <div className="relative select-none z-20 w-8 h-8 flex items-center justify-center" ref={btnRef}>
      <button
        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleOpen}
        type="button"
      >
        <Ellipsis className="h-4 w-4" />
      </button>
      {open && (
        <div
          className={`absolute right-0 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10 animate-fade-in ${openUp ? 'bottom-full mb-2' : 'mt-2'}`}
        >
          <ul className="py-1">
            <li>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => { onView && onView(simulation); onOpen(null); }}
              >
                <Eye className="h-4 w-4" />
                Ver
              </button>
            </li>
            {actionLabel && (
              <li><button className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 font-semibold f">{actionLabel}</button></li>
            )}
            <li>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                onClick={() => { onDelete && onDelete(simulation); onOpen(null); }}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

const getStatusInfo = (status) => {
  switch (status) {
    case 'Not started':
      return { text: 'Not started', color: 'text-gray-500', bg: 'bg-gray-100' };
    case 'Running':
      return { text: 'Running', color: 'text-yellow-700', bg: 'bg-yellow-100' };
    case 'Finished':
      return { text: 'Finished', color: 'text-green-700', bg: 'bg-green-100' };
    case 'Error':
      return  {text: 'Error', color: 'text-red-700', bg: 'bg-red-100'}
    default:
      return { text: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-50' };
  }
};

export default function Table({ simulations, onView, onDelete }) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <div className="bg-white w-full h-full overflow-y-auto rounded-lg shadow relative flex flex-col">
      {/* Header sticky */}
      <div
        className="sticky top-0 z-20 bg-gray-50 shadow grid border-b border-gray-200"
        style={{
          gridTemplateColumns: 'repeat(13, minmax(120px, 1fr))',
          minWidth: 1800,
          alignItems: 'center',
        }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider"
          >
            {col.label}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-y-1">
        {simulations.map((sim) => {
          const statusInfo = getStatusInfo(sim.p_status);
          return (
            <div
              key={sim.id}
              className={`relative grid border border-transparent items-center transition-all duration-150 hover:bg-gray-50 cursor-pointer hover:border-t-gray-200 hover:border-b-gray-300 shadow-sm`}
              style={{
                gridTemplateColumns: 'repeat(13, minmax(120px, 1fr))',
                minWidth: 1800,
                alignItems: 'center',
              }}
              onMouseEnter={() => setHoveredRow(sim.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Overlay en hover */}
              <div
                className={`absolute inset-0 flex items-center justify-center bg-gray-900/10 z-10 transition-opacity duration-150 cursor-pointer ${hoveredRow === sim.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => onView && onView(sim)}
              >
                <span className="text-sm font-semibold text-gray-800 bg-white/80 px-4 py-1 rounded shadow-md border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-colors">Click to see details</span>
              </div>
              <div className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">{sim.id}</div>
              <div className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{sim.sim_name}</div>
              <div className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">{sim.n_transmitter}</div>
              <div className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">{sim.n_receiver}</div>
              <div className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">{sim.emitters_pitch}</div>
              <div className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">{sim.receivers_pitch}</div>
              <div className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">{sim.sensor_distance}</div>
              <div className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">{sim.sensor_edge_margin}</div>
              <div className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">{sim.typical_mesh_size}</div>
              <div className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">{sim.plate_thickness}</div>
              <div className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">{sim.porosity}</div>
              <div className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">
                {sim.attenuation === 1 || sim.attenuation === 'Yes' ? (
                  <span>Yes</span>
                ) : (
                  <span>No</span>
                )}
              </div>
              <div className="px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">
                  <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}