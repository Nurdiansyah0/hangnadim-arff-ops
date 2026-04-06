import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/layout/MainLayout';
import { useAuth } from './store/useAuth';

// Protected Route Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuth((state) => state.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Check if already logged in -> block Login page access
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuth((state) => state.isAuthenticated());
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Parent Dashboard Layout */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          } 
        >
          {/* Default dashboard tab */}
          <Route index element={<Dashboard />} />
          {/* Subroutes mapping per feature */}
          <Route path="incidents" element={<div>Incidents WIP</div>} />
          <Route path="inspections" element={<div>Inspections WIP</div>} />
          <Route path="vehicles" element={<div>Vehicles WIP</div>} />
          <Route path="personnel" element={<div>Personnel WIP</div>} />
          <Route path="audit" element={<div>Audit WIP</div>} />
        </Route>

        {/* Not Found */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
