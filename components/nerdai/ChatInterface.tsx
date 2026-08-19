'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Send, LogOut, Settings, Trash2, Copy, Check,
  Brain, MessageSquare, Menu, X, Shield, ChevronDown, ArrowLeft,
} from 'lucide-react';
import { logout } from '@/lib/nerdai/auth';
import { getChats, saveChats, getModels, getSettings } from '@/lib/nerdai/store';
import type { AuthSession, NerdModel, ChatSession, ChatMessage } from '@/lib/nerdai/types';

// ── Markdown renderer ──────────────────────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} className="my-3">
          {lang && <div className="text-xs text-gray-500 bg-zinc-900 border border-red-900/20 border-b-0 rounded-t-lg px-4 py-1.5 font-mono tracking-wider">{lang}</div>}
          <pre className={`bg-zinc-900 border border-red-900/20 ${lang ? 'rounded-b-lg rounded-tr-lg' : 'rounded-lg'} p-4 overflow-x-auto`}>
            <code className="text-green-400 font-mono text-sm">{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-bold text-red-400 mt-4 mb-2 tracking-wide">{renderInline(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-bold text-red-400 mt-4 mb-2 tracking-wide">{renderInline(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-bold text-red-500 mt-4 mb-2 tracking-wider drop-shadow-[0_0_6px_rgba(220,38,38,0.5)]">{renderInline(line.slice(2))}</h1>);
      i++; continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-red-600 pl-4 my-2 italic text-gray-400">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // Unordered list
    if (line.match(/^[-*] /)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="my-2 space-y-1.5">
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-gray-300">
              <span className="text-red-500 mt-0.5 shrink-0">▹</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        listItems.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      elements.push(
        <ol key={i} className="my-2 space-y-1.5 list-none">
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-gray-300">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">{j + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={i} className="border-red-900/30 my-4" />);
      i++; continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
      i++; continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-gray-300 leading-relaxed my-1">{renderInline(line)}</p>
    );
    i++;
  }

  return <div className="text-sm">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-gray-200">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-zinc-900 px-1.5 py-0.5 rounded text-green-400 font-mono text-xs">{part.slice(1, -1)}</code>;
    }
    const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline underline-offset-2">{linkMatch[1]}</a>;
    }
    return part;
  });
}

// ── Thinking dots ──────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-red-500 rounded-full"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ── Helper ──────────────────────────────────────────────────────────────────
function genId(): string {
  return crypto.randomUUID();
}

const EXAMPLE_PROMPTS = [
  'Explain quantum computing in simple terms',
  'Write a Python function to sort a list',
  'What are the best practices for prompt engineering?',
];

// ── Main Component ──────────────────────────────────────────────────────────
export default function ChatInterface({
  session,
  onLogout,
  onAdminPanel,
  onBack,
}: {
  session: AuthSession;
  onLogout: () => void;
  onAdminPanel: () => void;
  onBack?: () => void;
}) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [models, setModels] = useState<NerdModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelDropOpen, setModelDropOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoverChatId, setHoverChatId] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId) ?? null;
  const settings = getSettings();

  // Load chats and models
  useEffect(() => {
    const loadedChats = getChats(session.userId);
    setChats(loadedChats);
    const loadedModels = getModels().filter(m => {
      if (!m.active) return false;
      if (session.role === 'admin') return true;
      if (m.accessType === 'all') return true;
      return m.allowedUsers.includes(session.userId);
    });
    setModels(loadedModels);
    if (loadedModels.length > 0) setSelectedModelId(loadedModels[0].id);
  }, [session]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, streamingContent]);

  const persistChats = useCallback((updated: ChatSession[]) => {
    setChats(updated);
    saveChats(session.userId, updated);
  }, [session.userId]);

  const createNewChat = () => {
    setActiveChatId(null);
    setStreamingContent('');
    setError('');
  };

  const selectChat = (id: string) => {
    setActiveChatId(id);
    setStreamingContent('');
    setError('');
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const deleteChat = (id: string) => {
    if (deletingChatId === id) {
      const updated = chats.filter(c => c.id !== id);
      persistChats(updated);
      if (activeChatId === id) setActiveChatId(null);
      setDeletingChatId(null);
    } else {
      setDeletingChatId(id);
    }
  };

  const copyMessage = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  };

  const selectedModel = models.find(m => m.id === selectedModelId);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const model = selectedModel;
    if (!model) { setError('No model selected. Please configure a model in admin panel.'); return; }

    setError('');
    const userMsg: ChatMessage = {
      id: genId(), role: 'user', content: input.trim(), timestamp: Date.now(),
    };

    let currentChat: ChatSession;
    let updatedChats: ChatSession[];

    if (!activeChatId || !activeChat) {
      currentChat = {
        id: genId(),
        title: input.trim().slice(0, 42),
        messages: [userMsg],
        modelId: model.id,
        userId: session.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updatedChats = [currentChat, ...chats];
      setActiveChatId(currentChat.id);
    } else {
      currentChat = { ...activeChat, messages: [...activeChat.messages, userMsg], updatedAt: Date.now() };
      updatedChats = chats.map(c => c.id === currentChat.id ? currentChat : c);
    }

    persistChats(updatedChats);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    const contextMessages = currentChat.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const systemPrompt = model.systemPrompt || settings.defaultSystemPrompt;

    try {
      const res = await fetch('/api/nerdai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: model.provider,
          config: model.config,
          messages: contextMessages,
          modelId: model.modelId,
          maxTokens: model.maxTokens,
          temperature: model.temperature,
          systemPrompt,
          stream: model.provider !== 'bedrock',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const contentType = res.headers.get('content-type') ?? '';

      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const chunk = JSON.parse(jsonStr);
              if (chunk.content) {
                accumulated += chunk.content;
                setStreamingContent(accumulated);
              }
            } catch { /* skip */ }
          }
        }

        const assistantMsg: ChatMessage = {
          id: genId(), role: 'assistant', content: accumulated, timestamp: Date.now(), modelId: model.id,
        };
        const finalChat = { ...currentChat, messages: [...currentChat.messages, assistantMsg], updatedAt: Date.now() };
        const finalChats = updatedChats.map(c => c.id === finalChat.id ? finalChat : c);
        persistChats(finalChats);
        setStreamingContent('');
      } else {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: genId(), role: 'assistant', content: (data as { content: string }).content ?? '', timestamp: Date.now(), modelId: model.id,
        };
        const finalChat = { ...currentChat, messages: [...currentChat.messages, assistantMsg], updatedAt: Date.now() };
        const finalChats = updatedChats.map(c => c.id === finalChat.id ? finalChat : c);
        persistChats(finalChats);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const displayMessages = activeChat?.messages ?? [];
  const hasContent = displayMessages.length > 0 || streamingContent;

  return (
    <div className="w-full h-full flex overflow-hidden bg-transparent">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-64 shrink-0 flex flex-col bg-black/50 backdrop-blur-xl border-r border-white/8 z-20"
          >
            {/* Logo */}
            <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Brain className="text-red-500" size={20} />
                <span className="text-white font-bold tracking-widest text-sm">
                  NERD<span className="text-red-500">AI</span>
                </span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-600 hover:text-white transition-colors md:hidden">
                <X size={16} />
              </button>
            </div>

            {/* New chat */}
            <div className="px-3 py-3 shrink-0">
              <button
                onClick={createNewChat}
                className="w-full flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-800/30 hover:border-red-600/50 text-red-400 hover:text-red-300 rounded-xl px-3 py-2.5 text-xs tracking-widest transition-all"
              >
                <Plus size={14} /> NEW CHAT
              </button>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
              {chats.length === 0 && (
                <p className="text-gray-600 text-xs text-center py-6 px-3">No chats yet. Start a new one!</p>
              )}
              {chats.map(chat => (
                <div
                  key={chat.id}
                  onMouseEnter={() => setHoverChatId(chat.id)}
                  onMouseLeave={() => setHoverChatId(null)}
                  onClick={() => selectChat(chat.id)}
                  className={`relative group flex items-center rounded-xl px-3 py-2.5 cursor-pointer transition-all ${activeChatId === chat.id ? 'bg-red-950/30 border border-red-800/30' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <MessageSquare size={12} className={`shrink-0 mr-2 ${activeChatId === chat.id ? 'text-red-400' : 'text-gray-600'}`} />
                  <span className={`text-xs flex-1 truncate ${activeChatId === chat.id ? 'text-red-300' : 'text-gray-400'}`}>{chat.title || 'New Chat'}</span>
                  {hoverChatId === chat.id && (
                    <button
                      onClick={e => { e.stopPropagation(); deleteChat(chat.id); }}
                      className={`shrink-0 ml-1 transition-colors ${deletingChatId === chat.id ? 'text-red-500' : 'text-gray-600 hover:text-red-400'}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Model selector */}
            <div className="px-3 py-3 border-t border-white/5 shrink-0">
              {models.length > 0 ? (
                <div className="relative">
                  <button
                    onClick={() => setModelDropOpen(!modelDropOpen)}
                    className="w-full flex items-center justify-between bg-black/40 border border-white/10 hover:border-red-800/50 rounded-xl px-3 py-2 text-xs transition-all"
                  >
                    <span className="text-gray-300 truncate">{selectedModel?.displayName ?? 'Select model'}</span>
                    <ChevronDown size={12} className={`text-gray-500 transition-transform ${modelDropOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {modelDropOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute bottom-full mb-1 left-0 right-0 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden z-30"
                      >
                        {models.map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setSelectedModelId(m.id); setModelDropOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/5 ${selectedModelId === m.id ? 'text-red-400' : 'text-gray-400'}`}
                          >
                            {selectedModelId === m.id && <Check size={10} className="inline mr-1" />}
                            {m.displayName}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-gray-600 text-xs text-center py-1">No models available</p>
              )}
            </div>

            {/* Bottom actions */}
            <div className="px-3 pb-3 space-y-1 shrink-0 border-t border-white/5 pt-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-full flex items-center gap-2 text-gray-600 hover:text-white text-xs tracking-wider py-2 px-2 rounded-lg hover:bg-white/5 transition-all"
                >
                  <ArrowLeft size={14} /> BACK TO PORTFOLIO
                </button>
              )}
              {session.role === 'admin' && (
                <button onClick={onAdminPanel} className="w-full flex items-center gap-2 text-gray-500 hover:text-red-400 text-xs tracking-wider py-2 px-2 rounded-lg hover:bg-red-950/20 transition-all">
                  <Shield size={14} /> ADMIN PANEL
                </button>
              )}
              <button
                onClick={() => { logout(); onLogout(); }}
                className="w-full flex items-center gap-2 text-gray-600 hover:text-white text-xs tracking-wider py-2 px-2 rounded-lg hover:bg-white/5 transition-all"
              >
                <LogOut size={14} /> LOGOUT
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-black/20 backdrop-blur-md shrink-0">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-white transition-colors shrink-0">
              <Menu size={18} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {activeChat?.title || <span className="text-gray-500">New Chat</span>}
            </p>
          </div>
          {selectedModel && (
            <span className="text-xs text-gray-500 border border-white/10 rounded-lg px-2 py-1 shrink-0 hidden sm:block">
              {selectedModel.displayName}
            </span>
          )}
          {session.role === 'admin' && (
            <button onClick={onAdminPanel} className="text-gray-500 hover:text-red-400 transition-colors shrink-0 p-1">
              <Settings size={16} />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" onClick={() => setModelDropOpen(false)}>
          {/* Empty state */}
          {!hasContent && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-800/30 flex items-center justify-center mx-auto mb-4">
                  <Brain className="text-red-500" size={28} />
                </div>
                <h2 className="text-white font-bold tracking-widest text-xl mb-1">
                  NERD<span className="text-red-500">AI</span>
                </h2>
                <p className="text-gray-500 text-sm mb-2">Hello, <span className="text-red-400">{session.username}</span></p>
                <p className="text-gray-600 text-sm mb-8">{settings.welcomeMessage}</p>

                {models.length === 0 ? (
                  <div className="bg-zinc-950/80 border border-red-900/30 rounded-2xl p-5 max-w-sm mx-auto">
                    <p className="text-red-400 text-sm">No models configured.</p>
                    {session.role === 'admin' && (
                      <button onClick={onAdminPanel} className="mt-3 text-xs text-gray-400 hover:text-white underline">
                        Go to Admin Panel to add models
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                    {EXAMPLE_PROMPTS.map((prompt, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 + 0.3 }}
                        onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                        className="bg-zinc-950/60 border border-white/10 hover:border-red-800/50 rounded-2xl p-4 text-left text-sm text-gray-400 hover:text-gray-200 transition-all hover:bg-red-950/10"
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {displayMessages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-red-600/10 border border-red-800/30 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                    <Brain size={14} className="text-red-500" />
                  </div>
                )}
                <div className={`relative max-w-[80%] ${msg.role === 'user' ? 'max-w-[70%]' : 'max-w-[85%]'}`}>
                  <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-red-900/30 border border-red-800/40 text-gray-200' : 'bg-black/40 backdrop-blur-sm border border-white/10 text-gray-300'}`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                      <MarkdownContent content={msg.content} />
                    )}
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyMessage(msg.content, msg.id)}
                      className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-white p-1"
                    >
                      {copiedId === msg.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming message */}
          {(isLoading || streamingContent) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="w-7 h-7 rounded-lg bg-red-600/10 border border-red-800/30 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                <Brain size={14} className="text-red-500" />
              </div>
              <div className="bg-zinc-950/80 border border-white/5 rounded-2xl px-4 py-3 max-w-[85%]">
                {streamingContent ? (
                  <div>
                    <MarkdownContent content={streamingContent} />
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.7 }}
                      className="inline-block w-0.5 h-4 bg-red-500 ml-0.5 align-middle"
                    />
                  </div>
                ) : (
                  <ThinkingDots />
                )}
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center"
            >
              <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-xs rounded-xl px-4 py-2 flex items-center gap-2">
                <X size={12} /> {error}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t border-white/8 bg-black/20 backdrop-blur-md shrink-0">
          <div className="flex items-end gap-2 bg-black/60 border border-white/10 focus-within:border-red-600/50 rounded-2xl px-3 py-2 transition-all duration-300">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={models.length === 0 ? 'No model selected...' : 'Message NerdAI... (Enter to send, Shift+Enter for new line)'}
              disabled={isLoading || models.length === 0}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none resize-none text-sm py-1 max-h-32 overflow-y-auto"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || models.length === 0}
              className="shrink-0 w-8 h-8 rounded-xl bg-red-600/80 hover:bg-red-600 disabled:bg-red-900/20 disabled:cursor-not-allowed flex items-center justify-center transition-all mb-0.5"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <Send size={14} className="text-white" />
              )}
            </button>
          </div>
          <p className="text-center text-gray-700 text-xs mt-1.5 tracking-wider">
            NerdAI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
