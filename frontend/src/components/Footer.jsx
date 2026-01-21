import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Mail, MapPin, Twitter, Linkedin, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">LegalDocConverter</h3>
                <p className="text-slate-400 text-sm">legaldocconverter.com</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Professional legal document conversion and AI analysis platform. 
              Trusted by legal professionals worldwide for seamless document processing.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link 
                  to="/features"
                  className="hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link 
                  to="/pricing"
                  className="hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link 
                  to="/security"
                  className="hover:text-white transition-colors"
                >
                  Security
                </Link>
              </li>
              <li>
                <Link 
                  to="/about"
                  className="hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link 
                  to="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookies"
                  className="hover:text-white transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-slate-400">
              <div className="flex items-start space-x-3">
                <Mail className="h-4 w-4 mt-1" />
                <div>
                  <p className="text-sm font-medium text-white mb-1">Email Support</p>
                  <a 
                    href="mailto:support@legaldocconverter.com"
                    className="text-sm hover:text-white transition-colors"
                  >
                    support@legaldocconverter.com
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 mt-1" />
                <div>
                  <p className="text-sm font-medium text-white mb-1">Location</p>
                  <span className="text-sm">Alberta, Canada</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                <p className="text-sm font-medium text-white">Visit us at:</p>
                <p className="text-blue-400 font-semibold">legaldocconverter.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © 2025 LegalDocConverter.com. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                to="/privacy"
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms"
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                to="/cookies"
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Cookie Policy
              </Link>
              <Link 
                to="/security"
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Security
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;