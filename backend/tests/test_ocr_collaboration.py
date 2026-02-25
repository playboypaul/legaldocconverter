"""
Test suite for OCR and Collaboration features
Tests: OCR Languages, OCR Extract, Searchable PDF, Collaboration Active Users
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://legal-converter-pro.preview.emergentagent.com').rstrip('/')

class TestOCRFeatures:
    """Test OCR endpoints"""
    
    @pytest.fixture(scope="class")
    def uploaded_pdf(self):
        """Create and upload a test PDF for OCR testing"""
        # Create a simple test PDF
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        import tempfile
        
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            c = canvas.Canvas(tmp.name, pagesize=letter)
            c.drawString(100, 700, "LEGAL DOCUMENT OCR TEST")
            c.drawString(100, 680, "This is a test document for OCR functionality.")
            c.drawString(100, 660, "Agreement Contract Terms:")
            c.drawString(100, 640, "1. The parties agree to the terms specified herein.")
            c.drawString(100, 620, "2. This agreement shall remain in effect for 12 months.")
            c.save()
            
            # Upload the file
            with open(tmp.name, 'rb') as f:
                response = requests.post(
                    f"{BASE_URL}/api/upload",
                    files={"file": ("test_ocr.pdf", f, "application/pdf")}
                )
            
            os.unlink(tmp.name)
            
            if response.status_code == 200:
                return response.json()
            return None
    
    def test_ocr_languages_endpoint(self):
        """Test /api/ocr/languages returns available languages"""
        response = requests.get(f"{BASE_URL}/api/ocr/languages")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "available_languages" in data, "Response should contain available_languages"
        assert "default" in data, "Response should contain default language"
        assert data["default"] == "eng", "Default language should be English"
        assert "eng" in data["available_languages"], "English should be available"
        print(f"✓ OCR Languages - Available: {list(data['available_languages'].keys())}")
    
    def test_ocr_extract_success(self, uploaded_pdf):
        """Test /api/ocr/extract extracts text from PDF"""
        if not uploaded_pdf:
            pytest.skip("PDF upload failed")
        
        response = requests.post(
            f"{BASE_URL}/api/ocr/extract",
            json={
                "file_id": uploaded_pdf["file_id"],
                "language": "eng",
                "enhance_image": True
            },
            timeout=120  # OCR can take time
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "ocr_id" in data, "Response should contain ocr_id"
        assert "text" in data, "Response should contain extracted text"
        assert "status" in data, "Response should contain status"
        assert data["status"] == "completed", "Status should be completed"
        assert "word_count" in data, "Response should contain word_count"
        assert "confidence" in data, "Response should contain confidence score"
        assert data["word_count"] > 0, "Word count should be positive"
        assert data["confidence"] > 0, "Confidence should be positive"
        assert "download_url" in data, "Response should contain download_url"
        print(f"✓ OCR Extract - Words: {data['word_count']}, Confidence: {data['confidence']}%")
    
    def test_ocr_extract_file_not_found(self):
        """Test /api/ocr/extract returns 404 for non-existent file"""
        response = requests.post(
            f"{BASE_URL}/api/ocr/extract",
            json={
                "file_id": "non-existent-file-id",
                "language": "eng"
            }
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ OCR Extract - Correctly returns 404 for missing file")
    
    def test_searchable_pdf_success(self, uploaded_pdf):
        """Test /api/ocr/searchable-pdf creates searchable PDF"""
        if not uploaded_pdf:
            pytest.skip("PDF upload failed")
        
        response = requests.post(
            f"{BASE_URL}/api/ocr/searchable-pdf",
            json={
                "file_id": uploaded_pdf["file_id"],
                "language": "eng"
            },
            timeout=120  # Can take time for large PDFs
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "searchable_id" in data, "Response should contain searchable_id"
        assert "output_file" in data, "Response should contain output_file"
        assert data["status"] == "completed", "Status should be completed"
        assert "download_url" in data, "Response should contain download_url"
        assert "pages" in data, "Response should contain pages count"
        print(f"✓ Searchable PDF - Created: {data['output_file']}, Pages: {data['pages']}")
    
    def test_searchable_pdf_file_not_found(self):
        """Test /api/ocr/searchable-pdf returns 404 for non-existent file"""
        response = requests.post(
            f"{BASE_URL}/api/ocr/searchable-pdf",
            json={
                "file_id": "non-existent-file-id",
                "language": "eng"
            }
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Searchable PDF - Correctly returns 404 for missing file")


class TestCollaborationFeatures:
    """Test Collaboration endpoints"""
    
    def test_active_users_endpoint(self):
        """Test /api/collaborate/active-users/{file_id} returns active users"""
        test_file_id = "test-collaboration-file-001"
        
        response = requests.get(f"{BASE_URL}/api/collaborate/active-users/{test_file_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "file_id" in data, "Response should contain file_id"
        assert data["file_id"] == test_file_id, "File ID should match request"
        assert "active_users" in data, "Response should contain active_users list"
        assert "user_count" in data, "Response should contain user_count"
        assert isinstance(data["active_users"], list), "active_users should be a list"
        assert data["user_count"] >= 0, "User count should be non-negative"
        print(f"✓ Active Users - File: {data['file_id']}, Count: {data['user_count']}")
    
    def test_cursors_endpoint(self):
        """Test /api/collaborate/cursors/{file_id} returns cursor positions"""
        test_file_id = "test-collaboration-file-002"
        
        response = requests.get(f"{BASE_URL}/api/collaborate/cursors/{test_file_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "file_id" in data, "Response should contain file_id"
        assert data["file_id"] == test_file_id, "File ID should match request"
        assert "cursors" in data, "Response should contain cursors object"
        assert isinstance(data["cursors"], dict), "cursors should be a dictionary"
        print(f"✓ User Cursors - File: {data['file_id']}, Cursors: {len(data['cursors'])}")


class TestOCRStatus:
    """Test OCR status endpoint"""
    
    def test_ocr_status_not_found(self):
        """Test /api/ocr/status/{ocr_id} returns 404 for non-existent job"""
        response = requests.get(f"{BASE_URL}/api/ocr/status/non-existent-ocr-id")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ OCR Status - Correctly returns 404 for missing job")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
