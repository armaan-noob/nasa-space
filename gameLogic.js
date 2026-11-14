function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sumValues(items) {
  return items.reduce((total, item) => total + (Number(item) || 0), 0);
}

function productValues(items) {
  return items.reduce((product, value) => product * (Number(value) || 1), 1);
}

function seededRandom(seed) {
  let current = (seed || 1) % 2147483647;
  if (current <= 0) current += 2147483646;
  return function random() {
    current = (current * 16807) % 2147483647;
    return (current - 1) / 2147483646;
  };
}

function normalizeSelection(selection, scenario) {
  const base = {
    launchVehicle: 'atlas-v',
    spacecraft: 'explorer',
    powerSystem: 'solar-array',
    comms: 'direct-earth',
    trajectory: 'transfer',
    instrumentIds: ['camera', 'spectrometer']
  };

  const merged = { ...base, ...selection };
  if (!merged.instrumentIds || merged.instrumentIds.length === 0) {
    merged.instrumentIds = ['camera'];
  }

  if (scenario && scenario.id === 'earth-observation') {
    merged.trajectory = 'low-orbit';
  }

  return merged;
}

function getPartCatalog() {
  const lookup = {};
  ['launchVehicles', 'spacecraft', 'instruments', 'powerSystems', 'communications', 'trajectories'].forEach((key) => {
    gameData[key].forEach((item) => {
      lookup[item.id] = item;
    });
  });
  return lookup;
}

function calculateMissionMetrics(selection, scenario) {
  const normalized = normalizeSelection(selection, scenario);
  const catalog = getPartCatalog();
  const launchVehicle = catalog[normalized.launchVehicle] || gameData.launchVehicles[0];
  const spacecraft = catalog[normalized.spacecraft] || gameData.spacecraft[0];
  const powerSystem = catalog[normalized.powerSystem] || gameData.powerSystems[0];
  const comms = catalog[normalized.comms] || gameData.communications[0];
  const trajectory = catalog[normalized.trajectory] || gameData.trajectories[0];
  const instruments = normalized.instrumentIds.map((id) => catalog[id]).filter(Boolean);

  const totalMass = launchVehicle.mass + spacecraft.mass + powerSystem.mass + comms.mass + trajectory.mass + sumValues(instruments.map((item) => item.mass));
  const totalCost = launchVehicle.cost + spacecraft.cost + powerSystem.cost + comms.cost + trajectory.cost + sumValues(instruments.map((item) => item.cost));
  const powerGeneration = powerSystem.powerGeneration * (scenario ? (scenario.id === 'mars-surface' ? 0.72 : scenario.id === 'asteroid-survey' ? 0.58 : scenario.id === 'moon-south-pole' ? 0.95 : 1.08) : 1);
  const powerConsumption = spacecraft.powerConsumption + powerSystem.powerConsumption + comms.mass * 0.3 + sumValues(instruments.map((item) => item.powerConsumption));
  const powerMargin = powerGeneration - powerConsumption;
  const dataRate = Math.min((comms.bandwidth || 0) + sumValues(instruments.map((item) => item.dataRate * 0.55)), 260);
  const storage = spacecraft.storage + sumValues(instruments.map((item) => item.storage));
  const missionDurationYears = scenario ? scenario.durationMonths / 12 : 1;
  const lifetimeYears = Math.min(spacecraft.lifetimeYears, powerSystem.lifetimeYears, missionDurationYears + 2.5);
  const reliability = productValues([launchVehicle.reliability, spacecraft.reliability, powerSystem.reliability, comms.reliability, trajectory.reliability].concat(instruments.map((item) => item.reliability)));
  const missionDelay = (comms.delay || 1) + (scenario ? scenario.maxCommsDelay * 0.15 : 0);
  const deltaV = trajectory.deltaV + spacecraft.deltaV * 0.28;

  return {
    launchVehicle,
    spacecraft,
    powerSystem,
    comms,
    trajectory,
    instruments,
    totalMass,
    totalCost,
    powerGeneration,
    powerConsumption,
    powerMargin,
    dataRate,
    storage,
    lifetimeYears,
    reliability,
    missionDelay,
    deltaV,
    scenarioId: scenario ? scenario.id : null,
    normalizedSelection: normalized
  };
}

function evaluateReadiness(selection, scenario) {
  const metrics = calculateMissionMetrics(selection, scenario);
  const checks = [];
  const sandbox = selection && selection.mode === 'sandbox';

  const budgetLimit = sandbox ? Number.MAX_SAFE_INTEGER : scenario.maxBudget;
  checks.push({
    name: 'Budget',
    pass: metrics.totalCost <= budgetLimit,
    reason: metrics.totalCost <= budgetLimit ? 'Within cost cap.' : `Mission costs ${metrics.totalCost.toFixed(0)}M, above ${scenario.maxBudget}M cap.`
  });

  const massLimit = sandbox ? Number.MAX_SAFE_INTEGER : scenario.maxMass;
  checks.push({
    name: 'Mass',
    pass: metrics.totalMass <= massLimit,
    reason: metrics.totalMass <= massLimit ? 'Launch fit is within mass limit.' : `packaged mass ${metrics.totalMass.toFixed(0)} kg exceeds limit by ${(metrics.totalMass - massLimit).toFixed(0)} kg.`
  });

  checks.push({
    name: 'Power',
    pass: metrics.powerMargin > 0,
    reason: metrics.powerMargin > 0 ? `Power margin is ${metrics.powerMargin.toFixed(0)} W.` : `Power deficit of ${Math.abs(metrics.powerMargin).toFixed(0)} W. Add solar or RTG capacity.`
  });

  checks.push({
    name: 'Data return',
    pass: metrics.dataRate >= scenario.requiredDataRate,
    reason: metrics.dataRate >= scenario.requiredDataRate ? `Data rate ${metrics.dataRate.toFixed(0)} Mb/s meets mission needs.` : `Data rate ${metrics.dataRate.toFixed(0)} Mb/s is below required ${scenario.requiredDataRate} Mb/s.`
  });

  checks.push({
    name: 'Lifetime',
    pass: metrics.lifetimeYears >= (scenario.durationMonths / 12),
    reason: metrics.lifetimeYears >= (scenario.durationMonths / 12) ? `Systems support a mission of ${scenario.durationMonths} months.` : `The bus and power system do not support the requested duration.`
  });

  checks.push({
    name: 'Comms',
    pass: metrics.missionDelay <= scenario.maxCommsDelay,
    reason: metrics.missionDelay <= scenario.maxCommsDelay ? `Comms delay remains within mission constraints.` : `Signal delay ${metrics.missionDelay.toFixed(1)} s exceeds the scenario limit of ${scenario.maxCommsDelay.toFixed(1)} s.`
  });

  return {
    checks,
    passed: checks.every((check) => check.pass),
    metrics
  };
}

function generateScenarioEvents(seed, scenario, count) {
  const rng = seededRandom(seed + scenario.name.length * 17);
  const available = gameData.eventLibrary.filter((event) => {
    return scenario.eventBias.includes(event.type) || scenario.eventBias.includes('communication') && event.type === 'communication';
  });

  const events = [];
  for (let i = 0; i < count; i += 1) {
    const index = Math.floor(rng() * available.length);
    const event = available[index] || gameData.eventLibrary[i % gameData.eventLibrary.length];
    events.push({
      ...event,
      id: `${event.id}-${i}`,
      stage: ['Launch', 'Cruise', 'Arrival', 'Operations'][i % 4],
      severity: 0.45 + rng() * 0.4
    });
  }
  return events;
}

function applyEventImpact(metrics, event, scenario) {
  const state = {
    ...metrics,
    powerGeneration: metrics.powerGeneration,
    dataRate: metrics.dataRate,
    totalCost: metrics.totalCost,
    reliability: metrics.reliability,
    storage: metrics.storage
  };

  if (event.type === 'power') {
    state.powerGeneration *= (1 - event.impact);
    state.powerMargin = state.powerGeneration - metrics.powerConsumption;
  }
  if (event.type === 'communication') {
    state.dataRate *= (1 - event.impact);
    state.storage *= 0.9;
  }
  if (event.type === 'budget') {
    state.totalCost *= (1 + event.impact * 0.4);
  }
  if (event.type === 'navigation') {
    state.deltaV *= 1.08;
    state.reliability *= 0.96;
  }
  if (event.type === 'planning') {
    state.dataRate *= 0.94;
  }

  return state;
}

function simulateMission(selection, scenario, seed) {
  const baseMetrics = calculateMissionMetrics(selection, scenario);
  const readiness = evaluateReadiness(selection, scenario);
  const events = generateScenarioEvents(seed || 77, scenario, 4);

  let state = { ...baseMetrics };
  const timeline = [
    { stage: 'Launch', status: 'Nominal', detail: `The ${baseMetrics.launchVehicle.name} delivers the mission to the planned route.` },
    { stage: 'Cruise', status: 'Nominal', detail: `Power and thermal margins are stable during the transit phase.` }
  ];

  events.forEach((event, index) => {
    const previous = { ...state };
    state = applyEventImpact(state, event, scenario);
    const eventText = `${event.title}: ${event.description}`;

    const status = state.powerMargin > 0 && state.dataRate > scenario.requiredDataRate ? 'Recovered' : 'Warning';
    timeline.push({
      stage: event.stage,
      status,
      detail: eventText + ` Mission response: ${status === 'Recovered' ? 'the design absorbs the disturbance.' : 'margins are strained and science must be reduced.'}`,
      previous,
      current: state
    });
  });

  const scienceReturn = clamp(
    ((state.dataRate / Math.max(1, scenario.requiredDataRate)) * 48 +
      (state.powerMargin / Math.max(1, scenario.requiredPower)) * 32 +
      (state.reliability * 100) * 0.2),
    0,
    100
  );

  const efficiency = clamp(
    (100 - Math.abs(state.totalCost - scenario.maxBudget) * 0.045) +
      (state.powerMargin / Math.max(60, scenario.requiredPower)) * 20,
    0,
    100
  );

  const missionScore = Math.round(clamp(scienceReturn * 0.6 + efficiency * 0.25 + state.reliability * 100 * 0.15, 0, 100));
  const success = readiness.passed && missionScore >= scenario.scienceTarget;

  return {
    readiness,
    baseMetrics,
    state,
    events,
    timeline,
    scienceReturn: Math.round(scienceReturn),
    efficiency: Math.round(efficiency),
    missionScore,
    success,
    debrief: success
      ? 'The mission succeeds because the design respects the most sensitive constraints: power, data return and reliability are all above the minimum threshold.'
      : 'The mission underperforms because at least one subsystem was too marginal for the chosen mission profile; the design needs more margin or fewer science instruments.'
  };
}

function getTutorialConcepts() {
  return gameData.education;
}

window.gameLogic = {
  calculateMissionMetrics,
  evaluateReadiness,
  simulateMission,
  getTutorialConcepts
};
