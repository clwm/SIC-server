import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';


function LoginPage() {
  const navigate = useNavigate();
  const { loginAdmin, loginUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // remove top padding
  useEffect(() => {
    document.body.classList.remove('with-navbar-padding');
    return () => {
      document.body.classList.add('with-navbar-padding');
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        new URLSearchParams({
        username,
        password
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      const { access_token, username: returnedUsername } = response.data;

      // 저장
      sessionStorage.setItem('token', access_token);
      sessionStorage.setItem('username', returnedUsername);

      // 관리자용 계정 이름 admin으로 지정
      if (returnedUsername === 'admin') {
        loginAdmin();
        navigate('/admin');
      } else {
        loginUser();
        navigate('/trading');
      }

    } catch (error) {
      setError('다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Allow login on Enter key press
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">로그인</h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="ID"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            className={`w-full py-3 px-4 rounded-md transition duration-200 font-semibold flex items-center justify-center gap-2 ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;