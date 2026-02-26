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

let savedJobIds = JSON.parse(localStorage.getItem('savedJobs') || '[]');

function toggleSaveJob(id, btnElement) {
  const index = savedJobIds.indexOf(id);
  if (index > -1) {
    savedJobIds.splice(index, 1);
    btnElement.innerText = "Save";
  } else {
    savedJobIds.push(id);
    btnElement.innerText = "Saved";
  }
  localStorage.setItem('savedJobs', JSON.stringify(savedJobIds));

  if (window.location.pathname === '/saved') {
    initSaved(); // re-render saved list immediately
  }
}

function viewJob(id) {
  const job = window.jobsData.find(j => j.id === id);
  if (!job) return;

  let modal = document.getElementById('job-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'job-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  }

  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" onclick="document.getElementById('job-modal').classList.remove('open')">&times;</button>
      <h2 style="font-size: 24px; margin-bottom: 8px;">${job.title}</h2>
      <div style="font-size: 18px; color: rgba(17,17,17,0.7); margin-bottom: 24px;">${job.company}</div>
      <div class="job-badges" style="margin-bottom: 24px;">
        <span class="badge">${job.location} • ${job.mode}</span>
        <span class="badge">${job.experience}</span>
        <span class="badge">${job.salaryRange}</span>
        <span class="badge badge-source">${job.source}</span>
      </div>
      <h3 style="font-size: 18px; margin-bottom: 16px;">Skills Needed</h3>
      <div class="job-badges" style="margin-bottom: 24px;">
        ${job.skills.map(skill => `<span class="badge" style="background:#f0f0f0;">${skill}</span>`).join('')}
      </div>
      <h3 style="font-size: 18px; margin-bottom: 16px;">Description</h3>
      <p style="white-space: pre-wrap;">${job.description}</p>
      <div style="margin-top: 32px; display:flex; gap: 16px;">
        <button class="btn btn-primary" onclick="window.open('${job.applyUrl}', '_blank'); document.getElementById('job-modal').classList.remove('open');">Apply Now</button>
      </div>
    </div>
  `;

  setTimeout(() => {
    modal.classList.add('open');
  }, 10);
}

// Ensure globally accessible functions
window.toggleSaveJob = toggleSaveJob;
window.viewJob = viewJob;

function createJobCardHTML(job) {
  const isSaved = savedJobIds.includes(job.id);
  return `
    <div class="job-card">
      <div class="job-header">
        <div>
          <h3 class="job-title">${job.title}</h3>
          <div class="job-company">${job.company}</div>
        </div>
        <div style="font-size: 14px; color: rgba(17,17,17,0.5);">${job.postedDaysAgo === 0 ? 'Today' : `${job.postedDaysAgo} days ago`}</div>
      </div>
      <div class="job-badges">
        <span class="badge">${job.location} • ${job.mode}</span>
        <span class="badge">${job.experience}</span>
        <span class="badge">${job.salaryRange}</span>
        <span class="badge badge-source">${job.source}</span>
      </div>
      <div class="job-actions">
        <button class="btn btn-primary" onclick="window.open('${job.applyUrl}', '_blank')">Apply</button>
        <button class="btn btn-secondary" onclick="viewJob('${job.id}')">View</button>
        <button class="btn btn-secondary" onclick="toggleSaveJob('${job.id}', this)">${isSaved ? 'Saved' : 'Save'}</button>
      </div>
    </div>
  `;
}

function initDashboard() {
  const jobListEl = document.getElementById('job-list');
  const searchEl = document.getElementById('search-keyword');
  const flocEl = document.getElementById('filter-location');
  const fmodeEl = document.getElementById('filter-mode');
  const fexpEl = document.getElementById('filter-exp');
  const fsourceEl = document.getElementById('filter-source');

  function renderFiltered() {
    const term = searchEl.value.toLowerCase();
    const loc = flocEl.value;
    const mode = fmodeEl.value;
    const exp = fexpEl.value;
    const src = fsourceEl.value;

    const filtered = window.jobsData.filter(job => {
      const matchSearch = job.title.toLowerCase().includes(term) || job.company.toLowerCase().includes(term);
      const matchLoc = !loc || job.location === loc || (loc === 'Remote' && job.mode === 'Remote');
      const matchMode = !mode || job.mode === mode;
      const matchExp = !exp || job.experience === exp;
      const matchSrc = !src || job.source === src;
      return matchSearch && matchLoc && matchMode && matchExp && matchSrc;
    });

    // Default sort is Latest
    const sorted = filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);

    if (sorted.length === 0) {
      jobListEl.innerHTML = `
        <div class="state-empty" style="border: none; background: #fff; padding: var(--space-64); text-align: left; max-width: 720px;">
          <h3 style="font-size: 24px;">No jobs match your search.</h3>
          <p style="margin: 0; color: rgba(17,17,17,0.7);">Try removing some filters or varying your keywords.</p>
        </div>
      `;
    } else {
      jobListEl.innerHTML = sorted.map(createJobCardHTML).join('');
    }
  }

  searchEl.addEventListener('input', renderFiltered);
  flocEl.addEventListener('change', renderFiltered);
  fmodeEl.addEventListener('change', renderFiltered);
  fexpEl.addEventListener('change', renderFiltered);
  fsourceEl.addEventListener('change', renderFiltered);

  renderFiltered();
}

function initSaved() {
  const container = document.getElementById('saved-job-list');
  const savedJobs = window.jobsData.filter(j => savedJobIds.includes(j.id));

  if (savedJobs.length === 0) {
    container.innerHTML = `
      <div class="state-empty" style="border: none; background: #fff; padding: var(--space-64); text-align: left; max-width: 720px;">
        <h3 style="font-size: 24px;">No saved jobs</h3>
        <p style="margin: 0; color: rgba(17,17,17,0.7);">Jobs you bookmark from your dashboard will appear here to easily review later.</p>
      </div>
    `;
  } else {
    container.innerHTML = savedJobs.map(createJobCardHTML).join('');
  }
}

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
      <div class="filter-bar">
        <input type="text" id="search-keyword" class="filter-input" placeholder="Search title/company...">
        <select id="filter-location" class="filter-select">
          <option value="">All Locations</option>
          <option value="Bangalore">Bangalore</option>
          <option value="Hyderabad">Hyderabad</option>
          <option value="Pune">Pune</option>
          <option value="Chennai">Chennai</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Gurgaon">Gurgaon</option>
          <option value="Noida">Noida</option>
          <option value="Remote">Remote</option>
        </select>
        <select id="filter-mode" class="filter-select">
          <option value="">All Modes</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Onsite">Onsite</option>
        </select>
        <select id="filter-exp" class="filter-select">
          <option value="">All Experience</option>
          <option value="Fresher">Fresher</option>
          <option value="0-1">0-1</option>
          <option value="1-3">1-3</option>
          <option value="3-5">3-5</option>
        </select>
        <select id="filter-source" class="filter-select">
          <option value="">All Sources</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Naukri">Naukri</option>
          <option value="Indeed">Indeed</option>
        </select>
        <select id="sort-by" class="filter-select">
          <option value="latest">Latest</option>
        </select>
      </div>
      <div id="job-list" class="job-list"></div>
    `;
    setTimeout(() => initDashboard(), 0);
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
      <div id="saved-job-list" class="job-list"></div>
    `;
    setTimeout(() => initSaved(), 0);
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
  let currentPath = window.location.pathname;
  if (currentPath.endsWith('.html')) {
    currentPath = '/';
  }
  renderPage(currentPath);
});
