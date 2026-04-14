"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface StorageStats {
  usedMB: number;
  usedGB: number;
  limitGB: number;
  percentUsed: number;
  documentCount: number;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({
    strictMode: false,
    defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
    similarityThreshold: 0.1,
    availableModels: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  const [isSaving, setIsSaving] = useState(false);
  const [storage, setStorage] = useState<StorageStats | null>(null);
  // Local slider value (not saved until mouse released)
  const [sliderValue, setSliderValue] = useState(10);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, storageRes] = await Promise.all([
          fetch('/api/user/settings'),
          fetch('/api/user/storage'),
        ]);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings(data);
          setSliderValue(Math.round((data.similarityThreshold ?? 0.1) * 100));
        }
        if (storageRes.ok) {
          setStorage(await storageRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async (newSettings: typeof settings) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (response.ok) {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#f8fafc] dark:bg-[#030712]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-20 h-screen bg-[#f8fafc] dark:bg-[#030712] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tighter mb-8">System Settings</h1>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
              <span className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                </svg>
              </span>
              AI Configuration {isSaving && <span className="text-xs font-normal text-gray-400 ml-2 animate-pulse">Saving...</span>}
            </h2>
            
            <div className="space-y-6">
              {/* Model Selection */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-6">
                <div className="flex-1 mr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tighter">Default Context Model</p>
                    <button 
                      onClick={async () => {
                         setIsLoading(true);
                         const res = await fetch('/api/user/settings');
                         if (res.ok) {
                            const data = await res.json();
                            setSettings(data);
                         }
                         setIsLoading(false);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-400 dark:text-gray-600 transition-colors"
                      title="Sync Model Registry"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">The LLM used for primary chat responses. Automatically synced with OpenRouter free-tier availability.</p>
                </div>
                <select 
                  value={settings.defaultModel}
                  onChange={(e) => saveSettings({ ...settings, defaultModel: e.target.value })}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none font-black tracking-tight min-w-[220px]"
                >
                  {(settings.availableModels || [
                    { id: 'openrouter/free', name: 'Auto-Free (Default)' },
                    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B' }
                  ]).map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Similarity Threshold */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-6">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">Retrieval Similarity Threshold</p>
                  <p className="text-sm text-gray-500">The minimum vector match score for context inclusion</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 w-8 text-right">{(sliderValue / 100).toFixed(2)}</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="95" 
                    value={sliderValue} 
                    onChange={(e) => setSliderValue(parseInt(e.target.value))}
                    onMouseUp={(e) => saveSettings({ ...settings, similarityThreshold: parseInt((e.target as HTMLInputElement).value) / 100 })}
                    onTouchEnd={(e) => saveSettings({ ...settings, similarityThreshold: parseInt((e.target as HTMLInputElement).value) / 100 })}
                    className="w-32 accent-blue-600 cursor-pointer" 
                  />
                </div>
              </div>

              {/* Strict Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">Strict Source Citations</p>
                  <p className="text-sm text-gray-500">
                    {settings.strictMode 
                      ? '🔒 AI answers only from your documents' 
                      : '🌐 AI uses documents + general knowledge'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.strictMode} 
                    onChange={() => saveSettings({ ...settings, strictMode: !settings.strictMode })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Storage Quotas - now with real data */}
          <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
              <span className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </span>
              Storage Quotas
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  Vault Capacity
                  {storage && <span className="font-normal text-gray-400 ml-2">({storage.documentCount} documents)</span>}
                </span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {storage 
                    ? `${storage.usedMB < 1024 ? `${storage.usedMB} MB` : `${storage.usedGB} GB`} / ${storage.limitGB} GB`
                    : 'Loading...'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    (storage?.percentUsed ?? 0) > 80 
                      ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                      : 'bg-gradient-to-r from-purple-500 to-blue-500'
                  }`}
                  style={{ width: `${storage?.percentUsed ?? 0}%` }}
                />
              </div>
              {storage && (
                <p className="text-xs text-gray-400">
                  {(100 - storage.percentUsed).toFixed(1)}% free · {(storage.limitGB - storage.usedGB).toFixed(2)} GB remaining
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
