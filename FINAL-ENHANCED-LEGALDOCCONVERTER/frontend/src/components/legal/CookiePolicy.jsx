import React from 'react';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { ArrowLeft, Cookie, Settings, Eye, BarChart } from 'lucide-react';

const CookiePolicy = ({ onBack }) => {
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
            <div className="p-2 bg-gradient-to-br from-orange-600 to-amber-600 rounded-lg shadow-lg">
              <Cookie className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Cookie Policy</h1>
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
                    <Cookie className="h-5 w-5 mr-2 text-orange-600" />
                    1. What Are Cookies?
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and provide information to website owners.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    LegalDocConverter uses cookies to enhance your experience, provide our services, and understand how our website is used.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    2. Types of Cookies We Use
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-500 pl-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                        <Settings className="h-4 w-4 mr-2 text-blue-600" />
                        Essential Cookies (Always Active)
                      </h3>
                      <p className="text-slate-700 leading-relaxed mb-3">
                        These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions made by you which amount to a request for services.
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-slate-700">
                        <li>Authentication and security cookies</li>
                        <li>Session management</li>
                        <li>Load balancing</li>
                        <li>CSRF protection</li>
                      </ul>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <p className="text-blue-800 text-sm">
                          <strong>Legal Basis:</strong> Legitimate interest - necessary for website functionality
                        </p>
                      </div>
                    </div>

                    <div className="border-l-4 border-green-500 pl-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                        <BarChart className="h-4 w-4 mr-2 text-green-600" />
                        Analytics Cookies (Optional)
                      </h3>
                      <p className="text-slate-700 leading-relaxed mb-3">
                        These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-slate-700">
                        <li>Google Analytics (if enabled)</li>
                        <li>Page views and user flow</li>
                        <li>Device and browser information</li>
                        <li>Performance metrics</li>
                      </ul>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                        <p className="text-green-800 text-sm">
                          <strong>Legal Basis:</strong> Consent - You can opt out at any time
                        </p>
                      </div>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                        <Eye className="h-4 w-4 mr-2 text-purple-600" />
                        Functional Cookies (Optional)
                      </h3>
                      <p className="text-slate-700 leading-relaxed mb-3">
                        These cookies enable enhanced functionality and personalization, such as remembering your preferences.
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-slate-700">
                        <li>Language preferences</li>
                        <li>Theme settings</li>
                        <li>Remember login status</li>
                        <li>User interface preferences</li>
                      </ul>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-3">
                        <p className="text-purple-800 text-sm">
                          <strong>Legal Basis:</strong> Consent - Enhances your user experience
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    3. Detailed Cookie Information
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 p-3 text-left font-semibold">Cookie Name</th>
                          <th className="border border-slate-300 p-3 text-left font-semibold">Purpose</th>
                          <th className="border border-slate-300 p-3 text-left font-semibold">Duration</th>
                          <th className="border border-slate-300 p-3 text-left font-semibold">Type</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        <tr>
                          <td className="border border-slate-300 p-3 font-mono">auth_session</td>
                          <td className="border border-slate-300 p-3">Maintains user login session</td>
                          <td className="border border-slate-300 p-3">24 hours</td>
                          <td className="border border-slate-300 p-3">Essential</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-3 font-mono">csrf_token</td>
                          <td className="border border-slate-300 p-3">Security protection against attacks</td>
                          <td className="border border-slate-300 p-3">Session</td>
                          <td className="border border-slate-300 p-3">Essential</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-3 font-mono">user_preferences</td>
                          <td className="border border-slate-300 p-3">Stores user settings and preferences</td>
                          <td className="border border-slate-300 p-3">1 year</td>
                          <td className="border border-slate-300 p-3">Functional</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-3 font-mono">_ga</td>
                          <td className="border border-slate-300 p-3">Google Analytics - visitor identification</td>
                          <td className="border border-slate-300 p-3">2 years</td>
                          <td className="border border-slate-300 p-3">Analytics</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-3 font-mono">_gid</td>
                          <td className="border border-slate-300 p-3">Google Analytics - session identification</td>
                          <td className="border border-slate-300 p-3">24 hours</td>
                          <td className="border border-slate-300 p-3">Analytics</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    4. Third-Party Cookies
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Some cookies on our website are placed by third-party services. We use the following third-party services:
                  </p>
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-800 mb-2">Google Analytics</h3>
                      <p className="text-slate-700 text-sm mb-2">
                        Helps us understand website usage and improve user experience.
                      </p>
                      <p className="text-slate-600 text-xs">
                        <strong>Privacy Policy:</strong> <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline">https://policies.google.com/privacy</a>
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-800 mb-2">Stripe</h3>
                      <p className="text-slate-700 text-sm mb-2">
                        Payment processing for subscription services.
                      </p>
                      <p className="text-slate-600 text-xs">
                        <strong>Privacy Policy:</strong> <a href="https://stripe.com/privacy" className="text-blue-600 hover:underline">https://stripe.com/privacy</a>
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    5. Managing Your Cookie Preferences
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Browser Settings</h3>
                      <p className="text-slate-700 leading-relaxed mb-3">
                        You can control and manage cookies through your browser settings. Here's how:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-slate-700">
                        <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                        <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
                        <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                        <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Note</h3>
                      <p className="text-yellow-800 text-sm">
                        Disabling essential cookies may affect the functionality of our website. You may not be able to use certain features or services if essential cookies are blocked.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Opt-Out Links</h3>
                      <p className="text-slate-700 leading-relaxed mb-3">
                        You can opt out of specific tracking services:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-slate-700">
                        <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline">Google Analytics Opt-out Browser Add-on</a></li>
                        <li><strong>General Advertising:</strong> <a href="http://www.aboutads.info/choices/" className="text-blue-600 hover:underline">Digital Advertising Alliance</a></li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    6. Cookie Consent
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    When you first visit our website, you may see a cookie consent banner. This banner explains our use of cookies and asks for your consent for non-essential cookies.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-slate-700"><strong>Accept All:</strong> Allows all cookies for the best experience</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-slate-700"><strong>Essential Only:</strong> Only allows necessary cookies</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-slate-700"><strong>Manage Preferences:</strong> Customize your cookie settings</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    7. Data Retention
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Cookie data is retained for different periods depending on the type:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
                    <li><strong>Authentication cookies:</strong> 24 hours or until logout</li>
                    <li><strong>Preference cookies:</strong> Up to 1 year</li>
                    <li><strong>Analytics cookies:</strong> Up to 2 years (Google Analytics)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    8. Updates to This Policy
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    When we make significant changes, we will notify you by updating the "Last Updated" date at the top of this policy and, where appropriate, provide additional notice.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    9. Contact Us
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    If you have any questions about our use of cookies, please contact us:
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-slate-700"><strong>Email:</strong> privacy@legaldocconverter.com</p>
                    <p className="text-slate-700"><strong>Subject Line:</strong> "Cookie Policy Inquiry"</p>
                    <p className="text-slate-700"><strong>Website:</strong> https://legaldocconverter.com</p>
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

export default CookiePolicy;