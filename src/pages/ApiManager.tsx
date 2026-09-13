import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../lib/db';
import { AppSettings } from '../types';
import { KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function ApiManager() {
  const [settings, setSettings] = useState<Partial<AppSettings>>({
    apiKey: '',
    provider: 'gemini',
    model: 'gemini-2.5-flash',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(prev => ({ ...prev, ...s }));
    });
  }, []);

  const handleSave = async () => {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">API Manager</h1>
        <p className="text-slate-500 dark:text-slate-400">Configure your AI provider settings securely.</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex gap-4">
        <ShieldAlert className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-1">Security Notice</h3>
          <p className="text-sm text-amber-700 dark:text-amber-500/80">
            Keys entered here are stored locally in your browser's IndexedDB. For maximum security, we proxy the requests through our backend so your key is never directly exposed in frontend network logs, but you are responsible for managing your API quotas.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          
          <div className="space-y-3">
            <label className="block text-sm font-semibold">AI Provider</label>
            <select
              value={settings.provider || 'gemini'}
              onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold">API Key</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                value={settings.apiKey || ''}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-slate-500">Leave blank to use the server's default environment key.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold">Preferred Model</label>
            <select
              value={settings.model || 'gemini-2.5-flash'}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast, cost-effective)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Highest quality)</option>
            </select>
          </div>

        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {saved ? <CheckCircle2 size={18} /> : null}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
