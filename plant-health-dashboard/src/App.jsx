import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { FaSeedling, FaExclamationTriangle, FaServer, FaSun, FaMoon } from 'react-icons/fa';
import plantApi from './api/plantApi';
import { SocketProvider } from './context/SocketContext';

const App = () => {
  const [apiStatus, setApiStatus] = useState({ available: false, loading: true });
  const [darkMode, setDarkMode] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await plantApi.healthCheck();
        setApiStatus({ 
          available: true, 
          loading: false,
          modelLoaded: response.model_loaded,
          status: response.status
        });
        setServerInfo(response);
      } catch (error) {
        console.error("API not available:", error);
        setApiStatus({ available: false, loading: false });
      }
    };

    checkApi();
  }, []);

  return (
    <SocketProvider>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        <header className={`${darkMode ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-md'}`}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaSeedling className={`text-3xl ${darkMode ? 'text-green-400' : 'text-primary'}`} />
                <div>
                  <h1 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    Plant Health Monitor
                  </h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Real-time plant monitoring dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                      darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-100 text-gray-700'
                    }`}
                    aria-label="Toggle dark mode"
                  >
                    {darkMode ? <FaSun /> : <FaMoon />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>API Status:</span>
                  {apiStatus.loading ? (
                    <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
                  ) : apiStatus.available ? (
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  ) : (
                    <div className="w-3 h-3 bg-danger rounded-full"></div>
                  )}
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {apiStatus.loading ? "Checking..." : apiStatus.available ? "Online" : "Offline"}
                  </span>
                </div>
                {apiStatus.available && apiStatus.modelLoaded !== undefined && (
                  <div className={`px-2 py-1 rounded text-xs ${
                    apiStatus.modelLoaded ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'
                  }`}>
                    <FaServer className="inline-block mr-1" />
                    {apiStatus.modelLoaded ? "Model Loaded" : "Model Not Loaded"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          {apiStatus.loading ? (
            <div className="flex justify-center items-center h-64">
              <div className={`animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 ${darkMode ? 'border-green-400' : 'border-primary'}`}></div>
            </div>
          ) : apiStatus.available ? (
            <Dashboard darkMode={darkMode} />
          ) : (
            <div className={`text-center p-10 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
              <div className="text-danger text-5xl mb-4">
                <FaExclamationTriangle />
              </div>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'} mb-2`}>
                API Unavailable
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Could not connect to the plant monitoring API. Please check your connection and try again.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className={`px-5 py-2 ${darkMode ? 'bg-green-600' : 'bg-primary'} text-white rounded-lg hover:bg-opacity-90 transition-all`}
              >
                Retry Connection
              </button>
            </div>
          )}
        </main>
        
        <footer className={`${darkMode ? 'bg-gray-800' : 'bg-gray-800'} text-white py-4`}>
          <div className="container mx-auto px-4 text-center">
            <p>Plant Health Monitoring Dashboard &copy; {new Date().getFullYear()}</p>
            {serverInfo && serverInfo.version && (
              <p className="text-xs text-gray-400 mt-1">Server Version: {serverInfo.version}</p>
            )}
          </div>
        </footer>
      </div>
    </SocketProvider>
  );
};

export default App;