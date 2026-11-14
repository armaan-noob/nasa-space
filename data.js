const gameData = {
  roles: [
    { id: 'mission-director', name: 'Mission Director', focus: 'Mission goals, schedule, risk posture.' },
    { id: 'systems-engineer', name: 'Systems Engineer', focus: 'Mass, power, reliability, margins.' },
    { id: 'science-lead', name: 'Science Lead', focus: 'Instrument selection and data return.' },
    { id: 'flight-operations', name: 'Flight Operations', focus: 'Communications, commands and anomalies.' }
  ],

  scenarios: [
    {
      id: 'moon-south-pole',
      name: 'Moon South Pole Ice Prospecting',
      difficulty: 'Medium',
      objective: 'Locate and characterize water ice in permanently shadowed regions and map surface mobility hazards.',
      environment: 'Low gravity, thermal extremes, no atmosphere, lunar night cycles.',
      scienceTarget: 80,
      durationMonths: 18,
      maxBudget: 3400,
      maxMass: 5200,
      requiredPower: 650,
      requiredDataRate: 120,
      maxCommsDelay: 2.5,
      tags: ['Lunar', 'Resource prospecting', 'Surface robotics'],
      baseMissionCost: 1450,
      dc: 1.0,
      eventBias: ['thermal', 'power', 'communication']
    },
    {
      id: 'mars-surface',
      name: 'Mars Surface Geology Campaign',
      difficulty: 'High',
      objective: 'Measure subsurface chemistry, weather and terrain while maintaining a robust communications link to Earth.',
      environment: 'Dust storms, long signal delay, reduced solar intensity at Mars distance.',
      scienceTarget: 92,
      durationMonths: 30,
      maxBudget: 4300,
      maxMass: 5800,
      requiredPower: 950,
      requiredDataRate: 180,
      maxCommsDelay: 18,
      tags: ['Mars', 'Surface science', 'Long delay'],
      baseMissionCost: 1850,
      dc: 0.64,
      eventBias: ['power', 'dust', 'communication']
    },
    {
      id: 'asteroid-survey',
      name: 'Asteroid Survey and Resource Mapping',
      difficulty: 'Medium',
      objective: 'Survey a carbon-rich near-Earth object, map its composition and determine spin rate and surface hazards.',
      environment: 'Low gravity, microgravity, limited solar heating, deep-space communications.',
      scienceTarget: 78,
      durationMonths: 24,
      maxBudget: 3100,
      maxMass: 4700,
      requiredPower: 700,
      requiredDataRate: 100,
      maxCommsDelay: 20,
      tags: ['Deep space', 'NEO', 'Microgravity'],
      baseMissionCost: 1325,
      dc: 0.55,
      eventBias: ['navigation', 'power', 'communication']
    },
    {
      id: 'earth-observation',
      name: 'Earth Observation Orbit',
      difficulty: 'Low',
      objective: 'Monitor atmospheric chemistry, ocean color and wildfire risk with a balanced high-capacity payload.',
      environment: 'Sun-synchronous orbit, frequent imaging, rapid data downlink, moderate thermal load.',
      scienceTarget: 70,
      durationMonths: 12,
      maxBudget: 2600,
      maxMass: 4000,
      requiredPower: 600,
      requiredDataRate: 90,
      maxCommsDelay: 1.2,
      tags: ['Earth orbit', 'Remote sensing', 'Operational'],
      baseMissionCost: 1180,
      dc: 1.2,
      eventBias: ['communication', 'power', 'planning']
    }
  ],

  launchVehicles: [
    { id: 'atlas-v', name: 'Atlas V 541', cost: 700, mass: 220, reliability: 0.9, capacity: 5200, description: 'Reliable medium-lift launcher with ample mass margin.' },
    { id: 'falcon-heavy', name: 'Falcon Heavy', cost: 820, mass: 260, reliability: 0.88, capacity: 6100, description: 'High capacity at the cost of tighter schedule risk.' },
    { id: 'ariane-6', name: 'Ariane 6', cost: 760, mass: 235, reliability: 0.91, capacity: 5600, description: 'Strong heavy-lift option for science missions with good launch margin.' },
    { id: 'small-sat', name: 'SmallSat Launch', cost: 420, mass: 110, reliability: 0.84, capacity: 3600, description: 'Low-cost launch but limits mission mass and power.' }
  ],

  spacecraft: [
    { id: 'scout', name: 'Scout Bus', cost: 540, mass: 290, powerConsumption: 120, reliability: 0.86, lifetimeYears: 2.5, storage: 250, deltaV: 780, description: 'Fast to build and light enough for cost-sensitive missions.' },
    { id: 'explorer', name: 'Explorer Bus', cost: 720, mass: 360, powerConsumption: 155, reliability: 0.9, lifetimeYears: 4, storage: 350, deltaV: 980, description: 'Balanced bus with strong thermal management and longer lifetime.' },
    { id: 'heavy-lab', name: 'Heavy Science Lab', cost: 930, mass: 520, powerConsumption: 200, reliability: 0.88, lifetimeYears: 5, storage: 500, deltaV: 1100, description: 'High capability bus ideal for larger payloads and longer missions.' },
    { id: 'nano-probe', name: 'Nano Probe', cost: 390, mass: 180, powerConsumption: 85, reliability: 0.8, lifetimeYears: 1.5, storage: 180, deltaV: 620, description: 'Very light but limited in storage and lifetime.' }
  ],

  instruments: [
    { id: 'camera', name: 'Stereo Camera', cost: 210, mass: 28, powerConsumption: 38, dataRate: 40, reliability: 0.94, storage: 70, description: 'High-resolution images of terrain and targets.' },
    { id: 'spectrometer', name: 'Spectrometer', cost: 300, mass: 35, powerConsumption: 50, dataRate: 55, reliability: 0.92, storage: 80, description: 'Identifies minerals, ice and atmospheric chemistry.' },
    { id: 'laser-altimeter', name: 'Laser Altimeter', cost: 350, mass: 42, powerConsumption: 60, dataRate: 28, reliability: 0.9, storage: 65, description: 'Maps topography and surface roughness.' },
    { id: 'magnetometer', name: 'Magnetometer', cost: 180, mass: 22, powerConsumption: 20, dataRate: 10, reliability: 0.96, storage: 18, description: 'Measures magnetic fields and local plasma environment.' },
    { id: 'seismometer', name: 'Seismometer', cost: 260, mass: 24, powerConsumption: 25, dataRate: 22, reliability: 0.89, storage: 40, description: 'Detects internal structure and ground motion.' },
    { id: 'drill', name: 'Core Drill', cost: 550, mass: 70, powerConsumption: 120, dataRate: 18, reliability: 0.82, storage: 30, description: 'Collects subsurface samples, but adds mass and power requirements.' },
    { id: 'thermal-imager', name: 'Thermal Imager', cost: 240, mass: 20, powerConsumption: 32, dataRate: 24, reliability: 0.95, storage: 38, description: 'Maps thermal gradients and local temperature variation.' },
    { id: 'radar', name: 'SAR Radar', cost: 480, mass: 58, powerConsumption: 72, dataRate: 68, reliability: 0.88, storage: 78, description: 'Penetrates cloud cover or dust for terrain mapping.' }
  ],

  powerSystems: [
    { id: 'solar-array', name: 'Solar Array', cost: 210, mass: 85, powerGeneration: 920, powerConsumption: 0, reliability: 0.92, lifetimeYears: 5, description: 'Best for missions near the Sun or in Earth orbit.' },
    { id: 'solar-compact', name: 'Compact Solar Array', cost: 150, mass: 58, powerGeneration: 680, powerConsumption: 0, reliability: 0.9, lifetimeYears: 3.5, description: 'Lower mass but less margin for long-distance or high-power missions.' },
    { id: 'rtg', name: 'RTG Power', cost: 640, mass: 115, powerGeneration: 540, powerConsumption: 0, reliability: 0.87, lifetimeYears: 7, description: 'Useful for outer solar system missions and stable power independent of sunlight.' },
    { id: 'hybrid', name: 'Hybrid Solar + Battery', cost: 360, mass: 100, powerGeneration: 760, powerConsumption: 0, reliability: 0.91, lifetimeYears: 4.5, description: 'Balanced approach with some energy storage for peak loads.' }
  ],

  communications: [
    { id: 'direct-earth', name: 'Direct to Earth', cost: 300, mass: 40, bandwidth: 95, delay: 1.2, reliability: 0.88, description: 'Simple path with lower latency but high antenna pointing demands.' },
    { id: 'relay-link', name: 'Relay Relay Network', cost: 420, mass: 50, bandwidth: 130, delay: 2.0, reliability: 0.92, description: 'More robust communications for long-distance missions.' },
    { id: 'high-gain', name: 'High-Gain Dish', cost: 520, mass: 62, bandwidth: 170, delay: 1.6, reliability: 0.9, description: 'Large data rate for high-resolution science and frequent downlinks.' },
    { id: 'deep-space', name: 'Deep Space Network', cost: 610, mass: 55, bandwidth: 150, delay: 12, reliability: 0.94, description: 'Best for Mars and beyond; strong long-distance capability.' }
  ],

  trajectories: [
    { id: 'low-orbit', name: 'Low Earth Orbit', cost: 120, mass: 18, deltaV: 420, reliability: 0.94, description: 'Low cost, efficient operations for Earth-observation missions.' },
    { id: 'transfer', name: 'Hohmann Transfer', cost: 190, mass: 30, deltaV: 660, reliability: 0.9, description: 'Standard interplanetary transfer with moderate propellant demands.' },
    { id: 'direct-injection', name: 'Direct Injection', cost: 240, mass: 34, deltaV: 760, reliability: 0.88, description: 'Fast interplanetary transfer but less fuel margin for mission surprises.' },
    { id: 'lunar-flyby', name: 'Lunar Flyby', cost: 150, mass: 25, deltaV: 500, reliability: 0.92, description: 'Efficient route for lunar polar missions and low-energy transfers.' },
    { id: 'asteroid-rendezvous', name: 'Asteroid Rendezvous', cost: 200, mass: 36, deltaV: 720, reliability: 0.89, description: 'Close approach and approach correction for NEO science operations.' }
  ],

  eventLibrary: [
    { id: 'solar-flare', type: 'power', title: 'Solar flare', description: 'A flare temporarily reduces power generation and forces a safe mode for a part of the mission.', impact: 0.22 },
    { id: 'comms-drift', type: 'communication', title: 'Antenna drift', description: 'Small pointing error reduces communications efficiency and increases data loss.', impact: 0.18 },
    { id: 'budget-cut', type: 'budget', title: 'Budget constraint', description: 'Operations budget is reduced after a review, requiring a leaner mission plan.', impact: 0.12 },
    { id: 'thermal-cycle', type: 'power', title: 'Thermal cycling', description: 'Temperature swings affect electronics and reduce power margin on cold nights or hot days.', impact: 0.16 },
    { id: 'dust-storm', type: 'power', title: 'Dust storm', description: 'Dust deposition reduces solar panel efficiency and threatens power generation.', impact: 0.24 },
    { id: 'navigation-issue', type: 'navigation', title: 'Navigation correction', description: 'A trajectory correction maneuver consumes propellant and threatens mission margin.', impact: 0.13 },
    { id: 'data-backlog', type: 'communication', title: 'Data backlog', description: 'The science instruments produce more data than planned; onboard storage and data return become constraints.', impact: 0.2 }
  ],

  education: [
    {
      title: 'Delta-v matters',
      text: 'Changing trajectory choice can significantly change the velocity needed to reach an objective. Every kilogram of propellant is expensive and difficult to carry.'
    },
    {
      title: 'Solar power falls with distance',
      text: 'The intensity of sunlight drops roughly with the square of distance from the Sun. That is why Mars missions need more careful power planning than Earth orbiting systems.'
    },
    {
      title: 'Comms, data and storage are linked',
      text: 'More instruments produce more data. If the communications link cannot carry it down, data must be stored or discarded. Storage is not free and can become the limiting factor.'
    },
    {
      title: 'Reliability is a subsystem trade',
      text: 'In spaceflight, a simple, robust architecture often beats a flashy but fragile high-performance design. A mission can fail by one weak component.'
    }
  ]
};

window.gameData = gameData;
