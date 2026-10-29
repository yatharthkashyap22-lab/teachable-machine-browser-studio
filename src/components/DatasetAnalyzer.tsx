import React from 'react';
import { 
  AlertTriangle, CheckCircle, Award, Sparkles, ShieldCheck, 
  Trash2, Scale, Image as ImageIcon, Zap, Eye, RefreshCw, BarChart2, Info
} from 'lucide-react';
import { Project, Label, Sample } from '../types';

interface DatasetAnalyzerProps {
  project: Project;
  labels: Label[];
  samples: Sample[];
  onRemoveDuplicates?: () => void;
}

export const DatasetAnalyzer: React.FC<DatasetAnalyzerProps> = ({
  project,
  labels = [],
  samples = [],
  onRemoveDuplicates,
}) => {
  const totalSamples = samples.length;

  // 1. Core Heuristic Diagnostics
  let classBalanceScore = 100;
  let sizeScore = 100;
  let duplicatesScore = 100;
  let qualityResolutionScore = 100;
  let labelConsistencyScore = 100;

  const issues: { type: 'error' | 'warning' | 'info'; title: string; desc: string; category: string; }[] = [];
  const suggestions: string[] = [];

  // Duplicates scanning
  const uniquePayloads = new Set(samples.map(s => s.data));
  const duplicateCount = totalSamples - uniquePayloads.size;

  if (duplicateCount > 0) {
    const pct = Math.round((duplicateCount / totalSamples) * 100);
    duplicatesScore = Math.max(0, 100 - pct * 3);
    issues.push({
      type: 'warning',
      title: 'Redundant / Duplicate Samples Found',
      desc: `Detected ${duplicateCount} exactly identical samples (${pct}% of dataset). This leads to artificial validation overfitting.`,
      category: 'Duplicates'
    });
    suggestions.push(`Prune the ${duplicateCount} duplicate samples. Use the "Deduplicate Dataset" utility to retain only unique files.`);
  } else if (totalSamples > 0) {
    suggestions.push('No redundant identical data payloads detected. Excellent data uniqueness!');
  }

  // Minimum label count
  if (labels.length < 2) {
    classBalanceScore = 0;
    issues.push({
      type: 'error',
      title: 'Insufficient Target Classes',
      desc: `SaaS pipelines require at least 2 categories. You currently have ${labels.length} class(es).`,
      category: 'Class Balance'
    });
    suggestions.push('Add at least one more classification class (e.g. "Negative Class" or "Background Stage").');
  }

  // Low sample volume
  if (totalSamples === 0) {
    sizeScore = 0;
    issues.push({
      type: 'error',
      title: 'Zero Training Dataset',
      desc: 'No samples uploaded yet. Model cannot compile weights without training samples.',
      category: 'Dataset Size'
    });
    suggestions.push('Upload or capture at least 15-20 data samples per class using the webcam or file uploader.');
  } else {
    // Check distribution
    const classFrequencies = labels.map(lbl => {
      const count = samples.filter(s => s.labelId === lbl.id).length;
      return { id: lbl.id, name: lbl.name, count };
    });

    const counts = classFrequencies.map(cf => cf.count);
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);

    if (totalSamples < labels.length * 10) {
      sizeScore = Math.max(20, Math.round((totalSamples / (labels.length * 15)) * 100));
      issues.push({
        type: 'warning',
        title: 'Minimal Sample Sizes',
        desc: `Average of ${Math.round(totalSamples / labels.length)} samples per class. Aim for at least 20 samples to avoid neural underfitting.`,
        category: 'Dataset Size'
      });
      suggestions.push('Capture additional data samples from different angles or in diverse lighting conditions.');
    }

    if (labels.length >= 2) {
      if (minCount === 0) {
        classBalanceScore = 20;
        issues.push({
          type: 'error',
          title: 'Empty Classification Class',
          desc: 'One or more of your active labels has zero samples. Training will crash.',
          category: 'Class Balance'
        });
        classFrequencies.forEach(cf => {
          if (cf.count === 0) {
            suggestions.push(`Upload at least 5-10 seed samples into the "${cf.name}" class.`);
          }
        });
      } else if (maxCount > minCount * 2) {
        const diff = maxCount - minCount;
        classBalanceScore = Math.max(30, 100 - (maxCount / (minCount || 1)) * 15);
        issues.push({
          type: 'warning',
          title: 'Skewed Class Imbalance',
          desc: `The largest class has ${maxCount} samples while the smallest has only ${minCount} (ratio ${Math.round(maxCount / minCount)}x).`,
          category: 'Class Balance'
        });
        const weakestClass = classFrequencies.reduce((prev, curr) => prev.count < curr.count ? prev : curr);
        suggestions.push(`Balance training loads: add approximately ${diff} more samples to class "${weakestClass.name}".`);
      }
    }
  }

  // Image quality / Resolution / Noise heuristic
  if (project.type === 'IMAGE' && totalSamples > 0) {
    const svgSamples = samples.filter(s => s.name.endsWith('.svg') || s.data.startsWith('data:image/svg+xml'));
    const base64Samples = samples.filter(s => s.data.startsWith('data:image/jpeg') || s.data.startsWith('data:image/png'));
    
    // Check if image data sizes are too small (indicates extremely low resolution or compression)
    const averageSize = samples.reduce((acc, curr) => acc + (curr.size || 0), 0) / totalSamples;
    if (averageSize < 1000 && svgSamples.length === 0) {
      qualityResolutionScore = 50;
      issues.push({
        type: 'warning',
        title: 'Low Data Density / High Compression',
        desc: `Average image sample payload size is ${Math.round(averageSize)} bytes, suggesting heavy resolution compression.`,
        category: 'Resolution & Noise'
      });
      suggestions.push('Increase capture camera resolution settings to at least 224x224 pixels to preserve feature textures.');
    }

    // Noise/ambient light checks (simulated warning for high camera frame count with similar timestamps)
    const captureTimestamps = samples.map(s => new Date(s.createdAt).getTime());
    const consecutiveCount = captureTimestamps.filter((t, i) => i > 0 && Math.abs(t - captureTimestamps[i - 1]) < 200).length;
    if (consecutiveCount > 8) {
      qualityResolutionScore = Math.max(40, qualityResolutionScore - 20);
      issues.push({
        type: 'info',
        title: 'High-burst Webcam Capture Detected',
        desc: 'Rapid continuous recording frames might contain duplicate motion-blur artifacts or identical ambient noise.',
        category: 'Resolution & Noise'
      });
      suggestions.push('Introduce more movement and hand rotations between webcam captures to broaden pose coverage.');
    }
  } else if (project.type === 'TEXT' && totalSamples > 0) {
    // Text Length / Noise / Duplicates checking
    const averageLength = samples.reduce((acc, curr) => acc + (curr.data?.length || 0), 0) / totalSamples;
    if (averageLength < 8) {
      qualityResolutionScore = 40;
      issues.push({
        type: 'warning',
        title: 'Extremely Short Word Density',
        desc: `Average prompt sample length is ${Math.round(averageLength)} chars. Classifier neural nets need contextual text sentences.`,
        category: 'Resolution & Noise'
      });
      suggestions.push('Provide longer customer inquiries or support queries with at least 5-10 words per text line.');
    }
  }

  // Label Consistency Checks
  if (labels.length > 0) {
    const invalidLabelNames = labels.filter(lbl => lbl.name.trim() === '' || lbl.name.length < 2);
    const mixedCasing = labels.some(lbl => lbl.name !== lbl.name.trim()) || 
                        (labels.some(lbl => lbl.name === lbl.name.toLowerCase()) && labels.some(lbl => lbl.name === lbl.name.toUpperCase()));

    if (invalidLabelNames.length > 0) {
      labelConsistencyScore -= 30;
      issues.push({
        type: 'error',
        title: 'Short or Default Label Titles',
        desc: 'One or more classification label classes has a blank or single-character name. This makes logs difficult to parse.',
        category: 'Label Consistency'
      });
      suggestions.push('Rename short class labels to clear semantic titles (e.g., "Masseur Pose" instead of "M").');
    }

    if (mixedCasing) {
      labelConsistencyScore -= 15;
      issues.push({
        type: 'warning',
        title: 'Inconsistent Classification Casing',
        desc: 'Label classes contain irregular padding, tail whitespaces, or mixed letter capitalization.',
        category: 'Label Consistency'
      });
      suggestions.push('Align class names to standard Title Case with no leading/trailing spaces.');
    }
  }

  // 2. Final Dataset Health Score
  const datasetHealthScore = Math.round(
    (classBalanceScore + sizeScore + duplicatesScore + qualityResolutionScore + labelConsistencyScore) / 5
  );

  const scoreColor = datasetHealthScore >= 80 
    ? 'text-emerald-500 bg-emerald-500/10' 
    : datasetHealthScore >= 50 
    ? 'text-amber-500 bg-amber-500/10' 
    : 'text-rose-500 bg-rose-500/10';

  const healthLevel = datasetHealthScore >= 80 
    ? 'Excellent Standard' 
    : datasetHealthScore >= 50 
    ? 'Satisfactory' 
    : 'Suboptimal (Review Warns)';

  return (
    <div className="frosted-glass p-6 rounded-3xl shadow-xl space-y-6" id="dataset-analyzer-expanded">
      
      {/* Header with Title and Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-5">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-500" />
            Dataset Health Score Tracker
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Dynamic check of class balance, duplicate density, blur/noise, and label quality</p>
        </div>
        <div className="flex items-center gap-3">
          {duplicateCount > 0 && onRemoveDuplicates && (
            <button
              onClick={onRemoveDuplicates}
              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-[11px] font-bold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer flex items-center gap-1"
              title="Deduplicate exact matches"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Deduplicate ({duplicateCount})
            </button>
          )}
          <div className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 ${scoreColor}`} id="health-score-badge-expanded">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            Health: {datasetHealthScore}/100
          </div>
        </div>
      </div>

      {/* Five-Point Diagnostics Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4" id="diagnostics-matrix">
        
        {/* Class Balance */}
        <div className="p-4 bg-slate-50/40 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-850">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1 uppercase">
            <span>Class Balance</span>
            <span>{classBalanceScore}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${classBalanceScore}%` }} />
          </div>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1.5 block font-mono">
            {classBalanceScore >= 80 ? 'Balanced' : classBalanceScore >= 50 ? 'Imbalanced' : 'Skewed'}
          </span>
        </div>

        {/* Dataset Size */}
        <div className="p-4 bg-slate-50/40 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-850">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1 uppercase">
            <span>Dataset Size</span>
            <span>{sizeScore}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${sizeScore}%` }} />
          </div>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1.5 block font-mono">
            {totalSamples} Samples
          </span>
        </div>

        {/* Duplicates */}
        <div className="p-4 bg-slate-50/40 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-850">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1 uppercase">
            <span>Redundancy</span>
            <span>{duplicatesScore}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${duplicatesScore}%` }} />
          </div>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1.5 block font-mono">
            {duplicateCount} Duplicates
          </span>
        </div>

        {/* Resolution & Quality */}
        <div className="p-4 bg-slate-50/40 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-850">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1 uppercase">
            <span>Quality & Noise</span>
            <span>{qualityResolutionScore}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${qualityResolutionScore}%` }} />
          </div>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1.5 block font-mono">
            {project.type === 'IMAGE' ? 'Res & Blur' : 'Prompt Length'}
          </span>
        </div>

        {/* Label Consistency */}
        <div className="p-4 bg-slate-50/40 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-850">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1 uppercase">
            <span>Class Semantics</span>
            <span>{labelConsistencyScore}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${labelConsistencyScore}%` }} />
          </div>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1.5 block font-mono">
            {labels.length} Defined
          </span>
        </div>

      </div>

      {/* Main Analysis and Recommendations split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="diagnostic-details-split">
        
        {/* Left: Quality Diagnostic Log */}
        <div className="space-y-3" id="diagnostics-log-box">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            Diagnostic Severity Logs
          </h4>

          {issues.length === 0 ? (
            <div className="flex gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-extrabold">Excellent Data Fidelity Standard!</p>
                <p className="text-[11px] opacity-80 mt-0.5">Your catalog is highly unique, balanced across classes, clean of duplicated items, and meets all criteria for robust commercial training.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1" id="issues-rows-expanded">
              {issues.map((iss, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 p-3.5 border rounded-2xl text-xs leading-relaxed ${
                    iss.type === 'error'
                      ? 'bg-rose-500/5 border-rose-500/10 text-rose-800 dark:text-rose-400'
                      : iss.type === 'warning'
                      ? 'bg-amber-500/5 border-amber-500/10 text-amber-800 dark:text-amber-400'
                      : 'bg-blue-500/5 border-blue-500/10 text-blue-800 dark:text-blue-400'
                  }`}
                >
                  <AlertTriangle className={`w-4.5 h-4.5 shrink-0 ${iss.type === 'error' ? 'text-rose-500' : 'text-amber-500'}`} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold">{iss.title}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded font-mono">
                        {iss.category}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80 mt-0.5">{iss.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Step-by-Step Optimization Suggestions */}
        <div className="space-y-3 p-4 bg-slate-50/30 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl" id="suggestions-box">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
            Actionable Optimization Plan
          </h4>
          
          <ul className="space-y-2.5" id="suggestions-list-expanded">
            {suggestions.map((sug, sIdx) => (
              <li key={sIdx} className="flex gap-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="text-blue-500 font-black select-none">•</span>
                <span>{sug}</span>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-850 mt-4 flex items-center gap-2 text-[10px] text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span>Targeting score &gt; 90 unlocks maximum prediction confidence standards.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
