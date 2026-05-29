import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';


const NavigationBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`);


      // 인증 상태 초기화
      logout();

      // 로그인 페이지로 이동
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Placeholder user name - 바꿀 필요 없음
  const userName = "User";

  return (
    <nav className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border-b border-blue-700 p-4 flex justify-between items-center z-50 fixed top-0 left-0 right-0 flex-shrink-0">
      <div className="text-xl font-bold tracking-wide">SIC 4.0</div>
      <div className="relative">
        <button
          onClick={toggleMenu}
          className="p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
          aria-label="User menu"
        >
          <User size={24} />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl py-1 z-50 border border-gray-200">
            <div className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-100 font-medium">
              {userName}
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition duration-200"
            >
              <LogOut size={16} className="mr-2 text-gray-500" />
              로그아웃
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;