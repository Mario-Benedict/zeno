import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { EventDetailModal } from '@/components/calendar/EventDetailModal';
import { EventFormModal } from '@/components/calendar/EventFormModal';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { RecurrenceEditDialog } from '@/components/calendar/RecurrenceEditDialog';
import { WeekGrid } from '@/components/calendar/WeekGrid';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTranslation } from '@/hooks/useTranslation';
import AppLayout from '@/layouts/AppLayout';
import { projectPath } from '@/lib/accountRoutes';
import { inertiaJson } from '@/lib/inertiaJson';
import type {
  AnyCalendarEvent,
  CalendarEventSourceFilter,
  CalendarEventFull,
  CalendarMember,
  CalendarProps,
  CalendarViewMode,
} from '@/types/calendar';

const Calendar = ({
  project,
  projectRole,
  projectUsers,
  cardLabels,
  currentUser,
  initialDate,
  activeEventId,
}: CalendarProps) => {
  const { t } = useTranslation();
  const accountIndex = usePage().props.account.index;
  const canCreateEvent =
    projectRole === 'OWNER' ||
    projectRole === 'ADMIN' ||
    projectRole === 'MEMBER';

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(() =>
    initialDate ? new Date(`${initialDate}T00:00:00`) : new Date(),
  );

  useEffect(() => {
    if (!initialDate) return;

    // A global-search result can navigate between calendar dates without
    // unmounting this Inertia page, so keep the controlled view in sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentDate(new Date(`${initialDate}T00:00:00`));
  }, [initialDate]);

  // Member checkboxes
  const [members, setMembers] = useState<CalendarMember[]>(() =>
    projectUsers.map((u) => ({ ...u, checked: true })),
  );

  // Label legend doubles as a filter (click a pill to show/hide).
  const [hiddenLabelIds, setHiddenLabelIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [eventSourceFilter, setEventSourceFilter] =
    useState<CalendarEventSourceFilter>('all');

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<AnyCalendarEvent | null>(
    null,
  );
  const openedDeepLinkRef = useRef<string | null>(null);

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
    viewBounds.start,
    viewBounds.end,
    members,
    eventSourceFilter,
  );

  useEffect(() => {
    if (!activeEventId) {
      openedDeepLinkRef.current = null;
      return;
    }

    const deepLinkKey = `${initialDate ?? ''}:${activeEventId}`;
    if (loading || openedDeepLinkRef.current === deepLinkKey) return;

    const event = events.find((candidate) => {
      const matchesId =
        candidate.id === activeEventId ||
        ('original_event_id' in candidate &&
          candidate.original_event_id === activeEventId);
      const matchesDate =
        !initialDate || candidate.start_time.slice(0, 10) === initialDate;

      return matchesId && matchesDate;
    });

    if (!event) return;

    openedDeepLinkRef.current = deepLinkKey;
    // Opening a server-requested deep link intentionally synchronizes modal
    // state after its asynchronously fetched event becomes available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedEvent(event);
    setDetailOpen(true);
  }, [activeEventId, events, initialDate, loading]);

  // The backend applies the same source filter to every event type. Repeating
  // the lightweight source check here prevents the previous request's rows
  // from flashing while a newly selected filter is still loading.
  const visibleEvents = useMemo(
    () =>
      events.filter((event) => {
        const isOwnProject =
          !event.is_classified && event.project_id === project.project_id;
        const sourceVisible =
          eventSourceFilter === 'all' ||
          (eventSourceFilter === 'own' && isOwnProject) ||
          (eventSourceFilter === 'other' && !isOwnProject);

        return (
          sourceVisible &&
          (event.is_classified ||
            event.labels.length === 0 ||
            event.labels.some(
              (label) => !hiddenLabelIds.has(label.card_label_id),
            ))
        );
      }),
    [eventSourceFilter, events, hiddenLabelIds, project.project_id],
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
    setCurrentDate((previous) => {
      const date = new Date(previous);
      date.setDate(date.getDate() - 7);

      return date;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate((previous) => {
      const date = new Date(previous);
      date.setDate(date.getDate() + 7);

      return date;
    });
  };

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
  };

  const handleToggleMember = (id: number) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m)),
    );
  };

  const handleToggleAllMembers = (ids: number[], checked: boolean) => {
    setMembers((prev) =>
      prev.map((m) => (ids.includes(m.id) ? { ...m, checked } : m)),
    );
  };

  const handleCreate = () => {
    if (!canCreateEvent) return;

    setSelectedDate(currentDate);
    setSelectedEvent(null);
    setFormOpen(true);
  };

  const handleGridDateClick = (date: Date) => {
    if (!canCreateEvent) return;

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
      setDeleteConfirmOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    if (!selectedEvent || selectedEvent.is_classified) return;
    submitDelete(selectedEvent as CalendarEventFull, 'single');
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
    if (selectedEvent.project_id !== project.project_id) return false;
    // Kanban-sourced entries are read-only from Calendar — editing happens
    // on the board, where the assignment/date actually lives.
    if (selectedEvent.is_kanban_task) return false;
    if (projectRole === 'OWNER' || projectRole === 'ADMIN') return true;
    if (projectRole !== 'MEMBER') return false;

    return (
      selectedEvent.created_by === currentUser.id ||
      selectedEvent.participants.some((p) => p.id === currentUser.id)
    );
  };

  return (
    <AppLayout project={project}>
      <Head title={`${t('calendar.pageTitle')} - ${project.project_name}`} />

      <div className="flex h-full w-full gap-2 overflow-hidden bg-dark-surface-1 p-2">
        <CalendarSidebar
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onRefresh={refetch}
          isLoading={loading}
          canCreate={canCreateEvent}
          onCreate={handleCreate}
          currentDate={currentDate}
          onDateSelect={setCurrentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          members={members}
          onToggleMember={handleToggleMember}
          onToggleAllMembers={handleToggleAllMembers}
          events={visibleEvents}
          cardLabels={cardLabels}
          hiddenLabelIds={hiddenLabelIds}
          onToggleLabel={handleToggleLabel}
          eventSourceFilter={eventSourceFilter}
          onEventSourceFilterChange={setEventSourceFilter}
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
        currentProjectId={project.project_id}
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

      {deleteConfirmOpen && (
        <ConfirmModal
          title={t('calendar.deleteScheduleTitle')}
          description={t('calendar.deleteScheduleConfirm')}
          confirmLabel={t('calendar.delete')}
          cancelLabel={t('calendar.cancel')}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      )}
    </AppLayout>
  );
};

export default Calendar;
