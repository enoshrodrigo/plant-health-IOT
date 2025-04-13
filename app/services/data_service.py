import pandas as pd
import json
from datetime import datetime

class DataService:
    """Manages plant data storage and retrieval"""
    
    def __init__(self, history_file):
        self.history_file = history_file
        self.plant_data = {}
        self._load_history()
    
    def _load_history(self):
        """Load plant history from file"""
        try:
            import os
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r') as f:
                    history_data = json.load(f)
                    for plant_id, readings in history_data.items():
                        self.plant_data[int(plant_id)] = pd.DataFrame(readings)
                print(f"Loaded history for {len(self.plant_data)} plants")
        except Exception as e:
            print(f"Error loading history: {e}")
    
    def save_history(self):
        """Save plant history to file"""
        try:
            history_data = {}
            for pid, pdata in self.plant_data.items():
                # Convert timestamps to strings for JSON
                pdata_copy = pdata.copy()
                if 'Timestamp' in pdata_copy.columns:
                    pdata_copy['Timestamp'] = pdata_copy['Timestamp'].dt.strftime("%Y-%m-%d %H:%M:%S.%f")
                history_data[str(pid)] = pdata_copy.to_dict('records')

            with open(self.history_file, 'w') as f:
                json.dump(history_data, f)
                
            print(f"History saved: {len(history_data)} plants")
        except Exception as e:
            print(f"Error saving history: {e}")

    def add_sensor_reading(self, data):
        """Add sensor reading to plant history"""
        plant_id = data['Plant_ID']
        df_row = pd.DataFrame([data])

        # Store in history
        if plant_id not in self.plant_data:
            self.plant_data[plant_id] = df_row
        else:
            self.plant_data[plant_id] = pd.concat([self.plant_data[plant_id], df_row])

        # Keep only recent history (last 30 days)
        if 'Timestamp' in self.plant_data[plant_id].columns:
            self.plant_data[plant_id]['Timestamp'] = pd.to_datetime(self.plant_data[plant_id]['Timestamp'])
            cutoff = pd.Timestamp.now() - pd.Timedelta(days=30)
            self.plant_data[plant_id] = self.plant_data[plant_id][
                self.plant_data[plant_id]['Timestamp'] > cutoff
            ]

        # Save history
        self.save_history()
        
        return plant_id
    
    def get_plant_data(self, plant_id):
        """Get data for a specific plant"""
        if plant_id in self.plant_data:
            return self.plant_data[plant_id].copy()
        return None
    
    def get_all_plant_ids(self):
        """Get list of all plant IDs"""
        return list(self.plant_data.keys())