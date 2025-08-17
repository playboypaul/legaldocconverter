#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Legal Document Converter
Testing file upload API endpoint thoroughly to identify PDF upload failures
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
            "error_tests": []
        }
        
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
        """Create various test files for upload testing"""
        test_files = {}
        
        # Create small PDF (mock - will be treated as binary)
        small_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Small PDF Test) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000206 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n299\n%%EOF"
        
        # Create medium PDF content (larger mock)
        medium_pdf_content = small_pdf_content + b"\n" + b"A" * 1024 * 500  # ~500KB
        
        # Create large PDF content
        large_pdf_content = small_pdf_content + b"\n" + b"B" * 1024 * 1024 * 2  # ~2MB
        
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
        
        # Write binary files
        with open(test_files['small_pdf'], 'wb') as f:
            f.write(small_pdf_content)
        with open(test_files['medium_pdf'], 'wb') as f:
            f.write(medium_pdf_content)
        with open(test_files['large_pdf'], 'wb') as f:
            f.write(large_pdf_content)
            
        # Write text files
        with open(test_files['small_txt'], 'w') as f:
            f.write(small_txt)
        with open(test_files['medium_txt'], 'w') as f:
            f.write(medium_txt)
        with open(test_files['large_txt'], 'w') as f:
            f.write(large_txt)
        with open(test_files['docx_file'], 'w') as f:
            f.write(docx_content)
            
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
        
        return {
            "total_tests": total_uploads,
            "successful_tests": successful_uploads,
            "success_rate": successful_uploads/total_uploads if total_uploads > 0 else 0,
            "pdf_success_rate": pdf_success/len(pdf_tests) if pdf_tests else 0,
            "txt_success_rate": txt_success/len(txt_tests) if txt_tests else 0,
            "failed_tests": failed_tests,
            "avg_response_time": sum(response_times)/len(response_times) if response_times else 0
        }
    
    async def run_all_tests(self):
        """Run all backend tests"""
        logger.info(f"🎯 Testing backend at: {self.backend_url}")
        
        try:
            # Test file uploads
            await self.test_file_upload_endpoint()
            
            # Test conversion flow
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
                await self.test_conversion_flow(session)
            
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
        print(f"⏱️  Average Response Time: {results['avg_response_time']:.2f}s")
        
        if results['success_rate'] < 0.8:
            print("⚠️  WARNING: Low success rate detected!")
        if results['pdf_success_rate'] < 0.5:
            print("🚨 CRITICAL: PDF upload success rate is very low!")
    else:
        print(f"❌ Testing failed: {results['error']}")

if __name__ == "__main__":
    asyncio.run(main())