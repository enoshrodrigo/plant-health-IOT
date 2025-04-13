import React from 'react';
import { 
  FaThermometerHalf, 
  FaTint, 
  FaSeedling,
  FaSun,
  FaFlask,
  FaLeaf,
  FaVial,
  FaBolt
} from 'react-icons/fa';

const SensorReadings = ({ readings }) => {
  if (!readings) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Sensor Readings</h2>
        <p className="text-gray-500">No sensor data available</p>
      </div>
    );
  }

  // Extract readings and make sure they exist
  const { 
    soil_temperature, 
    humidity, 
    soil_moisture,
    ambient_temperature,
    light_intensity,
    soil_ph,
    nitrogen,
    phosphorus,
    potassium,
    chlorophyll,
    ec_signal
  } = readings;

  // Define thresholds for coloring
  const getSoilMoistureColor = (value) => {
    if (value < 20) return "text-danger";
    if (value < 40) return "text-warning";
    if (value < 70) return "text-primary";
    return "text-secondary";
  };

  const getSoilTempColor = (value) => {
    if (value < 10) return "text-secondary-dark";
    if (value > 30) return "text-danger";
    if (value > 25) return "text-warning";
    return "text-primary";
  };

  const getHumidityColor = (value) => {
    if (value < 30) return "text-danger";
    if (value < 50) return "text-warning";
    if (value > 85) return "text-warning";
    return "text-primary";
  };

  const getPhColor = (value) => {
    if (value < 5.5) return "text-danger";
    if (value > 7.5) return "text-warning";
    return "text-primary";
  };

  const getNutrientColor = (value) => {
    if (value < 20) return "text-danger";
    if (value < 30) return "text-warning";
    return "text-primary";
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Current Sensor Readings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Primary Readings */}
        {/* Soil Moisture */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <FaSeedling className="text-xl text-gray-600" />
            <h3 className="font-medium text-gray-700">Soil Moisture</h3>
          </div>
          <div className="flex items-end justify-between">
            <span className={`text-3xl font-bold ${getSoilMoistureColor(soil_moisture)}`}>
              {soil_moisture.toFixed(1)}
            </span>
            <span className="text-gray-500 text-lg">%</span>
          </div>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-full rounded-full ${soil_moisture < 20 ? 'bg-danger' : soil_moisture < 40 ? 'bg-warning' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, soil_moisture)}%` }}
            ></div>
          </div>
        </div>

        {/* Soil Temperature */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <FaThermometerHalf className="text-xl text-gray-600" />
            <h3 className="font-medium text-gray-700">Soil Temperature</h3>
          </div>
          <div className="flex items-end justify-between">
            <span className={`text-3xl font-bold ${getSoilTempColor(soil_temperature)}`}>
              {soil_temperature.toFixed(1)}
            </span>
            <span className="text-gray-500 text-lg">°C</span>
          </div>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-full rounded-full ${soil_temperature < 10 ? 'bg-secondary' : soil_temperature > 30 ? 'bg-danger' : soil_temperature > 25 ? 'bg-warning' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, (soil_temperature / 40) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <FaTint className="text-xl text-gray-600" />
            <h3 className="font-medium text-gray-700">Humidity</h3>
          </div>
          <div className="flex items-end justify-between">
            <span className={`text-3xl font-bold ${getHumidityColor(humidity)}`}>
              {humidity.toFixed(1)}
            </span>
            <span className="text-gray-500 text-lg">%</span>
          </div>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-full rounded-full ${humidity < 30 ? 'bg-danger' : humidity < 50 || humidity > 85 ? 'bg-warning' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, humidity)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Additional Readings */}
      <h3 className="text-md font-semibold text-gray-700 mb-4 mt-2">Additional Readings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ambient Temperature */}
        {ambient_temperature !== undefined && (
          <div className="border border-gray-200 rounded-lg p-3 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <FaThermometerHalf className="text-secondary text-sm" />
              <h4 className="text-sm font-medium text-gray-700">Ambient Temp</h4>
            </div>
            <p className="text-2xl font-semibold">
              {ambient_temperature.toFixed(1)} <span className="text-sm text-gray-500">°C</span>
            </p>
          </div>
        )}

        {/* Light Intensity */}
        {light_intensity !== undefined && (
          <div className="border border-gray-200 rounded-lg p-3 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <FaSun className="text-warning text-sm" />
              <h4 className="text-sm font-medium text-gray-700">Light Intensity</h4>
            </div>
            <p className="text-2xl font-semibold">
              {light_intensity.toFixed(0)} <span className="text-sm text-gray-500">lux</span>
            </p>
          </div>
        )}

        {/* Soil pH */}
        {soil_ph !== undefined && (
          <div className="border border-gray-200 rounded-lg p-3 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <FaFlask className="text-primary text-sm" />
              <h4 className="text-sm font-medium text-gray-700">Soil pH</h4>
            </div>
            <p className={`text-2xl font-semibold ${getPhColor(soil_ph)}`}>
              {soil_ph.toFixed(1)}
            </p>
          </div>
        )}
        
        {/* EC Signal */}
        {ec_signal !== undefined && (
          <div className="border border-gray-200 rounded-lg p-3 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <FaBolt className="text-warning text-sm" />
              <h4 className="text-sm font-medium text-gray-700">EC Signal</h4>
            </div>
            <p className="text-2xl font-semibold">
              {ec_signal.toFixed(2)} <span className="text-sm text-gray-500">mS/cm</span>
            </p>
          </div>
        )}
        
        {/* Chlorophyll Content */}
        {chlorophyll !== undefined && (
          <div className="border border-gray-200 rounded-lg p-3 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <FaLeaf className="text-primary text-sm" />
              <h4 className="text-sm font-medium text-gray-700">Chlorophyll</h4>
            </div>
            <p className="text-2xl font-semibold">
              {chlorophyll.toFixed(1)} <span className="text-sm text-gray-500">SPAD</span>
            </p>
          </div>
        )}
      </div>

      {/* NPK Values */}
      {(nitrogen !== undefined || phosphorus !== undefined || potassium !== undefined) && (
        <>
          <h3 className="text-md font-semibold text-gray-700 mb-4 mt-6">NPK Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nitrogen */}
            {nitrogen !== undefined && (
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaVial className="text-primary text-sm" />
                    <h4 className="text-sm font-medium text-gray-700">Nitrogen (N)</h4>
                  </div>
                  <span className={`text-sm font-medium ${getNutrientColor(nitrogen)}`}>
                    {nitrogen < 20 ? "Low" : nitrogen < 30 ? "Medium" : "Good"}
                  </span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-full rounded-full ${nitrogen < 20 ? 'bg-danger' : nitrogen < 30 ? 'bg-warning' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, nitrogen * 1.5)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
                <p className="text-lg font-semibold mt-2">
                  {nitrogen.toFixed(1)} <span className="text-xs text-gray-500">mg/kg</span>
                </p>
              </div>
            )}

            {/* Phosphorus */}
            {phosphorus !== undefined && (
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaVial className="text-warning text-sm" />
                    <h4 className="text-sm font-medium text-gray-700">Phosphorus (P)</h4>
                  </div>
                  <span className={`text-sm font-medium ${getNutrientColor(phosphorus)}`}>
                    {phosphorus < 20 ? "Low" : phosphorus < 30 ? "Medium" : "Good"}
                  </span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-full rounded-full ${phosphorus < 20 ? 'bg-danger' : phosphorus < 30 ? 'bg-warning' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, phosphorus * 1.5)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
                <p className="text-lg font-semibold mt-2">
                  {phosphorus.toFixed(1)} <span className="text-xs text-gray-500">mg/kg</span>
                </p>
              </div>
            )}

            {/* Potassium */}
            {potassium !== undefined && (
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaVial className="text-secondary text-sm" />
                    <h4 className="text-sm font-medium text-gray-700">Potassium (K)</h4>
                  </div>
                  <span className={`text-sm font-medium ${getNutrientColor(potassium)}`}>
                    {potassium < 20 ? "Low" : potassium < 30 ? "Medium" : "Good"}
                  </span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-full rounded-full ${potassium < 20 ? 'bg-danger' : potassium < 30 ? 'bg-warning' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, potassium * 1.5)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
                <p className="text-lg font-semibold mt-2">
                  {potassium.toFixed(1)} <span className="text-xs text-gray-500">mg/kg</span>
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SensorReadings;