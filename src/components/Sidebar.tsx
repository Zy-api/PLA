import { useState, useEffect } from 'react';
import { LayoutDashboard, FolderGit2, Activity, Settings, Rocket, ChevronRight, LogOut, Languages, Sun, Moon, Menu, X, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

export type Route =
  | { name: 'dashboard' }
  | { name: 'projects' }
  | { name: 'repos' }
  | { name: 'repo'; repoId: string; tab?: string }
  | { name: 'activity' }
  | { name: 'settings' }
  | { name: 'project'; projectId: string; tab?: string };

export function Sidebar({ route, onNavigate, projectCount }: { route: Route; onNavigate: (r: Route) => void; projectCount: number }) {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeId = route.name === 'project' ? 'projects' : route.name === 'repo' ? 'repos' : route.name;

  useEffect(() => { setMobileOpen(false); }, [route]);

  const navItems = [
    { id: 'dashboard' as const, label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'projects' as const, label: t('nav.projects'), icon: FolderGit2 },
    { id: 'repos' as const, label: t('nav.repos'), icon: Archive },
    { id: 'activity' as const, label: t('nav.activity'), icon: Activity },
    { id: 'settings' as const, label: t('nav.settings'), icon: Settings },
  ];

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'JD';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const sidebarContent = (
    <>
      <div className="px-4 py-4 flex items-center gap-2.5 border-b border-[var(--color-border)]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Rocket size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="text-[var(--color-text)] font-semibold text-sm leading-tight">{t('app.name')}</div>
          <div className="text-[var(--color-text-dim)] text-[10px] leading-tight">{t('app.tagline')}</div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-dim)]"><X size={18} /></button>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeId === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate({ name: item.id } as Route)} className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 group', active ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50')}>
              <Icon size={16} className={active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)] group-hover:text-[var(--color-text-muted)]'} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'projects' && projectCount > 0 && <span className="text-[10px] text-[var(--color-text-dim)] bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded">{projectCount}</span>}
              {active && <ChevronRight size={14} className="text-[var(--color-text-dim)]" />}
            </button>
          );
        })}
      </nav>
      <div className="px-3 py-2 border-t border-[var(--color-border)] space-y-2">
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            {theme === 'dark' ? t('theme.light') : t('theme.dark')}
          </button>
        </div>
        <div className="flex items-center gap-1 bg-[var(--color-surface-2)] rounded-lg p-0.5">
          <Languages size={13} className="text-[var(--color-text-dim)] ml-1.5" />
          <button onClick={() => setLang('zh')} className={cn('flex-1 py-1 rounded-md text-xs font-medium transition-colors', lang === 'zh' ? 'bg-[var(--color-border)] text-[var(--color-text)]' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)]')}>中文</button>
          <button onClick={() => setLang('en')} className={cn('flex-1 py-1 rounded-md text-xs font-medium transition-colors', lang === 'en' ? 'bg-[var(--color-border)] text-[var(--color-text)]' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)]')}>EN</button>
        </div>
      </div>
      <div className="px-3 py-3 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--color-surface-2)]/50 transition-colors group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-text-dim)] to-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] text-xs font-semibold shrink-0">{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[var(--color-text-muted)] text-xs font-medium truncate">{displayName}</div>
            <div className="text-[var(--color-text-dim)] text-[10px] truncate">{user?.email || ''}</div>
          </div>
          <button onClick={signOut} className="p-1 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors shrink-0" title={t('auth.logout')}><LogOut size={14} /></button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-60 shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex-col h-screen sticky top-0">{sidebarContent}</aside>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center"><Rocket size={16} className="text-white" /></div>
          <span className="text-[var(--color-text)] font-semibold text-sm">{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] transition-colors">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] transition-colors"><Menu size={20} /></button>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col animate-slide-down">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
