import joblib
import pickle
import tensorflow as tf
from tensorflow.keras.models import load_model as load_keras_model

class ModelService:
    """Manages loading and using ML models for prediction"""
    
    def __init__(self, model_path, lstm_path, scaler_path, encoder_path, 
                 features_path, config_path):
        self.model_path = model_path
        self.lstm_path = lstm_path
        self.scaler_path = scaler_path
        self.encoder_path = encoder_path
        self.features_path = features_path
        self.config_path = config_path
        
        # Initialize model variables
        self.model = None
        self.lstm_model = None
        self.feature_scaler = None
        self.label_encoder = None
        self.feature_columns = None
        self.model_config = None
        
        # Load models on initialization
        self.load_models()
    
    def load_models(self):
        """Load traditional and LSTM models"""
        self._load_traditional_model()
        self._load_lstm_model()
        
        return self.model is not None and self.lstm_model is not None
    
    def _load_traditional_model(self):
        """Load traditional ML model"""
        try:
            self.model = joblib.load(self.model_path)
            print("Traditional model loaded successfully")
            return True
        except Exception as e:
            print(f"Error loading traditional model: {e}")
            return False
    
    def _load_lstm_model(self):
        """Load LSTM model and preprocessing objects"""
        try:
            # Load the LSTM model
            self.lstm_model = load_keras_model(self.lstm_path)
            
            # Load the feature scaler
            with open(self.scaler_path, 'rb') as f:
                self.feature_scaler = pickle.load(f)
                
            # Load the label encoder
            with open(self.encoder_path, 'rb') as f:
                self.label_encoder = pickle.load(f)
                
            # Load feature columns
            with open(self.features_path, 'rb') as f:
                self.feature_columns = pickle.load(f)
                
            # Load model config
            with open(self.config_path, 'rb') as f:
                self.model_config = pickle.load(f)
                
            print("LSTM model loaded successfully")
            return True
        except Exception as e:
            print(f"Error loading LSTM model: {e}")
            return False
    
    def get_sequence_length(self):
        """Get sequence length from model config"""
        if self.model_config:
            return self.model_config.get('sequence_length', 6)
        return 6
    
    def predict_traditional(self, processed_data):
        """Make prediction with traditional model"""
        if self.model is None:
            return None
            
        try:
            # Remove columns not needed for prediction
            prediction_columns = [col for col in processed_data.columns
                                if col not in ['Timestamp', 'Plant_Health_Status']]
            
            # Make prediction
            X_pred = processed_data[prediction_columns]
            prediction = self.model.predict(X_pred)[0]
            probabilities = self.model.predict_proba(X_pred)[0]
            classes = self.model.classes_
            
            result = {
                "predicted_health": prediction,
                "confidence": {class_name: float(prob) for class_name, prob in zip(classes, probabilities)}
            }
            
            return result
        except Exception as e:
            print(f"Error predicting with traditional model: {e}")
            return None
    
    def predict_lstm(self, X_sequence):
        """Make prediction with LSTM model"""
        if self.lstm_model is None or self.label_encoder is None:
            return None
            
        try:
            # Make prediction
            prediction = self.lstm_model.predict(X_sequence, verbose=0)[0]
            pred_class = int(prediction.argmax())
            class_name = self.label_encoder.classes_[pred_class]
            
            result = {
                "predicted_health": class_name,
                "confidence": {
                    name: float(prob) for name, prob in 
                    zip(self.label_encoder.classes_, prediction)
                }
            }
            
            return result
        except Exception as e:
            print(f"Error predicting with LSTM model: {e}")
            return None