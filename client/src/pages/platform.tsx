import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BrandName } from "@/components/brand-name";
import { Link } from "wouter";
import { ArrowUpRight, BarChart3, CircleDashed, LockKeyhole } from "lucide-react";
import { platformPageCopy } from "@shared/public-page-copy";

export default function Platform() {
  return (
    <div className="mm-page min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-8 sm:pt-36">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#153e38] px-6 py-10 text-[#f5f3eb] shadow-[0_28px_70px_rgba(19,62,55,.2)] sm:px-12 sm:py-14 lg:px-16">
          <div className="mm-grid absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div className="max-w-2xl">
              <p className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-[#d5e96c]"><BrandName className="mm-brand-pad" /> platform</p>
              <h1 className="mm-display text-4xl font-extrabold sm:text-5xl lg:text-[4.25rem]">{platformPageCopy.headline}</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#c1d5cc] sm:text-lg">
                {platformPageCopy.introduction}
              </p>
              <Link href="/free-tier/input" className="mm-action mt-8 inline-flex items-center gap-2 bg-[#d5e96c] px-6 py-3.5 text-sm font-bold text-[#183b37] hover:bg-[#e2f48a]">
                Try the free calculator <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="relative mx-auto w-full max-w-md rounded-[1.6rem] border border-white/15 bg-white/[.07] p-5 backdrop-blur-sm sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div><span className="block text-[10px] uppercase tracking-[.15em] text-[#a7c5b8]">Engagement snapshot</span><span className="mt-1 block font-semibold">Delivery assumptions</span></div>
                <span className="rounded-full bg-[#d5e96c]/15 px-3 py-1 text-xs font-semibold text-[#d5e96c]">Illustrative</span>
              </div>
              <div className="my-6 flex items-center justify-between">
                <div><span className="text-sm text-[#b8cdc4]">Decision lens</span><div className="mt-1 text-2xl font-bold text-white">Risk in view</div></div>
                <div className="grid h-14 w-14 place-items-center rounded-full border-[5px] border-[#d5e96c] border-b-white/15 text-[9px] font-bold text-[#d5e96c]">STRUCTURE</div>
              </div>
              <div className="space-y-2">
                {["Staffing assumptions", "Scope movement", "Billing and time signals"].map((label) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-xs">
                    <span className="text-[#cadbd3]">{label}</span><span className="rounded-full bg-[#d5e96c]/15 px-2.5 py-1 font-semibold text-[#d5e96c]">Considered</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 flex items-center gap-2 text-[11px] text-[#91b3a7]"><LockKeyhole size={13} /> Output depends on stated assumptions</p>
            </div>
          </div>
        </section>

        <section className="mt-16 sm:mt-24">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="mm-eyebrow">A clear product roadmap</p><h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Start with what’s real today.</h2></div>
            <p className="max-w-sm text-sm leading-6 text-[#60776f]">Availability is labeled at each stage.</p>
          </div>
          <div className="relative space-y-4 before:absolute before:bottom-10 before:left-[19px] before:top-10 before:w-px before:bg-[#c9d8ce] sm:before:left-[27px]">
            {platformPageCopy.stages.map((stage, index) => (
              <article key={stage.title} className={`relative ml-0 grid gap-4 rounded-[1.4rem] border p-5 pl-14 transition-all duration-200 hover:-translate-y-0.5 sm:grid-cols-[170px_1fr_auto] sm:items-center sm:gap-8 sm:p-7 sm:pl-[76px] ${index === 0 ? "border-[#b9d5c1] bg-[#eaf2e8]" : "border-[#e0e4d9] bg-[#fffefa]"}`}>
                <span className={`absolute left-3 top-6 grid h-9 w-9 place-items-center rounded-full border-4 border-[#f5f3eb] sm:left-4 sm:top-8 sm:h-12 sm:w-12 ${index === 0 ? "bg-[#146d58] text-white" : "bg-[#e3e9df] text-[#617a70]"}`}>
                  {index === 0 ? <BarChart3 size={17} /> : <CircleDashed size={17} />}
                </span>
                <p className={`text-xs font-extrabold uppercase tracking-[.14em] ${index === 0 ? "text-[#146d58]" : "text-[#788780]"}`}>{stage.status}</p>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#183b37]">{stage.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#60776f]">{stage.summary}</p>
                  <details className="mt-2 text-sm text-[#60776f]">
                    <summary className="inline-flex cursor-pointer items-center text-xs font-bold text-[#146d58] underline decoration-[#a8c5b2] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146d58]">
                      Stage detail
                    </summary>
                    <p className="mt-2 max-w-2xl leading-6">{stage.detail}</p>
                  </details>
                </div>
                {index === 0 && <Link href="/free-tier/input" className="inline-flex items-center gap-2 text-sm font-bold text-[#146d58] hover:text-[#0c5747]">Explore <ArrowUpRight size={16} /></Link>}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[1.6rem] bg-[#dce9d7] p-6 sm:mt-20 sm:flex-row sm:items-center sm:p-9">
          <div><p className="mm-eyebrow">A specific engagement in mind?</p><h2 className="mt-2 text-2xl font-bold tracking-tight">{platformPageCopy.conversationTitle}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#526d64]">{platformPageCopy.conversationDetail}</p></div>
          <a href="https://calendly.com/sid-marginmix/30min" target="_blank" rel="noopener noreferrer" className="mm-action inline-flex shrink-0 items-center gap-2 bg-[#146d58] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#0c5747]">Book a Demo <ArrowUpRight size={16} /></a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
