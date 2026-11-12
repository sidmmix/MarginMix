import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Eye, Lightbulb, UserCheck } from "lucide-react";
import founderPhoto from "@assets/1586921422945_1768559339757.jpeg";
import advisorPhoto from "@assets/Screenshot_2026-01-21-08-12-37-88_254de13a4bc8758c9908fff1f73e_1768955128744.jpg";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { BrandName } from "@/components/brand-name";
import { AnimatedSection } from "@/components/animations";

export default function Founder() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mm-page mm-founder min-h-screen">
      <Header />
      <div className="h-16" />

      <section className="mm-founder-hero bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[.18em] text-[#d5e96c]">Why <BrandName className="mm-brand-pad" /> exists</p>
          <h1 className="mm-display max-w-4xl text-4xl font-extrabold sm:text-5xl md:text-6xl">
            Margin rarely breaks all at once.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-7 text-[#d1e0d8] sm:text-xl">
            Delivery complexity quietly reshapes the economics after the work is sold.
          </p>
        </div>
      </section>

      <main>
        <section className="py-12 sm:py-16">
          <AnimatedSection className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-8 lg:grid-cols-[.9fr_1.1fr]">
            <div className="mm-panel p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5f0e6] text-[#146d58]"><Eye size={19} /></span>
                <p className="mm-eyebrow">The quiet pattern</p>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#183b37] sm:text-3xl">Work looks sound. The load grows.</h2>
              <p className="mt-4 leading-7 text-[#60776f]">
                The team is busy and the client is satisfied, yet senior attention, coordination and rework begin to outpace the plan.
              </p>
              <p className="mt-4 border-l-2 border-[#d5e96c] pl-4 font-semibold leading-6 text-[#315b50]">
                Those signals are easy to miss until the economics stop adding up.
              </p>
            </div>
            <div className="mm-dark-panel p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#d5e96c]">What sits outside the quote</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Senior attention", "How much leadership time the work consumes"],
                  ["Coordination", "How many people and decisions must align"],
                  ["Iteration", "How often work is revisited or refined"],
                ].map(([title, body], index) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/[.045] p-4">
                    <span className="font-mono text-xs font-bold text-[#d5e96c]">0{index + 1}</span>
                    <h3 className="mt-3 font-bold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-5 text-[#bfd2c9]">{body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-[#b9d0c5]">
                <Lightbulb size={16} className="text-[#d5e96c]" /> Make the pattern visible while decisions can still change.
              </p>
            </div>
          </AnimatedSection>
        </section>

        <section className="bg-[#eaf1e8] py-10 sm:py-14">
          <AnimatedSection className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <p className="mm-eyebrow">The idea</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#183b37] sm:text-3xl">A decision lens for the economics of work.</h2>
              <p className="mt-3 text-sm leading-6 text-[#526d64]">Not a productivity, time tracking or utilization tool. Better economic decisions, not optimization of people.</p>
            </div>
            <details className="max-w-xl rounded-2xl border border-[#c8d9ca] bg-[#f8f8f0] p-4 text-sm text-[#526d64]">
              <summary className="cursor-pointer font-bold text-[#146d58] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146d58]">Read the fuller story</summary>
              <div className="mt-3 space-y-3 leading-6">
                <p>Margin conversations often turn to pricing, utilization and delivery efficiency. These matter, but they do not always reveal how an engagement is staffed and governed.</p>
                <p>Senior attention over time, coordination across stakeholders, repeated refinement and cognitive load can sit outside formal reporting. This pattern appears across retainers, fixed fee projects and complex transformation work, often too late to act. It is often the single biggest driver of margin erosion.</p>
                <p><BrandName /> makes those conditions visible earlier, helping leaders assess structural viability from likely staffing, coordination and governance. It is a decision lens for pricing and margin assurance, not a productivity, time tracking or utilization system.</p>
              </div>
            </details>
          </AnimatedSection>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
              <div><p className="mm-eyebrow">People behind the perspective</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#183b37]">Built from operating experience.</h2></div>
              <span className="text-xs font-semibold text-[#70857d]"><BrandName /> · Headroom</span>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <article className="mm-panel overflow-hidden">
                <div className="grid sm:grid-cols-[170px_1fr]">
                  <div className="flex items-center justify-center bg-[#e4eee2] p-5 sm:items-start">
                    <img src={founderPhoto} alt="Siddhartha Dasgupta (Sid)" className="h-32 w-32 rounded-[1.4rem] object-cover shadow-md sm:h-36 sm:w-36" />
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#568475]"><UserCheck size={14} /> Founder</div>
                    <h3 className="mt-2 text-xl font-extrabold text-[#183b37]">Siddhartha Dasgupta (Sid)</h3>
                    <p className="mt-3 text-sm leading-6 text-[#60776f]">His career spans creative, media, corporate marketing and performance environments, including Dentsu, Ogilvy, Grey and Publicis, as well as an independent consultancy.</p>
                    <details className="mt-4 border-t border-[#e2e8df] pt-3 text-sm text-[#60776f]">
                      <summary className="cursor-pointer font-semibold text-[#146d58] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146d58]">More about Sid</summary>
                      <p className="mt-2 leading-6">He led large accounts and cross market teams, took part in commercial and operational decisions, and was accountable for growth and profitability. <BrandName /> draws on patterns seen over years inside agency and consulting work.</p>
                    </details>
                  </div>
                </div>
              </article>

              <article className="mm-panel overflow-hidden">
                <div className="grid sm:grid-cols-[170px_1fr]">
                  <div className="flex items-center justify-center bg-[#e4eee2] p-5 sm:items-start">
                    <img src={advisorPhoto} alt="Joy Dasgupta" className="h-32 w-32 rounded-[1.4rem] object-cover shadow-md sm:h-36 sm:w-36" />
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#568475]"><UserCheck size={14} /> Key advisor</div>
                    <h3 className="mt-2 text-xl font-extrabold text-[#183b37]">Joy Dasgupta</h3>
                    <p className="mt-3 text-sm leading-6 text-[#60776f]">An enterprise operator with transformation experience across global teams at HP, AMEX and Genpact.</p>
                    <details className="mt-4 border-t border-[#e2e8df] pt-3 text-sm text-[#60776f]">
                      <summary className="cursor-pointer font-semibold text-[#146d58] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146d58]">More about Joy</summary>
                      <p className="mt-2 leading-6">Based in Boston, Joy is CEO of gyanAI. He advises <BrandName /> on decision system design, operating model risk and enterprise adoption, bringing firsthand understanding of margin risk in labor intensive operating models.</p>
                    </details>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-[#146d58] py-10 text-white sm:py-12">
          <AnimatedSection className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 sm:px-8 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#d5e96c]">Consider the engagement</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Make the assumptions visible.</h2>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/free-tier/input" className="inline-flex items-center justify-center rounded-full bg-[#d5e96c] px-6 py-3 text-sm font-bold text-[#183b37] hover:bg-[#e2f48a]">Try Free Scanner</Link>
              <a href="https://calendly.com/sid-marginmix/30min" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full rounded-full border-white/70 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white sm:w-auto">Book a Demo</Button>
              </a>
            </div>
          </AnimatedSection>
        </section>
      </main>
      <Footer />
    </div>
  );
}
