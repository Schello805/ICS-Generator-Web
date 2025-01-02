document.addEventListener('DOMContentLoaded', function() {
    // Header laden
    fetch('components/header.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('header').innerHTML = html;
            // Aktiven Navigationspunkt setzen
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const navId = {
                'index.html': 'nav-home',
                'generator.html': 'nav-generator',
                'validator.html': 'nav-validator'
            }[currentPage];
            if (navId) {
                document.getElementById(navId).classList.add('active');
            }
        })
        .catch(error => console.error('Error loading header:', error));

    // Footer laden
    fetch('components/footer.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('footer').innerHTML = html;
        })
        .catch(error => console.error('Error loading footer:', error));
}); 