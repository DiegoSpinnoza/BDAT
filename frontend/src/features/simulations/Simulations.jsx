import { useState, useRef, useEffect } from 'react';
import Table from './Table';
import PaginationsButtons from './PaginationsButtons';
import SimulationModal from './SimulationModal';
import { Plus } from 'lucide-react';
import { io } from 'socket.io-client';
import simulationService from './simulationService';
const API = "http://localhost:5000/"
// Statistics Panel
const getStats = (simulations) => {
    const total = simulations.length;
    const finished = simulations.filter(s => s.p_status === 'Finished').length;
    const running = simulations.filter(s => s.p_status === 'Running').length;
    const notStarted = simulations.filter(s => s.p_status === 'Not started').length;
    return { total, finished, running, notStarted };
};

const ROW_HEIGHT = 56;

const Simulations = () => {
    const [selectedSimulation, setSelectedSimulation] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // 'view' or 'create'
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(7);
    const tableContainerRef = useRef(null);
    const [simulations, setSimulations] = useState([]);


    useEffect(() => {
        // 1. Conexión al backend WebSocket
        const socket = io("http://localhost:5000", {
            transports: ["websocket"], // fuerza WebSocket si es necesario
        });
        socket.on("connect", () => {
            console.log("🟢 Conectado a WebSocket:", socket.id);
        });

        // 2. Obtener simulaciones al cargar
        fetch("http://localhost:5000/simulations")
            .then(res => res.json())
            .then(data => {
                console.log("📦 Simulaciones cargadas:", data);
                setSimulations(data);
            })
            .catch(err => {
                console.error("❌ Error al obtener simulaciones:", err);
            });
        // 3. Escuchar actualizaciones del backend
        socket.on('estado_simulacion', (data) => {
            const simId = parseInt(data.id);  // 🔧 aseguramos tipo
            console.log("ID de simulación:", simId);
            console.log("Actualización de estado:", data.estado);
            // Actualizar lista
            setSimulations(prev =>
                prev.map(sim =>
                    sim.id === simId
                        ? { ...sim, p_status: data.estado }
                        : sim
                )
            );

            // Actualizar seleccionada si aplica
            setSelectedSimulation(prev =>
                prev && prev.id === simId
                    ? { ...prev, p_status: data.estado }
                    : prev
            );
        });

        // 4. Cleanup
        return () => {
            socket.disconnect(); // cierra la conexión
        };
    }, []);

    // Calculate pageSize dynamically based on container size
    useEffect(() => {
        function updatePageSize() {
            if (tableContainerRef.current) {
                const height = tableContainerRef.current.offsetHeight;
                const headerHeight = 48; // px, adjust if your header is taller
                const available = height - headerHeight;
                const rows = Math.max(1, Math.floor(available / ROW_HEIGHT));
                setPageSize(rows);
            }
        }
        updatePageSize();
        window.addEventListener('resize', updatePageSize);
        return () => window.removeEventListener('resize', updatePageSize);
    }, []);

    // Recalculate pageSize if container size changes
    useEffect(() => {
        if (!tableContainerRef.current) return;
        const observer = new ResizeObserver(() => {
            const height = tableContainerRef.current.offsetHeight;
            const headerHeight = 48;
            const available = height - headerHeight;
            const rows = Math.max(1, Math.floor(available / ROW_HEIGHT));
            setPageSize(rows);
        });
        observer.observe(tableContainerRef.current);
        return () => observer.disconnect();
    }, []);

    const stats = getStats(simulations);
    const totalPages = Math.max(1, Math.ceil(simulations.length / pageSize));

    const handleView = (simulation) => {
        setSelectedSimulation(simulation);
        setModalMode('view');
        setIsModalOpen(true);
    };

    const handleNewSimulation = () => {
        setSelectedSimulation(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSimulation(null);
    };


    const handleCreateSimulation = async (newSimData) => {
        try {
            const newSimulation = await simulationService.createSimulation(newSimData);
            setSimulations(prev => [newSimulation, ...prev]); // agrega al principio
        } catch (error) {
            alert('No se pudo crear la simulación');
        }
    };

    const handleExecuteSimulation = async (simulationId, simulationData) => {
        // Actualiza el estado local antes de la petición
        setSelectedSimulation(prev =>
            prev && prev.id === simulationId
                ? { ...prev, p_status: 'Running', progress: 0 }
                : prev
        );
        try {
            const result = await simulationService.executeSimulation(simulationId, simulationData);
            if (!result.success) {
                alert(`Error al ejecutar simulación: ${result.error}`);
            }
        } catch (error) {
            alert(`Error al ejecutar simulación: ${error.message}`);
        }
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    // Simulations to display on the current page
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedSimulations = simulations.slice(startIdx, endIdx);


    // Eliminar simulación
    const handleDeleteSimulation = async (simulation) => {
        if (!window.confirm(`Are you sure you want to delete the simulation "${simulation.sim_name}"? This action cannot be undone.`)) return;
        try {
            const response = await fetch(`${API}/simulations/${simulation.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            setSimulations(prev => prev.filter(s => s.id !== simulation.id));
            if (isModalOpen) {
                setIsModalOpen(false);
                setSelectedSimulation(null);
            }
        } catch (error) {
            alert('Error deleting simulation.');
        }
    };

    // Eliminar todas las simulaciones
    const handleDeleteAllSimulations = async () => {
        if (!window.confirm('Are you sure you want to delete ALL simulations? This action cannot be undone.')) return;
        try {
            const response = await fetch('http://localhost:5000/simulations/all', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert('All simulations have been deleted!');
                setSimulations([]);
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Request error: ' + error);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col bg-gray-100 font-sans overflow-hidden">
            {/* Panel and fixed filters above */}
            <div className="p-6 pb-0">
                {/* Statistics Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium">Total</span>
                            <span className="text-blue-400">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 2v20m10-10H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            </span>
                        </div>
                        <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium">Finished</span>
                            <span className="text-green-500">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            </span>
                        </div>
                        <span className="text-3xl font-bold text-gray-900">{stats.finished}</span>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium">Running</span>
                            <span className="text-yellow-500">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            </span>
                        </div>
                        <span className="text-3xl font-bold text-gray-900">{stats.running}</span>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium">Not started</span>
                            <span className="text-gray-400">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /></svg>
                            </span>
                        </div>
                        <span className="text-3xl font-bold text-gray-900">{stats.notStarted}</span>
                    </div>
                </div>
                {/* End of statistics panel */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Simulations</h1>
                        <p className="text-gray-500 text-base">Simulations management panel</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleNewSimulation}
                            className="flex items-center gap-2 shadow-md bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow text-base"
                        >
                            <Plus className="w-4 h-4" />
                            New Simulation
                        </button>
                        <button
                            onClick={handleDeleteAllSimulations}
                            className="flex items-center gap-2 shadow-md bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg shadow text-base"
                        >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            Delete All
                        </button>
                    </div>
                </div>
                <PaginationsButtons
                    numberOfSimulations={simulations.length}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                />
            </div>
            {/* Scrollable table, takes up the rest of the screen */}
            <div
                className="flex-1 min-h-0 pb-6 overflow-x-auto box-border" // Eliminé px-6 y agregué overflow-x-auto y box-border
                ref={tableContainerRef}
            >
                <Table simulations={paginatedSimulations} onView={handleView} onDelete={handleDeleteSimulation} />
                <SimulationModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleCreateSimulation}
                    simulation={selectedSimulation}
                    mode={modalMode}
                    setSimulations={setSimulations}
                    executeSimulation={handleExecuteSimulation}
                    onDelete={handleDeleteSimulation}
                />
            </div>
        </div>
    );
};

export default Simulations;
