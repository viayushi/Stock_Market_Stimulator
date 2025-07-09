import React from 'react';

const Dashboard = ({ user }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center bg-transparent text-white">
    <h1 className="text-4xl font-bold mb-4">Welcome, {user?.username || 'Investor'}!</h1>
    <p className="text-lg mb-8">Your virtual stock market dashboard.</p>
    <div className="flex gap-6">
      <a href="/market" className="px-6 py-3 bg-blue-700/80 rounded-lg shadow hover:bg-blue-800 transition">Market & Portfolio</a>
      <a href="/trading" className="px-6 py-3 bg-pink-700/80 rounded-lg shadow hover:bg-pink-800 transition">Trading</a>
    </div>
  </div>
);

export default Dashboard; 