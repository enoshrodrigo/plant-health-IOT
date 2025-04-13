import React from 'react';
import { FaCheck, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';

const PlantCard = ({ plant, isActive, onClick, health }) => {
  // Get health status class
  const getHealthClass = () => {
    if (!health) return "";
    health = health.toLowerCase();
    if (health === "healthy") return "bg-gradient-success";
    if (health === "warning" || health === "needs attention") return "bg-gradient-warning";
    return "bg-gradient-danger";
  };

  // Get health icon
  const getHealthIcon = () => {
    if (!health) return null;
    health = health.toLowerCase();
    if (health === "healthy") return <FaCheck className="text-white" />;
    if (health === "warning" || health === "needs attention") return <FaExclamationTriangle className="text-white" />;
    return <FaExclamationCircle className="text-white" />;
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl shadow-md transition-all transform hover:scale-105 cursor-pointer
        ${isActive ? 'ring-4 ring-primary ring-opacity-50' : ''}
      `}
    >
      {/* Plant image */}
      <div className="h-40 bg-gray-200 overflow-hidden">
        {plant.imageUrl ? (
          <img 
            src={plant.imageUrl} 
            alt={plant.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        )}
      </div>
      
      {/* Plant info */}
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{plant.name}</h3>
            <p className="text-sm text-gray-500">{plant.category}</p>
          </div>
          
          {health && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getHealthClass()}`}>
              {getHealthIcon()}
            </div>
          )}
        </div>
        
        {isActive && plant.description && (
          <p className="text-xs text-gray-600 mt-2">{plant.description}</p>
        )}
      </div>
      
      {/* Selected indicator */}
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
      )}
      
      {/* Health Status Indicator */}
      {health && (
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs text-white ${getHealthClass()}`}>
          {health}
        </div>
      )}
    </div>
  );
};

export default PlantCard;