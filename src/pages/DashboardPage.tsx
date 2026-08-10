import { useEffect, useState } from 'react';
import { FolderGit2, Rocket, CheckCircle2, Activity as ActivityIcon, ArrowRight, Clock, Zap } from 'lucide-react';
import { supabase, type Project, type Deployment, type Activity } from '@/lib/supabase';
import { Card, Badge, StatusDot, Spinner } from '@/components/ui';
import { cn, timeAgo, shortSha } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { Route } from '@/components/Sidebar';

export function DashboardPage({ onNavigate }: { onNavigate: (r: Route) => void }) {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: d }, { data: a }] = await Promise.all([
        supabase.from('projects').select('*').order('updated_at', { ascending: false }),
        supabase.from('deployments').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('activity').select('*').order('created_at', { ascending: false }).limit(8),
      ]);
      setProjects(p || []);
      setDeployments(d || []);
      setActivity(a || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-text-dim)]">
        <Spinner size={24} />
      </div>
    );
  }

  const readyCount = projects.filter((p) => p.status === 'ready').length;
  const buildingCount = projects.filter((p) => p.status === 'building').length;
  const totalDeploys = deployments.length;

  const stats = [
    { label: t('dashboard.totalProjects'), value: projects.length, icon: FolderGit2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: t('dashboard.ready'), value: readyCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: t('dashboard.building'), value: buildingCount, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: t('dashboard.deployments'), value: totalDeploys, icon: Rocket, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  ];

  const statusLabel = (s: string) => t(`status.${s}` as 'status.ready');

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-[var(--color-text-dim)] text-sm mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 hover:border-[var(--color-border-hover)] transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[var(--color-text-dim)] text-xs font-medium">{s.label}</div>
                  <div className="text-2xl font-bold text-[var(--color-text)] mt-1.5">{s.value}</div>
                </div>
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', s.bg)}>
                  <Icon size={18} className={s.color} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
            <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('dashboard.recentDeployments')}</h2>
            <button onClick={() => onNavigate({ name: 'projects' })} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] text-xs flex items-center gap-1 transition-colors">
              {t('dashboard.viewAll')} <ArrowRight size={12} />
            </button>
          </div>
          {deployments.length === 0 ? (
            <div className="px-5 py-10 text-center text-[var(--color-text-dim)] text-sm">{t('dashboard.noDeployments')}</div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]/60">
              {deployments.map((d) => {
                const project = projects.find((p) => p.id === d.project_id);
                return (
                  <div
                    key={d.id}
                    onClick={() => project && onNavigate({ name: 'project', projectId: project.id, tab: 'deployments' })}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-2)]/30 cursor-pointer transition-colors"
                  >
                    <StatusDot status={d.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--color-text)] text-sm font-medium truncate">{project?.name || t('common.unknown')}</div>
                      <div className="text-[var(--color-text-dim)] text-xs truncate">{d.commit_message || t('common.noMessage')}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[var(--color-text-muted)] text-xs font-mono">{shortSha(d.commit_sha)}</div>
                      <div className="text-[var(--color-text-dim)] text-[10px]">{timeAgo(d.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
            <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('dashboard.recentActivity')}</h2>
            <button onClick={() => onNavigate({ name: 'activity' })} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] text-xs flex items-center gap-1 transition-colors">
              {t('dashboard.viewAll')} <ArrowRight size={12} />
            </button>
          </div>
          {activity.length === 0 ? (
            <div className="px-5 py-10 text-center text-[var(--color-text-dim)] text-sm">{t('dashboard.noActivity')}</div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]/60">
              {activity.map((a) => {
                const project = projects.find((p) => p.id === a.project_id);
                return (
                  <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                      <ActivityIcon size={13} className="text-[var(--color-text-muted)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--color-text)] text-sm truncate">{a.event_data || a.event_type}</div>
                      <div className="text-[var(--color-text-dim)] text-xs">{project?.name || t('common.system')} · {timeAgo(a.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
          <h2 className="text-[var(--color-text)] font-semibold text-sm">{t('dashboard.projectsOverview')}</h2>
          <button onClick={() => onNavigate({ name: 'projects' })} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] text-xs flex items-center gap-1 transition-colors">
            {t('dashboard.manage')} <ArrowRight size={12} />
          </button>
        </div>
        {projects.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--color-text-dim)] text-sm">{t('dashboard.noProjects')}</div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]/60">
            {projects.slice(0, 5).map((p) => (
              <div
                key={p.id}
                onClick={() => onNavigate({ name: 'project', projectId: p.id })}
                className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-2)]/30 cursor-pointer transition-colors"
              >
                <StatusDot status={p.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-[var(--color-text)] text-sm font-medium">{p.name}</div>
                  <div className="text-[var(--color-text-dim)] text-xs">{p.framework} · {p.branch}</div>
                </div>
                <Badge variant={p.status === 'ready' ? 'success' : p.status === 'building' ? 'info' : p.status === 'error' ? 'error' : 'default'}>
                  {statusLabel(p.status)}
                </Badge>
                <div className="text-[var(--color-text-dim)] text-xs flex items-center gap-1">
                  <Clock size={11} />
                  {timeAgo(p.updated_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
