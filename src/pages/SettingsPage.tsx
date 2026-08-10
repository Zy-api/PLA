import { useState, useEffect } from 'react';
import { User, Bell, Globe, Shield, Palette, Save, Archive } from 'lucide-react';
import { Card, Button, Input, Badge, Spinner } from '@/components/ui';
import { cn, timeAgo } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import * as repoApi from '@/lib/repo-api';
import { supabase, type Project } from '@/lib/supabase';

export function SettingsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState('profile');
  const [name, setName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const sections = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'domains', label: t('settings.domains'), icon: Globe },
    { id: 'deploy-source', label: t('repo.deploy.title'), icon: Archive },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'appearance', label: t('settings.appearance'), icon: Palette },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">{t('settings.title')}</h1>
        <p className="text-[var(--color-text-dim)] text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="sm:w-48 shrink-0">
          <div className="flex sm:flex-col gap-0.5 overflow-x-auto sm:overflow-visible">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap shrink-0',
                    active === s.id ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/40'
                  )}
                >
                  <Icon size={15} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 max-w-xl min-w-0">
          {active === 'profile' && (
            <Card className="p-5 space-y-4">
              <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('settings.profile')}</h2>
              <div>
                <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('settings.displayName')}</label>
                <Input value={name} onChange={setName} />
              </div>
              <div>
                <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('auth.email')}</label>
                <Input value={email} onChange={setEmail} type="email" />
              </div>
              <div>
                <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('settings.username')}</label>
                <Input value={email.split('@')[0]} onChange={() => {}} />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Button onClick={save}><Save size={15} /> {t('settings.saveChanges')}</Button>
                {saved && <span className="text-emerald-400 text-xs animate-fade-in">{t('settings.saved')}</span>}
              </div>
            </Card>
          )}

          {active === 'notifications' && (
            <Card className="p-5 space-y-4">
              <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('settings.notifications')}</h2>
              {[
                { label: t('settings.notif.deployCompleted'), desc: t('settings.notif.deployCompletedDesc'), defaultOn: true },
                { label: t('settings.notif.deployFailed'), desc: t('settings.notif.deployFailedDesc'), defaultOn: true },
                { label: t('settings.notif.domainVerified'), desc: t('settings.notif.domainVerifiedDesc'), defaultOn: false },
                { label: t('settings.notif.weeklySummary'), desc: t('settings.notif.weeklySummaryDesc'), defaultOn: true },
              ].map((item) => (
                <ToggleRow key={item.label} label={item.label} desc={item.desc} defaultOn={item.defaultOn} />
              ))}
            </Card>
          )}

          {active === 'domains' && (
            <Card className="p-5 space-y-4">
              <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('settings.domains')}</h2>
              <p className="text-[var(--color-text-dim)] text-xs">{t('settings.defaultDomainDesc')}</p>
              <div>
                <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('settings.defaultDomain')}</label>
                <Input value="launchpad.dev" onChange={() => {}} />
              </div>
              <div>
                <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('settings.customDomainSuffix')}</label>
                <Input value="" onChange={() => {}} placeholder="mycompany.com" />
              </div>
              <Button onClick={save}><Save size={15} /> {t('settings.saveChanges')}</Button>
            </Card>
          )}

          {active === 'deploy-source' && <DeploySourceSection />}

          {active === 'security' && (
            <Card className="p-5 space-y-4">
              <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('settings.security')}</h2>
              <ToggleRow label={t('settings.twoFactor')} desc={t('settings.twoFactorDesc')} defaultOn={false} />
              <ToggleRow label={t('settings.httpsRedirect')} desc={t('settings.httpsRedirectDesc')} defaultOn={true} />
              <ToggleRow label={t('settings.ddosProtection')} desc={t('settings.ddosProtectionDesc')} defaultOn={true} />
              <div className="pt-2 border-t border-[var(--color-border)]">
                <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('settings.changePassword')}</label>
                <div className="space-y-2">
                  <Input value="" onChange={() => {}} placeholder={t('settings.currentPassword')} type="password" />
                  <Input value="" onChange={() => {}} placeholder={t('settings.newPassword')} type="password" />
                </div>
              </div>
            </Card>
          )}

          {active === 'appearance' && (
            <Card className="p-5 space-y-4">
              <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('settings.appearance')}</h2>
              <div>
                <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-2">{t('settings.theme')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'dark', label: t('theme.dark') },
                    { id: 'light', label: t('theme.light') },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={cn(
                        'p-3 rounded-lg border text-sm transition-all',
                        theme === opt.id ? 'border-[var(--color-primary)] bg-[var(--color-primary-dim)] text-[var(--color-text)]' : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <ToggleRow label={t('settings.reduceMotion')} desc={t('settings.reduceMotionDesc')} defaultOn={false} />
              <ToggleRow label={t('settings.compactMode')} desc={t('settings.compactModeDesc')} defaultOn={false} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <div className="text-[var(--color-text)] text-sm">{label}</div>
        <div className="text-[var(--color-text-dim)] text-xs">{desc}</div>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={cn(
          'relative rounded-full transition-colors shrink-0',
          on ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
        )}
        style={{ height: '22px', width: '40px' }}
      >
        <span
          className={cn(
            'absolute top-0.5 rounded-full bg-white transition-transform',
            on ? 'translate-x-5' : 'translate-x-0.5'
          )}
          style={{ width: '18px', height: '18px' }}
        />
      </button>
    </div>
  );
}

function DeploySourceSection() {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [repos, setRepos] = useState<repoApi.Repo[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [branches, setBranches] = useState<repoApi.Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [deploySources, setDeploySources] = useState<{ projectId: string; source: repoApi.DeploySource | null }[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
      setProjects(data || []);
      const r = await repoApi.listRepos();
      setRepos(r);
      const sources: { projectId: string; source: repoApi.DeploySource | null }[] = [];
      for (const p of data || []) {
        const src = await repoApi.getDeploySource(p.id);
        sources.push({ projectId: p.id, source: src });
      }
      setDeploySources(sources);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedRepo) return;
      const brs = await repoApi.listBranches(selectedRepo);
      setBranches(brs);
      if (brs.length > 0) setSelectedBranch(brs[0].id);
    })();
  }, [selectedRepo]);

  async function handleBind() {
    if (!selectedProject || !selectedRepo || !selectedBranch) return;
    const repo = repos.find((r) => r.id === selectedRepo);
    if (repo?.visibility === 'private') {
      const tok = await repoApi.getValidToken();
      if (!tok) {
        showToast(t('repo.token.required'), 'error');
        return;
      }
    }
    await repoApi.setDeploySource(selectedProject, selectedRepo, selectedBranch);
    const src = await repoApi.getDeploySource(selectedProject);
    setDeploySources((prev) => prev.map((s) => s.projectId === selectedProject ? { projectId: selectedProject, source: src } : s));
    showToast('Deploy source bound', 'success');
  }

  async function handleSync(projectId: string) {
    const source = deploySources.find((s) => s.projectId === projectId)?.source;
    if (!source) return;
    const repo = repos.find((r) => r.id === source.repo_id);
    if (repo?.visibility === 'private') {
      const tok = await repoApi.getValidToken();
      if (!tok) {
        showToast(t('repo.token.required'), 'error');
        return;
      }
    }
    setSyncing(projectId);
    setSyncProgress(0);
    const progressInterval = setInterval(() => {
      setSyncProgress((p) => Math.min(p + 10, 90));
    }, 100);
    try {
      const result = await repoApi.syncDeployFiles(projectId);
      clearInterval(progressInterval);
      setSyncProgress(100);
      setTimeout(() => {
        setSyncing(null);
        setSyncProgress(0);
      }, 500);
      const src = await repoApi.getDeploySource(projectId);
      setDeploySources((prev) => prev.map((s) => s.projectId === projectId ? { projectId, source: src } : s));
      showToast(t('repo.deploy.synced', { count: result.fileCount }), 'success');
    } catch {
      clearInterval(progressInterval);
      setSyncing(null);
      setSyncProgress(0);
      showToast(t('repo.deploy.syncFailed'), 'error');
    }
  }

  async function handleUnbind(projectId: string) {
    await repoApi.removeDeploySource(projectId);
    setDeploySources((prev) => prev.map((s) => s.projectId === projectId ? { projectId, source: null } : s));
    showToast('Unbound', 'success');
  }

  return (
    <Card className="p-5 space-y-5">
      <div>
        <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('repo.deploy.title')}</h2>
        <p className="text-[var(--color-text-dim)] text-xs mt-0.5">{t('repo.deploy.subtitle')}</p>
      </div>

      <div className="space-y-3 p-4 rounded-lg bg-[var(--color-surface-2)]/30 border border-[var(--color-border)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('nav.projects')}</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            >
              <option value="">--</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('repo.deploy.selectRepo')}</label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            >
              <option value="">--</option>
              {repos.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('repo.deploy.selectBranch')}</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            >
              <option value="">--</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <Button size="sm" onClick={handleBind} disabled={!selectedProject || !selectedRepo || !selectedBranch}>
          <Save size={14} /> {t('repo.deploy.bound')}
        </Button>
      </div>

      <div className="space-y-2">
        {deploySources.filter((s) => s.source).length === 0 ? (
          <div className="text-center py-6 text-[var(--color-text-dim)] text-xs">{t('repo.deploy.none')}</div>
        ) : (
          deploySources.filter((s) => s.source).map(({ projectId, source }) => {
            const project = projects.find((p) => p.id === projectId);
            const repo = repos.find((r) => r.id === source!.repo_id);
            const branch = branches.find((b) => b.id === source!.branch_id);
            const isSyncing = syncing === projectId;
            return (
              <div key={projectId} className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]/30">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Archive size={14} className="text-[var(--color-text-muted)]" />
                    <span className="text-[var(--color-text)] text-sm font-medium">{project?.name || projectId}</span>
                    <Badge variant="info">{t('repo.deploy.bound')}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleSync(projectId)} disabled={isSyncing}>
                      {isSyncing ? <Spinner size={13} /> : <Save size={13} />} {isSyncing ? t('repo.deploy.syncing') : t('repo.deploy.sync')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleUnbind(projectId)} disabled={isSyncing}>
                      {t('repo.deploy.unbind')}
                    </Button>
                  </div>
                </div>
                <div className="text-[var(--color-text-dim)] text-xs mt-2">
                  {repo?.name} / {branch?.name || source?.branch_id}
                </div>
                <div className="text-[var(--color-text-dim)] text-xs">
                  {t('repo.deploy.lastSync')}: {source?.last_synced_at ? timeAgo(source.last_synced_at) : t('repo.deploy.never')}
                </div>
                {isSyncing && (
                  <div className="mt-2">
                    <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                      <div className="h-full bg-[var(--color-primary)] transition-all duration-200" style={{ width: `${syncProgress}%` }} />
                    </div>
                    <div className="text-[var(--color-text-dim)] text-xs mt-1">{t('repo.deploy.progress')} {syncProgress}%</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {toast && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          toast.type === 'success' ? 'bg-[var(--color-success-dim)] text-[var(--color-success)]' : 'bg-[var(--color-error-dim)] text-[var(--color-error)]'
        )}>
          {toast.msg}
        </div>
      )}
    </Card>
  );
}
