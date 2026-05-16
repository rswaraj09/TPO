import { useEffect, useState } from "react";
import { publicListUpcomingEvents, type EventItem } from "@/lib/eventsApi";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingRecruiterMarquee } from "@/components/landing/LandingRecruiterMarquee";
import { LandingProcess } from "@/components/landing/LandingProcess";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingEvents } from "@/components/landing/LandingEvents";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    if (!selectedEvent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedEvent(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedEvent]);

  useEffect(() => {
    publicListUpcomingEvents()
      .then(setUpcomingEvents)
      .catch(() => setUpcomingEvents([]));
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <LandingNav onScrollTo={scrollTo} />
      <LandingHero />
      <LandingRecruiterMarquee />
      <LandingProcess />
      <LandingFeatures />
      <LandingTestimonials />
      <LandingEvents
        events={upcomingEvents}
        selectedEvent={selectedEvent}
        onSelect={setSelectedEvent}
      />
      <LandingCTA />
      <LandingFooter onScrollTo={scrollTo} />
    </div>
  );
}
