import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, MapPin } from 'lucide-react';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';
import {
  SUPPORT_ADDRESS,
  SUPPORT_EMAIL,
  SUPPORT_INSTAGRAM_URL,
  mailtoHref,
  whatsappHref,
} from '../../lib/contact';

const Footer = () => {
  return (
    <footer className="overflow-x-hidden border-t bg-background">
      <div className="container px-4 py-6 md:py-16">
        <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          <div className="min-w-0">
            <p className="mb-2 text-base font-bold md:mb-4 md:text-xl">PartyStorm</p>
            <p className="mb-3 max-w-sm text-xs leading-relaxed text-muted-foreground md:mb-4 md:text-sm">
              The ultimate platform for event discovery, ticketing, and management.
            </p>
            <div className="flex gap-4">
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Facebook">
                <Facebook className="h-4 w-4 md:h-5 md:w-5" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Twitter">
                <Twitter className="h-4 w-4 md:h-5 md:w-5" />
              </a>
              <a
                href={SUPPORT_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 md:h-5 md:w-5" />
              </a>
              <a
                href={whatsappHref('Hi PartyStorm, I need help with…')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#25D366] hover:opacity-80"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4 md:h-5 md:w-5" />
              </a>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-2">
            <div className="min-w-0">
              <h3 className="mb-2 text-sm font-semibold md:mb-4 md:text-lg">Quick Links</h3>
              <ul className="space-y-1.5 text-sm md:space-y-2">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-foreground">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/events" className="text-muted-foreground hover:text-foreground">
                    Events
                  </Link>
                </li>
                <li>
                  <Link to="/for-organizers" className="break-words text-muted-foreground hover:text-foreground">
                    Become an Organizer
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-muted-foreground hover:text-foreground">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            <div className="min-w-0">
              <h3 className="mb-2 text-sm font-semibold md:mb-4 md:text-lg">Support</h3>
              <ul className="space-y-1.5 text-sm md:space-y-2">
                <li>
                  <Link to="/help" className="text-muted-foreground hover:text-foreground">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-muted-foreground hover:text-foreground">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="break-words text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="mb-2 text-sm font-semibold md:mb-4 md:text-lg">Contact Us</h3>
            <ul className="space-y-2 text-sm md:space-y-3">
              <li className="flex min-w-0 items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 break-words text-muted-foreground">{SUPPORT_ADDRESS}</span>
              </li>
              <li className="flex min-w-0 items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <a href={mailtoHref()} className="min-w-0 break-all text-muted-foreground hover:text-foreground">
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex min-w-0 items-start gap-2">
                <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" />
                <a
                  href={whatsappHref('Hi PartyStorm, I need help with…')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground md:mt-12 md:pt-8 md:text-sm">
          <p>© {new Date().getFullYear()} PartyStorm. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
