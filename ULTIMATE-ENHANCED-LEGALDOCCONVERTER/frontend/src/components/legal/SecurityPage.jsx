import React from 'react';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { ArrowLeft, Shield, Lock, Key, Server, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

const SecurityPage = ({ onBack }) => {
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
            <div className="p-2 bg-gradient-to-br from-red-600 to-rose-600 rounded-lg shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Security & Data Protection</h1>
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
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                    <div className="flex items-center mb-4">
                      <Shield className="h-8 w-8 text-green-600 mr-3" />
                      <h2 className="text-2xl font-bold text-green-900">Our Security Commitment</h2>
                    </div>
                    <p className="text-green-800 leading-relaxed">
                      At LegalDocConverter, we understand that you're entrusting us with sensitive legal documents. 
                      We've implemented enterprise-grade security measures to protect your data at every step of the process.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <Lock className="h-6 w-6 mr-2 text-red-600" />
                    Data Protection Measures
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center mb-3">
                        <Lock className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="font-semibold text-blue-900">Encryption in Transit</h3>
                      </div>
                      <p className="text-blue-800 text-sm leading-relaxed">
                        All data transmitted between your browser and our servers is protected using TLS 1.3 encryption (256-bit SSL).
                      </p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <div className="flex items-center mb-3">
                        <Server className="h-5 w-5 text-purple-600 mr-2" />
                        <h3 className="font-semibold text-purple-900">Encryption at Rest</h3>
                      </div>
                      <p className="text-purple-800 text-sm leading-relaxed">
                        All stored data is encrypted using AES-256 encryption, ensuring your documents are protected even at rest.
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center mb-3">
                        <AlertTriangle className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="font-semibold text-green-900">Automatic Deletion</h3>
                      </div>
                      <p className="text-green-800 text-sm leading-relaxed">
                        All uploaded documents are automatically deleted from our servers within 24 hours of processing.
                      </p>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                      <div className="flex items-center mb-3">
                        <Key className="h-5 w-5 text-orange-600 mr-2" />
                        <h3 className="font-semibold text-orange-900">Access Controls</h3>
                      </div>
                      <p className="text-orange-800 text-sm leading-relaxed">
                        Strict access controls and multi-factor authentication for all system administrators and developers.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Infrastructure Security
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-500 pl-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">Cloud Infrastructure</h3>
                      <ul className="space-y-2 text-slate-700">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Hosted on enterprise-grade cloud infrastructure with 99.9% uptime SLA</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Distributed architecture with automatic failover and load balancing</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Regular security patches and updates applied automatically</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Network-level DDoS protection and firewall security</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-green-500 pl-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">Database Security</h3>
                      <ul className="space-y-2 text-slate-700">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>MongoDB with encryption at rest and in transit</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Regular automated backups with point-in-time recovery</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Role-based access control and audit logging</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Network isolation and VPC security groups</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Document Processing Security
                  </h2>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center mb-4">
                      <Eye className="h-6 w-6 text-yellow-600 mr-3" />
                      <h3 className="text-lg font-semibold text-yellow-900">Zero Retention Policy</h3>
                    </div>
                    <p className="text-yellow-800 leading-relaxed">
                      We process your documents but do not retain them. All documents are automatically deleted within 24 hours, 
                      and we never store document content permanently on our servers.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1">Secure Upload</h4>
                        <p className="text-slate-600 text-sm">Documents are uploaded over encrypted HTTPS connection directly to secure processing servers.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1">Isolated Processing</h4>
                        <p className="text-slate-600 text-sm">Each document is processed in an isolated environment with no cross-contamination between user files.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1">Secure AI Analysis</h4>
                        <p className="text-slate-600 text-sm">AI analysis is performed using enterprise OpenAI API with data processing agreements in place.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm">4</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1">Automatic Cleanup</h4>
                        <p className="text-slate-600 text-sm">All temporary files, processing artifacts, and document copies are automatically deleted after processing.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Compliance & Certifications
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="font-semibold text-blue-900 mb-3">SOC 2 Type II</h3>
                      <p className="text-blue-800 text-sm leading-relaxed mb-3">
                        We maintain SOC 2 Type II compliance, ensuring our security controls meet the highest industry standards.
                      </p>
                      <ul className="text-blue-700 text-xs space-y-1">
                        <li>• Security controls and procedures</li>
                        <li>• Availability and processing integrity</li>
                        <li>• Confidentiality protections</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="font-semibold text-green-900 mb-3">GDPR Compliance</h3>
                      <p className="text-green-800 text-sm leading-relaxed mb-3">
                        Full compliance with European Union General Data Protection Regulation.
                      </p>
                      <ul className="text-green-700 text-xs space-y-1">
                        <li>• Data minimization principles</li>
                        <li>• Right to erasure (automatic deletion)</li>
                        <li>• Privacy by design architecture</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <h3 className="font-semibold text-purple-900 mb-3">CCPA Compliance</h3>
                      <p className="text-purple-800 text-sm leading-relaxed mb-3">
                        California Consumer Privacy Act compliance for all California residents.
                      </p>
                      <ul className="text-purple-700 text-xs space-y-1">
                        <li>• Transparent data practices</li>
                        <li>• Consumer rights protection</li>
                        <li>• Data sale prohibition</li>
                      </ul>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                      <h3 className="font-semibold text-orange-900 mb-3">ISO 27001</h3>
                      <p className="text-orange-800 text-sm leading-relaxed mb-3">
                        Information security management system aligned with ISO 27001 standards.
                      </p>
                      <ul className="text-orange-700 text-xs space-y-1">
                        <li>• Risk management framework</li>
                        <li>• Continuous security monitoring</li>
                        <li>• Incident response procedures</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Security Monitoring & Incident Response
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="border border-slate-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">24/7 Security Monitoring</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Real-time threat detection</span>
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Automated security alerts</span>
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Intrusion detection systems</span>
                          </li>
                        </ul>
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Log analysis and correlation</span>
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Vulnerability scanning</span>
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Security incident tracking</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Incident Response Plan</h3>
                      <p className="text-slate-700 mb-4">
                        We maintain a comprehensive incident response plan with defined procedures for various security scenarios:
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <span className="text-red-600 font-bold text-xs">1</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Detection & Analysis</p>
                            <p className="text-slate-600 text-sm">Immediate threat identification and impact assessment</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <span className="text-yellow-600 font-bold text-xs">2</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Containment & Eradication</p>
                            <p className="text-slate-600 text-sm">Immediate containment and threat elimination</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <span className="text-green-600 font-bold text-xs">3</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Recovery & Communication</p>
                            <p className="text-slate-600 text-sm">System restoration and user notification if required</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Third-Party Security
                  </h2>
                  
                  <p className="text-slate-700 leading-relaxed mb-6">
                    We carefully vet all third-party services and ensure they meet our security standards:
                  </p>

                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNjM2NkYxIi8+Cjwvc3ZnPgo=" alt="OpenAI" className="w-5 h-5 mr-2" />
                        <h3 className="font-semibold text-slate-800">OpenAI</h3>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        Enterprise-grade AI processing with data processing agreements, zero data retention, and SOC 2 compliance.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIgMTJDMiA2LjQ4IDYuNDggMiAxMiAyUzIyIDYuNDggMjIgMTJTMTcuNTIgMjIgMTIgMjJTMiAxNy41MiAyIDEyWk0xMiA0QzcuNTggNCA0IDcuNTggNCA1MEM0IDEyLjQyIDcuNTggMTYgMTIgMTZTMjAgMTIuNDIgMjAgMTBDMjAgMTAuNDIgMTcuNTIgNDUgMTIgNFoiIGZpbGw9IiM2MzVCRkYiLz4KPC9zdmc+Cg==" alt="Stripe" className="w-5 h-5 mr-2" />
                        <h3 className="font-semibold text-slate-800">Stripe</h3>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        PCI DSS Level 1 certified payment processing with bank-level security and fraud protection.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Server className="w-5 h-5 mr-2 text-slate-600" />
                        <h3 className="font-semibold text-slate-800">Cloud Infrastructure</h3>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        Hosted on enterprise cloud platforms with ISO 27001, SOC 2, and other security certifications.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Security Best Practices for Users
                  </h2>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-4">Protect Your Account</h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-800 text-sm">Use a strong, unique password for your account</p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-800 text-sm">Log out of your account when using shared computers</p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-800 text-sm">Keep your browser and operating system updated</p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-800 text-sm">Only access our service from trusted networks</p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-800 text-sm">Report any suspicious activity immediately</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Contact Our Security Team
                  </h2>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                    <p className="text-slate-700 mb-4">
                      If you have security questions or want to report a security issue, please contact us:
                    </p>
                    <div className="space-y-2">
                      <p className="text-slate-700"><strong>Security Team:</strong> security@legaldocconverter.com</p>
                      <p className="text-slate-700"><strong>Incident Reporting:</strong> incidents@legaldocconverter.com</p>
                      <p className="text-slate-700"><strong>General Contact:</strong> support@legaldocconverter.com</p>
                      <p className="text-slate-700"><strong>Response Time:</strong> Within 24 hours for security issues</p>
                    </div>
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">
                        <strong>Security Emergency:</strong> For urgent security matters, please email security@legaldocconverter.com 
                        with "URGENT SECURITY" in the subject line.
                      </p>
                    </div>
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

export default SecurityPage;