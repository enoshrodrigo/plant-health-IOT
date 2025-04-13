import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { FaCalendarAlt, FaChartLine } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const HistoryChart = ({ forecast }) => {
  const [selectedMetrics, setSelectedMetrics] = useState(['soil_moisture', 'soil_temperature', 'health']);

  if (!forecast || !forecast.length) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Forecast</h2>
        <p className="text-gray-500">No forecast data available</p>
      </div>
    );
  }

  // Separate current data from forecast data
  const currentData = forecast.filter(item => item.forecast_type === 'current');
  const forecastData = forecast.filter(item => item.forecast_type !== 'current');
  
  // If we don't have the forecast_type field, assume first point is current and rest are forecasts
  const hasForecastTypeField = forecast.some(item => 'forecast_type' in item);
  let processedForecast = forecast;
  
  if (!hasForecastTypeField) {
    processedForecast = forecast.map((item, index) => ({
      ...item,
      forecast_type: index === 0 ? 'current' : 'forecast'
    }));
  }

  // Format dates more clearly
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    if (date.toDateString() === today.toDateString()) {
      return `Today ${formattedTime}`;
    } else if (date.toDateString() === new Date(today.setDate(today.getDate() + 1)).toDateString()) {
      return `Tomorrow ${formattedTime}`;
    } else {
      return `${dayName} ${formattedTime}`;
    }
  };

  // Extract dates and values from forecast
  const labels = processedForecast.map(item => formatDate(item.date));
  
  // Check which data points are available in the forecast
  const availableMetrics = Object.keys(processedForecast[0])
    .filter(key => 
      key !== 'date' && 
      key !== 'timestamp' && 
      key !== 'forecast_type' && 
      key !== 'predicted_health' && 
      key !== 'confidence'
    );
  
  // Get soil moisture data
  const moistureData = processedForecast.map(item => item.soil_moisture);
  const moistureMin = Math.min(...moistureData) * 0.8;
  const moistureMax = Math.max(...moistureData) * 1.2;
  
  // Get temperature data
  const tempData = processedForecast.map(item => item.soil_temperature);
  const tempMin = Math.min(...tempData) * 0.8;
  const tempMax = Math.max(...tempData) * 1.2;
  
  // Health prediction data - convert to numeric
  const healthMap = {
    'healthy': 3,
    'warning': 2, 
    'needs attention': 2,
    'critical': 1
  };
  
  const predictionData = processedForecast.map(item => {
    const prediction = item.predicted_health.toLowerCase();
    return healthMap[prediction] || 2;
  });

  // Optional metrics
  const metricsConfig = {
    soil_moisture: {
      label: 'Soil Moisture',
      borderColor: 'rgba(14, 165, 233, 1)',
      backgroundColor: 'rgba(14, 165, 233, 0.2)',
      yAxisID: 'y',
      data: moistureData
    },
    soil_temperature: {
      label: 'Soil Temperature',
      borderColor: 'rgba(239, 68, 68, 1)',
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      yAxisID: 'y1',
      data: tempData
    },
    health: {
      label: 'Health Prediction',
      borderColor: 'rgba(34, 197, 94, 1)',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      borderWidth: 2,
      pointRadius: 4,
      yAxisID: 'y2',
      data: predictionData
    }
  };
  
  // Add additional metrics if available
  if (processedForecast[0].humidity !== undefined) {
    const humidityData = processedForecast.map(item => item.humidity);
    metricsConfig.humidity = {
      label: 'Humidity',
      borderColor: 'rgba(99, 102, 241, 1)',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      yAxisID: 'y3',
      data: humidityData
    };
  }
  
  if (processedForecast[0].light_intensity !== undefined) {
    const lightData = processedForecast.map(item => item.light_intensity);
    metricsConfig.light_intensity = {
      label: 'Light Intensity',
      borderColor: 'rgba(245, 158, 11, 1)',
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      yAxisID: 'y4',
      data: lightData
    };
  }
  
  if (processedForecast[0].soil_ph !== undefined) {
    const phData = processedForecast.map(item => item.soil_ph);
    metricsConfig.soil_ph = {
      label: 'Soil pH',
      borderColor: 'rgba(139, 92, 246, 1)',
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      yAxisID: 'y5',
      data: phData
    };
  }
  
  if (processedForecast[0].nitrogen !== undefined) {
    const nitrogenData = processedForecast.map(item => item.nitrogen);
    metricsConfig.nitrogen = {
      label: 'Nitrogen',
      borderColor: 'rgba(6, 182, 212, 1)',
      backgroundColor: 'rgba(6, 182, 212, 0.2)',
      yAxisID: 'y6',
      data: nitrogenData
    };
  }
  
  if (processedForecast[0].phosphorus !== undefined) {
    const phosphorusData = processedForecast.map(item => item.phosphorus);
    metricsConfig.phosphorus = {
      label: 'Phosphorus',
      borderColor: 'rgba(16, 185, 129, 1)',
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      yAxisID: 'y7',
      data: phosphorusData
    };
  }
  
  if (processedForecast[0].potassium !== undefined) {
    const potassiumData = processedForecast.map(item => item.potassium);
    metricsConfig.potassium = {
      label: 'Potassium',
      borderColor: 'rgba(249, 115, 22, 1)',
      backgroundColor: 'rgba(249, 115, 22, 0.2)',
      yAxisID: 'y8',
      data: potassiumData
    };
  }

  // Create dataset with visual indication of forecast points
  const chartData = {
    labels: labels,
    datasets: selectedMetrics
      .filter(metric => metricsConfig[metric])
      .map(metric => {
        const config = metricsConfig[metric];
        return {
          label: config.label,
          data: config.data,
          borderColor: config.borderColor,
          backgroundColor: config.backgroundColor,
          tension: 0.4,
          borderWidth: config.borderWidth || 1,
          pointRadius: (ctx) => {
            // Larger points for current data, smaller for forecast
            const index = ctx.dataIndex;
            const item = processedForecast[index];
            return item && item.forecast_type === 'current' ? 5 : 3;
          },
          pointStyle: (ctx) => {
            // Different point style for current vs forecast
            const index = ctx.dataIndex;
            const item = processedForecast[index];
            return item && item.forecast_type === 'current' ? 'rectRot' : 'circle';
          },
          pointBackgroundColor: (ctx) => {
            // Different colors for current vs forecast points
            const index = ctx.dataIndex;
            const item = processedForecast[index];
            return item && item.forecast_type === 'current' ? 
              '#ffffff' : config.borderColor;
          },
          pointBorderColor: config.borderColor,
          pointBorderWidth: (ctx) => {
            // Thicker border for current data points
            const index = ctx.dataIndex;
            const item = processedForecast[index];
            return item && item.forecast_type === 'current' ? 2 : 1;
          },
          yAxisID: config.yAxisID,
          segment: {
            borderDash: (ctx) => {
              // Check if p1 and p2 exist before accessing their properties
              if (!ctx.p1 || !ctx.p2 || !ctx.p1.parsed || !ctx.p2.parsed) {
                return undefined; // Return no dash if we don't have valid points
              }
          
              // Use dashed lines for forecast segments
              const i1 = ctx.p1.dataIndex;
              const i2 = ctx.p2.dataIndex;
              
              // Make sure indices exist in our data before checking forecast type
              if (i1 === undefined || i2 === undefined || 
                  !processedForecast[i1] || !processedForecast[i2]) {
                return undefined;
              }
              
              // If either point is current data, don't use dashed line
              if (processedForecast[i1].forecast_type === 'current' || 
                  processedForecast[i2].forecast_type === 'current') {
                return undefined;
              }
              
              // Use dashed line for forecast
              return [5, 5];
            }
          }
        };
      }),
  };

  // Configure Y axes
  const scales = {
    y: {
      type: 'linear',
      display: selectedMetrics.includes('soil_moisture'),
      position: 'left',
      title: {
        display: true,
        text: 'Moisture (%)',
        color: 'rgba(14, 165, 233, 1)',
      },
      min: moistureMin,
      max: moistureMax,
      grid: {
        borderDash: [5, 5],
      },
    },
    y1: {
      type: 'linear',
      display: selectedMetrics.includes('soil_temperature'),
      position: 'right',
      title: {
        display: true,
        text: 'Temperature (°C)',
        color: 'rgba(239, 68, 68, 1)',
      },
      min: tempMin,
      max: tempMax,
      grid: {
        drawOnChartArea: false,
      },
    },
    y2: {
      type: 'linear',
      display: false,
      min: 0.5,
      max: 3.5,
      grid: {
        drawOnChartArea: false,
      },
    },
    x: {
      grid: {
        color: (ctx) => {
          // Add vertical line to separate current from forecast
          if (ctx.tick && ctx.tick.value === 0) {
            return 'rgba(0, 0, 0, 0.2)';
          }
          return 'rgba(0, 0, 0, 0.1)';
        },
        lineWidth: (ctx) => {
          if (ctx.tick && ctx.tick.value === 0) {
            return 2;
          }
          return 1;
        }
      }
    }
  };
  
  // Add extra axes for other metrics if selected
  if (selectedMetrics.includes('humidity') && metricsConfig.humidity) {
    scales.y3 = {
      type: 'linear',
      display: false,
      min: 0,
      max: 100,
      grid: { drawOnChartArea: false },
    };
  }
  
  if (selectedMetrics.includes('light_intensity') && metricsConfig.light_intensity) {
    scales.y4 = {
      type: 'linear',
      display: false,
      min: 0,
      max: Math.max(...metricsConfig.light_intensity.data) * 1.2,
      grid: { drawOnChartArea: false },
    };
  }
  
  if (selectedMetrics.includes('soil_ph') && metricsConfig.soil_ph) {
    scales.y5 = {
      type: 'linear',
      display: false,
      min: 0,
      max: 14,
      grid: { drawOnChartArea: false },
    };
  }
  
  if (selectedMetrics.includes('nitrogen') && metricsConfig.nitrogen) {
    scales.y6 = {
      type: 'linear',
      display: false,
      min: 0,
      max: Math.max(...metricsConfig.nitrogen.data) * 1.2,
      grid: { drawOnChartArea: false },
    };
  }
  
  if (selectedMetrics.includes('phosphorus') && metricsConfig.phosphorus) {
    scales.y7 = {
      type: 'linear',
      display: false,
      min: 0,
      max: Math.max(...metricsConfig.phosphorus.data) * 1.2,
      grid: { drawOnChartArea: false },
    };
  }
  
  if (selectedMetrics.includes('potassium') && metricsConfig.potassium) {
    scales.y8 = {
      type: 'linear',
      display: false,
      min: 0,
      max: Math.max(...metricsConfig.potassium.data) * 1.2,
      grid: { drawOnChartArea: false },
    };
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: scales,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            const idx = context[0].dataIndex;
            const item = processedForecast[idx];
            const label = formatDate(item.date);
            
            // Add "Forecast" prefix to future data points
            if (item.forecast_type !== 'current') {
              return `Forecast: ${label}`;
            }
            return `Current: ${label}`;
          },
          afterBody: function(context) {
            const idx = context[0].dataIndex;
            const item = processedForecast[idx];
            let result = `Predicted Health: ${item.predicted_health}`;
            
            if (item.forecast_type === 'current') {
              result = `${result}\n(Current reading)`;
            } else {
              const hours = (idx) * 4;
              result = `${result}\n(+${hours} hours)`;
            }
            
            return result;
          }
        }
      }
    },
  };

  // Toggle a metric
  const toggleMetric = (metric) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Plant Health Forecast</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center">
            <span className="inline-block w-3 h-3 bg-primary rounded-full mr-1"></span>
            Current
          </span>
          <span className="flex items-center ml-2">
            <span className="inline-block w-6 h-0.5 bg-gray-400 border-t border-dashed border-gray-400"></span>
            <span className="ml-1">Forecast</span>
          </span>
        </div>
      </div>
      
      {/* Metric selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.keys(metricsConfig).map(metric => (
          <button 
            key={metric}
            onClick={() => toggleMetric(metric)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedMetrics.includes(metric)
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {metricsConfig[metric].label}
          </button>
        ))}
      </div>
      
      <div className="chart-container" style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
      
      <div className="mt-4 flex flex-wrap items-center justify-between">
        <div className="text-sm text-gray-600 flex items-center">
          <FaChartLine className="mr-2 text-primary" />
          Forecast shows projected values over {Math.floor(processedForecast.length / 6)} days
        </div>
        
        <div className="text-xs text-gray-500 flex items-center">
          <FaCalendarAlt className="mr-1" /> 
          Updated {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default HistoryChart;