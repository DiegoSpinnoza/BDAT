import React, { useState, useEffect } from 'react';
import { X, Play, Loader, Download } from 'lucide-react';

const API = 'http://localhost:5000';

const SimulationModal = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    simulation = null, 
    mode = 'view', // 'view' or 'create'
    setSimulations = null,
    executeSimulation,
    onDelete = null
}) => {
    const [formData, setFormData] = useState({
        sim_name: '',
        n_transmitter: '',
        n_receiver: '',
        emitters_pitch: '',
        receivers_pitch: '',
        sensor_distance: '',
        sensor_edge_margin: '',
        typical_mesh_size: '',
        plate_thickness: '',
        porosity: '',
        attenuation: 'Yes',
        p_status: "Not started"
    });
    const [isExecuting, setIsExecuting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Initialize form data when simulation is provided (view mode)
    useEffect(() => {
        if (simulation && mode === 'view') {
            setFormData({
                sim_name: simulation.sim_name || '',
                n_transmitter: simulation.n_transmitter || 1,
                n_receiver: simulation.n_receiver || 1,
                emitters_pitch: simulation.emitters_pitch || 1,
                receivers_pitch: simulation.receivers_pitch || 1,
                sensor_distance: simulation.sensor_distance || 1,
                sensor_edge_margin: simulation.sensor_edge_margin || 1,
                typical_mesh_size: simulation.typical_mesh_size || 1,
                plate_thickness: simulation.plate_thickness || 1,
                porosity: simulation.porosity || 1,
                attenuation: simulation.attenuation || "Yes",
                p_status: simulation.p_status || "Not started"
            });
        }
    }, [simulation, mode]);

    // Limpiar el formulario al abrir en modo 'create'
    useEffect(() => {
        if (isOpen && mode === 'create') {
            setFormData({
                sim_name: '',
                n_transmitter: '',
                n_receiver: '',
                emitters_pitch: '',
                receivers_pitch: '',
                sensor_distance: '',
                sensor_edge_margin: '',
                typical_mesh_size: '',
                plate_thickness: '',
                porosity: '',
                attenuation: 'Yes',
                p_status: "Not started"
            });
        }
    }, [isOpen, mode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === 'create' && onSubmit) {
            // Validación: todos los campos deben estar llenos y ser válidos
            const requiredFields = [
                'sim_name', 'n_transmitter', 'n_receiver', 'emitters_pitch', 'receivers_pitch',
                'sensor_distance', 'sensor_edge_margin', 'typical_mesh_size', 'plate_thickness', 'porosity', 'attenuation'
            ];
            for (const field of requiredFields) {
                if (
                    formData[field] === '' ||
                    formData[field] === null ||
                    formData[field] === undefined ||
                    (typeof formData[field] === 'string' && formData[field].trim() === '')
                ) {
                    alert('Please complete all fields before continuing.');
                    return;
                }
            }
            // Validaciones numéricas estrictas
            const numericFields = [
                'n_transmitter', 'n_receiver', 'emitters_pitch', 'receivers_pitch',
                'sensor_distance', 'sensor_edge_margin', 'typical_mesh_size', 'plate_thickness', 'porosity'
            ];
            for (const field of numericFields) {
                const value = Number(formData[field]);
                if (isNaN(value)) {
                    alert('Please enter only valid numbers in the numeric fields.');
                    return;
                }
            }
            if (
                Number(formData.n_transmitter) < 1 ||
                Number(formData.n_receiver) < 1 ||
                Number(formData.emitters_pitch) <= 0 ||
                Number(formData.receivers_pitch) <= 0 ||
                Number(formData.sensor_distance) <= 0 ||
                Number(formData.typical_mesh_size) <= 0 ||
                Number(formData.plate_thickness) <= 0 ||
                Number(formData.porosity) < 0 || Number(formData.porosity) > 1
            ) {
                alert('Please enter valid and positive values in the numeric fields.');
                return;
            }
            // Validación de attenuation
            if (formData.attenuation !== 'Yes' && formData.attenuation !== 'No') {
                alert('Please select a valid option for Attenuation.');
                return;
            }
            // Generar la simulación nueva
            const newSimulation = {
                ...formData,
                n_transmitter: Number(formData.n_transmitter),
                n_receiver: Number(formData.n_receiver),
                emitters_pitch: Number(formData.emitters_pitch),
                receivers_pitch: Number(formData.receivers_pitch),
                sensor_distance: Number(formData.sensor_distance),
                sensor_edge_margin: Number(formData.sensor_edge_margin),
                typical_mesh_size: Number(formData.typical_mesh_size),
                plate_thickness: Number(formData.plate_thickness),
                porosity: Number(formData.porosity),
                attenuation: Number(formData.attenuation == "Yes" ? 1 : 0),
            };
            onSubmit(newSimulation);
        }
        onClose();

        // Reset form for create mode
        if (mode === 'create') {
            setFormData({
                sim_name: '',
                n_transmitter: '',
                n_receiver: '',
                emitters_pitch: '',
                receivers_pitch: '',
                sensor_distance: '',
                sensor_edge_margin: '',
                typical_mesh_size: '',
                plate_thickness: '',
                porosity: '',
                attenuation: '',
                p_status: "Not started"
            });
        }
    };


    // Descargar archivo de simulación terminada
    const downloadSimulation = async (id) => {
        setIsDownloading(true);
        try {
            const resDownload = await fetch(`${API}/Load_data/download/${id}`);
            if (!resDownload.ok) throw new Error('No se pudo descargar el archivo');
            const blob = await resDownload.blob();
            const url = window.URL.createObjectURL(blob);
            const element = document.createElement('a');
            element.href = url;
            // Nombre sugerido
            element.download = `simulacion_${id}.mat`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Error al descargar la simulación');
        } finally {
            setIsDownloading(false);
        }
    };

    // Función para abortar simulación (placeholder)
    const handleAbortSimulation = async () => {
        alert('Funcionalidad de abortar simulación aún no implementada.');
    };

    if (!isOpen) return null;

    const isViewMode = mode === 'view';
    const title = isViewMode ? 'Simulation Details' : 'New Simulation';
    const submitButtonText = isViewMode ? 'Close' : 'Create Simulation';
    const canExecute = isViewMode && simulation && simulation.p_status === 'Not started' && !isExecuting;
    const canDownload = isViewMode && simulation && (simulation.p_status === 2 || simulation.p_status === 'Finished');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-2xl shadow-2xl p-0 max-w-xl w-full relative animate-fade-in max-h-[90vh] overflow-y-auto modal-scroll border border-gray-100">
                {/* Encabezado minimalista */}
                <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 text-center w-full">{title}</h2>
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 text-gray-300 hover:text-gray-500 focus:outline-none rounded-full p-1 transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                {/* Tarjeta de datos clave */}
                {isViewMode && simulation && (
                    <div className="mx-8 mt-6 mb-8 p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-2 shadow-sm">
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div><span className="font-semibold text-gray-500">ID:</span> <span className="text-gray-800">{simulation.id}</span></div>
                            {/* <div><span className="font-semibold text-gray-500">Code:</span> <span className="text-gray-800">{simulation.code}</span></div> */}
                            <div className="flex items-center gap-2"><span className="font-semibold text-gray-500">Status:</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    simulation.p_status === '2' ? 'bg-green-100 text-green-700' :
                                    simulation.p_status === '1' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-500'
                                }`}>
                                    {simulation.p_status === '0' ? 'Not started' : simulation.p_status === '1' ? 'In progress' : simulation.p_status === '2' ? 'Finished' : simulation.p_status}
                                </span>
                            </div>
                            {/* Solo mostrar progreso si está en estado '1' */}
                            {simulation.p_status === '1' && (
                                <div><span className="font-semibold text-gray-500">Progress:</span> <span className="text-gray-800">{simulation.progress}%</span></div>
                            )}
                        </div>
                    </div>
                )}
                {/* Mensajes de estado */}
                <div className="mx-8">
                    {simulation && simulation.p_status === '1' && (
                        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex items-center gap-2">
                            <span className="text-yellow-500 text-lg">⏳</span>
                            <span className="text-sm text-yellow-800">This simulation is in progress. You can see the progress in the main table.</span>
                        </div>
                    )}
                    {simulation && simulation.p_status === '2' && (
                        <div className="mb-6 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2">
                            <span className="text-green-500 text-lg">✅</span>
                            <span className="text-sm text-green-800">This simulation has been completed successfully.</span>
                        </div>
                    )}
                </div>
                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-6 px-8 pb-8">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Simulation Name  
                            </label>
                            <input
                                type="text"
                                name="sim_name"
                                value={formData.sim_name}
                                onChange={handleInputChange}
                                required={!isViewMode}
                                disabled={isViewMode}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 text-sm ${
                                    isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                                placeholder="Enter simulation name"
                            />
                        </div>
                    </div>
                    {/* Emitters and Receivers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Number of Emitters
                            </label>
                            <input
                                type="number"
                                name="n_transmitter"
                                value={formData.n_transmitter}
                                onChange={handleInputChange}
                                min="1"
                                required={!isViewMode}
                                disabled={isViewMode}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 text-sm ${
                                    isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Number of Receivers
                            </label>
                            <input
                                type="number"
                                name="n_receiver"
                                value={formData.n_receiver}
                                onChange={handleInputChange}
                                min="1"
                                required={!isViewMode}
                                disabled={isViewMode}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 text-sm ${
                                    isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            />
                        </div>
                    </div>
                    {/* Pitch Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Emitters Pitch
                            </label>
                            <input
                                type="number"
                                name="emitters_pitch"
                                value={formData.emitters_pitch}
                                onChange={handleInputChange}
                                min="0.1"
                                step="0.1"
                                required={!isViewMode}
                                disabled={isViewMode}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 text-sm ${
                                    isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Receivers Pitch
                            </label>
                            <input
                                type="number"
                                name="receivers_pitch"
                                value={formData.receivers_pitch}
                                onChange={handleInputChange}
                                min="0.1"
                                step="0.1"
                                required={!isViewMode}
                                disabled={isViewMode}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 text-sm ${
                                    isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            />
                        </div>
                    </div>
                    {/* Distance and Edge Margin */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Distance
                            </label>
                            <input
                                type="number"
                                name="sensor_distance"
                                value={formData.sensor_distance}
                                onChange={handleInputChange}
                                min="0.1"
                                step="0.1"
                                required={!isViewMode}
                                disabled={isViewMode}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 text-sm ${
                                    isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Edge Margin
                            </label>
                            <input
                                type="number"
                                name="sensor_edge_margin"
                                value={formData.sensor_edge_margin}
                                onChange={handleInputChange}
                                min="0"
                                step="0.1"
                                required={!isViewMode}
                                disabled={isViewMode}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 text-sm ${
                                    isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            />
                        </div>
                    </div>
                    {/* Mesh and Plate Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Mesh Size
                            </label>
                            <input
                                type="number"
                                name="typical_mesh_size"
                                value={formData.typical_mesh_size}
                                onChange={handleInputChange}
                                min="0.1"
                                step="0.1"
                                required={!isViewMode}
                                disabled={isViewMode}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 text-sm ${
                                    isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Plate Thickness
                            </label>
                            <input
                                type="number"
                                name="plate_thickness"
                                value={formData.plate_thickness}
                                onChange={handleInputChange}
                                min="0.1"
                                step="0.1"
                                required={!isViewMode}
                                disabled={isViewMode}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 text-sm ${
                                    isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            />
                        </div>
                    </div>
                    {/* Porosity and Attenuation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Porosity
                            </label>
                            <input
                                type="number"
                                name="porosity"
                                value={formData.porosity}
                                onChange={handleInputChange}
                                min="0"
                                max="1"
                                step="0.01"
                                required={!isViewMode}
                                disabled={isViewMode}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 text-sm ${
                                    isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Attenuation
                            </label>
                            <select
                                name="attenuation"
                                value={formData.attenuation}
                                onChange={handleInputChange}
                                required={!isViewMode}
                                disabled={isViewMode}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 text-sm ${
                                    isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>
                    {/* Action buttons below */}
                    {isViewMode && (
                        <div className="flex flex-col gap-3 pt-8 border-t border-gray-100 mt-8">
                            {simulation && simulation.p_status === "Not started" && (
                                <button
                                    onClick={() => executeSimulation(simulation.id, simulation)}
                                    disabled={isExecuting}
                                    type="button"
                                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow transition-all duration-150 w-full ${
                                        isExecuting 
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                                >
                                    {isExecuting ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Executing...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4" />
                                            Execute Simulation
                                        </>
                                    )}
                                </button>
                            )}
                            {simulation && simulation.p_status === 'Running' && (
                                <button
                                    onClick={handleAbortSimulation}
                                    type="button"
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow bg-red-500 hover:bg-red-600 text-white transition-all duration-150 w-full"
                                >
                                    <X className="w-4 h-4" />
                                    Abort Simulation
                                </button>
                            )}
                            {simulation && simulation.p_status === 'Finished' && (
                                <button
                                    onClick={() => downloadSimulation(simulation.id)}
                                    disabled={isDownloading}
                                    type="button"
                                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow transition-all duration-150 w-full ${
                                        isDownloading 
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            Download Simulation
                                        </>
                                    )}
                                </button>
                            )}
                            {/* Delete button */}
                            {simulation && onDelete && (
                                <button
                                    onClick={() => onDelete(simulation)}
                                    type="button"
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 transition-all duration-150 w-full"
                                >
                                    <X className="w-4 h-4" />
                                    Delete Simulation
                                </button>
                            )}
                        </div>
                    )}
                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                        >
                            {isViewMode ? 'Close' : 'Cancel'}
                        </button>
                        {!isViewMode && (
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm shadow"
                            >
                                {submitButtonText}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SimulationModal; 