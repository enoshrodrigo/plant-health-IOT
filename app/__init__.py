from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
import os

# App configuration
LSTM_MODEL_PATH = "./config/plant_health_lstm_model.h5"
FEATURE_SCALER_PATH = "./config/feature_scaler.pkl"
LABEL_ENCODER_PATH = "./config/label_encoder.pkl"
FEATURE_COLUMNS_PATH = "./config/feature_columns.pkl"
MODEL_CONFIG_PATH = "./config/model_config.pkl"
MODEL_PATH = "./data/processed/plant_health_prediction_model.joblib"
HISTORY_FILE = "./data/history/plant_history.json"

def create_app():
    # Create Flask app
    flask_app = Flask(__name__)
    flask_app.config['SECRET_KEY'] = 'plant-monitoring-secret-key'
    
    # Enable CORS
    CORS(flask_app, resources={r"/*": {"origins": "*"}})
    
    # Initialize SocketIO
    socketio = SocketIO(flask_app, cors_allowed_origins="*")
    
    # Ensure directories exist
    os.makedirs("./data/processed", exist_ok=True)
    
    # Import services
    from app.services.data_service import DataService
    from app.services.model_service import ModelService
    from app.services.forecast_service import ForecastService
    
    # Initialize services
    data_service = DataService(HISTORY_FILE)
    model_service = ModelService(MODEL_PATH, LSTM_MODEL_PATH, FEATURE_SCALER_PATH, 
                                LABEL_ENCODER_PATH, FEATURE_COLUMNS_PATH, MODEL_CONFIG_PATH)
    forecast_service = ForecastService(model_service, data_service)
    
    # Register routes
    from app.routes.api import register_routes
    register_routes(flask_app, socketio, model_service, data_service, forecast_service)
    
    # Create an app instance object that holds both the Flask app and socketio
    class AppInstance:
        def __init__(self, flask_app, socketio):
            self.flask_app = flask_app
            self.socketio = socketio
    
    return AppInstance(flask_app, socketio)