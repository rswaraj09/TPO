import { motion, type Variants } from "motion/react";
import { FileText, BookOpen, Target, Rocket } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Register",
    description:
      "Create your placement account and complete your student profile in minutes.",
    icon: FileText,
    bg: "bg-indigo-600",
    ring: "ring-indigo-100",
    labelColor: "text-indigo-500",
  },
  {
    step: "02",
    title: "Prepare",
    description:
      "Access curated resources, practice aptitude tests, and attend training sessions.",
    icon: BookOpen,
    bg: "bg-violet-600",
    ring: "ring-violet-100",
    labelColor: "text-violet-500",
  },
  {
    step: "03",
    title: "Apply",
    description:
      "Browse eligible openings and apply with a single click using your verified resume.",
    icon: Target,
    bg: "bg-fuchsia-600",
    ring: "ring-fuchsia-100",
    labelColor: "text-fuchsia-500",
  },
  {
    step: "04",
    title: "Succeed",
    description:
      "Ace the interview rounds and land your dream job with end-to-end TPO support.",
    icon: Rocket,
    bg: "bg-emerald-500",
    ring: "ring-emerald-100",
    labelColor: "text-emerald-600",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export function LandingProcess() {
  return (
    <section id="process" className="relative bg-background py-24 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mb-20 text-center"
        >
          <div className="mb-4 inline-block rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/60">
            How it works
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            From signup to offer letter
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-foreground/60">
            A streamlined path designed to take you from your first campus drive
            to your dream job.
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-6xl">
          {/* Connector line */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-10 hidden h-px bg-border lg:block"
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6"
          >
            {STEPS.map((item) => (
              <motion.div key={item.step} variants={itemVariants} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`relative z-10 mb-5 flex h-20 w-20 items-center justify-center rounded-2xl ${item.bg} ring-8 ${item.ring} shadow-lg`}
                  >
                    <item.icon className="h-9 w-9 text-white" />
                  </div>
                  <div className={`mb-2 text-xs font-bold tracking-widest ${item.labelColor}`}>
                    STEP {item.step}
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/60">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
