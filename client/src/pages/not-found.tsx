import { Link } from "wouter";
import { ArrowLeft, Compass } from "lucide-react";
import { BrandName } from "@/components/brand-name";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function NotFound() {
  return (
    <div className="mm-page min-h-[100dvh]">
    <Header />
    <div className="h-16" aria-hidden="true" />
    <main className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-5 py-16">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#dce9d7]" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#e8e9d0]" />
      <section className="mm-panel relative w-full max-w-2xl overflow-hidden p-7 sm:p-12">
        <div className="mb-8 grid h-11 w-11 place-items-center rounded-2xl bg-[#e5f0e6] text-[#146d58]"><Compass size={22} /></div>
        <p className="mm-eyebrow">Nothing to review here</p>
        <h1 className="mm-display mt-3 text-6xl font-extrabold text-[#183b37] sm:text-8xl">404</h1>
        <p className="mt-5 max-w-md text-lg font-semibold text-[#294c45]">This page is outside the map.</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#60776f]">The address may have changed, or the page may no longer be available.</p>
        <Link href="/" className="mm-action mt-8 inline-flex items-center gap-2 bg-[#146d58] px-6 py-3 text-sm font-bold text-white hover:bg-[#0c5747]">
          <ArrowLeft size={16} /> Return to <BrandName className="mm-brand-pad" />
        </Link>
      </section>
    </main>
    <Footer />
    </div>
  );
}
