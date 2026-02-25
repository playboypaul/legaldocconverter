"""
Test file for Version History and OCR Languages features
Tests the newly implemented:
1. OCR Languages API (/api/ocr/languages) - 15 languages
2. Version History APIs (create, get, stats, revert, compare)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://legal-converter-pro.preview.emergentagent.com').rstrip('/')

class TestOCRLanguages:
    """Test OCR Languages API - should return 15 supported languages"""
    
    def test_ocr_languages_endpoint_returns_200(self):
        """Test /api/ocr/languages returns 200"""
        response = requests.get(f"{BASE_URL}/api/ocr/languages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ OCR Languages endpoint returns 200")
    
    def test_ocr_languages_returns_all_15_languages(self):
        """Test that exactly 15 languages are available"""
        response = requests.get(f"{BASE_URL}/api/ocr/languages")
        assert response.status_code == 200
        
        data = response.json()
        assert "available_languages" in data, "Response missing 'available_languages'"
        
        languages = data["available_languages"]
        assert len(languages) == 15, f"Expected 15 languages, got {len(languages)}"
        print(f"✓ OCR Languages API returns 15 languages")
    
    def test_ocr_languages_contains_required_languages(self):
        """Test that all required languages are present"""
        response = requests.get(f"{BASE_URL}/api/ocr/languages")
        assert response.status_code == 200
        
        data = response.json()
        languages = data["available_languages"]
        
        required_codes = ["eng", "fra", "deu", "spa", "ita", "por", "nld", "pol", "rus", "jpn", "chi_sim", "chi_tra", "kor", "ara", "hin"]
        required_names = ["English", "French", "German", "Spanish", "Italian", "Portuguese", "Dutch", "Polish", "Russian", "Japanese", "Chinese (Simplified)", "Chinese (Traditional)", "Korean", "Arabic", "Hindi"]
        
        for code in required_codes:
            assert code in languages, f"Missing language code: {code}"
        
        for name in required_names:
            assert name in languages.values(), f"Missing language name: {name}"
        
        print(f"✓ All 15 required languages present: {', '.join(required_codes)}")
    
    def test_ocr_languages_has_default(self):
        """Test that default language is English"""
        response = requests.get(f"{BASE_URL}/api/ocr/languages")
        assert response.status_code == 200
        
        data = response.json()
        assert "default" in data, "Response missing 'default' field"
        assert data["default"] == "eng", f"Expected default 'eng', got {data['default']}"
        print(f"✓ Default language is 'eng' (English)")
    
    def test_ocr_languages_has_note(self):
        """Test response contains note about additional languages"""
        response = requests.get(f"{BASE_URL}/api/ocr/languages")
        assert response.status_code == 200
        
        data = response.json()
        assert "note" in data, "Response missing 'note' field"
        assert len(data["note"]) > 0, "Note field is empty"
        print(f"✓ Response contains note: '{data['note']}'")


class TestVersionHistoryAPIs:
    """Test Version History APIs"""
    
    @pytest.fixture(scope="class")
    def uploaded_file(self):
        """Upload a test file to use for version testing"""
        # Create a simple PDF content
        test_content = b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF'
        
        files = {'file': ('test_version.pdf', test_content, 'application/pdf')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        
        if response.status_code == 200:
            return response.json()
        else:
            pytest.skip(f"Failed to upload test file: {response.status_code}")
    
    def test_version_create_requires_file_id(self):
        """Test /api/versions/create requires valid file_id"""
        response = requests.post(f"{BASE_URL}/api/versions/create", json={
            "file_id": "nonexistent-file-id-12345",
            "change_description": "Test version"
        })
        assert response.status_code == 404, f"Expected 404 for nonexistent file, got {response.status_code}"
        print(f"✓ Version create returns 404 for nonexistent file")
    
    def test_version_create_with_valid_file(self, uploaded_file):
        """Test creating a version for an uploaded file"""
        file_id = uploaded_file["file_id"]
        
        response = requests.post(f"{BASE_URL}/api/versions/create", json={
            "file_id": file_id,
            "change_description": "Initial version for testing",
            "created_by": "Test User"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check response structure
        assert "version_id" in data or "message" in data, "Response missing version_id or message"
        if "version_id" in data:
            assert "version_number" in data, "Response missing version_number"
            assert "created_at" in data, "Response missing created_at"
            assert "status" in data, "Response missing status"
            print(f"✓ Version created successfully: v{data.get('version_number')}")
        else:
            print(f"✓ Version API responded: {data.get('message')}")
    
    def test_get_version_history(self, uploaded_file):
        """Test getting version history for a file"""
        file_id = uploaded_file["file_id"]
        
        response = requests.get(f"{BASE_URL}/api/versions/{file_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "file_id" in data, "Response missing file_id"
        assert "versions" in data, "Response missing versions array"
        assert "total_versions" in data or isinstance(data["versions"], list), "Response missing total_versions"
        print(f"✓ Version history retrieved: {len(data.get('versions', []))} versions found")
    
    def test_get_version_history_nonexistent_file(self):
        """Test getting version history for nonexistent file"""
        response = requests.get(f"{BASE_URL}/api/versions/nonexistent-file-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Version history returns 404 for nonexistent file")
    
    def test_version_stats(self, uploaded_file):
        """Test getting version statistics"""
        file_id = uploaded_file["file_id"]
        
        response = requests.get(f"{BASE_URL}/api/versions/stats/{file_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "file_id" in data, "Response missing file_id"
        assert "total_versions" in data, "Response missing total_versions"
        assert "has_history" in data, "Response missing has_history"
        print(f"✓ Version stats retrieved: total_versions={data.get('total_versions')}, has_history={data.get('has_history')}")
    
    def test_version_stats_nonexistent_file(self):
        """Test version stats for nonexistent file"""
        response = requests.get(f"{BASE_URL}/api/versions/stats/nonexistent-file-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Version stats returns 404 for nonexistent file")
    
    def test_version_compare_requires_parameters(self):
        """Test /api/versions/compare requires all parameters"""
        response = requests.post(f"{BASE_URL}/api/versions/compare", json={
            "file_id": "some-file-id"
            # Missing version_id_1 and version_id_2
        })
        assert response.status_code == 400, f"Expected 400 for missing params, got {response.status_code}"
        print(f"✓ Version compare validates required parameters")
    
    def test_version_compare_nonexistent_file(self):
        """Test version compare for nonexistent file"""
        response = requests.post(f"{BASE_URL}/api/versions/compare", json={
            "file_id": "nonexistent-file-12345",
            "version_id_1": "v1",
            "version_id_2": "v2"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Version compare returns 404 for nonexistent file")
    
    def test_version_revert_requires_parameters(self):
        """Test /api/versions/revert requires file_id and version_id"""
        response = requests.post(f"{BASE_URL}/api/versions/revert", json={
            "file_id": "nonexistent-file"
            # Missing version_id
        })
        # Should fail validation or return 404
        assert response.status_code in [400, 404, 422], f"Expected 400/404/422, got {response.status_code}"
        print(f"✓ Version revert validates required parameters")
    
    def test_version_revert_nonexistent_file(self):
        """Test version revert for nonexistent file"""
        response = requests.post(f"{BASE_URL}/api/versions/revert", json={
            "file_id": "nonexistent-file-12345",
            "version_id": "nonexistent-version-12345",
            "created_by": "Test User"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Version revert returns 404 for nonexistent file")


class TestVersionHistoryIntegration:
    """Integration tests for version history workflow"""
    
    def test_full_version_workflow(self):
        """Test complete version workflow: upload -> create versions -> get history -> stats"""
        # Step 1: Upload a file
        test_content = b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF'
        
        files = {'file': ('workflow_test.pdf', test_content, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        
        if upload_response.status_code != 200:
            pytest.skip("Failed to upload test file")
        
        file_id = upload_response.json()["file_id"]
        print(f"✓ Step 1: File uploaded with ID: {file_id}")
        
        # Step 2: Create first version
        v1_response = requests.post(f"{BASE_URL}/api/versions/create", json={
            "file_id": file_id,
            "change_description": "Version 1 - Initial document",
            "created_by": "Integration Test"
        })
        assert v1_response.status_code == 200
        v1_data = v1_response.json()
        print(f"✓ Step 2: Version 1 created")
        
        # Step 3: Get version history
        history_response = requests.get(f"{BASE_URL}/api/versions/{file_id}")
        assert history_response.status_code == 200
        history_data = history_response.json()
        versions_count = len(history_data.get("versions", []))
        print(f"✓ Step 3: Version history retrieved - {versions_count} versions")
        
        # Step 4: Get version stats
        stats_response = requests.get(f"{BASE_URL}/api/versions/stats/{file_id}")
        assert stats_response.status_code == 200
        stats_data = stats_response.json()
        print(f"✓ Step 4: Stats retrieved - total_versions: {stats_data.get('total_versions')}")
        
        # Step 5: Create second version (if first succeeded)
        if "version_id" in v1_data:
            v2_response = requests.post(f"{BASE_URL}/api/versions/create", json={
                "file_id": file_id,
                "change_description": "Version 2 - Updated document",
                "created_by": "Integration Test"
            })
            # Second version might return "no changes" since file hasn't changed
            assert v2_response.status_code == 200
            print(f"✓ Step 5: Second version request completed")
        
        print(f"✓ Full version workflow test PASSED")


class TestExistingFeatures:
    """Ensure existing features still work"""
    
    def test_formats_endpoint(self):
        """Test /api/formats still works"""
        response = requests.get(f"{BASE_URL}/api/formats")
        assert response.status_code == 200
        data = response.json()
        assert "input" in data
        assert "output" in data
        print(f"✓ Formats endpoint working: {len(data['input'])} input, {len(data['output'])} output formats")
    
    def test_health_endpoint(self):
        """Test /health endpoint"""
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        print(f"✓ Health endpoint working")
    
    def test_ocr_extract_404_for_invalid_file(self):
        """Test OCR extract returns 404 for invalid file"""
        response = requests.post(f"{BASE_URL}/api/ocr/extract", json={
            "file_id": "nonexistent-file-12345",
            "language": "eng"
        })
        assert response.status_code == 404
        print(f"✓ OCR extract returns 404 for invalid file")
    
    def test_dashboard_stats_endpoint(self):
        """Test dashboard stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats/123")  # user_id must be integer
        # Should return 200 with default stats
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        print(f"✓ Dashboard stats endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
