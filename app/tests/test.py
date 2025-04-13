# enhanced_simulator.py
import requests
import json
import time
import random
import datetime
import argparse
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from collections import deque

# Configuration
DEFAULT_API_ENDPOINT = "http://localhost:5000/sensor_reading"
DEFAULT_INTERVAL = 5  # seconds
DEFAULT_PLANT_ID = 1
HISTORY_LENGTH = 30  # Number of points to show in graphs

class EnhancedPlantSimulator:
    def __init__(self, plant_id, api_endpoint, interval, scenario="normal"):
        self.plant_id = plant_id
        self.api_endpoint = api_endpoint
        self.interval = interval
        self.scenario = scenario
        self.running = False
        
        # Initialize trends with realistic starting values
        self.trend = {
            'soil_moisture': 35.0,
            'soil_temp': 22.0,
            'humidity': 55.0,
            'ambient_temp': 24.0,
            'light': 500.0,
            'nitrogen': 30.0,
            'phosphorus': 30.0,
            'potassium': 30.0,
            'ph': 6.5,
            'chlorophyll': 35.0,
            'electro': 1.0
        }
        
        # For visualization - store recent readings
        self.timestamps = deque(maxlen=HISTORY_LENGTH)
        self.soil_moisture_history = deque(maxlen=HISTORY_LENGTH)
        self.soil_temp_history = deque(maxlen=HISTORY_LENGTH)
        self.ambient_temp_history = deque(maxlen=HISTORY_LENGTH)
        self.humidity_history = deque(maxlen=HISTORY_LENGTH)
        self.light_history = deque(maxlen=HISTORY_LENGTH)
        
        # Time-based pattern factors
        self.time_cycle = 0
        
        # Initialize the plot
        self.setup_plot()

    def setup_plot(self):
        """Set up the visualization plot"""
        plt.ion()  # Interactive mode on
        self.fig, self.axs = plt.subplots(3, 2, figsize=(12, 8))
        self.fig.suptitle(f'Plant {self.plant_id} Real-time Sensor Data - {self.scenario} scenario')
        
        # Configure individual plots
        self.soil_moisture_line, = self.axs[0, 0].plot([], [], 'b-', label='Soil Moisture (%)')
        self.axs[0, 0].set_title('Soil Moisture')
        self.axs[0, 0].set_ylim(0, 100)
        self.axs[0, 0].grid(True)
        
        self.temp_lines = []
        self.temp_lines.append(self.axs[0, 1].plot([], [], 'r-', label='Ambient Temp (°C)')[0])
        self.temp_lines.append(self.axs[0, 1].plot([], [], 'g-', label='Soil Temp (°C)')[0])
        self.axs[0, 1].set_title('Temperature')
        self.axs[0, 1].set_ylim(10, 40)
        self.axs[0, 1].grid(True)
        self.axs[0, 1].legend()
        
        self.humidity_line, = self.axs[1, 0].plot([], [], 'c-', label='Humidity (%)')
        self.axs[1, 0].set_title('Humidity')
        self.axs[1, 0].set_ylim(0, 100)
        self.axs[1, 0].grid(True)
        
        self.light_line, = self.axs[1, 1].plot([], [], 'y-', label='Light (lux)')
        self.axs[1, 1].set_title('Light Intensity')
        self.axs[1, 1].set_ylim(0, 1000)
        self.axs[1, 1].grid(True)
        
        self.nutrient_lines = []
        self.nutrient_lines.append(self.axs[2, 0].plot([], [], 'g-', label='Nitrogen')[0])
        self.nutrient_lines.append(self.axs[2, 0].plot([], [], 'b-', label='Phosphorus')[0])
        self.nutrient_lines.append(self.axs[2, 0].plot([], [], 'r-', label='Potassium')[0])
        self.axs[2, 0].set_title('Nutrients')
        self.axs[2, 0].set_ylim(0, 50)
        self.axs[2, 0].grid(True)
        self.axs[2, 0].legend()
        
        self.ph_line, = self.axs[2, 1].plot([], [], 'm-', label='Soil pH')
        self.axs[2, 1].set_title('Soil pH')
        self.axs[2, 1].set_ylim(4, 8)
        self.axs[2, 1].grid(True)
        
        plt.tight_layout()
        
    def _apply_scenario_effects(self):
        """Apply effects based on selected scenario"""
        if self.scenario == "drought":
            # Gradually decrease soil moisture, increase temperature
            self.trend['soil_moisture'] = max(10, self.trend['soil_moisture'] * 0.99)
            self.trend['soil_temp'] += 0.05
            self.trend['humidity'] = max(30, self.trend['humidity'] * 0.995)
        
        elif self.scenario == "overwatering":
            # High soil moisture, lower oxygen to roots, potential for disease
            self.trend['soil_moisture'] = min(90, self.trend['soil_moisture'] * 1.005)
            self.trend['nitrogen'] = max(15, self.trend['nitrogen'] * 0.998)  # Nutrients leaching away
        
        elif self.scenario == "nutrient_deficiency":
            # Declining nutrient levels
            self.trend['nitrogen'] = max(12, self.trend['nitrogen'] * 0.997)
            self.trend['phosphorus'] = max(12, self.trend['phosphorus'] * 0.997)
            self.trend['potassium'] = max(12, self.trend['potassium'] * 0.997)
            self.trend['chlorophyll'] = max(20, self.trend['chlorophyll'] * 0.998)
        
        elif self.scenario == "healthy":
            # Optimal growing conditions with slight natural variations
            if self.trend['soil_moisture'] < 40:
                self.trend['soil_moisture'] += 0.5
            elif self.trend['soil_moisture'] > 60:
                self.trend['soil_moisture'] -= 0.5
                
            # Keep nutrients in optimal range
            for nutrient in ['nitrogen', 'phosphorus', 'potassium']:
                if self.trend[nutrient] < 30:
                    self.trend[nutrient] += 0.2
                elif self.trend[nutrient] > 40:
                    self.trend[nutrient] -= 0.2

    def _apply_diurnal_cycle(self):
        """Apply day/night cycle effects"""
        # Update time cycle (completes one full cycle in ~24 data points)
        self.time_cycle = (self.time_cycle + 1) % 24
        
        # Light follows a sine wave pattern to simulate day/night
        time_factor = np.sin(self.time_cycle / 24 * 2 * np.pi)
        
        # During "day" (time_factor > 0)
        if time_factor > 0:
            # Increase light
            target_light = 300 + time_factor * 600
            self.trend['light'] += (target_light - self.trend['light']) * 0.2
            
            # Increase ambient temperature during day
            target_temp = 22 + time_factor * 6
            self.trend['ambient_temp'] += (target_temp - self.trend['ambient_temp']) * 0.1
            
            # Decrease humidity during day
            target_humidity = 60 - time_factor * 15
            self.trend['humidity'] += (target_humidity - self.trend['humidity']) * 0.1
        
        # During "night" (time_factor <= 0)
        else:
            # Decrease light
            self.trend['light'] = max(50, self.trend['light'] * 0.9)
            
            # Decrease ambient temperature at night
            target_temp = 22 + time_factor * 4  # Will go below baseline at night
            self.trend['ambient_temp'] += (target_temp - self.trend['ambient_temp']) * 0.1
            
            # Increase humidity at night
            target_humidity = 60 - time_factor * 10  # Will go above baseline at night
            self.trend['humidity'] += (target_humidity - self.trend['humidity']) * 0.1
        
        # Soil temperature follows ambient but with delay and dampening
        self.trend['soil_temp'] += (self.trend['ambient_temp'] - self.trend['soil_temp']) * 0.05

    def generate_sensor_data(self):
        """Generate realistic sensor data with natural patterns"""
        # Apply scenario-specific effects
        self._apply_scenario_effects()
        
        # Apply day/night cycle effects
        self._apply_diurnal_cycle()
        
        # Apply small random variations (much smoother than original)
        soil_moisture = self.trend['soil_moisture'] + random.uniform(-0.5, 0.5)
        soil_temp = self.trend['soil_temp'] + random.uniform(-0.1, 0.1)
        humidity = self.trend['humidity'] + random.uniform(-0.5, 0.5)
        ambient_temp = self.trend['ambient_temp'] + random.uniform(-0.1, 0.1)
        light = self.trend['light'] + random.uniform(-10, 10)
        nitrogen = self.trend['nitrogen'] + random.uniform(-0.1, 0.1)
        phosphorus = self.trend['phosphorus'] + random.uniform(-0.1, 0.1)
        potassium = self.trend['potassium'] + random.uniform(-0.1, 0.1)
        
        # Apply constraints to keep values in realistic ranges
        soil_moisture = max(5, min(95, soil_moisture))
        humidity = max(20, min(90, humidity))
        soil_temp = max(5, min(35, soil_temp))
        ambient_temp = max(10, min(40, ambient_temp))
        light = max(0, min(1000, light))
        nitrogen = max(5, min(50, nitrogen))
        phosphorus = max(5, min(50, phosphorus))
        potassium = max(5, min(50, potassium))
        
        # Calculate pH based on other factors (more acidic when overwatered, etc.)
        ph_base = self.trend.get('ph', 6.5)
        ph_adjusted = ph_base
        if soil_moisture > 75:  # Over-watering tends to make soil more acidic
            ph_adjusted -= 0.005
        elif soil_moisture < 25:  # Drought can affect pH too
            ph_adjusted += 0.005
        
        # Keep pH in realistic range
        ph = max(5.0, min(7.5, ph_adjusted + random.uniform(-0.05, 0.05)))
        self.trend['ph'] = ph
        
        # Create sensor data package
        data = {
            "Plant_ID": self.plant_id,
            "Soil_Moisture": round(soil_moisture, 2),
            "Soil_Temperature": round(soil_temp, 2),
            "Humidity": round(humidity, 2),
            "Ambient_Temperature": round(ambient_temp, 2),
            "Light_Intensity": round(light, 2),
            "Soil_pH": round(ph, 2),
            "Nitrogen_Level": round(nitrogen, 2),
            "Phosphorus_Level": round(phosphorus, 2),
            "Potassium_Level": round(potassium, 2),
            "Chlorophyll_Content": round(self.trend.get('chlorophyll', 35) + random.uniform(-0.5, 0.5), 2),
            "Electrochemical_Signal": round(self.trend.get('electro', 1.0) + random.uniform(-0.05, 0.05), 2),
            "Timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
        }
        
        # Save new trend values for next iteration
        self.trend.update({
            'soil_moisture': soil_moisture,
            'soil_temp': soil_temp,
            'humidity': humidity,
            'ambient_temp': ambient_temp,
            'light': light,
            'nitrogen': nitrogen,
            'phosphorus': phosphorus,
            'potassium': potassium
        })
        
        return data

    def update_plot(self, data):
        """Update the visualization with new data"""
        current_time = datetime.datetime.now().strftime("%H:%M:%S")
        self.timestamps.append(current_time)
        
        # Update data histories
        self.soil_moisture_history.append(data["Soil_Moisture"])
        self.soil_temp_history.append(data["Soil_Temperature"])
        self.ambient_temp_history.append(data["Ambient_Temperature"])
        self.humidity_history.append(data["Humidity"])
        self.light_history.append(data["Light_Intensity"])
        
        x_data = list(range(len(self.timestamps)))
        
        # Update line data
        self.soil_moisture_line.set_data(x_data, self.soil_moisture_history)
        self.temp_lines[0].set_data(x_data, self.ambient_temp_history)
        self.temp_lines[1].set_data(x_data, self.soil_temp_history)
        self.humidity_line.set_data(x_data, self.humidity_history)
        self.light_line.set_data(x_data, self.light_history)
        
        # Update nutrient lines
        nitrogen_data = [data["Nitrogen_Level"] for _ in range(len(x_data))]
        phosphorus_data = [data["Phosphorus_Level"] for _ in range(len(x_data))]
        potassium_data = [data["Potassium_Level"] for _ in range(len(x_data))]
        
        self.nutrient_lines[0].set_data(x_data, nitrogen_data)
        self.nutrient_lines[1].set_data(x_data, phosphorus_data)
        self.nutrient_lines[2].set_data(x_data, potassium_data)
        
        # Update pH line
        ph_data = [data["Soil_pH"] for _ in range(len(x_data))]
        self.ph_line.set_data(x_data, ph_data)
        
        # Adjust x-axis limit as needed
        for ax in self.axs.flat:
            ax.set_xlim(0, max(10, len(x_data)))
        
        # Update the figure
        self.fig.canvas.draw_idle()
        self.fig.canvas.flush_events()

    def run(self):
        """Run the simulator loop"""
        self.running = True
        print(f"Starting enhanced sensor simulator for Plant ID {self.plant_id}")
        print(f"Sending data to: {self.api_endpoint}")
        print(f"Interval: {self.interval} seconds")
        print(f"Scenario: {self.scenario}")
        
        plt.show(block=False)
        
        consecutive_errors = 0
        
        try:
            while self.running:
                try:
                    # Generate sensor data
                    data = self.generate_sensor_data()
                    
                    # Update visualization
                    self.update_plot(data)
                    
                    # Print data being sent
                    print("\n==== Sending Sensor Reading ====")
                    print(f"Time: {datetime.datetime.now().strftime('%H:%M:%S')}")
                    print(f"Plant ID: {data['Plant_ID']}")
                    print(f"Soil Moisture: {data['Soil_Moisture']}%")
                    print(f"Soil Temperature: {data['Soil_Temperature']}°C")
                    print(f"Humidity: {data['Humidity']}%")
                    print(f"Soil pH: {data['Soil_pH']}")
                    print(f"Nitrogen Level: {data['Nitrogen_Level']} mg/kg")
                    print(f"Phosphorus Level: {data['Phosphorus_Level']} mg/kg")
                    print(f"Potassium Level: {data['Potassium_Level']} mg/kg")
                    print(f"Ambient Temperature: {data['Ambient_Temperature']}°C")
                    print(f"Light: {data['Light_Intensity']} lux")
                    
                    # Send data to API
                    try:
                        response = requests.post(self.api_endpoint, json=data, timeout=5)
                        
                        # Check response
                        if response.status_code == 200:
                            resp_data = response.json()
                            health_prediction = resp_data.get("predicted_health", "No prediction")
                            print(f"API Response: {health_prediction}")
                            consecutive_errors = 0  # Reset error counter on success
                        else:
                            print(f"Error: API returned status code {response.status_code}")
                            print(response.text)
                            consecutive_errors += 1
                    except requests.exceptions.RequestException as e:
                        print(f"API connection error: {e}")
                        print("Continuing to generate data...")
                        consecutive_errors += 1
                    
                    # Handle consecutive errors - might need to reconnect or adjust settings
                    if consecutive_errors > 5:
                        print("Multiple consecutive errors. Check API connection.")
                    
                    # Wait for next iteration
                    time.sleep(self.interval)
                
                except Exception as e:
                    print(f"Error during simulation: {e}")
                    time.sleep(2)  # Brief pause before retrying
        
        except KeyboardInterrupt:
            print("\nSimulator stopped by user")
        finally:
            plt.close('all')

def main():
    parser = argparse.ArgumentParser(description='Enhanced IoT Plant Sensor Simulator')
    parser.add_argument('--api-endpoint', default=DEFAULT_API_ENDPOINT,
                        help=f'API endpoint URL (default: {DEFAULT_API_ENDPOINT})')
    parser.add_argument('--plant-id', type=int, default=DEFAULT_PLANT_ID,
                        help=f'Plant ID (default: {DEFAULT_PLANT_ID})')
    parser.add_argument('--interval', type=float, default=DEFAULT_INTERVAL,
                        help=f'Seconds between readings (default: {DEFAULT_INTERVAL})')
    parser.add_argument('--scenario', choices=['normal', 'drought', 'overwatering', 'nutrient_deficiency', 'healthy'],
                        default='normal', help='Simulation scenario (default: normal)')
    
    args = parser.parse_args()
    
    simulator = EnhancedPlantSimulator(
        plant_id=args.plant_id,
        api_endpoint=args.api_endpoint,
        interval=args.interval,
        scenario=args.scenario
    )
    simulator.run()

if __name__ == "__main__":
    main()