import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Phone, Mail, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const isAgentOrLandlord = user?.role === 'agent' || user?.role === 'landlord';

  return (
    <footer className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        {/* Added justify-items-center for mobile consistency if needed, though text-center usually handles non-flex items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 text-center md:text-left">
          
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary">House me</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your trusted real estate platform for finding premium properties in Abuja. We connect you with the best homes in Nigeria's capital.
            </p>
            {/* FIX 1: Added justify-center md:justify-start */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>Serving Abuja & Environs</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              {isAgentOrLandlord && (
                <li>
                  <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Agent Dashboard
                  </Link>
                </li>
              )}
              <li>
                <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Login / Register
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Support</h3>
            <ul className="space-y-3">
              {/* FIX 2: Added justify-center md:justify-start to list items */}
              <li className="flex items-center justify-center md:justify-start gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:+2348012345678" className="text-muted-foreground hover:text-primary transition-colors">
                  +234 801 234 5678
                </a>
              </li>
              {/* FIX 3: Added justify-center md:justify-start to list items */}
              <li className="flex items-center justify-center md:justify-start gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:support@houseme.ng" className="text-muted-foreground hover:text-primary transition-colors">
                  support@houseme.ng
                </a>
              </li>
              <li className="text-sm text-muted-foreground">
                Mon - Fri: 9:00 AM - 6:00 PM
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Follow Us</h3>
            <p className="text-sm text-muted-foreground">
              Stay connected for the latest property listings
            </p>
            {/* This was already correct, but ensure it stays consistent */}
            <div className="flex gap-3 justify-center md:justify-start">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} House me. All rights reserved. | Proudly serving Abuja residents
          </p>
        </div>
      </div>
    </footer>
  );
};