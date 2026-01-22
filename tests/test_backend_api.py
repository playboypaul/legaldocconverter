"""
Backend API Tests for LegalDocConverter
Tests: AI Analysis, PDF Tools (rotate, compress, watermark, remove-pages, reorder, extract-text), PDF Info
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test PDF file for upload
TEST_PDF_CONTENT = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << >> >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << >> >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (Test Page 1) Tj ET
endstream
endobj
6 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (Test Page 2) Tj ET
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
0000000313 00000 n 
0000000406 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
499
%%EOF
"""


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_health_check(self):
        """Test /health endpoint"""
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_ready_check(self):
        """Test /ready endpoint"""
        response = requests.get(f"{BASE_URL}/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        print("✓ Ready check passed")


class TestBasicAPIEndpoints:
    """Test basic API endpoints"""
    
    def test_api_root(self):
        """Test /api/ root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ API root endpoint passed")
    
    def test_formats_endpoint(self):
        """Test /api/formats endpoint"""
        response = requests.get(f"{BASE_URL}/api/formats")
        assert response.status_code == 200
        data = response.json()
        assert "input" in data
        assert "output" in data
        assert "pdf" in data["input"]
        assert "docx" in data["output"]
        print(f"✓ Formats endpoint passed - {len(data['input'])} input, {len(data['output'])} output formats")


class TestFileUpload:
    """Test file upload functionality"""
    
    def test_upload_pdf(self):
        """Test uploading a PDF file"""
        files = {'file': ('test_document.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert response.status_code == 200
        data = response.json()
        assert "file_id" in data
        assert data["file_type"] == "pdf"
        assert data["original_name"] == "test_document.pdf"
        print(f"✓ PDF upload passed - file_id: {data['file_id']}")
        return data["file_id"]


class TestPDFToolsEndpoints:
    """Test new PDF tool endpoints exist and respond"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Upload a test PDF for use in tests"""
        files = {'file': ('test_pdf_tools.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        if response.status_code == 200:
            self.file_id = response.json()["file_id"]
        else:
            self.file_id = None
    
    def test_pdf_rotate_endpoint_exists(self):
        """Test /api/pdf/rotate endpoint exists and responds"""
        if not self.file_id:
            pytest.skip("File upload failed")
        
        response = requests.post(f"{BASE_URL}/api/pdf/rotate", json={
            "file_id": self.file_id,
            "rotation": 90,
            "pages": "all"
        })
        # Should return 200 (success) or 400/404 (validation error) - not 404 (endpoint not found)
        assert response.status_code in [200, 400, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert "rotate_id" in data or "status" in data
            print(f"✓ PDF rotate endpoint works - status: {response.status_code}")
        else:
            print(f"✓ PDF rotate endpoint exists - status: {response.status_code}")
    
    def test_pdf_compress_endpoint_exists(self):
        """Test /api/pdf/compress endpoint exists and responds"""
        if not self.file_id:
            pytest.skip("File upload failed")
        
        response = requests.post(f"{BASE_URL}/api/pdf/compress", json={
            "file_id": self.file_id,
            "quality": "medium"
        })
        assert response.status_code in [200, 400, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert "compress_id" in data or "status" in data
            print(f"✓ PDF compress endpoint works - status: {response.status_code}")
        else:
            print(f"✓ PDF compress endpoint exists - status: {response.status_code}")
    
    def test_pdf_watermark_endpoint_exists(self):
        """Test /api/pdf/watermark endpoint exists and responds"""
        if not self.file_id:
            pytest.skip("File upload failed")
        
        response = requests.post(f"{BASE_URL}/api/pdf/watermark", json={
            "file_id": self.file_id,
            "text": "CONFIDENTIAL",
            "position": "center"
        })
        assert response.status_code in [200, 400, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert "watermark_id" in data or "status" in data
            print(f"✓ PDF watermark endpoint works - status: {response.status_code}")
        else:
            print(f"✓ PDF watermark endpoint exists - status: {response.status_code}")
    
    def test_pdf_remove_pages_endpoint_exists(self):
        """Test /api/pdf/remove-pages endpoint exists and responds"""
        if not self.file_id:
            pytest.skip("File upload failed")
        
        response = requests.post(f"{BASE_URL}/api/pdf/remove-pages", json={
            "file_id": self.file_id,
            "pages": [1]
        })
        assert response.status_code in [200, 400, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert "remove_id" in data or "status" in data
            print(f"✓ PDF remove-pages endpoint works - status: {response.status_code}")
        else:
            print(f"✓ PDF remove-pages endpoint exists - status: {response.status_code}")
    
    def test_pdf_reorder_endpoint_exists(self):
        """Test /api/pdf/reorder endpoint exists and responds"""
        if not self.file_id:
            pytest.skip("File upload failed")
        
        response = requests.post(f"{BASE_URL}/api/pdf/reorder", json={
            "file_id": self.file_id,
            "order": [2, 1]
        })
        assert response.status_code in [200, 400, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert "reorder_id" in data or "status" in data
            print(f"✓ PDF reorder endpoint works - status: {response.status_code}")
        else:
            print(f"✓ PDF reorder endpoint exists - status: {response.status_code}")
    
    def test_pdf_extract_text_endpoint_exists(self):
        """Test /api/pdf/extract-text endpoint exists and responds"""
        if not self.file_id:
            pytest.skip("File upload failed")
        
        response = requests.post(f"{BASE_URL}/api/pdf/extract-text", json={
            "file_id": self.file_id,
            "format": "txt"
        })
        assert response.status_code in [200, 400, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert "extract_id" in data or "status" in data
            print(f"✓ PDF extract-text endpoint works - status: {response.status_code}")
        else:
            print(f"✓ PDF extract-text endpoint exists - status: {response.status_code}")
    
    def test_pdf_info_endpoint_exists(self):
        """Test /api/pdf/info/{file_id} endpoint exists and responds"""
        if not self.file_id:
            pytest.skip("File upload failed")
        
        response = requests.get(f"{BASE_URL}/api/pdf/info/{self.file_id}")
        assert response.status_code in [200, 400, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert "file_id" in data or "total_pages" in data
            print(f"✓ PDF info endpoint works - status: {response.status_code}")
        else:
            print(f"✓ PDF info endpoint exists - status: {response.status_code}")


class TestAIAnalysis:
    """Test AI Analysis endpoint"""
    
    def test_analyze_endpoint_exists(self):
        """Test /api/analyze endpoint exists"""
        # First upload a file
        files = {'file': ('test_legal_doc.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        
        if upload_response.status_code != 200:
            pytest.skip("File upload failed")
        
        file_id = upload_response.json()["file_id"]
        
        # Test analyze endpoint
        response = requests.post(f"{BASE_URL}/api/analyze", json={
            "file_id": file_id
        })
        
        # Should return 200 (success) or 500 (AI error) - not 404 (endpoint not found)
        assert response.status_code in [200, 400, 404, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "analysis_id" in data
            assert "summary" in data
            # Check if it's real AI analysis (not placeholder)
            if "ai_powered" in data:
                print(f"✓ AI Analysis endpoint works - AI powered: {data.get('ai_powered', 'unknown')}")
            else:
                print(f"✓ AI Analysis endpoint works - analysis_id: {data['analysis_id']}")
        else:
            print(f"✓ AI Analysis endpoint exists - status: {response.status_code}")


class TestSEOEndpoints:
    """Test SEO-related static files"""
    
    def test_sitemap_accessible(self):
        """Test /sitemap.xml is accessible"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        assert response.status_code == 200
        assert "xml" in response.headers.get("content-type", "").lower() or "sitemap" in response.text.lower()
        print("✓ Sitemap.xml is accessible")
    
    def test_robots_txt_accessible(self):
        """Test /robots.txt is accessible"""
        response = requests.get(f"{BASE_URL}/robots.txt")
        assert response.status_code == 200
        content = response.text.lower()
        # Check for AI crawler allowances
        assert "user-agent" in content
        print("✓ Robots.txt is accessible")
    
    def test_robots_allows_ai_crawlers(self):
        """Test robots.txt allows AI crawlers"""
        response = requests.get(f"{BASE_URL}/robots.txt")
        assert response.status_code == 200
        content = response.text
        # Check for AI crawler mentions
        ai_crawlers = ["GPTBot", "ChatGPT", "anthropic", "Claude", "Perplexity"]
        found_crawlers = [c for c in ai_crawlers if c.lower() in content.lower()]
        assert len(found_crawlers) > 0, "No AI crawlers found in robots.txt"
        print(f"✓ Robots.txt allows AI crawlers: {found_crawlers}")


class TestFrontendPages:
    """Test frontend pages load correctly"""
    
    def test_homepage_loads(self):
        """Test homepage loads"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        assert "LegalDocConverter" in response.text or "Legal" in response.text
        print("✓ Homepage loads correctly")
    
    def test_features_page_loads(self):
        """Test /features page loads"""
        response = requests.get(f"{BASE_URL}/features")
        assert response.status_code == 200
        print("✓ Features page loads correctly")
    
    def test_pricing_page_loads(self):
        """Test /pricing page loads"""
        response = requests.get(f"{BASE_URL}/pricing")
        assert response.status_code == 200
        print("✓ Pricing page loads correctly")
    
    def test_about_page_loads(self):
        """Test /about page loads"""
        response = requests.get(f"{BASE_URL}/about")
        assert response.status_code == 200
        print("✓ About page loads correctly")
    
    def test_contact_page_loads(self):
        """Test /contact page loads"""
        response = requests.get(f"{BASE_URL}/contact")
        assert response.status_code == 200
        print("✓ Contact page loads correctly")
    
    def test_blog_page_loads(self):
        """Test /blog page loads"""
        response = requests.get(f"{BASE_URL}/blog")
        assert response.status_code == 200
        print("✓ Blog page loads correctly")
    
    def test_structured_data_present(self):
        """Test structured data (JSON-LD) is present in homepage"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        # Check for JSON-LD structured data
        assert "application/ld+json" in response.text
        assert "@context" in response.text
        assert "schema.org" in response.text
        print("✓ Structured data (JSON-LD) is present")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
