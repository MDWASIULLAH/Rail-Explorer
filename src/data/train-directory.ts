/**
 * Curated Indian Railways train directory
 *
 * Offline entries are a limited reference set. Unknown train numbers are not guessed.
 */


export interface KnownTrain {
  trainNumber: string;
  trainName: string;
  type: string;
  origin: { code: string; name: string };
  destination: { code: string; name: string };
  classes: string[];
  rakeType: 'LHB' | 'ICF' | 'VANDE_BHARAT' | 'UNKNOWN';
  coaches: Array<{ coachId: string; coachType: string; berthCount: number }>;
  schedule: Array<{
    stationCode: string;
    stationName: string;
    arrivalTime: string | null;
    departureTime: string | null;
    haltMinutes: number;
    distance: number;
    day: number;
    isPassingHalt?: boolean;
  }>;
}

export const KNOWN_TRAINS: Record<string, KnownTrain> = {
  // 18403: BBS DHN EXPRESS (Bhubaneswar to Dhanbad Jn)
  '18403': {
    trainNumber: '18403',
    trainName: 'BBS DHN EXPRESS',
    type: 'Express',
    origin: { code: 'BBS', name: 'Bhubaneswar' },
    destination: { code: 'DHN', name: 'Dhanbad Jn' },
    classes: ['1A', '2A', '3A', 'SL', 'GEN'],
    rakeType: 'LHB',
    coaches: [
      { coachId: 'EOG1', coachType: 'EOG', berthCount: 0 },
      { coachId: 'GS1', coachType: 'GS', berthCount: 100 },
      { coachId: 'S1', coachType: 'SL', berthCount: 80 },
      { coachId: 'S2', coachType: 'SL', berthCount: 80 },
      { coachId: 'S3', coachType: 'SL', berthCount: 80 },
      { coachId: 'S4', coachType: 'SL', berthCount: 80 },
      { coachId: 'B1', coachType: '3A', berthCount: 72 },
      { coachId: 'B2', coachType: '3A', berthCount: 72 },
      { coachId: 'B3', coachType: '3A', berthCount: 72 },
      { coachId: 'A1', coachType: '2A', berthCount: 52 },
      { coachId: 'H1', coachType: '1A', berthCount: 24 },
      { coachId: 'PC', coachType: 'PC', berthCount: 0 },
      { coachId: 'S5', coachType: 'SL', berthCount: 80 },
      { coachId: 'S6', coachType: 'SL', berthCount: 80 },
      { coachId: 'GS2', coachType: 'GS', berthCount: 100 },
      { coachId: 'SLR', coachType: 'SLR', berthCount: 0 },
    ],
    schedule: [
      { stationCode: 'BBS', stationName: 'Bhubaneswar', arrivalTime: null, departureTime: '21:00', haltMinutes: 0, distance: 0, day: 1 },
      { stationCode: 'MCS', stationName: 'Mancheswar', arrivalTime: '21:07', departureTime: '21:07', haltMinutes: 0, distance: 7, day: 1, isPassingHalt: true },
      { stationCode: 'PTAB', stationName: 'Patia P.H.', arrivalTime: '21:10', departureTime: '21:10', haltMinutes: 0, distance: 10, day: 1, isPassingHalt: true },
      { stationCode: 'BBSN', stationName: 'Bhubaneswar New', arrivalTime: '21:13', departureTime: '21:13', haltMinutes: 0, distance: 13, day: 1, isPassingHalt: true },
      { stationCode: 'BRAG', stationName: 'Barang Jn', arrivalTime: '21:17', departureTime: '21:17', haltMinutes: 0, distance: 17, day: 1, isPassingHalt: true },
      { stationCode: 'GBK', stationName: 'Gopalpur Balikuda', arrivalTime: '21:21', departureTime: '21:21', haltMinutes: 0, distance: 22, day: 1, isPassingHalt: true },
      { stationCode: 'KTJI', stationName: 'Kathjori', arrivalTime: '21:24', departureTime: '21:24', haltMinutes: 0, distance: 25, day: 1, isPassingHalt: true },
      { stationCode: 'CTC', stationName: 'Cuttack', arrivalTime: '21:28', departureTime: '21:30', haltMinutes: 2, distance: 28, day: 1 },
      { stationCode: 'KNPR', stationName: 'Kendrapara Road', arrivalTime: '21:34', departureTime: '21:34', haltMinutes: 0, distance: 32, day: 1, isPassingHalt: true },
      { stationCode: 'NRG', stationName: 'Nergundi', arrivalTime: '21:38', departureTime: '21:39', haltMinutes: 1, distance: 38, day: 1 },
      { stationCode: 'MACR', stationName: 'Machapur', arrivalTime: '21:41', departureTime: '21:41', haltMinutes: 0, distance: 42, day: 1, isPassingHalt: true },
      { stationCode: 'GHNH', stationName: 'Ghantikhal Nidhipur', arrivalTime: '21:43', departureTime: '21:43', haltMinutes: 0, distance: 45, day: 1, isPassingHalt: true },
      { stationCode: 'BDPG', stationName: 'Bada Padagaon', arrivalTime: '21:44', departureTime: '21:45', haltMinutes: 1, distance: 48, day: 1 },
      { stationCode: 'RQP', stationName: 'Radhakishorepur', arrivalTime: '21:48', departureTime: '21:48', haltMinutes: 0, distance: 51, day: 1, isPassingHalt: true },
      { stationCode: 'RJGR', stationName: 'Raj Athgarh', arrivalTime: '21:50', departureTime: '21:51', haltMinutes: 1, distance: 54, day: 1 },
      { stationCode: 'KNTN', stationName: 'Khuntuni', arrivalTime: '21:53', departureTime: '21:53', haltMinutes: 0, distance: 57, day: 1, isPassingHalt: true },
      { stationCode: 'DNKL', stationName: 'Dhenkanal', arrivalTime: '21:55', departureTime: '21:57', haltMinutes: 2, distance: 61, day: 1 },
      { stationCode: 'SSPR', stationName: 'Sadasibapur', arrivalTime: '22:04', departureTime: '22:04', haltMinutes: 0, distance: 69, day: 1, isPassingHalt: true },
      { stationCode: 'JRND', stationName: 'Joranda Road', arrivalTime: '22:09', departureTime: '22:09', haltMinutes: 0, distance: 76, day: 1, isPassingHalt: true },
      { stationCode: 'HND', stationName: 'Hindol Road', arrivalTime: '22:14', departureTime: '22:15', haltMinutes: 1, distance: 84, day: 1 },
      { stationCode: 'MRDL', stationName: 'Meramandali', arrivalTime: '22:26', departureTime: '22:27', haltMinutes: 1, distance: 97, day: 1 },
      { stationCode: 'TLHD', stationName: 'Talcher Road', arrivalTime: '22:40', departureTime: '22:42', haltMinutes: 2, distance: 112, day: 1 },
      { stationCode: 'ANGL', stationName: 'Angul', arrivalTime: '23:00', departureTime: '23:05', haltMinutes: 5, distance: 124, day: 1 },
      { stationCode: 'BONA', stationName: 'Boinda', arrivalTime: '23:43', departureTime: '23:45', haltMinutes: 2, distance: 175, day: 1 },
      { stationCode: 'RAIR', stationName: 'Rairakhol', arrivalTime: '00:23', departureTime: '00:25', haltMinutes: 2, distance: 221, day: 2 },
      { stationCode: 'SBPY', stationName: 'Sambalpur City', arrivalTime: '01:25', departureTime: '01:30', haltMinutes: 5, distance: 286, day: 2 },
      { stationCode: 'JSG', stationName: 'Jharsuguda Jn', arrivalTime: '02:35', departureTime: '02:40', haltMinutes: 5, distance: 332, day: 2 },
      { stationCode: 'ROU', stationName: 'Rourkela', arrivalTime: '04:00', departureTime: '04:05', haltMinutes: 5, distance: 433, day: 2 },
      { stationCode: 'HTE', stationName: 'Hatia', arrivalTime: '06:35', departureTime: '06:40', haltMinutes: 5, distance: 598, day: 2 },
      { stationCode: 'RNC', stationName: 'Ranchi', arrivalTime: '06:55', departureTime: '07:05', haltMinutes: 10, distance: 605, day: 2 },
      { stationCode: 'MURI', stationName: 'Muri', arrivalTime: '08:03', departureTime: '08:05', haltMinutes: 2, distance: 667, day: 2 },
      { stationCode: 'BKSC', stationName: 'Bokaro Steel City', arrivalTime: '09:05', departureTime: '09:10', haltMinutes: 5, distance: 720, day: 2 },
      { stationCode: 'DHN', stationName: 'Dhanbad Jn', arrivalTime: '10:45', departureTime: null, haltMinutes: 0, distance: 769, day: 2 },
    ],
  },

  // 12301: Howrah - New Delhi Rajdhani Express
  '12301': {
    trainNumber: '12301',
    trainName: 'Howrah - New Delhi Rajdhani Express',
    type: 'Rajdhani Express',
    origin: { code: 'HWH', name: 'Howrah Jn' },
    destination: { code: 'NDLS', name: 'New Delhi' },
    classes: ['1A', '2A', '3A'],
    rakeType: 'LHB',
    coaches: [
      { coachId: 'EOG1', coachType: 'EOG', berthCount: 0 },
      { coachId: 'B1', coachType: '3A', berthCount: 72 },
      { coachId: 'B2', coachType: '3A', berthCount: 72 },
      { coachId: 'B3', coachType: '3A', berthCount: 72 },
      { coachId: 'B4', coachType: '3A', berthCount: 72 },
      { coachId: 'B5', coachType: '3A', berthCount: 72 },
      { coachId: 'B6', coachType: '3A', berthCount: 72 },
      { coachId: 'B7', coachType: '3A', berthCount: 72 },
      { coachId: 'B8', coachType: '3A', berthCount: 72 },
      { coachId: 'B9', coachType: '3A', berthCount: 72 },
      { coachId: 'B10', coachType: '3A', berthCount: 72 },
      { coachId: 'PC', coachType: 'PC', berthCount: 0 },
      { coachId: 'A1', coachType: '2A', berthCount: 52 },
      { coachId: 'A2', coachType: '2A', berthCount: 52 },
      { coachId: 'A3', coachType: '2A', berthCount: 52 },
      { coachId: 'A4', coachType: '2A', berthCount: 52 },
      { coachId: 'A5', coachType: '2A', berthCount: 52 },
      { coachId: 'H1', coachType: '1A', berthCount: 24 },
      { coachId: 'H2', coachType: '1A', berthCount: 24 },
      { coachId: 'EOG2', coachType: 'EOG', berthCount: 0 },
    ],
    schedule: [
      { stationCode: 'HWH', stationName: 'Howrah Jn', arrivalTime: null, departureTime: '16:50', haltMinutes: 0, distance: 0, day: 1 },
      { stationCode: 'ASN', stationName: 'Asansol Jn', arrivalTime: '18:57', departureTime: '19:00', haltMinutes: 3, distance: 200, day: 1 },
      { stationCode: 'DHN', stationName: 'Dhanbad Jn', arrivalTime: '19:50', departureTime: '19:55', haltMinutes: 5, distance: 259, day: 1 },
      { stationCode: 'PNME', stationName: 'Parasnath', arrivalTime: '20:30', departureTime: '20:32', haltMinutes: 2, distance: 306, day: 1 },
      { stationCode: 'GAYA', stationName: 'Gaya Jn', arrivalTime: '22:19', departureTime: '22:22', haltMinutes: 3, distance: 459, day: 1 },
      { stationCode: 'DDU', stationName: 'Pt Deen Dayal Upadhyaya Jn', arrivalTime: '00:45', departureTime: '00:55', haltMinutes: 10, distance: 664, day: 2 },
      { stationCode: 'PRYJ', stationName: 'Prayagraj Jn', arrivalTime: '02:33', departureTime: '02:35', haltMinutes: 2, distance: 817, day: 2 },
      { stationCode: 'CNB', stationName: 'Kanpur Central', arrivalTime: '04:40', departureTime: '04:45', haltMinutes: 5, distance: 1011, day: 2 },
      { stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '10:05', departureTime: null, haltMinutes: 0, distance: 1451, day: 2 },
    ],
  },

  // 12951: Mumbai Central - New Delhi Tejas Rajdhani Express
  '12951': {
    trainNumber: '12951',
    trainName: 'Mumbai Central - New Delhi Tejas Rajdhani',
    type: 'Tejas Rajdhani',
    origin: { code: 'MMCT', name: 'Mumbai Central' },
    destination: { code: 'NDLS', name: 'New Delhi' },
    classes: ['1A', '2A', '3A'],
    rakeType: 'LHB',
    coaches: [
      { coachId: 'EOG1', coachType: 'EOG', berthCount: 0 },
      { coachId: 'B1', coachType: '3A', berthCount: 72 },
      { coachId: 'B2', coachType: '3A', berthCount: 72 },
      { coachId: 'B3', coachType: '3A', berthCount: 72 },
      { coachId: 'B4', coachType: '3A', berthCount: 72 },
      { coachId: 'B5', coachType: '3A', berthCount: 72 },
      { coachId: 'B6', coachType: '3A', berthCount: 72 },
      { coachId: 'PC', coachType: 'PC', berthCount: 0 },
      { coachId: 'A1', coachType: '2A', berthCount: 52 },
      { coachId: 'A2', coachType: '2A', berthCount: 52 },
      { coachId: 'A3', coachType: '2A', berthCount: 52 },
      { coachId: 'H1', coachType: '1A', berthCount: 24 },
      { coachId: 'EOG2', coachType: 'EOG', berthCount: 0 },
    ],
    schedule: [
      { stationCode: 'MMCT', stationName: 'Mumbai Central', arrivalTime: null, departureTime: '17:00', haltMinutes: 0, distance: 0, day: 1 },
      { stationCode: 'BVI', stationName: 'Borivali', arrivalTime: '17:22', departureTime: '17:24', haltMinutes: 2, distance: 30, day: 1 },
      { stationCode: 'ST', stationName: 'Surat', arrivalTime: '19:43', departureTime: '19:48', haltMinutes: 5, distance: 263, day: 1 },
      { stationCode: 'BRC', stationName: 'Vadodara Jn', arrivalTime: '21:06', departureTime: '21:16', haltMinutes: 10, distance: 393, day: 1 },
      { stationCode: 'RTM', stationName: 'Ratlam Jn', arrivalTime: '00:25', departureTime: '00:28', haltMinutes: 3, distance: 653, day: 2 },
      { stationCode: 'KOTA', stationName: 'Kota Jn', arrivalTime: '03:15', departureTime: '03:20', haltMinutes: 5, distance: 920, day: 2 },
      { stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '08:32', departureTime: null, haltMinutes: 0, distance: 1386, day: 2 },
    ],
  },

  // 22436: New Delhi - Varanasi Vande Bharat Express
  '22436': {
    trainNumber: '22436',
    trainName: 'New Delhi - Varanasi Vande Bharat Express',
    type: 'Vande Bharat Express',
    origin: { code: 'NDLS', name: 'New Delhi' },
    destination: { code: 'BSB', name: 'Varanasi Jn' },
    classes: ['CC', 'EC'],
    rakeType: 'VANDE_BHARAT',
    coaches: [
      { coachId: 'C1', coachType: 'CC', berthCount: 78 },
      { coachId: 'C2', coachType: 'CC', berthCount: 78 },
      { coachId: 'C3', coachType: 'CC', berthCount: 78 },
      { coachId: 'C4', coachType: 'CC', berthCount: 78 },
      { coachId: 'C5', coachType: 'CC', berthCount: 78 },
      { coachId: 'C6', coachType: 'CC', berthCount: 78 },
      { coachId: 'C7', coachType: 'CC', berthCount: 78 },
      { coachId: 'E1', coachType: 'EC', berthCount: 52 },
      { coachId: 'E2', coachType: 'EC', berthCount: 52 },
      { coachId: 'C8', coachType: 'CC', berthCount: 78 },
      { coachId: 'C9', coachType: 'CC', berthCount: 78 },
      { coachId: 'C10', coachType: 'CC', berthCount: 78 },
      { coachId: 'C11', coachType: 'CC', berthCount: 78 },
      { coachId: 'C12', coachType: 'CC', berthCount: 78 },
      { coachId: 'C13', coachType: 'CC', berthCount: 78 },
      { coachId: 'C14', coachType: 'CC', berthCount: 78 },
    ],
    schedule: [
      { stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: null, departureTime: '06:00', haltMinutes: 0, distance: 0, day: 1 },
      { stationCode: 'CNB', stationName: 'Kanpur Central', arrivalTime: '10:08', departureTime: '10:10', haltMinutes: 2, distance: 440, day: 1 },
      { stationCode: 'PRYJ', stationName: 'Prayagraj Jn', arrivalTime: '12:08', departureTime: '12:10', haltMinutes: 2, distance: 635, day: 1 },
      { stationCode: 'BSB', stationName: 'Varanasi Jn', arrivalTime: '14:00', departureTime: null, haltMinutes: 0, distance: 759, day: 1 },
    ],
  },

  // 12919: Malwa Superfast Express (Dr. Ambedkar Nagar to Shri Mata Vaishno Devi Katra)
  '12919': {
    trainNumber: '12919',
    trainName: 'Malwa Superfast Express',
    type: 'Superfast Express',
    origin: { code: 'DADN', name: 'Dr. Ambedkar Nagar' },
    destination: { code: 'SVDK', name: 'Shri Mata Vaishno Devi Katra' },
    classes: ['1A', '2A', '3A', '3E', 'SL', 'GEN'],
    rakeType: 'LHB',
    coaches: [
      { coachId: 'EOG1', coachType: 'EOG', berthCount: 0 },
      { coachId: 'GS1', coachType: 'GS', berthCount: 100 },
      { coachId: 'GS2', coachType: 'GS', berthCount: 100 },
      { coachId: 'S1', coachType: 'SL', berthCount: 80 },
      { coachId: 'S2', coachType: 'SL', berthCount: 80 },
      { coachId: 'S3', coachType: 'SL', berthCount: 80 },
      { coachId: 'S4', coachType: 'SL', berthCount: 80 },
      { coachId: 'S5', coachType: 'SL', berthCount: 80 },
      { coachId: 'M1', coachType: '3E', berthCount: 83 },
      { coachId: 'M2', coachType: '3E', berthCount: 83 },
      { coachId: 'B1', coachType: '3A', berthCount: 72 },
      { coachId: 'B2', coachType: '3A', berthCount: 72 },
      { coachId: 'B3', coachType: '3A', berthCount: 72 },
      { coachId: 'B4', coachType: '3A', berthCount: 72 },
      { coachId: 'B5', coachType: '3A', berthCount: 72 },
      { coachId: 'B6', coachType: '3A', berthCount: 72 },
      { coachId: 'A1', coachType: '2A', berthCount: 52 },
      { coachId: 'A2', coachType: '2A', berthCount: 52 },
      { coachId: 'H1', coachType: '1A', berthCount: 24 },
      { coachId: 'PC', coachType: 'PC', berthCount: 0 },
      { coachId: 'GS3', coachType: 'GS', berthCount: 100 },
      { coachId: 'SLR', coachType: 'SLR', berthCount: 0 },
    ],
    schedule: [
      { stationCode: 'DADN', stationName: 'Dr. Ambedkar Nagar', arrivalTime: null, departureTime: '11:50', haltMinutes: 0, distance: 0, day: 1 },
      { stationCode: 'INDB', stationName: 'Indore Jn', arrivalTime: '12:05', departureTime: '12:15', haltMinutes: 10, distance: 21, day: 1 },
      { stationCode: 'DWX', stationName: 'Dewas Jn', arrivalTime: '12:51', departureTime: '12:53', haltMinutes: 2, distance: 60, day: 1 },
      { stationCode: 'UJN', stationName: 'Ujjain Jn', arrivalTime: '13:50', departureTime: '14:05', haltMinutes: 15, distance: 101, day: 1 },
      { stationCode: 'MKC', stationName: 'Maksi Jn', arrivalTime: '14:50', departureTime: '14:52', haltMinutes: 2, distance: 142, day: 1 },
      { stationCode: 'BCH', stationName: 'Berchha', arrivalTime: '15:08', departureTime: '15:10', haltMinutes: 2, distance: 161, day: 1 },
      { stationCode: 'SJP', stationName: 'Shujalpur', arrivalTime: '15:43', departureTime: '15:45', haltMinutes: 2, distance: 204, day: 1 },
      { stationCode: 'KPP', stationName: 'Kalapipal', arrivalTime: '15:58', departureTime: '16:00', haltMinutes: 2, distance: 217, day: 1 },
      { stationCode: 'SEH', stationName: 'Sehore', arrivalTime: '16:23', departureTime: '16:25', haltMinutes: 2, distance: 246, day: 1 },
      { stationCode: 'SHRN', stationName: 'Sant Hirdaram Nagar', arrivalTime: '17:03', departureTime: '17:05', haltMinutes: 2, distance: 274, day: 1 },
      { stationCode: 'BPL', stationName: 'Bhopal Jn', arrivalTime: '17:30', departureTime: '17:40', haltMinutes: 10, distance: 285, day: 1 },
      { stationCode: 'BHS', stationName: 'Vidisha', arrivalTime: '18:18', departureTime: '18:20', haltMinutes: 2, distance: 338, day: 1 },
      { stationCode: 'BAQ', stationName: 'Ganj Basoda', arrivalTime: '18:48', departureTime: '18:50', haltMinutes: 2, distance: 377, day: 1 },
      { stationCode: 'BINA', stationName: 'Bina Jn', arrivalTime: '19:40', departureTime: '19:45', haltMinutes: 5, distance: 423, day: 1 },
      { stationCode: 'LIT', stationName: 'Lalitpur Jn', arrivalTime: '20:25', departureTime: '20:27', haltMinutes: 2, distance: 486, day: 1 },
      { stationCode: 'BAB', stationName: 'Babina', arrivalTime: '21:05', departureTime: '21:07', haltMinutes: 2, distance: 551, day: 1 },
      { stationCode: 'VGLJ', stationName: 'VGL Jhansi Jn', arrivalTime: '21:30', departureTime: '21:38', haltMinutes: 8, distance: 576, day: 1 },
      { stationCode: 'DAA', stationName: 'Datia', arrivalTime: '21:58', departureTime: '22:00', haltMinutes: 2, distance: 601, day: 1 },
      { stationCode: 'DBA', stationName: 'Dabra', arrivalTime: '22:24', departureTime: '22:26', haltMinutes: 2, distance: 631, day: 1 },
      { stationCode: 'GWL', stationName: 'Gwalior Jn', arrivalTime: '23:05', departureTime: '23:07', haltMinutes: 2, distance: 673, day: 1 },
      { stationCode: 'MRA', stationName: 'Morena', arrivalTime: '23:38', departureTime: '23:40', haltMinutes: 2, distance: 712, day: 1 },
      { stationCode: 'DHO', stationName: 'Dholpur Jn', arrivalTime: '00:13', departureTime: '00:15', haltMinutes: 2, distance: 739, day: 2 },
      { stationCode: 'AGC', stationName: 'Agra Cantt', arrivalTime: '00:55', departureTime: '01:00', haltMinutes: 5, distance: 792, day: 2 },
      { stationCode: 'MTJ', stationName: 'Mathura Jn', arrivalTime: '01:43', departureTime: '01:45', haltMinutes: 2, distance: 845, day: 2 },
      { stationCode: 'KSV', stationName: 'Kosi Kalan', arrivalTime: '02:13', departureTime: '02:15', haltMinutes: 2, distance: 887, day: 2 },
      { stationCode: 'PWL', stationName: 'Palwal', arrivalTime: '03:18', departureTime: '03:20', haltMinutes: 2, distance: 929, day: 2 },
      { stationCode: 'BVH', stationName: 'Ballabhgarh', arrivalTime: '03:38', departureTime: '03:40', haltMinutes: 2, distance: 950, day: 2 },
      { stationCode: 'FDB', stationName: 'Faridabad', arrivalTime: '03:50', departureTime: '03:52', haltMinutes: 2, distance: 958, day: 2 },
      { stationCode: 'TKD', stationName: 'Tuglakabad', arrivalTime: '04:02', departureTime: '04:03', haltMinutes: 1, distance: 968, day: 2, isPassingHalt: true },
      { stationCode: 'NZM', stationName: 'Hazrat Nizamuddin Jn', arrivalTime: '04:15', departureTime: '04:17', haltMinutes: 2, distance: 979, day: 2 },
      { stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '04:45', departureTime: '05:05', haltMinutes: 20, distance: 986, day: 2 },
      { stationCode: 'SZM', stationName: 'Sabzi Mandi', arrivalTime: '05:17', departureTime: '05:19', haltMinutes: 2, distance: 990, day: 2 },
      { stationCode: 'SNP', stationName: 'Sonipat Jn', arrivalTime: '05:48', departureTime: '05:50', haltMinutes: 2, distance: 1030, day: 2 },
      { stationCode: 'PNP', stationName: 'Panipat Jn', arrivalTime: '06:23', departureTime: '06:25', haltMinutes: 2, distance: 1076, day: 2 },
      { stationCode: 'KUN', stationName: 'Karnal', arrivalTime: '06:49', departureTime: '06:51', haltMinutes: 2, distance: 1110, day: 2 },
      { stationCode: 'KKDE', stationName: 'Kurukshetra Jn', arrivalTime: '07:15', departureTime: '07:17', haltMinutes: 2, distance: 1143, day: 2 },
      { stationCode: 'UMB', stationName: 'Ambala Cantt Jn', arrivalTime: '08:15', departureTime: '08:25', haltMinutes: 10, distance: 1185, day: 2 },
      { stationCode: 'SIR', stationName: 'Sirhind Jn', arrivalTime: '09:03', departureTime: '09:05', haltMinutes: 2, distance: 1238, day: 2 },
      { stationCode: 'LDH', stationName: 'Ludhiana Jn', arrivalTime: '10:05', departureTime: '10:15', haltMinutes: 10, distance: 1299, day: 2 },
      { stationCode: 'JRC', stationName: 'Jalandhar Cantt Jn', arrivalTime: '11:03', departureTime: '11:08', haltMinutes: 5, distance: 1351, day: 2 },
      { stationCode: 'DZA', stationName: 'Dasuya', arrivalTime: '11:58', departureTime: '12:00', haltMinutes: 2, distance: 1409, day: 2 },
      { stationCode: 'MEX', stationName: 'Mukerian', arrivalTime: '12:15', departureTime: '12:17', haltMinutes: 2, distance: 1425, day: 2 },
      { stationCode: 'PTKC', stationName: 'Pathankot Cantt', arrivalTime: '13:00', departureTime: '13:05', haltMinutes: 5, distance: 1464, day: 2 },
      { stationCode: 'KTHU', stationName: 'Kathua', arrivalTime: '13:35', departureTime: '13:37', haltMinutes: 2, distance: 1487, day: 2 },
      { stationCode: 'JAT', stationName: 'Jammu Tawi', arrivalTime: '14:55', departureTime: '15:05', haltMinutes: 10, distance: 1564, day: 2 },
      { stationCode: 'UHP', stationName: 'MCTM Udhampur', arrivalTime: '16:03', departureTime: '16:05', haltMinutes: 2, distance: 1617, day: 2 },
      { stationCode: 'SVDK', stationName: 'Shri Mata Vaishno Devi Katra', arrivalTime: '16:45', departureTime: null, haltMinutes: 0, distance: 1642, day: 2 },
    ],
  },
};

/** Return verified directory data when present; unknown numbers remain explicitly unknown. */
export function getOrSynthesizeTrain(trainNumber: string): KnownTrain {
  const cleanNumber = trainNumber.replace(/\D/g, '').padStart(5, '0').slice(-5);
  return KNOWN_TRAINS[cleanNumber] ?? {
    trainNumber: cleanNumber,
    trainName: `Train ${cleanNumber}`,
    type: 'Unknown',
    origin: { code: '—', name: 'Route unavailable' },
    destination: { code: '—', name: 'Route unavailable' },
    classes: [],
    rakeType: 'UNKNOWN',
    coaches: [],
    schedule: [],
  };
}

