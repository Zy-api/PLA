import { useEffect, useState } from 'react';
import { Plus, FolderGit2, Search, MoreVertical, Trash2, ExternalLink, GitBranch } from 'lucide-react';
import { supabase, type Project } from '@/lib/supabase';
import { Card, Badge, Button, Input, StatusDot, EmptyState, Spinner } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { cn, timeAgo } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import type { Route } from '@/components/Sidebar';

export function ProjectsPage({ onNavigate }: { onNavigate: (r: Route) => void }) {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    const { data } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }

  async function deleteProject(id: string) {
    await supabase.from('projects').delete().eq('id', id);
    setMenuOpen(null);
    loadProjects();
  }

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const statusLabel = (s: string) => t(`status.${s}` as 'status.ready');

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">{t('projects.title')}</h1>
          <p className="text-[var(--color-text-dim)] text-sm mt-1">{t('projects.subtitle', { count: projects.length })}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> {t('projects.new')}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
        <Input value={search} onChange={setSearch} placeholder={t('projects.search')} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[var(--color-text-dim)]">
          <Spinner size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FolderGit2 size={22} />}
            title={search ? t('projects.noMatch') : t('projects.none')}
            description={search ? '' : t('projects.createFirst')}
            action={!search && <Button onClick={() => setShowCreate(true)}><Plus size={16} /> {t('projects.create')}</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <Card key={p.id} className="p-4 hover:border-[var(--color-border-hover)] transition-all duration-150 cursor-pointer group relative">
              <div onClick={() => onNavigate({ name: 'project', projectId: p.id })}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center">
                      <FolderGit2 size={17} className="text-[var(--color-text-muted)]" />
                    </div>
                    <div>
                      <div className="text-[var(--color-text)] font-semibold text-sm">{p.name}</div>
                      <div className="text-[var(--color-text-dim)] text-xs flex items-center gap-1 mt-0.5">
                        <GitBranch size={10} /> {p.branch}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }}
                      className="p-1 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors"
                    >
                      <MoreVertical size={15} />
                    </button>
                    {menuOpen === p.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }} />
                        <div className="absolute right-0 top-8 z-20 w-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl py-1 animate-slide-down">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={13} /> {t('projects.delete')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusDot status={p.status} />
                    <Badge variant={p.status === 'ready' ? 'success' : p.status === 'building' ? 'info' : p.status === 'error' ? 'error' : 'default'}>
                      {statusLabel(p.status)}
                    </Badge>
                    <span className="text-[var(--color-text-dim)] text-xs">{p.framework}</span>
                  </div>
                  <span className="text-[var(--color-text-dim)] text-xs">{timeAgo(p.updated_at)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadProjects(); }} />
    </div>
  );
}

const frameworkIds = ['vite', 'nextjs', 'astro', 'nuxt', 'sveltekit', 'static'] as const;

function CreateProjectModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { t } = useI18n();
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [framework, setFramework] = useState('vite');
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const userId = session?.user?.id;
    await supabase.from('projects').insert({
      name: name.trim(),
      framework,
      repo_url: repoUrl.trim() || null,
      branch: branch.trim() || 'main',
      status: 'ready',
      user_id: userId || null,
    });
    await supabase.from('activity').insert({
      event_type: 'project.created',
      event_data: `Project "${name.trim()}" created`,
      user_id: userId || null,
    });
    setCreating(false);
    setName('');
    setRepoUrl('');
    setBranch('main');
    setFramework('vite');
    onCreated();
  }

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');

  return (
    <Modal open={open} onClose={onClose} title={t('create.title')} size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('create.name')}</label>
          <Input value={name} onChange={setName} placeholder={t('create.namePlaceholder')} />
        </div>

        <div>
          <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('create.framework')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {frameworkIds.map((f) => (
              <button
                key={f}
                onClick={() => setFramework(f)}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all',
                  framework === f ? 'border-[var(--color-primary)] bg-[var(--color-primary-dim)]' : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-hover)]'
                )}
              >
                <div className="text-[var(--color-text)] text-sm font-medium">{t(`fw.${f}` as 'fw.vite')}</div>
                <div className="text-[var(--color-text-dim)] text-[10px] mt-0.5">{t(`fw.${f}Desc` as 'fw.viteDesc')}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('create.repoUrl')}</label>
            <Input value={repoUrl} onChange={setRepoUrl} placeholder="https://github.com/user/repo" />
          </div>
          <div>
            <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('create.branch')}</label>
            <Input value={branch} onChange={setBranch} placeholder="main" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 text-[var(--color-text-dim)] text-xs">
          <ExternalLink size={13} />
          <span>{t('create.deployTo')} <span className="text-[var(--color-text-muted)] font-mono">{slug ? `${slug}.launchpad.dev` : 'your-project.launchpad.dev'}</span></span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>{t('create.cancel')}</Button>
          <Button onClick={create} disabled={!name.trim() || creating}>
            {creating ? <Spinner size={14} /> : <Plus size={15} />} {t('create.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
