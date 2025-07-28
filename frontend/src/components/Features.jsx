import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  FileText, 
  Brain, 
  Shield, 
  Zap, 
  Globe, 
  Clock, 
  Users, 
  CheckCircle,
  FileSearch,
  Download
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: FileText,
      title: "Multi-Format Support",
      description: "Convert between PDF, DOCX, TXT, RTF, ODT, and HTML formats with perfect fidelity.",
      highlights: ["15+ file formats", "Batch processing", "Preserved formatting"]
    },
    {
      icon: Brain,
      title: "AI Legal Analysis",
      description: "Advanced AI analyzes contracts, agreements, and legal documents for key insights.",
      highlights: ["Risk assessment", "Compliance checking", "Key provisions extraction"]
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with legal industry security standards.",
      highlights: ["256-bit encryption", "GDPR compliant", "SOC 2 certified"]
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process documents in seconds with our optimized conversion algorithms.",
      highlights: ["< 3 second conversion", "Real-time analysis", "Instant download"]
    },
    {
      icon: FileSearch,
      title: "Document Intelligence",
      description: "Extract metadata, identify document types, and categorize legal content automatically.",
      highlights: ["Auto-categorization", "Metadata extraction", "Content classification"]
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share documents, analyses, and collaborate with your legal team seamlessly.",
      highlights: ["Team workspaces", "Shared libraries", "Access controls"]
    }
  ];

  return (
    <section id="features" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Powerful Features for Legal Professionals
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Everything you need to streamline your legal document workflow, from conversion 
            to analysis, all in one professional platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white"
              >
                <CardHeader className="pb-4">
                  <div className="p-3 bg-slate-100 rounded-full w-fit mb-4">
                    <IconComponent className="h-6 w-6 text-slate-700" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, highlightIndex) => (
                      <li key={highlightIndex} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-slate-600">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
              How It Works
            </h3>
            <p className="text-lg text-slate-600">
              Simple 3-step process to convert and analyze your legal documents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative">
                <div className="p-4 bg-slate-900 rounded-full w-fit mx-auto mb-6">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-slate-700 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  1
                </div>
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-3">Upload Document</h4>
              <p className="text-slate-600">
                Upload your legal document in any supported format. Our system automatically 
                detects the file type and prepares it for processing.
              </p>
            </div>

            <div className="text-center">
              <div className="relative">
                <div className="p-4 bg-slate-900 rounded-full w-fit mx-auto mb-6">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-slate-700 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  2
                </div>
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-3">Choose Action</h4>
              <p className="text-slate-600">
                Select whether you want to convert to a different format, get AI analysis, 
                or both. Our AI provides detailed legal insights and risk assessments.
              </p>
            </div>

            <div className="text-center">
              <div className="relative">
                <div className="p-4 bg-slate-900 rounded-full w-fit mx-auto mb-6">
                  <Download className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-slate-700 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  3
                </div>
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-3">Get Results</h4>
              <p className="text-slate-600">
                Download your converted document or review the comprehensive AI analysis 
                with actionable insights and recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;