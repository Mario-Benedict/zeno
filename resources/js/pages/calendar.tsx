import { Head, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { EventDetailModal } from '@/components/calendar/EventDetailModal';
import { EventFormModal } from '@/components/calendar/EventFormModal';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { RecurrenceEditDialog } from '@/components/calendar/RecurrenceEditDialog';
import { WeekGrid } from '@/components/calendar/WeekGrid';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTranslation } from '@/hooks/useTranslation';
import AppLayout from '@/layouts/AppLayout';
import { projectPath } from '@/lib/accountRoutes';
import { inertiaJson } from '@/lib/inertiaJson';
import type {
  CalendarProps,
  CalendarViewMode,
  CalendarMember,
  AnyCalendarEvent,
  CalendarEventFull,
} from '@/types/calendar';

export default function Calendar({
  project,
  projectRole,
  projectUsers,
  cardLabels,
  currentUser,
}: CalendarProps) {
  const { t } = useTranslation();
  const accountIndex = usePage().props.account.index;

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Member checkboxes
  const [members, setMembers] = useState<CalendarMember[]>(() =>
    projectUsers.map((u) => ({ ...u, checked: true })),
  );

  // Label legend doubles as a filter (click a pill to show/hide).
  const [hiddenLabelIds, setHiddenLabelIds] = useState<Set<string>>(
    () => new Set(),
  );

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<AnyCalendarEvent | null>(
    null,
  );

  // Pending action for recurrence dialog
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete';
    event: CalendarEventFull;
    scope?: 'single' | 'all';
  } | null>(null);

  // Calculate view boundaries
  const viewBounds = useMemo(() => {
    const start = new Date(currentDate);
    let end: Date;

    if (viewMode === 'month') {
      start.setDate(1);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);

      // Pad to cover grid overflow
      start.setDate(start.getDate() - 7);
      end.setDate(end.getDate() + 7);
    } else {
      start.setDate(start.getDate() - start.getDay()); // Sunday
      end = new Date(start);
      end.setDate(end.getDate() + 6); // Saturday, derived from corrected start
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, [currentDate, viewMode]);

  // Hook handles data fetching and realtime updates
  const { events, loading, refetch } = useCalendarEvents(
    accountIndex,
    project.project_slug,
    project.project_id,
    currentUser.id,
    viewBounds.start,
    viewBounds.end,
    members,
  );

  // Apply the label filter. Classified busy-blocks and unlabeled events are
  // always shown; a labeled event shows if at least one of its labels is
  // still visible.
  const visibleEvents = useMemo(
    () =>
      events.filter((ev) => {
        if (ev.is_classified || ev.labels.length === 0) return true;
        return ev.labels.some((l) => !hiddenLabelIds.has(l.card_label_id));
      }),
    [events, hiddenLabelIds],
  );

  // --- Handlers ---

  const handleToggleLabel = (labelId: string) => {
    setHiddenLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(labelId)) next.delete(labelId);
      else next.add(labelId);
      return next;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const handlePrevWeek = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleToggleMember = (id: number) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m)),
    );
  };

  const handleCreate = () => {
    setSelectedDate(currentDate);
    setSelectedEvent(null);
    setFormOpen(true);
  };

  const handleGridDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setFormOpen(true);
  };

  const handleEventClick = (event: AnyCalendarEvent) => {
    setSelectedEvent(event);
    setDetailOpen(true);
  };

  const handleEditClick = () => {
    setDetailOpen(false);
    if (!selectedEvent || selectedEvent.is_classified) return;

    if (selectedEvent.recurrence !== 'none') {
      setPendingAction({
        type: 'edit',
        event: selectedEvent as CalendarEventFull,
      });
      setRecurrenceDialogOpen(true);
    } else {
      setFormOpen(true);
    }
  };

  const handleDeleteClick = () => {
    setDetailOpen(false);
    if (!selectedEvent || selectedEvent.is_classified) return;

    if (selectedEvent.recurrence !== 'none') {
      setPendingAction({
        type: 'delete',
        event: selectedEvent as CalendarEventFull,
      });
      setRecurrenceDialogOpen(true);
    } else {
      if (confirm(t('calendar.deleteScheduleConfirm'))) {
        submitDelete(selectedEvent as CalendarEventFull, 'single');
      }
    }
  };

  const handleRecurrenceConfirm = (scope: 'single' | 'all') => {
    setRecurrenceDialogOpen(false);
    if (!pendingAction) return;

    if (pendingAction.type === 'edit') {
      // For single edit of recurring event, we need the original event ID and the occurrence date
      setPendingAction({ ...pendingAction, scope });
      setSelectedEvent(pendingAction.event);
      setFormOpen(true);
    } else {
      submitDelete(pendingAction.event, scope);
    }

    // setPendingAction(null) is called later so Form has access to it if editing
  };

  // --- API Submitters ---

  const submitSave = async (data: Record<string, unknown>) => {
    try {
      if (selectedEvent && !selectedEvent.is_classified) {
        // Edit existing
        const payload: Record<string, unknown> = { ...data };
        const isRecurring = selectedEvent.recurrence !== 'none';

        // Use original ID if it's a virtual instance, otherwise the event ID
        const targetId = selectedEvent.original_event_id || selectedEvent.id;
        const basePath = projectPath(
          accountIndex,
          project.project_slug,
          '/calendar/events',
        );

        if (isRecurring && pendingAction?.scope) {
          payload.scope = pendingAction.scope;
          if (pendingAction.scope === 'single') {
            payload.occurrence_date = selectedEvent.start_time; // pass the exact instance date
          }
        }

        await inertiaJson('patch', `${basePath}/${targetId}`, {
          data: payload,
        });
      } else {
        // Create new
        await inertiaJson(
          'post',
          projectPath(accountIndex, project.project_slug, '/calendar/events'),
          { data },
        );
      }
      refetch();
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setPendingAction(null);
    }
  };

  const submitDelete = async (
    ev: CalendarEventFull,
    scope: 'single' | 'all',
  ) => {
    try {
      const targetId = ev.original_event_id || ev.id;
      const occurrence_date =
        scope === 'single' && ev.recurrence !== 'none'
          ? ev.start_time
          : undefined;
      await inertiaJson(
        'delete',
        projectPath(
          accountIndex,
          project.project_slug,
          `/calendar/events/${targetId}`,
        ),
        {
          data: { scope, occurrence_date },
        },
      );
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setPendingAction(null);
    }
  };

  // Auth checks
  const canEditSelectedEvent = () => {
    if (!selectedEvent || selectedEvent.is_classified) return false;
    // Kanban-sourced entries are read-only from Calendar — editing happens
    // on the board, where the assignment/date actually lives.
    if (selectedEvent.is_kanban_task) return false;
    if (projectRole === 'OWNER' || projectRole === 'ADMIN') return true;
    return (
      selectedEvent.created_by === currentUser.id ||
      selectedEvent.participants.some((p) => p.id === currentUser.id)
    );
  };

  return (
    <AppLayout project={project}>
      <Head title={`${t('calendar.pageTitle')} - ${project.project_name}`} />

      <div className="flex h-full w-full gap-3 bg-dark-surface-1">
        <CalendarSidebar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onRefresh={refetch}
          isLoading={loading}
          onCreate={handleCreate}
          currentDate={currentDate}
          onDateSelect={setCurrentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          members={members}
          onToggleMember={handleToggleMember}
          events={visibleEvents}
          cardLabels={cardLabels}
          hiddenLabelIds={hiddenLabelIds}
          onToggleLabel={handleToggleLabel}
        />

        <div className="relative flex flex-1 flex-col overflow-hidden">
          {viewMode === 'month' ? (
            <MonthGrid
              currentDate={currentDate}
              events={visibleEvents}
              members={members}
              onDateClick={handleGridDateClick}
              onEventClick={handleEventClick}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          ) : (
            <WeekGrid
              currentDate={currentDate}
              events={visibleEvents}
              members={members}
              onDateClick={handleGridDateClick}
              onEventClick={handleEventClick}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
            />
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-dark-surface-1/20 backdrop-blur-[1px]">
              {/* Optional spinner */}
            </div>
          )}
        </div>
      </div>

      <EventFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setPendingAction(null);
        }}
        onSubmit={submitSave}
        initialDate={selectedDate}
        eventToEdit={
          selectedEvent && !selectedEvent.is_classified
            ? (selectedEvent as CalendarEventFull)
            : undefined
        }
        members={members}
        cardLabels={cardLabels}
        currentUser={currentUser}
        projectRole={projectRole}
      />

      <EventDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        event={selectedEvent}
        members={members}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        canEdit={canEditSelectedEvent()}
        accountIndex={accountIndex}
        projectSlug={project.project_slug}
      />

      <RecurrenceEditDialog
        isOpen={recurrenceDialogOpen}
        onClose={() => {
          setRecurrenceDialogOpen(false);
          setPendingAction(null);
        }}
        onConfirm={handleRecurrenceConfirm}
        action={pendingAction?.type || 'edit'}
      />
    </AppLayout>
  );
}
