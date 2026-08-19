'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Users, Cpu, Settings, Plus, Trash2, Shield,
  ToggleLeft, ToggleRight, Save, RefreshCw, ChevronDown, Check, X, AlertTriangle,
} from 'lucide-react';
import { createUser, deleteUser, toggleUserActive } from '@/lib/nerdai/auth';
import { getUsers, getModels, saveModels, getSettings, saveSettings } from '@/lib/nerdai/store';
import type { AuthSession, NerdUser, NerdModel, NerdAISettings, ProviderType, AccessType } from '@/lib/nerdai/types';
import { syncModels } from '@/lib/nerdai/modelSync';

type Tab = 'users' | 'models' | 'settings';
type ModelStep = 1 | 2 | 3 | 4;

const PROVIDER_LABELS: Record<ProviderType, string> = {
  bedrock: 'Amazon Bedrock',
  'azure-openai': 'Azure OpenAI',
  openai: 'OpenAI Compatible',
  gemini: 'Google Gemini',
};

const PROVIDER_COLORS: Record<ProviderType, string> = {
  bedrock: 'text-orange-400 border-orange-900/50 bg-orange-950/20',
  'azure-openai': 'text-blue-400 border-blue-900/50 bg-blue-950/20',
  openai: 'text-green-400 border-green-900/50 bg-green-950/20',
  gemini: 'text-purple-400 border-purple-900/50 bg-purple-950/20',
};

interface AddModelState {
  displayName: string;
  provider: ProviderType;
  // Bedrock
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
  // Azure
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
  // OpenAI
  openaiKey: string;
  baseUrl: string;
  // Gemini
  geminiKey: string;
  // Step 3
  syncedModels: { id: string; name: string }[];
  selectedModelId: string;
  selectedModelName: string;
  syncLoading: boolean;
  syncError: string;
  // Step 4
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  accessType: AccessType;
  allowedUsers: string[];
}

const defaultModelState = (): AddModelState => ({
  displayName: '',
  provider: 'openai',
  accessKeyId: '', secretAccessKey: '', sessionToken: '', region: 'us-east-1',
  endpoint: '', apiKey: '', deploymentName: '', apiVersion: '2024-02-01',
  openaiKey: '', baseUrl: 'https://api.openai.com/v1',
  geminiKey: '',
  syncedModels: [], selectedModelId: '', selectedModelName: '',
  syncLoading: false, syncError: '',
  maxTokens: 2048, temperature: 0.7,
  systemPrompt: '',
  accessType: 'all', allowedUsers: [],
});

export default function AdminPanel({ session, onBack }: { session: AuthSession; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<NerdUser[]>([]);
  const [models, setModels] = useState<NerdModel[]>([]);
  const [settings, setSettings] = useState<NerdAISettings>({ systemName: '', welcomeMessage: '', allowRegistration: false, defaultSystemPrompt: '' });

  // Users form
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Models form
  const [showAddModel, setShowAddModel] = useState(false);
  const [modelStep, setModelStep] = useState<ModelStep>(1);
  const [modelState, setModelState] = useState<AddModelState>(defaultModelState());
  const [modelError, setModelError] = useState('');
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);

  // Settings
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setUsers(getUsers());
    setModels(getModels());
    setSettings(getSettings());
  }, []);

  // ── USERS ──
  const handleAddUser = async () => {
    setUserError('');
    if (!newUsername.trim() || !newPassword) { setUserError('Fill all fields.'); return; }
    if (users.find(u => u.username === newUsername.trim())) { setUserError('Username taken.'); return; }
    try {
      await createUser(newUsername.trim(), newPassword, newRole);
      setUsers(getUsers());
      setNewUsername(''); setNewPassword(''); setNewRole('user');
      setShowAddUser(false);
      setUserSuccess(`User "${newUsername.trim()}" created.`);
      setTimeout(() => setUserSuccess(''), 3000);
    } catch {
      setUserError('Failed to create user.');
    }
  };

  const handleDeleteUser = (id: string) => {
    if (deletingUserId === id) {
      deleteUser(id);
      setUsers(getUsers());
      setDeletingUserId(null);
    } else {
      setDeletingUserId(id);
    }
  };

  const handleToggleUser = (id: string) => {
    toggleUserActive(id);
    setUsers(getUsers());
  };

  // ── MODELS ──
  const ms = modelState;
  const setMs = (patch: Partial<AddModelState>) => setModelState(prev => ({ ...prev, ...patch }));

  const getProviderConfig = () => {
    if (ms.provider === 'bedrock') return { accessKeyId: ms.accessKeyId, secretAccessKey: ms.secretAccessKey, sessionToken: ms.sessionToken || undefined, region: ms.region };
    if (ms.provider === 'azure-openai') return { endpoint: ms.endpoint, apiKey: ms.apiKey, deploymentName: ms.deploymentName, apiVersion: ms.apiVersion };
    if (ms.provider === 'openai') return { apiKey: ms.openaiKey, baseUrl: ms.baseUrl };
    return { apiKey: ms.geminiKey };
  };

  const handleSyncModels = async () => {
    setMs({ syncLoading: true, syncError: '', syncedModels: [] });
    try {
      const models = await syncModels(ms.provider, getProviderConfig());
      setMs({ syncedModels: models, syncLoading: false });
      if (!models.length) setMs({ syncError: 'No models found.' });
    } catch (e) {
      setMs({ syncLoading: false, syncError: e instanceof Error ? e.message : 'Sync failed' });
    }
  };

  const handleSaveModel = () => {
    if (!ms.selectedModelId) { setModelError('Select a model first.'); return; }
    const newModel: NerdModel = {
      id: crypto.randomUUID(),
      displayName: ms.displayName || ms.selectedModelName,
      provider: ms.provider,
      modelId: ms.selectedModelId,
      config: getProviderConfig(),
      accessType: ms.accessType,
      allowedUsers: ms.allowedUsers,
      systemPrompt: ms.systemPrompt,
      maxTokens: ms.maxTokens,
      temperature: ms.temperature,
      active: true,
      createdAt: Date.now(),
    };
    const updated = [...models, newModel];
    saveModels(updated);
    setModels(updated);
    setShowAddModel(false);
    setModelStep(1);
    setModelState(defaultModelState());
    setModelError('');
  };

  const handleDeleteModel = (id: string) => {
    if (deletingModelId === id) {
      const updated = models.filter(m => m.id !== id);
      saveModels(updated);
      setModels(updated);
      setDeletingModelId(null);
    } else {
      setDeletingModelId(id);
    }
  };

  const handleToggleModel = (id: string) => {
    const updated = models.map(m => m.id === id ? { ...m, active: !m.active } : m);
    saveModels(updated);
    setModels(updated);
  };

  // ── SETTINGS ──
  const handleSaveSettings = () => {
    saveSettings(settings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleResetSettings = () => {
    const def = { systemName: 'NerdAI', welcomeMessage: 'Welcome to NerdAI. How can I assist you?', allowRegistration: false, defaultSystemPrompt: 'You are NerdAI, a powerful and precise AI assistant.' };
    setSettings(def);
    saveSettings(def);
  };

  const inputCls = "w-full bg-black/60 border border-white/10 focus:border-red-600/60 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 outline-none transition-all duration-300 text-sm";
  const labelCls = "text-xs text-gray-400 uppercase tracking-widest mb-1 block";

  return (
    <div className="w-full h-full flex flex-col bg-transparent overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-black/30 backdrop-blur-xl shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm tracking-wider group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          BACK
        </button>
        <h1 className="text-lg font-bold tracking-[0.3em] text-white drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]">
          ADMIN PANEL
        </h1>
        <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-1.5">
          <Shield size={14} className="text-red-500" />
          <span className="text-red-400 text-xs tracking-widest font-bold">SPRITX</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/8 bg-black/20 backdrop-blur-md shrink-0">
        {([
          { key: 'users', label: 'USERS', icon: Users, count: users.length },
          { key: 'models', label: 'MODELS', icon: Cpu, count: models.length },
          { key: 'settings', label: 'SETTINGS', icon: Settings, count: null },
        ] as { key: Tab; label: string; icon: React.ElementType; count: number | null }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-6 py-3 text-xs tracking-widest transition-all border-b-2 ${tab === t.key ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <t.icon size={14} />
            {t.label}
            {t.count !== null && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === t.key ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-400'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold tracking-widest">USER MANAGEMENT</h2>
              <button
                onClick={() => setShowAddUser(!showAddUser)}
                className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white text-xs tracking-widest font-semibold rounded-lg px-4 py-2 transition-all"
              >
                <Plus size={14} />
                ADD USER
              </button>
            </div>

            {userSuccess && (
              <div className="bg-green-950/30 border border-green-800/50 text-green-400 text-sm rounded-lg px-4 py-2 flex items-center gap-2">
                <Check size={14} /> {userSuccess}
              </div>
            )}

            <AnimatePresence>
              {showAddUser && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-black/40 backdrop-blur-sm border border-red-800/30 rounded-2xl p-5 space-y-3 overflow-hidden"
                >
                  <h3 className="text-sm font-bold tracking-widest text-red-400">NEW USER</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Username</label>
                      <input className={inputCls} value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="username" />
                    </div>
                    <div>
                      <label className={labelCls}>Password</label>
                      <input className={inputCls} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="password" />
                    </div>
                    <div>
                      <label className={labelCls}>Role</label>
                      <select className={inputCls} value={newRole} onChange={e => setNewRole(e.target.value as 'user' | 'admin')}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  {userError && <p className="text-red-500 text-xs">{userError}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleAddUser} className="bg-red-600/80 hover:bg-red-600 text-white text-xs tracking-widest px-4 py-2 rounded-lg transition-all flex items-center gap-2">
                      <Plus size={12} /> CREATE
                    </button>
                    <button onClick={() => { setShowAddUser(false); setUserError(''); }} className="border border-white/10 hover:border-white/30 text-gray-400 hover:text-white text-xs tracking-widest px-4 py-2 rounded-lg transition-all">
                      CANCEL
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-black/30 backdrop-blur-sm border border-white/8 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-gray-500 tracking-widest px-5 py-3">USERNAME</th>
                    <th className="text-left text-xs text-gray-500 tracking-widest px-5 py-3">ROLE</th>
                    <th className="text-left text-xs text-gray-500 tracking-widest px-5 py-3">STATUS</th>
                    <th className="text-left text-xs text-gray-500 tracking-widest px-5 py-3">CREATED</th>
                    <th className="text-right text-xs text-gray-500 tracking-widest px-5 py-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-600 py-8 text-sm">No users yet</td></tr>
                  )}
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3 text-white font-medium">{user.username}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${user.role === 'admin' ? 'text-red-400 border-red-900/50 bg-red-950/20' : 'text-gray-400 border-white/10 bg-white/5'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${user.active ? 'text-green-400 border-green-900/50 bg-green-950/20' : 'text-gray-500 border-white/10 bg-white/5'}`}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleUser(user.id)}
                            className="text-gray-500 hover:text-white transition-colors p-1"
                            title={user.active ? 'Deactivate' : 'Activate'}
                          >
                            {user.active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className={`p-1 transition-colors ${deletingUserId === user.id ? 'text-red-500 hover:text-red-400' : 'text-gray-600 hover:text-red-400'}`}
                            title={deletingUserId === user.id ? 'Click again to confirm' : 'Delete'}
                          >
                            {deletingUserId === user.id ? <AlertTriangle size={16} /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MODELS TAB ── */}
        {tab === 'models' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold tracking-widest">MODEL MANAGEMENT</h2>
              <button
                onClick={() => { setShowAddModel(true); setModelStep(1); setModelState(defaultModelState()); setModelError(''); }}
                className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white text-xs tracking-widest font-semibold rounded-lg px-4 py-2 transition-all"
              >
                <Plus size={14} /> ADD MODEL
              </button>
            </div>

            {/* Add Model Wizard */}
            <AnimatePresence>
              {showAddModel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-black/40 backdrop-blur-sm border border-red-800/30 rounded-2xl p-5 overflow-hidden"
                >
                  {/* Steps indicator */}
                  <div className="flex items-center gap-2 mb-5">
                    {[1, 2, 3, 4].map(s => (
                      <div key={s} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold transition-all ${modelStep === s ? 'bg-red-600 text-white' : s < modelStep ? 'bg-red-900 text-red-300' : 'bg-zinc-800 text-gray-500'}`}>{s}</div>
                        {s < 4 && <div className={`w-8 h-px ${s < modelStep ? 'bg-red-800' : 'bg-zinc-800'}`} />}
                      </div>
                    ))}
                    <span className="text-xs text-gray-500 ml-2 tracking-widest">
                      {['BASIC INFO', 'CREDENTIALS', 'SYNC & SELECT', 'CONFIGURE'][modelStep - 1]}
                    </span>
                  </div>

                  {/* Step 1 */}
                  {modelStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Display Name</label>
                        <input className={inputCls} value={ms.displayName} onChange={e => setMs({ displayName: e.target.value })} placeholder="My GPT-4 Model" />
                      </div>
                      <div>
                        <label className={labelCls}>Provider</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {(['bedrock', 'azure-openai', 'openai', 'gemini'] as ProviderType[]).map(p => (
                            <button
                              key={p}
                              onClick={() => setMs({ provider: p })}
                              className={`text-xs tracking-wider py-2.5 rounded-lg border transition-all ${ms.provider === p ? 'border-red-600 bg-red-950/30 text-red-400' : 'border-white/10 bg-black/40 text-gray-500 hover:border-white/30 hover:text-gray-300'}`}
                            >
                              {PROVIDER_LABELS[p]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2 */}
                  {modelStep === 2 && (
                    <div className="space-y-3">
                      {ms.provider === 'bedrock' && (
                        <>
                          <div><label className={labelCls}>AWS Access Key ID</label><input className={inputCls} value={ms.accessKeyId} onChange={e => setMs({ accessKeyId: e.target.value })} placeholder="AKIAIOSFODNN7EXAMPLE" /></div>
                          <div><label className={labelCls}>AWS Secret Access Key</label><input className={inputCls} type="password" value={ms.secretAccessKey} onChange={e => setMs({ secretAccessKey: e.target.value })} placeholder="••••••••" /></div>
                          <div><label className={labelCls}>Session Token (optional)</label><input className={inputCls} value={ms.sessionToken} onChange={e => setMs({ sessionToken: e.target.value })} placeholder="optional" /></div>
                          <div><label className={labelCls}>Region</label><input className={inputCls} value={ms.region} onChange={e => setMs({ region: e.target.value })} placeholder="us-east-1" /></div>
                        </>
                      )}
                      {ms.provider === 'azure-openai' && (
                        <>
                          <div><label className={labelCls}>Endpoint URL</label><input className={inputCls} value={ms.endpoint} onChange={e => setMs({ endpoint: e.target.value })} placeholder="https://myresource.openai.azure.com" /></div>
                          <div><label className={labelCls}>API Key</label><input className={inputCls} type="password" value={ms.apiKey} onChange={e => setMs({ apiKey: e.target.value })} placeholder="••••••••" /></div>
                          <div><label className={labelCls}>API Version</label><input className={inputCls} value={ms.apiVersion} onChange={e => setMs({ apiVersion: e.target.value })} placeholder="2024-02-01" /></div>
                        </>
                      )}
                      {ms.provider === 'openai' && (
                        <>
                          <div><label className={labelCls}>API Key</label><input className={inputCls} type="password" value={ms.openaiKey} onChange={e => setMs({ openaiKey: e.target.value })} placeholder="sk-••••••••" /></div>
                          <div><label className={labelCls}>Base URL</label><input className={inputCls} value={ms.baseUrl} onChange={e => setMs({ baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" /></div>
                        </>
                      )}
                      {ms.provider === 'gemini' && (
                        <div><label className={labelCls}>API Key</label><input className={inputCls} type="password" value={ms.geminiKey} onChange={e => setMs({ geminiKey: e.target.value })} placeholder="AIza••••••••" /></div>
                      )}
                    </div>
                  )}

                  {/* Step 3 */}
                  {modelStep === 3 && (
                    <div className="space-y-4">
                      <button
                        onClick={handleSyncModels}
                        disabled={ms.syncLoading}
                        className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 disabled:bg-red-900/30 text-white text-xs tracking-widest px-4 py-2 rounded-lg transition-all"
                      >
                        <RefreshCw size={14} className={ms.syncLoading ? 'animate-spin' : ''} />
                        {ms.syncLoading ? 'SYNCING...' : 'SYNC MODELS'}
                      </button>
                      {ms.syncError && <p className="text-red-500 text-xs">{ms.syncError}</p>}
                      {ms.syncedModels.length > 0 && (
                        <div>
                          <label className={labelCls}>Select Model</label>
                          <div className="relative">
                            <select
                              className={inputCls + ' appearance-none pr-8'}
                              value={ms.selectedModelId}
                              onChange={e => {
                                const m = ms.syncedModels.find(x => x.id === e.target.value);
                                setMs({ selectedModelId: e.target.value, selectedModelName: m?.name ?? '' });
                              }}
                            >
                              <option value="">-- Select --</option>
                              {ms.syncedModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4 */}
                  {modelStep === 4 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Max Tokens</label>
                          <input className={inputCls} type="number" value={ms.maxTokens} onChange={e => setMs({ maxTokens: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className={labelCls}>Temperature ({ms.temperature.toFixed(1)})</label>
                          <input type="range" min="0" max="1" step="0.1" value={ms.temperature} onChange={e => setMs({ temperature: Number(e.target.value) })} className="w-full accent-red-600 mt-2" />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>System Prompt</label>
                        <textarea
                          className={inputCls + ' resize-none h-20'}
                          value={ms.systemPrompt}
                          onChange={e => setMs({ systemPrompt: e.target.value })}
                          placeholder="Optional system prompt..."
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Access</label>
                        <div className="flex gap-2">
                          {(['all', 'specific'] as AccessType[]).map(a => (
                            <button
                              key={a}
                              onClick={() => setMs({ accessType: a })}
                              className={`text-xs tracking-wider px-4 py-2 rounded-lg border transition-all ${ms.accessType === a ? 'border-red-600 bg-red-950/30 text-red-400' : 'border-white/10 bg-black/40 text-gray-500 hover:border-white/30'}`}
                            >
                              {a === 'all' ? 'All Users' : 'Specific Users'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {ms.accessType === 'specific' && (
                        <div>
                          <label className={labelCls}>Allowed Users</label>
                          <div className="flex flex-wrap gap-2">
                            {users.map(u => (
                              <button
                                key={u.id}
                                onClick={() => setMs({ allowedUsers: ms.allowedUsers.includes(u.id) ? ms.allowedUsers.filter(x => x !== u.id) : [...ms.allowedUsers, u.id] })}
                                className={`text-xs tracking-wider px-3 py-1.5 rounded-lg border transition-all ${ms.allowedUsers.includes(u.id) ? 'border-red-600 bg-red-950/30 text-red-400' : 'border-white/10 bg-black/40 text-gray-500'}`}
                              >
                                {ms.allowedUsers.includes(u.id) && <Check size={10} className="inline mr-1" />}
                                {u.username}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {modelError && <p className="text-red-500 text-xs">{modelError}</p>}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between mt-5 pt-4 border-t border-white/5">
                    <button
                      onClick={() => { if (modelStep === 1) { setShowAddModel(false); } else { setModelStep((modelStep - 1) as ModelStep); } }}
                      className="border border-white/10 hover:border-white/30 text-gray-400 hover:text-white text-xs tracking-widest px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                    >
                      <ArrowLeft size={12} /> {modelStep === 1 ? 'CANCEL' : 'BACK'}
                    </button>
                    {modelStep < 4 ? (
                      <button
                        onClick={() => setModelStep((modelStep + 1) as ModelStep)}
                        className="bg-red-600/80 hover:bg-red-600 text-white text-xs tracking-widest px-4 py-2 rounded-lg transition-all"
                        disabled={modelStep === 3 && !ms.selectedModelId}
                      >
                        NEXT →
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveModel}
                        className="bg-red-600/80 hover:bg-red-600 text-white text-xs tracking-widest px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                      >
                        <Save size={12} /> SAVE MODEL
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Model Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {models.length === 0 && !showAddModel && (
                <p className="text-gray-600 text-sm col-span-2 text-center py-8">No models configured yet.</p>
              )}
              {models.map(model => (
                <div key={model.id} className={`bg-black/30 backdrop-blur-sm border rounded-2xl p-4 transition-all ${model.active ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-sm">{model.displayName}</h3>
                      <p className="text-gray-500 text-xs mt-0.5 font-mono">{model.modelId}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleToggleModel(model.id)} className="text-gray-500 hover:text-white transition-colors p-1">
                        {model.active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => handleDeleteModel(model.id)} className={`p-1 transition-colors ${deletingModelId === model.id ? 'text-red-500' : 'text-gray-600 hover:text-red-400'}`}>
                        {deletingModelId === model.id ? <AlertTriangle size={15} /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${PROVIDER_COLORS[model.provider]}`}>{PROVIDER_LABELS[model.provider]}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-gray-400">{model.accessType === 'all' ? 'All Users' : `${model.allowedUsers.length} users`}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-gray-400">{model.maxTokens} tokens</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-white font-bold tracking-widest mb-4">SYSTEM SETTINGS</h2>
            <div className="bg-black/30 backdrop-blur-sm border border-white/8 rounded-2xl p-6 space-y-5">
              <div>
                <label className={labelCls}>System Name</label>
                <input className={inputCls} value={settings.systemName} onChange={e => setSettings({ ...settings, systemName: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Welcome Message</label>
                <input className={inputCls} value={settings.welcomeMessage} onChange={e => setSettings({ ...settings, welcomeMessage: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Default System Prompt</label>
                <textarea className={inputCls + ' resize-none h-24'} value={settings.defaultSystemPrompt} onChange={e => setSettings({ ...settings, defaultSystemPrompt: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Allow Registration</p>
                  <p className="text-gray-500 text-xs">Let new users sign up from login page</p>
                </div>
                <button onClick={() => setSettings({ ...settings, allowRegistration: !settings.allowRegistration })} className="transition-colors">
                  {settings.allowRegistration ? <ToggleRight size={28} className="text-green-500" /> : <ToggleLeft size={28} className="text-gray-600" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveSettings}
                className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white text-xs tracking-widest font-semibold rounded-lg px-5 py-2.5 transition-all"
              >
                {settingsSaved ? <><Check size={14} /> SAVED</> : <><Save size={14} /> SAVE SETTINGS</>}
              </button>
              <button
                onClick={handleResetSettings}
                className="flex items-center gap-2 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white text-xs tracking-widest px-5 py-2.5 rounded-lg transition-all"
              >
                <RefreshCw size={14} /> RESET DEFAULTS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
