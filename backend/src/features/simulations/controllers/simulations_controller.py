from flask import Blueprint, request, jsonify, send_file, current_app
from ..services.simulations_service import (
    input_data_service, load_data_service, delete_sim_service, load_data_id_service,
    load_data_porosity_service, load_data_distance_service, load_data_download_service,
    run_simulation_service, load_data_id_test_service, active_sims_service
)

simulations_bp = Blueprint('simulations', __name__)

@simulations_bp.route('/simulations', methods=['GET'])
def load_data():
    return load_data_service()

@simulations_bp.route('/simulations', methods=['POST'])
def input_data():
    return input_data_service(request)

@simulations_bp.route('/simulations/<id>', methods=['DELETE'])
def delete_sim(id):
    return delete_sim_service(id)

@simulations_bp.route('/Load_data/<id>', methods=['GET'])
def load_data_id(id):
    return load_data_id_service(id)

@simulations_bp.route('/Load_data/porosity/<v>', methods=['GET'])
def load_data_porosity(v):
    return load_data_porosity_service(v)

@simulations_bp.route('/Load_data/distance/<v>', methods=['GET'])
def load_data_distance(v):
    return load_data_distance_service(v)

@simulations_bp.route('/Load_data/download/<v>', methods=['GET'])
def load_data_download(v):
    return load_data_download_service(v)

@simulations_bp.route('/simulations/<id>/run', methods=['PUT'])
def run_simulation(id):
    return run_simulation_service(id, request)

@simulations_bp.route('/Load_data_test/<id>', methods=['GET'])
def load_data_id_test(id):
    return load_data_id_test_service(id)

@simulations_bp.route('/Active_Simulations', methods=['GET'])
def active_sims():
    return active_sims_service() 