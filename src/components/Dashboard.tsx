/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Project, ModelType, SystemLog, SavedModel 
} from '../types';
import { 
  Brain, FolderPlus, Search, SlidersHorizontal, Trash2, Copy, 
  Archive, RotateCcw, Calendar, HardDrive, Cpu, Activity, ShieldCheck, ExternalLink, RefreshCw 
} from 'lucide-react';
import { ProjectTemplates, TemplateDefinition } from './ProjectTemplates';

interface DashboardProps {
  projects: Project[];
  savedModels: SavedModel[];
  logs: SystemLog[];
  storageSizeMB: number;
  onCreateProject: (name: string, description: string, type: ModelType) => void;
  onCreateFromTemplate: (template: TemplateDefinition) => void;
  onDeleteProject: (id: string) => void;
  onCloneProject: (project: Project) => void;
  onToggleArchive: (id: string) => void;
  onSelectProject: (project: Project) => void;
  onClearLogs: () => void;
  onRefreshMetrics: () => void;
  userEmail: string;
  userName: string;
  onLaunchLens?: () => void;
}

export default function Dashboard({
  projects = [],
  savedModels = [],
  logs = [],
  storageSizeMB,
  onCreateProject,
  onCreateFromTemplate,
  onDeleteProject,
  onCloneProject,
  onToggleArchive,
  onSelectProject,
  onClearLogs,
  onRefreshMetrics,
  userName,
  onLaunchLens
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | ModelType>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  
  // Create Project State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjType, setNewProjType] = useState<ModelType>('IMAGE');

  // GPU Memory simulation for analytics
  const [gpuStatus, setGpuStatus] = useState({ webgl: true, precision: 'highp' });
  const [memUsage, setMemUsage] = useState({ usedJS: 0, totalJS: 0 });

  useEffect(() => {
    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setGpuStatus({
        webgl: !!gl,
        precision: gl ? 'highp float' : 'unsupported'
      });
    } catch {
      setGpuStatus({ webgl: false, precision: 'unsupported' });
    }

    // Capture memory usage if available
    if (typeof (window as any).performance?.memory !== 'undefined') {
      const memory = (window as any).performance.memory;
      setMemUsage({
        usedJS: parseFloat((memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)),
        totalJS: parseFloat((memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(1))
      });
    } else {
      setMemUsage({ usedJS: 42.1, totalJS: 2048 }); // Fallback simulated sensible heap for Chrome
    }
  }, []);

  // Filter & Sort logic
  const filteredProjects = projects
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedTypeFilter === 'ALL' || p.type === selectedTypeFilter;
      const matchesArchive = p.isArchived === showArchived;
      return matchesSearch && matchesType && matchesArchive;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      return a.name.localeCompare(b.name);
    });

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    onCreateProject(newProjName, newProjDesc, newProjType);
    setNewProjName('');
    setNewProjDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 font-sans text-slate-800 dark:text-slate-100" id="dashboard-root">
      
      {/* Welcome Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="dashboard-heading">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hello, {userName}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Build custom neural network models directly inside your browser cache.
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/15 flex items-center gap-2 text-sm transition-all duration-150 cursor-pointer"
          id="btn-trigger-create-modal"
        >
          <FolderPlus className="w-4.5 h-4.5" />
          Create New Project
        </button>
      </div>

      {/* Bento-grid Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="bento-grid-stats">
        
        {/* Total Projects */}
        <div className="frosted-glass p-6 rounded-3xl shadow-lg flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100/50 dark:border-blue-900/40">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Projects</div>
            <div className="text-2xl font-bold mt-0.5">{projects.filter(p => !p.isArchived).length}</div>
          </div>
          <div className="absolute right-4 bottom-4 text-xs font-semibold text-slate-300 dark:text-slate-800 group-hover:scale-110 transition-transform">
            TM-01
          </div>
        </div>

        {/* Models Saved */}
        <div className="frosted-glass p-6 rounded-3xl shadow-lg flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-100/50 dark:border-purple-900/40">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Saved Models</div>
            <div className="text-2xl font-bold mt-0.5">{savedModels.length}</div>
          </div>
          <div className="absolute right-4 bottom-4 text-xs font-semibold text-slate-300 dark:text-slate-800 group-hover:scale-110 transition-transform">
            TF-JS
          </div>
        </div>

        {/* Storage Size */}
        <div className="frosted-glass p-6 rounded-3xl shadow-lg flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100/50 dark:border-amber-900/40">
            <HardDrive className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">IndexedDB Cache</span>
              <button onClick={onRefreshMetrics} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white" title="Refresh storage usage">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <div className="text-2xl font-bold mt-0.5">{storageSizeMB} MB</div>
          </div>
          <div className="absolute right-4 bottom-4 text-xs font-semibold text-slate-300 dark:text-slate-800 group-hover:scale-110 transition-transform">
            Local
          </div>
        </div>

        {/* Browser Memory Status */}
        <div className="frosted-glass p-6 rounded-3xl shadow-lg flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/40">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Browser GPU Status</div>
            <div className="text-lg font-bold mt-0.5 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              {gpuStatus.webgl ? 'WebGL Active' : 'CPU Mode'}
            </div>
          </div>
          <div className="absolute right-4 bottom-4 text-xs font-semibold text-slate-300 dark:text-slate-800 group-hover:scale-110 transition-transform">
            {memUsage.usedJS}M
          </div>
        </div>

      </div>

      {/* Universal AI Lens Engine Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300" id="ai-lens-banner">
        {/* Subtle decorative lights */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-1.5 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-white/10 border border-white/20 tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Featured Capability
          </span>
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">
            Universal AI Lens Engine
          </h2>
          <p className="text-xs text-purple-100 max-w-2xl font-semibold leading-relaxed">
            Experience Google Lens directly inside Teachable Machine. Analyze images from multiple inputs (Upload, Drag & Drop, Camera Capture, Clipboard Paste, URL, Batch, Search) with real-time bounding boxes, deep OCR text synthesis, and downloadable PDF prediction reports.
          </p>
        </div>

        <button
          onClick={onLaunchLens}
          className="px-5 py-3.5 bg-white text-purple-700 hover:bg-purple-50 rounded-2xl text-xs font-bold shrink-0 transition shadow-lg cursor-pointer flex items-center gap-2"
          id="btn-launch-lens-dashboard"
        >
          Launch Image Intelligence
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Industrial Project Templates Shelf */}
      <ProjectTemplates onSelectTemplate={onCreateFromTemplate} />

      {/* Main Content Layout (Left catalog, right system logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="dashboard-catalog-grid">
        
        {/* Project Catalog (2/3 width) */}
        <div className="lg:col-span-2 space-y-6" id="project-catalog-wrapper">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 frosted-glass p-4 rounded-2xl shadow-md" id="catalog-controls">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                id="catalog-search-input"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto" id="filters-container">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-xl" id="type-filter-group">
                <button
                  onClick={() => setSelectedTypeFilter('ALL')}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${selectedTypeFilter === 'ALL' ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white' : 'text-slate-400'}`}
                  id="filter-all"
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('IMAGE')}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${selectedTypeFilter === 'IMAGE' ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white' : 'text-slate-400'}`}
                  id="filter-images"
                >
                  Image
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('TEXT')}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${selectedTypeFilter === 'TEXT' ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white' : 'text-slate-400'}`}
                  id="filter-text"
                >
                  Text
                </button>
              </div>

              {/* Archive Toggle */}
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${showArchived ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500'}`}
                id="btn-toggle-archive-view"
              >
                <Archive className="w-4 h-4" />
                <span>{showArchived ? 'Archived' : 'Active'}</span>
              </button>
            </div>
          </div>

          {/* Project List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="projects-list-container">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map(project => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="frosted-glass p-6 rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group h-52 relative"
                  id={`project-card-${project.id}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3" id={`proj-header-${project.id}`}>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${project.type === 'IMAGE' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/40' : 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/40'}`}>
                        {project.type} Classification
                      </span>
                      
                      {/* Hover action menu */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" id={`actions-${project.id}`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); onCloneProject(project); }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          title="Duplicate project"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleArchive(project.id); }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          title={project.isArchived ? 'Restore' : 'Archive'}
                        >
                          {project.isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-500"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </h3>
                    
                    <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4 mt-4" id={`proj-footer-${project.id}`}>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <button
                      onClick={() => onSelectProject(project)}
                      className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                      id={`btn-open-proj-${project.id}`}
                    >
                      Open Studio
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredProjects.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850 rounded-3xl p-8" id="empty-projects">
                <Brain className="w-12 h-12 text-slate-300 dark:text-slate-800 mx-auto mb-4" />
                <h4 className="text-sm font-semibold mb-1">No Projects Found</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                  {showArchived ? "You don't have any archived projects." : "Get started by creating your first image or text classification model."}
                </p>
                {!showArchived && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl cursor-pointer"
                    id="btn-create-first-proj"
                  >
                    Create New Project
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* System Activity Log (1/3 width) */}
        <div className="space-y-6" id="dashboard-activity-panel">
          <div className="frosted-glass p-6 rounded-3xl shadow-lg flex flex-col h-[520px]" id="activity-log-card">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity Logs</h2>
              </div>
              {logs.length > 0 && (
                <button
                  onClick={onClearLogs}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  id="btn-clear-logs"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {/* Scrollable logs */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1" id="logs-container">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/40 dark:border-slate-850/40 text-xs flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span className={`px-1.5 py-0.5 rounded uppercase font-semibold ${log.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : log.type === 'error' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-850'}`}>
                      {log.type}
                    </span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-normal">{log.message}</p>
                </div>
              ))}

              {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-300 dark:text-slate-800" id="empty-logs">
                  <SlidersHorizontal className="w-10 h-10 mb-2" />
                  <span className="text-xs font-semibold text-slate-400">No events logged yet</span>
                  <span className="text-[10px] text-slate-400 max-w-xs mt-1">Actions you perform in the studio will show up here in real-time.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE PROJECT DIALOG MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" id="create-modal-overlay">
          {/* Backdrop Blur */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md frosted-glass rounded-3xl shadow-2xl p-6 z-10 relative"
            id="create-project-card"
          >
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  placeholder="Green Apple Identifier"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  id="new-project-name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Categorize apple varieties using a high-fidelity CNN network model."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-20 resize-none"
                  id="new-project-desc"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Classification Mode</label>
                <div className="grid grid-cols-2 gap-3" id="classification-type-select">
                  <button
                    type="button"
                    onClick={() => setNewProjType('IMAGE')}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 cursor-pointer transition-all ${newProjType === 'IMAGE' ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'}`}
                    id="btn-select-image"
                  >
                    <FolderPlus className="w-5 h-5" />
                    <div>
                      <div className="text-xs font-bold">Image</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Classify pixels via CNN</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewProjType('TEXT')}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 cursor-pointer transition-all ${newProjType === 'TEXT' ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'}`}
                    id="btn-select-text"
                  >
                    <FolderPlus className="w-5 h-5" />
                    <div>
                      <div className="text-xs font-bold">Text</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Natural Language Processing</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800" id="create-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl"
                  id="btn-create-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md cursor-pointer"
                  id="btn-create-submit"
                >
                  Create Project
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
