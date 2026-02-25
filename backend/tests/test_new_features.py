"""
Test new features: Dashboard API, Annotations API, PDF Forms API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://legal-converter-pro.preview.emergentagent.com').rstrip('/')

class TestDashboardAPI:
    """Test User Dashboard API endpoints"""
    
    def test_dashboard_stats_returns_200(self):
        """Test /api/dashboard/stats/{user_id} returns expected data"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats/1")
        print(f"Dashboard stats response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        # Verify response structure
        assert "user_id" in data
        assert "total_uploads" in data
        assert "total_conversions" in data
        assert "total_analyses" in data
        assert "storage_used_mb" in data
        assert "subscription_tier" in data
        assert "subscription_status" in data
        assert "member_since" in data
        print(f"Dashboard stats data: {data}")
    
    def test_dashboard_subscription_returns_200(self):
        """Test /api/dashboard/subscription/{user_id} returns subscription info"""
        response = requests.get(f"{BASE_URL}/api/dashboard/subscription/1")
        print(f"Dashboard subscription response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        # Verify response structure
        assert "tier" in data
        assert "status" in data
        assert "features" in data
        assert "limits" in data
        assert isinstance(data["features"], list)
        print(f"Dashboard subscription data: {data}")
    
    def test_dashboard_history_returns_200(self):
        """Test /api/dashboard/history/{user_id} returns document history"""
        response = requests.get(f"{BASE_URL}/api/dashboard/history/1?limit=10")
        print(f"Dashboard history response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        # Verify response structure
        assert "user_id" in data
        assert "history" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert isinstance(data["history"], list)
        print(f"Dashboard history data: total={data['total']}, limit={data['limit']}")
    
    def test_dashboard_usage_chart_returns_200(self):
        """Test /api/dashboard/usage-chart/{user_id} returns chart data"""
        response = requests.get(f"{BASE_URL}/api/dashboard/usage-chart/1?days=7")
        print(f"Dashboard usage chart response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        # Verify response structure
        assert "user_id" in data
        assert "period_days" in data
        assert "chart_data" in data
        assert isinstance(data["chart_data"], list)
        print(f"Dashboard usage chart: {len(data['chart_data'])} data points")


class TestAnnotationsAPI:
    """Test Annotations API endpoints"""
    
    def test_get_annotations_empty_file(self):
        """Test /api/annotations/{file_id} returns empty for non-existent file"""
        response = requests.get(f"{BASE_URL}/api/annotations/test-file-id")
        print(f"Get annotations response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "file_id" in data
        assert "annotations" in data
        assert "total" in data
        assert data["total"] == 0
        print(f"Annotations for test file: {data}")
    
    def test_visual_annotation_requires_valid_file(self):
        """Test /api/annotations/visual returns 404 for invalid file"""
        annotation_data = {
            "file_id": "invalid-file-id",
            "type": "highlight",
            "text": "Test annotation",
            "position": {"page": 1, "x": 100, "y": 100},
            "color": "#FFFF00",
            "opacity": 0.5,
            "author": "Test User"
        }
        response = requests.post(f"{BASE_URL}/api/annotations/visual", json=annotation_data)
        print(f"Visual annotation response: {response.status_code}")
        # Should return 404 because file doesn't exist
        assert response.status_code == 404
    
    def test_legacy_annotate_endpoint(self):
        """Test legacy /api/annotate endpoint"""
        annotation_data = {
            "file_id": "invalid-file-id",
            "annotation": {
                "type": "comment",
                "text": "Test comment",
                "page": 1
            }
        }
        response = requests.post(f"{BASE_URL}/api/annotate", json=annotation_data)
        print(f"Legacy annotate response: {response.status_code}")
        # Should return 404 because file doesn't exist
        assert response.status_code == 404


class TestPDFFormsAPI:
    """Test PDF Forms API endpoints"""
    
    def test_form_fields_requires_valid_file(self):
        """Test /api/pdf/form-fields/{file_id} returns 404 for invalid file"""
        response = requests.get(f"{BASE_URL}/api/pdf/form-fields/invalid-file-id")
        print(f"PDF form fields response: {response.status_code}")
        assert response.status_code == 404
    
    def test_fill_form_requires_valid_file(self):
        """Test /api/pdf/fill-form returns 404 for invalid file"""
        fill_data = {
            "file_id": "invalid-file-id",
            "fields": {"field1": "value1"}
        }
        response = requests.post(f"{BASE_URL}/api/pdf/fill-form", json=fill_data)
        print(f"PDF fill form response: {response.status_code}")
        assert response.status_code == 404
    
    def test_flatten_form_requires_valid_file(self):
        """Test /api/pdf/flatten-form returns 404 for invalid file"""
        flatten_data = {
            "file_id": "invalid-file-id"
        }
        response = requests.post(f"{BASE_URL}/api/pdf/flatten-form", json=flatten_data)
        print(f"PDF flatten form response: {response.status_code}")
        assert response.status_code == 404


class TestPDFFormsWithRealFile:
    """Test PDF Forms API with real uploaded PDF"""
    
    @pytest.fixture(scope="class")
    def uploaded_pdf(self):
        """Upload a test PDF file"""
        # Create a simple PDF for testing
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        import io
        
        # Create PDF in memory
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        c.drawString(100, 750, "Test PDF Document")
        c.drawString(100, 700, "This is a test document for form testing")
        c.save()
        buffer.seek(0)
        
        # Upload the PDF
        files = {"file": ("test_form.pdf", buffer, "application/pdf")}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        print(f"Upload response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Uploaded file_id: {data.get('file_id')}")
            return data
        return None
    
    def test_form_fields_on_real_pdf(self, uploaded_pdf):
        """Test form field detection on uploaded PDF"""
        if not uploaded_pdf:
            pytest.skip("PDF upload failed")
        
        file_id = uploaded_pdf["file_id"]
        response = requests.get(f"{BASE_URL}/api/pdf/form-fields/{file_id}")
        print(f"Form fields response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "file_id" in data
        assert "has_forms" in data
        assert "fields" in data
        assert "total_fields" in data
        print(f"Form fields data: has_forms={data['has_forms']}, total_fields={data['total_fields']}")


class TestAnnotationsWithRealFile:
    """Test Annotations API with real uploaded file"""
    
    @pytest.fixture(scope="class")
    def uploaded_pdf(self):
        """Upload a test PDF file"""
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        import io
        
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        c.drawString(100, 750, "Test PDF for Annotations")
        c.save()
        buffer.seek(0)
        
        files = {"file": ("test_annotations.pdf", buffer, "application/pdf")}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        
        if response.status_code == 200:
            return response.json()
        return None
    
    def test_add_visual_annotation(self, uploaded_pdf):
        """Test adding visual annotation to real PDF"""
        if not uploaded_pdf:
            pytest.skip("PDF upload failed")
        
        file_id = uploaded_pdf["file_id"]
        annotation_data = {
            "file_id": file_id,
            "type": "highlight",
            "text": "Test highlight annotation",
            "position": {"page": 1, "x": 100, "y": 700, "width": 200, "height": 20},
            "color": "#FFFF00",
            "opacity": 0.5,
            "author": "Test User"
        }
        
        response = requests.post(f"{BASE_URL}/api/annotations/visual", json=annotation_data)
        print(f"Add visual annotation response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "annotation_id" in data
        assert "file_id" in data
        assert "type" in data
        assert "status" in data
        assert data["status"] == "created"
        print(f"Added annotation: {data}")
        return data
    
    def test_get_annotations_after_add(self, uploaded_pdf):
        """Test retrieving annotations after adding"""
        if not uploaded_pdf:
            pytest.skip("PDF upload failed")
        
        file_id = uploaded_pdf["file_id"]
        
        # First add an annotation
        annotation_data = {
            "file_id": file_id,
            "type": "comment",
            "text": "Test comment annotation",
            "position": {"page": 1, "x": 150, "y": 650},
            "color": "#FF0000",
            "opacity": 1.0,
            "author": "Test User 2"
        }
        requests.post(f"{BASE_URL}/api/annotations/visual", json=annotation_data)
        
        # Now get all annotations
        response = requests.get(f"{BASE_URL}/api/annotations/{file_id}")
        print(f"Get annotations response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 1
        print(f"Total annotations: {data['total']}")
    
    def test_get_page_annotations(self, uploaded_pdf):
        """Test retrieving annotations for specific page"""
        if not uploaded_pdf:
            pytest.skip("PDF upload failed")
        
        file_id = uploaded_pdf["file_id"]
        response = requests.get(f"{BASE_URL}/api/annotations/{file_id}/page/1")
        print(f"Get page annotations response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "page" in data
        assert "annotations" in data
        print(f"Page 1 annotations: {data['total']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
