import React from "react";

const Topbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <span className="text-2xl font-bold text-gray-800">Image Haven</span>
          <div className="hidden md:flex space-x-4">
            <button className="px-3 py-1 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none">
              Home
            </button>
            <button className="px-3 py-1 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none">
              Explore
            </button>
            <button className="px-3 py-1 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none">
              About
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none">
            Login
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none">
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Topbar;
