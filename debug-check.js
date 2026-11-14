const fs = require('fs');
const vm = require('vm');

global.window = global;
const code = fs.readFileSync('data.js', 'utf8') + '\n' + fs.readFileSync('gameLogic.js', 'utf8');
vm.runInNewContext(code, global);

const defaults = {
  'moon-south-pole': { launchVehicle: 'ariane-6', spacecraft: 'heavy-lab', powerSystem: 'hybrid', comms: 'relay-link', trajectory: 'lunar-flyby', instrumentIds: ['camera', 'spectrometer', 'laser-altimeter', 'thermal-imager'] },
  'mars-surface': { launchVehicle: 'falcon-heavy', spacecraft: 'heavy-lab', powerSystem: 'rtg', comms: 'deep-space', trajectory: 'transfer', instrumentIds: ['camera', 'spectrometer', 'radar', 'thermal-imager'] },
  'asteroid-survey': { launchVehicle: 'ariane-6', spacecraft: 'heavy-lab', powerSystem: 'rtg', comms: 'deep-space', trajectory: 'asteroid-rendezvous', instrumentIds: ['camera', 'spectrometer', 'radar', 'thermal-imager'] },
  'earth-observation': { launchVehicle: 'atlas-v', spacecraft: 'explorer', powerSystem: 'solar-array', comms: 'direct-earth', trajectory: 'low-orbit', instrumentIds: ['camera', 'spectrometer', 'thermal-imager'] }
};

for (const [id, selection] of Object.entries(defaults)) {
  const scenario = gameData.scenarios.find((item) => item.id === id);
  const readiness = gameLogic.evaluateReadiness(selection, scenario);
  const result = gameLogic.simulateMission(selection, scenario, 77);
  console.log(`${id}: readiness=${readiness.passed} success=${result.success} score=${result.missionScore} reliability=${result.state.reliability.toFixed(3)} data=${result.state.dataRate.toFixed(2)} power=${result.state.powerMargin.toFixed(2)}`);
  console.log(readiness.checks.map((item) => `${item.name}:${item.pass}`).join(' | '));
}
