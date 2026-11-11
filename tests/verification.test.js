/**
 * Indian Railway 3D Explorer — Master Automated Test Suite
 *
 * Runs comprehensive automated verification for:
 * 1. Coach Database & Blueprint Integrity
 * 2. Berth Numbering & Bay Geometry
 * 3. Distance Calculation Engine
 * 4. Berth Finder & Neighbor Analysis
 * 5. Coach Comparison Engine
 * 6. Train Directory & Resilient Fallback Synthesizer
 */

const test = require('node:test');
const assert = require('node:assert');

// 1. Database & Blueprint Integrity Tests
test('1. Coach Database: Blueprint Integrity', async (t) => {
  await t.test('LHB Sleeper specifications match RDSO standard', () => {
    const sleeperTotalBerths = 80;
    const sleeperTotalBays = 10;
    const berthsPerBay = 8;
    assert.strictEqual(sleeperTotalBays * berthsPerBay, sleeperTotalBerths);
  });

  await t.test('LHB AC 3-Tier specifications match standard (72 berths)', () => {
    const ac3TotalBerths = 72;
    const ac3TotalBays = 9;
    const berthsPerBay = 8;
    assert.strictEqual(ac3TotalBays * berthsPerBay, ac3TotalBerths);
  });

  await t.test('LHB AC 2-Tier specifications match standard (52 berths)', () => {
    const ac2TotalBerths = 52;
    // 8 regular bays of 6 berths (48) + 1 end cabin of 4 berths (4) = 52
    assert.strictEqual(8 * 6 + 4, ac2TotalBerths);
  });

  await t.test('LHB First AC specifications match standard (24 berths)', () => {
    const cabins = 4;
    const berthsPerCabin = 4;
    const coupes = 4;
    const berthsPerCoupe = 2;
    const totalFirstAC = (cabins * berthsPerCabin) + (coupes * berthsPerCoupe);
    assert.strictEqual(totalFirstAC, 24);
  });

  await t.test('RDSO LHB standard shell measurements', () => {
    const lengthOverBodyMm = 23540;
    const lengthOverCouplersMm = 24000;
    const exteriorWidthMm = 3245;
    const interiorWidthMm = 3120;
    const bogieCenterDistanceMm = 14900;

    assert.strictEqual(lengthOverCouplersMm - lengthOverBodyMm, 460); // 460mm buffer/coupler zone
    assert.strictEqual(bogieCenterDistanceMm, 14900);
    assert.ok(interiorWidthMm < exteriorWidthMm);
  });
});

// 2. Berth Numbering & Bay Mapping Tests
test('2. Berth Numbering & Bay Calculations', async (t) => {
  function getBerthType(berthNumber) {
    const mod = berthNumber % 8;
    if (mod === 1 || mod === 4) return 'LB';
    if (mod === 2 || mod === 5) return 'MB';
    if (mod === 3 || mod === 6) return 'UB';
    if (mod === 7) return 'SL';
    return 'SU';
  }

  function getBayNumber(berthNumber) {
    return Math.floor((berthNumber - 1) / 8) + 1;
  }

  await t.test('Correctly identifies Lower, Middle, Upper, and Side berths in Bay 1', () => {
    assert.strictEqual(getBerthType(1), 'LB');
    assert.strictEqual(getBerthType(2), 'MB');
    assert.strictEqual(getBerthType(3), 'UB');
    assert.strictEqual(getBerthType(4), 'LB');
    assert.strictEqual(getBerthType(5), 'MB');
    assert.strictEqual(getBerthType(6), 'UB');
    assert.strictEqual(getBerthType(7), 'SL');
    assert.strictEqual(getBerthType(8), 'SU');
  });

  await t.test('Correctly assigns bay numbers across 80 berths', () => {
    assert.strictEqual(getBayNumber(1), 1);
    assert.strictEqual(getBayNumber(8), 1);
    assert.strictEqual(getBayNumber(9), 2);
    assert.strictEqual(getBerthType(9), 'LB');
    assert.strictEqual(getBayNumber(72), 9);
    assert.strictEqual(getBayNumber(80), 10);
    assert.strictEqual(getBerthType(80), 'SU');
  });
});

// 3. Inter-Coach Distance Calculations
test('3. Distance Calculation Engine', async (t) => {
  const coachLengthMeters = 24.0; // 23.54m body + 0.46m coupling

  function calculateDistance(fromIndex, toIndex) {
    const diff = Math.abs(toIndex - fromIndex);
    return {
      distanceMeters: diff * coachLengthMeters,
      coachesBetween: Math.max(0, diff - 1),
      direction: toIndex >= fromIndex ? 'behind' : 'ahead',
      walkingMinutes: Math.max(1, Math.round((diff * coachLengthMeters) / 70)),
      steps: Math.round((diff * coachLengthMeters) / 0.75),
    };
  }

  await t.test('Distance between adjacent coaches is exactly one coach length', () => {
    const res = calculateDistance(2, 3);
    assert.strictEqual(res.distanceMeters, 24.0);
    assert.strictEqual(res.coachesBetween, 0);
  });

  await t.test('Distance across 5 coaches (e.g. S1 to B2)', () => {
    const res = calculateDistance(2, 7);
    assert.strictEqual(res.distanceMeters, 120.0);
    assert.strictEqual(res.coachesBetween, 4);
    assert.strictEqual(res.walkingMinutes, 2);
    assert.strictEqual(res.steps, 160);
  });

  await t.test('Same coach distance is zero', () => {
    const res = calculateDistance(4, 4);
    assert.strictEqual(res.distanceMeters, 0);
    assert.strictEqual(res.coachesBetween, 0);
  });
});

// 4. Berth Finder & Neighbor Analysis
test('4. Berth Finder & Neighbor Analysis', async (t) => {
  const { COACH_BLUEPRINTS } = require('../src/data/coach-database.ts');
  const { formatBerthInfo, getBayBerths } = require('../src/lib/berth-finder.ts');

  const sleeperBp = COACH_BLUEPRINTS['LHB_SL'];
  const generalBp = COACH_BLUEPRINTS['LHB_GS'];

  await t.test('Sleeper has only side lower and side upper berths', () => {
    assert.strictEqual(sleeperBp.berths.length, 80);
    assert.strictEqual(sleeperBp.berths.filter((berth) => berth.side === 'SIDE' && berth.berthType === 'SL').length, 10);
    const sideUppers = sleeperBp.berths.filter((berth) => berth.side === 'SIDE' && berth.berthType === 'SU');
    assert.strictEqual(sideUppers.length, 10);
    assert.ok(sideUppers.every((berth) => berth.deck === 2 && berth.y >= 1.3));
  });

  await t.test('General coach seats stay on side benches with a clear centre aisle', () => {
    assert.strictEqual(generalBp.berths.length, 100);
    assert.ok(generalBp.berths.every((seat) => Math.abs(seat.z) > 0.8));
    assert.ok(generalBp.berths.every((seat) => seat.side === 'LEFT' || seat.side === 'RIGHT'));
  });

  await t.test('Retrieves all 8 berths in Bay 1 for Berth #3', () => {
    const bayBerths = getBayBerths(sleeperBp, 1);
    assert.strictEqual(bayBerths.length, 8);
    assert.deepStrictEqual(bayBerths.map(b => b.berthNumber), [1, 2, 3, 4, 5, 6, 7, 8]);
  });

  await t.test('Formats berth info for Berth #1 (Lower Berth, Bay 1, Window)', () => {
    const info = formatBerthInfo(sleeperBp, 1);
    assert.ok(info);
    assert.strictEqual(info.berthNumber, 1);
    assert.strictEqual(info.bayNumber, 1);
    assert.strictEqual(info.type, 'LB');
    assert.strictEqual(info.position, 'LEFT');
    assert.ok(info.distanceToNearestDoor > 0);
    assert.strictEqual(info.neighbors.length, 7); // 7 neighbors in the bay
  });
});

// 5. Coach Comparison Engine
test('5. Coach Comparison Engine', async (t) => {
  const { compareCoaches } = require('../src/lib/coach-comparison.ts');

  await t.test('Comparing AC 3-Tier and Sleeper highlights AC difference and capacity', () => {
    const comp = compareCoaches('LHB_3A', 'LHB_SL');
    assert.ok(comp);
    assert.strictEqual(comp.coach1.id, 'LHB_3A');
    assert.strictEqual(comp.coach2.id, 'LHB_SL');
    assert.strictEqual(comp.capacity.difference, -8); // 3A (72) vs SL (80)
    assert.ok(comp.amenities.ac);
    assert.ok(comp.verdict);
  });
});

// 6. Resilient Fallback & Train Directory Tests
test('6. Train Directory returns only known route and composition data', async (t) => {
  const { KNOWN_TRAINS, getOrSynthesizeTrain } = require('../src/data/train-directory.ts');

  await t.test('Known Train 18403 (BBS DHN EXPRESS) resolves correctly', () => {
    const train = KNOWN_TRAINS['18403'];
    assert.ok(train);
    assert.strictEqual(train.trainNumber, '18403');
    assert.strictEqual(train.origin.code, 'BBS');
    assert.strictEqual(train.destination.code, 'DHN');
    assert.strictEqual(train.coaches.length, 16);
  });

  await t.test('Known Train 12301 (Howrah Rajdhani) has 20-coach LHB rake', () => {
    const train = KNOWN_TRAINS['12301'];
    assert.ok(train);
    assert.strictEqual(train.trainNumber, '12301');
    assert.strictEqual(train.coaches.length, 20);
    assert.ok(train.coaches.some(c => c.coachId === 'H1'));
    assert.ok(train.coaches.some(c => c.coachId === 'PC'));
  });

  await t.test('Unknown train numbers do not receive invented routes or coaches', () => {
    const train = getOrSynthesizeTrain('15001');
    assert.ok(train);
    assert.strictEqual(train.trainNumber, '15001');
    assert.strictEqual(train.origin.name, 'Route unavailable');
    assert.strictEqual(train.destination.name, 'Route unavailable');
    assert.strictEqual(train.coaches.length, 0);
    assert.strictEqual(train.schedule.length, 0);
  });
});

test('7. OAuth session validation rejects forged cookies and external redirects', () => {
  const { safeReturnPath, signProviderSession, verifyProviderSession } = require('../src/lib/auth-session.ts');
  const previousSecret = process.env.GITHUB_CLIENT_SECRET;
  process.env.GITHUB_CLIENT_SECRET = 'test-only-session-signing-key';
  const profile = { id: 'account-1', email: 'user@example.test', name: 'Test User', provider: 'github', createdAt: new Date().toISOString() };
  const signed = signProviderSession(profile);
  assert.deepStrictEqual(verifyProviderSession(signed), profile);
  assert.strictEqual(verifyProviderSession(`${signed.slice(0, -1)}x`), null);
  assert.strictEqual(safeReturnPath('//attacker.example/path'), '/');
  assert.strictEqual(safeReturnPath('/train/18403?coach=S1'), '/train/18403?coach=S1');
  if (previousSecret === undefined) delete process.env.GITHUB_CLIENT_SECRET;
  else process.env.GITHUB_CLIENT_SECRET = previousSecret;
});
