import React from 'react';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTimesCircle,
  FaInfoCircle
} from 'react-icons/fa';

const HealthStatus = ({ health, confidence }) => {
  if (!health) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Plant Health Status</h2>
        <p className="text-gray-500">No health data available</p>
      </div>
    );
  }
  
  const healthLower = health.toLowerCase();
  
  // Health status configurations
  const statusConfig = {
    healthy: {
      icon: <FaCheckCircle className="text-primary text-3xl" />,
      title: "Healthy",
      description: "Your plant is doing well! Keep up the good care.",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
    warning: {
      icon: <FaExclamationTriangle className="text-warning text-3xl" />,
      title: "Needs Attention",
      description: "Your plant requires some attention soon.",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
    },
    "needs attention": {
      icon: <FaExclamationTriangle className="text-warning text-3xl" />,
      title: "Needs Attention",
      description: "Your plant requires some attention soon.",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
    },
    critical: {
      icon: <FaTimesCircle className="text-danger text-3xl" />,
      title: "Critical",
      description: "Immediate care required!",
      bgColor: "bg-danger/10",
      borderColor: "border-danger/30",
    },
    default: {
      icon: <FaInfoCircle className="text-secondary text-3xl" />,
      title: `Status: ${health}`,
      description: "Plant health status information.",
      bgColor: "bg-secondary/10",
      borderColor: "border-secondary/30",
    }
  };
  
  // Get the right config or use default
  const config = statusConfig[healthLower] || statusConfig.default;

  // Prepare confidence data if available
  const hasConfidence = confidence && typeof confidence === 'object';
  const confidenceEntries = hasConfidence ? Object.entries(confidence) : [];
  
  // Find highest confidence value
  const highestConfidence = hasConfidence 
    ? confidenceEntries.reduce((max, [_, value]) => Math.max(max, value), 0)
    : 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Plant Health Status</h2>
      
      <div className={`p-5 rounded-lg border ${config.borderColor} ${config.bgColor} mb-6`}>
        <div className="flex items-center gap-4">
          {config.icon}
          <div>
            <h3 className="text-lg font-semibold">{config.title}</h3>
            <p className="text-gray-600">{config.description}</p>
          </div>
        </div>
      </div>
      
      {hasConfidence && (
        <div className="mt-5">
          <h3 className="text-md font-semibold text-gray-700 mb-3">Prediction Confidence</h3>
          <div className="space-y-3">
            {confidenceEntries.map(([status, value]) => (
              <div key={status} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{status}</span>
                  <span>{(value * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-full rounded-full ${value === highestConfidence ? 'bg-primary' : 'bg-gray-400'}`}
                    style={{ width: `${value * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthStatus;