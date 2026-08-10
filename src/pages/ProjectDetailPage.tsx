import { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft, Rocket, GitBranch, ExternalLink, Plus, Trash2, Globe, Key, Settings as SettingsIcon,
  Activity as ActivityIcon, GitCommit, RefreshCw, Check, X, Clock, Zap, Copy, Eye, EyeOff,
  Terminal, AlertCircle, CheckCircle2, Loader2, Upload
} from 'lucide-react';
import { supabase, type Project, type Deployment, type EnvVar, type Domain, type Activity } from '@/lib/supabase';
import { Card, Badge, Button, Input, StatusDot, EmptyState, Spinner } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { cn, timeAgo, formatDate, shortSha, formatDuration } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { Route } from '@/components/Sidebar';

type Tab = 'overview' | 'deployments' | 'env' | 'domains' | 'settings' | 'activity';

export function ProjectDetailPage({
  projectId,
  initialTab,
  onNavigate,
}: {
  projectId: string;
  initialTab?: string;
  onNavigate: (r: Route) => void;
}) {
  const { t } = useI18n();
  const [project, setProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [tab, setTab] = useState<Tab>((initialTab as Tab) || 'overview');
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const loadAll = useCallback(async () => {
    const [{ data: p }, { data: d }, { data: e }, { data: dom }, { data: a }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).maybeSingle(),
      supabase.from('deployments').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('env_vars').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('domains').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('activity').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    ]);
    setProject(p as Project | null);
    setDeployments(d || []);
    setEnvVars(e || []);
    setDomains(dom || []);
    setActivity(a || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function logActivity(eventType: string, eventData: string) {
    await supabase.from('activity').insert({
      project_id: projectId,
      event_type: eventType,
      event_data: eventData,
    });
  }

  async function startDeploy() {
    if (!project) return;
    setShowDeployModal(true);
    setDeploying(true);
    setDeployLogs([]);

    const sha = Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    const commitMsg = `Update ${project.name}`;
    const author = 'John Doe';
    const deployUrl = `https://${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.launchpad.dev`;

    const { data: dep } = await supabase.from('deployments').insert({
      project_id: projectId,
      status: 'queued',
      commit_sha: sha,
      commit_message: commitMsg,
      author,
      url: deployUrl,
    }).select().single();

    await supabase.from('projects').update({ status: 'building', updated_at: new Date().toISOString() }).eq('id', projectId);
    await logActivity('deployment.created', `Deployment started for "${commitMsg}"`);
    loadAll();

    const steps = [
      { msg: t('deploy.cloning'), delay: 600 },
      { msg: t('deploy.installing'), delay: 1200 },
      { msg: `${t('deploy.runningBuild')} (${project.build_command || 'npm run build'})`, delay: 1800 },
      { msg: t('deploy.optimizing'), delay: 1000 },
      { msg: t('deploy.uploading'), delay: 900 },
      { msg: t('deploy.configuringCdn'), delay: 800 },
      { msg: t('deploy.ready'), delay: 500 },
    ];

    const startTime = Date.now();
    for (const step of steps) {
      setDeployLogs((prev) => [...prev, step.msg]);
      await new Promise((r) => setTimeout(r, step.delay));
    }

    const duration = Date.now() - startTime;
    await supabase.from('deployments').update({
      status: 'ready',
      build_duration_ms: duration,
      finished_at: new Date().toISOString(),
    }).eq('id', dep.id);

    await supabase.from('projects').update({ status: 'ready', updated_at: new Date().toISOString() }).eq('id', projectId);
    await logActivity('deployment.ready', `Deployment completed in ${formatDuration(duration)}`);

    setDeploying(false);
    loadAll();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-text)]0">
        <Spinner size={24} />
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <EmptyState
          icon={<AlertCircle size={22} />}
          title={t('project.notFound')}
          description={t('project.notFoundDesc')}
          action={<Button onClick={() => onNavigate({ name: 'projects' })}>{t('common.backToProjects')}</Button>}
        />
      </Card>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Rocket }[] = [
    { id: 'overview', label: t('project.overview'), icon: Rocket },
    { id: 'deployments', label: t('project.deployments'), icon: GitCommit },
    { id: 'env', label: t('project.envVars'), icon: Key },
    { id: 'domains', label: t('project.domains'), icon: Globe },
    { id: 'activity', label: t('project.activity'), icon: ActivityIcon },
    { id: 'settings', label: t('project.settings'), icon: SettingsIcon },
  ];

  const latestDeploy = deployments[0];
  const statusLabel = (s: string) => t(`status.${s}` as 'status.ready');

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <button
          onClick={() => onNavigate({ name: 'projects' })}
          className="flex items-center gap-1 text-[var(--color-text)]0 hover:text-[var(--color-text-muted)] text-xs mb-3 transition-colors"
        >
          <ChevronLeft size={14} /> {t('project.backToProjects')}
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center">
              <Rocket size={20} className="text-[var(--color-text-muted)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">{project.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-[var(--color-text)]0 text-xs">
                <span className="flex items-center gap-1"><GitBranch size={11} /> {project.branch}</span>
                <span>·</span>
                <span className="capitalize">{project.framework}</span>
                <span>·</span>
                <StatusDot status={project.status} />
                <span>{statusLabel(project.status)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {latestDeploy && (
              <a href={latestDeploy.url || '#'} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm"><ExternalLink size={14} /> {t('project.visit')}</Button>
              </a>
            )}
            <Button size="sm" onClick={startDeploy} disabled={deploying}>
              {deploying ? <Spinner size={14} /> : <Rocket size={14} />} {t('project.deploy')}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[var(--color-border)] -mb-px overflow-x-auto">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors -mb-px whitespace-nowrap',
                active ? 'border-[var(--color-primary)] text-[var(--color-text)]' : 'border-transparent text-[var(--color-text)]0 hover:text-[var(--color-text-muted)]'
              )}
            >
              <Icon size={14} />
              {tb.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <OverviewTab project={project} deployments={deployments} domains={domains} envVars={envVars} />
      )}
      {tab === 'deployments' && (
        <DeploymentsTab deployments={deployments} onRedeploy={startDeploy} deploying={deploying} />
      )}
      {tab === 'env' && (
        <EnvVarsTab envVars={envVars} projectId={projectId} onChanged={loadAll} onLog={logActivity} />
      )}
      {tab === 'domains' && (
        <DomainsTab domains={domains} projectId={projectId} projectName={project.name} onChanged={loadAll} onLog={logActivity} />
      )}
      {tab === 'activity' && (
        <ActivityTab activity={activity} />
      )}
      {tab === 'settings' && (
        <SettingsTab project={project} onChanged={loadAll} onNavigate={onNavigate} onLog={logActivity} />
      )}

      <DeployModal
        open={showDeployModal}
        onClose={() => !deploying && setShowDeployModal(false)}
        logs={deployLogs}
        deploying={deploying}
        projectName={project.name}
      />
    </div>
  );
}

function OverviewTab({ project, deployments, domains, envVars }: { project: Project; deployments: Deployment[]; domains: Domain[]; envVars: EnvVar[] }) {
  const { t } = useI18n();
  const latest = deployments[0];
  const stats = [
    { label: t('project.deployments'), value: deployments.length, icon: Rocket, color: 'text-[var(--color-primary)]' },
    { label: t('project.domains'), value: domains.length, icon: Globe, color: 'text-[var(--color-success)]' },
    { label: t('project.envVars'), value: envVars.length, icon: Key, color: 'text-amber-400' },
    { label: t('create.framework'), value: project.framework, icon: Zap, color: 'text-violet-400' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-2 text-[var(--color-text)]0 text-xs mb-2">
                <Icon size={14} className={s.color} />
                {s.label}
              </div>
              <div className="text-xl font-bold text-[var(--color-text)] capitalize">{s.value}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-[var(--color-text)] font-semibold text-sm mb-3">{t('project.latestDeployment')}</h3>
          {latest ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusDot status={latest.status} />
                <Badge variant={latest.status === 'ready' ? 'success' : latest.status === 'building' ? 'info' : latest.status === 'error' ? 'error' : 'default'}>
                  {t(`status.${latest.status}` as 'status.ready')}
                </Badge>
                <span className="text-[var(--color-text)]0 text-xs ml-auto">{timeAgo(latest.created_at)}</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text)]0">{t('project.commit')}</span>
                  <span className="text-[var(--color-text-muted)] font-mono text-xs">{shortSha(latest.commit_sha)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text)]0">{t('project.message')}</span>
                  <span className="text-[var(--color-text-muted)] text-xs truncate ml-4">{latest.commit_message}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text)]0">{t('project.author')}</span>
                  <span className="text-[var(--color-text-muted)] text-xs">{latest.author}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text)]0">{t('project.buildTime')}</span>
                  <span className="text-[var(--color-text-muted)] text-xs">{formatDuration(latest.build_duration_ms)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text)]0">{t('project.url')}</span>
                  <a href={latest.url || '#'} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] text-xs hover:underline flex items-center gap-1">
                    {latest.url} <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[var(--color-text-dim)] text-sm text-center py-6">{t('project.noDeployments')}</div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-[var(--color-text)] font-semibold text-sm mb-3">{t('project.projectInfo')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text)]0">{t('project.created')}</span>
              <span className="text-[var(--color-text-muted)] text-xs">{formatDate(project.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text)]0">{t('project.lastUpdated')}</span>
              <span className="text-[var(--color-text-muted)] text-xs">{timeAgo(project.updated_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text)]0">{t('project.repository')}</span>
              <span className="text-[var(--color-text-muted)] text-xs truncate ml-4">{project.repo_url || t('project.notConnected')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text)]0">{t('create.branch')}</span>
              <span className="text-[var(--color-text-muted)] text-xs font-mono">{project.branch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text)]0">{t('project.status')}</span>
              <span className="text-[var(--color-text-muted)] text-xs">{t(`status.${project.status}` as 'status.ready')}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function DeploymentsTab({ deployments, onRedeploy, deploying }: { deployments: Deployment[]; onRedeploy: () => void; deploying: boolean }) {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('project.deployHistory')}</h2>
        <Button size="sm" variant="secondary" onClick={onRedeploy} disabled={deploying}>
          {deploying ? <Spinner size={13} /> : <RefreshCw size={13} />} {t('project.redeploy')}
        </Button>
      </div>
      {deployments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Rocket size={22} />}
            title={t('project.noDeployments')}
            description={t('project.deployDesc')}
            action={<Button size="sm" onClick={onRedeploy} disabled={deploying}><Rocket size={14} /> {t('project.deployNow')}</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]/60">
            {deployments.map((d, i) => (
              <div key={d.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[var(--color-surface-2)]/30 transition-colors">
                <StatusDot status={d.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-text)] text-sm font-medium">{d.commit_message}</span>
                    {i === 0 && <Badge variant="info">{t('project.latest')}</Badge>}
                  </div>
                  <div className="text-[var(--color-text-dim)] text-xs flex items-center gap-2 mt-0.5">
                    <span className="font-mono">{shortSha(d.commit_sha)}</span>
                    <span>·</span>
                    <span>{d.author}</span>
                    <span>·</span>
                    <span>{timeAgo(d.created_at)}</span>
                    {d.build_duration_ms && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {formatDuration(d.build_duration_ms)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {d.status === 'ready' && d.url && (
                    <a href={d.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text)]0 hover:text-[var(--color-text-muted)] transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <Badge variant={d.status === 'ready' ? 'success' : d.status === 'building' ? 'info' : d.status === 'error' ? 'error' : 'default'}>
                    {t(`status.${d.status}` as 'status.ready')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function EnvVarsTab({ envVars, projectId, onChanged, onLog }: { envVars: EnvVar[]; projectId: string; onChanged: () => void; onLog: (t: string, d: string) => void }) {
  const { t } = useI18n();
  const [showAdd, setShowAdd] = useState(false);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  async function addVar() {
    if (!key.trim() || !value.trim()) return;
    setAdding(true);
    await supabase.from('env_vars').insert({ project_id: projectId, key: key.trim(), value: value.trim() });
    await onLog('env_var.added', `Environment variable "${key.trim()}" added`);
    setKey('');
    setValue('');
    setAdding(false);
    setShowAdd(false);
    onChanged();
  }

  async function deleteVar(id: string, k: string) {
    await supabase.from('env_vars').delete().eq('id', id);
    await onLog('env_var.deleted', `Environment variable "${k}" deleted`);
    onChanged();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('env.title')}</h2>
          <p className="text-[var(--color-text)]0 text-xs mt-0.5">{t('env.subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={14} /> {t('env.add')}</Button>
      </div>

      {envVars.length === 0 && !showAdd ? (
        <Card>
          <EmptyState
            icon={<Key size={22} />}
            title={t('env.none')}
            description={t('env.noneDesc')}
            action={<Button size="sm" onClick={() => setShowAdd(true)}><Plus size={14} /> {t('env.add')}</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]/60">
            {showAdd && (
              <div className="px-5 py-3.5 bg-[var(--color-surface-2)]/30 flex items-center gap-2 animate-slide-down">
                <Input value={key} onChange={setKey} placeholder={t('env.key')} className="font-mono flex-1" />
                <Input value={value} onChange={setValue} placeholder={t('env.value')} className="font-mono flex-1" type="password" />
                <Button size="sm" onClick={addVar} disabled={adding || !key.trim() || !value.trim()}>
                  {adding ? <Spinner size={13} /> : <Check size={14} />} {t('env.add')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}><X size={14} /></Button>
              </div>
            )}
            {envVars.map((v) => {
              const visible = visibleIds.has(v.id);
              return (
                <div key={v.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-2)]/30 transition-colors group">
                  <Key size={14} className="text-[var(--color-text-dim)] shrink-0" />
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                    <span className="text-[var(--color-text)] text-sm font-mono truncate">{v.key}</span>
                    <span className="text-[var(--color-text)]0 text-sm font-mono truncate">
                      {visible ? v.value : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setVisibleIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(v.id)) next.delete(v.id);
                        else next.add(v.id);
                        return next;
                      })}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text)]0 hover:text-[var(--color-text-muted)] transition-colors"
                    >
                      {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => deleteVar(v.id, v.key)}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-error)]/10 text-[var(--color-text)]0 hover:text-[var(--color-error)] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function DomainsTab({ domains, projectId, projectName, onChanged, onLog }: { domains: Domain[]; projectId: string; projectName: string; onChanged: () => void; onLog: (t: string, d: string) => void }) {
  const { t } = useI18n();
  const [showAdd, setShowAdd] = useState(false);
  const [domain, setDomain] = useState('');
  const [adding, setAdding] = useState(false);

  async function addDomain() {
    if (!domain.trim()) return;
    setAdding(true);
    const cleanDomain = domain.trim().toLowerCase();
    await supabase.from('domains').insert({ project_id: projectId, domain: cleanDomain, verified: false });
    await onLog('domain.added', `Domain "${cleanDomain}" added`);
    setDomain('');
    setAdding(false);
    setShowAdd(false);
    onChanged();

    setTimeout(async () => {
      const { data } = await supabase.from('domains').select('id').eq('project_id', projectId).eq('domain', cleanDomain).maybeSingle();
      if (data) {
        await supabase.from('domains').update({ verified: true }).eq('id', data.id);
        await onLog('domain.verified', `Domain "${cleanDomain}" verified`);
        onChanged();
      }
    }, 3000);
  }

  async function deleteDomain(id: string, d: string) {
    await supabase.from('domains').delete().eq('id', id);
    await onLog('domain.deleted', `Domain "${d}" removed`);
    onChanged();
  }

  const defaultDomain = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.launchpad.dev`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('domain.title')}</h2>
          <p className="text-[var(--color-text)]0 text-xs mt-0.5">{t('domain.subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={14} /> {t('domain.add')}</Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
            <Globe size={17} className="text-[var(--color-primary)]" />
          </div>
          <div className="flex-1">
            <div className="text-[var(--color-text)] text-sm font-medium font-mono">{defaultDomain}</div>
            <div className="text-[var(--color-text-dim)] text-xs">{t('domain.default')}</div>
          </div>
          <Badge variant="success"><Check size={11} /> {t('common.active')}</Badge>
          <a href={`https://${defaultDomain}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text)]0 hover:text-[var(--color-text-muted)] transition-colors">
            <ExternalLink size={14} />
          </a>
        </div>
      </Card>

      {showAdd && (
        <Card className="p-4 animate-slide-down">
          <div className="flex items-center gap-2">
            <Input value={domain} onChange={setDomain} placeholder="www.myapp.com" className="flex-1" />
            <Button size="sm" onClick={addDomain} disabled={adding || !domain.trim()}>
              {adding ? <Spinner size={13} /> : <Plus size={14} />} {t('domain.add')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}><X size={14} /></Button>
          </div>
          <p className="text-[var(--color-text-dim)] text-xs mt-2">{t('domain.cnameHint')} <span className="font-mono text-[var(--color-text)]0">cname.launchpad.dev</span></p>
        </Card>
      )}

      {domains.length > 0 && (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]/60">
            {domains.map((d) => (
              <div key={d.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[var(--color-surface-2)]/30 transition-colors">
                <Globe size={15} className="text-[var(--color-text)]0 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[var(--color-text)] text-sm font-mono">{d.domain}</div>
                  <div className="text-[var(--color-text-dim)] text-xs">{t('domain.added')} {timeAgo(d.created_at)}</div>
                </div>
                {d.verified ? (
                  <Badge variant="success"><Check size={11} /> {t('domain.verified')}</Badge>
                ) : (
                  <Badge variant="warning"><Loader2 size={11} className="animate-spin" /> {t('domain.verifying')}</Badge>
                )}
                <button
                  onClick={() => deleteDomain(d.id, d.domain)}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-error)]/10 text-[var(--color-text)]0 hover:text-[var(--color-error)] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ActivityTab({ activity }: { activity: Activity[] }) {
  const { t } = useI18n();
  return (
    <Card className="overflow-hidden">
      {activity.length === 0 ? (
        <EmptyState icon={<ActivityIcon size={22} />} title={t('activity.none')} description={t('activity.noneDesc')} />
      ) : (
        <div className="divide-y divide-[var(--color-border)]/60">
          {activity.map((a) => (
            <div key={a.id} className="px-5 py-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                <ActivityIcon size={13} className="text-[var(--color-text-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[var(--color-text)] text-sm">{a.event_data || a.event_type}</div>
                <div className="text-[var(--color-text-dim)] text-xs">{formatDate(a.created_at)} · {timeAgo(a.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SettingsTab({ project, onChanged, onNavigate, onLog }: { project: Project; onChanged: () => void; onNavigate: (r: Route) => void; onLog: (t: string, d: string) => void }) {
  const { t } = useI18n();
  const [name, setName] = useState(project.name);
  const [branch, setBranch] = useState(project.branch);
  const [repoUrl, setRepoUrl] = useState(project.repo_url || '');
  const [framework, setFramework] = useState(project.framework);
  const [buildCommand, setBuildCommand] = useState(project.build_command || 'npm run build');
  const [outputDir, setOutputDir] = useState(project.output_directory || 'dist');
  const [installCmd, setInstallCmd] = useState(project.install_command || 'npm install');
  const [rootDir, setRootDir] = useState(project.root_directory || '/');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from('projects').update({
      name: name.trim(),
      branch: branch.trim(),
      repo_url: repoUrl.trim() || null,
      framework,
      build_command: buildCommand.trim(),
      output_directory: outputDir.trim(),
      install_command: installCmd.trim(),
      root_directory: rootDir.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', project.id);
    await onLog('project.updated', `Project settings updated`);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onChanged();
  }

  async function deleteProject() {
    setDeleting(true);
    await supabase.from('projects').delete().eq('id', project.id);
    setDeleting(false);
    onNavigate({ name: 'projects' });
  }

  return (
    <div className="space-y-4 max-w-xl">
      <Card className="p-5 space-y-4">
        <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('settings.general')}</h2>
        <div>
          <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('settings.projectName')}</label>
          <Input value={name} onChange={setName} />
        </div>
        <div>
          <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('settings.frameworkPreset')}</label>
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          >
            {['vite', 'nextjs', 'astro', 'nuxt', 'sveltekit', 'static'].map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('settings.repoUrl')}</label>
            <Input value={repoUrl} onChange={setRepoUrl} placeholder="https://github.com/..." />
          </div>
          <div>
            <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('create.branch')}</label>
            <Input value={branch} onChange={setBranch} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? <Spinner size={14} /> : <Upload size={15} />} {t('settings.saveChanges')}
          </Button>
          {saved && <span className="text-[var(--color-success)] text-xs animate-fade-in">{t('settings.saved')}</span>}
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('build.title')}</h2>
        <div>
          <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('build.command')}</label>
          <Input value={buildCommand} onChange={setBuildCommand} placeholder="npm run build" className="font-mono" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('build.outputDir')}</label>
            <Input value={outputDir} onChange={setOutputDir} placeholder="dist" className="font-mono" />
          </div>
          <div>
            <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('build.installCmd')}</label>
            <Input value={installCmd} onChange={setInstallCmd} placeholder="npm install" className="font-mono" />
          </div>
        </div>
        <div>
          <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('build.rootDir')}</label>
          <Input value={rootDir} onChange={setRootDir} placeholder="/" className="font-mono" />
        </div>
      </Card>

      <Card className="p-5 border-[var(--color-error)]/20">
        <h2 className="text-[var(--color-error)] font-semibold text-sm mb-1">{t('settings.dangerZone')}</h2>
        <p className="text-[var(--color-text)]0 text-xs mb-3">{t('settings.dangerDesc')}</p>
        {!showDelete ? (
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}><Trash2 size={14} /> {t('settings.deleteProject')}</Button>
        ) : (
          <div className="flex items-center gap-2 animate-slide-down">
            <span className="text-[var(--color-text-muted)] text-xs">{t('settings.areYouSure')}</span>
            <Button variant="danger" size="sm" onClick={deleteProject} disabled={deleting}>
              {deleting ? <Spinner size={13} /> : <Check size={14} />} {t('settings.yesDelete')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowDelete(false)}><X size={14} /> {t('settings.cancel')}</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function DeployModal({ open, onClose, logs, deploying, projectName }: { open: boolean; onClose: () => void; logs: string[]; deploying: boolean; projectName: string }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={`${t('deploy.deploying')} ${projectName}`} size="lg">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {deploying ? (
            <Loader2 size={16} className="text-[var(--color-primary)] animate-spin" />
          ) : (
            <CheckCircle2 size={16} className="text-[var(--color-success)]" />
          )}
          <span className="text-[var(--color-text)] text-sm font-medium">
            {deploying ? t('deploy.building') : t('deploy.complete')}
          </span>
        </div>

        <div className="bg-black/60 border border-[var(--color-border)] rounded-lg p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
          {logs.length === 0 && deploying && (
            <div className="text-[var(--color-text-dim)] flex items-center gap-2">
              <Terminal size={12} /> {t('deploy.initializing')}
            </div>
          )}
          {logs.map((log, i) => (
            <div key={i} className="text-[var(--color-text-muted)] flex items-start gap-2 animate-fade-in">
              <span className="text-[var(--color-text-dim)]">$</span>
              <span>{log}</span>
              {i === logs.length - 1 && deploying && (
                <span className="inline-block w-2 h-3 bg-[var(--color-primary)] animate-pulse-glow ml-0.5" />
              )}
            </div>
          ))}
        </div>

        {!deploying && (
          <div className="flex justify-end">
            <Button size="sm" onClick={onClose}>{t('deploy.close')}</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}