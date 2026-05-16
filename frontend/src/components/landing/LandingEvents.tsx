import { useNavigate } from "react-router";
import { motion, type Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowRight, X } from "lucide-react";
import type { EventItem } from "@/lib/eventsApi";

interface LandingEventsProps {
  events: EventItem[];
  selectedEvent: EventItem | null;
  onSelect: (event: EventItem | null) => void;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  PLACEMENT_DRIVE: "border-indigo-200 bg-indigo-50 text-indigo-700",
  WORKSHOP: "border-violet-200 bg-violet-50 text-violet-700",
  SEMINAR: "border-emerald-200 bg-emerald-50 text-emerald-700",
  APTITUDE_TEST: "border-amber-200 bg-amber-50 text-amber-700",
  MOCK_INTERVIEW: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  OTHER: "border-border bg-muted text-foreground/70",
};

const DATE_BG_COLORS = [
  "bg-indigo-600",
  "bg-violet-600",
  "bg-fuchsia-600",
  "bg-emerald-600",
];

function getTypeColor(type: string) {
  return EVENT_TYPE_COLORS[type] ?? EVENT_TYPE_COLORS.OTHER;
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export function LandingEvents({ events, selectedEvent, onSelect }: LandingEventsProps) {
  const navigate = useNavigate();

  return (
    <>
      <section id="events" className="bg-background py-24 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-block rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/60">
              What&apos;s next
            </div>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Upcoming events
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-foreground/60">
              Workshops, placement drives, and career sessions — all the dates
              you need in one place.
            </p>
          </motion.div>

          <div className="mx-auto max-w-3xl space-y-4">
            {!events || events.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center"
              >
                <Calendar className="mx-auto mb-3 h-10 w-10 text-foreground/25" />
                <p className="text-base font-medium text-foreground/70">
                  No upcoming events right now
                </p>
                <p className="mt-1 text-sm text-foreground/50">
                  Check back soon — we&apos;re lining up new workshops every week.
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="space-y-4"
              >
                {events.map((event, idx) => {
                  const d = new Date(event.eventDate);
                  const day = d.getDate();
                  const month = d.toLocaleDateString(undefined, { month: "short" });
                  const dateBg = DATE_BG_COLORS[idx % DATE_BG_COLORS.length];
                  return (
                    <motion.button
                      type="button"
                      key={event.id}
                      variants={itemVariants}
                      onClick={() => onSelect(event)}
                      className="group flex w-full items-center gap-5 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:p-6"
                    >
                      {/* Date block */}
                      <div
                        className={`flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl ${dateBg} text-white shadow-sm md:h-20 md:w-20`}
                      >
                        <span className="text-2xl font-bold md:text-3xl">{day}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider md:text-xs">
                          {month}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`mb-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getTypeColor(event.type)}`}
                        >
                          {event.type.replace(/_/g, " ")}
                        </div>
                        <h3 className="truncate text-base font-semibold text-foreground md:text-lg">
                          {event.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/50 md:text-sm">
                          {event.eventTime && <span>⏰ {event.eventTime}</span>}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="hidden h-5 w-5 flex-shrink-0 text-foreground/20 transition-all group-hover:translate-x-1 group-hover:text-primary sm:block" />
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Event detail modal */}
      {selectedEvent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => onSelect(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-t-2xl bg-background shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="relative flex items-start gap-5 bg-muted/50 p-6 md:p-7">
              {(() => {
                const d = new Date(selectedEvent.eventDate);
                return (
                  <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md md:h-20 md:w-20">
                    <span className="text-2xl font-bold md:text-3xl">
                      {d.getDate()}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider md:text-xs">
                      {d.toLocaleDateString(undefined, { month: "short" })}
                    </span>
                  </div>
                );
              })()}
              <div className="min-w-0 flex-1 pr-10">
                <div
                  className={`mb-2 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getTypeColor(selectedEvent.type)}`}
                >
                  {selectedEvent.type.replace(/_/g, " ")}
                </div>
                <h3
                  id="event-modal-title"
                  className="text-xl font-bold text-foreground md:text-2xl"
                >
                  {selectedEvent.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/60">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    {new Date(selectedEvent.eventDate).toLocaleDateString(
                      undefined,
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </span>
                  {selectedEvent.eventTime && (
                    <span>⏰ {selectedEvent.eventTime}</span>
                  )}
                  {selectedEvent.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary" />
                      {selectedEvent.location}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelect(null)}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-background text-foreground/60 shadow-sm ring-1 ring-border transition hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="max-h-[60vh] overflow-y-auto p-6 md:p-7">
              {selectedEvent.description ? (
                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/80">
                  {selectedEvent.description}
                </p>
              ) : (
                <p className="text-base italic text-foreground/40">
                  No additional details provided for this event.
                </p>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/30 p-5 sm:flex-row sm:justify-end md:px-7">
              <Button
                variant="outline"
                onClick={() => onSelect(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  onSelect(null);
                  navigate("/login");
                }}
              >
                Sign in to register
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
