import { motion, type Variants } from "motion/react";
import { GraduationCap, Briefcase, Award, Users } from "lucide-react";

const FEATURES = [
  {
    title: "Career Guidance",
    description:
      "One-on-one counseling and mentorship from industry veterans and seasoned placement coordinators.",
    icon: GraduationCap,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50",
    iconHoverBg: "group-hover:bg-indigo-600",
    borderHover: "hover:border-indigo-300/60",
  },
  {
    title: "Placement Drives",
    description:
      "Regular on-campus drives from product companies, service giants, and fast-growing startups.",
    icon: Briefcase,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    iconHoverBg: "group-hover:bg-violet-600",
    borderHover: "hover:border-violet-300/60",
  },
  {
    title: "Skill Development",
    description:
      "Hands-on workshops covering DSA, system design, aptitude, group discussions, and communication.",
    icon: Award,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    iconHoverBg: "group-hover:bg-emerald-600",
    borderHover: "hover:border-emerald-300/60",
  },
  {
    title: "Alumni Network",
    description:
      "Tap into a growing network of Vishwaniketan alumni across India's top tech and finance firms.",
    icon: Users,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    iconHoverBg: "group-hover:bg-amber-600",
    borderHover: "hover:border-amber-300/60",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="border-y border-border bg-muted/30 py-24 md:py-28"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <div className="mb-4 inline-block rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/60">
            What you get
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Built for every step of your journey
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-foreground/60">
            Everything you need under a single, verified portal — from career
            counseling to the final offer letter.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg ${feature.borderHover}`}
            >
              <div
                className={`relative mb-5 inline-flex rounded-xl border border-border/50 ${feature.iconBg} p-3 transition-colors duration-200 ${feature.iconHoverBg}`}
              >
                <feature.icon
                  className={`h-6 w-6 ${feature.iconColor} transition-colors duration-200 group-hover:text-white`}
                />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-foreground/60">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
