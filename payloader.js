document.write(`
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
background:#000;border:3px solid #0f0;padding:20px;z-index:999999;
width:450px;font-family:monospace;color:#0f0;">
    
    <h2>📁 SIMPLE FILE UPLOADER</h2>
    
    <!-- Target URL -->
    <input id="uploadUrl" placeholder="Full URL (https://example.com/upload)" 
           style="width:100%;margin:5px 0;padding:8px;background:#333;color:#0f0;border:1px solid #0f0;">
    
    <!-- Field name -->
    <input id="fieldName" placeholder="Field name (usually 'file')" value="file" 
           style="width:100%;margin:5px 0;padding:8px;background:#333;color:#0f0;border:1px solid #0f0;">
    
    <!-- File picker -->
    <input type="file" id="localFile" 
           style="width:100%;margin:10px 0;padding:8px;background:#333;color:#0f0;border:1px solid #0f0;">
    
    <!-- Upload button -->
    <button onclick="uploadFile()" 
            style="background:#0f0;color:#000;padding:12px;width:100%;font-size:16px;font-weight:bold;cursor:pointer;">
        🚀 UPLOAD FILE
    </button>
    
    <!-- Status -->
    <div id="status" style="background:#111;padding:10px;margin-top:10px;min-height:50px;font-size:12px;"></div>
</div>
`);

window.uploadFile = function() {
    const url = document.getElementById('uploadUrl').value;
    const fieldName = document.getElementById('fieldName').value;
    const fileInput = document.getElementById('localFile');
    
    // Validation
    if(!url) {
        alert('Enter the upload URL');
        return;
    }
    if(!fileInput.files[0]) {
        alert('Select a file first');
        return;
    }
    
    const file = fileInput.files[0];
    const status = document.getElementById('status');
    
    status.innerHTML = `📤 Uploading: ${file.name}<br>`;
    status.innerHTML += `📦 Size: ${(file.size/1024).toFixed(2)} KB<br>`;
    status.innerHTML += `🎯 Target: ${url}<br><br>`;
    
    // METHOD 1: Try fetch with CORS (might fail, that's OK)
    status.innerHTML += `Trying fetch upload...<br>`;
    
    const formData = new FormData();
    formData.append(fieldName, file);
    
    fetch(url, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit'
    })
    .then(response => {
        status.innerHTML += `✅ Fetch sent! Status: ${response.status}<br>`;
        return response.text();
    })
    .then(text => {
        status.innerHTML += `📄 Response: ${text.substring(0, 100)}...<br>`;
    })
    .catch(error => {
        status.innerHTML += `❌ Fetch error: ${error.message}<br>`;
        status.innerHTML += `🔄 Trying form method...<br><br>`;
        
        // METHOD 2: Fallback to form (this WILL work cross-origin)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        form.enctype = 'multipart/form-data';
        form.target = 'uploadTarget';
        
        // Create iframe to catch response
        const iframe = document.createElement('iframe');
        iframe.name = 'uploadTarget';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Handle iframe load
        iframe.onload = function() {
            try {
                const response = iframe.contentDocument.body.innerHTML;
                status.innerHTML += `✅ Form submitted!<br>`;
                status.innerHTML += `📄 Server response: ${response.substring(0, 200)}...<br>`;
            } catch(e) {
                status.innerHTML += `✅ Form submitted (response from different domain)<br>`;
            }
            
            // Clean up
            setTimeout(() => {
                if(document.body.contains(iframe)) document.body.removeChild(iframe);
            }, 2000);
        };
        
        // Add file input to form
        const fileClone = fileInput.cloneNode(true);
        fileClone.name = fieldName;
        fileClone.style.display = 'none';
        form.appendChild(fileClone);
        
        // Submit
        document.body.appendChild(form);
        setTimeout(() => {
            form.submit();
            status.innerHTML += `⏳ Form submitted, waiting for response...<br>`;
            
            // Remove form
            setTimeout(() => {
                if(document.body.contains(form)) document.body.removeChild(form);
            }, 100);
        }, 100);
    });
};

// Auto-fill if forms exist on page
setTimeout(() => {
    const form = document.querySelector('form[enctype="multipart/form-data"]');
    if(form) {
        document.getElementById('uploadUrl').value = form.action || window.location.href;
        const fileInput = form.querySelector('input[type="file"]');
        if(fileInput) {
            document.getElementById('fieldName').value = fileInput.name || 'file';
        }
        document.getElementById('status').innerHTML = '✅ Found upload form on page!<br>URL and field name auto-filled.';
    }
}, 1000);
