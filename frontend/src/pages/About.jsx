import { Info, Users, Rocket, Code2 } from 'lucide-react';

const About = () => (
  <div className="min-h-screen bg-gray-900 text-white p-8 font-inter">
    <div className="max-w-3xl mx-auto space-y-10">
      <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
        <Info className="w-8 h-8 text-blue-400" /> About StockSim
      </h1>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Rocket className="w-6 h-6 text-purple-400" /> Our Mission
        </h2>
        <p className="text-gray-300">StockSim is a modern stock market simulation platform designed to help you learn, practice, and master trading without any financial risk. Whether you're a beginner or an aspiring pro, StockSim provides a safe, engaging, and realistic environment to build your skills.</p>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="w-6 h-6 text-green-400" /> Key Features
        </h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>₹5 crore virtual cash for every new user</li>
          <li>Real-time stock prices and market data</li>
          <li>Modern, dark-themed UI with beautiful charts and tables</li>
          <li>Portfolio tracking, transaction history, and performance analytics</li>
          <li>Practice trading, learn strategies, and compete with friends</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Code2 className="w-6 h-6 text-yellow-400" /> Tech Stack
        </h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>Frontend: React, Tailwind CSS, Vite</li>
          <li>Backend: Node.js, Express, MongoDB</li>
          <li>APIs: Alpha Vantage, Yahoo Finance, Twelve Data</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Info className="w-6 h-6 text-blue-400" /> Why StockSim?
        </h2>
        <p className="text-gray-300">We believe everyone should have access to financial education and the tools to succeed in the markets. StockSim is built for learners, dreamers, and future investors. Enjoy the journey, experiment, and grow your skills—risk free!</p>
      </section>
    </div>
  </div>
);

export default About; 