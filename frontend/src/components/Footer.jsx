import React from 'react';
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
                <a 
                  href="#features" 
                  className="hover:text-white transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('features')?.scrollIntoView({behavior: 'smooth'});
                  }}
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="#pricing" 
                  className="hover:text-white transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'});
                  }}
                >
                  Pricing
                </a>
              </li>
              <li>
                <button 
                  onClick={() => window.openSecurityPage && window.openSecurityPage()}
                  className="hover:text-white transition-colors text-left"
                >
                  Security
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a 
                  href="mailto:support@legaldocconverter.com" 
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <button 
                  onClick={() => window.openTermsOfService && window.openTermsOfService()}
                  className="hover:text-white transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.openPrivacyPolicy && window.openPrivacyPolicy()}
                  className="hover:text-white transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.openCookiePolicy && window.openCookiePolicy()}
                  className="hover:text-white transition-colors text-left"
                >
                  Cookie Policy
                </button>
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
              <button 
                onClick={() => window.openPrivacyPolicy && window.openPrivacyPolicy()}
                className="text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => window.openTermsOfService && window.openTermsOfService()}
                className="text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => window.openCookiePolicy && window.openCookiePolicy()}
                className="text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
              >
                Cookie Policy
              </button>
              <button 
                onClick={() => window.openSecurityPage && window.openSecurityPage()}
                className="text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
              >
                Security
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;