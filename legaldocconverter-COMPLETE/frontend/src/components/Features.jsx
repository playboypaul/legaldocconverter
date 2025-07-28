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
      highlights: ["15+ file formats", "Batch processing", "Preserved formatting"],
      gradient: "from-blue-500 to-indigo-500",
      bgGradient: "from-blue-50 to-indigo-50"
    },
    {
      icon: Brain,
      title: "AI Legal Analysis",
      description: "Advanced AI analyzes contracts, agreements, and legal documents for key insights.",
      highlights: ["Risk assessment", "Compliance checking", "Key provisions extraction"],
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-50 to-purple-50"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with legal industry security standards.",
      highlights: ["256-bit encryption", "GDPR compliant", "SOC 2 certified"],
      gradient: "from-slate-600 to-slate-800",
      bgGradient: "from-slate-50 to-gray-50"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process documents in seconds with our optimized conversion algorithms.",
      highlights: ["< 3 second conversion", "Real-time analysis", "Instant download"],
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50"
    },
    {
      icon: FileSearch,
      title: "Document Intelligence",
      description: "Extract metadata, identify document types, and categorize legal content automatically.",
      highlights: ["Auto-categorization", "Metadata extraction", "Content classification"],
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-50 to-green-50"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share documents, analyses, and collaborate with your legal team seamlessly.",
      highlights: ["Team workspaces", "Shared libraries", "Access controls"],
      gradient: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-50 to-pink-50"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
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
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 bg-gradient-to-br from-white to-slate-50/50 overflow-hidden"
              >
                <CardHeader className={`pb-6 bg-gradient-to-br ${feature.bgGradient} border-b border-opacity-20`}>
                  <div className={`p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {feature.highlights.map((highlight, highlightIndex) => (
                      <li key={highlightIndex} className="flex items-center text-sm">
                        <div className={`p-1 rounded-full bg-gradient-to-r ${feature.gradient} mr-3`}>
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-slate-700 font-medium">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
              How It Works
            </h3>
            <p className="text-lg text-slate-600">
              Simple 3-step process to convert and analyze your legal documents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="group text-center">
              <div className="relative mb-8">
                <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl w-fit mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2">
                  <FileText className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                  1
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                <h4 className="text-xl font-bold text-slate-900 mb-4">Upload Document</h4>
                <p className="text-slate-700 leading-relaxed">
                  Upload your legal document in any supported format. Our system automatically 
                  detects the file type and prepares it for processing.
                </p>
              </div>
            </div>

            <div className="group text-center">
              <div className="relative mb-8">
                <div className="p-6 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl w-fit mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2">
                  <Brain className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-lg font-bold rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                  2
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border-2 border-violet-200">
                <h4 className="text-xl font-bold text-slate-900 mb-4">Choose Action</h4>
                <p className="text-slate-700 leading-relaxed">
                  Select whether you want to convert to a different format, get AI analysis, 
                  or both. Our AI provides detailed legal insights and risk assessments.
                </p>
              </div>
            </div>

            <div className="group text-center">
              <div className="relative mb-8">
                <div className="p-6 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl w-fit mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2">
                  <Download className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-lg font-bold rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                  3
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200">
                <h4 className="text-xl font-bold text-slate-900 mb-4">Get Results</h4>
                <p className="text-slate-700 leading-relaxed">
                  Download your converted document or review the comprehensive AI analysis 
                  with actionable insights and recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;