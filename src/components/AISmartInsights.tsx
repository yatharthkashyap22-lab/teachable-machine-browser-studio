import React from 'react';
import { 
  Sparkles, Brain, AlertCircle, TrendingUp, Compass, 
  Settings, CheckCircle, Flame, ArrowUpRight, HelpCircle 
} from 'lucide-react';
import { Project, EvaluationResult, Label, Sample } from '../types';

interface AISmartInsightsProps {
  project: Project;
  evaluation: EvaluationResult | null;
  epochs: number;
  learningRate: number;
  batchSize: number;
  samples: Sample[];
  labels: Label[];
  onApplyTuning?: (cfg: { epochs: number; batchSize: number; learningRate: number }) => void;
}

export const AISmartInsights: React.FC<AISmartInsightsProps> = ({
  project,
  evaluation,
  epochs,
  learningRate,
  batchSize,
  samples,
  labels,
  onApplyTuning
}) => {
  if (!evaluation) {
    return (
      <div className="frosted-glass p-6 rounded-3xl shadow-lg border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3" id="ai-insights-waiting">
        <Brain className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Waiting for Active Model Insights</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          Intelligent neural analysis, learning rate oscillation reports, and class-level overfitting diagnostics will generate immediately upon training.
        </p>
      </div>
    );
  }

  // Calculate deep heuristics
  const totalSamples = samples.length;
  const avgSamplesPerLabel = labels.length > 0 ? Math.round(totalSamples / labels.length) : 0;
  
  const insights: { type: 'info' | 'warning' | 'success'; title: string; desc: string; category: string }[] = [];
  let recommendationConfig = { epochs, batchSize, learningRate };
  let optimizationReason = '';

  // 1. Loss & Convergence Diagnostics
  if (epochs < 15) {
    insights.push({
      type: 'warning',
      title: 'Minimal Optimizer Convergences',
      desc: `Model completed in only ${epochs} optimization iterations. Weight vectors are susceptible to cold-start underfitting.`,
      category: 'Epochs'
    });
    recommendationConfig.epochs = 35;
    optimizationReason += 'Boost epochs to 35 steps to allow backpropagation weights to fully reach global minimums. ';
  } else if (epochs > 80 && evaluation.accuracy > 0.95) {
    insights.push({
      type: 'info',
      title: 'High-Epoch Overfitting Risk',
      desc: `Model completed ${epochs} epochs with >95% training accuracy. Visual weights may over-memorize textures instead of general shapes.`,
      category: 'Overfitting'
    });
    recommendationConfig.epochs = 40;
    optimizationReason += 'Reduce epochs to 40 to enhance out-of-sample visual generalization. ';
  } else {
    insights.push({
      type: 'success',
      title: 'Stable Convergence Path',
      desc: `The optimization span of ${epochs} epochs is well-calibrated for ${totalSamples} samples.`,
      category: 'Epochs'
    });
  }

  // 2. Learning Rate & Gradient Diagnostics
  if (learningRate > 0.01) {
    insights.push({
      type: 'warning',
      title: 'High Gradient Oscillation Potential',
      desc: `Learning rate of ${learningRate} is extremely aggressive. Loss curves may skip narrow global minimum valleys.`,
      category: 'Learning Rate'
    });
    recommendationConfig.learningRate = 0.005;
    optimizationReason += 'Reduce gradient scaling step sizes to 0.005 to ensure stable convergence. ';
  } else if (learningRate <= 0.001 && evaluation.accuracy < 0.70) {
    insights.push({
      type: 'info',
      title: 'Sluggish Gradient Step Scales',
      desc: `With learning rate ${learningRate}, weight update steps are very conservative. Convergences might be stalled on plateaus.`,
      category: 'Learning Rate'
    });
    recommendationConfig.learningRate = 0.005;
    optimizationReason += 'Scale learning rate step sizes to 0.005 to accelerate out of local valleys. ';
  } else {
    insights.push({
      type: 'success',
      title: 'Optimal Gradient Step Size',
      desc: `Learning rate at ${learningRate} matches default Adam solver momentum properties perfectly.`,
      category: 'Learning Rate'
    });
  }

  // 3. Class-specific diagnostics and imbalance checks
  if (labels.length > 0) {
    const classSizes = labels.map(lbl => ({
      name: lbl.name,
      count: samples.filter(s => s.labelId === lbl.id).length
    }));
    const smallestClass = classSizes.reduce((p, c) => p.count < c.count ? p : c);
    const largestClass = classSizes.reduce((p, c) => p.count > c.count ? p : c);

    if (smallestClass.count < 8) {
      insights.push({
        type: 'warning',
        title: `Low Sample Size for Class "${smallestClass.name}"`,
        desc: `Only ${smallestClass.count} samples uploaded. Classifiers need balanced representations to optimize decision hyperplanes.`,
        category: 'Class Balance'
      });
    }

    if (largestClass.count > smallestClass.count * 2.5 && smallestClass.count > 0) {
      insights.push({
        type: 'warning',
        title: 'Heuristic Bias Toward Dominant Class',
        desc: `Optimizer is heavily weighted towards "${largestClass.name}" (${largestClass.count} vs ${smallestClass.count}). False positives on minor classes will be elevated.`,
        category: 'Imbalance'
      });
    }
  }

  // Check confusion matrix to identify weak pairings
  if (evaluation.confusionMatrix && evaluation.confusionMatrix.length >= 2) {
    let worstPair = { row: 0, col: 0, value: 0 };
    for (let r = 0; r < evaluation.confusionMatrix.length; r++) {
      for (let c = 0; c < evaluation.confusionMatrix[r].length; c++) {
        if (r !== c && evaluation.confusionMatrix[r][c] > worstPair.value) {
          worstPair = { row: r, col: c, value: evaluation.confusionMatrix[r][c] };
        }
      }
    }

    if (worstPair.value > 0) {
      const classTrue = evaluation.labelsList[worstPair.row] || `Class ${worstPair.row}`;
      const classPred = evaluation.labelsList[worstPair.col] || `Class ${worstPair.col}`;
      insights.push({
        type: 'info',
        title: `High Confusion: ${classTrue} vs ${classPred}`,
        desc: `Evaluations show samples of "${classTrue}" are frequently miscategorized as "${classPred}". Enhance distinctive feature seeds.`,
        category: 'Confusion Matrix'
      });
    }
  }

  const handleTune = () => {
    if (onApplyTuning) {
      onApplyTuning(recommendationConfig);
    }
  };

  return (
    <div className="frosted-glass p-6 rounded-3xl shadow-xl space-y-6" id="ai-smart-insights-panel">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-blue-500 animate-pulse" />
            AI Copilot Training Insights
          </h3>
          <p className="text-[11px] text-slate-400">Automated machine learning curves analyzer and parameter validation feedback</p>
        </div>
        <span className="text-[10px] px-2.5 py-1 bg-blue-500/10 text-blue-500 rounded-full font-black uppercase tracking-wider">
          Smart Insight Agent
        </span>
      </div>

      {/* Main Insights list */}
      <div className="space-y-3.5" id="insights-timeline">
        {insights.map((ins, idx) => (
          <div 
            key={idx}
            className={`p-4 rounded-2xl border text-xs leading-relaxed flex gap-3.5 ${
              (ins.type === 'warning' && ins.category === 'Epochs')
                ? 'bg-rose-500/5 border-rose-500/10 text-slate-800 dark:text-slate-300' 
                : ins.type === 'warning'
                ? 'bg-amber-500/5 border-amber-500/10 text-slate-800 dark:text-slate-300' 
                : 'bg-emerald-500/5 border-emerald-500/10 text-slate-800 dark:text-slate-300'
            }`}
            id={`insight-item-${idx}`}
          >
            <div className="shrink-0 mt-0.5">
              {ins.type === 'warning' ? (
                <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
              ) : ins.type === 'success' ? (
                <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
              ) : (
                <Compass className="w-4.5 h-4.5 text-blue-500" />
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white">{ins.title}</h4>
                <span className="text-[9px] uppercase font-mono bg-white dark:bg-slate-900 px-1.5 py-0.2 rounded border border-slate-200/50 dark:border-slate-800 text-slate-400">
                  {ins.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{ins.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AutoML Recommendations panel */}
      {optimizationReason && onApplyTuning && (
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200/30 dark:border-blue-900/30 space-y-3" id="ai-tuning-recs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" />
              Recommended Hyperparameter Tuning
            </span>
            <span className="text-[9px] text-slate-400">AutoML Engine</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center" id="tuned-params-grid">
            <div className="p-2 bg-white/60 dark:bg-slate-950/40 rounded-xl border border-blue-100/40 dark:border-blue-900/40">
              <span className="text-[9px] text-slate-400 block font-bold">Epochs</span>
              <span className="text-xs font-black text-slate-800 dark:text-white font-mono">{epochs} &rarr; {recommendationConfig.epochs}</span>
            </div>
            <div className="p-2 bg-white/60 dark:bg-slate-950/40 rounded-xl border border-blue-100/40 dark:border-blue-900/40">
              <span className="text-[9px] text-slate-400 block font-bold">Batch Size</span>
              <span className="text-xs font-black text-slate-800 dark:text-white font-mono">{batchSize} &rarr; {recommendationConfig.batchSize}</span>
            </div>
            <div className="p-2 bg-white/60 dark:bg-slate-950/40 rounded-xl border border-blue-100/40 dark:border-blue-900/40">
              <span className="text-[9px] text-slate-400 block font-bold">Learn Rate</span>
              <span className="text-xs font-black text-slate-800 dark:text-white font-mono">{learningRate} &rarr; {recommendationConfig.learningRate}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
            "{optimizationReason}"
          </p>

          <button
            onClick={handleTune}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1"
            id="btn-apply-ai-tuning"
          >
            Apply Smart AI Tuning
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
