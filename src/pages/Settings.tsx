import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../lib/db';
import { AppSettings } from '../types';
import { CheckCircle2, Moon, Sun, Monitor } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState<Partial<AppSettings>>({
    theme: 'dark',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(s => setSettings(prev => ({ ...prev, ...s })));
  }, []);

  const handleSave = async () => {
    await saveSettings(settings);
    
    // Apply theme immediately
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your application preferences.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-slate-100 dark:border-slate-800 pb-2">Appearance</h3>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold">Theme</label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setSettings({ ...settings, theme: 'light' })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${settings.theme === 'light' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'}`}
                >
                  <Sun size={24} />
                  <span className="font-medium">Light</span>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${settings.theme === 'dark' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'}`}
                >
                  <Moon size={24} />
                  <span className="font-medium">Dark</span>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'system' })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${settings.theme === 'system' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'}`}
                >
                  <Monitor size={24} />
                  <span className="font-medium">System</span>
                </button>
              </div>
            </div>
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
