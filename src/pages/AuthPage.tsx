import { useState } from 'react';
import { Rocket, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.37 1.23-3.21-.12-.3-.54-1.515.12-3.15 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.635.24 2.85.12 3.15.765.84 1.23 1.875 1.23 3.21 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function AuthPage() {
  const { t, lang, setLang } = useI18n();
  const { signIn, signUp, signInWithGithub } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) { setError(t('auth.errorEmpty')); return; }
    if (mode === 'signup' && password.length < 6) { setError(t('auth.errorWeak')); return; }
    if (mode === 'signup' && password !== confirmPassword) { setError(t('auth.errorPasswordMatch')); return; }
    setLoading(true);
    if (mode === 'login') { const { error } = await signIn(email.trim(), password); if (error) setError(error); }
    else { const { error } = await signUp(email.trim(), password); if (error) setError(error); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] />
      </div>
      <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
        <button onClick={toggleTheme} className="p-1.5 rounded-lg bg-[var(--color-surface)]/80 border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors backdrop-blur-sm">{theme === 'dark' ? '☀' : '☾'}</button>
        <div className="flex items-center gap-1 bg-[var(--color-surface)]/80 border border-[var(--color-border)] rounded-lg p-0.5 backdrop-blur-sm">
          <button onClick={() => setLang('zh')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', lang === 'zh' ? 'bg-[var(--color-border)] text-[var(--color-text)]' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)]')}>中文</button>
          <button onClick={() => setLang('en')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', lang === 'en' ? 'bg-[var(--color-border)] text-[var(--color-text)]' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)]')}>EN</button>
        </div>
      </div>
      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="flex flex-col items-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30 mb-3"><Rocket size={24} className="text-white" /></div>
          <h1 className="text-[var(--color-text)] font-bold text-xl tracking-tight">Launchpad</h1>
          <p className="text-[var(--color-text-dim)] text-sm mt-1">{mode === 'login' ? t('auth.welcomeSub') : t('auth.createAccountSub')}</p>
        </div>
        <div className="bg-[var(--color-surface)]/60 border border-[var(--color-border)] rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <h2 className="text-[var(--color-text)] font-semibold text-lg mb-5">{mode === 'login' ? t('auth.login') : t('auth.signup')}</h2>
          {error && (<div className="flex items-center gap-2 px-3 py-2.5 mb-4 bg-[var(--color-error-dim)] border border-[var(--color-error)]/30 rounded-lg text-[var(--color-error)] text-xs animate-slide-down"><AlertCircle size={14} className="shrink-0" /><span>{error}</span></div>)}
          <button onClick={signInWithGithub} className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm font-medium transition-colors mb-4"><GithubIcon size={18} />{t('auth.githubLogin')}</button>
          <div className="flex items-center gap-3 mb-4"><div className="flex-1 h-px bg-[var(--color-border)] /><span className="text-[var(--color-text-dim)] text-xs">{t('auth.orContinue')}</span><div className="flex-1 h-px bg-[var(--color-border)] /></div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('auth.email')}</label><div className="relative"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-9 pr-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-colors" /></div></div>
            <div><label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('auth.password')}</label><div className="relative"><Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-9 pr-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-colors" /></div></div>
            {mode === 'signup' && (<div><label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('auth.confirmPassword')}</label><div className="relative"><Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" /><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full pl-9 pr-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-colors" /></div></div>)}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] border border-[var(--color-primary)] hover:border-[var(--color-primary-hover)] rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{loading ? <Loader2 size={16} className="animate-spin" /> : (mode === 'login' ? t('auth.loginBtn') : t('auth.signupBtn'))}</button>
          </form>
          <div className="flex items-center justify-center gap-1.5 mt-5 text-xs"><span className="text-[var(--color-text-dim)]">{mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}</span><button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }} className="text-[var(--color-primary)] hover:opacity-80 font-medium transition-opacity">{mode === 'login' ? t('auth.signUpHere') : t('auth.signInHere')}</button></div>
        </div>
      </div>
    </div>
  );
}
