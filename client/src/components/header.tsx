import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BrandName } from "@/components/brand-name";
import { Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
interface HeaderProps {
  notice?: string;
  onLogout?: () => Promise<void>;
}

export function Header({
  notice,
  onLogout,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const shouldReduce = useReducedMotion();

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
      return;
    }
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setIsMenuOpen(false);
  };

  const navLinks = [
    { href: "/platform", label: "Platform", mobileLabel: "Platform" },
    { href: "/founder", label: "Why We Exist", mobileLabel: "Why We Exist" },
    { href: "/why-choose", label: "Why Choose Us", mobileLabel: "Why Choose Us" },
  ];

  const isActive = (href: string) => location === href;

  const bgClass = "bg-[#fbfaf5]/95 backdrop-blur-xl shadow-[0_8px_24px_rgba(22,63,58,.06)] border-b border-[#dce5dc]";

  return (
    <nav className={`${bgClass} mm-nav fixed top-0 left-0 right-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" onClick={scrollToTop}>
              <div className="flex-shrink-0 flex flex-col cursor-pointer">
                <h1 className="text-[1.35rem] font-extrabold tracking-[-.06em]"><BrandName /></h1>
                <span className="text-[9px] font-bold uppercase tracking-[.16em] text-[#69817b]">Margin risk clarity</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={scrollToTop}>
                <span className={`text-[#355e56] hover:text-[#146d58] text-[13px] font-semibold cursor-pointer whitespace-nowrap ${isActive(link.href) ? 'border-b-2 border-[#146d58]' : ''}`}>
                  {link.label}
                </span>
              </Link>
            ))}
            <motion.div
              whileHover={shouldReduce ? {} : { scale: 1.04 }}
              whileTap={shouldReduce ? {} : { scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Link href="/free-tier/input" onClick={scrollToTop} className="mm-action inline-flex items-center justify-center bg-[#146d58] hover:bg-[#0c5747] text-white whitespace-nowrap px-5 py-2 text-sm font-semibold">
                Try Free Scanner
              </Link>
              </motion.div>
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-[#e7f0e8] rounded-full">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#183b37]" data-testid="text-username">
                      {user.firstName || ""} {user.lastName || ""}
                    </span>
                    <span className="text-xs text-[#60776f]" data-testid="text-email">
                      {user.primaryEmailAddress?.emailAddress || ""}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              </div>
            ) : null}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
              className="p-2 text-[#146d58]"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMenuOpen ? (
                  <motion.span
                    key="close"
                    initial={shouldReduce ? false : { rotate: -90, opacity: 0 }}
                    animate={shouldReduce ? undefined : { rotate: 0, opacity: 1 }}
                    exit={shouldReduce ? undefined : { rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <X className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={shouldReduce ? false : { rotate: 90, opacity: 0 }}
                    animate={shouldReduce ? undefined : { rotate: 0, opacity: 1 }}
                    exit={shouldReduce ? undefined : { rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Menu className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={shouldReduce ? false : { opacity: 0, height: 0 }}
              animate={shouldReduce ? undefined : { opacity: 1, height: "auto" }}
              exit={shouldReduce ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden bg-[#fbfaf5] border-t border-[#dce5dc]"
            >
              <div className="flex flex-col space-y-1 pb-4 pt-3">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={shouldReduce ? false : { opacity: 0, x: -16 }}
                    animate={shouldReduce ? undefined : { opacity: 1, x: 0 }}
                    transition={{ delay: shouldReduce ? 0 : i * 0.06, duration: 0.25 }}
                  >
                    <Link href={link.href} onClick={scrollToTop}>
                      <span className={`block text-[#294c45] hover:text-[#146d58] text-base font-semibold cursor-pointer py-3 px-3 rounded-xl hover:bg-[#e9f1eb] ${isActive(link.href) ? 'bg-[#e9f1eb] text-[#146d58] border-l-4 border-[#146d58]' : ''}`}>
                        {link.mobileLabel}
                      </span>
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={shouldReduce ? false : { opacity: 0, x: -16 }}
                  animate={shouldReduce ? undefined : { opacity: 1, x: 0 }}
                  transition={{ delay: shouldReduce ? 0 : navLinks.length * 0.06, duration: 0.25 }}
                  className="pt-2 px-3 flex flex-col space-y-2"
                >
                  <motion.div
                    whileHover={shouldReduce ? {} : { scale: 1.02 }}
                    whileTap={shouldReduce ? {} : { scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link href="/free-tier/input" onClick={scrollToTop} className="mm-action flex w-full items-center justify-center bg-[#146d58] hover:bg-[#0c5747] text-white text-sm font-semibold py-2.5">
                      Try Free Scanner
                    </Link>
                    </motion.div>
                </motion.div>
                {isAuthenticated && user ? (
                  <motion.div
                    initial={shouldReduce ? false : { opacity: 0 }}
                    animate={shouldReduce ? undefined : { opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-2"
                  >
                    <div className="flex items-center space-x-2 px-3 py-2">
                      <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.firstName || ""} {user.lastName || ""}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full mt-2"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </Button>
                  </motion.div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {notice && (
        <div className="border-t border-[#dce5dc] bg-[#f0f4e9] px-4 py-2">
          <p className="mx-auto max-w-7xl text-center text-[11px] font-bold text-[#294c45] sm:text-xs">
            {notice.split(/(MarginMix)/).map((part, index) =>
              part === "MarginMix" ? <BrandName key={index} /> : part
            )}
          </p>
        </div>
      )}
    </nav>
  );
}
