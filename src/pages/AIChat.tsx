// ponytail: module-level variable for cross-page initial prompt
let _pendingChatPrompt = ''
export function setPendingChatPrompt(text: string) { _pendingChatPrompt = text }
export function getPendingChatPrompt() { const t = _pendingChatPrompt; _pendingChatPrompt = ''; return t }

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useResumeStore } from '@/stores/resumeStore';
import {
  buildChatPrompt,
  extractToolCalls,
  buildInterviewPrompt,
  INTERVIEW_ROLES,
  ROLE_LABELS,
  ROLE_ICONS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
} from '@/lib/ai/prompts';
import type { InterviewRole } from '@/lib/ai/prompts';
import { streamAI, isAIConfigured } from '@/lib/ai/stream';
import toast from '@/lib/toast';

interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
  id: string;
}

const suggestions = ['优化项目描述', 'JD匹配建议', '语法检查', '翻译', '生成求职信', '模拟面试'];

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');

  // Pick up pending prompt from CareerTools navigation
  useEffect(() => {
    const p = getPendingChatPrompt()
    if (p) {
      setInputText(p)
      if (p.includes('模拟面试')) setShowInterviewPanel(true)
    }
  }, [])
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Interview mode state
  const [showInterviewPanel, setShowInterviewPanel] = useState(false);
  const [selectedRole, setSelectedRole] = useState<InterviewRole | null>(null);
  const [questionCount, setQuestionCount] = useState(0);

  const resumes = useResumeStore((s) => s.resumes);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const updateSectionContent = useResumeStore((s) => s.updateSectionContent);
  const activeResume = resumes.find((r) => r.id === activeResumeId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Process tool calls embedded in AI response
  const processToolCalls = useCallback(
    (text: string) => {
      const toolCalls = extractToolCalls(text);
      let executedCount = 0;

      for (const tc of toolCalls) {
        if (tc.tool === 'rewriteSection' && activeResume) {
          const params = tc.params as { sectionType?: string; content?: Record<string, unknown> };
          if (params.sectionType && params.content) {
            const section = activeResume.sections.find(
              (s) => s.type === params.sectionType,
            );
            if (section) {
              updateSectionContent(section.id, params.content);
              executedCount++;
            }
          }
        }
      }

      if (executedCount > 0) {
        toast.success(`已自动更新 ${executedCount} 个简历模块。`);
      }
    },
    [activeResume, updateSectionContent],
  );

  // ---------------------------------------------------------------------------
  // Core send logic — shared by normal chat and interview mode
  // ---------------------------------------------------------------------------
  const sendMessage = useCallback(
    async (text: string, options?: { interviewRole?: InterviewRole }) => {
      if (!text || isSending) return;

      if (!isAIConfigured()) {
        toast.warning('请先在「设置」页面配置 AI 提供商和 API 密钥。');
        return;
      }

      const effectiveRole = options?.interviewRole ?? selectedRole;

      const userMsg: ChatMessage = {
        role: 'user',
        id: `u-${Date.now()}`,
        content: text,
      };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInputText('');
      setIsSending(true);

      // Create placeholder AI message for streaming
      const aiMsgId = `a-${Date.now()}`;
      setStreamingMessageId(aiMsgId);
      setStreamingContent('');

      // Build chat history for the AI context (before adding the new message)
      const chatHistory = messages.map((m) => ({
        role: m.role as 'user' | 'ai',
        content: m.content,
      }));

      // Build AI messages depending on mode
      let aiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[];

      if (effectiveRole) {
        // Interview mode — use interview system prompt
        setQuestionCount((prev) => prev + 1);
        const { system } = buildInterviewPrompt(
          activeResume || null,
          effectiveRole,
          text,
        );
        aiMessages = [
          { role: 'system' as const, content: system },
          ...chatHistory.slice(-20).map((m) => ({
            role: m.role === 'ai' ? ('assistant' as const) : ('user' as const),
            content: m.content,
          })),
          { role: 'user' as const, content: text },
        ];
      } else {
        // Normal chat mode
        const {
          system,
          messages: promptMessages,
        } = buildChatPrompt(activeResume || null, chatHistory, text);
        aiMessages = [
          { role: 'system' as const, content: system },
          ...promptMessages,
        ];
      }

      let fullText = '';

      streamAI(aiMessages, {
        onToken: (token) => {
          fullText += token;
          setStreamingContent(fullText);
        },
        onDone: (finalText) => {
          // Add the completed message
          const finalMessage: ChatMessage = {
            role: 'ai',
            id: aiMsgId,
            content: finalText,
          };
          setMessages((prev) => [...prev, finalMessage]);
          setStreamingMessageId(null);
          setStreamingContent('');
          setIsSending(false);

          // Process any tool calls in the response
          processToolCalls(finalText);
        },
        onError: (err) => {
          const errorMsg: ChatMessage = {
            role: 'ai',
            id: aiMsgId,
            content: `抱歉，我遇到了一些问题：${err.message}`,
          };
          setMessages((prev) => [...prev, errorMsg]);
          setStreamingMessageId(null);
          setStreamingContent('');
          setIsSending(false);
          toast.error('AI 响应失败，请检查配置后重试。');
        },
      });
    },
    [messages, isSending, selectedRole, activeResume, processToolCalls],
  );

  // ---------------------------------------------------------------------------
  // Send handler
  // ---------------------------------------------------------------------------
  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    // If not already in interview mode, detect "模拟面试" intent
    if (!selectedRole && text.includes('模拟面试')) {
      setShowInterviewPanel(true);
      setInputText('');
      return;
    }

    sendMessage(text);
  };

  // ---------------------------------------------------------------------------
  // Interview controls
  // ---------------------------------------------------------------------------
  const handleRoleSelect = (role: InterviewRole) => {
    setSelectedRole(role);
    setShowInterviewPanel(true);
    sendMessage(`开始${ROLE_LABELS[role]}模拟面试`, { interviewRole: role });
  };

  const switchRole = () => {
    setSelectedRole(null);
    setQuestionCount(0);
  };

  const endInterview = () => {
    setSelectedRole(null);
    setShowInterviewPanel(false);
    setQuestionCount(0);
  };

  // ---------------------------------------------------------------------------
  // Suggestion handler
  // ---------------------------------------------------------------------------
  const handleSuggestion = (text: string) => {
    if (text === '模拟面试') {
      setShowInterviewPanel(true);
      return;
    }
    const suggestionTexts: Record<string, string> = {
      '优化项目描述': '请帮我优化项目描述，用 STAR 法则重写并量化成果。',
      'JD匹配建议': '请帮我分析当前简历与目标职位的匹配度。',
      '语法检查': '请帮我检查简历中的语法和措辞问题。',
      '翻译': '请将我的简历翻译成英文。',
      '生成求职信': '请根据我的简历和当前求职方向生成一封求职信。',
    };
    setInputText(suggestionTexts[text] || text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatContent = (content: string) => {
    // Simple markdown-like rendering: bold with ** **
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      className="flex-1 p-8 overflow-y-auto flex gap-6"
      style={{ backgroundColor: '#F8F7F4' }}
    >
      {/* ── Interview Panel ── */}
      {showInterviewPanel && (
        <div className="w-60 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sticky top-0">
            {/* Panel header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                <i className="ph-light ph-chats text-sm text-rose-500" />
              </div>
              <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>
                模拟面试
              </span>
            </div>

            {selectedRole ? (
              /* ── Active interview state ── */
              <div>
                {/* Current role badge */}
                <div className="text-xs text-slate-400 mb-2">当前面试官</div>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${ROLE_COLORS[selectedRole].bg} ${ROLE_COLORS[selectedRole].text} mb-4`}
                >
                  <i className={`${ROLE_ICONS[selectedRole]} text-sm`} />
                  {ROLE_LABELS[selectedRole]}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-3" />

                {/* Question count */}
                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="text-slate-400">已提问</span>
                  <span className="font-semibold" style={{ color: '#1E293B' }}>
                    {questionCount} 个问题
                  </span>
                </div>

                {/* Controls */}
                <div className="space-y-2">
                  <button
                    onClick={switchRole}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-200 flex items-center justify-center gap-1.5"
                  >
                    <i className="ph-light ph-swap text-sm" />
                    切换角色
                  </button>
                  <button
                    onClick={endInterview}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all duration-200 flex items-center justify-center gap-1.5"
                  >
                    <i className="ph-light ph-x-circle text-sm" />
                    结束面试
                  </button>
                </div>
              </div>
            ) : (
              /* ── Role selector ── */
              <div>
                <div className="text-xs text-slate-400 mb-3">选择面试官角色</div>
                <div className="space-y-2">
                  {INTERVIEW_ROLES.map((role) => {
                    const colors = ROLE_COLORS[role];
                    return (
                      <button
                        key={role}
                        onClick={() => handleRoleSelect(role)}
                        className={`w-full text-left p-3 rounded-xl border border-slate-100 ${colors.bg} ${colors.ring} transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98]`}
                      >
                        <div className="flex items-center gap-2">
                          <i
                            className={`${ROLE_ICONS[role]} text-base ${colors.text}`}
                          />
                          <span
                            className={`text-xs font-semibold ${colors.text}`}
                          >
                            {ROLE_LABELS[role]}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed pl-6">
                          {ROLE_DESCRIPTIONS[role]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Chat Area ── */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-600 mb-3">
            <i className="ph-light ph-chats-circle text-sm" />
            AI Assistant
          </span>
          <h1 className="text-2xl font-bold mb-1 font-display" style={{ color: '#1E293B' }}>
            AI 简历助手
          </h1>
          <p className="text-slate-500 text-sm">
            与 AI 助手实时对话，进行简历润色、面试模拟、职业规划咨询。
          </p>
        </div>

        {/* Chat container */}
        <div
          className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col"
          style={{ height: 'calc(100vh - 240px)' }}
        >
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.length === 0 && !isSending && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                  <i className="ph-light ph-chats-circle text-3xl text-violet-400" />
                </div>
                <p className="text-sm text-slate-400 max-w-xs">
                  你好！我是 AI 简历助手，无论你从事什么行业，我都可以帮你优化简历内容、分析 JD 匹配度、润色工作描述、检查语法问题，甚至帮你生成求职信。有什么需要帮助的吗？
                </p>
                <p className="text-xs text-slate-300 mt-3">
                  {activeResume
                    ? `当前简历: ${activeResume.title}`
                    : '请先在编辑器中创建简历以获取个性化建议。'}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'ai'
                      ? 'bg-teal-50 text-teal-500'
                      : 'bg-sky-50 text-sky-500'
                  }`}
                >
                  <i
                    className={`ph-light text-base ${msg.role === 'ai' ? 'ph-robot' : 'ph-user-circle'}`}
                  />
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'ai'
                      ? 'bg-teal-50 text-slate-700 rounded-tl-sm'
                      : 'bg-sky-50 text-slate-700 rounded-tr-sm'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <br />}
                      {formatContent(line)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streamingMessageId && streamingContent && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <i className="ph-light ph-robot text-base text-teal-500" />
                </div>
                <div
                  className="max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-teal-50 text-slate-700 rounded-tl-sm"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {streamingContent.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <br />}
                      {formatContent(line)}
                    </React.Fragment>
                  ))}
                  <span className="inline-block w-1.5 h-4 bg-teal-500 ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            {/* Typing indicator (shown before streaming starts) */}
            {isSending && !streamingContent && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <i className="ph-light ph-robot text-base text-teal-500" />
                </div>
                <div className="bg-teal-50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips */}
          <div className="px-5 pb-3 flex items-center gap-2 flex-wrap border-b border-slate-100">
            {suggestions.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSuggestion(chip)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 border border-slate-200"
              >
                <i className="ph-light ph-plus text-xs" />
                {chip}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div className="p-4 flex items-center gap-3">
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 flex-shrink-0">
              <i className="ph-light ph-paperclip text-lg" />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的问题..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all duration-200"
                style={{ color: '#1E293B', backgroundColor: '#F8F7F4' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.95] flex-shrink-0"
              style={{ backgroundColor: '#14b8a6' }}
            >
              <i className="ph-light ph-arrow-right text-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
