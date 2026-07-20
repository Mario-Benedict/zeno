import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import LlmChatComposer from '@/components/llm-chat/LlmChatComposer';
import LlmChatMessageList from '@/components/llm-chat/LlmChatMessageList';
import LlmChatSidebar from '@/components/llm-chat/LlmChatSidebar';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import AppLayout from '@/layouts/AppLayout';
import { projectPath } from '@/lib/accountRoutes';
import type { LlmMessage, LlmSession } from '@/types/llm-chat';

interface Props {
  sessions: LlmSession[];
  session?: LlmSession;
  messages?: LlmMessage[];
}

const LlmChatIndex = ({ sessions, session, messages = [] }: Props) => {
  const { t } = useTranslation();
  const { project, accountIndex } = useProject();
  const { data, setData, post, processing, reset } = useForm({ question: '' });

  // Optimistic user bubble shown while the API call is in flight.
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

  // ID of the model message that should typewriter-animate on arrival.
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  // Reset animation state when the user navigates to a different session,
  // so existing messages from another conversation don't re-animate on revisit.
  // This is the React-recommended "adjust state on prop change during render"
  // pattern — no Effect needed, no cascading-render lint warning.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const currentSessionId = session?.llm_chat_session_id;
  const [trackedSessionId, setTrackedSessionId] = useState(currentSessionId);
  if (trackedSessionId !== currentSessionId) {
    setTrackedSessionId(currentSessionId);
    setAnimatingId(null);
  }

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    const question = data.question.trim();
    if (!question) return;

    setPendingQuestion(question);

    const url = session
      ? projectPath(
          accountIndex,
          project.project_slug,
          `/llm-chat/${session.llm_chat_session_id}/reply`,
        )
      : projectPath(accountIndex, project.project_slug, '/llm-chat');

    post(url, {
      onSuccess: (page) => {
        reset();
        // The server has just persisted the new model reply — find it in the
        // fresh props (event-handler context, not an Effect) and flag it for
        // the typewriter.
        const fresh =
          (page.props as { messages?: LlmMessage[] }).messages ?? [];
        const last = fresh[fresh.length - 1];
        if (last?.role === 'model') {
          setAnimatingId(last.llm_chat_message_id);
        }
      },
      onFinish: () => setPendingQuestion(null),
    });
  };

  // Show the message list whenever we have either real messages or a pending
  // optimistic one — the empty state should disappear the instant Send is hit.
  const hasContent = messages.length > 0 || pendingQuestion !== null;

  return (
    <>
      <Head
        title={`${session?.llm_chat_session_name ?? t('llmChat.defaultTitle')} - ${project.project_name}`}
      />

      <AppLayout project={project}>
        <div className="flex h-full w-full gap-2 overflow-hidden p-2">
          <LlmChatSidebar
            sessions={sessions}
            activeSessionId={session?.llm_chat_session_id}
          />

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-dark-surface-2">
            {/* Session title divider */}
            {session && (
              <div className="shrink-0 px-6 pt-5 pb-3">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-dark-border" />
                  <h2 className="text-sm font-semibold text-dark-primary">
                    {session.llm_chat_session_name}
                  </h2>
                  <div className="h-px flex-1 bg-dark-border" />
                </div>
              </div>
            )}

            {/* Content — messages OR empty state */}
            {hasContent ? (
              <LlmChatMessageList
                messages={messages}
                optimisticUser={processing ? pendingQuestion : null}
                isThinking={processing}
                animatingId={animatingId}
                onAnimationDone={() => setAnimatingId(null)}
              />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center select-none">
                <p className="mb-1 text-sm font-medium text-dark-secondary">
                  {t('llmChat.whereShouldWeStart')}
                </p>
                <p className="text-4xl font-bold text-dark-primary">
                  {t('llmChat.askMeAnything')}
                </p>
              </div>
            )}

            <LlmChatComposer
              value={data.question}
              onChange={(v) => setData('question', v)}
              onSubmit={handleSubmit}
              disabled={processing}
            />
          </main>
        </div>
      </AppLayout>
    </>
  );
};

export default LlmChatIndex;
