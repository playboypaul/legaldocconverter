import React from 'react';
import { Card, CardContent } from '../ui/card';
import { FileText, Shield, RefreshCw, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

const LegalSuiteSection = () => {
  const suiteApps = [
    {
      name: 'Legal Draft Agent',
      tagline: 'Create Legal Documents',
      description: 'AI-powered legal document drafting. Generate contracts, NDAs, agreements, and more with intelligent templates.',
      url: 'https://legaldraftagent.abacusai.app',
      icon: FileText,
      color: 'from-emerald-500 to-teal-500',
      features: ['AI Document Generation', 'Legal Templates', 'Custom Clauses']
    },
    {
      name: 'LegalDocConverter',
      tagline: 'Convert & Process Documents',
      description: 'Convert between 30+ formats, OCR scanned documents, annotate PDFs, and track version history.',
      url: null, // Current app
      icon: RefreshCw,
      color: 'from-blue-500 to-indigo-500',
      features: ['Format Conversion', 'OCR Extraction', 'Version History'],
      current: true
    },
    {
      name: 'ContractReviewPro',
      tagline: 'Review & Analyze Contracts',
      description: 'AI-powered contract analysis. Identify risks, compare terms, and get actionable insights.',
      url: 'https://contractreviewpro.abacusai.app',
      icon: Shield,
      color: 'from-purple-500 to-pink-500',
      features: ['Risk Analysis', 'Clause Detection', 'Compliance Checks']
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">Complete Legal Workflow</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Your Legal Document Suite
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Three powerful tools working together to streamline your entire legal document workflow - 
            from creation to conversion to review.
          </p>
        </div>

        {/* Workflow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {suiteApps.map((app, index) => {
            const IconComponent = app.icon;
            return (
              <div key={app.name} className="relative">
                {/* Connector Arrow (hidden on mobile and last item) */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-8 w-8 text-slate-300" />
                  </div>
                )}
                
                <Card className={`border-0 shadow-xl h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  app.current ? 'ring-2 ring-blue-500' : ''
                }`}>
                  <CardContent className="p-6">
                    {/* App Header */}
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${app.color} mb-4`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    
                    {app.current && (
                      <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        You are here
                      </span>
                    )}
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{app.name}</h3>
                    <p className="text-sm font-medium text-slate-500 mb-3">{app.tagline}</p>
                    <p className="text-slate-600 text-sm mb-4">{app.description}</p>
                    
                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {app.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-slate-600">
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${app.color} mr-2`} />
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    {/* CTA Button */}
                    {app.url ? (
                      <a 
                        href={app.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button 
                          className={`w-full bg-gradient-to-r ${app.color} hover:opacity-90 text-white`}
                        >
                          Open {app.name}
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </a>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                        onClick={() => document.getElementById('processor')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        Start Converting
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Workflow Description */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-4">
            Seamless Legal Document Workflow
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-4 text-white/80">
            <span className="flex items-center">
              <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold mr-2">1</span>
              Draft with Legal Draft Agent
            </span>
            <ArrowRight className="h-5 w-5 hidden md:block" />
            <span className="flex items-center">
              <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-2">2</span>
              Convert with LegalDocConverter
            </span>
            <ArrowRight className="h-5 w-5 hidden md:block" />
            <span className="flex items-center">
              <span className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold mr-2">3</span>
              Review with ContractReviewPro
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LegalSuiteSection;
