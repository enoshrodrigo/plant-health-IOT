import axios from 'axios';

// Base API URL - change this to match your Flask server
const BASE_URL = 'http://localhost:5000';

const plantApi = {
  // Health check endpoint
  healthCheck: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('API Health Check Error:', error);
      throw error;
    }
  },

  // Get plant health prediction
  getPlantHealth: async (plantId) => {
    try {
      const response = await axios.get(`${BASE_URL}/predict/${plantId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching plant #${plantId} health:`, error);
      throw error;
    }
  },

  // Get plant health forecast
  getPlantForecast: async (plantId, days = 3) => {
    try {
      const response = await axios.get(`${BASE_URL}/forecast/${plantId}?days=${days}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching plant #${plantId} forecast:`, error);
      throw error;
    }
  },

  // Get detailed forecast with more days
  getDetailedForecast: async (plantId, days = 7) => {
    try {
      const response = await axios.get(`${BASE_URL}/forecast/${plantId}?days=${days}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching detailed forecast for plant #${plantId}:`, error);
      throw error;
    }
  },

  // Send sensor reading (could be used to simulate IoT devices)
  sendSensorReading: async (sensorData) => {
    try {
      const response = await axios.post(`${BASE_URL}/sensor_reading`, sensorData);
      return response.data;
    } catch (error) {
      console.error("Error sending sensor reading:", error);
      throw error;
    }
  }
};

export default plantApi;