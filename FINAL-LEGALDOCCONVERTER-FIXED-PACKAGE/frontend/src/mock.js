// Mock data for Legal Document Converter and Analyzer

export const mockAnalysis = {
  summary: "This employment contract contains standard terms and conditions with some notable provisions that require attention.",
  keyFindings: [
    "Non-compete clause extends for 2 years post-employment",
    "Confidentiality agreement includes broad scope of proprietary information",
    "Termination clause allows for 30-day notice period",
    "Compensation structure includes base salary plus performance bonuses",
    "Intellectual property rights are assigned to the company"
  ],
  riskAssessment: [
    {
      level: "Medium",
      issue: "Non-compete clause duration may be excessive in some jurisdictions",
      recommendation: "Consider reducing to 12-18 months for better enforceability"
    },
    {
      level: "Low",
      issue: "Standard confidentiality terms are reasonable",
      recommendation: "No immediate action required"
    }
  ],
  compliance: {
    score: 85,
    details: "Document is generally compliant with employment law standards"
  }
};

export const supportedFormats = {
  input: ['PDF', 'DOCX', 'DOC', 'TXT', 'RTF', 'ODT'],
  output: ['PDF', 'DOCX', 'DOC', 'TXT', 'RTF', 'ODT', 'HTML']
};

export const subscriptionPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "3 document uploads",
      "1 legal document analysis",
      "Basic file conversion",
      "Standard support"
    ],
    limitations: ["Limited uploads", "Basic analysis only"]
  },
  {
    name: "Professional",
    price: "$49.99",
    period: "month",
    features: [
      "Unlimited document uploads",
      "Unlimited legal document analysis",
      "Advanced AI analysis",
      "All format conversions",
      "Priority support",
      "Bulk processing"
    ],
    popular: true
  }
];

export const mockConversion = {
  originalFile: "contract.pdf",
  convertedFile: "contract.docx",
  status: "completed",
  downloadUrl: "#"
};