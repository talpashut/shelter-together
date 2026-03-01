import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './lib/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import GroupPage from './pages/GroupPage';
import SessionPage from './pages/SessionPage';

function AppRoutes() {
  const { profile, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="page items-center justify-center">
        <div className="text-4xl animate-pulse-slow">🏠</div>
        <p className="text-shelter-muted mt-4 text-lg">טוען...</p>
      </div>
    );
  }

  if (!profile) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/group/:groupId" element={<GroupPage />} />
      <Route path="/session/:sessionId" element={<SessionPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
