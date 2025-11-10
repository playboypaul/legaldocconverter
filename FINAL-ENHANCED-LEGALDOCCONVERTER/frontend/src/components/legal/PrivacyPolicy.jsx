import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { ArrowLeft, Shield, Eye, Lock, Database } from 'lucide-react';

const PrivacyPolicy = ({ onBack }) => {
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
            <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
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
                    <Eye className="h-5 w-5 mr-2 text-green-600" />
                    1. Introduction
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    LegalDocConverter ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website legaldocconverter.com and our services.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access or use our Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <Database className="h-5 w-5 mr-2 text-green-600" />
                    2. Information We Collect
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">Personal Information</h3>
                      <p className="text-slate-700 leading-relaxed mb-3">
                        We may collect personal information that you voluntarily provide to us when you:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-slate-700">
                        <li>Register for an account</li>
                        <li>Subscribe to our services</li>
                        <li>Contact us for support</li>
                        <li>Use our document processing services</li>
                      </ul>
                      <p className="text-slate-700 leading-relaxed mt-3">
                        This may include: name, email address, billing information, and account credentials.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">Document Information</h3>
                      <p className="text-slate-700 leading-relaxed mb-3">
                        When you upload documents to our Service, we temporarily process and store:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-slate-700">
                        <li>Document content for conversion and analysis purposes</li>
                        <li>File metadata (size, type, upload timestamp)</li>
                        <li>Processing results and analysis outputs</li>
                      </ul>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                        <p className="text-green-800 font-semibold mb-2">🔒 Document Security Promise:</p>
                        <p className="text-green-800 text-sm leading-relaxed">
                          All uploaded documents are automatically deleted from our servers within 24 hours of processing. 
                          We do not permanently store your document content.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">Automatically Collected Information</h3>
                      <p className="text-slate-700 leading-relaxed mb-3">
                        We automatically collect certain information when you visit our website:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-slate-700">
                        <li>IP address and location information</li>
                        <li>Browser type and version</li>
                        <li>Operating system</li>
                        <li>Pages visited and time spent on our site</li>
                        <li>Referring website addresses</li>
                        <li>Usage patterns and preferences</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    3. How We Use Your Information
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    We use the information we collect for the following purposes:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li><strong>Service Provision:</strong> To provide, maintain, and improve our document conversion and analysis services</li>
                    <li><strong>Account Management:</strong> To create and manage your user account</li>
                    <li><strong>Payment Processing:</strong> To process subscription payments and billing</li>
                    <li><strong>Communication:</strong> To send you service-related communications and support</li>
                    <li><strong>Analytics:</strong> To understand how our Service is used and improve user experience</li>
                    <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                    <li><strong>Security:</strong> To detect, prevent, and address technical issues and security threats</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    4. Information Sharing and Disclosure
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Service Providers</h3>
                      <p className="text-slate-700 leading-relaxed">
                        We may share information with trusted third-party service providers who assist us in operating our Service, including:
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
                        <li>Payment processors (Stripe) for subscription billing</li>
                        <li>AI service providers (OpenAI) for document analysis</li>
                        <li>Cloud hosting providers for infrastructure</li>
                        <li>Analytics providers for usage insights</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Legal Requirements</h3>
                      <p className="text-slate-700 leading-relaxed">
                        We may disclose your information if required to do so by law or in response to valid requests by public authorities.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Business Transfers</h3>
                      <p className="text-slate-700 leading-relaxed">
                        In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <Lock className="h-5 w-5 mr-2 text-green-600" />
                    5. Data Security
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    We implement appropriate technical and organizational security measures to protect your information:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li><strong>Encryption:</strong> All data is encrypted in transit using SSL/TLS and at rest using AES-256</li>
                    <li><strong>Access Controls:</strong> Strict access controls and authentication requirements</li>
                    <li><strong>Regular Audits:</strong> Regular security assessments and vulnerability testing</li>
                    <li><strong>Data Minimization:</strong> We collect only the information necessary for our services</li>
                    <li><strong>Automatic Deletion:</strong> Documents are automatically deleted within 24 hours</li>
                  </ul>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 font-semibold mb-2">🛡️ Security Standards:</p>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      We maintain SOC 2 compliance and follow industry best practices for data protection. 
                      However, no method of transmission over the internet is 100% secure.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    6. Your Privacy Rights
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Depending on your location, you may have the following rights regarding your personal information:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li><strong>Access:</strong> Request access to your personal information</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate personal information</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                    <li><strong>Portability:</strong> Request a copy of your personal information in a portable format</li>
                    <li><strong>Restriction:</strong> Request restriction of processing of your personal information</li>
                    <li><strong>Objection:</strong> Object to processing of your personal information</li>
                    <li><strong>Withdrawal:</strong> Withdraw consent for processing where consent is the legal basis</li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    To exercise these rights, please contact us at privacy@legaldocconverter.com.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    7. Cookies and Tracking Technologies
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    We use cookies and similar tracking technologies to enhance your experience:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Essential Cookies</h3>
                      <p className="text-slate-700 leading-relaxed">
                        Required for the Service to function properly, including authentication and security features.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Analytics Cookies</h3>
                      <p className="text-slate-700 leading-relaxed">
                        Help us understand how visitors use our Service to improve user experience.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Preference Cookies</h3>
                      <p className="text-slate-700 leading-relaxed">
                        Remember your preferences and settings for a better user experience.
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed mt-4">
                    You can control cookies through your browser settings, but disabling certain cookies may affect Service functionality.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    8. Data Retention
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    We retain personal information only as long as necessary for the purposes outlined in this Privacy Policy:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li><strong>Account Information:</strong> Retained while your account is active and for up to 2 years after closure</li>
                    <li><strong>Document Content:</strong> Automatically deleted within 24 hours of processing</li>
                    <li><strong>Usage Data:</strong> Retained for up to 2 years for analytics purposes</li>
                    <li><strong>Billing Information:</strong> Retained as required by law and for tax purposes</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    9. International Data Transfers
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable privacy laws through:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li>Adequacy decisions by relevant authorities</li>
                    <li>Standard contractual clauses</li>
                    <li>Binding corporate rules</li>
                    <li>Certification schemes</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    10. Children's Privacy
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Our Service is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us immediately.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    11. Changes to This Privacy Policy
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>Posting the new Privacy Policy on this page</li>
                    <li>Updating the "Last Updated" date</li>
                    <li>Sending you an email notification for significant changes</li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    Your continued use of the Service after any changes indicates your acceptance of the updated Privacy Policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    12. Contact Us
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-slate-700"><strong>Privacy Officer:</strong> privacy@legaldocconverter.com</p>
                    <p className="text-slate-700"><strong>General Contact:</strong> support@legaldocconverter.com</p>
                    <p className="text-slate-700"><strong>Website:</strong> https://legaldocconverter.com</p>
                    <p className="text-slate-700"><strong>Address:</strong> LegalDocConverter, San Francisco, CA</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    13. Regulatory Compliance
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    We comply with applicable privacy regulations, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li><strong>GDPR:</strong> General Data Protection Regulation (EU)</li>
                    <li><strong>CCPA:</strong> California Consumer Privacy Act (California)</li>
                    <li><strong>PIPEDA:</strong> Personal Information Protection and Electronic Documents Act (Canada)</li>
                    <li><strong>Other applicable regional privacy laws</strong></li>
                  </ul>
                </section>

              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;