import React from 'react';
import { ExternalLink, Star, Shield, Zap, Users } from 'lucide-react';

const AffiliateSection = ({ className = "py-16 bg-gradient-to-br from-slate-50 to-blue-50" }) => {
  // Affiliate partners - replace with actual affiliate links
  const affiliatePartners = [
    {
      name: "LegalZoom",
      description: "Complete business formation and legal services",
      features: ["Business Registration", "Legal Documents", "Trademark Services"],
      rating: 4.8,
      ctaText: "Start Your Business",
      affiliateUrl: "#", // Replace with actual affiliate link
      logo: "🏢",
      category: "Business Formation"
    },
    {
      name: "Clio",
      description: "Leading practice management software for law firms",
      features: ["Case Management", "Time Tracking", "Client Portal"],
      rating: 4.9,
      ctaText: "Try Free Trial",
      affiliateUrl: "#", // Replace with actual affiliate link
      logo: "⚖️",
      category: "Practice Management"
    },
    {
      name: "Westlaw",
      description: "Comprehensive legal research platform",
      features: ["Legal Research", "Case Law", "Expert Analysis"],
      rating: 4.7,
      ctaText: "Access Research",
      affiliateUrl: "#", // Replace with actual affiliate link
      logo: "📚",
      category: "Legal Research"
    },
    {
      name: "DocuSign",
      description: "Electronic signature and agreement platform",
      features: ["Digital Signatures", "Document Workflow", "Compliance"],
      rating: 4.8,
      ctaText: "Sign Documents",
      affiliateUrl: "#", // Replace with actual affiliate link
      logo: "✍️",
      category: "Document Management"
    }
  ];

  const handleAffiliateClick = (url, partnerName) => {
    // Track affiliate clicks for analytics
    if (window.gtag) {
      window.gtag('event', 'affiliate_click', {
        'partner_name': partnerName,
        'event_category': 'affiliate_marketing'
      });
    }
    
    // Open affiliate link
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Complete Your Legal Workflow
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Document conversion is just the beginning. Discover the professional tools 
            trusted by legal experts to streamline every aspect of their practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {affiliatePartners.map((partner, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{partner.logo}</span>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{partner.name}</h3>
                    <span className="text-sm text-blue-600 font-medium">{partner.category}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-700 ml-1">{partner.rating}</span>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{partner.description}</p>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Key Features:</h4>
                <ul className="space-y-1">
                  {partner.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <Shield className="h-3 w-3 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleAffiliateClick(partner.affiliateUrl, partner.name)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
              >
                {partner.ctaText}
                <ExternalLink className="h-4 w-4 ml-2" />
              </button>
            </div>
          ))}
        </div>

        {/* Why These Partners Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Why Legal Professionals Choose These Partners
            </h3>
            <p className="text-gray-600">
              We've carefully selected these partners based on their reputation, 
              reliability, and proven track record in the legal industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-blue-900 mb-2">Trusted by Thousands</h4>
              <p className="text-sm text-blue-700">
                Each partner serves thousands of legal professionals worldwide
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-green-900 mb-2">Security First</h4>
              <p className="text-sm text-green-700">
                All partners meet strict security and compliance standards
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Zap className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold text-purple-900 mb-2">Seamless Integration</h4>
              <p className="text-sm text-purple-700">
                Tools that work together to streamline your workflow
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            * We may earn a commission from purchases made through these affiliate links. 
            This helps us keep our document conversion service free while recommending 
            only the best tools for legal professionals.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AffiliateSection;