import React from 'react';
import { 
  FaLightbulb, 
  FaTint, 
  FaThermometerHalf, 
  FaLeaf,
  FaSun,
  FaCut
} from 'react-icons/fa';

const Suggestions = ({ health, plantType }) => {
  if (!health || !plantType) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Care Suggestions</h2>
        <p className="text-gray-500">No suggestions available</p>
      </div>
    );
  }

  const healthLower = health.toLowerCase();
  
  // General suggestions based on health status
  const generalSuggestions = {
    healthy: [
      { icon: <FaLeaf className="text-primary" />, text: "Continue with your current care routine." },
      { icon: <FaSun className="text-warning" />, text: "Ensure the plant receives appropriate light." },
      { icon: <FaCut className="text-secondary" />, text: "Consider pruning to encourage new growth." }
    ],
    warning: [
      { icon: <FaTint className="text-secondary" />, text: "Check soil moisture levels, adjust watering schedule." },
      { icon: <FaThermometerHalf className="text-danger" />, text: "Monitor environmental temperature and humidity." },
      { icon: <FaSun className="text-warning" />, text: "Ensure adequate but not excessive light exposure." }
    ],
    "needs attention": [
      { icon: <FaTint className="text-secondary" />, text: "Check soil moisture levels, adjust watering schedule." },
      { icon: <FaThermometerHalf className="text-danger" />, text: "Monitor environmental temperature and humidity." },
      { icon: <FaSun className="text-warning" />, text: "Ensure adequate but not excessive light exposure." }
    ],
    critical: [
      { icon: <FaTint className="text-secondary" />, text: "Urgent: Check for over/under watering and adjust immediately." },
      { icon: <FaThermometerHalf className="text-danger" />, text: "Move the plant to a location with appropriate temperature." },
      { icon: <FaLeaf className="text-primary" />, text: "Inspect for pests or diseases and treat if necessary." }
    ]
  };
  
  // Plant type specific suggestions
  const typeSpecificSuggestions = {
    "Vegetable": {
      healthy: { icon: <FaSun className="text-warning" />, text: "Ensure 6-8 hours of direct sunlight daily." },
      warning: { icon: <FaTint className="text-secondary" />, text: "Check for consistent soil moisture - vegetables need regular watering." },
      "needs attention": { icon: <FaTint className="text-secondary" />, text: "Check for consistent soil moisture - vegetables need regular watering." },
      critical: { icon: <FaLeaf className="text-primary" />, text: "Look for signs of nutrient deficiency in the leaves." }
    },
    "House Plant": {
      healthy: { icon: <FaSun className="text-warning" />, text: "Most house plants prefer indirect light rather than direct sun." },
      warning: { icon: <FaTint className="text-secondary" />, text: "House plants typically prefer less frequent but deeper watering." },
      "needs attention": { icon: <FaTint className="text-secondary" />, text: "House plants typically prefer less frequent but deeper watering." },
      critical: { icon: <FaThermometerHalf className="text-danger" />, text: "Check for drafts or temperature extremes near your plant." }
    },
    "Herb": {
      healthy: { icon: <FaCut className="text-secondary" />, text: "Regular harvesting encourages bushier growth in herbs." },
      warning: { icon: <FaTint className="text-secondary" />, text: "Herbs prefer consistent moisture but not soggy soil." },
      "needs attention": { icon: <FaTint className="text-secondary" />, text: "Herbs prefer consistent moisture but not soggy soil." },
      critical: { icon: <FaSun className="text-warning" />, text: "Most herbs need at least 6 hours of sunlight - check positioning." }
    }
  };
  
  // Get appropriate suggestions
  const suggestions = generalSuggestions[healthLower] || generalSuggestions.warning;
  const typeSpecific = (typeSpecificSuggestions[plantType] && typeSpecificSuggestions[plantType][healthLower]) || null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center gap-3 mb-5">
        <FaLightbulb className="text-yellow-500 text-xl" />
        <h2 className="text-xl font-bold text-gray-800">Care Suggestions</h2>
      </div>
      
      <ul className="space-y-4">
        {suggestions.map((item, index) => (
          <li key={index} className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
              {item.icon}
            </div>
            <span className="text-gray-700">{item.text}</span>
          </li>
        ))}
        
        {typeSpecific && (
          <li className="flex items-center gap-3 border-t pt-4 mt-4 border-gray-100">
            <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
              {typeSpecific.icon}
            </div>
            <span className="text-gray-700 font-medium">{typeSpecific.text}</span>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Suggestions;