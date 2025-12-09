import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { ArrowLeft, Scale, FileText, Shield } from 'lucide-react';

const TermsOfService = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button 
            onClick={onBack} 
            variant="ghost" 
            className="mb-4 text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
              <p className="text-slate-600">LegalDocConverter.com</p>
            </div>
          </div>
          
          <p className="text-slate-600">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                
                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    1. Acceptance of Terms
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    By accessing and using LegalDocConverter.com ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    These Terms of Service ("Terms") govern your use of our website located at legaldocconverter.com operated by LegalDocConverter ("us", "we", or "our").
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    2. Description of Service
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    LegalDocConverter provides document conversion and AI-powered legal document analysis services. Our service allows users to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>Convert legal documents between various formats (PDF, DOCX, TXT, RTF, ODT, HTML)</li>
                    <li>Obtain AI-powered analysis of legal documents</li>
                    <li>Access risk assessments and compliance evaluations</li>
                    <li>Download converted documents and analysis reports</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    3. User Accounts and Registration
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    To access certain features of the Service, you must register for an account. When you register for an account, you must provide information that is accurate, complete, and current at all times.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    You are responsible for safeguarding the password and for maintaining the confidentiality of your account. You agree not to disclose your password to any third party.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    4. Subscription Plans and Billing
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Free Plan</h3>
                      <ul className="list-disc pl-6 space-y-1 text-slate-700">
                        <li>3 document uploads per account</li>
                        <li>1 AI legal analysis per account</li>
                        <li>Basic format conversions</li>
                        <li>Standard email support</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Professional Plan ($49.99/month)</h3>
                      <ul className="list-disc pl-6 space-y-1 text-slate-700">
                        <li>Unlimited document uploads</li>
                        <li>Unlimited AI legal analysis</li>
                        <li>Advanced AI analysis features</li>
                        <li>All format conversions</li>
                        <li>Priority support</li>
                        <li>Bulk processing capabilities</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed mt-4">
                    Subscription fees are charged monthly and are non-refundable except as required by law. You may cancel your subscription at any time through your account settings.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    5. Document Upload and Processing
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    By uploading documents to our Service, you represent and warrant that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>You own the documents or have the legal right to upload and process them</li>
                    <li>The documents do not contain malicious code, viruses, or harmful content</li>
                    <li>You comply with all applicable laws regarding the documents</li>
                    <li>The documents do not violate any third-party rights</li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    We automatically delete uploaded documents and processed files from our servers after processing is complete or after 24 hours, whichever comes first.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    6. AI Analysis Disclaimer
                  </h2>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 font-semibold mb-2">IMPORTANT LEGAL DISCLAIMER:</p>
                    <p className="text-yellow-800 text-sm leading-relaxed">
                      The AI-powered legal analysis provided by our Service is for informational purposes only and does not constitute legal advice. 
                      You should not rely on our analysis as a substitute for professional legal counsel.
                    </p>
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>Our AI analysis is not a substitute for professional legal advice</li>
                    <li>Always consult with qualified legal professionals before making legal decisions</li>
                    <li>We make no warranties about the accuracy or completeness of the analysis</li>
                    <li>Legal requirements vary by jurisdiction and circumstances</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    7. Prohibited Uses
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    You may not use our Service:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                    <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                    <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                    <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                    <li>To submit false or misleading information</li>
                    <li>To upload or transmit viruses or any other type of malicious code</li>
                    <li>To collect or track the personal information of others</li>
                    <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    8. Intellectual Property Rights
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Service and its original content, features, and functionality are and will remain the exclusive property of LegalDocConverter and its licensors. The Service is protected by copyright, trademark, and other laws.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    You retain ownership of any documents you upload to our Service. We do not claim ownership of your content.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    9. Privacy and Data Protection
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    We implement appropriate security measures to protect your personal information and documents against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    10. Limitation of Liability
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    IN NO EVENT SHALL LEGALDOCCONVERTER, NOR ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    11. Disclaimer of Warranties
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. LEGALDOCCONVERTER MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE REGARDING THE SERVICE.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    12. Termination
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Upon termination, your right to use the Service will cease immediately. If you wish to terminate your account, you may simply discontinue using the Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    13. Governing Law
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    These Terms shall be interpreted and governed by the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    14. Changes to Terms
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    15. Contact Information
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-slate-700"><strong>Email:</strong> legal@legaldocconverter.com</p>
                    <p className="text-slate-700"><strong>Website:</strong> https://legaldocconverter.com</p>
                    <p className="text-slate-700"><strong>Address:</strong> LegalDocConverter, Alberta, Canada</p>
                  </div>
                </section>

              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;