import React from 'react';
import { Sparkles, Brain, Settings, AlertCircle, TrendingUp, HelpCircle, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { Project, Label, Sample, TrainingConfig } from '../types';

interface AutoMLPanelProps {
  project: Project;
  labels: Label[];
  samples: Sample[];
  currentConfig: TrainingConfig;
  onApplyConfig: (config: TrainingConfig) => void;
}

export const AutoMLPanel: React.FC<AutoMLPanelProps> = ({
  project,
  labels,
  samples,
  currentConfig,
  onApplyConfig,
}) => {
  const labelCounts = labels.map(lbl => ({
    label: lbl,
    count: samples.filter(s => s.labelId === lbl.id).length
  }));

  const totalSamples = samples.length;
  const isImbalanced = totalSamples > 0 && labelCounts.some(lc => {
    const ratio = lc.count / totalSamples;
    return ratio < 0.15 || ratio > 0.65;
  });

  // Calculate recommendation specs dynamically
  const recommendedEpochs = totalSamples < 20 ? 30 : totalSamples < 100 ? 50 : 80;
  const recommendedBatchSize = totalSamples < 15 ? 4 : totalSamples < 60 ? 16 : 32;
  const recommendedLR = project.type === 'IMAGE' ? 0.001 : 0.005;
  const recommendedSplit = 0.2;

  const handleApplyAutoML = () => {
    onApplyConfig({
      epochs: recommendedEpochs,
      batchSize: recommendedBatchSize,
      learningRate: recommendedLR,
      validationSplit: recommendedSplit,
      shuffle: true
    });
  };

  // Architecture description
  let modelArchitectureName = 'Deep Transfer MobileNet V3';
  let architectureDesc = 'Pre-trained feature extractor coupled with a lightweight custom multi-layer dense classifier.';
  
  if (project.type === 'TEXT') {
    modelArchitectureName = 'Word Embedding & Bidirectional LSTM';
    architectureDesc = 'Tokenized sequences fed into a 64-dimensional Word Embedding layer followed by bidirectional recurrent LSTM blocks.';
  } else if (project.type === 'AUDIO') {
    modelArchitectureName = 'Mel-Spectrogram 2D Convolutional Net';
    architectureDesc = 'Extract Mel-Frequency Cepstral Coefficients (MFCC) and process with stacked 2D convolution filters.';
  }

  return (
    <div className="space-y-6" id="automl-dashboard">
      <div className="p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20 rounded-3xl relative overflow-hidden" id="automl-banner">
        <div className="absolute right-6 top-6 opacity-10">
          <Brain className="w-24 h-24 text-indigo-500 animate-pulse" />
        </div>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">AutoML Optimizer Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Intelligent architecture selection and automated tuning advisor</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mb-5">
          Based on your dataset statistics, label distribution, and project type, our client-side AutoML advisor has generated an optimal hyperparameter configuration designed to deliver maximum convergence speed and accuracy.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleApplyAutoML}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
            id="apply-automl-config"
          >
            <RefreshCw className="w-4 h-4" />
            Apply Recommended Parameters
          </button>
          
          <div className="text-xs text-slate-400 font-mono">
            Optimized configuration ready to load
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="automl-grid">
        {/* Recommended architecture */}
        <div className="frosted-glass p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-850/60 flex flex-col justify-between" id="automl-arch-card">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              Selected AI Model Architecture
            </h4>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 mb-4">
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">RECOMMENDED MODEL</div>
              <div className="font-bold text-base text-slate-900 dark:text-white mb-1.5">{modelArchitectureName}</div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{architectureDesc}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Optimizer</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Adam (Adaptive)</span>
              </div>
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Loss Function</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Categorical Crossentropy</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-3">
            ✨ Auto-selected based on category layout and browser capabilities.
          </div>
        </div>

        {/* Hyperparameters tuning dashboard */}
        <div className="frosted-glass p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-850/60" id="automl-params-card">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-500" />
            Autotuned Hyperparameter Advice
          </h4>

          <div className="space-y-4" id="tuning-items-container">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Epoch count</span>
                <p className="text-[11px] text-slate-400">Total dataset feed runs</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 line-through">{currentConfig.epochs}</span>
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/40 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold rounded-lg">{recommendedEpochs}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Batch Size</span>
                <p className="text-[11px] text-slate-400">Samples per gradient step</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 line-through">{currentConfig.batchSize}</span>
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/40 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold rounded-lg">{recommendedBatchSize}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Learning Rate</span>
                <p className="text-[11px] text-slate-400">Descent gradient scaling</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 line-through">{currentConfig.learningRate}</span>
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/40 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold rounded-lg">{recommendedLR}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset analyzer alerts */}
      <div className="frosted-glass p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-850/60" id="automl-warnings-box">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          Pre-flight Dataset Warnings
        </h4>

        {totalSamples === 0 ? (
          <div className="text-xs text-slate-400 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            ⚠️ No training data found. Please upload dataset samples to enable active AutoML diagnostics.
          </div>
        ) : (
          <div className="space-y-2.5">
            {isImbalanced && (
              <div className="flex gap-2.5 p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-xs leading-relaxed text-amber-800 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Class Imbalance Detected:</strong> Some classes have considerably more samples than others. This will likely cause the classifier to favor the dominant class during convergence. I recommend uploading additional samples for under-represented labels or using **Augmentation** tools to balance classes.
                </div>
              </div>
            )}
            
            {totalSamples < 15 && (
              <div className="flex gap-2.5 p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-xs leading-relaxed text-rose-800 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Extremely Low Dataset Volume:</strong> Model is highly susceptible to overfitting with only {totalSamples} total sample(s). Expand samples with synthetic visual rotation augmentations or collect at least 20 distinct images per category.
                </div>
              </div>
            )}

            {!isImbalanced && totalSamples >= 15 && (
              <div className="flex gap-2.5 p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-xs leading-relaxed text-emerald-800 dark:text-emerald-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Excellent dataset health!</strong> Sample distribution across classes is optimally balanced. We estimated training will execute in **less than 1 minute** on your local device.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
