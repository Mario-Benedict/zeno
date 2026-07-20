import { useEffect, useRef, useState, useCallback } from 'react';
import echo from '@/echo';
import { projectPath } from '@/lib/accountRoutes';
import { inertiaJson } from '@/lib/inertiaJson';
import type {
  AnyCalendarEvent,
  CalendarEventSourceFilter,
  CalendarMember,
} from '@/types/calendar';

export const useCalendarEvents = (
  accountIndex: number,
  projectSlug: string,
  projectId: string,
  viewStart: Date,
  viewEnd: Date,
  members: CalendarMember[],
  sourceFilter: CalendarEventSourceFilter,
) => {
  const [events, setEvents] = useState<AnyCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const requestSequenceRef = useRef(0);

  // Keep refs of current inputs to avoid stale closures in Echo listeners
  const rangeRef = useRef({ start: viewStart, end: viewEnd });
  const membersRef = useRef(members);

  useEffect(() => {
    rangeRef.current = { start: viewStart, end: viewEnd };
    membersRef.current = members;
  }, [viewStart, viewEnd, members]);

  // Derived list of selected user IDs for the API
  const selectedUserIds = members.filter((m) => m.checked).map((m) => m.id);
  const selectedUserIdsStr = selectedUserIds.join(',');

  const fetchEvents = useCallback(async () => {
    const requestSequence = ++requestSequenceRef.current;

    if (selectedUserIds.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await inertiaJson<AnyCalendarEvent[]>(
        'get',
        projectPath(accountIndex, projectSlug, '/calendar/events'),
        {
          params: {
            start: viewStart.toISOString(),
            end: viewEnd.toISOString(),
            users: selectedUserIds,
            source: sourceFilter,
          },
        },
      );
      if (requestSequence === requestSequenceRef.current) {
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    } finally {
      if (requestSequence === requestSequenceRef.current) {
        setLoading(false);
      }
    }
    // selectedUserIdsStr is the stable key for the selectedUserIds array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accountIndex,
    projectSlug,
    sourceFilter,
    viewStart,
    viewEnd,
    selectedUserIdsStr,
  ]);

  // Fetch when range or selected members change. The state updates here live
  // inside the async fetch (loading/results), which is the intended pattern.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
  }, [fetchEvents]);

  // Realtime Subscriptions
  useEffect(() => {
    // We listen to the project channel for full-detail updates within this project
    const projectChannel = `calendar.project.${projectId}`;
    echo.private(projectChannel).listen('.calendar.changed', () => {
      fetchEvents();
    });

    // We listen to the personal channels of all *currently checked* members
    // to receive cross-project CLASSIFIED updates for them.
    const userChannels = selectedUserIds.map((id) => `calendar.user.${id}`);

    userChannels.forEach((channel) => {
      echo.private(channel).listen('.calendar.changed', (e: any) => {
        // If the update came from THIS project, the projectChannel already caught it.
        // We only care about updates from OTHER projects here.
        if (e.projectId !== projectId) {
          fetchEvents();
        }
      });
    });

    return () => {
      echo.leave(projectChannel);
      userChannels.forEach((channel) => echo.leave(channel));
    };
    // selectedUserIdsStr is the stable key for the selectedUserIds array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, selectedUserIdsStr, fetchEvents]);

  return {
    events,
    loading,
    refetch: fetchEvents,
  };
};
