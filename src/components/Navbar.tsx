/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Brain, Sun, Moon, LogOut, Settings, User, BarChart } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'auth' | 'dashboard' | 'workspace' | 'settings' | 'profile' | 'lens';
  userName: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onNavigate: (view: 'dashboard' | 'settings' | 'profile' | 'landing' | 'lens') => void;
  onLogout: () => void;
}

export default function Navbar({
  currentView,
  userName,
  isDarkMode,
  onToggleTheme,
  onNavigate,
  onLogout
}: NavbarProps) {
  if (currentView === 'landing') return null; // Clean viewport for landing page

  return (
    <header className="sticky top-0 z-40 w-full frosted-nav font-sans transition-all" id="app-navbar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6" id="navbar-container">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
          id="brand-logo-nav"
        >
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-md group-hover:scale-105 transition-transform">
            <Brain className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Teachable<span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent ml-1">Machine</span>
          </span>
        </div>

        {/* Navigation Middle */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400" id="main-navigation">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${currentView === 'dashboard' || currentView === 'workspace' ? 'text-blue-500 font-bold' : ''}`}
            id="nav-link-dashboard"
          >
            Studio Dashboard
          </button>

          <button
            onClick={() => onNavigate('lens')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${currentView === 'lens' ? 'text-blue-500 font-bold' : ''}`}
            id="nav-link-lens"
          >
            AI Lens Engine
          </button>
          
          <button
            onClick={() => onNavigate('profile')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${currentView === 'profile' ? 'text-blue-500 font-bold' : ''}`}
            id="nav-link-profile"
          >
            My Models & Profile
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${currentView === 'settings' ? 'text-blue-500 font-bold' : ''}`}
            id="nav-link-settings"
          >
            Hardware Diagnostics
          </button>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-4" id="right-controls-nav">
          
          {/* Light/Dark Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer text-slate-500 dark:text-slate-400"
            title={isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode'}
            id="btn-toggle-theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Quick profile / sign out */}
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-850 pl-4" id="user-profile-menu">
            <button
              onClick={() => onNavigate('profile')}
              className="hidden sm:flex items-center gap-2 hover:opacity-80 cursor-pointer"
              id="btn-nav-profile-trigger"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold flex items-center justify-center">
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{userName}</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2.5 text-slate-400 hover:text-rose-500 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
              id="btn-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
