import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuth } from '../../store/useAuth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      // Simpan token sementara di localStorage agar interceptor bisa menggunakannya
      localStorage.setItem('arff-token-temp', access_token);

      // Ambil data user asli dari profile me
      const profileRes = await api.get('/auth/profile/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const profile = profileRes.data;
      const user = {
        id: profile.personal.id,
        username: profile.personal.username,
        email: profile.personal.email,
        full_name: profile.personal.full_name,
        role: profile.role,
        nip_nik: profile.personal.nip_nik,
        personnel_id: profile.personal.personnel_id,
        role_id: profile.personal.role_id
      };

      setAuth(user, access_token);
      localStorage.removeItem('arff-token-temp');

      // Redirect berdasarkan role
      if (user.role_id === 9 || user.role_id === 8) {
        navigate('/staff/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kredensial tidak valid atau server terputus.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-slate-950">
      {/* Dynamic Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{ backgroundImage: "url('/theme/login-bg.png')" }}
      />
      <div className="absolute inset-0 z-0 bg-linear-to-br from-slate-950/90 via-slate-900/60 to-slate-950/90" />

      {/* Decorative Blur Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Glassmorphic Card */}
      <div className="w-full max-w-md relative z-10 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex items-center gap-6 mb-10">
          <div className="w-20 h-20 shrink-0">
            <img
              src="/theme/logo-arff.jpg"
              alt="ARFF Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,0,0.3)] shadow-2xl rounded-full"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">
              ARSI <span className="text-blue-500 italic">V2</span>
            </h1>
            <p className="text-slate-400 mt-2 text-[10px] font-bold uppercase tracking-widest leading-normal">
              Sistem Informasi Operasional & Pelaporan
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                className="w-full bg-slate-950/50 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
                placeholder="Masukkan Username"
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
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-slate-950/50 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
                placeholder="Masukkan Password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Akses Keamanan'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
