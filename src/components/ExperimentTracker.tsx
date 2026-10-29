import React, { useState, useEffect } from 'react';
import { History, Search, ArrowRight, BookOpen, Trash2, FolderSync } from 'lucide-react';
import { Project, Label, Sample } from '../types';

interface Experiment {
  id: string;
  projectId: string;
  timestamp: string;
  epochs: number;
  batchSize: number;
  learningRate: number;
  accuracy: number;
  loss: number;
  valAcc: number;
  valLoss: number;
  notes: string;
}

interface ExperimentTrackerProps {
  project: Project;
  onRestoreExperiment?: (exp: Experiment) => void;
}

export const ExperimentTracker: React.FC<ExperimentTrackerProps> = ({
  project,
  onRestoreExperiment,
}) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [notesInput, setNotesInput] = useState('');
  const [search, setSearch] = useState('');

  // Load experiments from localStorage
  useEffect(() => {
    const key = `experiments_${project.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setExperiments(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed initial dummy experiments to demonstrate comparison immediately
      const demoExps: Experiment[] = [
        {
          id: '1',
          projectId: project.id,
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          epochs: 30,
          batchSize: 16,
          learningRate: 0.01,
          accuracy: 0.78,
          loss: 0.45,
          valAcc: 0.74,
          valLoss: 0.49,
          notes: 'Baseline configuration with simple Adam optimizer.'
        },
        {
          id: '2',
          projectId: project.id,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          epochs: 50,
          batchSize: 32,
          learningRate: 0.001,
          accuracy: 0.92,
          loss: 0.21,
          valAcc: 0.89,
          valLoss: 0.25,
          notes: 'Optimized parameters with high-density data.'
        }
      ];
      localStorage.setItem(key, JSON.stringify(demoExps));
      setExperiments(demoExps);
    }
  }, [project.id]);

  const handleDelete = (id: string) => {
    const key = `experiments_${project.id}`;
    const updated = experiments.filter(e => e.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));
    setExperiments(updated);
  };

  const filtered = experiments.filter(exp => 
    exp.notes.toLowerCase().includes(search.toLowerCase()) ||
    exp.epochs.toString().includes(search)
  );

  return (
    <div className="frosted-glass p-6 rounded-3xl shadow-lg space-y-6" id="experiments-tracker">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-blue-500" />
            Active Experiment tracking logs
          </h3>
          <p className="text-[11px] text-slate-500">Track and compare previous model configurations side-by-side</p>
        </div>
        <div className="text-[10px] font-bold text-slate-400 font-mono bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-850">
          {experiments.length} Active Run(s)
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter runs by epochs, accuracy, notes..."
          className="w-full text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Comparison Grid */}
      <div className="space-y-4" id="experiments-list-root">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No previous experiments found. Train the model to record evaluation epochs.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="experiments-grid">
            {filtered.map((exp) => (
              <div
                key={exp.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 relative overflow-hidden group hover:scale-[1.01] transition-all"
                id={`experiment-${exp.id}`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-850/80 pb-2 mb-3">
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(exp.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="p-1 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Accuracy metrics */}
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">ACCURACY</span>
                    <span className="text-sm font-extrabold text-emerald-500">{(exp.accuracy * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">VAL ACC</span>
                    <span className="text-sm font-extrabold text-indigo-500">{(exp.valAcc * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">EPOCHS</span>
                    <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{exp.epochs}</span>
                  </div>
                </div>

                {/* Hyperparameters parameters */}
                <div className="text-[11px] font-mono text-slate-500 flex flex-wrap justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/60 p-2 rounded-xl mb-3">
                  <span>Batch: <strong>{exp.batchSize}</strong></span>
                  <span>LR: <strong>{exp.learningRate}</strong></span>
                  <span>Loss: <strong>{exp.loss.toFixed(3)}</strong></span>
                </div>

                {/* Notes and restore button */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {exp.notes || 'No notes added.'}
                </p>

                {onRestoreExperiment && (
                  <button
                    onClick={() => onRestoreExperiment(exp)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-blue-600/10"
                  >
                    <FolderSync className="w-3.5 h-3.5" />
                    Restore Parameter Weights
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
