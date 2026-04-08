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
import FireExtinguishers from './pages/FireExtinguishers';
import Analytics from './pages/Analytics';
import Leave from './pages/Leave';
import AuditTrail from './pages/AuditTrail';
import StaffDashboard from './pages/StaffDashboard';
import MaintenanceRequest from './pages/MaintenanceRequest';
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

// Pengalihan Berdasarkan Peran: Mengarahkan Staff ke dashboard khusus field ops
const HomeRedirect = () => {
  const user = useAuth((state) => state.user);
  
  // Jika role adalah Officer (9) atau Squad Leader (8), arahkan ke Staff Dashboard
  if (user?.role_id === 9 || user?.role_id === 8) {
    return <Navigate to="/staff/dashboard" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
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
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
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
          <Route path="/fire-extinguishers" element={<FireExtinguishers />} />
          <Route path="/maintenance/request" element={<MaintenanceRequest />} />
          <Route path="/users" element={<Personnel />} />
          <Route path="/audit-trail" element={<AuditTrail />} />
        </Route>

        {/* Fallback: Jika rute tidak ditemukan, balikkan ke dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
