import { Head, router, usePage, useForm } from '@inertiajs/react';
import React, { useEffect, useRef } from 'react';
import AppLayout from '@/layouts/AppLayout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
    ArrowUp: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="21" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
        </svg>
    ),
};


// ─── Types ────────────────────────────────────────────────────────────────────

interface LlmSession {
    llm_chat_session_id: string;
    llm_chat_session_name: string;
}

interface LlmMessage {
    llm_chat_message_id: string;
    role: 'user' | 'model';
    content: string;
}

interface Project {
    project_id: string;
    project_name: string;
    project_slug: string;
}

interface LlmChatIndexProps {
    project: Project;
    sessions?: LlmSession[];
    content?: LlmMessage[];
    llm_chat_session_id?: string;
    activeSession?: LlmSession;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LlmChatIndex({
    project,
    sessions = [],
    content = [],
    llm_chat_session_id,
    activeSession,
}: LlmChatIndexProps) {
    const { auth } = usePage().props as any;

    const {
        data: newChatData,
        setData: setNewChatData,
        post: postNewChat,
        processing: newChatProcessing,
        reset: resetNewChat,
    } = useForm({ question: '' });

    const {
        data: replyData,
        setData: setReplyData,
        post: postReply,
        processing: replyProcessing,
        reset: resetReply,
    } = useForm({ question: '' });

    const isProcessing = newChatProcessing || replyProcessing;

    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [content]);

    const handleNewChat = (e: React.FormEvent) => {
        e.preventDefault();
        postNewChat(`/p/${project.project_slug}/llmchat/new`, {
            onSuccess: () => resetNewChat(),
        });
    };

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        postReply(`/p/${project.project_slug}/llmchat/${llm_chat_session_id}/reply`, {
            onSuccess: () => resetReply(),
        });
    };

    const handleNewChatClick = () => {
        router.get(`/p/${project.project_slug}/llmchat`);
    };

    return (
        <>
            <Head title="LLM Chat" />

            <AppLayout project={project}>
                {/* ── Wrapper: full height row, small gap, small padding ── */}
                <div className="flex h-full w-full gap-2 p-2 bg-dark-surface-1 select-none overflow-hidden">

                        {/* ── Left Sidebar — fixed 264px per Figma ── */}
                        <aside className="flex shrink-0 flex-col overflow-hidden rounded-xl bg-dark-surface-2" style={{ width: '264px' }}>

                            {/* New Chat button */}
                            <div className="px-4 pt-4 pb-3">
                                <button
                                    type="button"
                                    onClick={handleNewChatClick}
                                    className="w-full rounded-lg bg-dark-surface-3 px-4 py-2.5 text-left text-sm text-dark-secondary transition-colors hover:bg-status-info hover:text-white"
                                >
                                    New Chat
                                </button>
                            </div>

                            {/* Thin separator */}
                            <div className="mx-4 h-px bg-white/[0.06]" />

                            {/* Section label */}
                            <p className="px-4 pt-3 pb-2 text-xs font-semibold tracking-wider text-dark-secondary uppercase">
                                Chats
                            </p>

                            {/* Session list */}
                            <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
                                {sessions.length === 0 ? (
                                    <div className="flex h-full items-center justify-center py-8">
                                        <p className="text-center text-sm text-dark-secondary">No chats yet.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-0.5">
                                        {sessions.map((session) => {
                                            const isActive = session.llm_chat_session_id === llm_chat_session_id;
                                            return (
                                                <button
                                                    key={session.llm_chat_session_id}
                                                    type="button"
                                                    onClick={() =>
                                                        router.get(
                                                            `/p/${project.project_slug}/llmchat/${session.llm_chat_session_id}`,
                                                        )
                                                    }
                                                    className={`w-full truncate rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                                        isActive
                                                            ? 'bg-status-info text-white'
                                                            : 'text-dark-secondary hover:bg-status-info hover:text-white'
                                                    }`}
                                                >
                                                    {session.llm_chat_session_name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </aside>

                        {/* ── Right Chat Pane — fills remaining space ── */}
                        <main className="relative flex flex-1 min-w-0 flex-col overflow-hidden rounded-xl bg-dark-surface-2">

                            {/* Chat session title with thin horizontal lines */}
                            {llm_chat_session_id && activeSession && (
                                <div className="shrink-0 px-8 pt-6 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-px flex-1 bg-white/[0.06]" />
                                        <h2 className="text-sm font-semibold text-dark-primary">
                                            {activeSession.llm_chat_session_name}
                                        </h2>
                                        <div className="h-px flex-1 bg-white/[0.06]" />
                                    </div>
                                </div>
                            )}

                            {/* Messages area */}
                            <div className="flex flex-1 flex-col overflow-y-auto px-8 custom-scrollbar min-h-0">
                                <div className="mx-auto w-full max-w-3xl flex flex-col flex-1 h-full">

                                    {/* Empty state — centered in full height */}
                                    {(!content || content.length === 0) && (
                                        <div className="flex flex-1 flex-col items-center justify-center h-full">
                                            <div className="mb-8 text-center">
                                                <p className="mb-1 text-sm font-medium text-dark-secondary">
                                                    Hi, {auth.user?.name?.split(' ')[0] || 'there'}
                                                </p>
                                                <p className="text-4xl font-bold text-dark-primary">
                                                    Where should we start?
                                                </p>
                                            </div>

                                            {/* Input centered */}
                                            <form
                                                onSubmit={llm_chat_session_id ? handleReply : handleNewChat}
                                                className="relative w-full max-w-2xl"
                                            >
                                                <input
                                                    type="text"
                                                    placeholder="Ask anything"
                                                    autoComplete="off"
                                                    disabled={isProcessing}
                                                    value={llm_chat_session_id ? replyData.question : newChatData.question}
                                                    onChange={(e) =>
                                                        llm_chat_session_id
                                                            ? setReplyData('question', e.target.value)
                                                            : setNewChatData('question', e.target.value)
                                                    }
                                                    className="h-12 w-full rounded-xl border border-dark-border bg-dark-input pl-4 pr-12 text-sm text-dark-primary outline-none placeholder:text-dark-secondary focus:border-dark-border-focus focus:bg-dark-input-focus transition-colors"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={
                                                        isProcessing ||
                                                        (llm_chat_session_id
                                                            ? !replyData.question.trim()
                                                            : !newChatData.question.trim())
                                                    }
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-dark-primary text-dark-surface-1 transition-opacity hover:opacity-80 disabled:opacity-40"
                                                >
                                                    <Icons.ArrowUp />
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {/* Messages */}
                                    {content && content.length > 0 && (
                                        <div className="space-y-4 pt-4 pb-6">
                                            {content.map((msg) => (
                                                <div
                                                    key={msg.llm_chat_message_id}
                                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                                            msg.role === 'user'
                                                                ? 'rounded-tr-sm bg-dark-surface-3 text-dark-primary'
                                                                : 'rounded-tl-sm border border-white/[0.06] bg-dark-surface-3 text-dark-primary'
                                                        }`}
                                                    >
                                                        {msg.role === 'user' ? (
                                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                                        ) : (
                                                            <div className="prose-chat">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {msg.content}
                                                                </ReactMarkdown>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={chatEndRef} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Floating bottom input (only when messages exist) */}
                            {content && content.length > 0 && (
                                <div className="shrink-0 px-8 pb-5 pt-3 bg-dark-surface-2">
                                    <div className="mx-auto w-full max-w-3xl">
                                        <form onSubmit={handleReply} className="relative">
                                            <input
                                                type="text"
                                                placeholder="Ask anything..."
                                                autoComplete="off"
                                                disabled={isProcessing}
                                                value={replyData.question}
                                                onChange={(e) => setReplyData('question', e.target.value)}
                                                className="h-12 w-full rounded-xl border border-dark-border bg-dark-input pl-4 pr-12 text-sm text-dark-primary outline-none placeholder:text-dark-secondary focus:border-dark-border-focus focus:bg-dark-input-focus transition-colors"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isProcessing || !replyData.question.trim()}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-dark-primary text-dark-surface-1 transition-opacity hover:opacity-80 disabled:opacity-40"
                                            >
                                                <Icons.ArrowUp />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </main>
                </div>
            </AppLayout>

            <style dangerouslySetInnerHTML={{
                __html: `
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #333; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #444; }

                    /* Markdown prose styles for model messages */
                    .prose-chat { font-size: 0.875rem; line-height: 1.65; color: inherit; }
                    .prose-chat p { margin: 0 0 0.75em 0; }
                    .prose-chat p:last-child { margin-bottom: 0; }
                    .prose-chat h1, .prose-chat h2, .prose-chat h3,
                    .prose-chat h4, .prose-chat h5, .prose-chat h6 {
                        font-weight: 700;
                        margin: 1em 0 0.4em 0;
                        line-height: 1.3;
                        color: inherit;
                    }
                    .prose-chat h1 { font-size: 1.2em; }
                    .prose-chat h2 { font-size: 1.1em; }
                    .prose-chat h3 { font-size: 1em; }
                    .prose-chat strong { font-weight: 700; color: inherit; }
                    .prose-chat em { font-style: italic; }
                    .prose-chat ul { list-style: disc; padding-left: 1.4em; margin: 0.5em 0; }
                    .prose-chat ol { list-style: decimal; padding-left: 1.4em; margin: 0.5em 0; }
                    .prose-chat li { margin: 0.25em 0; }
                    .prose-chat code {
                        background: rgba(255,255,255,0.08);
                        border-radius: 4px;
                        padding: 0.15em 0.4em;
                        font-family: 'JetBrains Mono', 'Fira Code', monospace;
                        font-size: 0.85em;
                    }
                    .prose-chat pre {
                        background: rgba(0,0,0,0.3);
                        border: 1px solid rgba(255,255,255,0.08);
                        border-radius: 8px;
                        padding: 0.75em 1em;
                        overflow-x: auto;
                        margin: 0.75em 0;
                    }
                    .prose-chat pre code {
                        background: none;
                        padding: 0;
                        font-size: 0.82em;
                        line-height: 1.6;
                    }
                    .prose-chat blockquote {
                        border-left: 3px solid rgba(255,255,255,0.2);
                        padding-left: 0.75em;
                        margin: 0.5em 0;
                        opacity: 0.8;
                    }
                    .prose-chat hr { border-color: rgba(255,255,255,0.1); margin: 0.75em 0; }
                    .prose-chat a { color: #60a5fa; text-decoration: underline; }
                    .prose-chat table { width: 100%; border-collapse: collapse; margin: 0.75em 0; font-size: 0.85em; }
                    .prose-chat th { background: rgba(255,255,255,0.08); padding: 0.4em 0.75em; text-align: left; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); }
                    .prose-chat td { padding: 0.4em 0.75em; border: 1px solid rgba(255,255,255,0.08); }
                `,
            }} />
        </>
    );
}
