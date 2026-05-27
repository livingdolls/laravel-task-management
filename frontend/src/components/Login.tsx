import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const Login = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login({ email, password });
      navigate('/');
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="card w-full max-w-md bg-dark-50 border-gray-700 shadow-2xl shadow-accent/10">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-100">
          Task Management Platform
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2 text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field bg-dark-100 border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-accent"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2 text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field bg-dark-100 border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-accent"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-dark-100 rounded-lg text-sm text-gray-400 border border-gray-700">
          <p className="font-semibold mb-2 text-gray-300">Default Users:</p>
          <p className="font-mono text-xs">admin@example.com / password</p>
          <p className="font-mono text-xs">manager1@example.com / password</p>
          <p className="font-mono text-xs">user1@example.com / password</p>
        </div>
      </div>
    </div>
  );
};
