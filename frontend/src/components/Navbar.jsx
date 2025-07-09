import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, ChevronRight, LogIn, UserPlus, LogOut, UserCircle, Plus, Minus } from "lucide-react";
import { useAuth } from '../context/AuthContext';
import React, { useRef, useState, useEffect } from "react";

const Navbar = ({ toggleTheme, isDark, onAddBalance, onSubtractBalance, availableBalance }) => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }
    if (showProfile) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfile]);

  const handleLogout = () => {
    logout();
    setShowProfile(false);
    navigate('/login');
  };

  return (
    <nav className="p-4 sticky top-0 w-full z-30 bg-gradient-to-br from-[#11121c]/95 via-[#181c2e]/95 to-[#11121c]/95 backdrop-blur relative overflow-visible">
      {/* Radial blue glow for modern effect */}
      <div className="absolute left-1/2 top-0 w-[600px] h-[300px] -translate-x-1/2 bg-blue-900/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="max-w-7xl mx-auto flex justify-between items-center relative z-10">
        <span
          onClick={() => navigate('/')}
          className="cursor-pointer text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x tracking-tight"
        >
          StockSim
        </span>
        <div className="flex items-center gap-8">
          <div className="flex gap-8 items-center">
            {isAuthenticated && (
              <>
                <Link 
                  to="/market" 
                  className="relative text-white font-semibold px-3 py-1 transition-all duration-300 flex items-center group text-lg tracking-wide after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-blue-400 after:to-purple-400 after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
                >
                  <span className="relative z-10">Market</span>
                </Link>
                <Link 
                  to="/portfolio" 
                  className="relative text-white font-semibold px-3 py-1 transition-all duration-300 flex items-center group text-lg tracking-wide after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-blue-400 after:to-purple-400 after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
                >
                  <span className="relative z-10">Portfolio</span>
                </Link>
              </>
            )}
            <Link 
              to="/about" 
              className="relative text-white font-semibold px-3 py-1 transition-all duration-300 flex items-center group text-lg tracking-wide after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-blue-400 after:to-purple-400 after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
            >
              <span className="relative z-10">About</span>
            </Link>
            <Link 
              to="/guide" 
              className="relative text-white font-semibold px-3 py-1 transition-all duration-300 flex items-center group text-lg tracking-wide after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-blue-400 after:to-purple-400 after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
            >
              <span className="relative z-10">Guide</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4 ml-8">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-white/90 hover:text-white transition-all duration-300 flex items-center gap-2 group border border-white/20 hover:border-white/40 rounded-lg hover:bg-white/5"
                >
                  <LogIn className="w-4 h-4 transform group-hover:scale-110 transition-transform" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 group"
                >
                  <UserPlus className="w-4 h-4 transform group-hover:scale-110 transition-transform" />
                  Register
                </Link>
              </>
            ) : (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfile((prev) => !prev)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#23244d]/60 rounded-full border border-blue-400/10 hover:bg-[#23244d]/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md"
                >
                  <UserCircle className="w-6 h-6 text-blue-400" />
                  <span className="text-white/90 font-medium">{user.email || user.username || 'Profile'}</span>
                  <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showProfile ? 'rotate-90' : ''}`} />
                </button>
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#23244d]/95 rounded-xl shadow-xl py-2 z-50 border border-blue-400/20 animate-fade-in-up backdrop-blur-md">
                    <div className="px-4 py-2 text-white font-semibold border-b border-blue-400/10">{user.email || user.username}</div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-900/10 transition-colors font-semibold flex items-center gap-2 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
            {!isAuthenticated && (
              <button 
                onClick={toggleTheme} 
                className="p-2.5 rounded-full hover:bg-white/10 transition-all duration-300 transform hover:scale-110 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl"
              >
                {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-white" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
