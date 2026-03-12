import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Link href="/">
            <h3 className="text-2xl font-bold text-emerald-400 mb-1 cursor-pointer hover:text-emerald-300">MarginMix</h3>
          </Link>
          <p className="text-sm italic text-gray-400 mb-4" style={{ fontFamily: 'Georgia, serif' }}>Margin Risk Clarity</p>
          <p className="text-gray-300 mb-6 mt-4">
            MarginMix is a decision system for margin governance — not a delivery or productivity platform.
          </p>
          <p className="text-gray-300 mb-6">
            Contact: <a href="mailto:sid@marginmix.ai" className="text-emerald-400 hover:text-emerald-300">sid@marginmix.ai</a> <span className="text-white">·</span> <a href="tel:+16286001309" className="text-emerald-400 hover:text-emerald-300">+1.628.600.1309</a>
          </p>
          <p className="text-gray-400 text-sm mb-2">
            MarginMix is a Digital Lexicon Corp brand.
          </p>
          <p className="text-gray-400 text-sm mb-2">
            Digital Lexicon, Delaware, DE
          </p>
          <p className="text-gray-400 text-sm">
            © 2026 Digital Lexicon. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
