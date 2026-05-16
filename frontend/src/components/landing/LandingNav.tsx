import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { id: "features", label: "Features" },
  { id: "process", label: "Process" },
  { id: "recruiters", label: "Recruiters" },
  { id: "events", label: "Events" },
];

interface LandingNavProps {
  onScrollTo: (id: string) => void;
}

export function LandingNav({ onScrollTo }: LandingNavProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleScrollTo = (id: string) => {
    onScrollTo(id);
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Brand */}
          <button
            onClick={() => handleScrollTo("top")}
            className="flex items-center gap-2.5"
          >
            <img
              src="/logo.png"
              alt="Vishwaniketan logo"
              className="h-10 w-auto"
            />
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-bold tracking-tight text-foreground">
                Vishwaniketan
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-primary">
                TPO Portal
              </span>
            </div>
          </button>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => handleScrollTo(l.id)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              className="hidden h-9 text-sm sm:inline-flex"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
            <Button
              className="h-9 px-4 text-sm"
              onClick={() => navigate("/signup")}
            >
              Get Started
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <button
              className="ml-0.5 rounded-md p-2 text-foreground/70 hover:bg-accent hover:text-accent-foreground lg:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-t border-border lg:hidden"
            >
              <div className="flex flex-col gap-0.5 py-2">
                {NAV_LINKS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleScrollTo(l.id)}
                    className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                  >
                    {l.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/login");
                  }}
                  className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground/70 hover:bg-accent sm:hidden"
                >
                  Login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
