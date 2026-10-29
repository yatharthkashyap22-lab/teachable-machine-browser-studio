import React, { useState } from 'react';
import { 
  Sparkles, Image as ImageIcon, Film, FileSearch, ArrowRight, 
  Download, Plus, RefreshCw, Layers, Sliders, Play, Trash2, Video,
  HelpCircle, Eye, EyeOff, Check, Wand2, Search, Info, Trash, Compass,
  Share2, Copy
} from 'lucide-react';
import { Project, Label, Sample } from '../types';

interface AISynthesisLabProps {
  project: Project;
  labels: Label[];
  samples: Sample[];
  onAddSample: (name: string, type: 'image' | 'text', data: string, labelId?: string) => void;
  onAddLog?: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
}

interface SavedGeneration {
  id: string;
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  negativePrompt?: string;
  provider: string;
  width: number;
  height: number;
  aspectRatio: string;
  quality: string;
  seed: number;
  style: string;
  timestamp: string;
}

const STYLE_PRESETS = [
  { name: 'Realistic', label: 'Realistic', icon: '📸', desc: 'True-to-life studio photography' },
  { name: 'Anime', label: 'Anime', icon: '🌸', desc: 'Vibrant cell-shaded Japanese animation' },
  { name: '3D', label: '3D', icon: '🔮', desc: 'Polished CGI character and scene render' },
  { name: 'Cartoon', label: 'Cartoon', icon: '🧸', desc: 'Friendly playful Saturday morning cartoon' },
  { name: 'Sketch', label: 'Sketch', icon: '✏️', desc: 'Hand-drawn graphite pencil hatching sketch' },
  { name: 'Watercolor', label: 'Watercolor', icon: '🎨', desc: 'Delicate bleed paint wash textures' },
  { name: 'Pixel Art', label: 'Pixel Art', icon: '👾', desc: 'Retro 8-bit / 16-bit arcade aesthetics' },
  { name: 'Oil Painting', label: 'Oil Painting', icon: '🖌️', desc: 'Textured heavy brush strokes on canvas' },
  { name: 'Cyberpunk', label: 'Cyberpunk', icon: '⚡', desc: 'Neon lighting in dystopian wet streets' },
  { name: 'Fantasy', label: 'Fantasy', icon: '🧙', desc: 'Ethereal fairytale scenery and creatures' },
  { name: 'Photorealistic', label: 'Photorealistic', icon: '🔍', desc: '8K hyper-detailed optical capture' },
  { name: 'Isometric', label: 'Isometric', icon: '📐', desc: 'Symmetrical low-poly 3D projection' },
  { name: 'Minimal', label: 'Minimalist', icon: '⚪', desc: 'Clean negative space flat illustration' }
];

const PROVIDERS = [
  { id: 'pollinations', name: 'Pollinations AI (Free / Instant)', isFree: true },
  { id: 'google', name: 'Google Imagen (Vertex)', isFree: false },
  { id: 'openai', name: 'OpenAI DALL-E 3', isFree: false },
  { id: 'stability', name: 'Stability AI (SDXL)', isFree: false }
];

export default function AISynthesisLab({ 
  project, 
  labels = [], 
  samples = [], 
  onAddSample, 
  onAddLog = (type, message) => console.log(`[${type.toUpperCase()}] ${message}`)
}: AISynthesisLabProps) {
  // Tabs: 'image' | 'video' | 'analysis'
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'analysis'>('image');

  // --- IMAGE GENERATION STATES ---
  const [imagePrompt, setImagePrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('low quality, blurry, distorted, low resolution, text, watermark');
  const [selectedStyle, setSelectedStyle] = useState('Realistic');
  const [selectedProvider, setSelectedProvider] = useState('pollinations');
  
  // Size and Aspect ratios
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:2' | '2:3' | '16:9' | '9:16'>('1:1');
  const [imageCount, setImageCount] = useState<number>(1);
  const [imageQuality, setImageQuality] = useState<'Standard' | 'HD' | 'Ultra'>('Standard');
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 999999));
  const [isRandomSeed, setIsRandomSeed] = useState(true);

  // States for live generation
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState(labels[0]?.id || '');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');

  // Prompt history & Saved Gallery (using Local Component State)
  const [savedGenerations, setSavedGenerations] = useState<SavedGeneration[]>([]);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [latestBatch, setLatestBatch] = useState<string[]>([]);
  
  // Prompt interpreter/enhancement states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [interpretedPrompt, setInterpretedPrompt] = useState<{
    subject?: string;
    style?: string;
    scene?: string;
    lighting?: string;
    camera?: string;
    quality?: string;
    negativePrompt?: string;
  } | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);

  // --- VIDEO GENERATION STATES ---
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspect, setVideoAspect] = useState<'16:9' | '9:16' | '1:1' | '3:2'>('16:9');
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProvider, setVideoProvider] = useState(() => localStorage.getItem('active_video_provider') || 'google');
  const [videoDuration, setVideoDuration] = useState<'5s' | '10s' | '15s' | '30s'>('5s');
  const [videoResolution, setVideoResolution] = useState<'720p' | '1080p'>('720p');
  const [videoFps, setVideoFps] = useState<24 | 30>(24);
  const [videoStyle, setVideoStyle] = useState('Realistic');
  const [videoCameraMotion, setVideoCameraMotion] = useState('None');
  const [videoSeed, setVideoSeed] = useState<number>(-1);
  const [videoNegativePrompt, setVideoNegativePrompt] = useState('low quality, blurry, static, distorted, text, watermark');
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [videoHistory, setVideoHistory] = useState<Array<{
    id: string;
    url: string;
    prompt: string;
    provider: string;
    duration: string;
    aspect: string;
    resolution: string;
    timestamp: string;
  }>>(() => {
    try {
      const stored = localStorage.getItem('video_history_gallery');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // --- IMAGE ANALYSIS STATES ---
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPrompt, setAnalysisPrompt] = useState('Identify key visual elements, label compatibility, and lighting properties in this image.');

  // Dataset references
  const datasetImageSamples = samples.filter(s => s.type === 'image');

  // --- HANDLERS & IMPLEMENTATIONS ---

  // Helper to determine width/height based on aspect ratio selection
  const getDimensions = (aspect: string) => {
    switch (aspect) {
      case '16:9': return { width: 1024, height: 576 };
      case '9:16': return { width: 576, height: 1024 };
      case '3:2': return { width: 1024, height: 680 };
      case '2:3': return { width: 680, height: 1024 };
      case '1:1':
      default:
        return { width: 1024, height: 1024 };
    }
  };

  const getHeadersWithKeys = () => ({
    'Content-Type': 'application/json',
    'x-gemini-key': localStorage.getItem('gemini_api_key') || '',
    'x-openai-key': localStorage.getItem('openai_api_key') || '',
    'x-stability-key': localStorage.getItem('stability_api_key') || '',
    'x-deepseek-key': localStorage.getItem('deepseek_api_key') || '',
    'x-groq-key': localStorage.getItem('groq_api_key') || '',
    'x-openrouter-key': localStorage.getItem('openrouter_api_key') || '',
    'x-replicate-key': localStorage.getItem('replicate_api_key') || '',
    'x-fal-key': localStorage.getItem('fal_api_key') || ''
  });

  // Enhance prompt with Gemini Master Prompt Engineer
  const handleEnhancePrompt = async () => {
    if (!imagePrompt.trim()) return;
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: getHeadersWithKeys(),
        body: JSON.stringify({ prompt: `${selectedStyle} style: ${imagePrompt}` })
      });
      const data = await response.json();
      if (data.success && data.enhancedPrompt) {
        setImagePrompt(data.enhancedPrompt);
        onAddLog('success', 'Prompt enhanced successfully using Gemini AI!');
      }
    } catch (e) {
      console.error('Enhancement error:', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Interpret prompt into structural metadata
  const handleInterpretPrompt = async () => {
    if (!imagePrompt.trim()) return;
    setIsInterpreting(true);
    setInterpretedPrompt(null);
    try {
      const response = await fetch('/api/ai/interpret-prompt', {
        method: 'POST',
        headers: getHeadersWithKeys(),
        body: JSON.stringify({ prompt: imagePrompt })
      });
      const data = await response.json();
      if (data.success) {
        setInterpretedPrompt(data);
        
        // Auto-apply parameters to the workspace fields
        if (data.negativePrompt) {
          setNegativePrompt(data.negativePrompt);
        }
        
        if (data.quality) {
          const q = data.quality.toLowerCase();
          if (q.includes('ultra') || q.includes('8k') || q.includes('extremely detailed')) {
            setImageQuality('Ultra');
          } else if (q.includes('hd') || q.includes('high definition') || q.includes('high quality')) {
            setImageQuality('HD');
          } else {
            setImageQuality('Standard');
          }
        }
        
        if (data.style) {
          const styleLower = data.style.toLowerCase();
          const matchedPreset = STYLE_PRESETS.find(p => 
            p.name.toLowerCase().includes(styleLower) || 
            p.label.toLowerCase().includes(styleLower) ||
            styleLower.includes(p.name.toLowerCase()) ||
            styleLower.includes(p.label.toLowerCase())
          );
          if (matchedPreset) {
            setSelectedStyle(matchedPreset.name);
          }
        }
        
        if (data.aspectRatio) {
          const asp = data.aspectRatio.replace(/\s+/g, '');
          if (['1:1', '16:9', '9:16', '3:2', '2:3'].includes(asp)) {
            setAspectRatio(asp as any);
          }
        }

        if (data.seed !== null && data.seed !== undefined) {
          const parsedSeed = parseInt(data.seed);
          if (!isNaN(parsedSeed)) {
            setSeed(parsedSeed);
            setIsRandomSeed(false);
          }
        }

        onAddLog('success', 'Prompt structural features successfully extracted and applied!');
      }
    } catch (e) {
      console.error('Interpret error:', e);
    } finally {
      setIsInterpreting(false);
    }
  };

  // Core image generation handler
  const handleGenerateImage = async () => {
    const currentPrompt = imagePrompt.trim();
    if (!currentPrompt) {
      onAddLog('error', 'Validation Error: Image prompt is empty. Please describe what you want to synthesize.');
      console.error('[IMAGE GEN FLOW] Validation Error: Prompt is empty.');
      return;
    }

    console.log('[IMAGE GEN FLOW] Current Prompt:', imagePrompt);
    console.log('[IMAGE GEN FLOW] Enhanced Prompt:', imagePrompt);

    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setLatestBatch([]);
    setGenerationProgress(10);
    setGenerationStep(`Starting batch of ${imageCount} images...`);

    // Save to prompt history
    if (!promptHistory.includes(imagePrompt)) {
      setPromptHistory(prev => [imagePrompt, ...prev.slice(0, 9)]);
    }

    const { width, height } = getDimensions(aspectRatio);
    let successCount = 0;
    const generatedUrls: string[] = [];

    for (let i = 0; i < imageCount; i++) {
      const currentSeed = isRandomSeed ? Math.floor(Math.random() * 999999) : (seed + i);
      if (isRandomSeed && i === 0) setSeed(currentSeed);

      onAddLog('info', `Generating image ${i + 1} of ${imageCount} with ${selectedProvider.toUpperCase()}...`);
      setGenerationStep(`Synthesizing image ${i + 1} of ${imageCount}...`);
      setGenerationProgress(Math.floor((i / imageCount) * 80) + 10);

      const requestPayload = {
        prompt: `${selectedStyle} style: ${imagePrompt}`,
        negativePrompt,
        seed: currentSeed,
        quality: imageQuality,
        aspectRatio,
        style: selectedStyle
      };

      console.log('[IMAGE GEN FLOW] Final API Request Payload:', requestPayload);

      try {
        const response = await fetch('/api/ai/generate-image', {
          method: 'POST',
          headers: getHeadersWithKeys(),
          body: JSON.stringify({
            prompt: `${selectedStyle} style: ${imagePrompt}`,
            negativePrompt,
            width,
            height,
            aspectRatio,
            quality: imageQuality,
            seed: currentSeed,
            provider: selectedProvider
          })
        });

        const data = await response.json();
        console.log('[IMAGE GEN FLOW] API Response Payload:', data);

        if (data.success && data.imageUrl) {
          generatedUrls.push(data.imageUrl);
          successCount++;
          
          // Save to gallery
          const newGen: SavedGeneration = {
            id: crypto.randomUUID(),
            url: data.imageUrl,
            prompt: imagePrompt,
            provider: selectedProvider,
            width,
            height,
            aspectRatio,
            quality: imageQuality,
            seed: currentSeed,
            style: selectedStyle,
            timestamp: new Date().toLocaleTimeString()
          };
          setSavedGenerations(prev => [newGen, ...prev]);
        } else {
          onAddLog('warning', `Failed to generate image ${i + 1}: ${data.error || 'Unknown error'}`);
        }
      } catch (e: any) {
        onAddLog('error', `Error on image ${i + 1}: ${e.message}`);
        console.error('[IMAGE GEN FLOW] Error requesting image synthesis:', e);
      }
    }

    setGenerationProgress(100);
    setGenerationStep('Completed synthesis batch!');
    setIsGeneratingImage(false);

    if (generatedUrls.length > 0) {
      setLatestBatch(generatedUrls);
      setGeneratedImage(generatedUrls[0]);
      onAddLog('success', `Successfully generated series of ${successCount} image(s)!`);
    } else {
      onAddLog('error', 'Failed to generate any images in the series.');
    }
  };

  const handleAddImageToDataset = () => {
    if (!generatedImage || !selectedLabelId) return;
    const targetLabel = labels.find(l => l.id === selectedLabelId);
    onAddSample(`AI_${Date.now()}.png`, 'image', generatedImage, selectedLabelId);
    onAddLog('success', `Added generated visual directly to class: "${targetLabel?.name || 'Class'}"`);
    setGeneratedImage(null);
  };

  const handleAddAllToDataset = () => {
    if (latestBatch.length === 0 || !selectedLabelId) return;
    const targetLabel = labels.find(l => l.id === selectedLabelId);
    latestBatch.forEach((url, i) => {
      onAddSample(`AI_${Date.now()}_${i}.png`, 'image', url, selectedLabelId);
    });
    onAddLog('success', `Added all ${latestBatch.length} generated visuals directly to class: "${targetLabel?.name || 'Class'}"`);
    setLatestBatch([]);
    setGeneratedImage(null);
  };

  const handleDeleteSavedGen = (id: string) => {
    setSavedGenerations(prev => prev.filter(g => g.id !== id));
  };

  // --- VIDEO GENERATION ---
  const [videoInputError, setVideoInputError] = useState<string | null>(null);

  const handleGenerateVideo = async () => {
    setVideoInputError(null);
    if (!videoPrompt.trim()) {
      setVideoInputError("Please enter a prompt.");
      onAddLog('error', 'Please enter a prompt.');
      return;
    }
    
    setIsGeneratingVideo(true);
    setGeneratedVideo(null);
    setVideoProgress(0);
    setVideoStatus('Queued...');
    onAddLog('info', `Synthesizing video with ${videoProvider.toUpperCase()}...`);

    // Setup progressive simulator
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 4) + 1;
      if (currentProgress > 95) currentProgress = 95; // Wait at 95% until complete
      
      setVideoProgress(currentProgress);
      if (currentProgress < 20) {
        setVideoStatus('Queued...');
      } else if (currentProgress < 65) {
        setVideoStatus('Generating...');
      } else {
        setVideoStatus('Rendering...');
      }
    }, 400);

    try {
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: getHeadersWithKeys(),
        body: JSON.stringify({ 
          prompt: videoPrompt, 
          imageBase64: videoSourceImage,
          aspect: videoAspect,
          provider: videoProvider,
          duration: videoDuration,
          resolution: videoResolution,
          fps: videoFps,
          style: videoStyle,
          cameraMotion: videoCameraMotion,
          seed: videoSeed,
          negativePrompt: videoNegativePrompt
        })
      });
      
      const data = await response.json();

      if (data.success && data.videoUrl) {
        clearInterval(progressInterval);
        setVideoProgress(100);
        setVideoStatus('Completed');
        setGeneratedVideo(data.videoUrl);
        onAddLog('success', `Video synthesized successfully with ${videoProvider.toUpperCase()}!`);
        
        // Save to gallery / history
        const newVideoItem = {
          id: `vid_${Date.now()}`,
          url: data.videoUrl,
          prompt: videoPrompt,
          provider: videoProvider,
          duration: videoDuration,
          aspect: videoAspect,
          resolution: videoResolution,
          timestamp: new Date().toLocaleTimeString()
        };
        const updatedHistory = [newVideoItem, ...videoHistory];
        setVideoHistory(updatedHistory);
        localStorage.setItem('video_history_gallery', JSON.stringify(updatedHistory));
      } else {
        throw new Error(data.error || 'Failed to generate video');
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setVideoProgress(0);
      setVideoStatus('');
      onAddLog('error', `Video Generation Error: ${e.message}`);
      setVideoInputError(e.message || 'Error generating video');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // --- VISION QUALITY AUDIT ---
  const handleAnalyzeImage = async () => {
    if (!analysisImage) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    onAddLog('info', 'Initiating vision quality model auditing...');

    try {
      const response = await fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: getHeadersWithKeys(),
        body: JSON.stringify({ 
          imageBase64: analysisImage,
          prompt: analysisPrompt
        })
      });
      const data = await response.json();

      if (data.text) {
        setAnalysisResult(data.text);
        onAddLog('success', 'Vision audit report generated.');
      } else {
        throw new Error(data.error || 'Audit failed');
      }
    } catch (e: any) {
      onAddLog('error', `Vision auditing error: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomImageUpload = (file: File | null, type: 'video' | 'analysis') => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        if (type === 'video') setVideoSourceImage(e.target.result as string);
        if (type === 'analysis') setAnalysisImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="frosted-glass p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-850/80 space-y-6" id="ai-synthesis-lab">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-blue-500 animate-pulse" />
            Commercial AI Vision & Image Synthesizer
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Generate high-fidelity, production-grade training data and custom illustrations</p>
        </div>
        
        {/* Tab Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/40 dark:border-slate-800 text-[11px]">
          <button
            onClick={() => setActiveTab('image')}
            className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${activeTab === 'image' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Image Synthesizer
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${activeTab === 'video' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Film className="w-3.5 h-3.5" />
            Veo Video Studio
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${activeTab === 'analysis' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            Vision Quality Auditor
          </button>
        </div>
      </div>

      {/* 1. IMAGE SYNTHESIZER VIEW */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="image-synthesizer-panel">
          
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Prompt block */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850/60 space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Prompt Generator</label>
                <div className="flex gap-2">
                  <button 
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancing || !imagePrompt.trim()}
                    className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer disabled:opacity-40"
                    title="Improve weak prompts automatically using Gemini"
                  >
                    <Wand2 className="w-3 h-3" />
                    {isEnhancing ? 'Enhancing...' : 'Auto-Enhance'}
                  </button>
                  <button 
                    onClick={handleInterpretPrompt}
                    disabled={isInterpreting || !imagePrompt.trim()}
                    className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer disabled:opacity-40"
                    title="Extract structured elements from natural language"
                  >
                    <Search className="w-3 h-3" />
                    {isInterpreting ? 'Interpreting...' : 'Extract Meta'}
                  </button>
                </div>
              </div>

              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe what you want to synthesize (e.g. 'A futuristic AI robot in cyberpunk city, highly detailed, photorealistic render')"
                rows={3}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 leading-relaxed"
              />

              {/* Interpreted metadata panel */}
              {interpretedPrompt && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl text-[10px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="font-bold flex items-center justify-between text-indigo-700 dark:text-indigo-400 pb-1 border-b border-indigo-100/30">
                    <div className="flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Extracted Semantic Elements:
                    </div>
                    <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Applied</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div><strong>Subject:</strong> {interpretedPrompt.subject || 'None'}</div>
                    <div><strong>Style:</strong> {interpretedPrompt.style || 'None'}</div>
                    <div><strong>Scene:</strong> {interpretedPrompt.scene || 'None'}</div>
                    <div><strong>Lighting:</strong> {interpretedPrompt.lighting || 'None'}</div>
                    <div><strong>Camera:</strong> {interpretedPrompt.camera || 'None'}</div>
                    <div><strong>Quality:</strong> {interpretedPrompt.quality || 'None'}</div>
                    {interpretedPrompt.seed && (
                      <div><strong>Seed:</strong> {interpretedPrompt.seed}</div>
                    )}
                    {interpretedPrompt.aspectRatio && (
                      <div><strong>Aspect:</strong> {interpretedPrompt.aspectRatio}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Style preset visual grid */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Style presets</span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setSelectedStyle(preset.name)}
                      className={`p-1.5 rounded-lg border text-left text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${selectedStyle === preset.name ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'}`}
                      title={preset.desc}
                    >
                      <span className="text-xs shrink-0">{preset.icon}</span>
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced configurations */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850/60 space-y-3.5">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Advanced configuration</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Providers */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Image Model Provider</label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {PROVIDERS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Aspect Ratio</label>
                  <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
                    {(['1:1', '3:2', '2:3', '16:9', '9:16'] as const).map(ar => (
                      <button
                        key={ar}
                        onClick={() => setAspectRatio(ar)}
                        className={`p-1 rounded-lg border text-center cursor-pointer transition-colors ${aspectRatio === ar ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Negative Prompt */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Negative Prompt</label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Elements to exclude from generation"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Image Quality, Seed, and Series Count */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Seed */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Generation Seed</label>
                    <label className="flex items-center gap-1 text-[9px] text-slate-400 font-bold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isRandomSeed} 
                        onChange={(e) => setIsRandomSeed(e.target.checked)} 
                        className="rounded text-blue-600 w-3 h-3"
                      />
                      Randomize
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => {
                        setSeed(parseInt(e.target.value) || 0);
                        setIsRandomSeed(false);
                      }}
                      disabled={isRandomSeed}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs text-slate-900 dark:text-slate-100 disabled:opacity-50"
                    />
                    <button 
                      onClick={() => setSeed(Math.floor(Math.random() * 999999))}
                      className="px-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      title="Generate new random seed"
                    >
                      🎲
                    </button>
                  </div>
                </div>

                {/* Quality */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Image Quality</label>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                    {(['Standard', 'HD', 'Ultra'] as const).map(q => (
                      <button
                        key={q}
                        onClick={() => setImageQuality(q)}
                        className={`py-2 rounded-lg border text-center cursor-pointer transition-colors ${imageQuality === q ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Series Count */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Series Count</label>
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                    {([1, 3, 5, 10] as const).map(count => (
                      <button
                        key={count}
                        onClick={() => setImageCount(count)}
                        className={`py-2 rounded-lg border text-center cursor-pointer transition-colors ${imageCount === count ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                      >
                        {count}x
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Trigger Button */}
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isGeneratingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 animate-pulse" />}
                Generate Sample Image Series
              </button>
            </div>

            {/* Quick Prompt Ideas fallback */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] text-slate-400 font-bold uppercase">Trending:</span>
              {['Vibrant red tomato macro', 'Isometric lowpoly laptop tech illustration', 'Fantasy magic stone artifact glow'].map((idea, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setImagePrompt(idea);
                    setSelectedStyle(idx === 0 ? 'Realistic' : idx === 1 ? 'Isometric' : 'Fantasy');
                  }}
                  className="text-[9px] bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 border border-slate-200/40 dark:border-slate-800 text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded-full cursor-pointer font-semibold"
                >
                  {idea}
                </button>
              ))}
            </div>

          </div>

          {/* Render & Preview Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Main Preview Frame */}
            <div className="flex flex-col items-center justify-center border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl p-4 min-h-[300px] relative overflow-hidden flex-1 shadow-inner" id="generated-image-preview">
              {isGeneratingImage && (
                <div className="flex flex-col items-center gap-3 max-w-[80%] text-center">
                  <div className="relative flex items-center justify-center">
                    <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                    <span className="absolute text-[10px] font-bold text-blue-600">{generationProgress}%</span>
                  </div>
                  <span className="text-xs text-slate-800 dark:text-slate-100 font-bold animate-pulse">{generationStep}</span>
                  
                  {/* Real visual progress bar */}
                  <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Synthesizing at {getDimensions(aspectRatio).width}x{getDimensions(aspectRatio).height}</span>
                </div>
              )}

              {!isGeneratingImage && !generatedImage && (
                <div className="text-center text-slate-400 space-y-2 p-6">
                  <Compass className="w-12 h-12 mx-auto opacity-30 text-blue-500 animate-spin" style={{ animationDuration: '20s' }} />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Render Preview Engine</p>
                  <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto">Input your description, configure aspect configurations and render to visualize results.</p>
                </div>
              )}

              {!isGeneratingImage && generatedImage && (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="relative group w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">
                    <img src={generatedImage} alt="Synthesized Sample" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    
                    {/* Action overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                      <a
                        href={generatedImage}
                        download={`ai_sample_${Date.now()}.png`}
                        className="p-2.5 bg-white/20 hover:bg-white/40 rounded-xl text-white backdrop-blur transition-all"
                        title="Download raw file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Active Image Metadata Bar */}
                  {(() => {
                    const activeGen = savedGenerations.find(g => g.url === generatedImage);
                    if (!activeGen) return null;
                    return (
                      <div className="w-full max-w-[280px] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 flex flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400 shadow-sm animate-fadeIn">
                        <div className="flex justify-between items-center pb-1 border-b border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-400 flex items-center gap-1">
                            <Sliders className="w-2.5 h-2.5 text-blue-500" />
                            PARAMETERS
                          </span>
                          <button
                            onClick={() => {
                              setImagePrompt(activeGen.prompt);
                              setSelectedStyle(activeGen.style);
                              setAspectRatio(activeGen.aspectRatio as any);
                              setImageQuality(activeGen.quality);
                              setSeed(activeGen.seed);
                              setIsRandomSeed(false);
                              if (onAddLog) onAddLog('success', `Restored generation: Seed ${activeGen.seed}, style ${activeGen.style}`);
                            }}
                            className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                            title="Apply prompt, style, seed and settings of this specific image back to form"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            Use Settings
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 text-left font-mono text-[9px]">
                          <div className="truncate">Seed: <span className="text-slate-800 dark:text-slate-200 font-bold">{activeGen.seed}</span></div>
                          <div className="truncate">Style: <span className="text-slate-800 dark:text-slate-200 font-bold">{activeGen.style}</span></div>
                          <div className="truncate">Aspect: <span className="text-slate-800 dark:text-slate-200 font-bold">{activeGen.aspectRatio}</span></div>
                          <div className="truncate">Quality: <span className="text-slate-800 dark:text-slate-200 font-bold">{activeGen.quality}</span></div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Batch series thumbnails */}
                  {latestBatch.length > 1 && (
                    <div className="flex gap-1.5 justify-center flex-wrap" id="batch-thumbnails">
                      {latestBatch.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setGeneratedImage(url)}
                          className={`w-10 h-10 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${generatedImage === url ? 'border-blue-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        >
                          <img src={url} alt={`Series ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-3 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Target label class:</span>
                      <select
                        value={selectedLabelId}
                        onChange={(e) => setSelectedLabelId(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg p-1.5 text-xs text-slate-900 dark:text-slate-100"
                      >
                        {labels.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleAddImageToDataset}
                        className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Inject to Class
                      </button>
                      {latestBatch.length > 1 ? (
                        <button
                          onClick={handleAddAllToDataset}
                          className="py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow"
                        >
                          <Plus className="w-3.5 h-3.5 animate-pulse" />
                          Inject All ({latestBatch.length})
                        </button>
                      ) : (
                        <button
                          onClick={handleGenerateImage}
                          className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200/40 dark:border-slate-800"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generated gallery list */}
            {savedGenerations.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                  <span>Saved Iterations ({savedGenerations.length})</span>
                  <button onClick={() => setSavedGenerations([])} className="hover:underline text-red-500">Clear</button>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {savedGenerations.map(gen => (
                    <div key={gen.id} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 dark:border-slate-800">
                      <img src={gen.url} alt="saved gen" className="w-full h-full object-cover cursor-pointer" onClick={() => setGeneratedImage(gen.url)} />
                      <button
                        onClick={() => handleDeleteSavedGen(gen.id)}
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete from history"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* 2. VEO VIDEO STUDIO VIEW */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="video-synthesizer-panel">
          <div className="space-y-4">
            
            {/* Input & Prompt Panel */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-850/60 space-y-4">
              
              {/* Validation Banner */}
              {videoInputError && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200/40 dark:border-red-800/40 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                  {videoInputError}
                </div>
              )}

              {/* Provider Selection */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Video Engine</label>
                <select
                  value={videoProvider}
                  onChange={(e) => {
                    setVideoProvider(e.target.value);
                    localStorage.setItem('active_video_provider', e.target.value);
                  }}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="google">Google Veo (veo-3.1-lite-generate-preview)</option>
                  <option value="runway">Runway Gen-4 (Gen-3 via Fal)</option>
                  <option value="luma">Luma Dream Machine</option>
                  <option value="pika">Pika Video AI</option>
                  <option value="kling">Kling AI Video</option>
                  <option value="stability">Stability AI Video (SVD)</option>
                  <option value="fal">Fal.ai General</option>
                  <option value="replicate">Replicate General</option>
                </select>
              </div>

              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Reference Source Photo (Optional)</label>
              
              {/* Image selector or custom upload */}
              {videoSourceImage ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow">
                  <img src={videoSourceImage} alt="source" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setVideoSourceImage(null)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/90"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label className="flex-1 py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center gap-1 bg-white dark:bg-slate-900 cursor-pointer text-[11px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850">
                    <Plus className="w-4 h-4 text-slate-400" />
                    <span>Upload reference image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCustomImageUpload(e.target.files?.[0] || null, 'video')}
                    />
                  </label>
                  
                  {datasetImageSamples.length > 0 && (
                    <button
                      onClick={() => {
                        const randomSample = datasetImageSamples[Math.floor(Math.random() * datasetImageSamples.length)];
                        setVideoSourceImage(randomSample.data);
                      }}
                      className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-[10px] font-semibold text-blue-500"
                    >
                      Use sample image
                    </button>
                  )}
                </div>
              )}

              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider pt-1">Animation Prompt / Narrative</label>
              <textarea
                value={videoPrompt}
                onChange={(e) => {
                  setVideoPrompt(e.target.value);
                  if (videoInputError) setVideoInputError(null);
                }}
                placeholder="Describe how to animate the video (e.g. 'fluid smooth rotation zoom inside the green garden, dramatic depth of field, sunset rays')"
                rows={2}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              />

              {/* Dynamic Aspect Ratio Controls */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aspect Ratio / Composition</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['16:9', '9:16', '1:1', '3:2'] as const).map((aspect) => (
                    <button
                      key={aspect}
                      onClick={() => setVideoAspect(aspect)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${videoAspect === aspect ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-500 bg-white dark:bg-slate-900 hover:bg-slate-50'}`}
                    >
                      {aspect}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Controls Section */}
              <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-4 space-y-3">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Cinematic Synthesis Controls</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase">Duration</label>
                    <select
                      value={videoDuration}
                      onChange={(e: any) => setVideoDuration(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200"
                    >
                      <option value="5s">5 Seconds</option>
                      <option value="10s">10 Seconds</option>
                      <option value="15s">15 Seconds</option>
                      <option value="30s">30 Seconds</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase">Target Quality</label>
                    <select
                      value={videoResolution}
                      onChange={(e: any) => setVideoResolution(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200"
                    >
                      <option value="720p">720p (HD)</option>
                      <option value="1080p">1080p (Full HD)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase">Frame Rate (FPS)</label>
                    <select
                      value={videoFps}
                      onChange={(e: any) => setVideoFps(Number(e.target.value) as any)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200"
                    >
                      <option value={24}>24 fps (Cinema)</option>
                      <option value={30}>30 fps (Standard)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase">Aesthetic Style</label>
                    <select
                      value={videoStyle}
                      onChange={(e) => setVideoStyle(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200"
                    >
                      <option value="Realistic">Photorealistic Cinematic</option>
                      <option value="Anime">Stylized Anime / Cel</option>
                      <option value="3D Render">3D Unreal Engine 5</option>
                      <option value="Cinematic">Dramatic Hollywood</option>
                      <option value="Oil Painting">Classical Oil Canvas</option>
                      <option value="Sketch">Minimal Charcoal Sketch</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase">Camera Motion</label>
                    <select
                      value={videoCameraMotion}
                      onChange={(e) => setVideoCameraMotion(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200"
                    >
                      <option value="None">Static / Steady</option>
                      <option value="Zoom In">Slow Zoom In</option>
                      <option value="Zoom Out">Slow Zoom Out</option>
                      <option value="Pan Left">Pan Left</option>
                      <option value="Pan Right">Pan Right</option>
                      <option value="Orbit">Orbit Arc Shot</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase">Synthesis Seed</label>
                    <input
                      type="number"
                      value={videoSeed}
                      onChange={(e) => setVideoSeed(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200"
                      placeholder="-1 (Randomized)"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase">Negative Prompt (Avoid)</label>
                  <textarea
                    value={videoNegativePrompt}
                    onChange={(e) => setVideoNegativePrompt(e.target.value)}
                    rows={1}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                    placeholder="Specify properties to omit..."
                  />
                </div>
              </div>

              {/* Main Synthesize Trigger */}
              <button
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-45 hover:opacity-95 transition-all mt-2"
              >
                {isGeneratingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5 animate-pulse" />}
                Synthesize Cinematic Video
              </button>
            </div>
          </div>

          {/* Right Column: Video Preview and History */}
          <div className="space-y-4">
            
            {/* Viewport Card */}
            <div className="flex flex-col items-center justify-center border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl p-5 min-h-[340px] relative overflow-hidden shadow-sm" id="generated-video-preview">
              
              {/* Active Generation Progress */}
              {isGeneratingVideo && (
                <div className="flex flex-col items-center gap-4 w-full max-w-[280px] text-center">
                  <div className="relative flex items-center justify-center w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-950 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{videoProgress}%</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Status: <span className="text-purple-600">{videoStatus}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 animate-pulse">
                      Processing frame-by-frame synthesis on GPU network...
                    </p>
                  </div>
                </div>
              )}

              {/* Idle State */}
              {!isGeneratingVideo && !generatedVideo && (
                <div className="text-center text-slate-400 space-y-3">
                  <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Film className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Veo Video Studio</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                      Configure your prompt & settings, then initiate the pipeline to compile your high-fidelity cinematic vector stream.
                    </p>
                  </div>
                </div>
              )}

              {/* Output Preview State */}
              {!isGeneratingVideo && generatedVideo && (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className={`w-full max-w-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-black ${
                    videoAspect === '9:16' ? 'aspect-[9/16] max-w-[220px]' : 
                    videoAspect === '1:1' ? 'aspect-square max-w-[300px]' : 
                    videoAspect === '3:2' ? 'aspect-[3/2]' : 'aspect-video'
                  }`}>
                    <video
                      key={generatedVideo}
                      src={generatedVideo}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Professional Actions Bar */}
                  <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-3 rounded-2xl flex flex-wrap gap-2 justify-center shadow-sm">
                    
                    <a
                      href={generatedVideo}
                      download={`synthesis_${Date.now()}.mp4`}
                      className="px-3 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-95 rounded-xl text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                      title="Download generated MP4 video file to your local computer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedVideo || '');
                        onAddLog?.('success', 'Presentable video presentation link copied to clipboard.');
                      }}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 rounded-xl text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                      title="Share this generated visual presentation link"
                    >
                      <Share2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Share</span>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedVideo || '');
                        onAddLog?.('success', 'Cinematic resource link copied.');
                      }}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 rounded-xl text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                      title="Copy standard video source URI"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </button>

                    <button
                      onClick={handleGenerateVideo}
                      className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/30 rounded-xl text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                      title="Re-compile vector generation using active settings"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regenerate</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Video Generation History & Gallery List */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-100 dark:border-slate-850/60 space-y-2.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Rendering History & Gallery ({videoHistory.length})</span>
                {videoHistory.length > 0 && (
                  <button 
                    onClick={() => {
                      setVideoHistory([]);
                      localStorage.removeItem('video_history_gallery');
                      onAddLog?.('warning', 'Cleared Video Studio rendering history.');
                    }} 
                    className="hover:underline text-red-500 font-bold cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {videoHistory.length === 0 ? (
                <div className="py-6 text-center text-[10px] text-slate-500 font-medium italic">
                  No active compilations in current local database.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {videoHistory.map((vid) => (
                    <div 
                      key={vid.id} 
                      className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${
                        generatedVideo === vid.url 
                          ? 'border-blue-500 bg-blue-500/5 shadow-md' 
                          : 'border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900/60 hover:border-slate-200'
                      }`}
                    >
                      <div className="p-2 space-y-1.5" onClick={() => {
                        setGeneratedVideo(vid.url);
                        setVideoAspect(vid.aspect as any);
                        setVideoPrompt(vid.prompt);
                        setVideoProvider(vid.provider);
                        onAddLog?.('info', `Loaded video from history: "${vid.prompt.substring(0, 30)}..."`);
                      }}>
                        <div className="aspect-video rounded-xl overflow-hidden bg-black relative">
                          <video src={vid.url} className="w-full h-full object-cover pointer-events-none" muted />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-5 h-5 text-white fill-white animate-pulse" />
                          </div>
                          <span className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[8px] text-white font-semibold">
                            {vid.duration || '5s'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold truncate">
                            {vid.prompt}
                          </p>
                          <div className="flex justify-between items-center text-[8px] text-slate-400 uppercase font-bold">
                            <span>{vid.provider} • {vid.resolution}</span>
                            <span>{vid.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete Individual History Item */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = videoHistory.filter(v => v.id !== vid.id);
                          setVideoHistory(updated);
                          localStorage.setItem('video_history_gallery', JSON.stringify(updated));
                          if (generatedVideo === vid.url) {
                            setGeneratedVideo(null);
                          }
                          onAddLog?.('warning', 'Removed item from video studio history.');
                        }}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                        title="Delete from history"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 3. IMAGE ANALYSIS VIEW */}
      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="vision-analyzer-panel">
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850/60 space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Select Image for Audit</label>
              
              {analysisImage ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow">
                  <img src={analysisImage} alt="analysis source" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setAnalysisImage(null)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/90"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label className="flex-1 py-4 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl flex flex-col items-center justify-center gap-1 bg-white dark:bg-slate-900 cursor-pointer text-xs">
                    <Plus className="w-4 h-4 text-slate-400" />
                    <span>Upload dataset item photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCustomImageUpload(e.target.files?.[0] || null, 'analysis')}
                    />
                  </label>
                  
                  {datasetImageSamples.length > 0 && (
                    <button
                      onClick={() => {
                        const randomSample = datasetImageSamples[Math.floor(Math.random() * datasetImageSamples.length)];
                        setAnalysisImage(randomSample.data);
                      }}
                      className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-[11px] font-semibold text-blue-500"
                    >
                      Use random sample
                    </button>
                  )}
                </div>
              )}

              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Audit Instructions / Objectives</label>
              <textarea
                value={analysisPrompt}
                onChange={(e) => setAnalysisPrompt(e.target.value)}
                rows={3}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 leading-relaxed"
              />

              <button
                onClick={handleAnalyzeImage}
                disabled={isAnalyzing || !analysisImage}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSearch className="w-3.5 h-3.5" />}
                Run Quality Audit
              </button>
            </div>
          </div>

          {/* Analysis Result Display */}
          <div className="flex flex-col border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl p-4 min-h-[220px] relative overflow-hidden" id="vision-analyzer-output">
            {isAnalyzing && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="text-xs text-slate-500 animate-pulse font-medium">Extracting neural features with gemini-3.1-pro-preview...</span>
              </div>
            )}

            {!isAnalyzing && !analysisResult && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <FileSearch className="w-10 h-10 mx-auto opacity-40 text-blue-400" />
                <p className="text-xs font-medium">Vision Auditor Insights</p>
                <p className="text-[10px] text-slate-500">Run audit to reveal brightness distribution, noise, and dataset warnings.</p>
              </div>
            )}

            {!isAnalyzing && analysisResult && (
              <div className="flex-1 flex flex-col justify-between space-y-3">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-150 dark:border-slate-850 pb-2">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  Audit Analytics Report
                </div>
                
                <div className="flex-1 max-h-[200px] overflow-y-auto text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap bg-white dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-850">
                  {analysisResult}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
