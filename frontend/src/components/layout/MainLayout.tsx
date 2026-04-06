import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        
        {/* Main scrollable content area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
