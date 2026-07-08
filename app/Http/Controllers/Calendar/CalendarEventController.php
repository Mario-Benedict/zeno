<?php

namespace App\Http\Controllers\Calendar;

use App\Events\CalendarEventChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Calendar\StoreCalendarEventRequest;
use App\Http\Requests\Calendar\UpdateCalendarEventRequest;
use App\Models\CalendarEvent;
use App\Models\Project;
use App\Services\CalendarService;
use Illuminate\Http\JsonResponse;

class CalendarEventController extends Controller
{
    public function __construct(private readonly CalendarService $calendarService) {}

    public function store(StoreCalendarEventRequest $request): JsonResponse
    {
        $project = $this->resolveProject($request->route('project'));
        $user = $request->user();

        $data = array_merge($request->validated(), [
            'project_id' => $project->project_id,
            'created_by' => $user?->getAuthIdentifier(),
        ]);

        $participants = $request->input('participants');

        $event = $this->calendarService->createEvent($data, $participants);

        broadcast(new CalendarEventChanged(
            $project->project_id,
            $participants,
            'created'
        ));

        return response()->json(['event' => $event], 201);
    }

    public function update(UpdateCalendarEventRequest $request): JsonResponse
    {
        $project = $this->resolveProject($request->route('project'));
        $event = $this->resolveEvent($request->route('event'), $project);
        $scope = $request->input('scope', 'single');

        // Participants that were in the event before update (to notify them of removal)
        $oldParticipants = $event->participants()->pluck('users.id')->all();

        $participants = $request->input('participants', $oldParticipants);

        $updatedEvent = $this->calendarService->updateEvent($event, $request->validated(), $participants, $scope);

        // Notify both old and new participants so UI can update
        $allAffectedParticipants = array_unique(array_merge($oldParticipants, $participants));

        broadcast(new CalendarEventChanged(
            $project->project_id,
            $allAffectedParticipants,
            'updated'
        ));

        return response()->json(['event' => $updatedEvent]);
    }

    public function destroy(UpdateCalendarEventRequest $request): JsonResponse
    {
        $project = $this->resolveProject($request->route('project'));
        $event = $this->resolveEvent($request->route('event'), $project);
        $scope = $request->input('scope', 'single');
        $participants = $event->participants()->pluck('users.id')->all();
        $occurrenceDate = $request->input('occurrence_date');

        $this->calendarService->deleteEvent($event, $scope, $occurrenceDate);

        broadcast(new CalendarEventChanged(
            $project->project_id,
            $participants,
            'deleted'
        ));

        return response()->json(['message' => 'Event deleted']);
    }

    private function resolveProject(Project|string|null $project): Project
    {
        if ($project instanceof Project) {
            return $project;
        }

        if (! is_string($project) || $project === '') {
            abort(404);
        }

        return Project::where('project_slug', $project)->firstOrFail();
    }

    /**
     * Resolve the `{event}` route parameter and verify it belongs to the
     * project the request is scoped to. Route-model binding only proves the
     * caller is a member of *some* project matching the URL slug — without
     * this check, any member could mutate another project's event by UUID.
     */
    private function resolveEvent(CalendarEvent|string|null $event, Project $project): CalendarEvent
    {
        $resolved = $event instanceof CalendarEvent
            ? $event
            : (is_string($event) && $event !== ''
                ? CalendarEvent::whereKey($event)->first()
                : null);

        abort_if($resolved === null || $resolved->project_id !== $project->project_id, 404);

        return $resolved;
    }
}
