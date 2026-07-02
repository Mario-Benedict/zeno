import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useState, useMemo } from 'react';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { EventDetailModal } from '@/components/calendar/EventDetailModal';
import { EventFormModal } from '@/components/calendar/EventFormModal';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { RecurrenceEditDialog } from '@/components/calendar/RecurrenceEditDialog';
import { WeekGrid } from '@/components/calendar/WeekGrid';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import AppLayout from '@/layouts/AppLayout';
import { projectPath } from '@/lib/accountRoutes';
import type {
  CalendarProps,
  CalendarViewMode,
  CalendarMember,
  CalendarPriority,
  AnyCalendarEvent,
  CalendarEventFull,
} from '@/types/calendar';

export default function Calendar({
  project,
  projectRole,
  projectUsers,
  currentUser,
}: CalendarProps) {
  const accountIndex = usePage().props.account.index;

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Member checkboxes
  const [members, setMembers] = useState<CalendarMember[]>(() =>
    projectUsers.map((u) => ({ ...u, checked: true })),
  );

  // Priority legend doubles as a filter (click a pill to show/hide).
  const [hiddenPriorities, setHiddenPriorities] = useState<
    Set<CalendarPriority>
  >(() => new Set());

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

  // Apply the priority filter. Classified busy-blocks carry no priority, so
  // they are always shown regardless of which pills are hidden.
  const visibleEvents = useMemo(
    () =>
      events.filter(
        (ev) => ev.is_classified || !hiddenPriorities.has(ev.priority),
      ),
    [events, hiddenPriorities],
  );

  // --- Handlers ---

  const handleTogglePriority = (priority: CalendarPriority) => {
    setHiddenPriorities((prev) => {
      const next = new Set(prev);
      if (next.has(priority)) next.delete(priority);
      else next.add(priority);
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

    if (selectedEvent.recurrence === 'weekly') {
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

    if (selectedEvent.recurrence === 'weekly') {
      setPendingAction({
        type: 'delete',
        event: selectedEvent as CalendarEventFull,
      });
      setRecurrenceDialogOpen(true);
    } else {
      if (confirm('Are you sure you want to delete this schedule?')) {
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
        const isRecurring = selectedEvent.recurrence === 'weekly';

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

        await axios.patch(`${basePath}/${targetId}`, payload);
      } else {
        // Create new
        await axios.post(
          projectPath(accountIndex, project.project_slug, '/calendar/events'),
          data,
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
        scope === 'single' && ev.recurrence === 'weekly'
          ? ev.start_time
          : undefined;
      await axios.delete(
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
    if (projectRole === 'OWNER' || projectRole === 'ADMIN') return true;
    return (
      selectedEvent.created_by === currentUser.id ||
      selectedEvent.participants.some((p) => p.id === currentUser.id)
    );
  };

  return (
    <AppLayout project={project}>
      <Head title={`${project.project_name} - Calendar`} />

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
          hiddenPriorities={hiddenPriorities}
          onTogglePriority={handleTogglePriority}
        />

        <div className="relative flex flex-1 flex-col overflow-hidden">
          {viewMode === 'month' ? (
            <MonthGrid
              currentDate={currentDate}
              events={visibleEvents}
              members={members}
              onDateClick={handleGridDateClick}
              onEventClick={handleEventClick}
            />
          ) : (
            <WeekGrid
              currentDate={currentDate}
              events={visibleEvents}
              members={members}
              onDateClick={handleGridDateClick}
              onEventClick={handleEventClick}
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
