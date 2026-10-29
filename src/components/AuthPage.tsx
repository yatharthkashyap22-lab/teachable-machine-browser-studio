/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Brain, Mail, Lock, User, Check, ArrowLeft, Shield } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/firebase';

interface AuthPageProps {
  onLoginSuccess: (email: string, name: string) => void;
  onBack: () => void;
}

export default function AuthPage({ onLoginSuccess, onBack }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const user = await signInWithEmail(email, password);
        setLoading(false);
        onLoginSuccess(user.email || email, user.displayName || email.split('@')[0]);
      } else {
        const user = await signUpWithEmail(email, password, name);
        setLoading(false);
        onLoginSuccess(user.email || email, name || user.displayName || email.split('@')[0]);
      }
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      setLoading(false);
      onLoginSuccess(user.email || 'user@gmail.com', user.displayName || 'Google User');
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'Google authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 relative font-sans" id="auth-page-root">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl -z-10" />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md shadow-2xl p-8 relative frosted-glass rounded-3xl"
        id="auth-card"
      >
        <button
          onClick={onBack}
          className="absolute top-6 left-6 p-2 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 cursor-pointer"
          id="btn-auth-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center mt-4 mb-8 text-center">
          <div className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-md mb-4 shadow-blue-500/20">
            <Brain className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-slate-500 mt-1.5">
            {isLogin ? 'Log in to sync your machine learning projects' : 'Start saving datasets and models in cloud runtimes'}
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl mb-6 border border-slate-200/40 dark:border-slate-850" id="auth-tabs">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${isLogin ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}
            id="tab-login"
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${!isLogin ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}
            id="tab-signup"
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 text-xs text-rose-500 font-medium flex items-center gap-2" id="auth-error-banner">
            <Shield className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Steve Jobs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                  id="input-name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="email"
                placeholder="steve@apple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                id="input-email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                id="input-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold rounded-xl shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-150 cursor-pointer text-sm flex items-center justify-center gap-2"
            id="btn-auth-submit"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6 text-xs text-slate-400 font-medium" id="auth-divider">
          <div className="h-[1px] bg-slate-200 dark:bg-slate-800 w-full" />
          <span>OR CONTINUE WITH</span>
          <div className="h-[1px] bg-slate-200 dark:bg-slate-800 w-full" />
        </div>

        {/* Google OAuth Option */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 bg-white border border-slate-200/80 dark:bg-slate-950 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors duration-150 flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
          id="btn-google-auth"
        >
          {/* Simple Google SVG Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google Authentication
        </button>

        <p className="mt-6 text-center text-xs text-slate-400">
          By continuing, you agree to Teachable Machine's local privacy guidelines.
        </p>
      </motion.div>
    </div>
  );
}
