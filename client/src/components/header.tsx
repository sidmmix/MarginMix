import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
interface HeaderProps {
  variant?: "transparent" | "solid";
}

export function Header({ variant = "transparent" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const shouldReduce = useReducedMotion();

  const handleLogout = async () => {
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
    { href: "/founder", label: "Why We Exist", mobileLabel: "Why We Exist" },
    { href: "/why-choose", label: "Why Choose Us", mobileLabel: "Why Choose Us" },
    { href: "/assessment", label: "Paid Assessment", mobileLabel: "Paid Assessment" },
  ];

  const isActive = (href: string) => location === href;

  const bgClass = variant === "solid" 
    ? "bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
    : "border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-800";

  return (
    <nav className={`${bgClass} fixed top-0 left-0 right-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" onClick={scrollToTop}>
              <div className="flex-shrink-0 flex flex-col cursor-pointer">
                <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">MarginMix</h1>
                <span className="text-xs italic text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Georgia, serif' }}>Margin Risk Clarity</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={scrollToTop}>
                <span className={`text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium cursor-pointer whitespace-nowrap ${isActive(link.href) ? 'border-b-2 border-emerald-600' : ''}`}>
                  {link.label}
                </span>
              </Link>
            ))}
            <motion.div
              whileHover={shouldReduce ? {} : { scale: 1.05 }}
              whileTap={shouldReduce ? {} : { scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <a href="https://calendly.com/sid-marginmix/30min" target="_blank" rel="noopener noreferrer">
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                  Book Demo
                </Button>
              </a>
            </motion.div>
            <motion.div
              whileHover={shouldReduce ? {} : { scale: 1.04 }}
              whileTap={shouldReduce ? {} : { scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Link href="/quick-profiler" onClick={scrollToTop}>
                <Button
                  size="sm"
                  className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-600 rounded-lg whitespace-nowrap"
                >
                  Free Delivery Risk Check - 60 seconds!
                </Button>
              </Link>
            </motion.div>
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid="text-username">
                      {String((user as Record<string, unknown>).firstName || '')} {String((user as Record<string, unknown>).lastName || '')}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400" data-testid="text-email">
                      {String((user as Record<string, unknown>).email || '')}
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
            <motion.div
              whileHover={shouldReduce ? {} : { scale: 1.05 }}
              whileTap={shouldReduce ? {} : { scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <a href="https://calendly.com/sid-marginmix/30min" target="_blank" rel="noopener noreferrer">
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs px-2 py-1 h-7"
                >
                  Book Demo
                </Button>
              </a>
            </motion.div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
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
              className="md:hidden overflow-hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
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
                      <span className={`block text-gray-800 dark:text-gray-100 hover:text-emerald-700 dark:hover:text-emerald-300 text-base font-medium cursor-pointer py-3 px-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${isActive(link.href) ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border-l-4 border-emerald-600' : ''}`}>
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
                    <a href="https://calendly.com/sid-marginmix/30min" target="_blank" rel="noopener noreferrer" className="block">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                        Book Demo
                      </Button>
                    </a>
                  </motion.div>
                  <motion.div
                    whileHover={shouldReduce ? {} : { scale: 1.02 }}
                    whileTap={shouldReduce ? {} : { scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link href="/quick-profiler" onClick={scrollToTop} className="block">
                      <Button className="w-full bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-600 text-sm">
                        Free Delivery Risk Check - 60 seconds!
                      </Button>
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
                        {String((user as Record<string, unknown>).firstName || '')} {String((user as Record<string, unknown>).lastName || '')}
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
    </nav>
  );
}
