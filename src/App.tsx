/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Project, ModelType, SystemLog, SavedModel, AppNotification 
} from './types';
import { dbService } from './services/db';

// Components
import { TemplateDefinition } from './components/ProjectTemplates';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import ProjectWorkspace from './components/ProjectWorkspace';
import AdminSettings from './components/AdminSettings';
import ProfilePage from './components/ProfilePage';
import ConfirmModal from './components/ConfirmModal';
import AILens from './components/AILens';

export default function App() {
  // Views
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard' | 'workspace' | 'settings' | 'profile' | 'lens'>('landing');
  
  // User Profile
  const [user, setUser] = useState({
    name: 'Guest Developer',
    email: 'guest@teachablemachine.local',
    isGuest: true,
    subscription: 'Free' as 'Free' | 'Pro' | 'Enterprise',
    joinedAt: new Date().toISOString()
  });

  // App-wide state lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [storageSizeMB, setStorageSizeMB] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteProjectConfirmId, setDeleteProjectConfirmId] = useState<string | null>(null);

  // Notifications / Toast
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Check system preference dark mode
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(systemPrefersDark);
    if (systemPrefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Load data from IndexedDB
    hydrateDatabase();

    // Setup global keyboard shortcuts
    const handleShortcuts = (e: KeyboardEvent) => {
      // ctrl + shift + d = Dashboard
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        navigateTo('dashboard');
        showToast('success', 'Short-cut: Navigated to Dashboard');
      }
      // ctrl + shift + s = Settings
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        navigateTo('settings');
        showToast('success', 'Short-cut: Navigated to Diagnostics');
      }
      // ctrl + shift + p = Profile
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        navigateTo('profile');
        showToast('success', 'Short-cut: Navigated to Profile');
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, []);

  const hydrateDatabase = async () => {
    try {
      await dbService.init();
      
      const dbProjects = await dbService.getProjects();
      setProjects(dbProjects);

      const dbModels = await dbService.getSavedModels();
      setSavedModels(dbModels);

      const dbLogs = await dbService.getLogs();
      setLogs(dbLogs);

      const size = await dbService.getStorageUsageMB();
      setStorageSizeMB(size);
    } catch (e) {
      console.error('Database failed to load, falling back to clean state:', e);
    }
  };

  const handleAddLog = async (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    try {
      await dbService.addLog(type, message);
      const updatedLogs = await dbService.getLogs();
      setLogs(updatedLogs);
      
      // Also show as temporary visual toast notification
      showToast(type, message);
    } catch {
      // standard console logs fallback
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  };

  const showToast = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- ACTIONS ---
  const handleCreateFromTemplate = async (template: TemplateDefinition) => {
    const projectId = crypto.randomUUID();
    const project: Project = {
      id: projectId,
      name: `${template.name} Workspace`,
      description: template.description,
      type: template.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false
    };

    try {
      await dbService.saveProject(project);
      
      // Save labels and seed samples
      for (const tplClass of template.sampleData) {
        const labelId = crypto.randomUUID();
        const labelItem = {
          id: labelId,
          projectId: projectId,
          name: tplClass.labelName,
          color: tplClass.labelName.includes('Dog') || tplClass.labelName.includes('Healthy') || tplClass.labelName.includes('Recyclable') || tplClass.labelName.includes('Sedan') || tplClass.labelName.includes('Apple') || tplClass.labelName.includes('Letter A') || tplClass.labelName.includes('Happy') || tplClass.labelName.includes('Respirator') || tplClass.labelName.includes('Rock') || tplClass.labelName.includes('Support')
            ? 'bg-blue-500' 
            : tplClass.labelName.includes('Cat') || tplClass.labelName.includes('Rust') || tplClass.labelName.includes('Organic') || tplClass.labelName.includes('SUV') || tplClass.labelName.includes('Banana') || tplClass.labelName.includes('Letter B') || tplClass.labelName.includes('Sad') || tplClass.labelName.includes('Unmasked') || tplClass.labelName.includes('Paper') || tplClass.labelName.includes('Sales')
            ? 'bg-purple-500' 
            : 'bg-emerald-500'
        };
        await dbService.saveLabel(labelItem);

        for (const sampleSeed of tplClass.samples) {
          const sampleItem = {
            id: crypto.randomUUID(),
            projectId: projectId,
            labelId: labelId,
            name: sampleSeed.name,
            type: (template.type === 'IMAGE' ? 'image' : 'text') as any,
            data: sampleSeed.data,
            size: sampleSeed.data.length * 2,
            createdAt: new Date().toISOString()
          };
          await dbService.saveSample(sampleItem);
        }
      }

      setProjects(prev => [project, ...prev]);
      handleAddLog('success', `Created project from template: "${template.name}" with seeded classes and samples!`);
      
      setSelectedProject(project);
      setCurrentView('workspace');
    } catch (e) {
      handleAddLog('error', 'Failed to create template project: ' + e);
    }
  };

  const handleCreateProject = async (name: string, description: string, type: ModelType) => {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false
    };

    try {
      await dbService.saveProject(project);
      setProjects(prev => [project, ...prev]);
      handleAddLog('success', `Created classification project: "${name}" (${type})`);
      
      // Auto open newly created project workspace
      setSelectedProject(project);
      setCurrentView('workspace');
    } catch (e) {
      handleAddLog('error', 'Failed to create project: ' + e);
    }
  };

  const handleDeleteProject = (id: string) => {
    setDeleteProjectConfirmId(id);
  };

  const executeDeleteProject = async (id: string) => {
    const p = projects.find(proj => proj.id === id);
    if (!p) return;

    try {
      await dbService.deleteProject(id);
      setProjects(prev => prev.filter(proj => proj.id !== id));
      
      // also delete any saved models associated with project
      const associatedModels = savedModels.filter(m => m.projectId === id);
      for (const m of associatedModels) {
        await dbService.deleteModel(m.id);
      }
      const updatedModels = await dbService.getSavedModels();
      setSavedModels(updatedModels);

      handleAddLog('info', `Successfully deleted project "${p.name}".`);
      refreshStats();
    } catch (e) {
      handleAddLog('error', 'Error deleting project: ' + e);
    }
  };

  const handleCloneProject = async (project: Project) => {
    const cloned: Project = {
      ...project,
      id: crypto.randomUUID(),
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await dbService.saveProject(cloned);
      
      // Clone Labels & Samples
      const labels = await dbService.getLabels(project.id);
      const samples = await dbService.getSamples(project.id);

      for (const label of labels) {
        const newLabelId = crypto.randomUUID();
        const clonedLabel = { ...label, id: newLabelId, projectId: cloned.id };
        await dbService.saveLabel(clonedLabel);

        // Find samples with this label and clone them
        const labelSamples = samples.filter(s => s.labelId === label.id);
        for (const s of labelSamples) {
          const clonedSample = { ...s, id: crypto.randomUUID(), projectId: cloned.id, labelId: newLabelId };
          await dbService.saveSample(clonedSample);
        }
      }

      setProjects(prev => [cloned, ...prev]);
      handleAddLog('success', `Duplicated project pipeline "${project.name}" as "${cloned.name}"`);
      refreshStats();
    } catch (e) {
      handleAddLog('error', 'Failed to clone project structures: ' + e);
    }
  };

  const handleToggleArchive = async (id: string) => {
    const p = projects.find(proj => proj.id === id);
    if (!p) return;
    
    const updated = { ...p, isArchived: !p.isArchived, updatedAt: new Date().toISOString() };
    try {
      await dbService.saveProject(updated);
      setProjects(prev => prev.map(proj => proj.id === id ? updated : proj));
      handleAddLog('info', updated.isArchived ? `Archived project "${p.name}".` : `Restored project "${p.name}".`);
    } catch (e) {
      handleAddLog('error', 'Error toggling project archive status: ' + e);
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      await dbService.deleteModel(id);
      setSavedModels(prev => prev.filter(m => m.id !== id));
      handleAddLog('info', 'Deleted saved model weights payload.');
    } catch (e) {
      handleAddLog('error', 'Failed to delete saved model: ' + e);
    }
  };

  const handleClearLogs = async () => {
    try {
      await dbService.clearLogs();
      setLogs([]);
      showToast('info', 'Activity log timeline cleared.');
    } catch (e) {
      console.error(e);
    }
  };

  const refreshStats = async () => {
    try {
      const size = await dbService.getStorageUsageMB();
      setStorageSizeMB(size);
    } catch (e) {
      console.error(e);
    }
  };

  // --- NAVIGATION ---
  const navigateTo = (view: 'landing' | 'auth' | 'dashboard' | 'settings' | 'profile' | 'lens') => {
    setCurrentView(view);
    setSelectedProject(null);
    refreshStats();
  };

  const handleStartAsGuest = () => {
    setUser({
      name: 'Guest Developer',
      email: 'guest@teachablemachine.local',
      isGuest: true,
      subscription: 'Free',
      joinedAt: new Date().toISOString()
    });
    setCurrentView('dashboard');
    handleAddLog('info', 'Entered Teachable Machine workspace as Guest Developer.');
  };

  const handleLoginSuccess = (email: string, name: string) => {
    setUser({
      name,
      email,
      isGuest: false,
      subscription: 'Pro', // Default simulated level for email logins to give full fun features!
      joinedAt: new Date().toISOString()
    });
    setCurrentView('dashboard');
    handleAddLog('success', `Successfully authenticated profile as "${name}".`);
  };

  const handleLogout = () => {
    setUser({
      name: 'Guest Developer',
      email: 'guest@teachablemachine.local',
      isGuest: true,
      subscription: 'Free',
      joinedAt: new Date().toISOString()
    });
    setCurrentView('landing');
    setSelectedProject(null);
    showToast('info', 'Signed out of profile session.');
  };

  const handleToggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans flex flex-col frosted-bg" id="app-root">
      
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-60 transition-opacity duration-500" id="mesh-gradient-bg">
        <div className="mesh-orb-1" id="orb-1" />
        <div className="mesh-orb-2" id="orb-2" />
        <div className="mesh-orb-3" id="orb-3" />
      </div>

      {/* Navigation */}
      <Navbar
        currentView={currentView}
        userName={user.name}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />

      {/* Primary View Layout Controller */}
      <main className="flex-1 relative z-10" id="main-content-viewport">
        {currentView === 'landing' && (
          <LandingPage
            onStartAsGuest={handleStartAsGuest}
            onOpenAuth={() => setCurrentView('auth')}
            isDarkMode={isDarkMode}
          />
        )}

        {currentView === 'auth' && (
          <AuthPage
            onLoginSuccess={handleLoginSuccess}
            onBack={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            projects={projects}
            savedModels={savedModels}
            logs={logs}
            storageSizeMB={storageSizeMB}
            onCreateProject={handleCreateProject}
            onCreateFromTemplate={handleCreateFromTemplate}
            onDeleteProject={handleDeleteProject}
            onCloneProject={handleCloneProject}
            onToggleArchive={handleToggleArchive}
            onSelectProject={(p) => { setSelectedProject(p); setCurrentView('workspace'); }}
            onClearLogs={handleClearLogs}
            onRefreshMetrics={refreshStats}
            userEmail={user.email}
            userName={user.name}
            onLaunchLens={() => setCurrentView('lens')}
          />
        )}

        {currentView === 'workspace' && selectedProject && (
          <ProjectWorkspace
            project={selectedProject}
            onBack={() => navigateTo('dashboard')}
            onAddLog={handleAddLog}
          />
        )}

        {currentView === 'settings' && (
          <AdminSettings
            storageSizeMB={storageSizeMB}
            onRefreshMetrics={refreshStats}
            onAddLog={handleAddLog}
            onBack={() => navigateTo('dashboard')}
          />
        )}

        {currentView === 'profile' && (
          <ProfilePage
            userName={user.name}
            userEmail={user.email}
            joinedAt={user.joinedAt}
            subscription={user.subscription}
            savedModels={savedModels}
            onDeleteModel={handleDeleteModel}
            onBack={() => navigateTo('dashboard')}
            onAddLog={handleAddLog}
          />
        )}

        {currentView === 'lens' && (
          <AILens
            onBack={() => navigateTo('dashboard')}
            onAddLog={handleAddLog}
          />
        )}
      </main>

      {/* Floating Dynamic Toasts Alert Board */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none" id="toasts-alert-board">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-3.5 rounded-2xl shadow-xl flex items-center gap-3 border pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md ${toast.type === 'success' ? 'border-emerald-100 text-emerald-800 dark:border-emerald-950/60 dark:text-emerald-400' : toast.type === 'error' ? 'border-rose-100 text-rose-800 dark:border-rose-950/60 dark:text-rose-400' : toast.type === 'warning' ? 'border-amber-100 text-amber-800 dark:border-amber-950/60 dark:text-amber-400' : 'border-slate-200 text-slate-800 dark:border-slate-800 dark:text-slate-300'}`}
            id={`toast-${toast.id}`}
          >
            <span className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
            <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteProjectConfirmId !== null}
        title="Delete Project?"
        message={`Are you sure you want to permanently delete "${projects.find(p => p.id === deleteProjectConfirmId)?.name}"? This will clear all data samples, labels, and cached tensors. This action is irreversible.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (deleteProjectConfirmId) {
            executeDeleteProject(deleteProjectConfirmId);
          }
          setDeleteProjectConfirmId(null);
        }}
        onCancel={() => setDeleteProjectConfirmId(null)}
      />

    </div>
  );
}
