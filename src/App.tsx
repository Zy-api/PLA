import { useState, useEffect } from 'react';
import { Sidebar, type Route } from '@/components/Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ActivityPage } from '@/pages/ActivityPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { ReposPage } from '@/pages/ReposPage';
import { RepoDetailPage } from '@/pages/RepoDetailPage';
import { AuthPage } from '@/pages/AuthPage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui';

function App() {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from('projects').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setProjectCount(count || 0);
    });
  }, [route, user]);

  function navigate(r: Route) {
    setRoute(r);
    window.scrollTo(0, 0);
  }

  if (loading) {
    return (<div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)] text-[var(--color-text-dim)]"><Spinner size={28} /></div>);
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar route={route} onNavigate={navigate} projectCount={projectCount} />
      <main className="flex-1 min-w-0 px-4 py-6 lg:px-8 lg:py-8 max-w-6xl pt-16 lg:pt-8">
        {route.name === 'dashboard' && <DashboardPage onNavigate={navigate} />}
        {route.name === 'projects' && <ProjectsPage onNavigate={navigate} />}
        {route.name === 'activity' && <ActivityPage onNavigate={navigate} />}
        {route.name === 'settings' && <SettingsPage />}
        {route.name === 'repos' && <ReposPage onNavigate={navigate} />}
        {route.name === 'repo' && (<RepoDetailPage repoId={route.repoId} initialTab={route.tab} onNavigate={navigate} />)}
        {route.name === 'project' && (<ProjectDetailPage projectId={route.projectId} initialTab={route.tab} onNavigate={navigate} />)}
      </main>
    </div>
  );
}

export default App;
