import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check, Star, Sparkles } from 'lucide-react';
import { subscriptionPlans } from '../mock';

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-full text-sm font-medium text-blue-800 mb-6 shadow-sm">
            <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
            Choose Your Plan
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose the plan that fits your legal document processing needs. 
            Start free and upgrade as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {subscriptionPlans.map((plan, index) => (
            <Card 
              key={index} 
              className={`group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden ${
                plan.popular 
                  ? 'ring-4 ring-blue-200 scale-105 bg-gradient-to-br from-white to-blue-50' 
                  : 'bg-gradient-to-br from-white to-slate-50'
              }`}
            >
              {plan.popular && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 text-sm font-bold shadow-lg">
                      <Star className="h-4 w-4 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                </>
              )}
              
              <CardHeader className={`text-center pb-8 relative z-10 ${
                plan.popular 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                  : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white'
              } rounded-t-lg`}>
                <CardTitle className="text-2xl font-bold">
                  {plan.name}
                </CardTitle>
                <div className="mt-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-lg opacity-80">/{plan.period}</span>
                </div>
                <CardDescription className={`mt-3 ${
                  plan.popular ? 'text-blue-100' : 'text-slate-300'
                }`}>
                  {plan.name === 'Free' 
                    ? 'Perfect for trying out our services'
                    : 'For legal professionals and firms'
                  }
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8 p-8 relative z-10">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <div className={`p-1 rounded-full mr-4 mt-1 ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      } flex-shrink-0`}>
                        <Check className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-slate-700 font-medium leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations && (
                  <div className="pt-6 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-500 mb-3">Limitations:</p>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="text-sm text-slate-500 flex items-center">
                          <div className="w-2 h-2 bg-slate-400 rounded-full mr-3 flex-shrink-0"></div>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  className={`w-full py-4 font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' 
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white'
                  }`}
                  onClick={() => {
                    if (plan.name === 'Professional') {
                      window.open('https://buy.stripe.com/5kQfZh7EU65I6Q61i65AQ0V', '_blank');
                    } else {
                      // Free plan - scroll to processor
                      document.getElementById('processor')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  {plan.name === 'Free' ? 'Start Free' : 'Subscribe Now'}
                  {plan.popular && <Sparkles className="ml-2 h-5 w-5" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            Enterprise Solutions Available
          </h3>
          <p className="text-slate-700 mb-6 leading-relaxed max-w-2xl mx-auto">
            Need custom solutions for your law firm or organization? We offer tailored plans 
            with advanced features, dedicated support, and flexible pricing.
          </p>
          <Button 
            variant="outline" 
            className="border-2 border-slate-400 text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-blue-100 hover:border-blue-400 hover:text-blue-700 px-8 py-3 font-semibold transition-all duration-300"
            onClick={() => window.location.href = '/contact'}
          >
            Contact Sales
          </Button>
        </div>

        {/* Money Back Guarantee */}
        <div className="text-center mt-12 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
          <div className="flex items-center justify-center mb-2">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-semibold text-green-800">30-day money-back guarantee</span>
          </div>
          <p className="text-sm text-green-700">
            Cancel anytime • No hidden fees • Full refund if not satisfied
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;