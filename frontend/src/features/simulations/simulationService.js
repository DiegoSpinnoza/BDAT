// src/services/simulationService.js
const API_BASE_URL = 'http://localhost:5000';

class SimulationService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // ===== CONFIGURACIÓN DE ENDPOINTS =====
  get endpoints() {
    return {
      GET_SIMULATIONS: `${this.baseURL}/simulations`,
      CREATE_SIMULATION: `${this.baseURL}/simulations`,
      EXECUTE_SIMULATION: (id) => `${this.baseURL}/simulations/${id}/run`,
      DELETE_SIMULATION: (id) => `${this.baseURL}/simulations/${id}`,
      DOWNLOAD_SIMULATION: (id) => `${this.baseURL}/Load_data/download/${id}`,
    };
  }

  // ===== FUNCIONES DE CREACIÓN =====

  async createSimulation(simulationData) {
    try {
      console.log('🔄 Creando nueva simulación:', simulationData);

      if (!simulationData.sim_name || simulationData.sim_name.trim() === '') {
        throw new Error('El nombre de la simulación es requerido');
      }

      const cleanData = {
        sim_name: simulationData.sim_name.trim(),
        n_transmitter: parseInt(simulationData.n_transmitter),
        n_receiver: parseInt(simulationData.n_receiver),
        emitters_pitch: parseFloat(simulationData.emitters_pitch),
        receivers_pitch: parseFloat(simulationData.receivers_pitch),
        sensor_distance: parseFloat(simulationData.sensor_distance),
        sensor_edge_margin: parseFloat(simulationData.sensor_edge_margin),
        typical_mesh_size: parseFloat(simulationData.typical_mesh_size),
        plate_thickness: parseInt(simulationData.plate_thickness),
        porosity:  parseFloat(simulationData.porosity),
        attenuation: (simulationData.attenuation),
      };

      const response = await fetch(this.endpoints.CREATE_SIMULATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        const msg = result.message || `Error del servidor: ${response.status}`;
        throw new Error(msg);
      }
  
      console.log('✅ Simulación creada exitosamente:', result);
      return result.simulation || result;
    } catch (error) {
      console.error('❌ Error al crear simulación:', error.message);
      throw error;
    }
  }

  // ===== FUNCIONES DE LECTURA =====

  async getSimulations() {
    try {
      console.log('📋 Obteniendo simulaciones...');
      const response = await fetch(this.endpoints.GET_SIMULATIONS);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Simulaciones obtenidas:', data);
      return data;
    } catch (error) {
      console.error('❌ Error al obtener simulaciones:', error);
      throw error;
    }
  }

  // ===== FUNCIONES DE ACTUALIZACIÓN =====

  async executeSimulation(simulationId, simulationData) {
    try {
      const response = await fetch(this.endpoints.EXECUTE_SIMULATION(simulationId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          n_transmitter: simulationData.n_transmitter,
          n_receiver: simulationData.n_receiver,
          emitters_pitch: simulationData.emitters_pitch,
          receivers_pitch: simulationData.receivers_pitch,
          sensor_edge_margin: simulationData.sensor_edge_margin,
          typical_mesh_size: simulationData.typical_mesh_size,
          sensor_distance: simulationData.sensor_distance,
          plate_thickness: simulationData.plate_thickness,
          plate_length: simulationData.plate_length,
          porosity: simulationData.porosity,
          attenuation: simulationData.attenuation,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al ejecutar simulación');
      }

      const result = await response.json();
      console.log('✅ Simulación ejecutada exitosamente:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error al ejecutar simulación:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== FUNCIONES DE ELIMINACIÓN =====

  async deleteSimulation(simulationId) {
    try {
      console.log('🗑️ Eliminando simulación:', simulationId);

      const response = await fetch(this.endpoints.DELETE_SIMULATION(simulationId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Simulación eliminada exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ Error al eliminar simulación:', error);
      throw error;
    }
  }

  // ===== FUNCIONES ADICIONALES =====

  async downloadSimulation(simulationId, filename = null) {
    try {
      console.log('📥 Descargando simulación:', simulationId);

      const response = await fetch(this.endpoints.DOWNLOAD_SIMULATION(simulationId));

      if (!response.ok) {
        throw new Error('No se pudo descargar el archivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = url;
      element.download = filename || `simulacion_${simulationId}.mat`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      window.URL.revokeObjectURL(url);

      console.log('✅ Simulación descargada exitosamente');
    } catch (error) {
      console.error('❌ Error al descargar simulación:', error);
      throw error;
    }
  }

  // ===== FUNCIONES DE VALIDACIÓN =====

  validateSimulationData(simulationData) {
    const errors = [];

    if (!simulationData.sim_name || simulationData.sim_name.trim() === '') {
      errors.push('El nombre de la simulación es requerido');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ===== FUNCIONES DE UTILIDAD =====

  mapStatus(status) {
    switch (status) {
      case 0:
        return 'Not started';
      case 1:
        return 'Pending';
      case 2:
        return 'Finished';
      case 3:
        return 'Error';
      default:
        return 'Unknown';
    }
  }

  getProgress(status) {
    switch (status) {
      case 0:
        return 0;
      case 1:
        return 50;
      case 2:
        return 100;
      default:
        return 0;
    }
  }
}

// Exportar instancia singleton
export default new SimulationService();
