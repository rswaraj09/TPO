import { motion } from "motion/react";

const RECRUITERS: { name: string; slug?: string }[] = [
  { name: "TCS", slug: "tcs" },
  { name: "Infosys", slug: "infosys" },
  { name: "Wipro", slug: "wipro" },
  { name: "Accenture", slug: "accenture" },
  { name: "Cognizant", slug: "cognizant" },
  { name: "IBM", slug: "ibm" },
  { name: "Tech Mahindra", slug: "techmahindra" },
  { name: "Capgemini", slug: "capgemini" },
  { name: "HCL", slug: "hcltech" },
  { name: "L&T Infotech" },
  { name: "Persistent" },
  { name: "Zensar" },
];

export function LandingRecruiterMarquee() {
  return (
    <section
      id="recruiters"
      className="border-y border-border bg-muted/30 py-12"
    >
      <div className="container mx-auto px-4">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-foreground/40"
        >
          Trusted by leading recruiters
        </motion.p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex animate-marquee gap-4">
            {[...RECRUITERS, ...RECRUITERS].map((c, i) => (
              <div
                key={`${c.name}-${i}`}
                className="flex min-w-[180px] items-center justify-center rounded-xl border border-border bg-background px-6 py-5 shadow-sm"
              >
                {c.slug ? (
                  <img
                    src={`https://cdn.simpleicons.org/${c.slug}/4338ca`}
                    alt={c.name}
                    loading="lazy"
                    className="h-8 max-w-[120px] object-contain"
                    onError={(e) => {
                      const img = e.currentTarget;
                      const parent = img.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="whitespace-nowrap text-sm font-semibold text-foreground/70">${c.name}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span className="whitespace-nowrap text-sm font-semibold text-foreground/70">
                    {c.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
