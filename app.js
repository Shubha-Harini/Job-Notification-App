const routes = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/settings': 'Settings',
  '/saved': 'Saved',
  '/digest': 'Digest',
  '/proof': 'Proof'
};

const routerView = document.getElementById('router-view');
const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('mobile-nav');

function renderPage(pathname) {
  // Update active links
  navLinks.forEach(link => {
    if (link.getAttribute('href') === pathname) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Render content
  const title = routes[pathname];
  if (title) {
    routerView.innerHTML = `
      <header class="context-header">
        <h1>${title}</h1>
        <p class="subtext">This section will be built in the next step.</p>
      </header>
    `;
  } else {
    routerView.innerHTML = `
      <header class="context-header">
        <h1>Page Not Found</h1>
        <p class="subtext">The page you are looking for does not exist.</p>
      </header>
    `;
  }
}

function navigateTo(url) {
  if (window.location.pathname === url) {
    return;
  }
  window.history.pushState({}, '', url);
  renderPage(url);
}

document.body.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('/')) {
    e.preventDefault();
    const url = link.getAttribute('href');
    navigateTo(url);
    if (mobileNav.classList.contains('open')) {
      mobileNav.classList.remove('open');
    }
  }
});

window.addEventListener('popstate', () => {
  renderPage(window.location.pathname);
});

mobileMenuBtn.addEventListener('click', () => {
  mobileNav.classList.toggle('open');
});

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  // Handle GitHub Pages or local file issues by falling back or matching correctly.
  let currentPath = window.location.pathname;

  // If we're opening simply file://.../index.html, map to /
  if (currentPath.endsWith('.html')) {
    currentPath = '/';
  } else if (!routes[currentPath]) {
    // If route is missing, it might be correct (404) or a nested path. 
    // We'll let it render as 404 or fall back appropriately.
  }

  renderPage(currentPath);
});
