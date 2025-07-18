from dotenv import load_dotenv
from flask import Flask
from flask_mysqldb import MySQL
from flask_cors import CORS
from flask_socketio import SocketIO
import os
import sys
import eventlet

# Parcheo para eventlet
eventlet.monkey_patch()
load_dotenv()

dockerRoute = "src/features/simulations/services/Reidmen/"
sys.path.append(dockerRoute + "Reidmen Fenics/ipnyb propagation")

# Importar blueprints
from features.simulations.controllers.simulations_controller import simulations_bp

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuración de la base de datos
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER')
app.config['MYSQL_PORT'] = int(os.getenv('MYSQL_PORT'))
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB')
app.config['CORS_HEADERS'] = os.getenv('CORS_HEADERS')
app.config['SQLALCHEMY_POOL_RECYCLE'] = 28800

mysql = MySQL(app)
CORS(app)
app.secret_key = "110997"

# Exponer mysql y socketio en current_app
app.mysql = mysql
app.socketio = socketio

# Registrar blueprint
app.register_blueprint(simulations_bp)

@app.route('/')
def Index():
    return '<h1>API is Working c:<h1>'

if __name__ == '__main__':
    socketio.run(app, port=5000, host='0.0.0.0', debug=True)
