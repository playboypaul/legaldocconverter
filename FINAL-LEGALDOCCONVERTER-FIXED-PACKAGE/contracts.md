# Legal Document Converter & Analyzer - API Contracts

## Overview
This document outlines the API contracts between frontend and backend for the Legal Document Converter and Analyzer platform.

## Current Mock Data (to be replaced)
- `mock.js` contains mock analysis results, supported formats, and subscription plans
- Mock file upload/conversion simulation
- Mock AI analysis responses

## Backend API Endpoints

### 1. File Upload & Processing
**POST /api/upload**
- **Purpose**: Upload document for processing
- **Input**: Multipart form data with file
- **Response**: 
```json
{
  "file_id": "uuid",
  "original_name": "contract.pdf",
  "file_type": "pdf",
  "file_size": 1024000,
  "supported_conversions": ["docx", "txt", "rtf", "html"]
}
```

### 2. File Conversion
**POST /api/convert**
- **Purpose**: Convert uploaded file to target format
- **Input**:
```json
{
  "file_id": "uuid",
  "target_format": "docx"
}
```
- **Response**:
```json
{
  "conversion_id": "uuid",
  "status": "completed",
  "download_url": "/api/download/uuid",
  "original_file": "contract.pdf",
  "converted_file": "contract.docx"
}
```

### 3. AI Document Analysis
**POST /api/analyze**
- **Purpose**: Analyze document using OpenAI for legal insights
- **Input**:
```json
{
  "file_id": "uuid"
}
```
- **Response**:
```json
{
  "analysis_id": "uuid",
  "summary": "Executive summary of document",
  "key_findings": ["Finding 1", "Finding 2"],
  "risk_assessment": [
    {
      "level": "Medium",
      "issue": "Risk description",
      "recommendation": "Suggested action"
    }
  ],
  "compliance": {
    "score": 85,
    "details": "Compliance assessment"
  }
}
```

### 4. File Download
**GET /api/download/{file_id}**
- **Purpose**: Download converted file
- **Response**: File stream with appropriate headers

### 5. Supported Formats
**GET /api/formats**
- **Purpose**: Get list of supported input/output formats
- **Response**:
```json
{
  "input": ["pdf", "docx", "doc", "txt", "rtf", "odt"],
  "output": ["pdf", "docx", "doc", "txt", "rtf", "odt", "html"]
}
```

## Required Integrations

### 1. File Conversion
- **Library**: `pandoc` or `python-docx` + `PyPDF2`
- **Formats**: PDF, DOCX, DOC, TXT, RTF, ODT, HTML
- **Temporary Storage**: `/tmp` directory with cleanup

### 2. OpenAI Integration
- **API**: OpenAI GPT-4 for document analysis
- **Environment**: `OPENAI_API_KEY` (to be provided by user)
- **Prompt**: Legal document analysis prompt for contracts, agreements, etc.

### 3. File Handling
- **Upload Limit**: 10MB per file
- **Cleanup**: Auto-delete temp files after 1 hour
- **Security**: Validate file types, scan for malicious content

## Frontend Integration Changes

### Remove Mock Data
1. Remove `mock.js` imports from components
2. Replace mock functions with real API calls
3. Update state management for real loading states

### API Integration Points
1. **DocumentProcessor.jsx**:
   - Replace mock upload with real `/api/upload`
   - Replace mock conversion with real `/api/convert`
   - Replace mock analysis with real `/api/analyze`
   - Add real file download functionality

2. **Features.jsx**:
   - Load supported formats from `/api/formats`

3. **Error Handling**:
   - Add proper error states for failed uploads
   - Add retry mechanisms for failed conversions
   - Add user-friendly error messages

## Security Considerations
- File type validation
- File size limits
- Rate limiting on API endpoints
- Temporary file cleanup
- API key protection (backend only)

## Subscription Integration (Future)
- Stripe webhook endpoints
- Usage tracking per user
- Rate limiting based on subscription tier
- Payment processing endpoints

## File Cleanup Strategy
- Delete uploaded files after processing
- Delete converted files after download or 1 hour timeout
- Implement background cleanup job
- No persistent storage of user documents