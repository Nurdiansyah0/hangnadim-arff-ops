import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User } from 'lucide-react';
import { api } from '../lib/axios';
import { useAuth } from '../store/useAuth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuth((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Backend mengharapkan field 'ident' (bisa berupa username atau email)
      const response = await api.post('/auth/login', { ident: username, password });
      
      const { access_token } = response.data;
      // Ambil data user dari token atau buat simulasi data sementara jika backend belum return user object
      const mockUser = { id: 'admin-id', username, email: 'admin@arff.id', personnel_id: null, role_id: 1 };
      setAuth(mockUser, access_token);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kredensial tidak valid atau server terputus.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Glassmorphic Card */}
      <div className="w-full max-w-md relative z-10 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-blue-500/50">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight text-center">
            AeroCommand <span className="text-blue-500">V2</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm text-center">
            ARFF Enterprise Resource Planning
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              Username/NIK
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                className="w-full bg-slate-950/50 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
                placeholder="Masukkan Nomor Induk"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-slate-950/50 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
                placeholder="Masukkan Password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Akses Keamanan'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-600">
          Supervised by System Administrator
        </div>
      </div>
    </div>
  );
}
