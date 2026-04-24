import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuth } from '../../store/useAuth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuth((state) => state.setAuth);

  useEffect(() => {
    setMounted(true);
  }, []);

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

      // Ambil data context user lengkap
      const contextRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      const ctx = contextRes.data;
      const user = {
        id: ctx.id,
        username: ctx.username,
        email: ctx.email,
        full_name: ctx.full_name || ctx.username,
        role: ctx.role,
        personnel_id: ctx.personnel_id,
        role_id: ctx.role_id,
        remaining_leave: ctx.remaining_leave,
        annual_leave_quota: ctx.annual_leave_quota,
        shift_team: ctx.shift_team
      };

      setAuth(user, access_token);
      localStorage.removeItem('arff-token-temp');

      // Redirect berdasarkan role
      if (user.role_id === 9 || user.role_id === 10) {
        navigate('/officer/dashboard');
      } else if (user.role_id === 8 || user.role_id === 7) {
        navigate('/squad-leader/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid credentials or server disconnected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-[#020617] selection:bg-indigo-500/30">
      {/* Background Image with Parallax-like effect */}
      <div
        className={`absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 ease-out ${mounted ? 'scale-110' : 'scale-125'}`}
        style={{ backgroundImage: "url('/theme/login-bg.png')" }}
      />
      
      {/* Dynamic Animated Overlay */}
      <div className="absolute inset-0 z-0 bg-linear-to-tr from-[#020617] via-[#020617]/80 to-[#020617]/90" />
      
      {/* Floating Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse delay-700 pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Main Container */}
      <div className={`w-full max-w-md relative z-10 transition-all duration-1000 ease-out transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        
        {/* Glassmorphic Card */}
        <div className="bg-white/3 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          
          {/* Subtle Inner Glow */}
          <div className="absolute -inset-px bg-linear-to-br from-white/10 to-transparent rounded-[2.5rem] pointer-events-none" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                <div className="w-24 h-24 bg-linear-to-br from-slate-800 to-slate-900 p-4 rounded-3xl border border-white/10 shadow-2xl relative">
                  <img
                    src="/theme/logo-arff.jpg"
                    alt="ARFF Logo"
                    className="w-full h-full object-contain filter drop-shadow-lg"
                  />
                </div>
              </div>
              
              <div className="text-center">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-b from-white to-white/60 tracking-tighter mb-2">
                  HAIS
                </h1>
                <div className="flex items-center gap-2 justify-center">
                  <div className="h-px w-4 bg-indigo-500/50" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400/80">
                    Hang Nadim ARFF
                  </p>
                  <div className="h-px w-4 bg-indigo-500/50" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-shake">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  Credentials
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-white/3 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all duration-300"
                    placeholder="Username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-4 bg-white/3 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all duration-300"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-indigo-400 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-2xl p-px transition-all duration-300 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-linear-to-r from-indigo-600 via-blue-600 to-indigo-600 bg-size-[200%_auto] animate-gradient group-hover:bg-right transition-all duration-500" />
                <div className="relative bg-slate-950/20 group-hover:bg-transparent py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
                      <span className="text-white font-bold tracking-wide uppercase text-sm">Initialize Access</span>
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>
          
          {/* Bottom decorative elements */}
          <div className="mt-8 flex justify-center items-center gap-4 opacity-40">
            <div className="h-px w-8 bg-slate-700" />
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">Secure Gateway</span>
            <div className="h-px w-8 bg-slate-700" />
          </div>
        </div>

        {/* Footer info */}
        <p className={`mt-8 text-center text-slate-500 text-xs transition-all duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          © 2026 Hang Nadim International Airport. All rights reserved.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s linear infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}} />
    </div>
  );
}

