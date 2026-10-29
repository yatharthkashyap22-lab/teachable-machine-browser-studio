import React, { useState, useEffect } from 'react';
import { GitBranch, History, PlusCircle, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { Project, Label, Sample } from '../types';

export interface DatasetVersion {
  id: string;
  projectId: string;
  versionName: string;
  changelog: string;
  timestamp: string;
  labelsCount: number;
  samplesCount: number;
  labelsSnapshot?: string;
  samplesSnapshot?: string;
}

interface DatasetVersionControlProps {
  project: Project;
  labels: Label[];
  samples: Sample[];
  onRestoreVersion?: (version: DatasetVersion) => void;
  onAddLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
}

export const DatasetVersionControl: React.FC<DatasetVersionControlProps> = ({
  project,
  labels,
  samples,
  onRestoreVersion,
  onAddLog,
}) => {
  const [versions, setVersions] = useState<DatasetVersion[]>([]);
  const [vName, setVName] = useState('');
  const [changelog, setChangelog] = useState('');

  useEffect(() => {
    const key = `dataset_versions_${project.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setVersions(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed first commit
      const initial: DatasetVersion[] = [
        {
          id: '1',
          projectId: project.id,
          versionName: 'v1.0.0-alpha',
          changelog: 'Initial dataset upload with baseline label mappings.',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          labelsCount: labels.length || 2,
          samplesCount: samples.length || 10,
        }
      ];
      localStorage.setItem(key, JSON.stringify(initial));
      setVersions(initial);
    }
  }, [project.id, labels.length, samples.length]);

  const handleCreateVersion = () => {
    if (!vName.trim()) return;

    const newV: DatasetVersion = {
      id: crypto.randomUUID(),
      projectId: project.id,
      versionName: vName.trim(),
      changelog: changelog.trim() || 'No changes cataloged.',
      timestamp: new Date().toISOString(),
      labelsCount: labels.length,
      samplesCount: samples.length,
      labelsSnapshot: JSON.stringify(labels),
      samplesSnapshot: JSON.stringify(samples)
    };

    const updated = [newV, ...versions];
    localStorage.setItem(`dataset_versions_${project.id}`, JSON.stringify(updated));
    setVersions(updated);
    setVName('');
    setChangelog('');
    onAddLog('success', `Committed new dataset checkpoint "${newV.versionName}" successfully (${newV.samplesCount} samples).`);
  };

  return (
    <div className="frosted-glass p-6 rounded-3xl shadow-lg space-y-6" id="dataset-version-control">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <GitBranch className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
            Dataset Version Control
          </h3>
          <p className="text-[11px] text-slate-500">Track and restore Git-like checkpoints of uploaded dataset samples</p>
        </div>
        <div className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-100/40">
          {versions.length} Version Commit(s)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="version-control-layout">
        
        {/* Create Commitment form */}
        <div className="space-y-4" id="create-commit-box">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Commit Current Dataset State</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Version Name (e.g. v1.1.0)</label>
              <input
                type="text"
                value={vName}
                onChange={(e) => setVName(e.target.value)}
                placeholder="v1.1.0"
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Changelog / Commitment message</label>
              <textarea
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="Added 15 balanced positive classes for image rot checks."
                rows={3}
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleCreateVersion}
              disabled={!vName.trim()}
              className="w-full py-2.5 bg-indigo-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-indigo-600/10"
              id="commit-version-btn"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Create Version Commitment
            </button>
          </div>
        </div>

        {/* Versions Timeline list */}
        <div className="space-y-4" id="versions-timeline-box">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-400" />
            Commitment Version Tree History
          </h4>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1" id="versions-timeline">
            {versions.map((v) => (
              <div
                key={v.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 flex items-start justify-between"
                id={`version-commit-${v.id}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">{v.versionName}</span>
                    <span className="text-[9px] text-slate-400 font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border">
                      {v.samplesCount} samples
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{v.changelog}</p>
                  <span className="text-[9px] text-slate-400 block pt-1">
                    {new Date(v.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                {onRestoreVersion && (
                  <button
                    onClick={() => onRestoreVersion(v)}
                    className="p-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border rounded-lg transition-colors cursor-pointer text-slate-500"
                    title="Restore checkpoint"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
