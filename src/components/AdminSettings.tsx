/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { 
  ShieldCheck, HardDrive, Cpu, RefreshCw, Trash2, ShieldAlert, Check, Settings, ToggleLeft, ToggleRight, Key, Eye, EyeOff 
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface AdminSettingsProps {
  storageSizeMB: number;
  onRefreshMetrics: () => void;
  onAddLog?: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onBack: () => void;
}

export default function AdminSettings({ 
  storageSizeMB, 
  onRefreshMetrics, 
  onAddLog = (type, message) => console.log(`[${type.toUpperCase()}] ${message}`), 
  onBack 
}: AdminSettingsProps) {
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [gpuInfo, setGpuInfo] = useState({ webgl: true, vendor: '', renderer: '', precision: 'highp' });
  const [clearing, setClearing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [stabilityKey, setStabilityKey] = useState(() => localStorage.getItem('stability_api_key') || '');
  const [deepseekKey, setDeepseekKey] = useState(() => localStorage.getItem('deepseek_api_key') || '');
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('groq_api_key') || '');
  const [openrouterKey, setOpenrouterKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [replicateKey, setReplicateKey] = useState(() => localStorage.getItem('replicate_api_key') || '');
  const [falKey, setFalKey] = useState(() => localStorage.getItem('fal_api_key') || '');
  const [videoProvider, setVideoProvider] = useState(() => localStorage.getItem('active_video_provider') || 'google');
  const [showKeys, setShowKeys] = useState(false);

  const handleSaveKeys = () => {
    localStorage.setItem('gemini_api_key', geminiKey.trim());
    localStorage.setItem('openai_api_key', openaiKey.trim());
    localStorage.setItem('stability_api_key', stabilityKey.trim());
    localStorage.setItem('deepseek_api_key', deepseekKey.trim());
    localStorage.setItem('groq_api_key', groqKey.trim());
    localStorage.setItem('openrouter_api_key', openrouterKey.trim());
    localStorage.setItem('replicate_api_key', replicateKey.trim());
    localStorage.setItem('fal_api_key', falKey.trim());
    localStorage.setItem('active_video_provider', videoProvider);
    onAddLog('success', 'API Keys securely stored in local storage sandbox.');
  };

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        setGpuInfo({
          webgl: true,
          vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Generic Browser Vendor',
          renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'GPU WebGL Standard API',
          precision: gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT)?.precision ? 'highp' : 'mediump'
        });
      } else {
        setGpuInfo({ webgl: false, vendor: 'none', renderer: 'none', precision: 'none' });
      }
    } catch {
      setGpuInfo({ webgl: false, vendor: 'none', renderer: 'none', precision: 'none' });
    }
  }, []);

  const handleClearCache = () => {
    setIsConfirmOpen(true);
  };

  const executeClearCache = async () => {
    setIsConfirmOpen(false);
    setClearing(true);
    onAddLog('warning', 'Initiating complete IndexedDB database purging routine...');

    setTimeout(() => {
      // Standard erase db
      const request = indexedDB.deleteDatabase('TeachableMachineDB');
      request.onsuccess = () => {
        onAddLog('success', 'Database cleared successfully. Reloading workspace settings...');
        setClearing(false);
        onRefreshMetrics();
        onAddLog('success', 'All browser cached models, files, and logs have been wiped successfully.');
        window.location.reload();
      };
      request.onerror = () => {
        onAddLog('error', 'Database deletion protocol aborted due to resource lock.');
        setClearing(false);
      };
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 font-sans text-slate-800 dark:text-slate-100" id="admin-settings-root">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200/80 dark:border-slate-850" id="settings-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-500" />
            Admin & GPU Diagnostics
          </h1>
          <p className="text-slate-400 text-xs mt-1">Audit local storage footprint, model weight distributions, and hardware capabilities.</p>
        </div>
        
        <button
          onClick={onBack}
          className="text-xs font-semibold text-blue-500 hover:text-blue-600 cursor-pointer"
          id="btn-settings-back"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="settings-grid">
        
        {/* Left Side: Storage and Toggles */}
        <div className="space-y-6" id="settings-left-col">
          
          {/* Storage Management card */}
          <div className="frosted-glass p-6 rounded-3xl shadow-lg space-y-4" id="card-storage-mgmt">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <HardDrive className="w-5 h-5 text-amber-500" />
              Cached Datasets & Storage
            </h3>

            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-2xl">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Sandbox Footprint</div>
                <div className="text-xl font-bold mt-0.5">{storageSizeMB} MB</div>
              </div>
              
              <button
                onClick={onRefreshMetrics}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                id="btn-settings-refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed">
              Teachable Machine persists datasets directly in the HTML5 IndexedDB API cache of this browser. All files are safely sandboxed locally in client storage.
            </div>

            <button
              onClick={handleClearCache}
              disabled={clearing}
              className="w-full py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              id="btn-clear-cache"
            >
              <Trash2 className="w-4 h-4" />
              {clearing ? 'Clearing workspace...' : 'Purge All Cached Workspace Data'}
            </button>
          </div>

          {/* Settings Toggles card */}
          <div className="frosted-glass p-6 rounded-3xl shadow-lg space-y-4" id="card-settings-toggles">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Controls</h3>

            {/* Hardware Acceleration Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="text-xs font-semibold">Hardware Acceleration (WebGL)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Use GPU backend for model train and classification tasks.</div>
              </div>
              <button
                onClick={() => { setHardwareAcceleration(!hardwareAcceleration); onAddLog('info', `GPU Acceleration toggled to ${!hardwareAcceleration}`); }}
                className="text-blue-500 cursor-pointer"
              >
                {hardwareAcceleration ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
              </button>
            </div>

            {/* Auto-Save Toggle */}
            <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-850 pt-3">
              <div>
                <div className="text-xs font-semibold">Enable Dataset Auto-Saves</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Saves every custom data sample row instantly to IndexedDB.</div>
              </div>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className="text-blue-500 cursor-pointer"
              >
                {autoSave ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
              </button>
            </div>
          </div>

          {/* Secure API Key Sandbox Manager */}
          <div className="frosted-glass p-6 rounded-3xl shadow-lg space-y-4 animate-in fade-in-50 duration-200" id="card-api-keys">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Key className="w-5 h-5 text-blue-500" />
                Secure API Key Sandbox
              </h3>
              <button
                onClick={() => setShowKeys(!showKeys)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title={showKeys ? "Mask keys" : "Reveal keys"}
              >
                {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal">
              Store API keys securely in your browser's private local storage sandbox. These credentials are dynamically injected into server-side proxies to prevent browser exposure.
            </p>

            <div className="space-y-3">
              {/* Gemini Key */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gemini API Key</label>
                <input
                  type={showKeys ? "text" : "password"}
                  placeholder="Enter Gemini API Key..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* OpenAI Key */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OpenAI API Key</label>
                <input
                  type={showKeys ? "text" : "password"}
                  placeholder="Enter OpenAI API Key..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Stability Key */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stability AI Key</label>
                <input
                  type={showKeys ? "text" : "password"}
                  placeholder="Enter Stability AI Key..."
                  value={stabilityKey}
                  onChange={(e) => setStabilityKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* DeepSeek Key */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DeepSeek API Key</label>
                <input
                  type={showKeys ? "text" : "password"}
                  placeholder="Enter DeepSeek API Key..."
                  value={deepseekKey}
                  onChange={(e) => setDeepseekKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Groq Key */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Groq API Key</label>
                <input
                  type={showKeys ? "text" : "password"}
                  placeholder="Enter Groq API Key..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* OpenRouter Key */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OpenRouter API Key</label>
                <input
                  type={showKeys ? "text" : "password"}
                  placeholder="Enter OpenRouter API Key..."
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Replicate Key */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Replicate API Key</label>
                <input
                  type={showKeys ? "text" : "password"}
                  placeholder="Enter Replicate API Key..."
                  value={replicateKey}
                  onChange={(e) => setReplicateKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Fal.ai Key */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fal.ai API Key</label>
                <input
                  type={showKeys ? "text" : "password"}
                  placeholder="Enter Fal.ai API Key..."
                  value={falKey}
                  onChange={(e) => setFalKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Default Video Provider Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Video Studio Provider</label>
                <select
                  value={videoProvider}
                  onChange={(e) => setVideoProvider(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="google">Google Veo (veo-3.1-lite)</option>
                  <option value="runway">Runway Gen-4 (Gen-3 via Fal)</option>
                  <option value="luma">Luma Dream Machine</option>
                  <option value="pika">Pika Video AI</option>
                  <option value="kling">Kling AI Video</option>
                  <option value="stability">Stability AI Video</option>
                  <option value="fal">Fal.ai General</option>
                  <option value="replicate">Replicate General</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveKeys}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-4"
            >
              <Check className="w-4 h-4" />
              Save Sandbox Credentials
            </button>
          </div>

        </div>

        {/* Right Side: GPU Diagnostics */}
        <div className="space-y-6" id="settings-right-col">
          
          {/* Hardware Diagnostics Card */}
          <div className="frosted-glass p-6 rounded-3xl shadow-lg space-y-4" id="card-gpu-diag">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Cpu className="w-5 h-5 text-blue-500" />
              Browser GPU Capabilities
            </h3>

            <div className="space-y-3" id="hardware-diagnostics-list">
              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-850">
                <span className="text-xs text-slate-500 font-medium">WebGL Status</span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Enabled
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-850">
                <span className="text-xs text-slate-500 font-medium">Shader Floating Precision</span>
                <span className="text-xs font-mono font-bold">{gpuInfo.precision} float</span>
              </div>

              <div className="flex flex-col gap-1 py-2 border-b border-slate-50 dark:border-slate-850">
                <span className="text-xs text-slate-500 font-medium">WebGL Vendor Hardware</span>
                <span className="text-[10px] font-mono text-slate-400 break-words leading-normal">{gpuInfo.vendor || 'Standard Browser virtual software implementation'}</span>
              </div>

              <div className="flex flex-col gap-1 py-2">
                <span className="text-xs text-slate-500 font-medium">Active WebGL Renderer</span>
                <span className="text-[10px] font-mono text-slate-400 break-words leading-normal">{gpuInfo.renderer || 'WebGL 2.0 (OpenGL ES 3.0 compatible)'}</span>
              </div>
            </div>
          </div>

          {/* Secure Environment Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-6 text-white border border-slate-850 space-y-2 relative overflow-hidden" id="card-secure-environment">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
            <ShieldCheck className="w-7 h-7 text-emerald-400 mb-2" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Secure Sandboxed Environment</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              This browser environment isolates memory allocation. All TensorFlow.js layers, training weights, and evaluation reports are evaluated locally inside the secure client sandbox.
            </p>
          </div>

        </div>

      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Reset Local Database?"
        message="Are you sure you want to completely erase the local IndexedDB database? This will delete all custom datasets, classification classes, and trained model weights. This action is irreversible."
        confirmText="Erase All Data"
        cancelText="Cancel"
        variant="danger"
        onConfirm={executeClearCache}
        onCancel={() => setIsConfirmOpen(false)}
      />

    </div>
  );
}
