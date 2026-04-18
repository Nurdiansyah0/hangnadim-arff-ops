import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/shared/Login';
import Dashboard from './pages/shared/Dashboard';
import Inspections from './pages/officer/Inspections';
import WatchroomDashboard from './pages/watchroom/Dashboard';
import VehiclePerformance from './pages/performance_leader/VehiclePerformance';
import MaintenanceDashboard from './pages/maintenance_leader/Dashboard';
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
import OperationLeaderDashboard from './pages/operation_leader/Dashboard';
import MaintenanceRequest from './pages/officer/MaintenanceRequest';
import Roster from './pages/operation_leader/Roster';
import MyTasks from './pages/officer/MyTasks';
import TeamLeaderApproval from './pages/operation_leader/TeamLeaderApproval';
import MainLayout from './components/layout/MainLayout';
import { useAuth } from './store/useAuth';
import { Toaster } from 'react-hot-toast';

// Protected Route Guard: Ensure only authenticated users can access
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuth((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Role-based Redirection: Direct staff to specific field ops dashboard
const HomeRedirect = () => {
  const user = useAuth((state) => state.user);

  if (user?.role_id === 9 || user?.role_id === 10) {
    return <Navigate to="/officer/dashboard" replace />;
  }
  if (user?.role_id === 8 || user?.role_id === 7) {
    return <Navigate to="/squad-leader/dashboard" replace />;
  }
  if (user?.role_id === 11) {
    return <Navigate to="/watchroom" replace />;
  }
  if (user?.role_id === 6) {
    return <Navigate to="/maintenance/dashboard" replace />;
  }
  if (user?.role_id === 5) {
    return <Navigate to="/operation-leader/dashboard" replace />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes with Main Layout (Glassmorphism) */}
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
          <Route path="/operation-leader/dashboard" element={<OperationLeaderDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/shift-approval" element={<TeamLeaderApproval />} />
          <Route path="/roster" element={<Roster />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/flights" element={<Flights />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/performance" element={<VehiclePerformance />} />
          <Route path="/maintenance/dashboard" element={<MaintenanceDashboard />} />
          <Route path="/leave" element={<Leave />} />

          {/* Incident & Emergency Modules */}
          <Route path="/incidents" element={<Incidents />} />

          {/* Vehicle Inspection Module */}
          <Route path="/inspections" element={<Inspections />} />

          {/* Watchroom Journal Module */}
          <Route path="/watchroom" element={<WatchroomDashboard />} />

          {/* Master Data */}
          <Route path="/assets" element={<Vehicles />} />
          <Route path="/fire-extinguishers" element={<FireExtinguishers />} />
          <Route path="/maintenance/request" element={<MaintenanceRequest />} />
          <Route path="/users" element={<Personnel />} />
          <Route path="/audit-trail" element={<AuditTrail />} />
        </Route>

        {/* Fallback: If route not found, return to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
