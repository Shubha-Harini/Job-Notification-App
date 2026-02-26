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
  let contentHtml = '';

  if (pathname === '/') {
    contentHtml = `
      <div class="landing-page" style="padding-top: var(--space-64);">
        <h1 style="font-size: 48px; max-width: 600px; margin-bottom: var(--space-24);">Stop Missing The Right Jobs.</h1>
        <p class="subtext" style="font-size: 20px; color: rgba(17, 17, 17, 0.7); margin-bottom: var(--space-40);">Precision-matched job discovery delivered daily at 9AM.</p>
        <button class="btn btn-primary cta-btn" style="font-size: 18px; padding: 16px var(--space-24);" onclick="navigateTo('/settings')">Start Tracking</button>
      </div>
    `;
  } else if (pathname === '/dashboard') {
    contentHtml = `
      <header class="context-header">
        <h1>Dashboard</h1>
      </header>
      <div class="state-empty" style="border: none; background: #fff; padding: var(--space-64); text-align: left; max-width: 720px;">
        <h3 style="font-size: 24px;">No jobs yet.</h3>
        <p style="margin: 0; color: rgba(17,17,17,0.7);">In the next step, you will load a realistic dataset.</p>
      </div>
    `;
  } else if (pathname === '/settings') {
    contentHtml = `
      <header class="context-header">
        <h1>Settings</h1>
      </header>
      <div class="card" style="max-width: 720px;">
        <h2 style="font-size: 20px; border-bottom: 1px solid rgba(17,17,17,0.1); padding-bottom: var(--space-16); margin-bottom: var(--space-24);">Notification Preferences</h2>
        
        <div class="input-group">
          <label class="input-label" for="role-keywords">Role keywords</label>
          <input type="text" id="role-keywords" class="input-field" placeholder="e.g. Frontend, React, Senior" />
        </div>
        
        <div class="input-group">
          <label class="input-label" for="locations">Preferred locations</label>
          <input type="text" id="locations" class="input-field" placeholder="e.g. New York, Remote" />
        </div>
        
        <div class="input-group">
          <label class="input-label" for="mode">Mode</label>
          <select id="mode" class="input-field" style="appearance: none;">
            <option>Remote</option>
            <option>Hybrid</option>
            <option>Onsite</option>
          </select>
        </div>

        <div class="input-group" style="margin-bottom: var(--space-40);">
          <label class="input-label" for="experience">Experience level</label>
          <select id="experience" class="input-field" style="appearance: none;">
            <option>Entry</option>
            <option>Mid-Level</option>
            <option>Senior</option>
            <option>Staff/Principal</option>
          </select>
        </div>

        <button class="btn btn-primary">Save Preferences</button>
      </div>
    `;
  } else if (pathname === '/saved') {
    contentHtml = `
      <header class="context-header">
        <h1>Saved Jobs</h1>
      </header>
      <div class="state-empty" style="border: none; background: #fff; padding: var(--space-64); text-align: left; max-width: 720px;">
        <h3 style="font-size: 24px;">No saved jobs</h3>
        <p style="margin: 0; color: rgba(17,17,17,0.7);">Jobs you bookmark from your dashboard will appear here to easily review later.</p>
      </div>
    `;
  } else if (pathname === '/digest') {
    contentHtml = `
      <header class="context-header">
        <h1>Daily Digest</h1>
      </header>
      <div class="state-empty" style="border: none; background: #fff; padding: var(--space-64); text-align: left; max-width: 720px;">
        <h3 style="font-size: 24px;">Your digest is empty</h3>
        <p style="margin: 0; color: rgba(17,17,17,0.7);">This section will hold a compiled daily summary of the absolute best matches.</p>
      </div>
    `;
  } else if (pathname === '/proof') {
    contentHtml = `
      <header class="context-header">
        <h1>Proof Artifacts</h1>
        <p class="subtext">Collection of testing and validation artifacts.</p>
      </header>
    `;
  } else {
    contentHtml = `
      <header class="context-header">
        <h1>Page Not Found</h1>
        <p class="subtext">The page you are looking for does not exist.</p>
      </header>
    `;
  }

  routerView.innerHTML = contentHtml;
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
