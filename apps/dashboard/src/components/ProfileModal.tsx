import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  Send,
  Sparkles,
  Check,
} from 'lucide-react';
import { getApiBaseUrl } from '../lib/api-config';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    status?: string;
    telegramUsername?: string;
    organizationName?: string;
    teamCode?: string;
  } | null;
  onUpdateUser?: (updated: any) => void;
  initialTab?: 'info' | 'password';
  lang?: 'my' | 'en';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  initialTab = 'info',
  lang = 'my',
}) => {
  const isMy = lang === 'my';
  const [activeTab, setActiveTab] = useState<'info' | 'password'>(initialTab);

  // Profile Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email] = useState(currentUser?.email || '');
  const [status, setStatus] = useState<'ONLINE' | 'BUSY' | 'OFFLINE'>(
    (currentUser?.status as any) || 'ONLINE'
  );
  const [telegramUsername, setTelegramUsername] = useState(
    currentUser?.telegramUsername || ''
  );
  const [infoSuccess, setInfoSuccess] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentUser,
      name,
      phone,
      status,
      telegramUsername,
    };
    try {
      localStorage.setItem('chatechat_agent_session', JSON.stringify(updated));
    } catch {}
    onUpdateUser?.(updated);
    setInfoSuccess(
      isMy
        ? '✓ ကိုယ်ရေးအချက်အလက်များ အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ'
        : '✓ Profile updated successfully'
    );
    setTimeout(() => setInfoSuccess(null), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword.length < 6) {
      setPwdError(
        isMy
          ? 'စကားဝှက် အသစ်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်'
          : 'New password must be at least 6 characters'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError(
        isMy
          ? 'စကားဝှက် အသစ် ၂ ကြိမ် ရိုက်ထည့်ချက် မကိုက်ညီပါ'
          : 'New passwords do not match'
      );
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          identifier: currentUser?.email || currentUser?.name,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (isMy ? 'စကားဝှက် ပြောင်းလဲခြင်း မအောင်မြင်ပါ' : 'Failed to change password'));
      }

      setPwdSuccess(
        isMy
          ? '✓ စကားဝှက်အား အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ'
          : '✓ Password changed successfully'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.message || 'Error changing password');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isMy ? 'မိမိ Profile နှင့် လုံခြုံရေး' : 'My Profile & Security'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {currentUser?.email || 'user@chatechat.com'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-800/60 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User size={14} />
            <span>{isMy ? 'ကိုယ်ရေးအချက်အလက်' : 'Profile Details'}</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound size={14} />
            <span>{isMy ? 'စကားဝှက် ပြောင်းမည်' : 'Change Password'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] text-xs space-y-4">
          
          {/* TAB 1: Profile Details */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              {infoSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  <span>{infoSuccess}</span>
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  {isMy ? 'လက်ရှိ တာဝန်ထမ်းဆောင်မှု အခြေအနေ' : 'Active Status'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('ONLINE')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      status === 'ONLINE'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                    <span>{isMy ? 'Online (လက်ခံမည်)' : 'Online'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('BUSY')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      status === 'BUSY'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                    <span>{isMy ? 'Busy (အလုပ်ရှုပ်)' : 'Busy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('OFFLINE')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      status === 'OFFLINE'
                        ? 'bg-slate-700 border-slate-600 text-white font-bold'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span>
                    <span>{isMy ? 'Offline (နားမည်)' : 'Offline'}</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {isMy ? 'မိမိ အမည် (Display Name)' : 'Display Name'}
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {isMy ? 'ဆက်သွယ်ရန် ဖုန်းနံပါတ်' : 'Phone Number'}
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Telegram Username */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {isMy ? 'Telegram Account Username (OTP / 2FA ရယူရန်)' : 'Telegram Username (for OTP / 2FA)'}
                </label>
                <div className="relative">
                  <Send size={15} className="absolute left-3 top-3 text-cyan-400" />
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="@username"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isMy
                    ? 'စကားဝှက်မေ့ပါက Telegram Bot မှတစ်ဆင့် လျှို့ဝှက်နံပါတ် OTP ဖြင့် ပြန်လည်ရယူနိုင်ပါသည်'
                    : 'Used to receive secure OTP reset codes directly via Telegram bot'}
                </p>
              </div>

              {/* Role & Org */}
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {isMy ? 'တာဝန်ကျ အဆင့်' : 'Role'}
                  </span>
                  <p className="text-white font-bold">{currentUser?.role || 'AGENT'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {isMy ? 'အဖွဲ့ကုဒ်' : 'Team Code'}
                  </span>
                  <p className="font-mono text-cyan-400 font-bold">{currentUser?.teamCode || 'SOLO'}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition"
                >
                  <Check size={16} />
                  <span>{isMy ? 'အချက်အလက် သိမ်းဆည်းမည်' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <p className="text-slate-400 text-[11.5px]">
                {isMy
                  ? 'မိမိအကောင့် လုံခြုံရေးအတွက် လက်ရှိ စကားဝှက်နှင့် စကားဝှက် အသစ်ကို ဖြည့်သွင်း၍ ပြောင်းလဲနိုင်ပါသည်'
                  : 'Enter your current password and choose a new secure password'}
              </p>

              {pwdError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {isMy ? 'လက်ရှိ စကားဝှက် (Current Password)' : 'Current Password'}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {isMy ? 'စကားဝှက် အသစ် (New Password - အနည်းဆုံး ၆ လုံး)' : 'New Password (min 6 chars)'}
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {isMy ? 'စကားဝှက် အသစ် အတည်ပြုပါ (Confirm New Password)' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                >
                  <Lock size={15} />
                  <span>
                    {pwdLoading
                      ? isMy
                        ? 'ပြောင်းလဲနေပါသည်...'
                        : 'Updating...'
                      : isMy
                      ? 'စကားဝှက် အသစ် အတည်ပြုမည်'
                      : 'Update Password'}
                  </span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
