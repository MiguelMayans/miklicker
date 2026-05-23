import { createInitialState, getState, updateState } from './src/state.js';
import { calculateClickPower } from './src/engine/formulas.js';

console.log('=== TEST STATE FLOW ===');

const initial = createInitialState();
console.log('1. Initial energy:', initial.energy);
console.log('1. Initial clickPower:', initial.clickPower);

updateState({ energy: 1, totalClicks: 1, totalEnergyEarned: 1 });
const after = getState();
console.log('2. After update energy:', after.energy);
console.log('2. After update totalClicks:', after.totalClicks);

const power = calculateClickPower(after);
console.log('3. Click power:', power);

updateState({ energy: after.energy + power, totalClicks: after.totalClicks + 1, totalEnergyEarned: after.totalEnergyEarned + power });
const final = getState();
console.log('4. Final energy:', final.energy);
console.log('4. Final totalClicks:', final.totalClicks);

console.log('=== TEST PASSED ===');
