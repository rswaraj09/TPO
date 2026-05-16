import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function LandingCTA() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-background py-24">
      <div className="relative container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-primary p-10 md:p-16"
        >
          <div className="relative mx-auto max-w-3xl text-center text-primary-foreground">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground/80">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Join 1200+ placed students
            </div>
            <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Ready to get placed?
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/75 md:text-xl">
              Join hundreds of Vishwaniketan students who&apos;ve already launched
              their careers through the TPO portal.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="group h-12 bg-background px-7 text-base font-semibold text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-background/90"
                onClick={() => navigate("/signup")}
              >
                Create your account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-primary-foreground/30 bg-primary-foreground/10 px-7 text-base text-primary-foreground backdrop-blur hover:bg-primary-foreground/20"
                onClick={() => navigate("/login")}
              >
                I already have an account
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
