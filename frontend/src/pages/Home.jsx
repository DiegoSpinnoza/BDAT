import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100 font-sans">
      <div className="flex-1 flex flex-col overflow-y-auto items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 border border-gray-200 max-w-3xl w-full mx-auto mt-10 flex flex-col items-center transition-all duration-500">
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center transition-colors duration-500">Welcome</h1>
          <p className="text-gray-600 text-xl mb-6 text-center transition-colors duration-500">
            This is a web platform to run a simulation of wave propagation on a 2D cortical bone map.
          </p>
          
          <button
            onClick={() => navigate('/simulations')}
            className="mt-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-lg"
          >
            Go to Simulations
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;