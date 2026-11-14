function getBalancedSelectionForScenario(scenarioId) {
  const defaults = {
    'moon-south-pole': {
      launchVehicle: 'ariane-6',
      spacecraft: 'heavy-lab',
      powerSystem: 'rtg',
      comms: 'relay-link',
      trajectory: 'lunar-flyby',
      instrumentIds: ['camera', 'spectrometer', 'laser-altimeter', 'thermal-imager']
    },
    'mars-surface': {
      launchVehicle: 'falcon-heavy',
      spacecraft: 'heavy-lab',
      powerSystem: 'rtg',
      comms: 'deep-space',
      trajectory: 'transfer',
      instrumentIds: ['camera', 'spectrometer', 'radar', 'thermal-imager']
    },
    'asteroid-survey': {
      launchVehicle: 'ariane-6',
      spacecraft: 'heavy-lab',
      powerSystem: 'rtg',
      comms: 'deep-space',
      trajectory: 'asteroid-rendezvous',
      instrumentIds: ['camera', 'spectrometer', 'radar', 'thermal-imager']
    },
    'earth-observation': {
      launchVehicle: 'atlas-v',
      spacecraft: 'explorer',
      powerSystem: 'solar-array',
      comms: 'direct-earth',
      trajectory: 'low-orbit',
      instrumentIds: ['camera', 'spectrometer', 'thermal-imager']
    }
  };

  return { ...defaults[scenarioId] || defaults['earth-observation'] };
}

const appState = {
  selectedScenario: gameData.scenarios[0].id,
  mode: 'solo',
  teamSize: 1,
  roles: {},
  selection: getBalancedSelectionForScenario(gameData.scenarios[0].id),
  result: null,
  lastReadiness: null,
  lastSeed: 77,
  launchTimer: null,
  currentPhase: 'Pre-launch',
  launchSequenceToken: 0,
  isLaunching: false
};

function setDefaultRoles() {
  appState.roles = {};
  gameData.roles.forEach((role) => {
    appState.roles[role.id] = role.name;
  });
}

function getScenario() {
  return gameData.scenarios.find((scenario) => scenario.id === appState.selectedScenario) || gameData.scenarios[0];
}

function updateStatusStrip() {
  const scenario = getScenario();
  const metrics = gameLogic.calculateMissionMetrics(appState.selection, scenario);
  const cards = [
    { label: 'Budget', value: `${metrics.totalCost.toFixed(0)}M`, ratio: clamp((metrics.totalCost / scenario.maxBudget) * 100, 0, 100) },
    { label: 'Mass', value: `${metrics.totalMass.toFixed(0)} kg`, ratio: clamp((metrics.totalMass / scenario.maxMass) * 100, 0, 100) },
    { label: 'Power', value: `${metrics.powerMargin.toFixed(0)} W`, ratio: clamp((metrics.powerMargin / Math.max(300, scenario.requiredPower)) * 100 + 50, 0, 100) },
    { label: 'Data', value: `${metrics.dataRate.toFixed(0)} Mb/s`, ratio: clamp((metrics.dataRate / scenario.requiredDataRate) * 100, 0, 100) },
    { label: 'Lifetime', value: `${metrics.lifetimeYears.toFixed(1)} yr`, ratio: clamp((metrics.lifetimeYears / (scenario.durationMonths / 12)) * 100, 0, 100) },
    { label: 'Reliability', value: `${(metrics.reliability * 100).toFixed(0)}%`, ratio: clamp(metrics.reliability * 100, 0, 100) }
  ];

  document.getElementById('resource-summary').innerHTML = cards.map((card) => `
    <div class="metric-card">
      <span class="label">${card.label}</span>
      <div class="value">${card.value}</div>
      <div class="bar"><span style="width:${Math.min(100, card.ratio)}%"></span></div>
    </div>
  `).join('');
}

function renderMissionConsole() {
  const scenario = getScenario();
  const metrics = gameLogic.calculateMissionMetrics(appState.selection, scenario);
  const warnings = [];

  if (metrics.powerMargin < scenario.requiredPower * 0.15) warnings.push('Power margin low');
  if (metrics.dataRate < scenario.requiredDataRate) warnings.push('Data return constrained');
  if (metrics.totalMass > scenario.maxMass * 0.92) warnings.push('Mass near launch limit');
  if (metrics.totalCost > scenario.maxBudget * 0.9) warnings.push('Budget pressure');

  const score = appState.result ? appState.result.missionScore : Math.round(
    clamp((metrics.reliability * 100 * 0.42) + (metrics.dataRate / scenario.requiredDataRate * 100 * 0.3) + (metrics.powerMargin / Math.max(1, scenario.requiredPower) * 100 * 0.28), 0, 100)
  );

  const phaseSequence = ['Pre-launch', 'Lift-off', 'Cruise', 'Arrival', 'Operations'];
  const phase = appState.currentPhase || (appState.result && appState.result.timeline.length ? appState.result.timeline[appState.result.timeline.length - 1].stage : 'Pre-launch');
  const phaseIndex = Math.max(0, phaseSequence.indexOf(phase));
  const progress = ((phaseIndex + 1) / phaseSequence.length) * 100;

  const chartValues = [
    Math.min(100, (metrics.totalCost / scenario.maxBudget) * 100),
    Math.min(100, (metrics.totalMass / scenario.maxMass) * 100),
    Math.min(100, (metrics.dataRate / scenario.requiredDataRate) * 100),
    Math.min(100, metrics.reliability * 100)
  ];

  const consoleEl = document.getElementById('mission-console');
  consoleEl.innerHTML = `
    <div class="hud-panel">
      <div class="hud-header">
        <div>
          <div class="mission-tag">Mission Control</div>
          <h3>${scenario.name}</h3>
        </div>
        <div class="score-wrap">
          <span class="score-label">Mission Score</span>
          <div class="score-badge">${score}</div>
        </div>
      </div>

      <div class="phase-progress">
        <div class="phase-progress-track">
          <span class="phase-progress-fill" style="width:${progress}%"></span>
        </div>
        <div class="phase-steps">
          ${phaseSequence.map((step) => `
            <span class="phase-step ${step === phase ? 'current' : ''}">${step}</span>
          `).join('')}
        </div>
      </div>

      <div class="hud-grid">
        <div class="hud-card primary">
          <span class="hud-label">Mission phase</span>
          <div class="phase-chip phase-animate">${phase}</div>
          <p>${scenario.objective}</p>
        </div>

        <div class="hud-card">
          <span class="hud-label">Warnings</span>
          <ul class="warning-list ${warnings.length ? 'alert' : 'stable'}">
            ${warnings.length ? warnings.map((warning) => `<li>${warning}</li>`).join('') : '<li>Nominal</li>'}
          </ul>
        </div>

        <div class="hud-card">
          <span class="hud-label">Mini charts</span>
          <div class="mini-charts">
            ${chartValues.map((value, index) => `
              <div class="mini-chart-item">
                <span>${['Cost', 'Mass', 'Data', 'Reliability'][index]}</span>
                <div class="mini-chart-track">
                  <span style="height:${Math.max(12, value)}%"></span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  const launchSequenceEl = document.getElementById('launch-sequence');
  const launchClass = phase === 'Pre-launch' ? 'idle' : phase === 'Lift-off' ? 'launching' : phase === 'Cruise' ? 'cruising' : phase === 'Arrival' ? 'arrival' : 'operations';
  launchSequenceEl.className = `launch-sequence ${launchClass}`;
  launchSequenceEl.innerHTML = `
    <div class="launch-scene">
      <div class="stars"></div>
      <div class="planet planet-a"></div>
      <div class="planet planet-b"></div>
      <div class="rocket-wrap">
        <div class="rocket">
          <div class="rocket-body"></div>
          <div class="rocket-window"></div>
          <div class="rocket-fin fin-left"></div>
          <div class="rocket-fin fin-right"></div>
          <div class="rocket-flame"></div>
        </div>
      </div>
    </div>
    <div class="launch-meta">
      <span>Launch Sequence</span>
      <strong class="phase-animate">${phase}</strong>
    </div>
  `;
}

function renderScenarioCards() {
  const panel = document.getElementById('scenario-panel');
  panel.innerHTML = `
    <div class="scenario-list">
      ${gameData.scenarios.map((scenario) => `
        <div class="scenario-card ${scenario.id === appState.selectedScenario ? 'selected' : ''}" data-id="${scenario.id}">
          <h3>${scenario.name}</h3>
          <div class="scenario-meta">
            <span class="meta-tag">${scenario.difficulty}</span>
            <span class="meta-tag">${scenario.durationMonths} mo</span>
          </div>
          <p>${scenario.objective}</p>
          <p><strong>Goal:</strong> ${scenario.scienceTarget} science score</p>
        </div>
      `).join('')}
    </div>
  `;

  panel.querySelectorAll('.scenario-card').forEach((card) => {
    card.addEventListener('click', () => {
      appState.selectedScenario = card.dataset.id;
      appState.selection = getBalancedSelectionForScenario(appState.selectedScenario);
      appState.result = null;
      render();
    });
  });
}

function renderTeamControls() {
  const teamControl = document.getElementById('team-controls');
  const roleGrid = document.getElementById('team-role-grid');
  const showTeam = appState.mode === 'team';
  teamControl.classList.toggle('hidden', !showTeam);

  if (!showTeam) {
    return;
  }

  roleGrid.innerHTML = Array.from({ length: Number(appState.teamSize) }, (_, index) => {
    const roleOptions = gameData.roles.map((role) => `<option value="${role.id}" ${index === 0 && role.id === 'mission-director' ? 'selected' : ''}>${role.name}</option>`).join('');
    return `
      <div class="role-card">
        <strong>Player ${index + 1}</strong>
        <select data-player="${index}">
          ${roleOptions}
        </select>
      </div>
    `;
  }).join('');
}

function renderOptionArt(kind, item, selected) {
  const palette = {
    launcher: ['#57c1ff', '#1b7ee5', '#dff6ff'],
    spacecraft: ['#7ef0b5', '#2ea472', '#e8fff5'],
    power: ['#ffd36e', '#df8d38', '#fff2c8'],
    comms: ['#a6b4ff', '#4c64d6', '#eef1ff'],
    trajectory: ['#ff99d6', '#a64bc3', '#ffe8f7'],
    instrument: ['#aaf2db', '#39b89c', '#effff7']
  };

  const colors = palette[kind] || palette.spacecraft;
  const accent = selected ? '#f5d76f' : colors[0];
  const ring = selected ? '#ffd970' : colors[1];

  if (kind === 'launcher') {
    return `
      <svg viewBox="0 0 180 110" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="launch-${item.id}" x1="0" x2="1">
            <stop offset="0%" stop-color="${colors[0]}" />
            <stop offset="100%" stop-color="${colors[1]}" />
          </linearGradient>
        </defs>
        <rect width="180" height="110" fill="#0a1824"/>
        <circle cx="32" cy="82" r="10" fill="#dfeaf7" opacity="0.8"/>
        <path d="M40 76 L76 56 L118 56 L148 76 L118 96 L76 96 Z" fill="url(#launch-${item.id})" opacity="0.95"/>
        <path d="M70 58 L86 35 L100 58 Z" fill="${accent}"/>
        <path d="M88 58 L104 35 L118 58 Z" fill="${accent}" opacity="0.75"/>
        <circle cx="120" cy="76" r="6" fill="${ring}"/>
        <rect x="64" y="92" width="48" height="8" rx="4" fill="#dff6ff" opacity="0.7"/>
      </svg>
    `;
  }

  if (kind === 'spacecraft') {
    return `
      <svg viewBox="0 0 180 110" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="110" fill="#081821"/>
        <circle cx="134" cy="36" r="16" fill="${colors[2]}" opacity="0.7"/>
        <path d="M53 76 L86 42 L118 52 L135 76 Z" fill="${colors[0]}"/>
        <rect x="71" y="52" width="18" height="26" rx="6" fill="#dfeef5"/>
        <rect x="94" y="48" width="22" height="30" rx="7" fill="#dfeef5" opacity="0.88"/>
        <circle cx="89" cy="82" r="7" fill="${ring}"/>
        <circle cx="110" cy="82" r="7" fill="${ring}" opacity="0.8"/>
        <path d="M31 26 C54 18, 63 18, 84 30" stroke="${accent}" stroke-width="4" fill="none"/>
      </svg>
    `;
  }

  if (kind === 'power') {
    return `
      <svg viewBox="0 0 180 110" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="110" fill="#16120d"/>
        <g transform="translate(22,22)">
          <rect x="0" y="16" width="120" height="36" rx="8" fill="${colors[0]}" opacity="0.9"/>
          <path d="M12 20 L40 0 L62 20" stroke="${colors[2]}" stroke-width="5" fill="none"/>
          <path d="M44 20 L72 0 L94 20" stroke="${colors[2]}" stroke-width="5" fill="none"/>
          <path d="M76 20 L104 0 L122 20" stroke="${colors[2]}" stroke-width="5" fill="none"/>
          <circle cx="60" cy="64" r="14" fill="${accent}"/>
          <path d="M60 49 L67 61 L62 61 L68 75 L52 60 H58 Z" fill="#33220b"/>
        </g>
      </svg>
    `;
  }

  if (kind === 'comms') {
    return `
      <svg viewBox="0 0 180 110" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="110" fill="#0d1429"/>
        <circle cx="82" cy="56" r="28" fill="${colors[0]}" opacity="0.18"/>
        <circle cx="82" cy="56" r="18" fill="${colors[0]}" opacity="0.36"/>
        <circle cx="82" cy="56" r="9" fill="${accent}"/>
        <path d="M82 17 L82 36 M82 76 L82 93 M46 56 L65 56 M99 56 L118 56" stroke="${colors[2]}" stroke-width="4"/>
        <path d="M117 40 L146 26 L146 84 L117 70 Z" fill="${colors[1]}" opacity="0.9"/>
        <path d="M117 40 L146 26" stroke="${colors[2]}" stroke-width="2"/>
      </svg>
    `;
  }

  if (kind === 'trajectory') {
    return `
      <svg viewBox="0 0 180 110" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="110" fill="#180d22"/>
        <path d="M18 72 C52 20, 94 18, 160 68" stroke="${colors[0]}" stroke-width="4" fill="none"/>
        <circle cx="30" cy="74" r="8" fill="${accent}"/>
        <circle cx="132" cy="54" r="12" fill="${colors[2]}" opacity="0.9"/>
        <path d="M130 62 L154 76" stroke="${accent}" stroke-width="4"/>
        <path d="M154 76 L148 90" stroke="${accent}" stroke-width="4"/>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 180 110" xmlns="http://www.w3.org/2000/svg">
      <rect width="180" height="110" fill="#0d1f20"/>
      <circle cx="54" cy="58" r="22" fill="${colors[0]}" opacity="0.65"/>
      <circle cx="118" cy="55" r="20" fill="${accent}" opacity="0.8"/>
      <path d="M30 76 H150" stroke="${colors[2]}" stroke-width="4"/>
      <path d="M64 20 L83 42 L98 28 L118 48" stroke="${colors[2]}" stroke-width="5" fill="none"/>
      <circle cx="98" cy="28" r="5" fill="${ring}"/>
    </svg>
  `;
}

function renderDesignPanel() {
  const panel = document.getElementById('design-panel');

  const groups = [
    { key: 'launchVehicle', label: 'Launch vehicle', items: gameData.launchVehicles, kind: 'launcher' },
    { key: 'spacecraft', label: 'Spacecraft bus', items: gameData.spacecraft, kind: 'spacecraft' },
    { key: 'powerSystem', label: 'Power system', items: gameData.powerSystems, kind: 'power' },
    { key: 'comms', label: 'Communications', items: gameData.communications, kind: 'comms' },
    { key: 'trajectory', label: 'Trajectory', items: gameData.trajectories, kind: 'trajectory' }
  ];

  const instrumentOptions = gameData.instruments.map((instrument) => {
    const checked = appState.selection.instrumentIds.includes(instrument.id) ? 'checked' : '';
    return `
      <label class="instrument-item">
        <input type="checkbox" value="${instrument.id}" ${checked} />
        <span>${instrument.name}</span>
      </label>
    `;
  }).join('');

  panel.innerHTML = `
    <div class="design-grid">
      ${groups.map((group) => `
        <div class="field">
          <label>${group.label}</label>
          <div class="option-grid">
            ${group.items.map((item) => {
              const isSelected = appState.selection[group.key] === item.id;
              return `
                <button type="button" class="option-card ${isSelected ? 'selected' : ''}" data-group="${group.key}" data-value="${item.id}">
                  <div class="option-art">${renderOptionArt(group.kind, item, isSelected)}</div>
                  <div class="option-copy">
                    <strong>${item.name}</strong>
                    <span>${item.description}</span>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}

      <div class="field">
        <label>Science instruments</label>
        <div class="instrument-list">${instrumentOptions}</div>
      </div>
    </div>
  `;

  panel.querySelectorAll('.option-card').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.dataset.group;
      const value = button.dataset.value;
      appState.selection[group] = value;
      render();
    });
  });

  panel.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener('change', (event) => {
      const value = event.target.value;
      const selected = new Set(appState.selection.instrumentIds);
      if (event.target.checked) {
        selected.add(value);
      } else {
        selected.delete(value);
      }
      appState.selection.instrumentIds = [...selected];
      render();
    });
  });
}

function renderReadiness() {
  const scenario = getScenario();
  const readiness = gameLogic.evaluateReadiness(appState.selection, scenario);
  appState.lastReadiness = readiness;

  const readinessPanel = document.getElementById('readiness-panel');
  const passCount = readiness.checks.filter((check) => check.pass).length;
  readinessPanel.innerHTML = `
    <div class="readiness-list">
      <div class="score-badge">${passCount}/${readiness.checks.length} checks passed</div>
      ${readiness.checks.map((check) => `
        <div class="check-item ${check.pass ? 'pass' : 'fail'}">
          <div class="name">${check.pass ? '✓' : '✗'} ${check.name}</div>
          <div class="reason">${check.reason}</div>
        </div>
      `).join('')}
    </div>
  `;

  const educationPanel = document.getElementById('education-panel');
  educationPanel.innerHTML = gameLogic.getTutorialConcepts().map((item) => `
    <div class="education-item">
      <h4>${item.title}</h4>
      <p>${item.text}</p>
    </div>
  `).join('');
}

function updateCinematicOverlay() {
  const overlay = document.getElementById('cinematic-overlay');
  const title = document.getElementById('cinematic-title');
  const summary = document.getElementById('cinematic-summary');

  if (!appState.result) {
    overlay.classList.add('hidden');
    return;
  }

  const success = appState.result.success;
  overlay.classList.remove('hidden');
  overlay.classList.toggle('victory', success);
  overlay.classList.toggle('defeat', !success);
  title.textContent = success ? 'Mission Success' : 'Mission Failed';
  summary.textContent = success
    ? `Science score ${appState.result.missionScore} achieved with ${appState.result.scienceReturn}% science return.`
    : `The design missed its mission threshold; redesign the trade-offs and try again.`;
}

function renderResults() {
  const panel = document.getElementById('results-panel');
  const resultContent = document.getElementById('result-content');
  if (!appState.result) {
    panel.classList.add('hidden');
    return;
  }

  const result = appState.result;
  document.getElementById('score-badge').textContent = `${result.missionScore} / 100`;
  resultContent.innerHTML = `
    <p>${result.debrief}</p>
    <div class="result-grid">
      <div class="result-stat">
        <span class="label">Science return</span>
        <div class="value">${result.scienceReturn}</div>
      </div>
      <div class="result-stat">
        <span class="label">Efficiency</span>
        <div class="value">${result.efficiency}</div>
      </div>
      <div class="result-stat">
        <span class="label">Reliability</span>
        <div class="value">${(result.state.reliability * 100).toFixed(0)}%</div>
      </div>
    </div>
    <div class="timeline">
      ${result.timeline.map((entry) => `
        <div class="timeline-item">
          <strong>${entry.stage}</strong>
          <span class="status-pill ${entry.status === 'Nominal' ? '' : entry.status === 'Recovered' ? 'warning' : 'alert'}">${entry.status}</span>
          <div>${entry.detail}</div>
        </div>
      `).join('')}
    </div>
    <div class="result-actions">
      <button id="retry-btn" class="primary-btn">Try Again</button>
    </div>
  `;
  panel.classList.remove('hidden');
  updateCinematicOverlay();

  const retryButton = document.getElementById('retry-btn');
  if (retryButton) {
    retryButton.addEventListener('click', () => {
      appState.launchSequenceToken += 1;
      appState.result = null;
      appState.isLaunching = false;
      document.getElementById('cinematic-overlay').classList.add('hidden');
      renderResults();
      runLaunchSequence();
    });
  }
}

function animatePhaseText(phase) {
  appState.currentPhase = phase;
  const phaseNodes = document.querySelectorAll('.phase-animate');
  phaseNodes.forEach((node) => {
    node.classList.remove('phase-flash');
    void node.offsetWidth;
    node.classList.add('phase-flash');
  });
}

async function runLaunchSequence() {
  appState.isLaunching = true;
  const launchToken = ++appState.launchSequenceToken;
  const overlay = document.getElementById('cinematic-overlay');
  overlay.classList.add('hidden');

  const launchSequenceEl = document.getElementById('launch-sequence');
  launchSequenceEl.className = 'launch-sequence idle';

  const countdown = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 'LIFT-OFF'];
  for (let i = 0; i < countdown.length; i += 1) {
    if (launchToken !== appState.launchSequenceToken) {
      appState.isLaunching = false;
      return;
    }

    const item = countdown[i];
    const text = item === 'LIFT-OFF' ? 'LIFT-OFF' : `T-${item}`;
    appState.currentPhase = text;
    launchSequenceEl.className = `launch-sequence ${item === 'LIFT-OFF' ? 'launching' : 'idle'}`;
    launchSequenceEl.innerHTML = `
      <div class="launch-scene">
        <div class="stars"></div>
        <div class="planet planet-a"></div>
        <div class="planet planet-b"></div>
        <div class="rocket-wrap">
          <div class="rocket">
            <div class="rocket-body"></div>
            <div class="rocket-window"></div>
            <div class="rocket-fin fin-left"></div>
            <div class="rocket-fin fin-right"></div>
            <div class="rocket-flame"></div>
          </div>
        </div>
      </div>
      <div class="launch-meta">
        <span>Launch Sequence</span>
        <strong class="phase-animate">${text}</strong>
      </div>
    `;
    animatePhaseText(text);
    await new Promise((resolve) => setTimeout(resolve, item === 'LIFT-OFF' ? 800 : 600));

    if (launchToken !== appState.launchSequenceToken) {
      appState.isLaunching = false;
      return;
    }
  }

  if (launchToken !== appState.launchSequenceToken) {
    appState.isLaunching = false;
    return;
  }

  const scenario = getScenario();
  const seed = Number(`${scenario.id.length}${appState.teamSize}`) + Math.round(Math.random() * 1000);
  appState.result = gameLogic.simulateMission(appState.selection, scenario, seed);
  appState.currentPhase = appState.result.timeline[appState.result.timeline.length - 1].stage;
  appState.isLaunching = false;
  renderMissionConsole();
  renderResults();
}

function render() {
  const scenario = getScenario();
  const modeInputs = document.querySelectorAll('input[name="mode"]');
  modeInputs.forEach((input) => {
    input.checked = input.value === appState.mode;
  });

  const teamControls = document.getElementById('team-controls');
  teamControls.classList.toggle('hidden', appState.mode !== 'team');

  document.getElementById('team-size').value = String(appState.teamSize);
  renderScenarioCards();
  renderDesignPanel();
  renderTeamControls();
  updateStatusStrip();
  renderMissionConsole();
  renderReadiness();
  renderResults();
  document.title = `${scenario.name} • AstroCraft`;
}

document.addEventListener('DOMContentLoaded', () => {
  setDefaultRoles();

  document.getElementById('team-size').addEventListener('change', (event) => {
    appState.teamSize = Number(event.target.value);
    render();
  });

  document.querySelectorAll('input[name="mode"]').forEach((input) => {
    input.addEventListener('change', (event) => {
      appState.mode = event.target.value;
      if (appState.mode !== 'team') {
        appState.teamSize = 1;
      }
      render();
    });
  });

  document.getElementById('validate-btn').addEventListener('click', () => {
    const scenario = getScenario();
    const readiness = gameLogic.evaluateReadiness(appState.selection, scenario);
    appState.lastReadiness = readiness;
    renderReadiness();
  });

  document.getElementById('close-overlay-btn').addEventListener('click', () => {
    appState.result = null;
    document.getElementById('cinematic-overlay').classList.add('hidden');
    document.getElementById('results-panel').classList.add('hidden');
  });

  document.getElementById('try-again-btn').addEventListener('click', () => {
    appState.launchSequenceToken += 1;
    appState.result = null;
    appState.isLaunching = false;
    document.getElementById('cinematic-overlay').classList.add('hidden');
    runLaunchSequence();
  });

  document.getElementById('simulate-btn').addEventListener('click', () => {
    if (appState.isLaunching) {
      appState.launchSequenceToken += 1;
      appState.isLaunching = false;
    }
    runLaunchSequence();
  });

  document.getElementById('tutorial-btn').addEventListener('click', () => {
    document.getElementById('tutorial-modal').classList.remove('hidden');
    document.getElementById('tutorial-modal').setAttribute('aria-hidden', 'false');
  });

  document.getElementById('close-tutorial').addEventListener('click', () => {
    document.getElementById('tutorial-modal').classList.add('hidden');
    document.getElementById('tutorial-modal').setAttribute('aria-hidden', 'true');
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    appState.selection = getBalancedSelectionForScenario(appState.selectedScenario);
    appState.result = null;
    render();
  });

  render();
});
