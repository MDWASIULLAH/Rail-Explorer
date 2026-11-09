/**
 * Live Train Running Status & Animated Railway Timeline Engine Tests
 */

const test = require('node:test');
const assert = require('node:assert');

test('Live Tracking Engine: Status & Timeline Calculations', async (t) => {
  const { analyzeLiveJourney, formatDelay } = require('../src/lib/live-tracking-engine.ts');
  const { KNOWN_TRAINS, getSimulatedStatus } = require('../src/data/train-directory.ts');

  const sampleTrain = KNOWN_TRAINS['18403']; // 10 stations
  const sampleStatus = getSimulatedStatus('18403');

  await t.test('Computes journey analysis with all stations in sequence', () => {
    const analysis = analyzeLiveJourney('18403', sampleTrain.trainName, sampleTrain, sampleStatus, 'Today');
    assert.ok(analysis);
    assert.strictEqual(analysis.trainNumber, '18403');
    assert.strictEqual(analysis.timeline.length, sampleTrain.schedule.length);
    assert.strictEqual(analysis.origin.code, 'BBS');
    assert.strictEqual(analysis.destination.code, 'DHN');
  });

  await t.test('Assigns correct sequential states (COMPLETED, CURRENT, UPCOMING)', () => {
    const analysis = analyzeLiveJourney('18403', sampleTrain.trainName, sampleTrain, sampleStatus, 'Today');
    const states = analysis.timeline.map((s) => s.state);
    
    // There should be at least one completed or current station
    assert.ok(states.includes('COMPLETED') || states.includes('CURRENT'));
    // There should be upcoming stations
    assert.ok(states.includes('UPCOMING'));

    // Verify ordering: once upcoming starts, no previous completed stations should follow
    let sawUpcoming = false;
    for (const state of states) {
      if (state === 'UPCOMING') sawUpcoming = true;
      if (sawUpcoming) {
        assert.notStrictEqual(state, 'COMPLETED');
      }
    }
  });

  await t.test('Calculates live position between stations accurately', () => {
    const analysis = analyzeLiveJourney('18403', sampleTrain.trainName, sampleTrain, sampleStatus, 'Today');
    const pos = analysis.position;
    assert.ok(pos.distanceToNextKm > 0);
    assert.ok(pos.stretchTotalKm >= pos.distanceToNextKm);
    assert.ok(pos.progressPercentInStretch >= 0 && pos.progressPercentInStretch <= 100);
    assert.ok(pos.overallProgressPercent >= 0 && pos.overallProgressPercent <= 100);
  });

  await t.test('Formats delay text correctly', () => {
    const onTime = formatDelay(1);
    assert.strictEqual(onTime.isDelayed, false);
    assert.strictEqual(onTime.text, 'Running On Time');

    const minorLate = formatDelay(25);
    assert.strictEqual(minorLate.isDelayed, true);
    assert.strictEqual(minorLate.text, 'Running late by 25 min');

    const majorLate = formatDelay(246);
    assert.strictEqual(majorLate.isDelayed, true);
    assert.strictEqual(majorLate.text, 'Running late by 4h 6m');
  });

  await t.test('Computes passedStationText, approachingStationText, and live velocity', () => {
    const analysis = analyzeLiveJourney('18403', sampleTrain.trainName, sampleTrain, sampleStatus, 'Today');
    const pos = analysis.position;
    assert.ok(pos.passedStationText);
    assert.ok(pos.passedStationText.includes('Passed') || pos.passedStationText.includes('Platform'));
    assert.ok(pos.approachingStationText);
    assert.ok(pos.approachingStationText.includes('km to'));
    assert.ok(typeof pos.speedKmph === 'number');
    assert.ok(pos.speedKmph > 0);
  });

  await t.test('Tracks Malwa Express (12919) with real corridor stations', () => {
    const malwa = KNOWN_TRAINS['12919'];
    assert.ok(malwa);
    assert.strictEqual(malwa.origin.code, 'DADN');
    assert.strictEqual(malwa.destination.code, 'SVDK');

    const liveStatus12919 = {
      trainNumber: '12919',
      trainName: 'MALWA EXPRESS',
      journeyDate: '2026-11-09',
      status: 'RUNNING',
      previousStation: { code: 'FDB', name: 'Faridabad' },
      currentStation: { code: 'TKD', name: 'Tuglakabad' },
      nextStation: { code: 'NZM', name: 'Hazrat Nizamuddin Jn' },
      speedKmph: 95,
      delayMinutes: 0,
      routeProgress: { completedStops: 29, remainingStops: 21, totalStops: 50 },
    };

    const analysis = analyzeLiveJourney('12919', malwa.trainName, malwa, liveStatus12919, 'Today');
    assert.strictEqual(analysis.position.previousStationCode, 'FDB');
    assert.strictEqual(analysis.position.nextStationCode, 'TKD');
    assert.strictEqual(analysis.position.speedKmph, 95);
    assert.ok(analysis.position.passedStationText.includes('Faridabad'));
    assert.ok(analysis.position.approachingStationText.includes('Tuglakabad') || analysis.position.approachingStationText.includes('TKD'));
  });

  await t.test('Assigns verified coordinates to every station', () => {
    const analysis = analyzeLiveJourney('18403', sampleTrain.trainName, sampleTrain, sampleStatus, 'Today');
    for (const stn of analysis.timeline) {
      assert.ok(Array.isArray(stn.coordinates));
      assert.strictEqual(stn.coordinates.length, 2);
      assert.ok(stn.coordinates[0] >= 8 && stn.coordinates[0] <= 37); // India Lat range
      assert.ok(stn.coordinates[1] >= 68 && stn.coordinates[1] <= 98); // India Lng range
    }
  });
});

test('Indian Railway Map Engine: OpenFreeMap & OpenRailwayMap Configuration', async (t) => {
  const { MAP_CONFIG } = require('../src/config/map-config.ts');

  await t.test('Base styles provide zero-key OpenFreeMap vector endpoints', () => {
    assert.ok(MAP_CONFIG.baseStyles.dark);
    assert.ok(MAP_CONFIG.baseStyles.liberty);
    assert.ok(MAP_CONFIG.baseStyles.bright);
    assert.ok(MAP_CONFIG.baseStyles.positron);

    assert.strictEqual(MAP_CONFIG.baseStyles.dark.styleUrl, 'https://tiles.openfreemap.org/styles/dark');
    assert.strictEqual(MAP_CONFIG.baseStyles.liberty.styleUrl, 'https://tiles.openfreemap.org/styles/liberty');
    assert.ok(!MAP_CONFIG.baseStyles.dark.styleUrl.includes('key'));
    assert.ok(!MAP_CONFIG.baseStyles.dark.styleUrl.includes('token'));
  });

  await t.test('Railway infrastructure layers provide valid OpenRailwayMap overlays', () => {
    assert.ok(MAP_CONFIG.railwayOverlays.standard);
    assert.ok(MAP_CONFIG.railwayOverlays.electrified);
    assert.ok(MAP_CONFIG.railwayOverlays.maxspeed);

    assert.ok(MAP_CONFIG.railwayOverlays.standard.tileUrl.includes('openrailwaymap.org/standard'));
    assert.ok(MAP_CONFIG.railwayOverlays.electrified.tileUrl.includes('openrailwaymap.org/electrified'));
    assert.deepStrictEqual(MAP_CONFIG.railwayOverlays.standard.subdomains, ['a', 'b', 'c']);
  });

  await t.test('Attributions provide proper OSM, OpenFreeMap, and OpenRailwayMap credits', () => {
    assert.ok(MAP_CONFIG.baseStyles.dark.attribution.includes('OpenFreeMap'));
    assert.ok(MAP_CONFIG.baseStyles.dark.attribution.includes('OpenStreetMap'));
    assert.ok(MAP_CONFIG.railwayAttribution.includes('OpenRailwayMap'));
  });

  await t.test('Default center is positioned in India', () => {
    const [lng, lat] = MAP_CONFIG.defaultCenter;
    assert.ok(lng >= 68 && lng <= 98);
    assert.ok(lat >= 8 && lat <= 37);
  });
});

