import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { useAuthStore } from './store/authStore';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { TaskList } from './components/TaskList';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, isRehydrating } = useAuthStore();

  if (isRehydrating) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<TaskList />} />
      </Route>
    </Routes>
  );
}

export default App
