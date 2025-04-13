import pandas as pd
import numpy as np
import math
from datetime import datetime, timedelta
from app.utils.data_processor import process_for_prediction, prepare_lstm_sequence, process_for_lstm

class ForecastService:
    """Service for generating plant health forecasts"""
    
    def __init__(self, model_service, data_service):
        self.model_service = model_service
        self.data_service = data_service
    
    def generate_forecast(self, plant_id, days=3):
        """Generate forecast using best available model"""
        # Try LSTM model if available
        if self.model_service.lstm_model is not None:
            lstm_forecast = self.generate_lstm_forecast(plant_id, days)
            if lstm_forecast is not None:
                return lstm_forecast
        
        # Fall back to traditional model
        return self.generate_traditional_forecast(plant_id, days)
    
    def generate_lstm_forecast(self, plant_id, days=3):
        """Generate forecast using LSTM model"""
        try:
            # Prepare sequence for LSTM
            X_sequence = prepare_lstm_sequence(
                plant_id, 
                self.data_service.plant_data, 
                self.model_service
            )
            
            if X_sequence is None:
                print("Could not prepare LSTM sequence.")
                return None
                
            # Get current values for building forecast
            plant_history = self.data_service.get_plant_data(plant_id)
            plant_history['Timestamp'] = pd.to_datetime(plant_history['Timestamp'])
            plant_history = plant_history.sort_values('Timestamp')
            latest_data = plant_history.iloc[-1:].copy()
            timestamp = latest_data['Timestamp'].iloc[0]
                
            # Create forecast datapoints
            forecast = []
            
            # Save first data point as current
            current_entry = {
                'date': timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                'timestamp': timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                'forecast_type': 'current',
                'soil_temperature': float(latest_data['Soil_Temperature'].iloc[0]),
                'humidity': float(latest_data['Humidity'].iloc[0]),
                'soil_moisture': float(latest_data['Soil_Moisture'].iloc[0])
            }
            
            # Make prediction for current point
            prediction = self.model_service.predict_lstm(X_sequence)
            if prediction:
                current_entry['predicted_health'] = prediction['predicted_health']
                current_entry['confidence'] = prediction['confidence']
            
            # Add optional fields
            for src, dst in [('Ambient_Temperature', 'ambient_temperature'), 
                         ('Light_Intensity', 'light_intensity'),
                         ('Soil_pH', 'soil_ph'),
                         ('Nitrogen_Level', 'nitrogen'),
                         ('Phosphorus_Level', 'phosphorus'),
                         ('Potassium_Level', 'potassium')]:
                if src in latest_data.columns:
                    current_entry[dst] = float(latest_data[src].iloc[0])
            
            forecast.append(current_entry)
            
            # Generate future forecasts
            current_sequence = X_sequence.copy()
            
            # Initial values for forecast
            current_values = {
                'Soil_Temperature': float(latest_data['Soil_Temperature'].iloc[0]),
                'Humidity': float(latest_data['Humidity'].iloc[0]),
                'Soil_Moisture': float(latest_data['Soil_Moisture'].iloc[0]),
                'Light_Intensity': float(latest_data['Light_Intensity'].iloc[0]) if 'Light_Intensity' in latest_data.columns else 500,
                'Ambient_Temperature': float(latest_data['Ambient_Temperature'].iloc[0]) if 'Ambient_Temperature' in latest_data.columns else 22,
                'Soil_pH': float(latest_data['Soil_pH'].iloc[0]) if 'Soil_pH' in latest_data.columns else 6.5,
                'Nitrogen_Level': float(latest_data['Nitrogen_Level'].iloc[0]) if 'Nitrogen_Level' in latest_data.columns else 30,
                'Phosphorus_Level': float(latest_data['Phosphorus_Level'].iloc[0]) if 'Phosphorus_Level' in latest_data.columns else 30,
                'Potassium_Level': float(latest_data['Potassium_Level'].iloc[0]) if 'Potassium_Level' in latest_data.columns else 30
            }
            
            # Generate future timestamps
            start_hour = timestamp.hour
            
            for i in range(1, days * 6):
                # Update timestamp by 4 hours
                timestamp = timestamp + pd.Timedelta(hours=4)
                
                # Calculate hour of day for patterns
                hour_of_day = (start_hour + i * 4) % 24
                day_factor = min(1, max(0, math.sin((hour_of_day - 6) * math.pi / 12))) \
                             if hour_of_day >= 6 and hour_of_day <= 18 else 0
                    
                # Simulate realistic patterns
                self._update_forecast_values(current_values, hour_of_day, day_factor)
                
                # Make new prediction
                pred = self.model_service.predict_lstm(current_sequence)
                if not pred:
                    continue
                    
                # Add to forecast
                forecast_entry = {
                    'date': timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    'timestamp': timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    'forecast_type': 'forecast',
                    'soil_temperature': float(current_values['Soil_Temperature']),
                    'humidity': float(current_values['Humidity']),
                    'soil_moisture': float(current_values['Soil_Moisture']),
                    'predicted_health': pred['predicted_health'],
                    'confidence': pred['confidence']
                }
                
                # Add additional readings
                for attr, key in [('Ambient_Temperature', 'ambient_temperature'), 
                                ('Light_Intensity', 'light_intensity'),
                                ('Soil_pH', 'soil_ph'),
                                ('Nitrogen_Level', 'nitrogen'),
                                ('Phosphorus_Level', 'phosphorus'),
                                ('Potassium_Level', 'potassium')]:
                    if attr in current_values:
                        forecast_entry[key] = float(current_values[attr])
                        
                forecast.append(forecast_entry)
            
            return forecast
            
        except Exception as e:
            print(f"Error in LSTM forecasting: {e}")
            return None
    
    def generate_traditional_forecast(self, plant_id, days=3):
        """Generate forecast using traditional model"""
        # Get historical data
        plant_history = self.data_service.get_plant_data(plant_id)
        if plant_history is None:
            return None
            
        plant_history['Timestamp'] = pd.to_datetime(plant_history['Timestamp'])
        plant_history = plant_history.sort_values('Timestamp')

        # Get the most recent data point as our starting point
        latest_data = plant_history.iloc[-1:].copy()
        timestamp = latest_data['Timestamp'].iloc[0]

        # Calculate trends from historical data
        trends = self._calculate_trends(plant_history)

        # Create forecast datapoints
        forecast = []
        
        # Save first data point as current
        current_entry = {
            'date': timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            'timestamp': timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            'forecast_type': 'current',  # Mark as current data
            'soil_temperature': float(latest_data['Soil_Temperature'].iloc[0]),
            'humidity': float(latest_data['Humidity'].iloc[0]),
            'soil_moisture': float(latest_data['Soil_Moisture'].iloc[0])
        }
        
        # Process for prediction
        processed_data = process_for_prediction(
            plant_id, latest_data, self.data_service.plant_data
        )
        
        # Make prediction
        prediction = self.model_service.predict_traditional(processed_data)
        if prediction:
            current_entry['predicted_health'] = prediction['predicted_health']
            current_entry['confidence'] = prediction['confidence']
        
        # Add optional fields
        for src, dst in [('Ambient_Temperature', 'ambient_temperature'), 
                        ('Light_Intensity', 'light_intensity'),
                        ('Soil_pH', 'soil_ph'),
                        ('Nitrogen_Level', 'nitrogen'),
                        ('Phosphorus_Level', 'phosphorus'),
                        ('Potassium_Level', 'potassium')]:
            if src in latest_data.columns:
                current_entry[dst] = float(latest_data[src].iloc[0])
        
        forecast.append(current_entry)

        # Use initial values as starting point for forecast
        current_values = {
            'Soil_Temperature': float(latest_data['Soil_Temperature'].iloc[0]),
            'Humidity': float(latest_data['Humidity'].iloc[0]),
            'Soil_Moisture': float(latest_data['Soil_Moisture'].iloc[0]),
            'Light_Intensity': float(latest_data['Light_Intensity'].iloc[0]) if 'Light_Intensity' in latest_data.columns else 500,
            'Ambient_Temperature': float(latest_data['Ambient_Temperature'].iloc[0]) if 'Ambient_Temperature' in latest_data.columns else 22,
            'Soil_pH': float(latest_data['Soil_pH'].iloc[0]) if 'Soil_pH' in latest_data.columns else 6.5,
            'Nitrogen_Level': float(latest_data['Nitrogen_Level'].iloc[0]) if 'Nitrogen_Level' in latest_data.columns else 30,
            'Phosphorus_Level': float(latest_data['Phosphorus_Level'].iloc[0]) if 'Phosphorus_Level' in latest_data.columns else 30,
            'Potassium_Level': float(latest_data['Potassium_Level'].iloc[0]) if 'Potassium_Level' in latest_data.columns else 30
        }

        # Apply day/night cycle patterns
        start_hour = timestamp.hour
        
        for i in range(1, days * 6):  # Start from 1 because we already added current data
            # Update timestamp by 4 hours
            timestamp = timestamp + pd.Timedelta(hours=4)
            
            # Create new data with projected values
            new_data = latest_data.copy()
            new_data['Timestamp'] = timestamp
            
            # Update time features
            new_data['Hour'] = timestamp.hour
            new_data['Day'] = timestamp.day
            new_data['Month'] = timestamp.month
            
            # Calculate hour of day for day/night cycle patterns
            hour_of_day = (start_hour + i * 4) % 24
            day_factor = min(1, max(0, math.sin((hour_of_day - 6) * math.pi / 12))) \
                        if hour_of_day >= 6 and hour_of_day <= 18 else 0
            
            # Update forecast values based on time and trends
            self._update_forecast_values(
                current_values, hour_of_day, day_factor, trends
            )
            
            # Update the data point with new values
            for feature, value in current_values.items():
                if feature in new_data.columns:
                    new_data[feature] = value

            # Process for prediction
            processed_data = process_for_prediction(
                plant_id, new_data, self.data_service.plant_data
            )

            # Make prediction
            prediction = self.model_service.predict_traditional(processed_data)
            if not prediction:
                continue

            # Add to forecast
            forecast_entry = {
                'date': timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                'timestamp': timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                'forecast_type': 'forecast',
                'soil_temperature': float(current_values['Soil_Temperature']),
                'humidity': float(current_values['Humidity']),
                'soil_moisture': float(current_values['Soil_Moisture']),
                'predicted_health': prediction['predicted_health'],
                'confidence': prediction['confidence']
            }
            
            # Add additional readings
            for src, dst in [('Ambient_Temperature', 'ambient_temperature'), 
                            ('Light_Intensity', 'light_intensity'),
                            ('Soil_pH', 'soil_ph'),
                            ('Nitrogen_Level', 'nitrogen'),
                            ('Phosphorus_Level', 'phosphorus'),
                            ('Potassium_Level', 'potassium')]:
                if src in current_values:
                    forecast_entry[dst] = float(current_values[src])
                    
            forecast.append(forecast_entry)

        return forecast
    
    def _calculate_trends(self, plant_history):
        """Calculate trends from plant history"""
        trends = {}
        if len(plant_history) >= 6:
            # Get data from at least 24 hours back (or as far back as we have)
            first_idx = max(0, len(plant_history) - 6)
            for feature in ['Soil_Temperature', 'Humidity', 'Soil_Moisture', 'Light_Intensity',
                          'Ambient_Temperature', 'Soil_pH', 'Nitrogen_Level', 'Phosphorus_Level', 'Potassium_Level']:
                if feature in plant_history.columns:
                    time_diff = (plant_history['Timestamp'].iloc[-1] - plant_history['Timestamp'].iloc[first_idx]).total_seconds()
                    if time_diff > 0:
                        value_diff = plant_history[feature].iloc[-1] - plant_history[feature].iloc[first_idx]
                        # Calculate hourly trend
                        trends[feature] = (value_diff / time_diff) * 3600
                    else:
                        trends[feature] = 0
        else:
            # Default trends if not enough history
            trends = {
                'Soil_Temperature': 0.05,
                'Humidity': -0.2,
                'Soil_Moisture': -0.4,
                'Light_Intensity': 0,  # Will be handled by day/night cycle
                'Ambient_Temperature': 0.1,
                'Soil_pH': 0,
                'Nitrogen_Level': -0.01,
                'Phosphorus_Level': -0.01,
                'Potassium_Level': -0.01
            }
            
        return trends
    
    def _update_forecast_values(self, current_values, hour_of_day, day_factor, trends=None):
        """Update forecast values based on time of day and trends"""
        if trends is None:
            trends = {}
            
        for feature in current_values.keys():
            base_trend = trends.get(feature, 0)
            
            # Apply special patterns for certain features
            if feature == 'Light_Intensity':
                # Light follows day/night cycle
                if hour_of_day >= 6 and hour_of_day <= 18:  # Day time
                    target_light = 200 + day_factor * 600  # Peak at noon
                else:  # Night time
                    target_light = 100 * min(1, (6 - hour_of_day % 6) / 6 if hour_of_day < 6 else (hour_of_day - 18) / 6)
                current_values[feature] = current_values[feature] * 0.7 + target_light * 0.3
            
            elif feature == 'Ambient_Temperature':
                # Temperature follows day/night cycle with delay
                if 8 <= hour_of_day <= 16:  # Day warming
                    temp_target = 22 + day_factor * 6  # Warmer during day
                else:  # Night cooling
                    temp_target = 22 - (1 - day_factor) * 4  # Cooler at night
                current_values[feature] = current_values[feature] * 0.9 + temp_target * 0.1
            
            elif feature == 'Soil_Temperature':
                # Soil temp follows ambient with delay
                current_values[feature] += (current_values['Ambient_Temperature'] - current_values[feature]) * 0.05
            
            elif feature == 'Soil_Moisture':
                # Moisture decreases gradually until watering
                moisture_change = base_trend - 0.3  # Natural loss rate
                
                # Simulate automatic watering when it gets too low
                if current_values[feature] < 20:  # Water if too dry
                    moisture_change = 15  # Significant increase
                
                current_values[feature] += moisture_change
                current_values[feature] = max(10, min(90, current_values[feature]))
            
            elif feature == 'Humidity':
                # Humidity inversely related to ambient temp
                humidity_target = 70 - (current_values['Ambient_Temperature'] - 20) * 2
                current_values[feature] = current_values[feature] * 0.8 + humidity_target * 0.2
                current_values[feature] = max(30, min(90, current_values[feature]))
            
            else:
                # Other features follow their trends with some randomness
                random_factor = (np.random.random() - 0.5) * 0.2  # ±10% variation
                current_values[feature] += base_trend * (1 + random_factor)
            
            # Apply realistic constraints
            if feature in ['Humidity', 'Soil_Moisture']:
                current_values[feature] = max(0, min(100, current_values[feature]))
            elif feature == 'Soil_pH':
                current_values[feature] = max(4.5, min(8.5, current_values[feature]))
            elif feature in ['Nitrogen_Level', 'Phosphorus_Level', 'Potassium_Level']:
                current_values[feature] = max(5, min(50, current_values[feature]))
    
    def generate_plant_forecast_data(self, plant_id, days=3):
        """Generate forecast data for real-time updates"""
        plant_data = self.data_service.get_plant_data(plant_id)
        if plant_data is None or len(plant_data) < 6:
            return None

        try:
            # Generate forecast
            forecast = self.generate_forecast(plant_id, days)
            if not forecast:
                return None

            return {
                "plant_id": plant_id,
                "forecast_generated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "days_forecasted": days,
                "forecast": forecast
            }

        except Exception as e:
            print(f"Error generating forecast data: {e}")
            return None
    
    def get_plant_health_data(self, plant_id):
        """Generate plant health data for real-time updates"""
        plant_df = self.data_service.get_plant_data(plant_id)
        if plant_df is None or len(plant_df) == 0:
            return None
            
        try:
            # Get the most recent data
            plant_df = plant_df.sort_values('Timestamp')
            latest_data = plant_df.iloc[-1:].copy()

            # Add derived features for prediction
            latest_data = process_for_prediction(
                plant_id, latest_data, self.data_service.plant_data
            )

            # Make prediction
            prediction = self.model_service.predict_traditional(latest_data)
            if not prediction:
                return None
                
            # Prepare reading data for response
            readings = {
                "soil_temperature": float(latest_data['Soil_Temperature'].iloc[0]),
                "humidity": float(latest_data['Humidity'].iloc[0]),
                "soil_moisture": float(latest_data['Soil_Moisture'].iloc[0])
            }
            
            # Add additional readings if available
            additional_fields = [
                ('Ambient_Temperature', 'ambient_temperature'),
                ('Light_Intensity', 'light_intensity'),
                ('Soil_pH', 'soil_ph'),
                ('Nitrogen_Level', 'nitrogen'),
                ('Phosphorus_Level', 'phosphorus'),
                ('Potassium_Level', 'potassium'),
                ('Chlorophyll_Content', 'chlorophyll'),
                ('Electrochemical_Signal', 'ec_signal')
            ]
            
            for orig_field, resp_field in additional_fields:
                if orig_field in latest_data.columns:
                    readings[resp_field] = float(latest_data[orig_field].iloc[0])

            return {
                "plant_id": plant_id,
                "timestamp": latest_data['Timestamp'].iloc[0].strftime("%Y-%m-%d %H:%M:%S"),
                "predicted_health": prediction['predicted_health'],
                "confidence": prediction['confidence'],
                "current_readings": readings
            }

        except Exception as e:
            print(f"Error generating health data: {e}")
            return None