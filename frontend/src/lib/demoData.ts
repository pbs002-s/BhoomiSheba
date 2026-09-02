import type { Parcel, SmsAlert, DueDiligenceReport } from './types';

/**
 * Offline dataset mirroring `backend/prisma/seed.ts`.
 *
 * The point: a demo should never open on an error banner. When Postgres
 * isn't running, the app reads from here and says so in the header, plainly.
 */

const savar: Parcel = {
  id: 'BD-DHK-SAV-000001',
  division: 'Dhaka',
  district: 'Dhaka',
  upazila: 'Savar',
  mouza: 'Tetuljhora',
  jlNumber: 42,
  khatianNo: 'RS-4502 / BS-1890',
  dagNo: '1204 / 1205 (part)',
  holdingNo: 'H-89/A (Ward 04)',
  landClass: 'Homestead — বাস্তুভিটা',
  areaDecimal: 5.5,
  mappedAreaDecimal: 5.52,
  currentOwner: 'Md. Rafiqul Islam — মোঃ রফিকুল ইসলাম',
  nidNumber: '19852691234567890',
  phone: '+880 1711-223344',
  email: 'rafiqul.islam@example.com',
  geojsonBoundary: {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [90.2581, 23.8432],
          [90.2592, 23.8435],
          [90.2595, 23.8427],
          [90.2583, 23.8424],
          [90.2581, 23.8432],
        ],
      ],
    },
    properties: {
      dagNo: '1204',
      areaDecimal: 5.5,
      landClass: 'বাস্তুভিটা',
    },
  },
  taxRecords: [
    {
      id: 't1',
      fiscalYear: '1433–1434 (2026–2027)',
      annualDemandBDT: 1350,
      arrearAmountBDT: 0,
      totalDueBDT: 1350,
      paidAmountBDT: 0,
      status: 'PENDING',
      trxId: null,
      paymentMethod: null,
      dakhilaNumber: null,
      qrCodeUrl: null,
      paymentDate: null,
    },
    {
      id: 't2',
      fiscalYear: '1432–1433 (2025–2026)',
      annualDemandBDT: 1220,
      arrearAmountBDT: 0,
      totalDueBDT: 1220,
      paidAmountBDT: 1220,
      status: 'RECONCILED',
      trxId: 'BKASH_48120945',
      paymentMethod: 'bKash',
      dakhilaNumber: 'DAK-2025-418822',
      qrCodeUrl: 'https://land.gov.bd/verify/dakhila/DAK-2025-418822',
      paymentDate: '2025-06-11T09:24:00.000Z',
    },
  ],
  mutations: [
    {
      id: 'm1',
      caseNumber: 'MUT-2026-DH-1044',
      applicantName: 'Kamal Hossain (Co-heir)',
      applicantNid: '19902699876543210',
      applicantPhone: '+880 1819-556677',
      proposedOwner: 'Kamal Hossain',
      status: 'KANUNGO_VERIFICATION',
      currentStage: 'Stage 2: Kanungo field survey & spot report pending',
      hearingDate: '2026-09-10T00:00:00.000Z',
      dcrAmount: 1150,
      remarks: 'Filed as co-heir. Awaiting spot survey report from ULAO.',
      createdAt: '2026-07-28T06:10:00.000Z',
    },
    {
      id: 'm2',
      caseNumber: 'MUT-2026-DH-0941',
      applicantName: 'Md. Rafiqul Islam',
      applicantNid: '19852691234567890',
      applicantPhone: '+880 1711-223344',
      proposedOwner: 'Md. Rafiqul Islam',
      status: 'APPROVED',
      currentStage: 'Completed — new খতিয়ান issued',
      hearingDate: '2026-02-15T00:00:00.000Z',
      dcrAmount: 1150,
      remarks: 'Hearing closed with no objection. Ownership certified.',
      createdAt: '2026-01-04T04:00:00.000Z',
    },
  ],
  timelineEvents: [
    {
      id: 'e1',
      eventType: 'MUTATION_SUBMITTED',
      title: 'নামজারি filed by a co-heir',
      description: 'Kamal Hossain applied to record a share of this parcel.',
      actor: 'Upazila Land Office, Savar',
      referenceDoc: 'MUT-2026-DH-1044',
      eventDate: '2026-07-28T06:10:00.000Z',
    },
    {
      id: 'e2',
      eventType: 'TAX_PAID',
      title: 'Land tax paid for 1432–1433',
      description: '৳1,220 received. দাখিলা DAK-2025-418822 issued.',
      actor: 'You',
      referenceDoc: 'DAK-2025-418822',
      eventDate: '2025-06-11T09:24:00.000Z',
    },
    {
      id: 'e3',
      eventType: 'MUTATION_APPROVED',
      title: 'নামজারি completed',
      description: 'Ownership recorded after the AC (Land) hearing.',
      actor: 'AC (Land), Savar',
      referenceDoc: 'MUT-2026-DH-0941',
      eventDate: '2026-02-15T10:00:00.000Z',
    },
    {
      id: 'e4',
      eventType: 'SURVEY',
      title: 'BS sheet digitised',
      description: 'Boundary vectorised from BS 2015 mouza sheet 04.',
      actor: 'DLRS',
      referenceDoc: 'BS-SHEET-04',
      eventDate: '2024-11-02T00:00:00.000Z',
    },
  ],
  discrepancies: [
    {
      id: 'd1',
      mismatchType: 'Recorded area differs from mapped area',
      sourceA: 'খতিয়ান RS-4502 — 5.50 decimal',
      sourceB: 'DLRS vector boundary — 5.52 decimal',
      severity: 'LOW',
      isResolved: false,
      flaggedBy: 'reconciliation service',
      createdAt: '2026-08-01T02:00:00.000Z',
    },
  ],
  documents: [
    {
      id: 'doc1',
      docType: 'দলিল',
      fileName: 'deed-4471-2019.pdf',
      fileUrl: '#',
      ocrText: 'সাব-রেজিস্ট্রি দলিল ৪৪৭১/২০১৯ • সাভার সাব-রেজিস্ট্রি অফিস • দাগ ১২০৪ • গ্রহীতা মোঃ রফিকুল ইসলাম • সাফ-কবলা দলিল',
      uploadedAt: '2024-03-02T00:00:00.000Z',
    },
    {
      id: 'doc2',
      docType: 'খতিয়ান',
      fileName: 'khatian-bs-1890.pdf',
      fileUrl: '#',
      ocrText: 'খতিয়ান নং ১৮৯০ • মৌজা তেঁতুলঝোড়া • দাগ ১২০৪ • অংশ ৫.৫০ শতক • স্বত্বাধিকারী মোঃ রফিকুল ইসলাম',
      uploadedAt: '2024-03-02T00:00:00.000Z',
    },
    {
      id: 'doc3',
      docType: 'দাখিলা',
      fileName: 'dakhila-2025-418822.pdf',
      fileUrl: '#',
      ocrText: 'ভূমি উন্নয়ন কর দাখিলা • দাখিলা নং DAK-2025-418822 • সন ১৪৩২-১৪৩৩ • পরিশোধিত ১২২০ টাকা • হোল্ডিং H-89/A',
      uploadedAt: '2025-06-11T09:30:00.000Z',
    },
  ],
  complaints: [
    {
      id: 'c1',
      trackingNo: 'CMP-SAV-2026-0041',
      parcelId: 'BD-DHK-SAV-000001',
      complainant: 'Abdul Karim (Neighbor)',
      phone: '+880 1819-001122',
      category: 'Plot Boundary Demarcation (সীমানা নির্ধারণ)',
      description: 'Request for joint physical survey for North-Western ridge boundary demarcation with dag 1203.',
      assignedOffice: 'Tetuljhora Union Land Office, Savar',
      status: 'ROUTED',
      createdAt: '2026-07-10T08:00:00.000Z',
    },
  ],
  isLocked: false,
  titleChain: [
    {
      id: 'tc-cs',
      epoch: 'CS',
      epochTitle: 'Cadastral Survey (সিএস জরিপ)',
      year: 1924,
      ownerName: 'হরেন্দ্র নারায়ণ সেন চৌধুরী (Harendra Narayan Sen Chowdhury)',
      khatianNo: 'CS-412',
      dagNo: '910 (Original Estate)',
      areaDecimal: 28.5,
      transferType: 'ORIGINAL_SETTLEMENT',
      transferTypeBn: 'জমিদারী মূল বন্দোবস্ত',
      subRegistryOffice: 'ঢাকা কালেক্টরেট',
      state: 'HISTORICAL',
      notes: 'Bengal Cadastral Survey record under Savar Revenue Circle.',
    },
    {
      id: 'tc-sa',
      epoch: 'SA',
      epochTitle: 'State Acquisition (এসএ জরিপ)',
      year: 1958,
      ownerName: 'মোঃ আফতাব উদ্দিন আহমেদ (Md. Aftab Uddin Ahmed)',
      khatianNo: 'SA-890',
      dagNo: '1042 (বিভাজিত)',
      areaDecimal: 12.0,
      transferType: 'PURCHASE_DEED',
      transferTypeBn: 'সাফ-কবলা দলিল',
      deedNo: 'দলিল নং ১২৩০/১৯৫৮',
      subRegistryOffice: 'ধামরাই সাব-রেজিস্ট্রি অফিস',
      state: 'HISTORICAL',
      notes: 'Transferred via registered purchase deed post East Bengal State Acquisition Act.',
    },
    {
      id: 'tc-rs',
      epoch: 'RS',
      epochTitle: 'Revisional Survey (আরএস জরিপ)',
      year: 1984,
      ownerName: 'মোঃ সিরাজুল হক (Md. Sirajul Haque)',
      khatianNo: 'RS-4502',
      dagNo: '1204',
      areaDecimal: 5.5,
      transferType: 'INHERITANCE',
      transferTypeBn: 'উত্তরাধিকার ও হেবা বিল এওয়াজ',
      deedNo: 'হেবা দলিল ৩৪০২/১৯৮৩',
      subRegistryOffice: 'সাভার সাব-রেজিস্ট্রি অফিস',
      state: 'HISTORICAL',
      notes: 'RS field survey sheet confirms creation of independent Dag 1204.',
    },
    {
      id: 'tc-bs',
      epoch: 'BS',
      epochTitle: 'Bangladesh Survey (বিএস মহানগর জরিপ)',
      year: 2018,
      ownerName: 'মোঃ রফিকুল ইসলাম (Md. Rafiqul Islam)',
      khatianNo: 'BS-1890',
      dagNo: '1204',
      areaDecimal: 5.5,
      transferType: 'PURCHASE_DEED',
      transferTypeBn: 'সাব-কবলা দলিল',
      deedNo: 'দলিল নং ৪৪৭১/২০১৮',
      subRegistryOffice: 'সাভার সাব-রেজিস্ট্রি অফিস',
      state: 'HISTORICAL',
      notes: 'Biometric deed registration with cleared consideration and non-encumbrance receipt.',
    },
    {
      id: 'tc-bds',
      epoch: 'BDS',
      epochTitle: 'BDS Digital Drone Cadastre (বিডিএস ডিজিটাল ড্রোন জরিপ)',
      year: 2026,
      ownerName: 'মোঃ রফিকুল ইসলাম (Md. Rafiqul Islam)',
      khatianNo: 'BS-1890 / BDS-SAV-001',
      dagNo: '1204',
      areaDecimal: 5.5,
      transferType: 'E_MUTATION',
      transferTypeBn: 'অনলাইন ই-নামজারি ও নকশা অনুমোদন',
      deedNo: 'নামজারি কেস MUT-2026-DH-0941',
      subRegistryOffice: 'সহকারী কমিশনার (ভূমি) কোর্ট, সাভার',
      state: 'CURRENT',
      notes: 'Active authoritative legal title with RTK-GNSS vector polygon in national land cloud.',
    },
  ],
  adjacentParcels: [
    {
      dagNo: '1203',
      mouza: 'Tetuljhora',
      owner: 'মোঃ আব্দুল করিম (Abdul Karim)',
      areaDecimal: 6.2,
      landClass: 'বাস্তুভিটা',
      encroachmentStatus: 'VARIANCE_FLAG',
      overlapDiffSqFt: 87.12, // 0.02 decimal
    },
    {
      dagNo: '1205',
      mouza: 'Tetuljhora',
      owner: 'বেগম রওশন আরা (Rowshan Ara)',
      areaDecimal: 11.4,
      landClass: 'নাল জমি',
      encroachmentStatus: 'CLEAR',
      overlapDiffSqFt: 0,
    },
  ],
};

const patiya: Parcel = {
  id: 'BD-CTG-PAN-000492',
  division: 'Chattogram',
  district: 'Chattogram',
  upazila: 'Panchlaish',
  mouza: 'Nasirabad',
  jlNumber: 15,
  khatianNo: 'BS-2214 / RS-109',
  dagNo: '806',
  holdingNo: 'H-12 (Ward 02)',
  landClass: 'Commercial — বাণিজ্যিক',
  areaDecimal: 12.0,
  mappedAreaDecimal: 11.95,
  currentOwner: 'Nurjahan Begum — নূরজাহান বেগম',
  nidNumber: '19771591234509876',
  phone: '+880 1912-887766',
  email: 'nurjahan.begum@example.com',
  geojsonBoundary: {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [91.8211, 22.3654],
          [91.8224, 22.3658],
          [91.8229, 22.3649],
          [91.8215, 22.3646],
          [91.8211, 22.3654],
        ],
      ],
    },
    properties: {
      dagNo: '806',
      areaDecimal: 12.0,
      landClass: 'বাণিজ্যিক',
    },
  },
  taxRecords: [
    {
      id: 't3',
      fiscalYear: '1433–1434 (2026–2027)',
      annualDemandBDT: 4800,
      arrearAmountBDT: 0,
      totalDueBDT: 4800,
      paidAmountBDT: 4800,
      status: 'VERIFIED',
      trxId: 'EKPAY_77A82910',
      paymentMethod: 'Ekpay Gateway',
      dakhilaNumber: 'DAK-2026-993812',
      qrCodeUrl: 'https://land.gov.bd/verify/dakhila/DAK-2026-993812',
      paymentDate: '2026-05-10T11:00:00.000Z',
    },
  ],
  mutations: [],
  timelineEvents: [
    {
      id: 'e5',
      eventType: 'TAX_PAID',
      title: 'Commercial LD Tax Settled',
      description: '৳4,800 cleared via Ekpay. Verified Dakhila DAK-2026-993812 issued.',
      actor: 'Nurjahan Begum',
      referenceDoc: 'DAK-2026-993812',
      eventDate: '2026-05-10T11:00:00.000Z',
    },
  ],
  discrepancies: [
    {
      id: 'd2',
      mismatchType: 'Boundary overlaps the neighbouring dag',
      sourceA: 'CS map sheet (legacy 1940)',
      sourceB: 'DLRS 2026 vector boundary',
      severity: 'MEDIUM',
      isResolved: false,
      flaggedBy: 'reconciliation service',
      createdAt: '2026-06-19T02:00:00.000Z',
    },
  ],
  documents: [
    {
      id: 'doc4',
      docType: 'খতিয়ান',
      fileName: 'khatian-bs-2214.pdf',
      fileUrl: '#',
      ocrText: 'খতিয়ান নং ২২১৪ • মৌজা নাসিরাবাদ • দাগ ৮০৬ • পরিমাণ ১২ শতক বাণিজ্যিক • স্বত্বাধিকারী নূরজাহান বেগম',
      uploadedAt: '2024-08-19T00:00:00.000Z',
    },
  ],
  complaints: [],
};

const sreemangal: Parcel = {
  id: 'BD-SYL-SRM-000108',
  division: 'Sylhet',
  district: 'Moulvibazar',
  upazila: 'Sreemangal',
  mouza: 'Radhanagar',
  jlNumber: 8,
  khatianNo: 'BS-5510',
  dagNo: '312 / 314',
  holdingNo: 'SR-44/B',
  landClass: 'Agricultural — কৃষি ও চা বাগান',
  areaDecimal: 45.0,
  mappedAreaDecimal: 45.1,
  currentOwner: 'Syed Shamsul Haque — সৈয়দ শামসুল হক',
  nidNumber: '19685811223344556',
  phone: '+880 1715-998877',
  email: 'shamsul.syl@example.com',
  geojsonBoundary: {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [91.7302, 24.3081],
          [91.7325, 24.3087],
          [91.7329, 24.3065],
          [91.7308, 24.3059],
          [91.7302, 24.3081],
        ],
      ],
    },
    properties: {
      dagNo: '312',
      areaDecimal: 45.0,
      landClass: 'কৃষি',
    },
  },
  taxRecords: [
    {
      id: 't4',
      fiscalYear: '1433–1434 (2026–2027)',
      annualDemandBDT: 675,
      arrearAmountBDT: 0,
      totalDueBDT: 675,
      paidAmountBDT: 0,
      status: 'PENDING',
      trxId: null,
      paymentMethod: null,
      dakhilaNumber: null,
      qrCodeUrl: null,
      paymentDate: null,
    },
  ],
  mutations: [
    {
      id: 'm-syl-1',
      caseNumber: 'MUT-2026-SYL-0519',
      applicantName: 'Tariqul Islam (Buyer)',
      applicantNid: '19875819203948571',
      applicantPhone: '+880 1712-998877',
      proposedOwner: 'Tariqul Islam',
      status: 'AC_LAND_HEARING',
      currentStage: 'Stage 3: Spot Survey Verified. AC Land Hearing Scheduled',
      hearingDate: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      dcrAmount: 1150,
      remarks: 'Notice served to recorded tea estate co-sharers. Hearing on cause list.',
      createdAt: '2026-08-12T05:30:00.000Z',
    },
  ],
  timelineEvents: [
    {
      id: 'e6',
      eventType: 'SURVEY',
      title: 'BDS Digital Survey GPS Tagging',
      description: 'Agricultural boundary georeferenced with GPS benchmarks.',
      actor: 'DLRS Sylhet Zone',
      referenceDoc: 'BDS-SYL-2026',
      eventDate: '2026-03-01T00:00:00.000Z',
    },
  ],
  discrepancies: [],
  documents: [
    {
      id: 'doc5',
      docType: 'খতিয়ান',
      fileName: 'khatian-bs-5510.pdf',
      fileUrl: '#',
      ocrText: 'খতিয়ান নং ৫৫১০ • মৌজা রাধানগর • দাগ ৩১২ • পরিমাণ ৪৫ শতক • মালিক সৈয়দ শামসুল হক',
      uploadedAt: '2025-01-15T00:00:00.000Z',
    },
  ],
  complaints: [],
};

const pabna: Parcel = {
  id: 'BD-RAJ-PAB-000731',
  division: 'Rajshahi',
  district: 'Pabna',
  upazila: 'Ishwardi',
  mouza: 'Pakshi',
  jlNumber: 27,
  khatianNo: 'RS-901 / BS-3341',
  dagNo: '550',
  holdingNo: 'P-99/1',
  landClass: 'Orchard — বাগান/ফলদ',
  areaDecimal: 18.5,
  mappedAreaDecimal: 18.48,
  currentOwner: 'Abdur Rahim Mandal — আব্দুর রহিম মন্ডল',
  nidNumber: '19827611223344556',
  phone: '+880 1712-445566',
  email: 'rahim.pabna@example.com',
  geojsonBoundary: {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [89.0415, 24.1285],
          [89.0432, 24.1289],
          [89.0436, 24.1274],
          [89.0419, 24.1271],
          [89.0415, 24.1285],
        ],
      ],
    },
    properties: {
      dagNo: '550',
      areaDecimal: 18.5,
      landClass: 'বাগান',
    },
  },
  taxRecords: [
    {
      id: 't5',
      fiscalYear: '1433–1434 (2026–2027)',
      annualDemandBDT: 275,
      arrearAmountBDT: 0,
      totalDueBDT: 275,
      paidAmountBDT: 275,
      status: 'VERIFIED',
      trxId: 'NAGAD_88K120',
      paymentMethod: 'Nagad',
      dakhilaNumber: 'DAK-2026-119283',
      qrCodeUrl: 'https://land.gov.bd/verify/dakhila/DAK-2026-119283',
      paymentDate: '2026-06-01T10:00:00.000Z',
    },
  ],
  mutations: [],
  timelineEvents: [
    {
      id: 'e7',
      eventType: 'TAX_PAID',
      title: 'Orchard Land Tax Cleared',
      description: '৳275 paid via Nagad. Dakhila DAK-2026-119283 issued.',
      actor: 'Abdur Rahim Mandal',
      referenceDoc: 'DAK-2026-119283',
      eventDate: '2026-06-01T10:00:00.000Z',
    },
  ],
  discrepancies: [
    {
      id: 'd-pab-1',
      mismatchType: 'Biometric deed signature unlinked to national NID database',
      sourceA: 'Sub-Registry Deed Book Vol 42/2021',
      sourceB: 'Election Commission NID Biometric API',
      severity: 'HIGH',
      isResolved: false,
      flaggedBy: 'automated registry audit',
      createdAt: '2026-07-15T08:00:00.000Z',
    },
  ],
  documents: [
    {
      id: 'doc6',
      docType: 'খতিয়ান',
      fileName: 'khatian-bs-3341.pdf',
      fileUrl: '#',
      ocrText: 'খতিয়ান নং ৩৩৪১ • মৌজা পাকশী • দাগ ৫৫০ • ১৮.৫০ শতক ফলদ বাগান • মালিক আব্দুর রহিম মন্ডল',
      uploadedAt: '2025-02-20T00:00:00.000Z',
    },
  ],
  complaints: [],
};

export const demoParcels: Parcel[] = [savar, patiya, sreemangal, pabna];

export function findDemoParcel(id: string): Parcel | undefined {
  return demoParcels.find((p) => p.id.toLowerCase() === id.trim().toLowerCase());
}

/** Accounts shown on the sign-in screen. Demo only — no real credentials. */
export const demoAccounts = [
  {
    role: 'citizen' as const,
    name: 'Md. Rafiqul Islam',
    nid: '1985 2691 2345 6789',
    phone: '01711-223344',
    otp: '123456',
    parcels: ['BD-DHK-SAV-000001', 'BD-RAJ-PAB-000731'],
    label: 'Citizen',
    bn: 'নাগরিক',
    note: 'Two parcels, one tax bill due, one নামজারি filed by someone else.',
  },
  {
    role: 'officer' as const,
    name: 'Farhana Akter',
    nid: '1990 1122 3344 5566',
    phone: '01555-667788',
    otp: '123456',
    office: 'AC (Land), Savar',
    parcels: ['BD-DHK-SAV-000001', 'BD-CTG-PAN-000492', 'BD-SYL-SRM-000108', 'BD-RAJ-PAB-000731'],
    label: 'Land office',
    bn: 'ভূমি অফিস',
    note: 'AC Land workbench: review queue, hearing notices, approval & flag resolution.',
  },
];

export const demoSmsAlerts: SmsAlert[] = [
  {
    id: 'sms-1',
    recipientPhone: '+880 1711-223344',
    senderId: 'BHUMISHEBA',
    messageText: 'ভূমি সেবা: আপনার খতিয়ান RS-4502 (দাগ ১২০৪) এর ভূমি উন্নয়ন কর বাৎসরিক ডিমান্ড প্রস্তুত হয়েছে। বিস্তারিত: land.gov.bd',
    timestamp: '2026-08-14T09:12:00.000Z',
    status: 'DELIVERED',
    type: 'TAX_PAYMENT',
  },
  {
    id: 'sms-2',
    recipientPhone: '+880 1711-223344',
    senderId: 'BHUMISHEBA',
    messageText: 'ভূমি সেবা নিরাপত্তা: খতিয়ান BD-DHK-SAV-000001 এর উপর একটি অডিট ও ডিসক্রেপ্যান্সি যাচাই সম্পন্ন হয়েছে।',
    timestamp: '2026-08-20T14:30:00.000Z',
    status: 'DELIVERED',
    type: 'MUTATION_ACTIVITY',
  },
];

export function getDemoDueDiligenceReport(parcel: Parcel): import('./types').DueDiligenceReport {
  const dueTax = parcel.taxRecords?.find((t) => t.status === 'PENDING');
  const hasFlags = (parcel.discrepancies?.filter((d) => !d.isResolved).length ?? 0) > 0;
  const areaDiff = parcel.mappedAreaDecimal ? Math.abs(parcel.mappedAreaDecimal - parcel.areaDecimal) : 0;
  
  let score = 95;
  if (dueTax) score -= 12;
  if (hasFlags) score -= 8;
  if (areaDiff > 0.05) score -= 15;
  if (parcel.isLocked) score += 5; // Land Lock adds security score

  const items: import('./types').DueDiligenceItem[] = [
    {
      id: 'dd-title',
      name: 'Ownership & Khatian Identity',
      nameBn: 'মালিকানা ও খতিয়ান মিল',
      status: 'PASS',
      finding: '100% Match with National Sub-Registry and e-Parcha record.',
      detail: `Owner "${parcel.currentOwner}" matches registered NID ${parcel.nidNumber}. Khatian ${parcel.khatianNo} is active and certified.`,
      statuteRef: 'State Acquisition and Tenancy Act 1950, Sec 143',
    },
    {
      id: 'dd-spatial',
      name: 'Cadastral Boundary & PostGIS Verification',
      nameBn: 'ভৌগোলিক সীমানা ও ডিজিটাল ড্রোন নকশা',
      status: areaDiff <= 0.05 ? 'PASS' : 'WARNING',
      finding: areaDiff <= 0.05 
        ? `Variance ${areaDiff.toFixed(2)} decimal is within statutory tolerance (≤ 0.05 dec).`
        : `Area discrepancy of ${areaDiff.toFixed(2)} decimal flagged between deed and polygon.`,
      detail: `Deed area: ${parcel.areaDecimal} dec; BDS digitized polygon: ${parcel.mappedAreaDecimal || parcel.areaDecimal} dec.`,
      statuteRef: 'Survey Act 1875 & DLRS Cadastral Standard 2024',
    },
    {
      id: 'dd-tax',
      name: 'Land Development Tax Clearance',
      nameBn: 'ভূমি উন্নয়ন কর হালনাগাদ দাখিলা',
      status: dueTax ? 'WARNING' : 'PASS',
      finding: dueTax ? `Unsettled tax demand for fiscal year ${dueTax.fiscalYear} (BDT ${dueTax.totalDueBDT}).` : 'All fiscal years paid up to date.',
      detail: dueTax ? 'Requires clearance of pending assessment prior to deed execution.' : 'No arrear liability detected.',
      statuteRef: 'Land Development Tax Ordinance 1976',
    },
    {
      id: 'dd-court',
      name: 'Litigation & Revenue Caveats',
      nameBn: 'আদালত ও দেওয়ানী মামলা যাচাই',
      status: 'PASS',
      finding: 'No active stay order, Section 144 injunction, or vesting notice found.',
      detail: 'Clean civil title. No pending lis pendens registered at Savar Senior Assistant Judge Court.',
      statuteRef: 'Civil Procedure Code, 1908 (Order XXXIX)',
    },
    {
      id: 'dd-mortgage',
      name: 'Bank Mortgage & Charge Freedom',
      nameBn: 'ব্যাংক দায় ও বন্ধকমুক্ত সনদ',
      status: 'PASS',
      finding: 'No registered equitable mortgage or institutional charge in CIB/Sub-Registry.',
      detail: 'Original deeds are unencumbered; no tripartite banking lien recorded.',
      statuteRef: 'Transfer of Property Act 1882, Sec 58',
    },
    {
      id: 'dd-class',
      name: 'Land Classification & Environmental Zoning',
      nameBn: 'জমির শ্রেণি ও পরিবেশগত ছাড়পত্র',
      status: 'PASS',
      finding: `Classified as "${parcel.landClass}". Complies with local upazila master plan.`,
      detail: 'Not classified as protected wetland (জলাশয়), government khas, or vested property.',
      statuteRef: 'Natural Water Reservoir Protection Act 2000',
    },
    {
      id: 'dd-mutation',
      name: 'e-Mutation Transfer Eligibility',
      nameBn: 'ই-নামজারি খারিজ যোগ্যতা ইনডেক্স',
      status: 'PASS',
      finding: 'Fully eligible for instantaneous digital mutation upon registration.',
      detail: 'Bifurcation holding chain verified down to RS parent dag 1204.',
      statuteRef: 'Ministry of Land Mutation Circular 2021',
    },
  ];

  const verdict = score >= 80 ? 'APPROVED_FOR_TRANSACTION' : score >= 60 ? 'CAUTION_REQUIRED' : 'DISPUTED_RESTRICTED';

  return {
    parcelId: parcel.id,
    score: Math.min(100, Math.max(10, score)),
    overallVerdict: verdict,
    generatedAt: new Date().toISOString(),
    verificationHash: `BD-DLRS-AUTH-${Math.random().toString(16).substring(2, 10).toUpperCase()}-2026`,
    qrCodeData: `https://land.gov.bd/verify/clearance?upid=${encodeURIComponent(parcel.id)}&hash=${Math.random().toString(16).substring(2, 8)}`,
    items,
  };
}

export function toggleDemoParcelLock(parcelId: string, pin: string): boolean {
  const p = findDemoParcel(parcelId);
  if (!p) return false;
  p.isLocked = !p.isLocked;
  p.lockedAt = p.isLocked ? new Date().toISOString() : undefined;
  p.lockedReason = p.isLocked ? 'Citizen Digital Lock Activated by Owner via biometric NID OTP' : undefined;
  
  // Add SMS Alert to radar
  demoSmsAlerts.unshift({
    id: `sms-${Date.now()}`,
    recipientPhone: p.phone,
    senderId: 'BHUMISHEBA',
    messageText: p.isLocked 
      ? `ভূমি সেবা নিরাপত্তা: আপনার খতিয়ান ${p.khatianNo} এ 'ভূমি লক' সক্রিয় হয়েছে। সাব-রেজিস্ট্রি বা নামজারি আবেদন সাময়িক স্থগিত থাকবে।`
      : `ভূমি সেবা নিরাপত্তা: আপনার খতিয়ান ${p.khatianNo} এর 'ভূমি লক' নিষ্ক্রিয় করা হয়েছে। স্বাভাবিক লেনদেন অনুমোদিত।`,
    timestamp: new Date().toISOString(),
    status: 'DELIVERED',
    type: 'LAND_LOCK',
  });
  return true;
}

