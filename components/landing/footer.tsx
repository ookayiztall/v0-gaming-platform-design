'use client';

import { Gamepad2 } from 'lucide-react';
import Link from 'next/link';

const footerLinks = {
  Platform: ['Games', 'Leaderboard', 'Tournaments', 'Events'],
  Community: ['Chat', 'Friends', 'Blog', 'Discord'],
  Company: ['About', 'Careers', 'Press', 'Contact'],
  Legal: ['Terms', 'Privacy', 'Cookies', 'Guidelines'],
};

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background py-12 px-4">
      <div className="container mx-auto">
        <div className="grid gap-8 md:grid-cols-5 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white">
                <Gamepad2 className="h-4 w-4" />
              </div>
              <span className="font-bold text-foreground">GameVerse</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your ultimate gaming community. Play, compete, and connect.
            </p>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4 text-sm">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 GameVerse. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex gap-4">
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="text-sm">Twitter</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="text-sm">Discord</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="text-sm">YouTube</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
