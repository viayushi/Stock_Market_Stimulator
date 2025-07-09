import { BookOpen, TrendingUp, Wallet, BarChart2, Lightbulb } from 'lucide-react';

const Guide = () => (
  <div className="min-h-screen bg-gray-900 text-white p-8 font-inter">
    <div className="max-w-3xl mx-auto space-y-10">
      <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-blue-400" /> User Guide
      </h1>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-400" /> Getting Started
        </h2>
        <p className="text-gray-300">Register for a free account to receive ₹5 crore in virtual cash. Log in to access your dashboard, portfolio, and the market. Your progress and trades are saved automatically.</p>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-purple-400" /> How to Trade
        </h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>Go to the <span className="text-blue-400 font-semibold">Market</span> page to view real-time stock prices.</li>
          <li>Use the + and - buttons to simulate adding or subtracting funds (for practice).</li>
          <li>Select a stock to view its chart and details.</li>
          <li>Buy or sell stocks using your available balance. All trades are virtual and risk-free.</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Wallet className="w-6 h-6 text-yellow-400" /> Portfolio Management
        </h2>
        <p className="text-gray-300">Track your investments, available balance, and transaction history in the <span className="text-blue-400 font-semibold">Market</span> page. Your net profit/loss and current value are updated in real time.</p>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-pink-400" /> Market & Portfolio Page
        </h2>
        <p className="text-gray-300">Explore popular stocks, search for symbols, view live price changes, and manage your portfolio all in one place. Use the counter to practice managing your virtual funds.</p>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-300" /> Tips & Tricks
        </h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>Experiment with different trading strategies—there's no real risk!</li>
          <li>Check your portfolio regularly to monitor your performance.</li>
          <li>Use the Guide page for help and best practices.</li>
          <li>Have fun and learn about the stock market in a safe environment.</li>
        </ul>
      </section>
    </div>
  </div>
);

export default Guide; 