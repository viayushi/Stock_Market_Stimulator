import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart2, TrendingUp, Shield, Users } from "lucide-react";
import stockVideo from "../assets/video/my_video.mp4";
import TypingEffect from "./TypingEffect";
import { useAuth } from "../context/AuthContext";

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/market');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-[rgb(15,15,15)]/90 bg-gradient-to-br from-gray-900/60 to-transparent">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-transparent" />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Page Content */}
        <div className="flex-1 flex pt-16">
          {/* Left side text */}
          <div className="w-1/2 flex items-center justify-center p-8 text-white">
            <div className="max-w-2xl space-y-6">
              <div className="space-y-3">
                <h2 className="text-7xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
                  Welcome to
                </h2>
                <h2 className="text-6xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                  <TypingEffect text="StockSim!" speed={100} />
                </h2>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                Simulate trading, track your portfolio, and explore the stock market like a pro. Start your journey to financial mastery today.
              </p>
              <div className="flex gap-6 pt-8">
                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={handleGetStarted}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 group"
                    >
                      Get Started
                      <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="px-8 py-4 border-2 border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 group">
                      Learn More
                      <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </>
                ) : (
                  <div className="text-lg text-green-400 font-semibold">Welcome back!</div>
                )}
              </div>
            </div>
          </div>

          {/* Right side with video */}
          <div className="w-1/2 relative flex items-center justify-center">
            <div className="w-full h-[75%] relative group">
              <div className="relative inset-0 bg-gradient-to-r from-transparent via-gray-900/30 to-gray-900/50 z-10" />
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-l-[3rem] rounded-r-[3rem] transform group-hover:scale-105 transition-transform duration-700"
                onError={(e) => console.error("Video failed to load:", e)}
              >
                <source src={stockVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative mt-16 mb-8 py-16 overflow-hidden">
          {/* Radial glow backdrop */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 w-[700px] h-[700px] bg-purple-600 opacity-20 blur-[180px] rounded-full -translate-x-1/2" />
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 px-6">
            {[
              {
                icon: <BarChart2 className="w-7 h-7 text-blue-400" />,
                title: "Real-time Data",
                desc: "Live market updates and analysis",
                bg: "bg-blue-500/10",
              },
              {
                icon: <TrendingUp className="w-7 h-7 text-purple-400" />,
                title: "Portfolio Tracking",
                desc: "Monitor your investments",
                bg: "bg-purple-500/10",
              },
              {
                icon: <Shield className="w-7 h-7 text-pink-400" />,
                title: "Risk-Free Trading",
                desc: "Practice without real money",
                bg: "bg-pink-500/10",
              },
              {
                icon: <Users className="w-7 h-7 text-indigo-400" />,
                title: "Community",
                desc: "Learn from other traders",
                bg: "bg-indigo-500/10",
              },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 ${f.bg} rounded-xl shadow-md shadow-black/20`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-white">{f.title}</h3>
                <p className="text-xs text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LandingPage; 