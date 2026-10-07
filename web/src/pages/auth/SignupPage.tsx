import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../store';
import { Spinner } from '../../components/ui/Spinner';

export function SignupPage() {
  const { signUp } = useAuth();
  const { error: toastError } = useToast();

  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name)               errs.name     = 'Full name is required';
    if (!form.email)              errs.email    = 'Email is required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await signUp(form.email, form.password, form.name);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      toastError('Sign up failed', msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Sign-up form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-foreground font-bold text-lg">S3T</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-foreground">Create your account</h2>
          <p className="text-muted-foreground mt-2">Start managing projects smarter</p>
        </div>



        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { id: 'name',  label: 'Full name',      type: 'text',  icon: User, placeholder: 'Jane Smith',         key: 'name'  },
            { id: 'email', label: 'Email address',  type: 'email', icon: Mail, placeholder: 'jane@company.com',   key: 'email' },
          ].map(({ id, label, type, icon: Icon, placeholder, key }) => (
            <div key={id}>
              <label htmlFor={id} className="label">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
                <input
                  id={id} type={type} value={form[key as keyof typeof form]}
                  onChange={set(key)} placeholder={placeholder}
                  className={`input pl-10 ${errors[key] ? 'input-error' : ''}`}
                />
              </div>
              {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
            </div>
          ))}

          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
              <input
                id="password" type={showPw ? 'text' : 'password'} value={form.password}
                onChange={set('password')} placeholder="Min. 8 characters"
                className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirm" className="label">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
              <input
                id="confirm" type="password" value={form.confirm}
                onChange={set('confirm')} placeholder="Repeat password"
                className={`input pl-10 ${errors.confirm ? 'input-error' : ''}`}
              />
            </div>
            {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center btn-lg mt-2">
            {loading ? <Spinner size="sm" /> : <>Create account <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-muted-foreground/80 text-sm">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
