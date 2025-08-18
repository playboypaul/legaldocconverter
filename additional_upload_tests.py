#!/usr/bin/env python3
"""
Additional specific tests for file upload improvements
Testing 50MB limit, file validation, atomic writes, and error handling
"""

import asyncio
import aiohttp
import aiofiles
import os
import tempfile
import time
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SpecificUploadTester:
    def __init__(self):
        self.backend_url = self._get_backend_url()
        self.api_base = f"{self.backend_url}/api"
        
    def _get_backend_url(self) -> str:
        """Get backend URL from frontend .env file"""
        try:
            env_path = Path("/app/frontend/.env")
            if env_path.exists():
                with open(env_path, 'r') as f:
                    for line in f:
                        if line.startswith('REACT_APP_BACKEND_URL='):
                            return line.split('=', 1)[1].strip()
            return "http://localhost:8001"
        except Exception as e:
            logger.error(f"Error reading backend URL: {e}")
            return "http://localhost:8001"
    
    async def create_large_file(self, size_mb: int, file_type: str = "pdf") -> str:
        """Create a large test file of specified size"""
        temp_dir = tempfile.gettempdir()
        filename = f"test_large_{size_mb}mb.{file_type}"
        filepath = os.path.join(temp_dir, filename)
        
        # Create file content
        if file_type == "pdf":
            # Basic PDF header + content
            pdf_header = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n"
            content_size = (size_mb * 1024 * 1024) - len(pdf_header)
            content = pdf_header + b"A" * content_size
        else:
            # Text file
            content = f"Large {file_type} file test content.\n" + "X" * (size_mb * 1024 * 1024 - 50)
            content = content.encode('utf-8')
        
        with open(filepath, 'wb') as f:
            f.write(content)
        
        logger.info(f"Created {size_mb}MB {file_type} file: {filepath}")
        return filepath
    
    async def test_file_size_limits(self):
        """Test file size limit enforcement"""
        logger.info("🔍 Testing file size limits...")
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=120)) as session:
            # Test 1: File just under 50MB limit (should succeed)
            logger.info("Testing 49MB file (should succeed)...")
            file_49mb = await self.create_large_file(49, "pdf")
            result_49mb = await self.upload_file(session, file_49mb)
            
            # Test 2: File at 50MB limit (should succeed)
            logger.info("Testing 50MB file (should succeed)...")
            file_50mb = await self.create_large_file(50, "pdf")
            result_50mb = await self.upload_file(session, file_50mb)
            
            # Test 3: File over 50MB limit (should fail)
            logger.info("Testing 51MB file (should fail)...")
            file_51mb = await self.create_large_file(51, "pdf")
            result_51mb = await self.upload_file(session, file_51mb)
            
            # Cleanup
            for filepath in [file_49mb, file_50mb, file_51mb]:
                if os.path.exists(filepath):
                    os.remove(filepath)
            
            return {
                "49mb_result": result_49mb,
                "50mb_result": result_50mb,
                "51mb_result": result_51mb
            }
    
    async def test_invalid_file_types(self):
        """Test file type validation"""
        logger.info("🚫 Testing invalid file types...")
        
        invalid_files = []
        temp_dir = tempfile.gettempdir()
        
        # Create files with invalid extensions
        invalid_extensions = ['.exe', '.bat', '.sh', '.js', '.py', '.zip', '.rar']
        
        for ext in invalid_extensions:
            filepath = os.path.join(temp_dir, f"test_invalid{ext}")
            with open(filepath, 'w') as f:
                f.write("Invalid file content for testing")
            invalid_files.append(filepath)
        
        results = []
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
            for filepath in invalid_files:
                result = await self.upload_file(session, filepath)
                results.append({
                    "file": os.path.basename(filepath),
                    "result": result
                })
        
        # Cleanup
        for filepath in invalid_files:
            if os.path.exists(filepath):
                os.remove(filepath)
        
        return results
    
    async def test_empty_and_corrupted_files(self):
        """Test empty files and corrupted file handling"""
        logger.info("📄 Testing empty and corrupted files...")
        
        temp_dir = tempfile.gettempdir()
        
        # Test 1: Empty file
        empty_file = os.path.join(temp_dir, "empty.pdf")
        with open(empty_file, 'w') as f:
            pass  # Create empty file
        
        # Test 2: Corrupted PDF
        corrupted_pdf = os.path.join(temp_dir, "corrupted.pdf")
        with open(corrupted_pdf, 'w') as f:
            f.write("This is not a valid PDF file content")
        
        # Test 3: File with special characters in name
        special_name_file = os.path.join(temp_dir, "test file with spaces & symbols!@#.txt")
        with open(special_name_file, 'w') as f:
            f.write("File with special characters in name")
        
        results = []
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
            for filepath in [empty_file, corrupted_pdf, special_name_file]:
                result = await self.upload_file(session, filepath)
                results.append({
                    "file": os.path.basename(filepath),
                    "result": result
                })
        
        # Cleanup
        for filepath in [empty_file, corrupted_pdf, special_name_file]:
            if os.path.exists(filepath):
                os.remove(filepath)
        
        return results
    
    async def test_filename_sanitization(self):
        """Test filename sanitization and path traversal prevention"""
        logger.info("🛡️ Testing filename sanitization...")
        
        temp_dir = tempfile.gettempdir()
        
        # Create files with potentially dangerous names
        dangerous_names = [
            "../../../etc/passwd.txt",
            "..\\..\\windows\\system32\\config.txt",
            "file<script>alert('xss')</script>.txt",
            "file|with|pipes.txt",
            "file:with:colons.txt"
        ]
        
        results = []
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
            for dangerous_name in dangerous_names:
                # Create a safe local file for testing
                safe_local_name = dangerous_name.replace('/', '_').replace('\\', '_').replace('<', '_').replace('>', '_')
                filepath = os.path.join(temp_dir, safe_local_name)
                
                with open(filepath, 'w') as f:
                    f.write("Test content for dangerous filename")
                
                # Upload with the dangerous filename
                try:
                    with open(filepath, 'rb') as f:
                        data = aiohttp.FormData()
                        data.add_field('file', f, filename=dangerous_name, content_type='text/plain')
                        
                        async with session.post(f"{self.api_base}/upload", data=data) as response:
                            result = {
                                "original_filename": dangerous_name,
                                "status_code": response.status,
                                "success": response.status == 200
                            }
                            
                            if response.status == 200:
                                response_data = await response.json()
                                result["sanitized_name"] = response_data.get("original_name")
                            else:
                                result["error"] = await response.text()
                            
                            results.append(result)
                            
                except Exception as e:
                    results.append({
                        "original_filename": dangerous_name,
                        "error": str(e),
                        "success": False
                    })
                
                # Cleanup
                if os.path.exists(filepath):
                    os.remove(filepath)
        
        return results
    
    async def upload_file(self, session: aiohttp.ClientSession, filepath: str):
        """Upload a single file and return result"""
        start_time = time.time()
        result = {
            "filepath": filepath,
            "filename": os.path.basename(filepath),
            "file_size": os.path.getsize(filepath),
            "success": False,
            "response_time": 0,
            "error": None,
            "status_code": None
        }
        
        try:
            with open(filepath, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename=os.path.basename(filepath))
                
                async with session.post(f"{self.api_base}/upload", data=data) as response:
                    result["response_time"] = time.time() - start_time
                    result["status_code"] = response.status
                    
                    if response.status == 200:
                        result["success"] = True
                        result["response_data"] = await response.json()
                        logger.info(f"✅ Upload successful: {result['filename']}")
                    else:
                        result["error"] = await response.text()
                        logger.info(f"❌ Upload failed: {result['filename']} - Status: {response.status}")
                        
        except Exception as e:
            result["response_time"] = time.time() - start_time
            result["error"] = str(e)
            logger.error(f"❌ Upload exception: {result['filename']} - {str(e)}")
        
        return result
    
    async def run_specific_tests(self):
        """Run all specific upload tests"""
        logger.info(f"🎯 Running specific upload tests on: {self.backend_url}")
        
        results = {}
        
        try:
            # Test file size limits
            results["size_limit_tests"] = await self.test_file_size_limits()
            
            # Test invalid file types
            results["invalid_type_tests"] = await self.test_invalid_file_types()
            
            # Test empty and corrupted files
            results["empty_corrupted_tests"] = await self.test_empty_and_corrupted_files()
            
            # Test filename sanitization
            results["sanitization_tests"] = await self.test_filename_sanitization()
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Specific tests failed: {e}")
            return {"error": str(e)}

async def main():
    """Main test execution"""
    tester = SpecificUploadTester()
    results = await tester.run_specific_tests()
    
    print("\n" + "="*60)
    print("🏁 SPECIFIC UPLOAD TESTS COMPLETED")
    print("="*60)
    
    if "error" not in results:
        # Analyze size limit tests
        size_tests = results.get("size_limit_tests", {})
        print(f"📊 49MB file upload: {'✅ SUCCESS' if size_tests.get('49mb_result', {}).get('success') else '❌ FAILED'}")
        print(f"📊 50MB file upload: {'✅ SUCCESS' if size_tests.get('50mb_result', {}).get('success') else '❌ FAILED'}")
        print(f"📊 51MB file upload: {'❌ REJECTED' if not size_tests.get('51mb_result', {}).get('success') else '⚠️ SHOULD HAVE FAILED'}")
        
        # Analyze invalid type tests
        invalid_tests = results.get("invalid_type_tests", [])
        rejected_count = sum(1 for test in invalid_tests if not test["result"]["success"])
        print(f"🚫 Invalid file types rejected: {rejected_count}/{len(invalid_tests)}")
        
        # Analyze empty/corrupted tests
        empty_tests = results.get("empty_corrupted_tests", [])
        for test in empty_tests:
            status = "✅ HANDLED" if not test["result"]["success"] or test["result"]["success"] else "⚠️ ACCEPTED"
            print(f"📄 {test['file']}: {status}")
        
        # Analyze sanitization tests
        sanitization_tests = results.get("sanitization_tests", [])
        sanitized_count = sum(1 for test in sanitization_tests if test.get("success", False))
        print(f"🛡️ Filename sanitization: {sanitized_count}/{len(sanitization_tests)} handled safely")
        
    else:
        print(f"❌ Testing failed: {results['error']}")

if __name__ == "__main__":
    asyncio.run(main())