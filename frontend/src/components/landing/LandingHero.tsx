import { useNavigate } from "react-router";
import { useEffect, useRef } from "react";
import { motion, type Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Users, TrendingUp, Award, Sparkles } from "lucide-react";

type Point = { x: number; y: number };
interface WaveConfig { offset: number; amplitude: number; frequency: number; color: string; opacity: number; }

const STATS = [
  { label: "Companies Visited", value: "150+", icon: Building2 },
  { label: "Students Placed",   value: "1200+", icon: Users },
  { label: "Average Package",   value: "6.5 LPA", icon: TrendingUp },
  { label: "Highest Package",   value: "24 LPA",  icon: Award },
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, staggerChildren: 0.12 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const statsVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.08 } },
};

function useWaveCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const mouseRef = useRef<Point>({ x: 0, y: 0 });
  const targetMouseRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const computeColors = () => {
      const resolve = (vars: string[], alpha = 1) => {
        const el = document.createElement("div");
        el.style.cssText = "position:absolute;visibility:hidden;width:1px;height:1px";
        document.body.appendChild(el);
        let color = `rgba(255,255,255,${alpha})`;
        for (const v of vars) {
          el.style.backgroundColor = `var(${v})`;
          const c = getComputedStyle(el).backgroundColor;
          if (c && c !== "rgba(0, 0, 0, 0)") {
            if (alpha < 1) {
              const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              color = m ? `rgba(${m[1]},${m[2]},${m[3]},${alpha})` : c;
            } else { color = c; }
            break;
          }
        }
        document.body.removeChild(el);
        return color;
      };
      return {
        bgTop: resolve(["--background"]),
        bgBot: resolve(["--muted", "--background"], 0.95),
        waves: [
          { offset: 0,              amplitude: 70, frequency: 0.003,  color: resolve(["--primary"], 0.8),                       opacity: 0.45 },
          { offset: Math.PI / 2,    amplitude: 90, frequency: 0.0026, color: resolve(["--accent", "--primary"], 0.7),            opacity: 0.35 },
          { offset: Math.PI,        amplitude: 60, frequency: 0.0034, color: resolve(["--secondary", "--foreground"], 0.65),     opacity: 0.30 },
          { offset: Math.PI * 1.5,  amplitude: 80, frequency: 0.0022, color: resolve(["--primary-foreground", "--foreground"], 0.25), opacity: 0.25 },
          { offset: Math.PI * 2,    amplitude: 55, frequency: 0.004,  color: resolve(["--foreground"], 0.2),                    opacity: 0.20 },
        ] as WaveConfig[],
      };
    };

    let colors = computeColors();
    const obs = new MutationObserver(() => { colors = computeColors(); });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const influence = reduced ? 10 : 70;
    const radius = reduced ? 160 : 320;
    const smooth = reduced ? 0.04 : 0.1;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    const recenter = () => {
      mouseRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
      targetMouseRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
    };
    const onMove = (e: MouseEvent) => { targetMouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => recenter();

    resize(); recenter();
    window.addEventListener("resize", () => { resize(); recenter(); });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    const drawWave = (w: WaveConfig) => {
      ctx.save(); ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x;
        const dy = canvas.height / 2 - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const inf = Math.max(0, 1 - dist / radius);
        const me = inf * influence * Math.sin(time * 0.001 + x * 0.01 + w.offset);
        const y = canvas.height / 2
          + Math.sin(x * w.frequency + time * 0.002 + w.offset) * w.amplitude
          + Math.sin(x * w.frequency * 0.4 + time * 0.003) * (w.amplitude * 0.45)
          + me;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineWidth = 2.5; ctx.strokeStyle = w.color; ctx.globalAlpha = w.opacity;
      ctx.shadowBlur = 35; ctx.shadowColor = w.color; ctx.stroke(); ctx.restore();
    };

    const animate = () => {
      time++;
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * smooth;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * smooth;
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, colors.bgTop); g.addColorStop(1, colors.bgBot);
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      colors.waves.forEach(drawWave);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(animationId);
      obs.disconnect();
    };
  }, [canvasRef]);
}

export function LandingHero() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useWaveCanvas(canvasRef);

  return (
    <section
      id="top"
      className="relative isolate flex min-h-[92vh] w-full items-center justify-center overflow-hidden border-b border-neutral-200 bg-background"
    >
      {/* Animated wave canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-24 text-center">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full">

          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-foreground/70 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Official Training &amp; Placement Portal
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="mb-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-7xl lg:text-[80px]"
          >
            Your career,{" "}
            <span className="text-primary">launched.</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-foreground/70 md:text-xl"
          >
            The official TPO portal for{" "}
            <span className="font-semibold text-foreground">Vishwaniketan iMEET</span>.
            Verified profiles, curated openings, one-click applications — all in one place.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="mb-16 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Button
              size="lg"
              className="group h-12 gap-2 rounded-full px-7 text-base font-semibold"
              onClick={() => navigate("/signup")}
            >
              Start your journey
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-border/40 bg-background/60 px-7 text-base backdrop-blur hover:bg-background/80"
              onClick={() => navigate("/login")}
            >
              Student Portal
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={statsVariants}
            className="grid grid-cols-2 gap-4 rounded-2xl border border-border/30 bg-background/60 p-6 backdrop-blur-sm md:grid-cols-4"
          >
            {STATS.map((stat) => (
              <motion.div key={stat.label} variants={itemVariants} className="space-y-1">
                <stat.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                <div className="text-2xl font-bold text-foreground md:text-3xl">{stat.value}</div>
                <div className="text-xs font-medium text-foreground/50">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
