import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { extractErrorMessage } from "@/lib/api";
import {
  adminListEvents,
  adminCreateEvent,
  adminCancelEvent,
  adminDeleteEvent,
  type EventItem,
  type EventType,
  type CreateEventPayload,
} from "@/lib/eventsApi";
import { Badge } from "./shared";

const EVENT_TYPES: EventType[] = [
  "PLACEMENT_DRIVE",
  "WORKSHOP",
  "SEMINAR",
  "MOCK_INTERVIEW",
  "WEBINAR",
  "OTHER",
];

function EventFormDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CreateEventPayload>({
    title: "",
    description: "",
    eventDate: "",
    eventTime: "",
    location: "",
    type: "PLACEMENT_DRIVE",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.eventDate) {
      toast.error("Title and date are required");
      return;
    }
    setSaving(true);
    try {
      await adminCreateEvent({
        ...form,
        eventDate: new Date(form.eventDate).toISOString(),
      });
      toast.success("Event created");
      onSaved();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create Event</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <FieldGroup className="space-y-3">
          <Field>
            <FieldLabel>Title *</FieldLabel>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <textarea
              className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Date *</FieldLabel>
              <Input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Time</FieldLabel>
              <Input
                type="time"
                value={form.eventTime || ""}
                onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel>Location</FieldLabel>
            <Input
              value={form.location || ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel>Type</FieldLabel>
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </FieldGroup>
        <div className="flex gap-2 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EventsTab() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setEvents(await adminListEvents());
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this event?")) return;
    try {
      await adminCancelEvent(id);
      toast.success("Event cancelled");
      load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event permanently?")) return;
    try {
      await adminDeleteEvent(id);
      toast.success("Event deleted");
      load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Events</h2>
        <Button onClick={() => setShowCreate(true)}>Create Event</Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No events yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {events.map((ev) => (
            <Card key={ev.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-semibold">{ev.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(ev.eventDate).toLocaleDateString()}{" "}
                    {ev.eventTime && `· ${ev.eventTime}`}
                    {ev.location && ` · ${ev.location}`}
                  </div>
                  {ev.description && (
                    <div className="text-sm mt-2">{ev.description}</div>
                  )}
                  <div className="flex gap-1 mt-2">
                    <Badge>{ev.type.replace("_", " ")}</Badge>
                    <Badge
                      variant={
                        ev.status === "CANCELLED"
                          ? "red"
                          : ev.status === "UPCOMING"
                          ? "green"
                          : "gray"
                      }
                    >
                      {ev.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {ev.status !== "CANCELLED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(ev.id)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(ev.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <EventFormDialog
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}
