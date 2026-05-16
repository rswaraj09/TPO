import { motion } from "motion/react";
import { TestimonialsColumn, type TestimonialItem } from "@/components/ui/testimonials-columns-1";

const TESTIMONIALS: TestimonialItem[] = [
  {
    text: "The mock interviews and resume reviews gave me the edge I needed. Walked into my first on-campus drive fully prepared — and walked out with an offer.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    name: "Rahul Sharma",
    role: "Software Engineer · TCS",
  },
  {
    text: "From aptitude prep to final offer — every step was effortless. The portal made the whole process transparent.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    name: "Priya Desai",
    role: "Data Analyst · Infosys",
  },
  {
    text: "Alumni sessions opened paths I hadn't even considered. Connected with seniors who guided me throughout.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    name: "Amit Patel",
    role: "Business Analyst · Accenture",
  },
  {
    text: "Converted my internship to a full-time role. The placement cell helped me prep for both rounds with focused mock sessions.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    name: "Sneha Kulkarni",
    role: "SDE · Capgemini",
  },
  {
    text: "Real-time notifications meant I never missed a deadline. I was always the first to apply for the best roles.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
    name: "Arjun Mehta",
    role: "Associate Engineer · Wipro",
  },
  {
    text: "Department-scoped listings saved me hours of filtering through irrelevant roles. Exactly what we needed.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
    name: "Neha Joshi",
    role: "Product Analyst · Cognizant",
  },
  {
    text: "The verified profile built real credibility with recruiters. They trusted the data the moment they saw it.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
    name: "Vikram Rao",
    role: "Software Engineer · HCL",
  },
  {
    text: "The aptitude practice modules were spot-on. I cleared every written test in my first attempt.",
    image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=80&h=80&fit=crop&crop=face",
    name: "Divya Nair",
    role: "Systems Engineer · Tech Mahindra",
  },
  {
    text: "Highest package in my batch — 14 LPA. The structured placement calendar kept everything on track.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face",
    name: "Rohan Kulkarni",
    role: "Product Manager · Persistent",
  },
];

const firstColumn  = TESTIMONIALS.slice(0, 3);
const secondColumn = TESTIMONIALS.slice(3, 6);
const thirdColumn  = TESTIMONIALS.slice(6, 9);

export function LandingTestimonials() {
  return (
    <section className="bg-background my-20 relative">
      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border py-1 px-4 rounded-lg text-sm font-medium">
              Success Stories
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5 text-center">
            Placed. Growing. Inspiring others.
          </h2>
          <p className="text-center mt-5 opacity-75">
            Real words from Vishwaniketan students who built their careers
            through this portal.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
}
