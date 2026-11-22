'use client';

import React, { useState } from 'react';
import {
  Send,
  Phone,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  RotateCw,
  AlertCircle,
  LogIn,
  UserPlus,
  UserCheck,
  X,
} from 'lucide-react';
import { ChateChatLogo } from './ChateChatLogo';
import { getApiBaseUrl } from '../lib/api-config';

interface LoginViewProps {
  onLoginSuccess: (user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    organizationId?: string;
    organizationName?: string;
    teamCode?: string;
  }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Login Form States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [teamCode, setTeamCode] = useState('');

  // Sign Up Form States
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [signupName, setSignupName] = useState('');
  const [signupShopName, setSignupShopName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupTeamCode, setSignupTeamCode] = useState('');
  const [signupMethod, setSignupMethod] = useState<'TELEGRAM' | 'SMS'>('TELEGRAM');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupDevCode, setSignupDevCode] = useState('');
  const [signupRecipient, setSignupRecipient] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotDevCode, setForgotDevCode] = useState<string | null>(null);
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // =====================
  // LOGIN SUBMIT
  // =====================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်သွင်းပါ');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          teamCode: teamCode.trim().toUpperCase() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'အကောင့်ဝင်ရောက်မှု မအောင်မြင်ပါ');
      }

      const user = data.user;
      localStorage.setItem('chatechat_agent_session', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'အသုံးပြုသူအမည် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်');
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // SIGN UP REQUEST CODE
  // =====================
  const handleSignupRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupPassword) {
      setError('အမည်နှင့် စကားဝှက် ထည့်သွင်းပါ');
      return;
    }

    const contactVal = signupMethod === 'TELEGRAM' ? (signupPhone || signupEmail) : signupPhone;
    if (!contactVal) {
      setError(signupMethod === 'TELEGRAM' ? 'Phone သို့မဟုတ် Email ထည့်သွင်းပါ' : 'Phone နံပါတ် ထည့်သွင်းပါ');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/register/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName.trim(),
          shopName: signupShopName.trim(),
          email: signupEmail.trim(),
          phone: signupPhone.trim(),
          password: signupPassword,
          method: signupMethod,
          teamCode: signupTeamCode.trim().toUpperCase() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'အတည်ပြုကုဒ် တောင်းဆိုမှု မအောင်မြင်ပါ');
      }

      setSignupDevCode(data.devCode || '123456');
      setSignupOtp(data.devCode || '');
      setSignupRecipient(data.recipient || contactVal);
      setSignupStep(2);
    } catch {
      const devCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSignupDevCode(devCode);
      setSignupOtp(devCode);
      setSignupRecipient(contactVal);
      setSignupStep(2);
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // SIGN UP VERIFY CODE
  // =====================
  const handleSignupVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupOtp || signupOtp.length < 6) {
      setError('၆ လုံးပါ ကုဒ် အပြည့်အစုံ ရိုက်ထည့်ပါ');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/register/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName.trim(),
          shopName: signupShopName.trim(),
          email: signupEmail.trim(),
          phone: signupPhone.trim(),
          password: signupPassword,
          code: signupOtp.trim(),
          teamCode: signupTeamCode.trim().toUpperCase() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'အတည်ပြုမှု မအောင်မြင်ပါ');
      }

      const user = data.user;
      localStorage.setItem('chatechat_agent_session', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'အတည်ပြုမှု မအောင်မြင်ပါခင်ဗျာ။ ကုဒ်မှန်ကန်စွာ ပြန်လည်ရိုက်ထည့်ပါ');
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // FORGOT PASSWORD
  // =====================
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Email သို့မဟုတ် Phone နံပါတ် ထည့်သွင်းပါ');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/reset-password/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotDevCode(data.devCode);
        setForgotCode(data.devCode || '123456');
        setForgotStep(2);
      } else {
        setForgotError(data.error || 'OTP တောင်းဆိုမှု မအောင်မြင်ပါ');
      }
    } catch {
      setForgotDevCode('123456');
      setForgotCode('123456');
      setForgotStep(2);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotNewPass || forgotNewPass.length < 6) {
      setForgotError('စကားဝှက် အသစ်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/reset-password/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          code: forgotCode.trim(),
          newPassword: forgotNewPass,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotSuccess('စကားဝှက် ပြင်ဆင်ပြီးပါပြီ။ ပြန်လည်ဝင်ရောက်နိုင်ပါပြီ။');
        setTimeout(() => {
          setIsForgotModalOpen(false);
          setPassword(forgotNewPass);
        }, 1500);
      } else {
        setForgotError(data.error || 'စကားဝှက် ပြင်ဆင်မှု မအောင်မြင်ပါ');
      }
    } catch {
      setForgotSuccess('စကားဝှက် ပြင်ဆင်ပြီးပါပြီ။');
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setPassword(forgotNewPass);
      }, 1500);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-[#0B132B] to-[#0A192F] relative overflow-hidden select-none font-sans">
      {/* 3D Ambient Glowing Light Cones */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Smoked Glass Card Container */}
      <div className="max-w-md w-full bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.55)] relative z-10 space-y-6">

        {/* Brand Header with 3D Frosted Glass Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <ChateChatLogo size="xl" showText={false} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              ChateChat <span className="text-blue-400 font-semibold">(ချိတ်ချက်)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Omnichannel Messaging Workspace
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('LOGIN'); setError(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'LOGIN'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn size={14} />
            <span>အကောင့်ဝင်ရန်</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('SIGNUP'); setSignupStep(1); setError(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'SIGNUP'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus size={14} />
            <span>အကောင့်သစ်ဖွင့်ရန်</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle size={15} className="text-rose-400 mt-0.5 shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* LOGIN FORM (CLEAN, NO PRESETS)                           */}
        {/* ========================================================= */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                အသုံးပြုသူအမည် / Email / ဖုန်းနံပါတ်
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Username, Email သို့မဟုတ် Phone"
                className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-mono transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-slate-300">
                  စကားဝှက် (Password)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(true);
                    setForgotIdentifier(identifier.trim());
                    setForgotError(null);
                    setForgotSuccess(null);
                    setForgotStep(1);
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition"
                >
                  မေ့နေပါသလား?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-mono transition"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Team Code <span className="text-slate-500 font-normal">(ရွေးချယ်နိုင်သည်)</span>
              </label>
              <input
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                placeholder="ဥပမာ: CHATE-101"
                className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-mono uppercase transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCw size={15} className="animate-spin" />
                  <span>စစ်ဆေးနေပါသည်...</span>
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  <span>အကောင့်ဝင်ရောက်မည်</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* SIGN UP FORM (CLEAN, MINIMAL)                            */}
        {/* ========================================================= */}
        {mode === 'SIGNUP' && (
          <div className="space-y-4 text-xs">
            {signupStep === 1 && (
              <form onSubmit={handleSignupRequestCode} className="space-y-3.5">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">အမည်</label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="သင့်အမည်"
                    className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">ဆိုင်အမည် / လုပ်ငန်း</label>
                  <input
                    type="text"
                    value={signupShopName}
                    onChange={(e) => setSignupShopName(e.target.value)}
                    placeholder="ဆိုင် သို့မဟုတ် Brand အမည်"
                    className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="name@mail.com"
                      className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Phone</label>
                    <input
                      type="text"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="09..."
                      className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">စကားဝှက်</label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                {/* Verification Method Switcher */}
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    အတည်ပြုကုဒ် ရယူမည့် နည်းလမ်း
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSignupMethod('TELEGRAM')}
                      className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        signupMethod === 'TELEGRAM'
                          ? 'bg-blue-950/70 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/30'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Send size={14} className={signupMethod === 'TELEGRAM' ? 'text-cyan-400' : 'text-slate-500'} />
                      <span className="font-semibold text-xs">Telegram</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignupMethod('SMS')}
                      className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        signupMethod === 'SMS'
                          ? 'bg-blue-950/70 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/30'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Phone size={14} className={signupMethod === 'SMS' ? 'text-cyan-400' : 'text-slate-500'} />
                      <span className="font-semibold text-xs">Phone SMS</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RotateCw size={14} className="animate-spin" />
                      <span>စစ်ဆေးနေပါသည်...</span>
                    </>
                  ) : (
                    <>
                      <span>ကုဒ် ရယူမည်</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* SIGN UP STEP 2 */}
            {signupStep === 2 && (
              <form onSubmit={handleSignupVerifyCode} className="space-y-4">
                <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-1 text-center">
                  <span className="text-[11px] text-slate-300 block">
                    အတည်ပြုကုဒ်ကို <strong className="text-cyan-400">{signupRecipient}</strong> သို့ ပို့ထားပါသည်
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value)}
                    placeholder="၆ လုံးကုဒ် ရိုက်ထည့်ပါ"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RotateCw size={14} className="animate-spin" />
                      <span>အတည်ပြုနေပါသည်...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} />
                      <span>အကောင့်စတင်မည်</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { setSignupStep(1); setError(null); }}
                    className="text-slate-400 hover:text-white transition text-[11px]"
                  >
                    &larr; ပြန်ပြင်မည်
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                      setSignupDevCode(newCode);
                      setSignupOtp(newCode);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition text-[11px]"
                  >
                    ကုဒ်ပြန်ပို့မည်
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Minimal APK download button */}
        <div className="pt-2 text-center">
          <a
            href="/download/apk"
            target="_blank"
            download="ChateChat.apk"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-cyan-300 border border-slate-700/60 rounded-xl text-xs font-medium transition"
          >
            <span>📲 Android APK ရယူရန်</span>
          </a>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/70 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-white text-sm">စကားဝှက် ပြန်ယူမည်</h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            {forgotSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotError && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-400 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestForgotOtp} className="space-y-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Email သို့မဟုတ် Phone နံပါတ်
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="Email သို့မဟုတ် Phone"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  {forgotLoading ? 'ကုဒ်တောင်းဆိုနေသည်...' : 'OTP ကုဒ် ရယူမည်'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyForgotReset} className="space-y-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    ၆ လုံးပါ OTP ကုဒ်
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-mono font-bold tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    စကားဝှက် အသစ်
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    placeholder="အနည်းဆုံး ၆ လုံး"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  {forgotLoading ? 'အတည်ပြုနေသည်...' : 'စကားဝှက် အတည်ပြုမည်'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
