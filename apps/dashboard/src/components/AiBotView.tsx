import React, { useState } from 'react';
import { Bot, Zap, Save, Play, UserCheck, Shield, Sparkles } from 'lucide-react';
import { getApiBaseUrl } from '../lib/api-config';

interface AiBotViewProps {
  lang: 'my' | 'en';
}

export const AiBotView: React.FC<AiBotViewProps> = ({ lang }) => {
  const isMy = lang === 'my';
  const [isEnabled, setIsEnabled] = useState(true);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.2);
  const [systemPrompt, setSystemPrompt] = useState(
    'သင်သည် မြန်မာအွန်လိုင်းဆိုင်၏ ဖော်ရွေသော AI အရောင်းလက်ထောက်ဖြစ်သည်။ ဝယ်သူမေးမြန်းသော ပစ္စည်းဈေးနှုန်း၊ ပို့ဆောင်ခနှင့် ငွေလွှဲအချက်အလက်များကို ယဉ်ကျေးသိမ်မွေ့စွာ ဖြေကြားပေးပါ။'
  );

  const [kpayNumber, setKpayNumber] = useState('09987654321 (ဒေါ်စုစုဝင်း)');
  const [waveNumber, setWaveNumber] = useState('09987654321 (ဒေါ်စုစုဝင်း)');
  const [ayaNumber, setAyaNumber] = useState('09987654321 (ဒေါ်စုစုဝင်း)');
  const [ygnDeli, setYgnDeli] = useState('၂၅၀၀ ကျပ် (၁-၂ ရက်အတွင်း အိမ်ရောက်ငွေချေ COD ရရှိပါသည်)');
  const [mdyDeli, setMdyDeli] = useState('၃၅၀၀ ကျပ် (ကားဂိတ်ချောပို့ဖြင့် ပို့ဆောင်ပေးပါသည်)');

  const [keywords, setKeywords] = useState<string[]>([
    'လူနဲ့ပြောချင်တယ်',
    'လူနဲ့',
    'အေးဂျင့်',
    'အက်မင်',
    'agent',
    'human',
    'အော်ဒါတင်ချင်တယ်',
    'စလစ်',
    'လွှဲပြီးပါပြီ',
  ]);

  const [newKeyword, setNewKeyword] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testIntent, setTestIntent] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleRunTest = async () => {
    if (!testInput.trim()) return;
    setIsTesting(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/ai/test-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: testInput,
          kpay: kpayNumber,
          wave: waveNumber,
          aya: ayaNumber,
          ygnDeli,
          mdyDeli,
          systemPrompt,
        }),
      });
      const data = await res.json();
      setTestOutput(data.reply);
      setTestIntent(data.detectedIntent);
    } catch {
      // Local fallback simulation if server route is testing
      if (testInput.includes('လူ') || testInput.includes('agent')) {
        setTestOutput('ဟုတ်ကဲ့ပါခင်ဗျာ။ လူကြီးမင်းအား အသေးစိတ် ကူညီဆောင်ရွက်ပေးနိုင်ရန် တာဝန်ကျ အရောင်းကိုယ်စားလှယ် (Agent) ထံသို့ ချက်ချင်း လွှဲပြောင်းပေးလိုက်ပါပြီခင်ဗျာ။ 🙏');
        setTestIntent('HUMAN_HANDOVER');
      } else if (testInput.toLowerCase().includes('aya') || testInput.toLowerCase().includes('ayapay')) {
        setTestOutput(`ဟုတ်ကဲ့ပါခင်ဗျာ! AYA Pay ဖြင့်လည်း အဆင်ပြေစွာ ငွေလွှဲရှင်းနိုင်ပါသည်ခင်ဗျာ။ AYA Pay အကောင့်နံပါတ်မှာ ${ayaNumber} ဖြစ်ပါသည်ခင်ဗျာ။ လူကြီးမင်း မှာယူလိုသည့် အထည်အတွက် အမည်နှင့် ဖုန်းနံပါတ်လေး ပြောပြပေးပါခင်ဗျာ။ 🙏`);
        setTestIntent('PAYMENT_FAQ (AYAPAY)');
      } else if (
        testInput.includes('kpay') ||
        testInput.includes('wave') ||
        testInput.includes('ငွေ') ||
        testInput.includes('ရှင်းလို့')
      ) {
        setTestOutput(`ဟုတ်ကဲ့ပါခင်ဗျာ။ KBZPay အကောင့် ${kpayNumber} သို့မဟုတ် WavePay ${waveNumber} သို့ လွှဲပေးပို့နိုင်ပါသည်။ လွှဲပြီးပါက ပြေစာ screenshot လေး ပို့ပေးပါခင်ဗျာ။ 🙏`);
        setTestIntent('PAYMENT_FAQ (KPAY)');
      } else if (
        testInput.includes('ဖုန်းနံပါတ်') ||
        testInput.toLowerCase().includes('share my phone') ||
        testInput.toLowerCase().includes('share contact') ||
        testInput.toLowerCase().includes('shared contact') ||
        /(?:\+?959|09)[0-9]{7,9}/.test(testInput.replace(/[\s-]/g, ''))
      ) {
        setTestOutput('ဟုတ်ကဲ့ပါခင်ဗျာ! ဆက်သွယ်ရမည့် ဖုန်းနံပါတ်ကို စနစ်တွင် အောင်မြင်စွာ မှတ်သားထားရှိပြီးဖြစ်ပါသည်ခင်ဗျာ။ အော်ဒါပို့ဆောင်ပေးရမည့် မြို့နယ်နှင့် လိပ်စာအပြည့်အစုံလေးကိုလည်း ဆက်လက်ပေးပို့ပေးပါခင်ဗျာ။ 🙏');
        setTestIntent('CONTACT_SHARE');
      } else if (testInput.includes('အမဲ') || testInput.includes('အရောင်') || testInput.includes('အဖြူ') || testInput.includes('size')) {
        setTestOutput('ဟုတ်ကဲ့ မင်္ဂလာပါခင်ဗျာ! အမဲရောင်ရော အဖြူရောင်ပါ stock အသင့်ရှိပါသေးသည်ခင်ဗျာ။ လူကြီးမင်း မှာယူလိုသည့် size လေးနှင့် ဆက်သွယ်ရမည့် အမည်/ဖုန်းနံပါတ်လေး ပြောပြပေးပါခင်ဗျာ။ 😊');
        setTestIntent('PRODUCT_STOCK_FAQ');
      } else if (
        testInput.includes('ဘယ်လောက်ကြာ') ||
        testInput.includes('ကြာမလဲ') ||
        testInput.includes('ကြာချိန်') ||
        testInput.includes('ပို့ခ') ||
        testInput.includes('ပို့ဆောင်ခ') ||
        testInput.includes('ပို့ဆောင်ချိန်') ||
        testInput.includes('deli') ||
        testInput.includes('ကြာ')
      ) {
        setTestOutput(`ဟုတ်ကဲ့ပါခင်ဗျာ။ ပို့ဆောင်ချိန်မှာ ${ygnDeli} ဖြစ်ပါသည်ခင်ဗျာ။ အော်ဒါအတည်ပြုနိုင်ရန် ဝယ်ယူမည့်သူ အမည်လေး ပြောပြပေးပါခင်ဗျာ။ 🚚`);
        setTestIntent('DELIVERY_DURATION_FAQ');
      } else if (
        testInput.includes('ဘာပြော') ||
        testInput.includes('ဘာလဲ') ||
        testInput.includes('မရှင်းဘူး') ||
        testInput.includes('မရှင်းပါ') ||
        testInput.includes('နားမလည်') ||
        testInput.trim() === 'ဘာလဲဟ' ||
        testInput.trim() === 'ရှင်' ||
        testInput.trim() === 'ရှင်?'
      ) {
        setTestOutput('ဟုတ်ကဲ့ လူကြီးမင်း မေးမြန်းလိုသည်များကို သေချာစွာ ရှင်းပြပေးပါမည်ခင်ဗျာ။ ကျွန်တော်တို့ဆိုင်တွင် အဝတ်အထည်နှင့် ဖိနပ်များ ရောင်းချပေးနေပြီး ဈေးနှုန်း၊ ပို့ဆောင်ခနှင့် ငွေလွှဲအချက်အလက်များကို မေးမြန်းနိုင်ပါသည်ခင်ဗျာ။ 😊');
        setTestIntent('CLARIFICATION');
      } else {
        setTestOutput(`ဟုတ်ကဲ့ မင်္ဂလာပါခင်ဗျာ။ လူကြီးမင်း မေးမြန်းလိုသည်များကို အသေးစိတ် ဖြေကြားပေးရန် အသင့်ရှိပါသည်ခင်ဗျာ။`);
        setTestIntent('GENERAL_INQUIRY');
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isMy ? 'Gemini AI မြန်မာဘာသာ အရောင်းလက်ထောက် စီမံခန့်ခွဲမှု' : 'Gemini AI Burmese Sales Assistant'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isMy
                  ? 'Google Gemini API ဖြင့် မြန်မာ e-Commerce မေးခွန်းများကို အလိုအလျောက် ဖြေကြားပေးပြီး လူထံ စာလွှဲပေးသောစနစ်'
                  : 'Automated 24/7 Burmese sales responder with smart intent detection and human handover'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">
              {isEnabled ? (isMy ? 'AI ဖွင့်ထားသည်' : 'AI Active') : isMy ? 'AI ပိတ်ထားသည်' : 'AI Disabled'}
            </span>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                isEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Config & Knowledge Base (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* System Prompt & Persona */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600" />
                <span>{isMy ? 'AI စရိုက်လက္ခဏာနှင့် ညွှန်ကြားချက် (System Instruction)' : 'AI System Instruction & Prompt'}</span>
              </h2>

              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed font-burmese"
              />

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">{isMy ? 'AI Model' : 'Model'}</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (မြန်ဆန်/အကြံပြု)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (အဆင့်မြင့်)</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between text-slate-600 mb-1 font-medium">
                    <span>Temperature: {temperature}</span>
                    <span className="text-[11px] text-blue-600 font-bold">
                      {temperature <= 0.25
                        ? isMy ? '🎯 တိကျမှု အမြင့်ဆုံး (e-Commerce အကြံပြု)' : '🎯 High Precision (Recommended)'
                        : isMy ? '🎨 တီထွင်ဆန်းသစ်မှု မြင့်သည်' : '🎨 High Creativity'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full mt-1.5"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    {isMy
                      ? '💡 မှတ်ချက်: Temperature သည် ယဉ်ကျေးမှုအဆင့် မဟုတ်ပါ။ 0.0-0.2 ထားပါက ဈေးနှုန်းနှင့် ငွေလွှဲအချက်အလက်များကို မမှားမယွင်း တိကျစွာဖြေပါမည်။ ယဉ်ကျေးမှုအတွက် System Instruction တွင် "ခင်ဗျာ/ရှင့်" ဟု ထည့်သွင်းထားပါသည်။'
                      : '💡 Note: Controls randomness vs accuracy. Keep at 0.1-0.2 for reliable pricing & bank account numbers.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Grounded Knowledge Base (Bank & Deli) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                <span>{isMy ? 'ဆိုင်၏ တရားဝင် အချက်အလက်များ (Grounded Knowledge Base)' : 'Grounded Business Knowledge'}</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">KBZPay အကောင့်နံပါတ်</label>
                  <input
                    type="text"
                    value={kpayNumber}
                    onChange={(e) => setKpayNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">WavePay အကောင့်နံပါတ်</label>
                  <input
                    type="text"
                    value={waveNumber}
                    onChange={(e) => setWaveNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">AYA Pay အကောင့်နံပါတ်</label>
                  <input
                    type="text"
                    value={ayaNumber}
                    onChange={(e) => setAyaNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">ရန်ကုန် ပို့ခ (COD)</label>
                    <input
                      type="text"
                      value={ygnDeli}
                      onChange={(e) => setYgnDeli(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">မန္တလေး/နယ် ပို့ခ</label>
                    <input
                      type="text"
                      value={mdyDeli}
                      onChange={(e) => setMdyDeli(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Handover Keywords */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck size={16} className="text-emerald-600" />
                <span>{isMy ? 'လူထံ အလိုအလျောက် စာလွှဲမည့် စကားလုံးများ (Handover Keywords)' : 'Handover Keywords'}</span>
              </h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  placeholder={isMy ? 'စကားလုံးအသစ် ရိုက်ထည့်ပါ...' : 'Add keyword...'}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <button
                  onClick={handleAddKeyword}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  {isMy ? 'ထည့်မည်' : 'Add'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-medium"
                  >
                    <span>{kw}</span>
                    <button onClick={() => handleRemoveKeyword(kw)} className="text-amber-500 hover:text-red-600 font-bold">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Testing Playground (1 col) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Play size={16} className="text-blue-600" />
              <span>{isMy ? 'တိုက်ရိုက် စမ်းသပ်ခန်း (Testing Console)' : 'AI Live Test Playground'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {isMy
                ? 'ဝယ်သူမေးမည့် မေးခွန်းများကို ရိုက်ထည့်၍ AI ၏ အလိုအလျောက် တုံ့ပြန်ပုံကို ချက်ချင်း စမ်းသပ်ကြည့်နိုင်ပါသည်'
                : 'Type customer questions to test Gemini reasoning and human handover triggers'}
            </p>

            <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200/80 overflow-y-auto space-y-3 min-h-[220px]">
              {testInput && (
                <div className="bg-blue-600 text-white text-xs p-2.5 rounded-xl rounded-tr-sm ml-auto max-w-[85%]">
                  {testInput}
                </div>
              )}

              {testOutput && (
                <div className="bg-white text-slate-800 text-xs p-3 rounded-xl rounded-tl-sm border border-slate-200 shadow-sm max-w-[90%] space-y-1.5">
                  <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase">
                    <Bot size={12} />
                    <span>Gemini AI ({testIntent || 'REPLY'})</span>
                  </div>
                  <p className="leading-relaxed font-burmese">{testOutput}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunTest()}
                placeholder={isMy ? 'ဥပမာ: AYApay နဲ့ ရှင်းလို့ရမလား (သို့) အမဲရောင်ရှိလား' : 'e.g. Can I pay via AYAPay?'}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />

              {/* Quick Prompt Test Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'AYApay နဲ့ ရှင်းလို့ရမလား',
                  'အမဲရောင်ရှိလား',
                  'ဘယ်လောက်ကြာမလဲ?',
                  'ဖုန်းနံပါတ် ပေးပို့ရန်',
                  'Share My Phone number',
                  'လူနဲ့ပြောချင်တယ်',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => {
                      setTestInput(promptText);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-md text-[10.5px] border border-slate-200 transition-colors"
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRunTest}
                disabled={isTesting || !testInput.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors"
              >
                {isTesting ? (isMy ? 'စမ်းသပ်နေသည်...' : 'Thinking...') : isMy ? 'မေးမြန်းမှု စမ်းသပ်ရန်' : 'Test Reply'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
