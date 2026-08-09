import { useEffect, useState } from 'react';
import { Activity as ActivityIcon } from 'lucide-react';
import { supabase, type Activity, type Project } from '@/lib/supabase';
import { Card, Spinner, EmptyState } from '@/components/ui';
import { timeAgo, formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { Route } from '@/components/Sidebar';

export function ActivityPage({ onNavigate }: { onNavigate: (r: Route) => void }) {
  const { t } = useI18n();
  const [activity, setActivity] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: p }] = await Promise.all([
        supabase.from('activity').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('projects').select('*'),
      ]);
      setActivity(a || []);
      setProjects(p || []);
      setLoading(false);
    })();
  }, []);

  if (loading) { return (<div className="flex items-center justify-center h-64 text-[var(--color-text-dim)]"><Spinner size={24} /></div>); }

  return (
    <div className="space-y-6 animate-slide-up">
      <div><h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">{t('activity.title')}</h1><p className="text-[var(--color-text-dim)] text-sm mt-1">{t('activity.subtitle')}</p></div>
      {activity.length === 0 ? (
        <Card><EmptyState icon={<ActivityIcon size={22} />} title={t('activity.none')} description={t('activity.noneDesc')} /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]/60">
            {activity.map((a) => {
              const project = projects.find((p) => p.id === a.project_id);
              return (
                <div key={a.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-[var(--color-surface-2)]/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center shrink-0 mt-0.5"><ActivityIcon size={14} className="text-[var(--color-text-muted)]" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[var(--color-text)] text-sm">{a.event_data || a.event_type}</div>
                    <div className="text-[var(--color-text-dim)] text-xs mt-0.5 flex items-center gap-2">
                      {project && (<button onClick={() => onNavigate({ name: 'project', projectId: project.id })} className="hover:text-[var(--color-text-muted)] transition-colors">{project.name}</button>)}
                      <span>·</span><span>{formatDate(a.created_at)}</span><span>·</span><span>{timeAgo(a.created_at)}</span>
                    </div>
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
