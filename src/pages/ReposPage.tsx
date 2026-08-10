import { useEffect, useState } from 'react';
import { Plus, Archive, Search, MoreVertical, Trash2, Edit2, Lock, Globe, GitBranch } from 'lucide-react';
import { Card, Button, Input, EmptyState, Spinner, Badge } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { cn, timeAgo } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import * as repoApi from '@/lib/repo-api';
import type { Route } from '@/components/Sidebar';

export function ReposPage({ onNavigate }: { onNavigate: (r: Route) => void }) {
  const { t } = useI18n();
  const [repos, setRepos] = useState<repoApi.Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<repoApi.Repo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [branchCounts, setBranchCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadRepos();
  }, []);

  async function loadRepos() {
    setLoading(true);
    const list = await repoApi.listRepos();
    setRepos(list);
    const counts: Record<string, number> = {};
    for (const r of list) {
      const branches = await repoApi.listBranches(r.id);
      counts[r.id] = branches.length;
    }
    setBranchCounts(counts);
    setLoading(false);
  }

  async function handleRename() {
    if (!renameId || !renameValue.trim()) return;
    await repoApi.renameRepo(renameId, renameValue.trim());
    setRenameId(null);
    setRenameValue('');
    loadRepos();
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    await repoApi.deleteRepo(deleteConfirm.id);
    setDeleting(false);
    setDeleteConfirm(null);
    loadRepos();
  }

  async function handleToggleVisibility(id: string) {
    await repoApi.toggleVisibility(id);
    setMenuOpen(null);
    loadRepos();
  }

  const filtered = repos.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">{t('repos.title')}</h1>
          <p className="text-[var(--color-text-dim)] text-sm mt-1">{t('repos.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> {t('repos.new')}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
        <Input value={search} onChange={setSearch} placeholder={t('repos.search')} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[var(--color-text-dim)]">
          <Spinner size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Archive size={22} />}
            title={search ? t('repos.noMatch') : t('repos.none')}
            description={search ? '' : t('repos.createFirst')}
            action={!search && <Button onClick={() => setShowCreate(true)}><Plus size={16} /> {t('repos.create')}</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4 hover:border-[var(--color-border-hover)] transition-all duration-150 cursor-pointer group relative">
              <div onClick={() => onNavigate({ name: 'repo', repoId: r.id })}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center">
                      <Archive size={17} className="text-[var(--color-text-muted)]" />
                    </div>
                    <div>
                      <div className="text-[var(--color-text)] font-semibold text-sm">{r.name}</div>
                      <div className="text-[var(--color-text-dim)] text-xs flex items-center gap-1 mt-0.5">
                        <GitBranch size={10} /> {branchCounts[r.id] || 0} {t('repos.branches')}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === r.id ? null : r.id); }}
                      className="p-1 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors"
                    >
                      <MoreVertical size={15} />
                    </button>
                    {menuOpen === r.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }} />
                        <div className="absolute right-0 top-8 z-20 w-44 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl py-1 animate-slide-down">
                          <button
                            onClick={(e) => { e.stopPropagation(); setRenameId(r.id); setRenameValue(r.name); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
                          >
                            <Edit2 size={13} /> {t('repos.rename')}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleVisibility(r.id); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
                          >
                            {r.visibility === 'public' ? <Lock size={13} /> : <Globe size={13} />}
                            {r.visibility === 'public' ? t('repos.makePrivate') : t('repos.makePublic')}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(r); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={13} /> {t('repos.delete')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {r.description && (
                  <p className="text-[var(--color-text-dim)] text-xs mb-3 line-clamp-2">{r.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant={r.visibility === 'public' ? 'info' : 'default'}>
                    {r.visibility === 'public' ? <Globe size={11} /> : <Lock size={11} />}
                    {r.visibility === 'public' ? t('repos.public') : t('repos.private')}
                  </Badge>
                  <span className="text-[var(--color-text-dim)] text-xs">{timeAgo(r.updated_at)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateRepoModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadRepos(); }} />
      <Modal open={renameId !== null} onClose={() => setRenameId(null)} title={t('repos.rename')} size="sm">
        <div className="space-y-4">
          <Input value={renameValue} onChange={setRenameValue} placeholder={t('repo.create.namePlaceholder')} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRenameId(null)}>{t('repo.create.cancel')}</Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}><Edit2 size={15} /> {t('repos.rename')}</Button>
          </div>
        </div>
      </Modal>
      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title={t('repos.delete')} size="sm">
        <div className="space-y-4">
          <p className="text-[var(--color-text-muted)] text-sm">
            {t('repo.detail.confirmDelete')} <span className="text-[var(--color-text)] font-medium">{deleteConfirm?.name}</span>
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>{t('repo.create.cancel')}</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Spinner size={14} /> : <Trash2 size={15} />} {t('repos.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CreateRepoModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    await repoApi.createRepo(name.trim(), description.trim(), visibility);
    setCreating(false);
    setName('');
    setDescription('');
    setVisibility('private');
    onCreated();
  }

  return (
    <Modal open={open} onClose={onClose} title={t('repo.create.title')} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('repo.create.name')}</label>
          <Input value={name} onChange={setName} placeholder={t('repo.create.namePlaceholder')} />
        </div>
        <div>
          <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-1.5">{t('repo.create.desc')}</label>
          <Input value={description} onChange={setDescription} placeholder={t('repo.create.descPlaceholder')} />
        </div>
        <div>
          <label className="block text-[var(--color-text-muted)] text-xs font-medium mb-2">{t('repo.create.visibility')}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setVisibility('private')}
              className={cn(
                'p-3 rounded-lg border text-sm transition-all flex items-center gap-2',
                visibility === 'private' ? 'border-[var(--color-primary)] bg-[var(--color-primary-dim)] text-[var(--color-text)]' : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
              )}
            >
              <Lock size={15} /> {t('repos.private')}
            </button>
            <button
              onClick={() => setVisibility('public')}
              className={cn(
                'p-3 rounded-lg border text-sm transition-all flex items-center gap-2',
                visibility === 'public' ? 'border-[var(--color-primary)] bg-[var(--color-primary-dim)] text-[var(--color-text)]' : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
              )}
            >
              <Globe size={15} /> {t('repos.public')}
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>{t('repo.create.cancel')}</Button>
          <Button onClick={create} disabled={!name.trim() || creating}>
            {creating ? <Spinner size={14} /> : <Plus size={15} />} {t('repo.create.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
