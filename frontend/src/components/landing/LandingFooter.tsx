import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { GraduationCap, MapPin, Mail, Phone } from "lucide-react";

interface LandingFooterProps {
  onScrollTo: (id: string) => void;
}

export function LandingFooter({ onScrollTo }: LandingFooterProps) {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border bg-background pb-8 pt-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="grid gap-10 md:grid-cols-4"
        >
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Vishwaniketan TPO
              </span>
            </div>
            <p className="mb-5 max-w-md text-sm leading-relaxed text-foreground/60">
              The official Training &amp; Placement portal for Vishwaniketan
              iMEET — empowering students to launch careers with top recruiters
              across India.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm text-foreground/60">
              <li>
                <button
                  onClick={() => navigate("/login")}
                  className="transition-colors hover:text-primary"
                >
                  Student Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/signup")}
                  className="transition-colors hover:text-primary"
                >
                  Register
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo("events")}
                  className="transition-colors hover:text-primary"
                >
                  Events
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollTo("recruiters")}
                  className="transition-colors hover:text-primary"
                >
                  Recruiters
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
              Contact
            </h3>
            <ul className="space-y-2.5 text-sm text-foreground/60">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Vishwaniketan iMEET, Khalapur</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <a
                  href="mailto:tpo@vishwaniketan.edu.in"
                  className="transition-colors hover:text-primary"
                >
                  tpo@vishwaniketan.edu.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                <a
                  href="tel:+917350011498"
                  className="transition-colors hover:text-primary"
                >
                  +91 73500 11498
                </a>
              </li>
            </ul>
          </div>
        </motion.div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-foreground/40 md:flex-row">
          <p>
            &copy; 2026 Vishwaniketan Training &amp; Placement Cell. All rights
            reserved.
          </p>
          <div className="flex gap-5">
            <a href="#" className="transition-colors hover:text-primary">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
