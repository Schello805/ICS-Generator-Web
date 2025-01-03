// Mock für fetch API
global.fetch = jest.fn((path) => {
    let content = '';
    
    if (path.includes('header.html')) {
        content = '<nav class="navbar">Header Content</nav>';
    } else if (path.includes('footer.html')) {
        content = '<footer class="footer">Footer Content</footer>';
    }
    
    return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(content)
    });
});

// Mock für window.location
Object.defineProperty(window, 'location', {
    value: {
        pathname: '/'
    },
    writable: true
});

// Mock für Navigation
document.body.innerHTML = `
    <div id="header"></div>
    <div id="nav-generator"></div>
    <div id="footer"></div>
`; 