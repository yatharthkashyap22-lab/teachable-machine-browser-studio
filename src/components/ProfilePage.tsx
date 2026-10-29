/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SavedModel } from '../types';
import { 
  User, Mail, Calendar, ShieldCheck, Crown, Cpu, Trash2, Download, Share2, Copy 
} from 'lucide-react';

interface ProfilePageProps {
  userName: string;
  userEmail: string;
  joinedAt: string;
  subscription: 'Free' | 'Pro' | 'Enterprise';
  savedModels: SavedModel[];
  onDeleteModel: (id: string) => void;
  onBack: () => void;
  onAddLog?: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
}

export default function ProfilePage({
  userName,
  userEmail,
  joinedAt,
  subscription,
  savedModels = [],
  onDeleteModel,
  onBack,
  onAddLog = (type, message) => console.log(`[${type.toUpperCase()}] ${message}`)
}: ProfilePageProps) {
  const [activeSub, setActiveSub] = useState<'Free' | 'Pro' | 'Enterprise'>(subscription);

  const handleShareModel = (model: SavedModel) => {
    try {
      const shareUrl = `${window.location.origin}/share/model/${model.id}`;
      navigator.clipboard.writeText(shareUrl);
      onAddLog('success', `Copied model share link for "${model.name}" to clipboard!`);
    } catch {
      onAddLog('error', 'Failed to copy model link.');
    }
  };

  const handleDownloadWeights = (model: SavedModel) => {
    try {
      if (!model.modelTopology) {
        onAddLog('warning', 'This model weights payload is empty.');
        return;
      }
      const fileData = JSON.stringify({
        modelName: model.name,
        trainedAt: model.trainedAt,
        accuracy: model.accuracy,
        labels: model.labels,
        topology: JSON.parse(model.modelTopology),
        weights: model.weightData
      }, null, 2);

      const blob = new Blob([fileData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${model.name.toLowerCase().replace(/\s+/g, '_')}_tfjs.json`;
      a.click();
      onAddLog('success', `Exported full trained weights for ${model.name}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 font-sans text-slate-800 dark:text-slate-100" id="profile-page-root">
      
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200/80 dark:border-slate-850" id="profile-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Profile & Subscriptions</h1>
          <p className="text-slate-400 text-xs mt-1">Configure your personal settings, subscription tiers, and review trained model files.</p>
        </div>
        
        <button
          onClick={onBack}
          className="text-xs font-semibold text-blue-500 hover:text-blue-600 cursor-pointer"
          id="btn-profile-back"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="profile-grid">
        
        {/* Left Side: Profile Card */}
        <div className="md:col-span-1 space-y-6" id="profile-card-wrapper">
          <div className="frosted-glass p-6 rounded-3xl shadow-lg text-center space-y-4" id="card-profile">
            
            {/* Elegant avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/10">
              {userName.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{userName}</h2>
              <p className="text-slate-400 text-xs">{userEmail}</p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50">
              <Crown className="w-3.5 h-3.5" />
              {activeSub} Plan
            </span>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-2.5 text-xs text-left text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Joined {new Date(joinedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Local Sandbox Authorized</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tiers and Saved Models */}
        <div className="md:col-span-2 space-y-6" id="profile-details-wrapper">
          
          {/* Subscription Tiers */}
          <div className="frosted-glass p-6 rounded-3xl shadow-lg space-y-4" id="card-subscriptions">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upgrade Subscription</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="tiers-grid">
              {/* Free Plan */}
              <div
                onClick={() => { setActiveSub('Free'); onAddLog('info', 'Switched local subscription to Free tier.'); }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${activeSub === 'Free' ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20' : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50'}`}
              >
                <div className="text-xs font-bold">Free Plan</div>
                <div className="text-lg font-bold mt-1">$0</div>
                <div className="text-[9px] text-slate-400 mt-2 leading-relaxed">Includes 50MB IndexedDB dataset storage.</div>
              </div>

              {/* Pro Plan */}
              <div
                onClick={() => { setActiveSub('Pro'); onAddLog('success', 'Upgraded subscription to Pro tier.'); }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${activeSub === 'Pro' ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20' : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50'}`}
              >
                <div className="text-xs font-bold flex items-center gap-1">
                  Pro Plan
                  <Crown className="w-3 h-3 text-amber-500 fill-current" />
                </div>
                <div className="text-lg font-bold mt-1">$15<span className="text-[10px] text-slate-400">/mo</span></div>
                <div className="text-[9px] text-slate-400 mt-2 leading-relaxed">Unlocks unlimited browser storage + GPU WebGL optimization.</div>
              </div>

              {/* Enterprise Plan */}
              <div
                onClick={() => { setActiveSub('Enterprise'); onAddLog('success', 'Switched to Enterprise tier.'); }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${activeSub === 'Enterprise' ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20' : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50'}`}
              >
                <div className="text-xs font-bold">Enterprise</div>
                <div className="text-lg font-bold mt-1">Custom</div>
                <div className="text-[9px] text-slate-400 mt-2 leading-relaxed">Unlocks private Cloud Storage buckets and remote API exports.</div>
              </div>
            </div>
          </div>

          {/* Saved Models List */}
          <div className="frosted-glass p-6 rounded-3xl shadow-lg space-y-4" id="card-saved-models-table">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Trained Models Library</h3>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1" id="saved-models-rows">
              {savedModels.map(model => (
                <div
                  key={model.id}
                  className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-850/40 rounded-2xl flex items-center justify-between"
                  id={`model-row-${model.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850 rounded-xl text-blue-500">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{model.name}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Trained at {new Date(model.trainedAt).toLocaleTimeString()} • Accuracy: {(model.accuracy * 100).toFixed(0)}%</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" id={`actions-model-${model.id}`}>
                    <button
                      onClick={() => handleDownloadWeights(model)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      title="Download Model Weights"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareModel(model)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      title="Share Model"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteModel(model.id)}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-500"
                      title="Delete Model"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {savedModels.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-950/10 border border-dashed rounded-2xl" id="empty-saved-models">
                  No models have been trained and compiled in this browser profile yet.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
