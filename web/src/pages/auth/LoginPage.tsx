import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../store';
import { Spinner } from '../../components/ui/Spinner';

export function LoginPage() {
  const { signIn } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email)    errs.email    = 'Email is required';
    if (!password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await signIn(email, password);
      success('Welcome back!', 'Signed in successfully.');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      toastError('Sign in failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-muted relative overflow-hidden flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, var(--primary) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-foreground font-bold text-lg">S3T</span>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            Enterprise project<br />management,{' '}
            <span className="text-primary">redefined.</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            From WBS to Gantt charts, AI-powered scope parsing to real-time collaboration —
            everything your team needs in one platform.
          </p>
          <div className="flex flex-wrap gap-3">
            {['WBS Editor', 'Gantt Charts', 'AI SOW Parser', 'Real-time Comments', 'Role-based Access'].map((f) => (
              <span key={f} className="badge-brand text-xs px-3 py-1">{f}</span>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-gray-600 text-sm">© 2026 S3T · Dr Ming Chan Tok</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-foreground font-bold text-lg">S3T</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-foreground">Sign in</h2>
            <p className="text-muted-foreground mt-2">Access your project workspace</p>
          </div>

          {/* Test Accounts Quick Login */}
          <div className="card p-4 border-brand-500/20 bg-brand-500/5 space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-widest">Test Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Admin', email: 'admin@s3t-demo.com' },
                { role: 'Pre Sales Solution Architect', email: 'user@s3t-demo.com' },
                { role: 'Approver', email: 'approver@s3t-demo.com' },
                { role: 'Auditor', email: 'auditor@s3t-demo.com' }
              ].map(acc => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Test1234!');
                  }}
                  className="text-left p-2 rounded-lg border border-border hover:border-brand-500/50 hover:bg-brand-500/10 transition-colors"
                >
                  <p className="text-xs font-bold text-foreground">{acc.role}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{acc.email}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 text-right">Password: Test1234!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label mb-0">Password</label>
                <Link to="/auth/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center btn-lg"
            >
              {loading ? <Spinner size="sm" /> : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-muted-foreground/80 text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/auth/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
