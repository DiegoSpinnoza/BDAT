from flask import jsonify, send_file, current_app
from io import BytesIO
import traceback
import os
import sys
from ..models.simulation_model import (
    insert_simulation, get_all_simulations, delete_simulation, get_simulation_by_id,
    get_simulation_by_porosity, get_simulation_by_distance, get_simulation_file,
    update_simulation_status, update_simulation_result, get_simulation_count_running
)

# Importar los módulos de simulación solo una vez
# Ajustar el sys.path para importar correctamente los scripts
DOCKER_ROUTE = "src/features/simulations/services/Reidmen/"
FENICS_PATH = DOCKER_ROUTE + "Reidmen Fenics/ipnyb propagation"
if FENICS_PATH not in sys.path:
    sys.path.append(FENICS_PATH)
try:
    Reidmen = __import__("TimeSimTransIsoMatCij2D_test")
    ReidmenFreq = __import__("SimFreqDomain2D")
except Exception as e:
    Reidmen = None
    ReidmenFreq = None
    print("Error importando scripts de simulación:", e)

def input_data_service(request):
    try:
        data = request.json
        sim_name = data['sim_name']
        n_transmitter = data['n_transmitter']
        n_receiver = data['n_receiver']
        sensor_distance = data['sensor_distance']
        emitters_pitch = data['emitters_pitch']
        receivers_pitch = data['receivers_pitch']
        sensor_edge_margin = data['sensor_edge_margin']
        typical_mesh_size = data['typical_mesh_size']
        plate_thickness = data['plate_thickness']
        porosity = data['porosity']
        attenuation = data['attenuation']

        isValid, parameter, typeReceived = ValidData(
            n_transmitter, n_receiver, emitters_pitch,
            receivers_pitch, sensor_edge_margin,
            sensor_distance, plate_thickness, porosity
        )

        if isValid:
            plate_length = sensor_edge_margin * 2 + n_transmitter * emitters_pitch + sensor_distance + n_receiver * receivers_pitch
            status = "Not started"
            sim_data = (
                sim_name, n_transmitter, n_receiver, emitters_pitch, receivers_pitch,
                sensor_distance, sensor_edge_margin, typical_mesh_size, plate_thickness,
                plate_length, porosity, attenuation, status
            )
            doc = insert_simulation(current_app.mysql, sim_data)
            new_sim = {
                'id': doc[0],
                'sim_name': doc[1],
                'n_transmitter': doc[2],
                'n_receiver': doc[3],
                'emitters_pitch': doc[4],
                'receivers_pitch': doc[5],
                'sensor_distance': doc[7],
                'sensor_edge_margin': float(doc[8]),
                'typical_mesh_size': doc[9],
                'plate_thickness': doc[10],
                'plate_length': doc[11],
                'porosity': float(doc[12]),
                'attenuation': doc[13],
                'p_status': doc[15]
            }
            notificar_estado_simulacion(new_sim['id'], "Not started")
            current_app.socketio.emit('nueva_simulacion', new_sim)
            return jsonify({"status": "success", "simulation": new_sim})
        else:
            error_msg = f"Error in data type: {parameter} <{typeReceived}>"
            return jsonify({"status": "error", "message": error_msg}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def load_data_service():
    data = get_all_simulations(current_app.mysql)
    data_t = []
    for doc in data:
        data_t.append({
            'id': doc[0],
            'sim_name': doc[1],
            'n_transmitter': doc[2],
            'n_receiver': doc[3],
            'emitters_pitch': doc[4],
            'receivers_pitch': doc[5],
            'sensor_distance': doc[7],
            'sensor_edge_margin': float(doc[8]),
            'typical_mesh_size': doc[9],
            'plate_thickness': doc[10],
            'plate_length': doc[11],
            'porosity': float(doc[12]),
            'attenuation': doc[13],
            'p_status' : doc[15]    
        })
    return jsonify(data_t)

def delete_sim_service(id):
    delete_simulation(current_app.mysql, id)
    return jsonify("DELETE", id)

def load_data_id_service(id):
    data = get_simulation_by_id(current_app.mysql, id)
    data_t = []
    for doc in data:
        data_t.append({
            'id': doc[0],
            'code_simulation': doc[1],
            'sim_name': doc[2],
            'n_transmitter': doc[3],
            'n_receiver': doc[4],
            'emitters_pitch': doc[5],
            'receivers_pitch': doc[6],
            'sensor_distance': doc[8],
            'sensor_edge_margin': float(doc[9]),
            'typical_mesh_size': doc[10],
            'plate_thickness': doc[11],
            'plate_length': doc[12],
            'porosity': float(doc[13]),
            'attenuation': doc[14],
            'p_status' : doc[16]    
        })
    return jsonify(data_t)

def load_data_porosity_service(v):
    data = get_simulation_by_porosity(current_app.mysql, v)
    data_t = []
    for doc in data:
        data_t.append({
            'id': doc[0],
            'code_simulation': doc[1],
            'sim_name': doc[2],
            'n_transmitter': doc[3],
            'n_receiver': doc[4],
            'emitters_pitch': doc[5],
            'receivers_pitch': doc[6],
            'sensor_distance': doc[8],
            'sensor_edge_margin': float(doc[9]),
            'typical_mesh_size': doc[10],
            'plate_thickness': doc[11],
            'plate_length': doc[12],
            'porosity': float(doc[13]),
            'attenuation': doc[14],
            'p_status' : doc[16]    
        })
    return jsonify(data_t)

def load_data_distance_service(v):
    data = get_simulation_by_distance(current_app.mysql, v)
    data_t = []
    for doc in data:
        data_t.append({
            'id': doc[0],
            'code_simulation': doc[1],
            'sim_name': doc[2],
            'n_transmitter': doc[3],
            'n_receiver': doc[4],
            'emitters_pitch': doc[5],
            'receivers_pitch': doc[6],
            'sensor_distance': doc[8],
            'sensor_edge_margin': float(doc[9]),
            'typical_mesh_size': doc[10],
            'plate_thickness': doc[11],
            'plate_length': doc[12],
            'porosity': float(doc[13]),
            'attenuation': doc[14],
            'p_status' : doc[16]    
        })
    return jsonify(data_t)

def load_data_download_service(v):
    data = get_simulation_file(current_app.mysql, v)
    filedata = data[0]
    filename = data[1]
    return send_file(BytesIO(filedata), as_attachment = True, download_name = filename, mimetype='mat')

def run_simulation_service(id, request):
    try:
        data = request.json
        n_transmitter = data['n_transmitter']
        n_receiver = data['n_receiver']
        emitters_pitch = data['emitters_pitch']
        receivers_pitch = data['receivers_pitch']
        sensor_edge_margin = data['sensor_edge_margin']
        typical_mesh_size = data['typical_mesh_size']
        sensor_distance = data['sensor_distance']
        plate_thickness = data['plate_thickness']
        porosity = data['porosity']
        plate_length = data['plate_length']
        attenuation = data['attenuation']
        update_simulation_status(current_app.mysql, id, "Running")
        doc = get_simulation_by_id(current_app.mysql, id)[0]
        updated_sim = {
            'id': doc[0],
            'sim_name': doc[1],
            'n_transmitter': doc[2],
            'n_receiver': doc[3],
            'emitters_pitch': doc[4],
            'receivers_pitch': doc[5],
            'sensor_distance': doc[7],
            'sensor_edge_margin': float(doc[8]),
            'typical_mesh_size': doc[9],
            'plate_thickness': doc[10],
            'plate_length': doc[11],
            'porosity': float(doc[12]),
            'attenuation': doc[13],
            'p_status': doc[15],
            'result_step_01': doc[17],
            'time': doc[18],
            'image': doc[19]
        }
        def run_simulation_background(app):
            with app.app_context():
                try:
                    notificar_estado_simulacion(id, "Running")
                    # Ejecutar la simulación real
                    if attenuation == 1:
                        filename, time = ReidmenFreq.fmain(
                            n_transmitter, n_receiver, sensor_distance,
                            emitters_pitch, receivers_pitch, sensor_edge_margin,
                            typical_mesh_size, plate_thickness, plate_length,
                            None, porosity, attenuation, id
                        )
                    else:
                        filename, time = Reidmen.fmain(
                            n_transmitter, n_receiver, sensor_distance,
                            emitters_pitch, receivers_pitch, sensor_edge_margin,
                            typical_mesh_size, plate_thickness, plate_length,
                            None, porosity, attenuation, id
                        )
                    # Verificar y leer el archivo generado
                    filepath = DOCKER_ROUTE + "Reidmen Fenics/ipnyb propagation/Files_mat/" + filename
                    if not os.path.exists(filepath):
                        raise FileNotFoundError(f"Archivo '{filename}' no encontrado")
                    with open(filepath, 'rb') as f:
                        file = f.read()
                    # Actualizar la base de datos
                    update_simulation_result(current_app.mysql, id, filename, "Finished", time, file)
                    # Eliminar el archivo temporal
                    os.remove(filepath)
                    notificar_estado_simulacion(id, "Finished")
                except Exception:
                    update_simulation_status(current_app.mysql, id, "Error")
                    notificar_estado_simulacion(id, "Error")
        current_app.socketio.start_background_task(run_simulation_background, current_app._get_current_object())
        return jsonify({"status": "success", "simulation": updated_sim})
    except Exception:
        return jsonify({
            "status": "error",
            "message": "Error al iniciar la simulación",
            "details": traceback.format_exc()
        }), 500

def load_data_id_test_service(id):
    data = get_simulation_by_id(current_app.mysql, id)
    data_t = []
    for doc in data:
        data_t.append({
            'id': doc[0],
            'code_simulation': doc[1],
            'sim_name': doc[2],
            'n_transmitter': doc[3],
            'n_receiver': doc[4],
            'emitters_pitch': doc[5],
            'receivers_pitch': doc[6],
            'sensor_distance': doc[8],
            'sensor_edge_margin': float(doc[9]),
            'typical_mesh_size': doc[10],
            'plate_thickness': doc[11],
            'plate_length': doc[12],
            'porosity': float(doc[13]),
            'attenuation': doc[14],
            'p_status' : doc[16]    
        })
    return jsonify(data_t)

def active_sims_service():
    data = get_simulation_count_running(current_app.mysql)
    data_t = {"count" : data[0]}
    return jsonify(data_t)

def ValidData(n_transmitter, n_receiver, emitters_pitch, recivers_pitch, sensor_edge, distance, plate_thickness, porosity):
    if(type(n_transmitter) is not int):
        return False, "n_transmitter", str(type(n_transmitter))
    elif(type(n_receiver) is not int):
        return False, "n_receiver", str(type(n_receiver))
    elif(type(emitters_pitch) is not int and type(emitters_pitch) is not float):
        return False, "emitters_pitch", str(type(emitters_pitch))
    elif(type(recivers_pitch) is not int and type(recivers_pitch) is not float):
        return False, "recivers_pitch", str(type(recivers_pitch))      
    elif(type(sensor_edge) is not int and type(sensor_edge) is not float):
        return False, "sensor_edge", str(type(sensor_edge))    
    elif(type(distance) is not int and type(distance) is not float):
        return False, "distance", str(type(distance))
    elif(type(plate_thickness) is not int and type(plate_thickness) is not float):
        return False, "plate_thinckenss", str(type(plate_thickness))
    elif(type(porosity) is not int and type(porosity) is not float):
        return False, "porosity", str(type(porosity))
    else:
        return True, "", ""

def notificar_estado_simulacion(id, estado):
    current_app.socketio.emit('estado_simulacion', {'id': id, 'estado': estado}) 