#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Legal Document Converter
Testing PDF Toolkit functionality with real PDF operations
"""

import asyncio
import aiohttp
import aiofiles
import os
import json
import tempfile
import time
import logging
from pathlib import Path
from typing import Dict, List, Any
import random
import string
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfReader

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BackendTester:
    def __init__(self):
        # Get backend URL from frontend .env
        self.backend_url = self._get_backend_url()
        self.api_base = f"{self.backend_url}/api"
        self.test_results = {
            "upload_tests": [],
            "conversion_tests": [],
            "analysis_tests": [],
            "performance_tests": [],
            "error_tests": [],
            "pdf_toolkit_tests": []
        }
        self.uploaded_files = {}  # Store uploaded file IDs for PDF operations
        
    def _get_backend_url(self) -> str:
        """Get backend URL from frontend .env file"""
        try:
            env_path = Path("/app/frontend/.env")
            if env_path.exists():
                with open(env_path, 'r') as f:
                    for line in f:
                        if line.startswith('REACT_APP_BACKEND_URL='):
                            return line.split('=', 1)[1].strip()
            return "http://localhost:8001"  # fallback
        except Exception as e:
            logger.error(f"Error reading backend URL: {e}")
            return "http://localhost:8001"
    
    async def create_test_files(self):
        """Create various test files for upload testing including real PDFs"""
        test_files = {}
        temp_dir = tempfile.gettempdir()
        
        # Create real PDF files using reportlab
        # Single page PDF
        single_page_pdf = os.path.join(temp_dir, 'single_page_test.pdf')
        c = canvas.Canvas(single_page_pdf, pagesize=letter)
        c.drawString(100, 750, "Legal Document Converter Test - Page 1")
        c.drawString(100, 730, "This is a single page PDF for testing purposes.")
        c.drawString(100, 710, "Contract Terms and Conditions")
        c.drawString(100, 690, "1. Service Agreement")
        c.drawString(100, 670, "2. Payment Terms")
        c.drawString(100, 650, "3. Liability Clauses")
        c.save()
        
        # Multi-page PDF (3 pages)
        multi_page_pdf = os.path.join(temp_dir, 'multi_page_test.pdf')
        c = canvas.Canvas(multi_page_pdf, pagesize=letter)
        
        # Page 1
        c.drawString(100, 750, "Legal Document - Page 1")
        c.drawString(100, 730, "Introduction and Overview")
        c.drawString(100, 710, "This document contains multiple pages for testing PDF operations.")
        c.showPage()
        
        # Page 2
        c.drawString(100, 750, "Legal Document - Page 2")
        c.drawString(100, 730, "Terms and Conditions")
        c.drawString(100, 710, "Detailed terms and conditions for the service agreement.")
        c.showPage()
        
        # Page 3
        c.drawString(100, 750, "Legal Document - Page 3")
        c.drawString(100, 730, "Conclusion and Signatures")
        c.drawString(100, 710, "Final page with signature requirements.")
        c.save()
        
        # Another single page PDF for merge testing
        merge_pdf_1 = os.path.join(temp_dir, 'merge_test_1.pdf')
        c = canvas.Canvas(merge_pdf_1, pagesize=letter)
        c.drawString(100, 750, "Merge Test Document 1")
        c.drawString(100, 730, "This is the first document to be merged.")
        c.drawString(100, 710, "Legal Agreement Part A")
        c.save()
        
        # Second PDF for merge testing
        merge_pdf_2 = os.path.join(temp_dir, 'merge_test_2.pdf')
        c = canvas.Canvas(merge_pdf_2, pagesize=letter)
        c.drawString(100, 750, "Merge Test Document 2")
        c.drawString(100, 730, "This is the second document to be merged.")
        c.drawString(100, 710, "Legal Agreement Part B")
        c.save()
        
        test_files['single_page_pdf'] = single_page_pdf
        test_files['multi_page_pdf'] = multi_page_pdf
        test_files['merge_pdf_1'] = merge_pdf_1
        test_files['merge_pdf_2'] = merge_pdf_2
        
        # Create TXT files
        small_txt = "This is a small text file for testing upload functionality."
        medium_txt = "This is a medium text file.\n" + "Sample legal document content. " * 1000
        large_txt = "Large text file content.\n" + "Legal document text content. " * 10000
        
        # Create DOCX content (simplified)
        docx_content = """This is a test DOCX file content.
        
Legal Document Test Content:

1. Terms and Conditions
2. Privacy Policy  
3. Service Agreement
4. Liability Clauses
5. Termination Provisions

This document contains standard legal provisions for testing purposes."""

        # Write test files
        temp_dir = tempfile.gettempdir()
        
        test_files['small_pdf'] = os.path.join(temp_dir, 'test_small.pdf')
        test_files['medium_pdf'] = os.path.join(temp_dir, 'test_medium.pdf')  
        test_files['large_pdf'] = os.path.join(temp_dir, 'test_large.pdf')
        test_files['small_txt'] = os.path.join(temp_dir, 'test_small.txt')
        test_files['medium_txt'] = os.path.join(temp_dir, 'test_medium.txt')
        test_files['large_txt'] = os.path.join(temp_dir, 'test_large.txt')
        test_files['docx_file'] = os.path.join(temp_dir, 'test_document.txt')  # Will be treated as txt
        
        # Create additional test files for general testing
        # Create TXT files
        small_txt = "This is a small text file for testing upload functionality."
        medium_txt = "This is a medium text file.\n" + "Sample legal document content. " * 1000
        large_txt = "Large text file content.\n" + "Legal document text content. " * 10000
        
        test_files['small_txt'] = os.path.join(temp_dir, 'test_small.txt')
        test_files['medium_txt'] = os.path.join(temp_dir, 'test_medium.txt')
        test_files['large_txt'] = os.path.join(temp_dir, 'test_large.txt')
        # Write text files
        with open(test_files['small_txt'], 'w') as f:
            f.write(small_txt)
        with open(test_files['medium_txt'], 'w') as f:
            f.write(medium_txt)
        with open(test_files['large_txt'], 'w') as f:
            f.write(large_txt)
            
        logger.info(f"Created test files in {temp_dir}")
        return test_files
    
    async def test_single_upload(self, session: aiohttp.ClientSession, file_path: str, file_type: str) -> Dict[str, Any]:
        """Test single file upload"""
        start_time = time.time()
        result = {
            "file_type": file_type,
            "file_path": file_path,
            "file_size": os.path.getsize(file_path),
            "success": False,
            "response_time": 0,
            "error": None,
            "response_data": None
        }
        
        try:
            filename = os.path.basename(file_path)
            
            with open(file_path, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename=filename, content_type='application/octet-stream')
                
                async with session.post(f"{self.api_base}/upload", data=data) as response:
                    result["response_time"] = time.time() - start_time
                    result["status_code"] = response.status
                    
                    if response.status == 200:
                        response_json = await response.json()
                        result["success"] = True
                        result["response_data"] = response_json
                        # Store file ID for PDF operations
                        if 'pdf' in file_type and 'file_id' in response_json:
                            self.uploaded_files[file_type] = response_json['file_id']
                        logger.info(f"✅ Upload successful: {filename} ({result['file_size']} bytes)")
                    else:
                        error_text = await response.text()
                        result["error"] = f"HTTP {response.status}: {error_text}"
                        logger.error(f"❌ Upload failed: {filename} - {result['error']}")
                        
        except Exception as e:
            result["response_time"] = time.time() - start_time
            result["error"] = str(e)
            logger.error(f"❌ Upload exception: {file_type} - {str(e)}")
            
        return result
    
    async def test_multiple_rapid_uploads(self, session: aiohttp.ClientSession, file_path: str, count: int = 5) -> List[Dict[str, Any]]:
        """Test multiple rapid uploads of the same file"""
        logger.info(f"Testing {count} rapid uploads of {os.path.basename(file_path)}")
        
        tasks = []
        for i in range(count):
            task = self.test_single_upload(session, file_path, f"rapid_test_{i}")
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "test_number": i,
                    "success": False,
                    "error": str(result),
                    "file_path": file_path
                })
            else:
                result["test_number"] = i
                processed_results.append(result)
        
        success_count = sum(1 for r in processed_results if r.get("success", False))
        logger.info(f"Rapid upload results: {success_count}/{count} successful")
        
        return processed_results
    
    async def test_file_upload_endpoint(self):
        """Comprehensive file upload testing"""
        logger.info("🚀 Starting comprehensive file upload testing...")
        
        # Create test files
        test_files = await self.create_test_files()
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
            
            # Test 1: Individual file uploads
            logger.info("\n📁 Testing individual file uploads...")
            for file_key, file_path in test_files.items():
                result = await self.test_single_upload(session, file_path, file_key)
                self.test_results["upload_tests"].append(result)
            
            # Test 2: Multiple rapid PDF uploads (the main issue)
            logger.info("\n🔄 Testing multiple rapid PDF uploads...")
            pdf_rapid_results = await self.test_multiple_rapid_uploads(
                session, test_files['small_pdf'], 10
            )
            self.test_results["performance_tests"].extend(pdf_rapid_results)
            
            # Test 3: Multiple rapid TXT uploads
            logger.info("\n📝 Testing multiple rapid TXT uploads...")
            txt_rapid_results = await self.test_multiple_rapid_uploads(
                session, test_files['small_txt'], 10
            )
            self.test_results["performance_tests"].extend(txt_rapid_results)
            
            # Test 4: Large file uploads
            logger.info("\n📊 Testing large file uploads...")
            large_files = ['large_pdf', 'large_txt']
            for file_key in large_files:
                if file_key in test_files:
                    result = await self.test_single_upload(session, test_files[file_key], f"large_{file_key}")
                    self.test_results["upload_tests"].append(result)
            
            # Test 5: Invalid file uploads
            logger.info("\n❌ Testing invalid file uploads...")
            await self.test_invalid_uploads(session)
            
            # Test 6: API endpoint availability
            logger.info("\n🔍 Testing API endpoints...")
            await self.test_api_endpoints(session)
    
    async def test_invalid_uploads(self, session: aiohttp.ClientSession):
        """Test invalid file uploads"""
        # Test unsupported file type
        try:
            temp_file = tempfile.NamedTemporaryFile(suffix='.xyz', delete=False)
            temp_file.write(b"Invalid file content")
            temp_file.close()
            
            result = await self.test_single_upload(session, temp_file.name, "invalid_extension")
            result["test_type"] = "invalid_extension"
            self.test_results["error_tests"].append(result)
            
            os.unlink(temp_file.name)
        except Exception as e:
            logger.error(f"Error testing invalid uploads: {e}")
    
    async def test_api_endpoints(self, session: aiohttp.ClientSession):
        """Test API endpoint availability"""
        endpoints = [
            "/",
            "/formats"
        ]
        
        for endpoint in endpoints:
            try:
                async with session.get(f"{self.api_base}{endpoint}") as response:
                    result = {
                        "endpoint": endpoint,
                        "status_code": response.status,
                        "success": response.status == 200,
                        "response_time": 0
                    }
                    
                    if response.status == 200:
                        try:
                            result["response_data"] = await response.json()
                        except:
                            result["response_data"] = await response.text()
                    
                    self.test_results["error_tests"].append(result)
                    logger.info(f"Endpoint {endpoint}: {response.status}")
                    
            except Exception as e:
                logger.error(f"Error testing endpoint {endpoint}: {e}")
    
    async def test_conversion_flow(self, session: aiohttp.ClientSession):
        """Test the full conversion flow"""
        logger.info("\n🔄 Testing conversion flow...")
        
        # First upload a file
        test_files = await self.create_test_files()
        upload_result = await self.test_single_upload(session, test_files['small_txt'], "conversion_test")
        
        if upload_result["success"]:
            file_id = upload_result["response_data"]["file_id"]
            
            # Test conversion
            conversion_data = {
                "file_id": file_id,
                "target_format": "html"
            }
            
            try:
                async with session.post(f"{self.api_base}/convert", json=conversion_data) as response:
                    result = {
                        "conversion_test": True,
                        "status_code": response.status,
                        "success": response.status == 200
                    }
                    
                    if response.status == 200:
                        result["response_data"] = await response.json()
                        logger.info("✅ Conversion test successful")
                    else:
                        result["error"] = await response.text()
                        logger.error(f"❌ Conversion test failed: {result['error']}")
                    
                    self.test_results["conversion_tests"].append(result)
                    
            except Exception as e:
                logger.error(f"Conversion test error: {e}")
    
    async def test_pdf_merge(self, session: aiohttp.ClientSession):
        """Test PDF merge functionality"""
        logger.info("\n🔗 Testing PDF Merge...")
        
        # Upload test PDFs first
        test_files = await self.create_test_files()
        
        # Upload merge test files
        merge_file_ids = []
        for file_key in ['merge_pdf_1', 'merge_pdf_2']:
            upload_result = await self.test_single_upload(session, test_files[file_key], file_key)
            if upload_result["success"]:
                merge_file_ids.append(upload_result["response_data"]["file_id"])
        
        if len(merge_file_ids) < 2:
            logger.error("❌ Failed to upload files for merge test")
            return
        
        # Test merge operation
        merge_data = {"file_ids": merge_file_ids}
        
        try:
            async with session.post(f"{self.api_base}/pdf/merge", json=merge_data) as response:
                result = {
                    "operation": "pdf_merge",
                    "status_code": response.status,
                    "success": response.status == 200,
                    "input_files": len(merge_file_ids)
                }
                
                if response.status == 200:
                    response_json = await response.json()
                    result["response_data"] = response_json
                    result["merge_id"] = response_json.get("merge_id")
                    logger.info(f"✅ PDF Merge successful: {response_json.get('output_file')}")
                    
                    # Test download of merged file
                    if "merge_id" in result:
                        download_result = await self.test_download(session, result["merge_id"])
                        result["download_test"] = download_result
                else:
                    result["error"] = await response.text()
                    logger.error(f"❌ PDF Merge failed: {result['error']}")
                
                self.test_results["pdf_toolkit_tests"].append(result)
                
        except Exception as e:
            logger.error(f"PDF Merge test error: {e}")
    
    async def test_pdf_split_pages(self, session: aiohttp.ClientSession):
        """Test PDF split into individual pages"""
        logger.info("\n✂️ Testing PDF Split (Individual Pages)...")
        
        # Use multi-page PDF
        if 'multi_page_pdf' not in self.uploaded_files:
            test_files = await self.create_test_files()
            upload_result = await self.test_single_upload(session, test_files['multi_page_pdf'], 'multi_page_pdf')
            if not upload_result["success"]:
                logger.error("❌ Failed to upload multi-page PDF for split test")
                return
            file_id = upload_result["response_data"]["file_id"]
        else:
            file_id = self.uploaded_files['multi_page_pdf']
        
        # Test split operation
        split_data = {
            "file_id": file_id,
            "split_type": "pages"
        }
        
        try:
            async with session.post(f"{self.api_base}/pdf/split", json=split_data) as response:
                result = {
                    "operation": "pdf_split_pages",
                    "status_code": response.status,
                    "success": response.status == 200,
                    "input_file_id": file_id
                }
                
                if response.status == 200:
                    response_json = await response.json()
                    result["response_data"] = response_json
                    result["split_files_count"] = len(response_json.get("split_files", []))
                    logger.info(f"✅ PDF Split successful: {result['split_files_count']} pages created")
                    
                    # Test download of first split file
                    split_files = response_json.get("split_files", [])
                    if split_files:
                        first_file_id = split_files[0]["file_id"]
                        download_result = await self.test_download(session, first_file_id)
                        result["download_test"] = download_result
                else:
                    result["error"] = await response.text()
                    logger.error(f"❌ PDF Split failed: {result['error']}")
                
                self.test_results["pdf_toolkit_tests"].append(result)
                
        except Exception as e:
            logger.error(f"PDF Split test error: {e}")
    
    async def test_pdf_split_ranges(self, session: aiohttp.ClientSession):
        """Test PDF split by page ranges"""
        logger.info("\n📄 Testing PDF Split (Page Ranges)...")
        
        # Use multi-page PDF
        if 'multi_page_pdf' not in self.uploaded_files:
            test_files = await self.create_test_files()
            upload_result = await self.test_single_upload(session, test_files['multi_page_pdf'], 'multi_page_pdf')
            if not upload_result["success"]:
                logger.error("❌ Failed to upload multi-page PDF for range split test")
                return
            file_id = upload_result["response_data"]["file_id"]
        else:
            file_id = self.uploaded_files['multi_page_pdf']
        
        # Test split by ranges
        split_data = {
            "file_id": file_id,
            "split_type": "ranges",
            "page_ranges": [
                {"start": 1, "end": 2},
                {"start": 3, "end": 3}
            ]
        }
        
        try:
            async with session.post(f"{self.api_base}/pdf/split", json=split_data) as response:
                result = {
                    "operation": "pdf_split_ranges",
                    "status_code": response.status,
                    "success": response.status == 200,
                    "input_file_id": file_id,
                    "page_ranges": split_data["page_ranges"]
                }
                
                if response.status == 200:
                    response_json = await response.json()
                    result["response_data"] = response_json
                    result["split_files_count"] = len(response_json.get("split_files", []))
                    logger.info(f"✅ PDF Range Split successful: {result['split_files_count']} range files created")
                    
                    # Test download of first range file
                    split_files = response_json.get("split_files", [])
                    if split_files:
                        first_file_id = split_files[0]["file_id"]
                        download_result = await self.test_download(session, first_file_id)
                        result["download_test"] = download_result
                else:
                    result["error"] = await response.text()
                    logger.error(f"❌ PDF Range Split failed: {result['error']}")
                
                self.test_results["pdf_toolkit_tests"].append(result)
                
        except Exception as e:
            logger.error(f"PDF Range Split test error: {e}")
    
    async def test_pdf_encrypt(self, session: aiohttp.ClientSession):
        """Test PDF encryption"""
        logger.info("\n🔒 Testing PDF Encrypt...")
        
        # Use single page PDF
        if 'single_page_pdf' not in self.uploaded_files:
            test_files = await self.create_test_files()
            upload_result = await self.test_single_upload(session, test_files['single_page_pdf'], 'single_page_pdf')
            if not upload_result["success"]:
                logger.error("❌ Failed to upload PDF for encrypt test")
                return
            file_id = upload_result["response_data"]["file_id"]
        else:
            file_id = self.uploaded_files['single_page_pdf']
        
        # Test encryption
        encrypt_data = {
            "file_id": file_id,
            "password": "SecurePass123",
            "permissions": {
                "print": True,
                "copy": False,
                "modify": False
            }
        }
        
        try:
            async with session.post(f"{self.api_base}/pdf/encrypt", json=encrypt_data) as response:
                result = {
                    "operation": "pdf_encrypt",
                    "status_code": response.status,
                    "success": response.status == 200,
                    "input_file_id": file_id,
                    "password_used": "SecurePass123"
                }
                
                if response.status == 200:
                    response_json = await response.json()
                    result["response_data"] = response_json
                    result["encrypt_id"] = response_json.get("encrypt_id")
                    logger.info(f"✅ PDF Encrypt successful: {response_json.get('encrypted_file')}")
                    
                    # Test download of encrypted file
                    if "encrypt_id" in result:
                        download_result = await self.test_download(session, result["encrypt_id"])
                        result["download_test"] = download_result
                else:
                    result["error"] = await response.text()
                    logger.error(f"❌ PDF Encrypt failed: {result['error']}")
                
                self.test_results["pdf_toolkit_tests"].append(result)
                
        except Exception as e:
            logger.error(f"PDF Encrypt test error: {e}")
    
    async def test_pdf_esign(self, session: aiohttp.ClientSession):
        """Test PDF electronic signature"""
        logger.info("\n✍️ Testing PDF eSign...")
        
        # Use single page PDF
        if 'single_page_pdf' not in self.uploaded_files:
            test_files = await self.create_test_files()
            upload_result = await self.test_single_upload(session, test_files['single_page_pdf'], 'single_page_pdf')
            if not upload_result["success"]:
                logger.error("❌ Failed to upload PDF for eSign test")
                return
            file_id = upload_result["response_data"]["file_id"]
        else:
            file_id = self.uploaded_files['single_page_pdf']
        
        # Test eSign
        esign_data = {
            "file_id": file_id,
            "signer_info": {
                "name": "John Doe",
                "email": "john@example.com",
                "date": "2025-12-09"
            },
            "position": {
                "page": 1,
                "x": 100,
                "y": 100
            }
        }
        
        try:
            async with session.post(f"{self.api_base}/pdf/esign", json=esign_data) as response:
                result = {
                    "operation": "pdf_esign",
                    "status_code": response.status,
                    "success": response.status == 200,
                    "input_file_id": file_id,
                    "signer": esign_data["signer_info"]["name"]
                }
                
                if response.status == 200:
                    response_json = await response.json()
                    result["response_data"] = response_json
                    result["esign_id"] = response_json.get("esign_id")
                    logger.info(f"✅ PDF eSign successful: {response_json.get('signed_file')}")
                    
                    # Test download of signed file
                    if "esign_id" in result:
                        download_result = await self.test_download(session, result["esign_id"])
                        result["download_test"] = download_result
                else:
                    result["error"] = await response.text()
                    logger.error(f"❌ PDF eSign failed: {result['error']}")
                
                self.test_results["pdf_toolkit_tests"].append(result)
                
        except Exception as e:
            logger.error(f"PDF eSign test error: {e}")
    
    async def test_download(self, session: aiohttp.ClientSession, file_id: str):
        """Test file download"""
        try:
            async with session.get(f"{self.api_base}/download/{file_id}") as response:
                if response.status == 200:
                    content = await response.read()
                    return {
                        "success": True,
                        "file_size": len(content),
                        "content_type": response.headers.get('content-type', 'unknown')
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP {response.status}: {await response.text()}"
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def test_pdf_toolkit_comprehensive(self, session: aiohttp.ClientSession):
        """Run comprehensive PDF Toolkit tests"""
        logger.info("\n🔧 STARTING PDF TOOLKIT COMPREHENSIVE TESTING...")
        
        # Test all PDF operations
        await self.test_pdf_merge(session)
        await self.test_pdf_split_pages(session)
        await self.test_pdf_split_ranges(session)
        await self.test_pdf_encrypt(session)
        await self.test_pdf_esign(session)
        
        # Analyze PDF Toolkit results
        pdf_tests = self.test_results["pdf_toolkit_tests"]
        successful_tests = sum(1 for test in pdf_tests if test["success"])
        total_tests = len(pdf_tests)
        
        logger.info(f"\n📊 PDF Toolkit Results: {successful_tests}/{total_tests} operations successful")
        
        # Log failed operations
        failed_tests = [test for test in pdf_tests if not test["success"]]
        if failed_tests:
            logger.info("❌ Failed PDF Operations:")
            for test in failed_tests:
                logger.info(f"  - {test['operation']}: {test.get('error', 'Unknown error')}")
    
    def analyze_results(self):
        """Analyze test results and identify issues"""
        logger.info("\n📊 ANALYZING TEST RESULTS...")
        
        # Upload success rates
        upload_tests = self.test_results["upload_tests"]
        total_uploads = len(upload_tests)
        successful_uploads = sum(1 for test in upload_tests if test["success"])
        
        logger.info(f"Upload Success Rate: {successful_uploads}/{total_uploads} ({successful_uploads/total_uploads*100:.1f}%)")
        
        # PDF specific analysis
        pdf_tests = [test for test in upload_tests if 'pdf' in test["file_type"]]
        pdf_success = sum(1 for test in pdf_tests if test["success"])
        if pdf_tests:
            logger.info(f"PDF Upload Success Rate: {pdf_success}/{len(pdf_tests)} ({pdf_success/len(pdf_tests)*100:.1f}%)")
        
        # TXT specific analysis  
        txt_tests = [test for test in upload_tests if 'txt' in test["file_type"]]
        txt_success = sum(1 for test in txt_tests if test["success"])
        if txt_tests:
            logger.info(f"TXT Upload Success Rate: {txt_success}/{len(txt_tests)} ({txt_success/len(txt_tests)*100:.1f}%)")
        
        # Rapid upload analysis
        rapid_tests = self.test_results["performance_tests"]
        if rapid_tests:
            rapid_success = sum(1 for test in rapid_tests if test.get("success", False))
            logger.info(f"Rapid Upload Success Rate: {rapid_success}/{len(rapid_tests)} ({rapid_success/len(rapid_tests)*100:.1f}%)")
        
        # Error analysis
        failed_tests = [test for test in upload_tests if not test["success"]]
        if failed_tests:
            logger.info(f"\n❌ FAILED UPLOADS ({len(failed_tests)}):")
            for test in failed_tests:
                logger.info(f"  - {test['file_type']}: {test.get('error', 'Unknown error')}")
        
        # Performance analysis
        response_times = [test["response_time"] for test in upload_tests if test["response_time"] > 0]
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            max_time = max(response_times)
            logger.info(f"\nPerformance: Avg {avg_time:.2f}s, Max {max_time:.2f}s")
        
        # PDF Toolkit analysis
        pdf_toolkit_tests = self.test_results["pdf_toolkit_tests"]
        pdf_toolkit_success = sum(1 for test in pdf_toolkit_tests if test["success"])
        if pdf_toolkit_tests:
            logger.info(f"PDF Toolkit Success Rate: {pdf_toolkit_success}/{len(pdf_toolkit_tests)} ({pdf_toolkit_success/len(pdf_toolkit_tests)*100:.1f}%)")
        
        return {
            "total_tests": total_uploads,
            "successful_tests": successful_uploads,
            "success_rate": successful_uploads/total_uploads if total_uploads > 0 else 0,
            "pdf_success_rate": pdf_success/len(pdf_tests) if pdf_tests else 0,
            "txt_success_rate": txt_success/len(txt_tests) if txt_tests else 0,
            "pdf_toolkit_success_rate": pdf_toolkit_success/len(pdf_toolkit_tests) if pdf_toolkit_tests else 0,
            "failed_tests": failed_tests,
            "avg_response_time": sum(response_times)/len(response_times) if response_times else 0
        }
    
    async def run_all_tests(self):
        """Run all backend tests"""
        logger.info(f"🎯 Testing backend at: {self.backend_url}")
        
        try:
            # Test file uploads
            await self.test_file_upload_endpoint()
            
            # Test conversion flow and PDF Toolkit
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=120)) as session:
                await self.test_conversion_flow(session)
                await self.test_pdf_toolkit_comprehensive(session)
            
            # Analyze results
            analysis = self.analyze_results()
            
            # Save detailed results
            results_file = "/app/backend_test_results.json"
            with open(results_file, 'w') as f:
                json.dump({
                    "analysis": analysis,
                    "detailed_results": self.test_results,
                    "backend_url": self.backend_url,
                    "timestamp": time.time()
                }, f, indent=2, default=str)
            
            logger.info(f"📄 Detailed results saved to: {results_file}")
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Test execution failed: {e}")
            return {"error": str(e)}

async def main():
    """Main test execution"""
    tester = BackendTester()
    results = await tester.run_all_tests()
    
    print("\n" + "="*60)
    print("🏁 BACKEND TESTING COMPLETED")
    print("="*60)
    
    if "error" not in results:
        print(f"📊 Overall Success Rate: {results['success_rate']*100:.1f}%")
        print(f"📄 PDF Success Rate: {results['pdf_success_rate']*100:.1f}%") 
        print(f"📝 TXT Success Rate: {results['txt_success_rate']*100:.1f}%")
        print(f"🔧 PDF Toolkit Success Rate: {results['pdf_toolkit_success_rate']*100:.1f}%")
        print(f"⏱️  Average Response Time: {results['avg_response_time']:.2f}s")
        
        if results['success_rate'] < 0.8:
            print("⚠️  WARNING: Low success rate detected!")
        if results['pdf_success_rate'] < 0.5:
            print("🚨 CRITICAL: PDF upload success rate is very low!")
        if results['pdf_toolkit_success_rate'] < 0.8:
            print("🚨 CRITICAL: PDF Toolkit operations failing!")
    else:
        print(f"❌ Testing failed: {results['error']}")

if __name__ == "__main__":
    asyncio.run(main())