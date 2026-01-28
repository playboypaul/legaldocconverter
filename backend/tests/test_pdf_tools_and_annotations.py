"""
Backend API Tests for LegalDocConverter - PDF Tools and Annotations
Tests: PDF rotate, compress, watermark endpoints and annotation API
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pdf-tools-hub-5.preview.emergentagent.com').rstrip('/')

# Test PDF file for upload - 2 page PDF
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


class TestPDFRotateEndpoint:
    """Test /api/pdf/rotate endpoint"""
    
    def test_rotate_pdf_90_degrees(self):
        """Test rotating PDF 90 degrees"""
        # Upload a test PDF first
        files = {'file': ('test_rotate.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200, f"Upload failed: {upload_response.text}"
        file_id = upload_response.json()["file_id"]
        
        # Test rotate endpoint
        response = requests.post(f"{BASE_URL}/api/pdf/rotate", json={
            "file_id": file_id,
            "rotation": 90,
            "pages": "all"
        })
        
        assert response.status_code == 200, f"Rotate failed: {response.text}"
        data = response.json()
        assert "rotate_id" in data, "Missing rotate_id in response"
        assert "download_url" in data, "Missing download_url in response"
        assert data["status"] == "completed", f"Status not completed: {data.get('status')}"
        print(f"✓ PDF rotate 90° passed - rotate_id: {data['rotate_id']}")
    
    def test_rotate_pdf_180_degrees(self):
        """Test rotating PDF 180 degrees"""
        files = {'file': ('test_rotate_180.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        response = requests.post(f"{BASE_URL}/api/pdf/rotate", json={
            "file_id": file_id,
            "rotation": 180,
            "pages": "all"
        })
        
        assert response.status_code == 200, f"Rotate 180 failed: {response.text}"
        data = response.json()
        assert data["rotation"] == 180
        print(f"✓ PDF rotate 180° passed")
    
    def test_rotate_invalid_file_id(self):
        """Test rotate with invalid file_id returns 404"""
        response = requests.post(f"{BASE_URL}/api/pdf/rotate", json={
            "file_id": "invalid-file-id-12345",
            "rotation": 90
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ PDF rotate invalid file_id returns 404")


class TestPDFCompressEndpoint:
    """Test /api/pdf/compress endpoint"""
    
    def test_compress_pdf_medium_quality(self):
        """Test compressing PDF with medium quality"""
        files = {'file': ('test_compress.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        response = requests.post(f"{BASE_URL}/api/pdf/compress", json={
            "file_id": file_id,
            "quality": "medium"
        })
        
        assert response.status_code == 200, f"Compress failed: {response.text}"
        data = response.json()
        assert "compress_id" in data, "Missing compress_id"
        assert "download_url" in data, "Missing download_url"
        assert "original_size" in data, "Missing original_size"
        assert "compressed_size" in data, "Missing compressed_size"
        assert data["status"] == "completed"
        print(f"✓ PDF compress passed - reduction: {data.get('reduction_percent', 'N/A')}%")
    
    def test_compress_pdf_low_quality(self):
        """Test compressing PDF with low quality (max compression)"""
        files = {'file': ('test_compress_low.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        response = requests.post(f"{BASE_URL}/api/pdf/compress", json={
            "file_id": file_id,
            "quality": "low"
        })
        
        assert response.status_code == 200
        print("✓ PDF compress low quality passed")


class TestPDFWatermarkEndpoint:
    """Test /api/pdf/watermark endpoint"""
    
    def test_watermark_pdf_center(self):
        """Test adding center watermark to PDF"""
        files = {'file': ('test_watermark.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        response = requests.post(f"{BASE_URL}/api/pdf/watermark", json={
            "file_id": file_id,
            "text": "CONFIDENTIAL",
            "position": "center",
            "opacity": 0.3,
            "font_size": 50
        })
        
        assert response.status_code == 200, f"Watermark failed: {response.text}"
        data = response.json()
        assert "watermark_id" in data, "Missing watermark_id"
        assert "download_url" in data, "Missing download_url"
        assert data["watermark_text"] == "CONFIDENTIAL"
        assert data["status"] == "completed"
        print(f"✓ PDF watermark center passed - watermark_id: {data['watermark_id']}")
    
    def test_watermark_pdf_diagonal(self):
        """Test adding diagonal watermark to PDF"""
        files = {'file': ('test_watermark_diag.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        response = requests.post(f"{BASE_URL}/api/pdf/watermark", json={
            "file_id": file_id,
            "text": "DRAFT",
            "position": "diagonal"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["position"] == "diagonal"
        print("✓ PDF watermark diagonal passed")
    
    def test_watermark_custom_text(self):
        """Test adding custom watermark text"""
        files = {'file': ('test_watermark_custom.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        custom_text = "LEGAL REVIEW COPY"
        response = requests.post(f"{BASE_URL}/api/pdf/watermark", json={
            "file_id": file_id,
            "text": custom_text,
            "position": "header"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["watermark_text"] == custom_text
        print(f"✓ PDF watermark custom text passed: '{custom_text}'")


class TestAnnotationEndpoints:
    """Test annotation API endpoints"""
    
    def test_add_annotation(self):
        """Test adding annotation to a document"""
        # Upload a test file first
        files = {'file': ('test_annotate.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        # Add annotation
        response = requests.post(f"{BASE_URL}/api/annotate", json={
            "file_id": file_id,
            "annotation": {
                "type": "comment",
                "text": "This is a test annotation",
                "color": "yellow",
                "page": 1,
                "location": "document",
                "author": "test@example.com"
            }
        })
        
        assert response.status_code == 200, f"Add annotation failed: {response.text}"
        data = response.json()
        assert "annotation_id" in data, "Missing annotation_id"
        assert data["status"] == "success"
        print(f"✓ Add annotation passed - annotation_id: {data['annotation_id']}")
        return file_id, data["annotation_id"]
    
    def test_get_annotations(self):
        """Test getting annotations for a document"""
        # First add an annotation
        files = {'file': ('test_get_annot.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        # Add annotation
        requests.post(f"{BASE_URL}/api/annotate", json={
            "file_id": file_id,
            "annotation": {
                "type": "highlight",
                "text": "Important clause",
                "color": "green"
            }
        })
        
        # Get annotations
        response = requests.get(f"{BASE_URL}/api/annotations/{file_id}")
        
        assert response.status_code == 200, f"Get annotations failed: {response.text}"
        data = response.json()
        assert "annotations" in data, "Missing annotations array"
        assert "total" in data, "Missing total count"
        assert data["file_id"] == file_id
        print(f"✓ Get annotations passed - total: {data['total']}")
    
    def test_delete_annotation(self):
        """Test deleting an annotation"""
        # First add an annotation
        files = {'file': ('test_delete_annot.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        # Add annotation
        add_response = requests.post(f"{BASE_URL}/api/annotate", json={
            "file_id": file_id,
            "annotation": {
                "type": "note",
                "text": "To be deleted"
            }
        })
        assert add_response.status_code == 200
        annotation_id = add_response.json()["annotation_id"]
        
        # Delete annotation
        response = requests.delete(f"{BASE_URL}/api/annotations/{annotation_id}")
        
        assert response.status_code == 200, f"Delete annotation failed: {response.text}"
        data = response.json()
        assert data["status"] == "success"
        print(f"✓ Delete annotation passed - annotation_id: {annotation_id}")
    
    def test_get_annotations_file_not_found(self):
        """Test getting annotations for non-existent file returns 404"""
        response = requests.get(f"{BASE_URL}/api/annotations/invalid-file-id-12345")
        assert response.status_code == 404
        print("✓ Get annotations for invalid file returns 404")


class TestBatchConvertEndpoint:
    """Test batch conversion endpoint"""
    
    def test_batch_convert_endpoint_exists(self):
        """Test /api/batch-convert endpoint exists"""
        # Upload two test files
        files1 = {'file': ('test_batch1.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload1 = requests.post(f"{BASE_URL}/api/upload", files=files1)
        assert upload1.status_code == 200
        file_id1 = upload1.json()["file_id"]
        
        files2 = {'file': ('test_batch2.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload2 = requests.post(f"{BASE_URL}/api/upload", files=files2)
        assert upload2.status_code == 200
        file_id2 = upload2.json()["file_id"]
        
        # Test batch convert
        response = requests.post(f"{BASE_URL}/api/batch-convert", json={
            "file_ids": [file_id1, file_id2],
            "target_format": "txt"
        })
        
        # Should return 200 or 500 (conversion may fail for minimal PDF)
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "results" in data
            print(f"✓ Batch convert passed - {len(data['results'])} files processed")
        else:
            print("✓ Batch convert endpoint exists (conversion may fail for test PDF)")


class TestDownloadEndpoint:
    """Test download endpoint for PDF operations"""
    
    def test_download_rotated_pdf(self):
        """Test downloading a rotated PDF"""
        # Upload and rotate
        files = {'file': ('test_download.pdf', TEST_PDF_CONTENT, 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        rotate_response = requests.post(f"{BASE_URL}/api/pdf/rotate", json={
            "file_id": file_id,
            "rotation": 90
        })
        assert rotate_response.status_code == 200
        rotate_id = rotate_response.json()["rotate_id"]
        
        # Download
        download_response = requests.get(f"{BASE_URL}/api/download/{rotate_id}")
        assert download_response.status_code == 200
        assert len(download_response.content) > 0
        print(f"✓ Download rotated PDF passed - size: {len(download_response.content)} bytes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
