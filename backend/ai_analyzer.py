import os
import logging
import json
from typing import Dict, Any
from pathlib import Path
import PyPDF2
from docx import Document
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class AIAnalyzer:
    """Handle AI-powered document analysis using Emergent LLM Integration"""
    
    def __init__(self):
        self.emergent_key = os.getenv('EMERGENT_LLM_KEY')
        if not self.emergent_key:
            logger.warning("EMERGENT_LLM_KEY not found. AI analysis will use fallback mode.")
    
    async def analyze_document(self, file_path: str, file_type: str, analysis_id: str) -> Dict[str, Any]:
        """Analyze document and return legal insights"""
        try:
            # Extract text from document
            document_text = await self._extract_text(file_path, file_type)
            
            if not document_text or len(document_text.strip()) < 50:
                raise Exception("Document text is too short or empty for analysis")
            
            # Use Emergent LLM integration for real analysis
            if self.emergent_key:
                return await self._analyze_with_emergent_llm(document_text, analysis_id)
            else:
                # Fallback to basic analysis
                return await self._generate_basic_analysis(document_text, analysis_id)
                
        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            raise Exception(f"Failed to analyze document: {str(e)}")
    
    async def _extract_text(self, file_path: str, file_type: str) -> str:
        """Extract text content from various file formats"""
        text = ""
        
        try:
            if file_type == "pdf":
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            
            elif file_type in ["docx"]:
                doc = Document(file_path)
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
            
            elif file_type in ["txt", "rtf", "md"]:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                    text = file.read()
            
            else:
                # Try to read as text file
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                    text = file.read()
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Text extraction error: {str(e)}")
            raise Exception(f"Failed to extract text from document: {str(e)}")
    
    async def _analyze_with_emergent_llm(self, document_text: str, analysis_id: str) -> Dict[str, Any]:
        """Analyze document using Emergent LLM Integration with GPT-4o"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            # Truncate text if too long (context limits)
            max_chars = 15000
            truncated = False
            if len(document_text) > max_chars:
                document_text = document_text[:max_chars]
                truncated = True
            
            # Initialize the chat with Emergent LLM key
            chat = LlmChat(
                api_key=self.emergent_key,
                session_id=f"legal-analysis-{analysis_id}",
                system_message="""You are an expert legal document analyst specializing in contract review, compliance assessment, and risk identification. 

Your task is to analyze legal documents and provide:
1. A clear executive summary
2. Key legal findings and provisions
3. Risk assessment with specific issues
4. Compliance score with detailed explanation

Always provide specific, actionable insights based on the actual document content. Never provide generic or placeholder information.

Respond ONLY with valid JSON in the exact format specified."""
            ).with_model("openai", "gpt-4o")
            
            prompt = f"""Analyze the following legal document and provide a comprehensive assessment.

Document Text:
---
{document_text}
{'[Document truncated due to length]' if truncated else ''}
---

Provide your analysis in the following JSON format (respond with ONLY the JSON, no other text):

{{
    "analysis_id": "{analysis_id}",
    "summary": "A 2-3 sentence executive summary of the document's purpose, parties involved, and key terms",
    "document_type": "The type of document (e.g., Contract, Agreement, Terms of Service, NDA, etc.)",
    "key_findings": [
        "Specific finding 1 from the actual document",
        "Specific finding 2 from the actual document",
        "Specific finding 3 from the actual document",
        "Specific finding 4 from the actual document",
        "Specific finding 5 from the actual document"
    ],
    "parties_identified": ["Party 1 name if found", "Party 2 name if found"],
    "key_dates": ["Any important dates mentioned in the document"],
    "financial_terms": ["Any monetary amounts, payment terms, or financial obligations"],
    "risk_assessment": [
        {{
            "level": "High/Medium/Low",
            "issue": "Specific risk issue identified in the document",
            "clause_reference": "Reference to the relevant section/clause if identifiable",
            "recommendation": "Specific actionable recommendation"
        }},
        {{
            "level": "High/Medium/Low",
            "issue": "Another specific risk issue",
            "clause_reference": "Reference to relevant section",
            "recommendation": "Specific recommendation"
        }}
    ],
    "compliance": {{
        "score": 85,
        "details": "Detailed explanation of compliance assessment based on standard legal requirements",
        "areas_of_concern": ["Any compliance concerns identified"],
        "positive_aspects": ["Well-drafted sections or compliant provisions"]
    }},
    "recommendations": [
        "Specific recommendation 1 for improving or addressing issues in this document",
        "Specific recommendation 2",
        "Specific recommendation 3"
    ]
}}"""

            # Send the message and get the response
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            logger.info(f"Received AI analysis response for {analysis_id}")
            
            # Parse the JSON response
            try:
                # Clean up response - remove markdown code blocks if present
                cleaned_response = response.strip()
                if cleaned_response.startswith("```json"):
                    cleaned_response = cleaned_response[7:]
                if cleaned_response.startswith("```"):
                    cleaned_response = cleaned_response[3:]
                if cleaned_response.endswith("```"):
                    cleaned_response = cleaned_response[:-3]
                cleaned_response = cleaned_response.strip()
                
                analysis_result = json.loads(cleaned_response)
                analysis_result["analysis_id"] = analysis_id
                analysis_result["ai_powered"] = True
                return analysis_result
                
            except json.JSONDecodeError as je:
                logger.warning(f"JSON parsing failed: {je}, using structured extraction")
                return await self._extract_structured_response(response, analysis_id, document_text)
                
        except Exception as e:
            logger.error(f"Emergent LLM analysis error: {str(e)}")
            # Fallback to basic analysis
            return await self._generate_basic_analysis(document_text, analysis_id)
    
    async def _extract_structured_response(self, response_text: str, analysis_id: str, document_text: str) -> Dict[str, Any]:
        """Extract structured data from non-JSON AI response"""
        # Try to find JSON within the response
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        # Build structured response from text
        word_count = len(document_text.split())
        
        return {
            "analysis_id": analysis_id,
            "summary": response_text[:500] if len(response_text) > 500 else response_text,
            "document_type": "Legal Document",
            "key_findings": [
                "Document analyzed using AI assistance",
                f"Document contains approximately {word_count} words",
                "Full structured analysis available upon request"
            ],
            "risk_assessment": [
                {
                    "level": "Medium",
                    "issue": "AI analysis completed with partial structured output",
                    "clause_reference": "N/A",
                    "recommendation": "Consider manual review for detailed clause analysis"
                }
            ],
            "compliance": {
                "score": 75,
                "details": "Document analyzed - recommend detailed manual review",
                "areas_of_concern": [],
                "positive_aspects": ["Document structure detected"]
            },
            "ai_powered": True
        }
    
    async def _generate_basic_analysis(self, document_text: str, analysis_id: str) -> Dict[str, Any]:
        """Generate basic analysis based on document content patterns"""
        word_count = len(document_text.split())
        text_lower = document_text.lower()
        
        # Detect document type
        doc_type_indicators = {
            "contract": ["agreement", "contract", "parties", "whereas", "therefore"],
            "nda": ["confidential", "non-disclosure", "proprietary", "trade secret"],
            "terms_of_service": ["terms of service", "terms and conditions", "user agreement", "acceptable use"],
            "privacy_policy": ["privacy policy", "personal data", "data protection", "gdpr", "cookies"],
            "employment": ["employment", "employee", "employer", "salary", "compensation", "termination"],
            "lease": ["lease", "landlord", "tenant", "rent", "premises", "property"]
        }
        
        detected_type = "General Legal Document"
        for doc_type, indicators in doc_type_indicators.items():
            if any(indicator in text_lower for indicator in indicators):
                detected_type = doc_type.replace("_", " ").title()
                break
        
        # Extract potential parties
        parties = []
        party_patterns = ["party a", "party b", "the company", "the client", "the contractor", "the employee", "the landlord", "the tenant"]
        for pattern in party_patterns:
            if pattern in text_lower:
                parties.append(pattern.title())
        
        # Identify key terms
        key_findings = []
        term_patterns = {
            "Payment terms present": ["payment", "invoice", "fee", "compensation"],
            "Confidentiality clause detected": ["confidential", "non-disclosure", "proprietary"],
            "Termination provisions included": ["termination", "cancellation", "expiration"],
            "Liability limitations present": ["liability", "limitation", "indemnify", "hold harmless"],
            "Governing law specified": ["governing law", "jurisdiction", "applicable law"],
            "Dispute resolution clause": ["arbitration", "mediation", "dispute resolution"]
        }
        
        for finding, patterns in term_patterns.items():
            if any(pattern in text_lower for pattern in patterns):
                key_findings.append(finding)
        
        if not key_findings:
            key_findings = [
                "Document structure analyzed",
                f"Contains approximately {word_count} words",
                "Manual review recommended for detailed analysis"
            ]
        
        # Risk assessment
        risks = []
        if "indemnify" not in text_lower and "liability" not in text_lower:
            risks.append({
                "level": "Medium",
                "issue": "No clear liability or indemnification provisions detected",
                "clause_reference": "N/A",
                "recommendation": "Consider adding liability limitation clauses"
            })
        
        if "termination" not in text_lower:
            risks.append({
                "level": "Low",
                "issue": "Termination provisions not clearly identified",
                "clause_reference": "N/A",
                "recommendation": "Ensure termination rights are clearly defined"
            })
        
        if not risks:
            risks.append({
                "level": "Low",
                "issue": "Standard document structure detected",
                "clause_reference": "General",
                "recommendation": "Review all terms before signing"
            })
        
        # Calculate compliance score
        compliance_score = 70
        positive_aspects = []
        
        if "governing law" in text_lower or "jurisdiction" in text_lower:
            compliance_score += 10
            positive_aspects.append("Governing law specified")
        
        if "confidential" in text_lower:
            compliance_score += 5
            positive_aspects.append("Confidentiality provisions present")
        
        if word_count > 500:
            compliance_score += 5
            positive_aspects.append("Comprehensive document length")
        
        return {
            "analysis_id": analysis_id,
            "summary": f"This appears to be a {detected_type} containing approximately {word_count} words. The document has been analyzed for key legal provisions and potential risks. {'Multiple parties identified.' if parties else 'Party identification requires manual review.'}",
            "document_type": detected_type,
            "key_findings": key_findings[:5],
            "parties_identified": parties if parties else ["Parties require manual identification"],
            "key_dates": ["Dates require manual review"],
            "financial_terms": ["Financial terms require manual review"],
            "risk_assessment": risks,
            "compliance": {
                "score": min(compliance_score, 95),
                "details": f"Basic compliance analysis completed. Document type: {detected_type}. Word count: {word_count}.",
                "areas_of_concern": ["Full AI-powered analysis recommended for comprehensive compliance review"],
                "positive_aspects": positive_aspects if positive_aspects else ["Document readable and parseable"]
            },
            "recommendations": [
                "Have qualified legal counsel review before signing",
                "Verify all party names and dates are accurate",
                "Ensure all obligations and rights are clearly understood"
            ],
            "ai_powered": False,
            "note": "Basic analysis mode - for full AI-powered analysis, ensure EMERGENT_LLM_KEY is configured"
        }
