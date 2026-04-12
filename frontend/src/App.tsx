import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/shared/Login';
import Dashboard from './pages/shared/Dashboard';
import Inspections from './pages/officer/Inspections';
import Watchroom from './pages/operation_leader/Watchroom';
import Incidents from './pages/squad_leader/Incidents';
import Vehicles from './pages/admin/Vehicles';
import Personnel from './pages/admin/Personnel';
import Shifts from './pages/admin/Shifts';
import Compliance from './pages/performance_leader/Compliance';
import Flights from './pages/operation_leader/Flights';
import FireExtinguishers from './pages/officer/FireExtinguishers';
import Analytics from './pages/manager/Analytics';
import Leave from './pages/shared/Leave';
import AuditTrail from './pages/admin/AuditTrail';
import OfficerDashboard from './pages/officer/Dashboard';
import SquadLeaderDashboard from './pages/squad_leader/Dashboard';
import MaintenanceRequest from './pages/officer/MaintenanceRequest';
import Roster from './pages/operation_leader/Roster';
import MyTasks from './pages/officer/MyTasks';
import TeamLeaderApproval from './pages/operation_leader/TeamLeaderApproval';
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

  if (user?.role_id === 9 || user?.role_id === 10) {
    return <Navigate to="/officer/dashboard" replace />;
  }
  if (user?.role_id === 8 || user?.role_id === 7) {
    return <Navigate to="/squad-leader/dashboard" replace />;
  }

  return <Dashboard />;
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
          {/* Default dashboard routing handles redirection logic */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<HomeRedirect />} />
          <Route path="/officer/dashboard" element={<OfficerDashboard />} />
          <Route path="/squad-leader/dashboard" element={<SquadLeaderDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/shift-approval" element={<TeamLeaderApproval />} />
          <Route path="/roster" element={<Roster />} />
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
