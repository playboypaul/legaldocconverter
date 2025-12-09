# Testing Protocol

## Last Testing Session
**Date**: 2025-12-09
**Feature**: PDF Toolkit Implementation
**Status**: PENDING TESTING

## Testing Requirements

### PDF Toolkit Features to Test:
1. **PDF Merge**: Merge 2+ PDF files into one
2. **PDF Split**: Split PDF into individual pages
3. **PDF Split by Ranges**: Split PDF into specific page ranges
4. **PDF Encrypt**: Add password protection to PDF
5. **PDF eSign**: Add electronic signature to PDF

### Test Files Needed:
- Create at least 2 sample PDF files for testing merge functionality
- Use multi-page PDF for split testing
- Test encryption with various password combinations
- Test eSign with signature placement

### API Endpoints to Test:
- POST /api/pdf/merge - with array of file_ids
- POST /api/pdf/split - with file_id and split_type="pages"
- POST /api/pdf/split - with file_id, split_type="ranges", and page_ranges array
- POST /api/pdf/encrypt - with file_id, password, and permissions
- POST /api/pdf/esign - with file_id, signer_info, and position

### Expected Behavior:
- Merge: Should combine multiple PDFs into single file with all pages
- Split (pages): Should create separate PDF for each page
- Split (ranges): Should create PDFs for specified page ranges
- Encrypt: Should create password-protected PDF
- eSign: Should add signature text at specified position

### Test Iteration Notes:
This is the first testing iteration for the PDF Toolkit backend implementation.

## Incorporate User Feedback
- User will test Document Comparison, Batch Processing, and Annotation features themselves
- Only PDF Toolkit requires testing agent validation

