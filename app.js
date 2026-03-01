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
let userPreferences = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || null;
let jobStatuses = JSON.parse(localStorage.getItem('jobTrackerStatus') || '{}');
let jobStatusUpdates = JSON.parse(localStorage.getItem('jobTrackerStatusUpdates') || '[]');

function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function handleStatusChange(jobId, company, title, selectElement) {
  const newStatus = selectElement.value;
  jobStatuses[jobId] = newStatus;
  localStorage.setItem('jobTrackerStatus', JSON.stringify(jobStatuses));

  selectElement.className = 'status-select status-' + newStatus.replace(' ', '-');

  if (newStatus !== 'Not Applied') {
    showToast(`Status updated: ${newStatus}`);

    const updateRecord = {
      jobId,
      title,
      company,
      status: newStatus,
      date: new Date().toLocaleDateString()
    };
    jobStatusUpdates.unshift(updateRecord);
    if (jobStatusUpdates.length > 50) jobStatusUpdates.pop();
    localStorage.setItem('jobTrackerStatusUpdates', JSON.stringify(jobStatusUpdates));
  }
}

// Ensure globally accessible functions
window.toggleSaveJob = toggleSaveJob;
window.viewJob = viewJob;
window.handleStatusChange = handleStatusChange;

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

  const matchData = computeMatchScore(job, userPreferences);
  let scoreBadgeHtml = '';
  if (userPreferences) {
    let scoreClass = 'badge-score-grey';
    if (matchData.score >= 80) scoreClass = 'badge-score-green';
    else if (matchData.score >= 60) scoreClass = 'badge-score-amber';
    else if (matchData.score >= 40) scoreClass = 'badge-score-neutral';

    scoreBadgeHtml = `<span class="badge ${scoreClass}">Match: ${matchData.score}%</span>`;
  }

  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" onclick="document.getElementById('job-modal').classList.remove('open')">&times;</button>
      <h2 style="font-size: 24px; margin-bottom: 8px;">${job.title}</h2>
      <div style="font-size: 18px; color: rgba(17,17,17,0.7); margin-bottom: 24px;">${job.company}</div>
      <div class="job-badges" style="margin-bottom: 24px;">
        ${scoreBadgeHtml}
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

// Compute Match Score strictly following algorithm
function computeMatchScore(job, prefs) {
  if (!prefs) return { score: 0 };
  let score = 0;

  // Exact Rules:
  const tTitle = job.title.toLowerCase();
  const tDesc = job.description.toLowerCase();

  // +25 if roleKeyword in title
  if (prefs.roleKeywords.some(kw => tTitle.includes(kw.toLowerCase()))) {
    score += 25;
  }
  // +15 if roleKeyword in description
  if (prefs.roleKeywords.some(kw => tDesc.includes(kw.toLowerCase()))) {
    score += 15;
  }
  // +15 if job.location matches preferredLocations
  if (prefs.preferredLocations.includes(job.location)) {
    score += 15;
  }
  // +10 if job.mode matches preferredMode
  if (prefs.preferredMode.includes(job.mode)) {
    score += 10;
  }
  // +10 if job.experience matches experienceLevel
  if (prefs.experienceLevel === job.experience) {
    score += 10;
  }
  // +15 if overlap between job.skills and user.skills
  const hasSkillOverlap = job.skills.some(js =>
    prefs.skills.some(ps => ps.toLowerCase() === js.toLowerCase())
  );
  if (hasSkillOverlap) {
    score += 15;
  }
  // +5 if postedDaysAgo <= 2
  if (job.postedDaysAgo <= 2) {
    score += 5;
  }
  // +5 if source is LinkedIn
  if (job.source === 'LinkedIn') {
    score += 5;
  }

  score = Math.min(score, 100);
  return { score };
}

window.toggleSaveJob = toggleSaveJob;
window.viewJob = viewJob;

function extractSalaryNum(salaryStr) {
  const match = salaryStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function createJobCardHTML(job) {
  const isSaved = savedJobIds.includes(job.id);
  const matchData = computeMatchScore(job, userPreferences);

  let scoreBadgeHtml = '';
  if (userPreferences) {
    let scoreClass = 'badge-score-grey';
    if (matchData.score >= 80) scoreClass = 'badge-score-green';
    else if (matchData.score >= 60) scoreClass = 'badge-score-amber';
    else if (matchData.score >= 40) scoreClass = 'badge-score-neutral';

    scoreBadgeHtml = `<span class="badge ${scoreClass}">Match: ${matchData.score}%</span>`;
  }

  const currentStatus = jobStatuses[job.id] || 'Not Applied';
  const statusClass = 'status-' + currentStatus.replace(' ', '-');

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
        ${scoreBadgeHtml}
        <span class="badge">${job.location} • ${job.mode}</span>
        <span class="badge">${job.experience}</span>
        <span class="badge">${job.salaryRange}</span>
        <span class="badge badge-source">${job.source}</span>
      </div>
      <div class="job-actions" style="justify-content: space-between; align-items: center;">
        <div style="display:flex; gap: 8px;">
          <button class="btn btn-primary" onclick="window.open('${job.applyUrl}', '_blank')">Apply</button>
          <button class="btn btn-secondary" onclick="viewJob('${job.id}')">View</button>
          <button class="btn btn-secondary" onclick="toggleSaveJob('${job.id}', this)">${isSaved ? 'Saved' : 'Save'}</button>
        </div>
        <div>
          <select class="status-select ${statusClass}" onchange="handleStatusChange('${job.id}', '${job.company.replace(/'/g, "\\'")}', '${job.title.replace(/'/g, "\\'")}', this)">
            <option value="Not Applied" ${currentStatus === 'Not Applied' ? 'selected' : ''}>Not Applied</option>
            <option value="Applied" ${currentStatus === 'Applied' ? 'selected' : ''}>Applied</option>
            <option value="Rejected" ${currentStatus === 'Rejected' ? 'selected' : ''}>Rejected</option>
            <option value="Selected" ${currentStatus === 'Selected' ? 'selected' : ''}>Selected</option>
          </select>
        </div>
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
  const sortEl = document.getElementById('sort-by');
  const fstatusEl = document.getElementById('filter-status');
  const btnClearFilters = document.getElementById('clear-filters-btn');
  const thresholdToggle = document.getElementById('threshold-toggle');
  const missingPrefsBanner = document.getElementById('missing-prefs-banner');

  if (!userPreferences && missingPrefsBanner) {
    missingPrefsBanner.style.display = 'block';
  }

  function renderFiltered() {
    const term = searchEl.value.toLowerCase();
    const loc = flocEl.value;
    const mode = fmodeEl.value;
    const exp = fexpEl.value;
    const src = fsourceEl.value;
    const stat = fstatusEl.value;
    const showOnlyMatches = thresholdToggle && thresholdToggle.checked;

    let filtered = window.jobsData.filter(job => {
      const matchSearch = job.title.toLowerCase().includes(term) || job.company.toLowerCase().includes(term);
      const matchLoc = !loc || job.location === loc;
      const matchMode = !mode || job.mode === mode;
      const matchExp = !exp || job.experience === exp;
      const matchSrc = !src || job.source === src;

      const currentStatus = jobStatuses[job.id] || 'Not Applied';
      const matchStat = !stat || currentStatus === stat;

      return matchSearch && matchLoc && matchMode && matchExp && matchSrc && matchStat;
    });

    if (showOnlyMatches && userPreferences) {
      filtered = filtered.filter(job => {
        const matchInfo = computeMatchScore(job, userPreferences);
        return matchInfo.score >= userPreferences.minMatchScore;
      });
    }

    const sortVal = sortEl.value;
    filtered.sort((a, b) => {
      if (sortVal === 'latest') return a.postedDaysAgo - b.postedDaysAgo;
      if (sortVal === 'score' && userPreferences) {
        return computeMatchScore(b, userPreferences).score - computeMatchScore(a, userPreferences).score;
      }
      if (sortVal === 'salary') {
        return extractSalaryNum(b.salaryRange) - extractSalaryNum(a.salaryRange);
      }
      return 0;
    });

    if (filtered.length === 0) {
      jobListEl.innerHTML = `
        <div class="state-empty" style="border: none; background: #fff; padding: var(--space-64); text-align: left; max-width: 720px;">
          <h3 style="font-size: 24px;">No roles match your criteria.</h3>
          <p style="margin: 0; color: rgba(17,17,17,0.7);">Adjust filters or lower threshold.</p>
        </div>
      `;
    } else {
      jobListEl.innerHTML = filtered.map(createJobCardHTML).join('');
    }
  }

  searchEl.addEventListener('input', renderFiltered);
  flocEl.addEventListener('change', renderFiltered);
  fmodeEl.addEventListener('change', renderFiltered);
  fexpEl.addEventListener('change', renderFiltered);
  fsourceEl.addEventListener('change', renderFiltered);
  fstatusEl.addEventListener('change', renderFiltered);
  sortEl.addEventListener('change', renderFiltered);
  if (thresholdToggle) {
    thresholdToggle.addEventListener('change', renderFiltered);
  }

  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', () => {
      searchEl.value = '';
      flocEl.value = '';
      fmodeEl.value = '';
      fexpEl.value = '';
      fsourceEl.value = '';
      fstatusEl.value = '';
      sortEl.value = 'latest';
      if (thresholdToggle) thresholdToggle.checked = false;
      renderFiltered();
    });
  }

  renderFiltered();
}

function initSettings() {
  const inputRole = document.getElementById('role-keywords');
  const inputLocs = document.getElementById('locations');
  const chkRemote = document.getElementById('mode-remote');
  const chkHybrid = document.getElementById('mode-hybrid');
  const chkOnsite = document.getElementById('mode-onsite');
  const selectExp = document.getElementById('experience');
  const inputSkills = document.getElementById('skills');
  const valSlider = document.getElementById('min-score');
  const displayScore = document.getElementById('score-display');
  const btnSave = document.getElementById('save-prefs');

  valSlider.addEventListener('input', (e) => {
    displayScore.innerText = e.target.value;
  });

  if (userPreferences) {
    inputRole.value = userPreferences.roleKeywords.join(', ');
    const opts = Array.from(inputLocs.options);
    userPreferences.preferredLocations.forEach(loc => {
      const o = opts.find(opt => opt.value === loc);
      if (o) o.selected = true;
    });
    chkRemote.checked = userPreferences.preferredMode.includes('Remote');
    chkHybrid.checked = userPreferences.preferredMode.includes('Hybrid');
    chkOnsite.checked = userPreferences.preferredMode.includes('Onsite');
    selectExp.value = userPreferences.experienceLevel;
    inputSkills.value = userPreferences.skills.join(', ');
    valSlider.value = userPreferences.minMatchScore;
    displayScore.innerText = userPreferences.minMatchScore;
  }

  btnSave.addEventListener('click', () => {
    const rawRoles = inputRole.value.split(',').map(s => s.trim()).filter(Boolean);
    const rawSkills = inputSkills.value.split(',').map(s => s.trim()).filter(Boolean);
    const selLocs = Array.from(inputLocs.selectedOptions).map(o => o.value).filter(Boolean);
    const modes = [];
    if (chkRemote.checked) modes.push('Remote');
    if (chkHybrid.checked) modes.push('Hybrid');
    if (chkOnsite.checked) modes.push('Onsite');

    userPreferences = {
      roleKeywords: rawRoles,
      preferredLocations: selLocs,
      preferredMode: modes,
      experienceLevel: selectExp.value,
      skills: rawSkills,
      minMatchScore: parseInt(valSlider.value, 10)
    };

    localStorage.setItem('jobTrackerPreferences', JSON.stringify(userPreferences));

    // UI Feedback
    const oldText = btnSave.innerText;
    btnSave.innerText = "Preferences Saved!";
    btnSave.style.backgroundColor = 'var(--color-success)';
    setTimeout(() => {
      btnSave.innerText = oldText;
      btnSave.style.backgroundColor = 'var(--color-accent)';
    }, 2000);
  });

  const btnClear = document.getElementById('clear-prefs');
  btnClear.addEventListener('click', () => {
    // Completely wipe all user settings and force reload the dataset
    localStorage.removeItem('jobTrackerPreferences');
    userPreferences = null;

    // Clear statuses and digests
    localStorage.removeItem('jobTrackerStatus');
    localStorage.removeItem('jobTrackerStatusUpdates');
    jobStatuses = {};
    jobStatusUpdates = [];

    // Clear today's digest so next time it recalculates with correct empty states
    const today = new Date().toISOString().split('T')[0];
    localStorage.removeItem('jobTrackerDigest_' + today);

    // Wipe local array outputs
    inputRole.value = '';
    Array.from(inputLocs.options).forEach(opt => opt.selected = false);
    chkRemote.checked = false;
    chkHybrid.checked = false;
    chkOnsite.checked = false;
    selectExp.value = 'Fresher';
    inputSkills.value = '';
    valSlider.value = 40;
    displayScore.innerText = 40;

    const oldText = btnClear.innerText;
    btnClear.innerText = "Cleared!";
    setTimeout(() => {
      btnClear.innerText = oldText;
    }, 2000);
  });
}

function initSaved() {
  const container = document.getElementById('saved-job-list');
  const savedJobs = window.jobsData.filter(j => savedJobIds.includes(j.id));

  if (savedJobs.length === 0) {
    container.innerHTML = `
      <div class="state-empty" style="border: none; background: #fff; text-align: left; max-width: 720px;">
        <h3 style="font-size: 24px;">No saved jobs</h3>
        <p style="margin: 0; color: rgba(17,17,17,0.7);">Jobs you bookmark from your dashboard will appear here to easily review later.</p>
      </div>
    `;
  } else {
    container.innerHTML = savedJobs.map(createJobCardHTML).join('');
  }
}

function initDigest() {
  const container = document.getElementById('digest-container');
  if (!userPreferences) {
    container.innerHTML = `
      <div class="state-empty" style="border: none; background: #fff; text-align: left; max-width: 720px;">
        <h3 style="font-size: 24px;">Set preferences to generate a personalized digest.</h3>
        <button class="btn btn-primary" style="margin-top: 16px;" onclick="navigateTo('/settings')">Go to Settings</button>
      </div>
    `;
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const digestKey = 'jobTrackerDigest_' + today;

  function renderDigestView(digestJobIds) {
    const jobs = digestJobIds.map(id => window.jobsData.find(j => j.id === id)).filter(Boolean);

    if (jobs.length === 0) {
      container.innerHTML = `
        <div class="state-empty" style="border: none; background: #fff; text-align: left; max-width: 720px;">
          <h3 style="font-size: 24px;">No matching roles today. Check again tomorrow.</h3>
        </div>
      `;
      return;
    }

    const jobHtml = jobs.map((job, idx) => {
      const matchData = computeMatchScore(job, userPreferences);
      const isLast = idx === jobs.length - 1;
      return `
        <div style="border-bottom: 1px solid rgba(17,17,17,0.1); padding: 24px 0; ${isLast ? 'border-bottom: none;' : ''}">
          <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 16px;">
            <h3 style="font-size: 20px; font-family: var(--font-heading); margin: 0;">${job.title}</h3>
            <span style="white-space: nowrap; font-weight: 600; color: var(--color-success); background: rgba(103, 142, 89, 0.1); padding: 4px 8px; border-radius: 4px; font-size: 14px;">Match: ${matchData.score}%</span>
          </div>
          <div style="color: rgba(17,17,17,0.7); font-size: 16px; margin-bottom: 12px;">${job.company} • ${job.location} • ${job.experience}</div>
          <a href="${job.applyUrl}" target="_blank" class="btn btn-primary" style="font-size: 14px; padding: 8px 16px; text-decoration: none;">Apply Now</a>
        </div>
      `;
    }).join('');

    const formattedDate = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    container.innerHTML = `
      <div class="digest-actions">
        <button id="btn-copy-digest" class="btn btn-secondary">Copy Digest to Clipboard</button>
        <button id="btn-email-digest" class="btn btn-secondary">Create Email Draft</button>
      </div>
      <div class="card digest-card" style="max-width: 720px; margin-bottom: 0;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h2 style="font-size: 28px; margin-bottom: 8px;">Top 10 Jobs For You — 9AM Digest</h2>
          <div style="color: rgba(17,17,17,0.6); font-size: 16px;">${formattedDate}</div>
        </div>
        ${jobHtml}
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(17,17,17,0.1); text-align: center; color: rgba(17,17,17,0.5); font-size: 14px;">
          This digest was generated based on your preferences.
        </div>
      </div>
    `;

    const btnCopy = document.getElementById('btn-copy-digest');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        let textToCopy = "Top 10 Jobs For You — 9AM Digest\n" + formattedDate + "\n\n";
        textToCopy += jobs.map(j => {
          const matchData = computeMatchScore(j, userPreferences);
          return j.title + " at " + j.company + "\nMatch: " + matchData.score + "%\nLocation: " + j.location + "\nExperience: " + j.experience + "\nApply: " + j.applyUrl;
        }).join('\n\n');

        navigator.clipboard.writeText(textToCopy).then(() => {
          btnCopy.innerText = "Copied!";
          setTimeout(() => btnCopy.innerText = "Copy Digest to Clipboard", 2000);
        });
      });
    }

    const btnEmail = document.getElementById('btn-email-digest');
    if (btnEmail) {
      btnEmail.addEventListener('click', () => {
        let textBody = "Top 10 Jobs For You — 9AM Digest\n" + formattedDate + "\n\n";
        textBody += jobs.map(j => {
          const matchData = computeMatchScore(j, userPreferences);
          return j.title + " at " + j.company + "\nMatch: " + matchData.score + "%\nLocation: " + j.location + "\nExperience: " + j.experience + "\nApply: " + j.applyUrl;
        }).join('\n\n');

        const mailtoLink = "mailto:?subject=" + encodeURIComponent("My 9AM Job Digest") + "&body=" + encodeURIComponent(textBody);
        window.open(mailtoLink, '_self');
      });
    }
  }

  const existingDigest = localStorage.getItem(digestKey);
  if (existingDigest) {
    renderDigestView(JSON.parse(existingDigest));
  } else {
    // Show generator UI
    container.innerHTML = `
      <div class="state-empty" style="border: none; background: #fff; text-align: left; max-width: 720px;">
        <h3 style="font-size: 24px;">Your digest is ready to be compiled</h3>
        <p style="margin: 0 0 24px 0; color: rgba(17,17,17,0.7);">Demo Mode: Daily 9AM trigger simulated manually.</p>
        <button id="generate-digest-btn" class="btn btn-primary">Generate Today's 9AM Digest (Simulated)</button>
      </div>
    `;

    const generateBtn = document.getElementById('generate-digest-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        const filtered = window.jobsData.filter(job => {
          const matchInfo = computeMatchScore(job, userPreferences);
          return matchInfo.score >= userPreferences.minMatchScore;
        });

        filtered.sort((a, b) => {
          const scoreA = computeMatchScore(a, userPreferences).score;
          const scoreB = computeMatchScore(b, userPreferences).score;
          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
          return a.postedDaysAgo - b.postedDaysAgo;
        });

        const top10 = filtered.slice(0, 10);
        const top10Ids = top10.map(j => j.id);

        localStorage.setItem(digestKey, JSON.stringify(top10Ids));
        renderDigestView(top10Ids);
      });
    }
  }

  // Render recent status updates appendment
  if (jobStatusUpdates.length > 0) {
    const updSection = document.createElement('div');
    updSection.style.marginTop = '48px';
    updSection.className = 'card';
    updSection.style.maxWidth = '720px';
    updSection.innerHTML = `
      <h2 style="font-size: 20px; margin-bottom: 24px;">Recent Status Updates</h2>
      <div style="display:flex; flex-direction:column; gap: 16px;">
        ${jobStatusUpdates.slice(0, 5).map(u => {
      let c = 'var(--color-text)';
      if (u.status === 'Applied') c = '#0052CC';
      if (u.status === 'Rejected') c = 'var(--color-error)';
      if (u.status === 'Selected') c = 'var(--color-success)';

      return `
            <div style="border:1px solid rgba(17,17,17,0.1); padding: 16px; border-radius: var(--radius); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <h4 style="margin:0 0 4px 0; font-size:16px;">${u.title}</h4>
                <div style="font-size:14px; color:rgba(17,17,17,0.6);">${u.company}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:14px; font-weight:600; color: ${c};">${u.status}</div>
                <div style="font-size:12px; color:rgba(17,17,17,0.4); margin-top:4px;">${u.date}</div>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
    container.appendChild(updSection);
  }
}

function renderPage(pathname) {
  navLinks.forEach(link => {
    if (link.getAttribute('href') === pathname) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

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
    let toggleHtml = '';
    if (userPreferences) {
      toggleHtml = `
      <div class="toggle-group">
        <input type="checkbox" id="threshold-toggle">
          <label for="threshold-toggle">Show only jobs above my threshold (${userPreferences.minMatchScore}%)</label>
        </div>
    `;
    }

    contentHtml = `
      <header class="context-header">
        <h1>Dashboard</h1>
        <div id="missing-prefs-banner" style="display:none; margin-top:16px; background:rgba(203, 162, 88, 0.1); border-left:4px solid var(--color-warning); padding:12px 16px; border-radius:4px; font-weight:500; color:var(--color-warning);">Set your preferences to activate intelligent matching.</div>
      </header>

      ${toggleHtml}

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
        <select id="filter-status" class="filter-select">
          <option value="">All Statuses</option>
          <option value="Not Applied">Not Applied</option>
          <option value="Applied">Applied</option>
          <option value="Rejected">Rejected</option>
          <option value="Selected">Selected</option>
        </select>
        <select id="sort-by" class="filter-select">
          <option value="latest">Latest</option>
          <option value="score">Match Score</option>
          <option value="salary">Salary Range</option>
        </select>
        <button id="clear-filters-btn" class="btn btn-secondary">Clear All</button>
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
          <label class="input-label" for="role-keywords">Role keywords (comma-separated)</label>
          <input type="text" id="role-keywords" class="input-field" placeholder="e.g. React, Frontend, Developer" />
        </div>

        <div class="input-group">
          <label class="input-label" for="locations">Preferred location</label>
          <select id="locations" class="input-field">
            <option value="">Any Location</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Pune">Pune</option>
            <option value="Chennai">Chennai</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Gurgaon">Gurgaon</option>
            <option value="Noida">Noida</option>
          </select>
        </div>

        <div class="input-group">
          <label class="input-label">Preferred Mode</label>
          <div class="checkbox-group">
            <label class="checkbox-label"><input type="checkbox" id="mode-remote"> Remote</label>
            <label class="checkbox-label"><input type="checkbox" id="mode-hybrid"> Hybrid</label>
            <label class="checkbox-label"><input type="checkbox" id="mode-onsite"> Onsite</label>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label" for="experience">Experience level</label>
          <select id="experience" class="input-field" style="appearance: none;">
            <option value="Fresher">Fresher</option>
            <option value="0-1">0-1</option>
            <option value="1-3">1-3</option>
            <option value="3-5">3-5</option>
          </select>
        </div>

        <div class="input-group">
          <label class="input-label" for="skills">Skills (comma-separated)</label>
          <input type="text" id="skills" class="input-field" placeholder="e.g. JavaScript, React, Node.js" />
        </div>

        <div class="input-group" style="margin-bottom: var(--space-40);">
          <label class="input-label" for="min-score">Minimum Match Score Threshold (<span id="score-display">40</span>%)</label>
          <input type="range" id="min-score" min="0" max="100" value="40" />
        </div>

        <div class="settings-actions">
          <button id="save-prefs" class="btn btn-primary">Save Preferences</button>
          <button id="clear-prefs" class="btn btn-secondary" style="border-color: rgba(139, 0, 0, 0.5); color: #8B0000; background: rgba(139, 0, 0, 0.05);">Clear Preferences & Data</button>
        </div>
      </div>
    `;
    setTimeout(() => initSettings(), 0);
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
      <div id="digest-container"></div>
    `;
    setTimeout(() => initDigest(), 0);
  } else if (pathname === '/proof') {
    contentHtml = `
      <header class="context-header">
        <h1>Proof Artifacts</h1>
        <p class="subtext">Collection of testing and validation artifacts.</p>
      </header>
    `;
  } else if (pathname === '/jt/07-test') {
    contentHtml = `
      <header class="context-header">
        <h1>Test Checklist</h1>
        <p class="subtext">Verify all critical paths before shipping.</p>
      </header>
      <div class="card" style="max-width: 720px;">
        <div id="test-summary" style="margin-bottom: var(--space-24); padding-bottom: var(--space-16); border-bottom: 1px solid rgba(17,17,17,0.1); font-size: 20px; font-weight: 500;">
          Tests Passed: <span id="passed-count">0</span> / 10
        </div>
        <div id="test-warning" style="display:none; color: var(--color-warning); font-size: 14px; margin-top: -16px; margin-bottom: 24px;">
          Resolve all issues before shipping.
        </div>
        <div id="checklist-container" style="display: flex; flex-direction: column; gap: 16px;"></div>
        <div style="margin-top: 32px; border-top: 1px solid rgba(17,17,17,0.1); padding-top: 24px; text-align: left;">
          <button id="reset-tests-btn" class="btn btn-secondary">Reset Test Status</button>
        </div>
      </div>
    `;
    setTimeout(() => initTestChecklist(), 0);
  } else if (pathname === '/jt/08-ship') {
    contentHtml = `
      <header class="context-header">
        <h1>Ship Readiness</h1>
      </header>
      <div id="ship-container" class="card" style="max-width: 720px; text-align: center; padding: 48px 24px;"></div>
    `;
    setTimeout(() => initShipGate(), 0);
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

// TEST CHECKLIST & SHIP LOGIC
function initTestChecklist() {
  const checklistItems = [
    { id: 't1', text: "Preferences persist after refresh", tip: "Go to Settings, save values, refresh the page and verify they remain." },
    { id: 't2', text: "Match score calculates correctly", tip: "Verify job scores on Dashboard match your set role and preference logic." },
    { id: 't3', text: '\"Show only matches\" toggle works', tip: "Toggle checkbox on Dashboard and confirm it filters strictly by threshold." },
    { id: 't4', text: "Save job persists after refresh", tip: "Save a job on Dashboard, refresh page, check if it remains in Saved tab." },
    { id: 't5', text: "Apply opens in new tab", tip: "Click any Apply button and confirm it creates a new browser tab/window." },
    { id: 't6', text: "Status update persists after refresh", tip: "Change job status to 'Applied', refresh page, verify the dropdown status stuck." },
    { id: 't7', text: "Status filter works correctly", tip: "Filter Dashboard by 'Selected' and verify it only shows those matched jobs." },
    { id: 't8', text: "Digest generates top 10 by score", tip: "Click generate on Digest page and ensure accurately sorted top 10 jobs." },
    { id: 't9', text: "Digest persists for the day", tip: "Refresh the Digest page and verify the generated list is retained from memory." },
    { id: 't10', text: "No console errors on main pages", tip: "Open Developer Tools (F12), click through all Nav links, verify no red errors." }
  ];

  let testStatus = JSON.parse(localStorage.getItem('jobTrackerTestStatus') || '{}');
  const container = document.getElementById('checklist-container');
  const passedCountEl = document.getElementById('passed-count');
  const warningEl = document.getElementById('test-warning');
  const resetBtn = document.getElementById('reset-tests-btn');

  function updateCount() {
    let totalChecked = 0;
    checklistItems.forEach(item => {
      if (testStatus[item.id] === true) totalChecked++;
    });

    passedCountEl.innerText = totalChecked;
    if (totalChecked < 10) {
      warningEl.style.display = 'block';
    } else {
      warningEl.style.display = 'none';
    }
    localStorage.setItem('jobTrackerTestStatus', JSON.stringify(testStatus));
  }

  checklistItems.forEach(item => {
    const isChecked = testStatus[item.id] === true;
    const row = document.createElement('label');
    row.style.display = 'flex';
    row.style.alignItems = 'flex-start';
    row.style.gap = '12px';
    row.style.cursor = 'pointer';
    row.innerHTML = `
      <input type="checkbox" style="margin-top: 4px; transform: scale(1.2);" ${isChecked ? 'checked' : ''} />
      <div>
        <div style="font-size: 16px; font-weight: 500; color: var(--color-text);">${item.text}</div>
        <div style="font-size: 14px; color: rgba(17,17,17,0.5); margin-top: 2px;">${item.tip}</div>
      </div>
    `;

    const checkbox = row.querySelector('input');
    checkbox.addEventListener('change', (e) => {
      testStatus[item.id] = e.target.checked;
      updateCount();
    });
    container.appendChild(row);
  });

  resetBtn.addEventListener('click', () => {
    testStatus = {};
    container.querySelectorAll('input').forEach(cb => cb.checked = false);
    updateCount();
  });

  updateCount();
}

function initShipGate() {
  const testStatus = JSON.parse(localStorage.getItem('jobTrackerTestStatus') || '{}');
  let totalChecked = 0;
  for (let i = 1; i <= 10; i++) {
    if (testStatus['t' + i] === true) totalChecked++;
  }

  const container = document.getElementById('ship-container');
  if (totalChecked < 10) {
    container.innerHTML = `
      <h2 style="color: var(--color-error); margin-bottom: 16px;">Access Denied</h2>
      <p style="font-size: 18px; color: rgba(17,17,17,0.7); margin-bottom: 24px;">Complete all tests before shipping.</p>
      <button class="btn btn-primary" onclick="navigateTo('/jt/07-test')">Go to Checklist</button>
    `;
  } else {
    container.innerHTML = `
      <h2 style="color: var(--color-success); margin-bottom: 16px;">Ready to Ship!</h2>
      <p style="font-size: 18px; color: rgba(17,17,17,0.7);">All 10 critical paths have been verified.</p>
    `;
  }
}
