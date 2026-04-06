import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inspections from './pages/Inspections';
import Watchroom from './pages/Watchroom';
import Incidents from './pages/Incidents';
import Vehicles from './pages/Vehicles';
import Personnel from './pages/Personnel';
import Shifts from './pages/Shifts';
import Compliance from './pages/Compliance';
import Flights from './pages/Flights';
import Analytics from './pages/Analytics';
import Leave from './pages/Leave';
import MainLayout from './components/layout/MainLayout';
import { useAuth } from './store/useAuth';

// Protected Route Guard: Memastikan hanya user yang login yang bisa masuk
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuth((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik */}
        <Route path="/login" element={<Login />} />

        {/* Rute Terproteksi dengan Layout Utama (Glassmorphism) */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Default dashboard */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/flights" element={<Flights />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/leave" element={<Leave />} />

          {/* Modul Insiden & Darurat */}
          <Route path="/incidents" element={<Incidents />} />

          {/* Modul Inspeksi Kendaraan */}
          <Route path="/inspections" element={<Inspections />} />

          {/* Modul Watchroom Journal */}
          <Route path="/watchroom" element={<Watchroom />} />

          {/* Master Data */}
          <Route path="/assets" element={<Vehicles />} />
          <Route path="/users" element={<Personnel />} />
        </Route>

        {/* Fallback: Jika rute tidak ditemukan, balikkan ke dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
