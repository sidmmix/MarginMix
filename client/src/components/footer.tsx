import { Link } from "wouter";
import { BrandName } from "@/components/brand-name";

interface FooterProps {
  notice?: string;
}

export function Footer({ notice }: FooterProps) {
  return (
    <footer className="bg-[#123b36] text-[#f5f3eb]">
      {notice && (
        <div className="border-b border-white/15 px-4 py-4">
          <p className="mx-auto max-w-7xl text-center text-xs font-bold leading-5 text-[#e5eee7] sm:text-sm">
            {notice.split(/(MarginMix)/).map((part, index) =>
              part === "MarginMix" ? <BrandName key={index} className="mm-brand-pad" /> : part
            )}
          </p>
        </div>
      )}
      <div className="mx-auto grid max-w-7xl gap-9 px-4 py-10 sm:px-8 sm:py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
        <div>
          <Link href="/" className="inline-flex rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d5e96c]">
            <BrandName className="mm-brand-pad text-2xl" />
          </Link>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#adc7bb]">Margin risk clarity</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#d9e5dd]">
            A decision system for margin governance, not a delivery or productivity platform.
          </p>
        </div>
        <div className="grid gap-7 sm:grid-cols-[1fr_auto] sm:items-end">
          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm font-semibold text-[#d9e5dd]">
            <Link href="/platform" className="hover:text-[#d5e96c]">Platform</Link>
            <Link href="/founder" className="hover:text-[#d5e96c]">Why we exist</Link>
            <Link href="/why-choose" className="hover:text-[#d5e96c]">Why choose us</Link>
            <Link href="/free-tier/input" className="hover:text-[#d5e96c]">Free calculator</Link>
          </nav>
          <div className="text-sm text-[#d9e5dd] sm:text-right">
            <p className="text-xs text-[#91aaa1]">Contact</p>
            <a href="mailto:sid@marginmix.ai" className="mt-1 inline-block font-semibold text-[#d5e96c] hover:text-white">sid@marginmix.ai</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 sm:px-8">
        <p className="mx-auto max-w-7xl text-xs text-[#91aaa1]"><BrandName className="mm-brand-pad" />-Headroom. All rights reserved.</p>
      </div>
    </footer>
  );
}
