import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, X, Send, Sparkles, MessageSquare, Lightbulb, Zap, HelpCircle, 
  Mic, MicOff, Volume2, VolumeX, Paperclip, Search, Plus, Pin, PinOff, 
  Trash2, Edit2, Play, Square, RefreshCw, FileText, FileCode, Check, 
  ChevronLeft, Menu, File, FileAudio, FileVideo, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Label, Sample } from '../types';

interface AIAssistantProps {
  currentProject?: Project | null;
  labels?: Label[];
  samples?: Sample[];
  trainingHistory?: { epoch: number; loss: number; valLoss: number; acc: number; valAcc: number; }[];
  onAddLog?: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
}

interface FileAttachment {
  name: string;
  type: string;
  data: string; // base64 representation
  size?: number;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
  suggestions?: string[];
  fileAttached?: FileAttachment;
  providerUsed?: string;
  note?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  isPinned: boolean;
  createdAt: Date;
}

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini (Standard)', desc: 'High-performance reasoning and search grounding' },
  { id: 'openai', name: 'OpenAI GPT-4o-mini', desc: 'Fast, sharp analytical responses' },
  { id: 'anthropic', name: 'Anthropic Claude 3.5', desc: 'State-of-the-art technical writing and code' },
  { id: 'deepseek', name: 'DeepSeek Chat', desc: 'Advanced math, coding, and logical breakdown' },
  { id: 'groq', name: 'Groq (Mixtral)', desc: 'Instant rapid-fire generation performance' },
  { id: 'openrouter', name: 'OpenRouter Llama 3', desc: 'Versatile community-driven open weight engine' },
  { id: 'mistral', name: 'Mistral Large', desc: 'Elegant European bilingual reasoning model' }
];

export const AIAssistant: React.FC<AIAssistantProps> = ({
  currentProject,
  labels = [],
  samples = [],
  trainingHistory = [],
  onAddLog,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Chat Provider
  const [activeProvider, setActiveProvider] = useState('gemini');

  // Input states
  const [input, setInput] = useState('');
  const [useGrounding, setUseGrounding] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // File Attachments
  const [pendingFile, setPendingFile] = useState<FileAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-session State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const defaultSession: ChatSession = {
      id: 'default',
      title: 'AutoML Concept Explorer',
      isPinned: false,
      createdAt: new Date(),
      messages: [
        {
          id: '1',
          sender: 'ai',
          text: "Hello! I'm your enterprise Teachable Machine AI Assistant. I can analyze your custom dataset, explain training loss profiles, suggest hyperparameters, and run OCR audits on your visual layers. How can I guide your model training today?",
          timestamp: new Date(),
          suggestions: [
            'Analyze my dataset health',
            'How to configure learning rate?',
            'Explain Overfitting vs Underfitting',
            'What hyperparameters are best?'
          ]
        }
      ]
    };
    return [defaultSession];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>('default');

  // Streaming & Stop Control reference
  const abortControllerRef = useRef<AbortController | null>(null);

  // Speech-to-text elements
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isOpen]);

  // Speech Recognition initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(prev => (prev ? prev + ' ' + transcript : transcript));
        }
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      if (onAddLog) {
        onAddLog('error', 'Speech Recognition is not supported or enabled in this browser frame.');
      }
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      // If already speaking, cancel it
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        return;
      }
      const cleanText = text.replace(/\*\*|\*|#/g, ''); // Strip formatting
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      if (onAddLog) {
        onAddLog('error', 'Speech Synthesis not supported in this environment.');
      }
    }
  };

  // Create a new session
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: `Chat Session #${sessions.length + 1}`,
      isPinned: false,
      createdAt: new Date(),
      messages: [
        {
          id: crypto.randomUUID(),
          sender: 'ai',
          text: `Initialized secure session using **${activeProvider.toUpperCase()}** model container. How can I assist you with machine learning insights?`,
          timestamp: new Date(),
          suggestions: ['Analyze dataset', 'Help configure parameters']
        }
      ]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setShowSidebar(false);
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      if (onAddLog) {
        onAddLog('warning', 'Cannot delete the last remaining active session.');
      }
      return;
    }
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handlePinSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s));
  };

  // Intelligent local co-pilot logic when APIs are offline or demo-mode is active
  const getOfflineAIResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('analyze') || q.includes('dataset') || q.includes('health')) {
      const imgCount = samples.filter(s => s.type === 'image').length;
      const textCount = samples.filter(s => s.type === 'text').length;
      return `*(Local Co-Pilot Model - Dataset Audit)*:\n\n• **Labels Defined:** ${labels.length}\n• **Total Training Samples:** ${samples.length}\n\n*General Advice:* Ensure high class parity and try applying visual augmentation vectors to improve performance before launching training.`;
    }
    if (q.includes('improve') || q.includes('accuracy')) {
      return `*(Local Co-Pilot Model - Optimization)*:\n\n1. **Increase dataset density:** Aim for 30+ items per label.\n2. **Optimize learning rate:** Standard sweet spot is 0.005.\n3. **Validation metrics:** Ensure evaluation loss does not drift from training curves.`;
    }
    return `*(Local Co-Pilot Model)*:\n\nThank you for asking! For professional **${currentProject?.type || 'Image'} Classification** models, we recommend setting standard batch slices to 16, running for 40 epochs, and adjusting class weights to mitigate minor class imbalances.`;
  };

  // Handle File Upload and conversion to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPendingFile({
          name: file.name,
          type: file.type || 'application/octet-stream',
          data: event.target.result as string,
          size: file.size
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger stop active generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() && !pendingFile) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
      fileAttached: pendingFile || undefined
    };

    // Update session state locally with User prompt
    const updatedMessages = [...activeSession.messages, userMsg];
    setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, messages: updatedMessages } : s));

    setInput('');
    setPendingFile(null);
    setIsLoading(true);

    // Auto-rename chat session title on first user query to make it highly relevant
    if (activeSession.title.startsWith('Chat Session')) {
      const summaryTitle = textToSend.slice(0, 24) + (textToSend.length > 24 ? '...' : '');
      handleRenameSession(activeSession.id, summaryTitle);
    }

    try {
      abortControllerRef.current = new AbortController();

      // Convert conversation structure
      const conversationHistory = activeSession.messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': localStorage.getItem('gemini_api_key') || '',
          'x-openai-key': localStorage.getItem('openai_api_key') || '',
          'x-stability-key': localStorage.getItem('stability_api_key') || '',
          'x-deepseek-key': localStorage.getItem('deepseek_api_key') || '',
          'x-groq-key': localStorage.getItem('groq_api_key') || '',
          'x-openrouter-key': localStorage.getItem('openrouter_api_key') || ''
        },
        body: JSON.stringify({
          message: textToSend,
          history: conversationHistory,
          provider: activeProvider,
          useGrounding,
          useThinking,
          fileData: userMsg.fileAttached?.data,
          mimeType: userMsg.fileAttached?.type,
          fileName: userMsg.fileAttached?.name
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      
      if (data.success && data.text) {
        // Dynamic simulated typing streaming effect for absolute realism
        let currentTypedText = '';
        const rawResponse = data.text;
        
        // Add a temporary loading message to simulate typing progress
        const aiMsgId = crypto.randomUUID();
        const aiMsg: Message = {
          id: aiMsgId,
          sender: 'ai',
          text: '',
          timestamp: new Date(),
          providerUsed: data.providerUsed,
          note: data.note
        };

        const currentMessages = [...updatedMessages, aiMsg];
        setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, messages: currentMessages } : s));

        // Rapid progressive text stream simulator
        let textIndex = 0;
        const words = rawResponse.split(' ');
        
        const typeTimer = setInterval(() => {
          if (textIndex < words.length) {
            currentTypedText += (textIndex > 0 ? ' ' : '') + words[textIndex];
            textIndex++;
            
            setSessions(prev => prev.map(s => s.id === activeSession.id ? {
              ...s,
              messages: s.messages.map(m => m.id === aiMsgId ? { ...m, text: currentTypedText } : m)
            } : s));
          } else {
            clearInterval(typeTimer);
            setIsLoading(false);
            
            // Append final suggestions
            setSessions(prev => prev.map(s => s.id === activeSession.id ? {
              ...s,
              messages: s.messages.map(m => m.id === aiMsgId ? {
                ...m,
                suggestions: [
                  'How can I improve accuracy?',
                  'Analyze my training dataset',
                  'Explain Overfitting vs Underfitting'
                ]
              } : m)
            } : s));
          }
        }, 35); // word speed simulation

      } else {
        throw new Error(data.error || 'Invalid API data payload');
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('Generation aborted by user.');
        return;
      }
      
      console.warn('Error fetching server AI endpoint, falling back to local AutoML heuristic models:', err);
      
      const fallbackText = getOfflineAIResponse(textToSend);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date(),
        suggestions: ['Analyze dataset health', 'Optimize parameters'],
        providerUsed: 'local-copilot'
      };
      
      setSessions(prev => prev.map(s => s.id === activeSession.id ? { 
        ...s, 
        messages: [...updatedMessages, aiMsg] 
      } : s));
      setIsLoading(false);
    }
  };

  const handleRegenerateLast = () => {
    // find the last user message and resend it
    const lastUserMsg = [...activeSession.messages].reverse().find(m => m.sender === 'user');
    if (lastUserMsg) {
      // Remove last AI message first
      const cleaned = [...activeSession.messages];
      if (cleaned[cleaned.length - 1].sender === 'ai') {
        cleaned.pop();
      }
      setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, messages: cleaned } : s));
      handleSend(lastUserMsg.text);
    }
  };

  // Filtering based on search query
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedSessions = filteredSessions.filter(s => s.isPinned);
  const regularSessions = filteredSessions.filter(s => !s.isPinned);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="ai-assistant-root">
      
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/20 cursor-pointer border border-white/10 relative"
        id="btn-trigger-ai"
      >
        <Bot className="w-5 h-5" />
        <span className="text-sm font-semibold tracking-wide">AI Assistant</span>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute right-3 top-3" />
      </motion.button>

      {/* Immersive Expandable Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`absolute bottom-16 right-0 rounded-3xl shadow-2xl flex overflow-hidden border border-slate-200/50 dark:border-slate-850/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl transition-all duration-300 h-[620px] ${showSidebar ? 'w-[680px]' : 'w-[440px]'}`}
            id="ai-assistant-drawer"
          >
            {/* Sidebar for multiple chats (Toggleable) */}
            {showSidebar && (
              <div className="w-[240px] border-r border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col h-full" id="session-sidebar">
                {/* Search Bar */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-850 space-y-2">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1 text-[11px] focus:outline-none"
                    />
                  </div>
                  
                  <button
                    onClick={handleNewChat}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Session
                  </button>
                </div>

                {/* Sessions list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-3.5">
                  
                  {/* Pinned Section */}
                  {pinnedSessions.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase px-2">Pinned</span>
                      {pinnedSessions.map(s => (
                        <div
                          key={s.id}
                          onClick={() => setActiveSessionId(s.id)}
                          className={`group p-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${s.id === activeSessionId ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-100/50'}`}
                        >
                          <span className="truncate max-w-[130px]">{s.title}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => handlePinSession(s.id, e)} className="p-0.5 text-slate-400 hover:text-blue-500">
                              <PinOff className="w-3 h-3" />
                            </button>
                            <button onClick={(e) => handleDeleteSession(s.id, e)} className="p-0.5 text-slate-400 hover:text-red-500">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Regular chats */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase px-2">Conversations</span>
                    {regularSessions.map(s => (
                      <div
                        key={s.id}
                        onClick={() => setActiveSessionId(s.id)}
                        className={`group p-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${s.id === activeSessionId ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-100/50'}`}
                      >
                        <span className="truncate max-w-[130px]">{s.title}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => handlePinSession(s.id, e)} className="p-0.5 text-slate-400 hover:text-blue-500">
                            <Pin className="w-3 h-3" />
                          </button>
                          <button onClick={(e) => handleDeleteSession(s.id, e)} className="p-0.5 text-slate-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            )}

            {/* Main Chat Interface Panel */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between" id="ai-chat-header">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"
                    title="Toggle conversations history"
                  >
                    <Menu className="w-4.5 h-4.5" />
                  </button>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      AutoML Suite Assistant
                    </h3>
                    <p className="text-[10px] text-white/80">
                      Active: {activeSession.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Provider Dropdown Select */}
                  <select
                    value={activeProvider}
                    onChange={(e) => setActiveProvider(e.target.value)}
                    className="bg-white/10 border border-white/20 text-white text-[10px] font-bold rounded-lg p-1 focus:outline-none cursor-pointer"
                  >
                    {PROVIDERS.map(p => (
                      <option key={p.id} value={p.id} className="text-slate-900 font-semibold">{p.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    id="btn-close-ai"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Viewport messages list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 shadow-inner" id="ai-chat-body">
                {activeSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed relative group/msg ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-850'
                      }`}
                    >
                      {/* Read aloud & control triggers */}
                      {msg.sender === 'ai' && (
                        <div className="absolute right-2 top-2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-1 bg-white/85 dark:bg-slate-900/85 p-0.5 rounded-lg border border-slate-200/40">
                          <button
                            onClick={() => handleTextToSpeech(msg.text)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded text-slate-500"
                            title="Speak response out loud"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Display attached file badge if present */}
                      {msg.fileAttached && (
                        <div className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-white/5 flex items-center gap-2 border border-black/10 text-xs">
                          {msg.fileAttached.type.startsWith('image/') ? (
                            <img src={msg.fileAttached.data} alt="uploaded preview" className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <File className="w-5 h-5 text-indigo-500" />
                          )}
                          <div className="truncate max-w-[150px]">
                            <p className="font-bold truncate text-[10px]">{msg.fileAttached.name}</p>
                            <p className="text-[9px] text-slate-400">Attached asset</p>
                          </div>
                        </div>
                      )}

                      {/* Content parsing */}
                      {msg.text.split('\n').map((paragraph, index) => {
                        const formatted = paragraph
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-red-500 dark:text-red-400">$1</code>');
                        return (
                          <p
                            key={index}
                            className={index > 0 ? 'mt-1.5' : ''}
                            dangerouslySetInnerHTML={{ __html: formatted }}
                          />
                        );
                      })}
                    </div>

                    {/* Meta indicator footer under bubble */}
                    <div className="flex items-center gap-2 mt-1 px-1 text-[9px] text-slate-400">
                      <span>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.providerUsed && (
                        <span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-950 text-blue-500 font-bold uppercase rounded text-[8px]">
                          {msg.providerUsed}
                        </span>
                      )}
                      {msg.note && (
                        <span className="text-amber-500 font-semibold italic">{msg.note}</span>
                      )}
                    </div>

                    {/* Suggestions list */}
                    {msg.sender === 'ai' && msg.suggestions && msg.suggestions.length > 0 && !isLoading && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                        {msg.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(sug)}
                            className="text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200/40 dark:border-slate-800 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full cursor-pointer font-medium"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-500 animate-bounce" />
                      <span>{activeProvider.toUpperCase()} is writing...</span>
                    </div>
                    <button
                      onClick={handleStopGeneration}
                      className="px-2 py-1 text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950 border border-red-200 rounded flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Square className="w-2.5 h-2.5" />
                      Stop
                    </button>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Grounding & Thinking controls */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-150 dark:border-slate-850 flex gap-4 items-center justify-between text-[11px] font-semibold text-slate-500">
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={useGrounding}
                    onChange={(e) => {
                      setUseGrounding(e.target.checked);
                      if (e.target.checked) setUseThinking(false);
                    }}
                    className="rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Search Grounding</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={useThinking}
                    onChange={(e) => {
                      setUseThinking(e.target.checked);
                      if (e.target.checked) setUseGrounding(false);
                    }}
                    className="rounded border-slate-300 dark:border-slate-800 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Reasoning Mode</span>
                </label>

                <button
                  onClick={handleRegenerateLast}
                  disabled={activeSession.messages.length < 2 || isLoading}
                  className="flex items-center gap-1 hover:text-slate-900 text-[10px] font-bold uppercase disabled:opacity-45 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </div>

              {/* File Attachment Status Bar */}
              {pendingFile && (
                <div className="px-4 py-2 bg-indigo-500/10 border-t border-indigo-500/20 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <Paperclip className="w-3.5 h-3.5 animate-bounce" />
                    <span className="truncate font-semibold">{pendingFile.name} ready</span>
                  </div>
                  <button onClick={() => setPendingFile(null)} className="text-red-500 hover:font-bold">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input Form Area */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-850 flex gap-2 bg-white/90 dark:bg-slate-900/95">
                
                {/* File Attachment Input (PDF, docx, CSV, Excel, Image, ZIP) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.zip,audio/*,video/*"
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 cursor-pointer"
                  title="Attach asset (PDF, CSV, audio, image, zip...)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Speech to text recognition */}
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`p-2.5 border rounded-xl cursor-pointer ${isListening ? 'bg-red-50 border-red-500 text-red-500 animate-pulse' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500'}`}
                  title="Dictate message using microphone"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Main Text Input Field */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                  placeholder="Ask about data quality, learning weights..."
                  className="flex-1 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 disabled:opacity-55"
                />

                <button
                  onClick={() => handleSend(input)}
                  disabled={(!input.trim() && !pendingFile) || isLoading}
                  className="p-2.5 bg-blue-600 disabled:opacity-40 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center"
                  id="btn-send-ai"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
