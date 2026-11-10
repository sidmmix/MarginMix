import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const stages = [
  {
    status: "Available now",
    title: "Free Leak Calculator",
    body: "Explore an engagement's fee, staff costs, scope movement, billing, and hours tracking. It returns an indicative, rule-based exposure estimate—not an audited loss.",
    action: true,
  },
  {
    status: "Planned",
    title: "Full document-based Scanner",
    body: "A planned paid review of engagement documents such as a statement of work, timesheet export, and rate card. Document review is not available through the free calculator today.",
  },
  {
    status: "Future direction",
    title: "Margin Intelligence",
    body: "A future product stage. Its scope and availability have not been announced; it is not a live capability.",
  },
];

export default function Platform() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900">
      <Header variant="solid" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <header className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            MarginMix Platform
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
            Margin-risk clarity, in stages
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Start with an engagement-level estimate. The planned document review and future product direction are
            clearly separate from what is available today.
          </p>
        </header>

        <section aria-label="MarginMix product stages" className="grid gap-5 lg:grid-cols-3">
          {stages.map((stage, index) => (
            <article
              key={stage.title}
              className={`flex flex-col rounded-2xl border bg-white/90 dark:bg-gray-800/90 p-6 shadow-sm ${
                index === 0 ? "border-emerald-500 ring-1 ring-emerald-200 dark:ring-emerald-800" : "border-slate-200 dark:border-gray-700"
              }`}
            >
              <p className={`text-sm font-semibold ${index === 0 ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                {stage.status}
              </p>
              <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">{stage.title}</h2>
              <p className="mt-4 flex-1 leading-relaxed text-slate-600 dark:text-slate-300">{stage.body}</p>
              {stage.action && (
                <Link href="/free-tier/input" className="mt-6">
                  <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                    Try Free Scanner
                  </Button>
                </Link>
              )}
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl bg-slate-900 px-6 py-8 text-center text-white sm:px-10">
          <h2 className="text-xl sm:text-2xl font-semibold">Discuss an engagement or enterprise use case</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Book a conversation about MarginMix and the current calculator. This does not activate planned features.
          </p>
          <a
            href="https://calendly.com/sid-marginmix/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block"
          >
            <Button variant="outline" className="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white">
              Book a Demo
            </Button>
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
