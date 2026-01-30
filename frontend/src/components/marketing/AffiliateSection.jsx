import React from 'react';
import { ExternalLink, Star, Shield, Zap, FileText, Scale } from 'lucide-react';

const AffiliateSection = ({ className = "py-16 bg-gradient-to-br from-slate-50 to-blue-50" }) => {
  // Your REAL partner sites
  const partnerSites = [
    {
      name: "Contract Review Pro",
      url: "https://contractreviewpro.abacusai.app/",
      description: "Upload any contract and get comprehensive analysis with summaries, risk assessments, and actionable insights powered by advanced AI.",
      features: ["Contract Analysis", "Risk Assessment", "AI-Powered Insights"],
      icon: FileText,
      color: "blue",
      category: "Contract Analysis"
    },
    {
      name: "LegalDraftAgent",
      url: "https://legaldraftagent.abacusai.app",
      description: "Generate legally-compliant Canadian documents in minutes. From NDAs to Power of Attorney, our AI drafts professional documents tailored to your needs.",
      features: ["Document Generation", "Canadian Legal Compliance", "AI-Powered Drafting"],
      icon: Scale,
      color: "purple",
      category: "Document Drafting"
    }
  ];

  const handlePartnerClick = (url, partnerName) => {
    // Track clicks for analytics
    if (window.gtag) {
      window.gtag('event', 'partner_click', {
        'partner_name': partnerName,
        'event_category': 'partner_sites'
      });
    }
    
    // Open partner link
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
            Document conversion is just the beginning. Explore our suite of AI-powered legal tools 
            designed to streamline every aspect of your legal work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {partnerSites.map((partner, index) => {
            const IconComponent = partner.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg bg-${partner.color}-100 mr-3`}>
                      <IconComponent className={`h-6 w-6 text-${partner.color}-600`} />
                    </div>
                    <div>
                      <a 
                        href={partner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors"
                        data-testid={`partner-link-${index}`}
                      >
                        {partner.name}
                      </a>
                      <span className={`block text-sm text-${partner.color}-600 font-medium`}>
                        {partner.category}
                      </span>
                    </div>
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
                  onClick={() => handlePartnerClick(partner.url, partner.name)}
                  className={`w-full bg-gradient-to-r from-${partner.color}-600 to-${partner.color}-700 hover:from-${partner.color}-700 hover:to-${partner.color}-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center`}
                  data-testid={`partner-btn-${index}`}
                >
                  Visit {partner.name}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Why These Tools Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              AI-Powered Legal Tools Suite
            </h3>
            <p className="text-gray-600">
              Our ecosystem of legal tools works together to provide comprehensive 
              support for all your document needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-blue-900 mb-2">Convert Documents</h4>
              <p className="text-sm text-blue-700">
                Use LegalDocConverter to convert between 30+ document formats
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-green-900 mb-2">Analyze Contracts</h4>
              <p className="text-sm text-green-700">
                Get AI-powered contract analysis with Contract Review Pro
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Zap className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold text-purple-900 mb-2">Draft Documents</h4>
              <p className="text-sm text-purple-700">
                Generate legal documents instantly with LegalDraftAgent
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AffiliateSection;
