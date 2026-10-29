import React, { useState } from 'react';
import { ShoppingBag, Search, Sparkles, Heart, Bookmark, Eye, Download, Shield, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface MarketplaceModel {
  id: string;
  name: string;
  description: string;
  creator: string;
  type: string;
  accuracy: number;
  likes: number;
  downloads: number;
  isPrivate: boolean;
  liked?: boolean;
  bookmarked?: boolean;
}

interface ModelMarketplaceProps {
  onAddLog?: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
}

export const ModelMarketplace: React.FC<ModelMarketplaceProps> = ({ 
  onAddLog = (type, message) => console.log(`[${type.toUpperCase()}] ${message}`) 
}) => {
  const [models, setModels] = useState<MarketplaceModel[]>([
    {
      id: '1',
      name: 'ResNet-50 Apple Pathogen Classifier',
      description: 'Accurate model trained on 15,000 leaf samples to classify scab, rust, and rot pathogens on apple crop leaves.',
      creator: 'AgroTech Labs',
      type: 'IMAGE',
      accuracy: 0.985,
      likes: 312,
      downloads: 1450,
      isPrivate: false,
    },
    {
      id: '2',
      name: 'Conversational Intent Classifier v2.1',
      description: 'Customer service NLP agent classified across 48 distinct banking intents. Pre-tokenized word-sequence outputs.',
      creator: 'Apex Systems',
      type: 'TEXT',
      accuracy: 0.942,
      likes: 189,
      downloads: 870,
      isPrivate: false,
    },
    {
      id: '3',
      name: 'Ambient Noise Waveform Reducer',
      description: 'Audio spectrogram network to detect and isolate micro-feedback noise loops in real-time microphones.',
      creator: 'SoniCore AI',
      type: 'AUDIO',
      accuracy: 0.891,
      likes: 74,
      downloads: 320,
      isPrivate: false,
    }
  ]);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const handleLike = (id: string) => {
    setModels(prev => prev.map(m => {
      if (m.id === id) {
        const liked = !m.liked;
        return {
          ...m,
          liked,
          likes: liked ? m.likes + 1 : m.likes - 1
        };
      }
      return m;
    }));
  };

  const handleBookmark = (id: string) => {
    setModels(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, bookmarked: !m.bookmarked };
      }
      return m;
    }));
  };

  const filtered = models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6" id="model-marketplace-dashboard">
      
      {/* Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-500/20 rounded-3xl relative overflow-hidden" id="marketplace-banner">
        <div className="absolute right-12 top-6 opacity-10">
          <ShoppingBag className="w-24 h-24 text-blue-500" />
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Neural Model Marketplace</h3>
            <p className="text-xs text-slate-500">Explore, share, and deploy custom TensorFlow.js layers within our community hub</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mb-4">
          Discover pre-trained model weights created by developers globally. Publish your own custom models, compile predictions, or download raw JSON weights for ONNX & TF Lite exports.
        </p>
      </div>

      {/* Toolbar / Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center" id="marketplace-toolbar">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search verified models..."
            className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-9 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto" id="marketplace-type-filters">
          {['ALL', 'IMAGE', 'TEXT', 'AUDIO'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer flex-1 sm:flex-none ${
                filterType === type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="marketplace-items-grid">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="frosted-glass p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-850/60 flex flex-col justify-between group relative overflow-hidden"
            id={`marketplace-card-${item.id}`}
          >
            <div>
              {/* Badge & Creator */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg border border-blue-100/40 dark:border-blue-900/40">
                  {item.type} classification
                </span>
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-500" /> Verified Weights
                </span>
              </div>

              {/* Title & Desc */}
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
                {item.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-center mb-4">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] text-slate-400 block mb-0.5">ACCURACY</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{(item.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] text-slate-400 block mb-0.5">SIZE</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">2.4 MB</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLike(item.id)}
                  className={`flex items-center gap-1 text-xs font-bold cursor-pointer transition-colors ${
                    item.liked ? 'text-rose-500 animate-bounce' : 'text-slate-400 hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${item.liked ? 'fill-rose-500' : ''}`} />
                  {item.likes}
                </button>
                <button
                  onClick={() => handleBookmark(item.id)}
                  className={`flex items-center gap-1 text-xs font-bold cursor-pointer transition-colors ${
                    item.bookmarked ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${item.bookmarked ? 'fill-amber-500' : ''}`} />
                  Save
                </button>
              </div>

              <button
                onClick={() => onAddLog('success', `Fetched and downloaded weights pack for "${item.name}" successfully.`)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Fetch
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
