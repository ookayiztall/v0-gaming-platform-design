'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ThemeToggle from './theme-toggle';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: 'Features', href: '#features' },
  { label: 'Games', href: '#games' },
  { label: 'Community', href: '#community' },
  { label: 'Stats', href: '#stats' },
];

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ duration: 0.3 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-background p-6"
          >
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2" onClick={onClose}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white">
                  <Gamepad2 className="h-4 w-4" />
                </div>
                <span className="font-bold text-foreground">GameVerse</span>
              </Link>
              <button onClick={onClose} aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="mb-8 space-y-4">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="space-y-4 border-t border-border/40 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>

              <Link href="/login" onClick={onClose} className="block">
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>

              <Link href="/register" onClick={onClose} className="block">
                <Button className="w-full">Play Now</Button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
