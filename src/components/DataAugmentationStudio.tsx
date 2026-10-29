import React, { useState } from 'react';
import { RotateCw, Maximize, Sun, Eye, Sparkles, Check, RefreshCw } from 'lucide-react';

interface DataAugmentationStudioProps {
  samples?: any[];
  onAugmentComplete?: (augmentedDataUrl: string) => void;
  onAugmented?: (augmentedDataUrl: string) => void;
}

export const DataAugmentationStudio: React.FC<DataAugmentationStudioProps> = ({
  samples = [],
  onAugmentComplete,
  onAugmented,
}) => {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [blur, setBlur] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [noise, setNoise] = useState(false);

  // Find image samples
  const imageSamples = samples.filter(s => s.type === 'image' && typeof s.data === 'string' && s.data.startsWith('data:'));
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');

  const activeSample = imageSamples.find(s => s.id === selectedSampleId) || imageSamples[0];
  const activeImgSrc = activeSample ? activeSample.data : '';

  // Default sample image (SVG apple shape or dynamic canvas representation)
  const sampleImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100%' height='100%'><circle cx='50' cy='55' r='30' fill='%2322c55e'/><path d='M50 25 C45 10 55 10 50 25' stroke='%23854d0e' stroke-width='4' fill='none'/><path d='M50 15 C60 10 65 15 60 20' fill='%2315803d'/></svg>";

  const displayImgSrc = activeImgSrc || sampleImg;

  const handleApply = () => {
    // Generate simulated augmented canvas
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 150, 150);

      const runExport = (imgElement?: HTMLImageElement) => {
        ctx.save();
        ctx.translate(75, 75);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom * (flipH ? -1 : 1), zoom * (flipV ? -1 : 1));

        if (imgElement) {
          ctx.drawImage(imgElement, -50, -50, 100, 100);
        } else {
          // Draw standard representation
          ctx.beginPath();
          ctx.arc(0, 5, 30, 0, 2 * Math.PI);
          ctx.fillStyle = '#10b981';
          ctx.fill();

          // Stem
          ctx.beginPath();
          ctx.moveTo(0, -25);
          ctx.lineTo(5, -35);
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#b45309';
          ctx.stroke();
        }

        ctx.restore();

        const augmentedUrl = canvas.toDataURL();
        if (onAugmented) onAugmented(augmentedUrl);
        if (onAugmentComplete) onAugmentComplete(augmentedUrl);
      };

      if (displayImgSrc.startsWith('data:')) {
        const img = new Image();
        img.onload = () => {
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) blur(${blur}px)`;
          runExport(img);
        };
        img.onerror = () => {
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) blur(${blur}px)`;
          runExport();
        };
        img.src = displayImgSrc;
      } else {
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) blur(${blur}px)`;
        runExport();
      }
    }
  };

  const handleReset = () => {
    setRotation(0);
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setBlur(0);
    setFlipH(false);
    setFlipV(false);
    setNoise(false);
  };

  return (
    <div className="frosted-glass p-6 rounded-3xl shadow-lg space-y-6" id="augmentation-studio">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Dataset Augmentation Studio
          </h3>
          <p className="text-[11px] text-slate-500">Apply synthetic effects to double dataset size and combat overfitting</p>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          Reset Options
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="augmentation-panels">
        {/* Visual Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl relative overflow-hidden" id="augmentation-preview">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider absolute top-3 left-3 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Augmented Preview
          </div>

          <div className="w-36 h-36 flex items-center justify-center border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-inner relative overflow-hidden transition-all duration-300">
            <img
              src={displayImgSrc}
              alt="Augmentation Sample"
              className="w-24 h-24 transition-all duration-300 object-contain"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom * (flipH ? -1 : 1)}, ${zoom * (flipV ? -1 : 1)})`,
                filter: `brightness(${brightness}%) contrast(${contrast}%) blur(${blur}px) ${noise ? 'contrast(200%)' : ''}`,
              }}
            />
          </div>

          {imageSamples.length > 0 && (
            <div className="w-full mt-3 space-y-1">
              <div className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-wider">Select Sample Image to Augment:</div>
              <div className="flex items-center gap-1.5 justify-center overflow-x-auto py-1 max-w-full">
                {imageSamples.slice(0, 6).map((sample) => {
                  const isSelected = selectedSampleId === sample.id || (!selectedSampleId && imageSamples[0].id === sample.id);
                  return (
                    <button
                      key={sample.id}
                      onClick={() => setSelectedSampleId(sample.id)}
                      className={`w-10 h-10 rounded-lg border overflow-hidden shrink-0 transition-all ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/20 scale-105' : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'}`}
                    >
                      <img src={sample.data} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleApply}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-purple-600/10"
            id="apply-augmentation-btn"
          >
            <Check className="w-3.5 h-3.5" />
            Generate Augmented Copy
          </button>
        </div>

        {/* Controls */}
        <div className="space-y-4 text-xs" id="augmentation-controls">
          <div>
            <div className="flex justify-between text-slate-400 font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5" /> Rotation
              </span>
              <span className="font-mono">{rotation}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <Maximize className="w-3.5 h-3.5" /> Zoom
              </span>
              <span className="font-mono">{zoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5" /> Brightness
              </span>
              <span className="font-mono">{brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          {/* Quick Flips */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setFlipH(!flipH)}
              className={`py-2 px-3 border rounded-xl font-bold cursor-pointer transition-colors text-center ${
                flipH
                  ? 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-500'
              }`}
            >
              Flip Horizontal
            </button>
            <button
              onClick={() => setFlipV(!flipV)}
              className={`py-2 px-3 border rounded-xl font-bold cursor-pointer transition-colors text-center ${
                flipV
                  ? 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-500'
              }`}
            >
              Flip Vertical
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
