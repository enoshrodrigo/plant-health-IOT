import React, { useState, useEffect } from 'react';
import PlantCard from './PlantCard';
import SensorReadings from './SensorReadings';
import HealthStatus from './HealthStatus';
import Suggestions from './Suggestions';
import HistoryChart from './HistoryChart';
import { FaSyncAlt, FaClock, FaSeedling, FaExclamationTriangle, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import plantApi from '../api/plantApi';
import { useSocket } from '../context/SocketContext';

// Plant categories and sample data
const PLANT_CATEGORIES = {
  1: { 
    name: "Tomato Plant", 
    category: "Vegetable", 
    imageUrl: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=200&q=80",
    description: "Tomatoes need regular watering, plenty of sunlight, and nutrient-rich soil.",
    optimalValues: {
      soil_moisture: "60-80%",
      soil_temperature: "20-28°C",
      humidity: "65-75%",
      soil_ph: "6.0-7.0"
    }
  },
  2: { 
    name: "Snake Plant", 
    category: "House Plant", 
    imageUrl: "https://www.marthastewart.com/thmb/IJw4H5lyXQmgTZtLyqnr3uwCQQk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/eight-houseplants-that-thrive-in-low-light-8-0922-2000-39845777816b4f1f8a49b6ef758ef35e.jpg",
    description: "Very drought tolerant, prefers indirect light and infrequent watering.",
    optimalValues: {
      soil_moisture: "30-50%",
      soil_temperature: "18-27°C", 
      humidity: "40-50%",
      soil_ph: "5.5-7.5"
    }
  },
  3: { 
    name: "Basil", 
    category: "Herb", 
    imageUrl: "https://aanmc.org/wp-content/uploads/2021/08/987-1024x681.jpg",
    description: "Likes moist soil, warm temperatures, and plenty of sunlight.",
    optimalValues: {
      soil_moisture: "50-70%", 
      soil_temperature: "18-24°C",
      humidity: "40-60%",
      soil_ph: "6.0-7.5"
    }
  },
  4: { 
    name: "Peace Lily", 
    category: "House Plant", 
    imageUrl: "https://cdn.mos.cms.futurecdn.net/qYNPupRnspGWPF4886Z7hB-1200-80.jpg",
    description: "Thrives in shade, prefers moist soil and high humidity.",
    optimalValues: {
      soil_moisture: "50-60%",
      soil_temperature: "18-30°C",
      humidity: "50-80%",
      soil_ph: "5.8-6.5"
    }
  },
};

const Dashboard = () => {
  const [selectedPlant, setSelectedPlant] = useState(1);
  const [plantHealth, setPlantHealth] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { socket, isConnected, subscribePlant } = useSocket();

  // Initial data fetch
  const fetchPlantData = async (plantId) => {
    setLoading(true);
    try {
      const healthData = await plantApi.getPlantHealth(plantId);
      const forecastData = await plantApi.getPlantForecast(plantId);
      setPlantHealth(healthData);
      setForecast(forecastData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching plant data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Set up WebSocket event listeners
  useEffect(() => {
    if (socket && isConnected) {
      // Subscribe to the selected plant
      subscribePlant(selectedPlant);

      // Listen for health updates
      socket.on('plant_health_update', (data) => {
        if (data.plant_id === selectedPlant) {
          console.log('Received real-time health update:', data);
          setPlantHealth(data);
          setLastUpdated(new Date());
        }
      });

      // Listen for forecast updates
      socket.on('plant_forecast_update', (data) => {
        if (data.plant_id === selectedPlant) {
          console.log('Received real-time forecast update:', data);
          setForecast(data);
        }
      });

      // Listen for sensor reading updates
      socket.on('sensor_reading', (data) => {
        if (data.plant_id === selectedPlant) {
          console.log('Received real-time sensor update:', data);
          // You might want to update specific parts of the UI directly here
          // or just rely on the plant_health_update event which has all the data
          
          // Update last updated timestamp
          setLastUpdated(new Date());
        }
      });

      // Clean up listeners on unmount or when selected plant changes
      return () => {
        socket.off('plant_health_update');
        socket.off('plant_forecast_update');
        socket.off('sensor_reading');
      };
    }
  }, [socket, isConnected, selectedPlant, subscribePlant]);

  // Initial data load and plant subscription
  useEffect(() => {
    fetchPlantData(selectedPlant);

    // If socket is connected, subscribe to the selected plant
    if (socket && isConnected) {
      subscribePlant(selectedPlant);
    }
  }, [selectedPlant, socket, isConnected, subscribePlant]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPlantData(selectedPlant);
  };

  // Format timestamp for display
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`px-4 py-2 rounded-lg text-center ${isConnected ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
        {isConnected ? 
          'Real-time updates active: Data will refresh automatically' : 
          'Real-time connection unavailable: Using manual refresh mode'}
      </div>

      {/* Header with stats */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div className="w-full sm:w-auto">
            <select
              className="select select-bordered w-full max-w-xs bg-white"
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(parseInt(e.target.value))}
            >
              {Object.entries(PLANT_CATEGORIES).map(([id, plant]) => (
                <option key={id} value={id}>
                  {plant.name} ({plant.category})
                </option>
              ))}
            </select>
            
            {/* Last updated indicator */}
            {lastUpdated && (
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <FaClock /> Last updated: {formatTimeAgo(lastUpdated)}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {/* Plant info card */}
            {PLANT_CATEGORIES[selectedPlant] && (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <FaSeedling className="text-primary" />
                <span className="text-sm">
                  {PLANT_CATEGORIES[selectedPlant].category}
                </span>
              </div>
            )}
            
            {/* Health status quickview */}
            {plantHealth && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg 
                ${plantHealth.predicted_health.toLowerCase() === 'healthy' ? 'bg-primary/10' : 
                  plantHealth.predicted_health.toLowerCase().includes('warning') || 
                  plantHealth.predicted_health.toLowerCase().includes('attention') ? 'bg-warning/10' : 'bg-danger/10'}`}>
                {plantHealth.predicted_health.toLowerCase() === 'healthy' ? (
                  <FaCheck className="text-primary" />
                ) : plantHealth.predicted_health.toLowerCase().includes('warning') || 
                     plantHealth.predicted_health.toLowerCase().includes('attention') ? (
                  <FaExclamationTriangle className="text-warning" />
                ) : (
                  <FaExclamationCircle className="text-danger" />
                )}
                <span className="text-sm font-medium">
                  {plantHealth.predicted_health}
                </span>
              </div>
            )}
            
            {/* Refresh button - enabled only when real-time is disabled */}
            <button
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-all disabled:opacity-50"
              onClick={handleRefresh}
              disabled={refreshing || isConnected}
            >
              <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>
      </div>

      {/* Plant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(PLANT_CATEGORIES).map(([id, plant]) => (
          <PlantCard
            key={id}
            plant={plant}
            isActive={parseInt(id) === selectedPlant}
            onClick={() => setSelectedPlant(parseInt(id))}
            health={parseInt(id) === selectedPlant && plantHealth ? plantHealth.predicted_health : null}
          />
        ))}
      </div>
      
      {/* Plant Optimal Values */}
      {PLANT_CATEGORIES[selectedPlant] && PLANT_CATEGORIES[selectedPlant].optimalValues && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Optimal Conditions for {PLANT_CATEGORIES[selectedPlant].name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(PLANT_CATEGORIES[selectedPlant].optimalValues).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 capitalize">{key.replace('_', ' ')}</h3>
                <p className="text-lg font-semibold text-primary">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {plantHealth && (
              <>
                <SensorReadings readings={plantHealth.current_readings} />
                <HealthStatus 
                  health={plantHealth.predicted_health}
                  confidence={plantHealth.confidence}
                />
              </>
            )}
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {plantHealth && (
              <>
                <Suggestions health={plantHealth.predicted_health} plantType={PLANT_CATEGORIES[selectedPlant].category} />
                {forecast && (
                  <HistoryChart forecast={forecast.forecast} />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;