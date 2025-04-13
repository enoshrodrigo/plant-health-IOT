from flask import request, jsonify
from datetime import datetime, timedelta

def register_routes(app, socketio, model_service, data_service, forecast_service):
    """Register all API routes"""
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """Simple health check endpoint"""
        return jsonify({
            "status": "healthy", 
            "model_loaded": model_service.model is not None,
            "lstm_model_loaded": model_service.lstm_model is not None
        })
    
    @socketio.on('connect')
    def handle_connect():
        """Handle new websocket connections"""
        print('Client connected')
        socketio.emit('connection_status', {'status': 'connected'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle websocket disconnection"""
        print('Client disconnected')
    
    @socketio.on('subscribe_plant')
    def handle_plant_subscription(data):
        """Handle subscription to a specific plant's updates"""
        plant_id = data.get('plant_id')
        if plant_id:
            try:
                plant_id = int(plant_id)
                print(f"Client subscribed to plant {plant_id}")
                
                # Send initial data to the client
                plant_data = data_service.get_plant_data(plant_id)
                if plant_data is not None:
                    # Send current health status
                    health_data = forecast_service.get_plant_health_data(plant_id)
                    if health_data:
                        socketio.emit('plant_health_update', health_data)
                    
                    # Send forecast data
                    forecast_data = forecast_service.generate_plant_forecast_data(plant_id)
                    if forecast_data:
                        socketio.emit('plant_forecast_update', forecast_data)
            except Exception as e:
                print(f"Error in subscription: {e}")
    
    @app.route('/sensor_reading', methods=['POST'])
    def receive_sensor_data():
        """Endpoint to receive sensor data from IoT devices"""
        try:
            data = request.get_json()
    
            # Validate required fields
            required_fields = [
                'Plant_ID', 
                'Soil_Temperature', 
                'Humidity', 
                'Soil_Moisture'
            ]
            
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
    
            # Define optional fields with default values
            optional_fields = {
                'Ambient_Temperature': 22.0,  # Default room temperature
                'Light_Intensity': 500.0,     # Default medium light
                'Soil_pH': 7.0,               # Default neutral pH
                'Nitrogen_Level': 30.0,       # Default values based on training data
                'Phosphorus_Level': 30.0,
                'Potassium_Level': 30.0,
                'Chlorophyll_Content': 35.0,
                'Electrochemical_Signal': 1.0
            }
            
            # Add default values for missing optional fields
            for field, default_value in optional_fields.items():
                if field not in data:
                    data[field] = default_value
    
            # Add timestamp if not provided
            if 'Timestamp' not in data:
                data['Timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    
            # Store data
            plant_id = data_service.add_sensor_reading(data)
            
            # Make a prediction with the new data
            prediction_result = None
            try:
                # Get the plant data
                plant_df = data_service.get_plant_data(plant_id)
                if plant_df is not None:
                    # Prepare real-time update data
                    health_data = forecast_service.get_plant_health_data(plant_id)
                    forecast_data = forecast_service.generate_plant_forecast_data(plant_id)
                    
                    # Get prediction result
                    if health_data:
                        prediction_result = health_data.get('predicted_health')
                        socketio.emit('plant_health_update', health_data)
                        
                    if forecast_data:
                        socketio.emit('plant_forecast_update', forecast_data)
                    
                    # Also emit a general sensor update event
                    socketio.emit('sensor_reading', {
                        'plant_id': plant_id,
                        'timestamp': data['Timestamp'],
                        'readings': {
                            'soil_moisture': data['Soil_Moisture'],
                            'soil_temperature': data['Soil_Temperature'],
                            'humidity': data['Humidity'],
                            'ambient_temperature': data['Ambient_Temperature'],
                            'light_intensity': data['Light_Intensity'],
                            'soil_ph': data['Soil_pH'],
                            'nitrogen': data['Nitrogen_Level'],
                            'phosphorus': data['Phosphorus_Level'],
                            'potassium': data['Potassium_Level']
                        }
                    })
                    
            except Exception as e:
                print(f"Prediction error for new data: {e}")
    
            # Return response with prediction if available
            response = {
                "received": True,
                "plant_id": plant_id,
                "timestamp": data['Timestamp']
            }
            
            if prediction_result:
                response["predicted_health"] = prediction_result
                
            return jsonify(response)
    
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @app.route('/predict/<int:plant_id>', methods=['GET'])
    def predict_plant_health(plant_id):
        """Predict current plant health based on latest data"""
        health_data = forecast_service.get_plant_health_data(plant_id)
        if health_data:
            return jsonify(health_data)
        else:
            return jsonify({"error": f"No data available for Plant ID {plant_id}"}), 404
    
    @app.route('/forecast/<int:plant_id>', methods=['GET'])
    def forecast_plant_health(plant_id):
        """Predict future plant health"""
        plant_df = data_service.get_plant_data(plant_id)
        if plant_df is None or len(plant_df) < 6:
            return jsonify({
                "error": f"Not enough data for Plant ID {plant_id}. Need at least 6 readings."
            }), 400
    
        try:
            # Get days parameter, default to 3
            days = int(request.args.get('days', 3))
            if days > 14:  # Limit forecast length
                days = 14
    
            forecast_data = forecast_service.generate_plant_forecast_data(plant_id, days)
            if forecast_data:
                return jsonify(forecast_data)
            else:
                return jsonify({"error": "Failed to generate forecast"}), 500
    
        except Exception as e:
            return jsonify({"error": str(e)}), 500