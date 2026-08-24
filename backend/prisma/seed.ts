import { PrismaClient, MutationStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Bangladesh Land Platform authoritative data...');

  // Clean existing records
  await prisma.complaint.deleteMany();
  await prisma.discrepancy.deleteMany();
  await prisma.document.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.taxRecord.deleteMany();
  await prisma.mutation.deleteMany();
  await prisma.parcel.deleteMany();

  // 1. Primary Parcel: Savar, Dhaka (Residential / Homestead)
  const parcel1 = await prisma.parcel.create({
    data: {
      id: 'BD-DHK-SAV-000001',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Savar',
      mouza: 'Tetuljhora',
      jlNumber: 42,
      khatianNo: 'RS-4502 / BS-1890',
      dagNo: '1204 / 1205 (Part)',
      holdingNo: 'H-89/A (Ward 04)',
      landClass: 'Homestead — বাস্তুভিটা',
      areaDecimal: 5.5,
      currentOwner: 'Md. Rafiqul Islam (মোঃ রফিকুল ইসলাম)',
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
      mutations: {
        create: [
          {
            caseNumber: 'MUT-2026-DH-1044',
            applicantName: 'Kamal Hossain (Co-heir)',
            applicantNid: '19902699876543210',
            applicantPhone: '+880 1819-556677',
            proposedOwner: 'Kamal Hossain',
            status: MutationStatus.KANUNGO_VERIFICATION,
            currentStage: 'Stage 2: Kanungo Field Survey & Spot Report Pending',
            hearingDate: new Date('2026-09-10'),
            dcrAmount: 1150.0,
            remarks: 'Filed as co-heir. Awaiting spot survey verification report.',
          },
          {
            caseNumber: 'MUT-2026-DH-0941',
            applicantName: 'Md. Rafiqul Islam',
            applicantNid: '19852691234567890',
            applicantPhone: '+880 1711-223344',
            proposedOwner: 'Md. Rafiqul Islam',
            status: MutationStatus.APPROVED,
            currentStage: 'Stage 4: DCR Payment Verified & Final Khatiyan Issued',
            hearingDate: new Date('2026-02-15'),
            dcrAmount: 1150.0,
            remarks: 'Hearing closed with no objection. Ownership registered.',
          },
        ],
      },
      taxRecords: {
        create: [
          {
            fiscalYear: '1433–1434 (2026–2027)',
            annualDemandBDT: 1350.0,
            arrearAmountBDT: 0.0,
            totalDueBDT: 1350.0,
            paidAmountBDT: 0.0,
            status: PaymentStatus.PENDING,
            trxId: null,
            paymentMethod: null,
            dakhilaNumber: null,
            qrCodeUrl: null,
          },
          {
            fiscalYear: '1432–1433 (2025–2026)',
            annualDemandBDT: 1220.0,
            arrearAmountBDT: 0.0,
            totalDueBDT: 1220.0,
            paidAmountBDT: 1220.0,
            status: PaymentStatus.RECONCILED,
            trxId: 'BKASH_48120945',
            paymentMethod: 'bKash Digital Gateway',
            dakhilaNumber: 'DAK-2025-418822',
            qrCodeUrl: 'https://land.gov.bd/verify/dakhila/DAK-2025-418822',
            paymentDate: new Date('2025-06-11T09:24:00Z'),
            reconciledAt: new Date('2025-06-11T09:30:00Z'),
            reconciledBy: 'n8n-automated-reconciler',
          },
        ],
      },
      timelineEvents: {
        create: [
          {
            eventType: 'MUTATION_SUBMITTED',
            title: 'নামজারি filed by a co-heir',
            description: 'Kamal Hossain applied to record a share of this parcel.',
            actor: 'Upazila Land Office, Savar',
            referenceDoc: 'MUT-2026-DH-1044',
            eventDate: new Date('2026-07-28T06:10:00Z'),
          },
          {
            eventType: 'TAX_PAID',
            title: 'Land tax paid for 1432–1433',
            description: '৳1,220 received. দাখিলা DAK-2025-418822 issued.',
            actor: 'Md. Rafiqul Islam',
            referenceDoc: 'DAK-2025-418822',
            eventDate: new Date('2025-06-11T09:24:00Z'),
          },
          {
            eventType: 'MUTATION_APPROVED',
            title: 'নামজারি completed',
            description: 'Ownership recorded after the AC (Land) hearing without objection.',
            actor: 'AC (Land), Savar',
            referenceDoc: 'MUT-2026-DH-0941',
            eventDate: new Date('2026-02-15T10:00:00Z'),
          },
          {
            eventType: 'SURVEY',
            title: 'BS sheet digitised',
            description: 'Boundary vectorised from BS 2015 mouza sheet 04 with BDS GPS anchors.',
            actor: 'DLRS',
            referenceDoc: 'BS-SHEET-04',
            eventDate: new Date('2024-11-02T00:00:00Z'),
          },
        ],
      },
      discrepancies: {
        create: [
          {
            mismatchType: 'Recorded area differs from mapped area',
            sourceA: 'খতিয়ান RS-4502 — 5.50 decimal',
            sourceB: 'DLRS vector boundary — 5.52 decimal',
            severity: 'LOW',
            isResolved: false,
            flaggedBy: 'reconciliation service',
          },
        ],
      },
      complaints: {
        create: [
          {
            trackingNo: 'CMP-SAV-2026-0041',
            complainant: 'Abdul Karim (Neighbor)',
            phone: '+880 1819-001122',
            category: 'Plot Boundary Demarcation (সীমানা নির্ধারণ)',
            description: 'Request for joint physical survey for North-Western ridge boundary demarcation.',
            assignedOffice: 'Tetuljhora Union Land Office, Savar',
            status: 'ROUTED',
          },
        ],
      },
      documents: {
        create: [
          {
            docType: 'দলিল',
            fileName: 'deed-4471-2019.pdf',
            fileUrl: 'https://land.gov.bd/deeds/deed-4471-2019.pdf',
            ocrText: 'সাব-রেজিস্ট্রি দলিল ৪৪৭১/২০১৯ • সাভার সাব-রেজিস্ট্রি অফিস • দাগ ১২০৪ • গ্রহীতা মোঃ রফিকুল ইসলাম',
          },
          {
            docType: 'খতিয়ান',
            fileName: 'khatian-bs-1890.pdf',
            fileUrl: 'https://land.gov.bd/parcha/bs-1890-dhk.pdf',
            ocrText: 'খতিয়ান নং ১৮৯০ • মৌজা তেঁতুলঝোড়া • দাগ ১২০৪ • অংশ ৫.৫০ শতক • মালিক মোঃ রফিকুল ইসলাম',
          },
          {
            docType: 'দাখিলা',
            fileName: 'dakhila-2025-418822.pdf',
            fileUrl: 'https://land.gov.bd/dakhila/DAK-2025-418822.pdf',
            ocrText: 'ভূমি উন্নয়ন কর দাখিলা • দাখিলা নং DAK-2025-418822 • পরিশোধিত ১২২০ টাকা',
          },
        ],
      },
    },
  });

  // 2. Secondary Parcel: Panchlaish, Chittagong (Commercial)
  const parcel2 = await prisma.parcel.create({
    data: {
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
      currentOwner: 'Nurjahan Begum (নূরজাহান বেগম)',
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
      taxRecords: {
        create: [
          {
            fiscalYear: '1433–1434 (2026–2027)',
            annualDemandBDT: 4800.0,
            arrearAmountBDT: 0.0,
            totalDueBDT: 4800.0,
            paidAmountBDT: 4800.0,
            status: PaymentStatus.VERIFIED,
            trxId: 'EKPAY_77A82910',
            paymentMethod: 'Ekpay Gateway',
            dakhilaNumber: 'DAK-2026-993812',
            qrCodeUrl: 'https://land.gov.bd/verify/dakhila/DAK-2026-993812',
            paymentDate: new Date('2026-05-10'),
          },
        ],
      },
      timelineEvents: {
        create: [
          {
            eventType: 'TAX_PAID',
            title: 'Commercial LD Tax Settled',
            description: '৳4,800 cleared via Ekpay. Verified Dakhila DAK-2026-993812 issued.',
            actor: 'Nurjahan Begum',
            referenceDoc: 'DAK-2026-993812',
            eventDate: new Date('2026-05-10T11:00:00Z'),
          },
        ],
      },
      discrepancies: {
        create: [
          {
            mismatchType: 'Boundary overlaps the neighbouring dag',
            sourceA: 'CS map sheet (legacy 1940)',
            sourceB: 'DLRS 2026 vector boundary',
            severity: 'MEDIUM',
            isResolved: false,
            flaggedBy: 'reconciliation service',
          },
        ],
      },
      documents: {
        create: [
          {
            docType: 'খতিয়ান',
            fileName: 'khatian-bs-2214.pdf',
            fileUrl: 'https://land.gov.bd/parcha/bs-2214-ctg.pdf',
            ocrText: 'খতিয়ান নং ২২১৪ • মৌজা নাসিরাবাদ • দাগ ৮০৬ • পরিমাণ ১২ শতক বাণিজ্যিক',
          },
        ],
      },
    },
  });

  // 3. Third Parcel: Sreemangal, Sylhet (Agricultural / Tea Garden)
  await prisma.parcel.create({
    data: {
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
      currentOwner: 'Syed Shamsul Haque (সৈয়দ শামসুল হক)',
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
      taxRecords: {
        create: [
          {
            fiscalYear: '1433–1434 (2026–2027)',
            annualDemandBDT: 675.0,
            arrearAmountBDT: 0.0,
            totalDueBDT: 675.0,
            paidAmountBDT: 0.0,
            status: PaymentStatus.PENDING,
            trxId: null,
            paymentMethod: null,
            dakhilaNumber: null,
            qrCodeUrl: null,
          },
        ],
      },
      timelineEvents: {
        create: [
          {
            eventType: 'SURVEY',
            title: 'BDS Digital Survey GPS Tagging',
            description: 'Agricultural boundary georeferenced with GPS benchmarks.',
            actor: 'DLRS Sylhet Zone',
            referenceDoc: 'BDS-SYL-2026',
            eventDate: new Date('2026-03-01T00:00:00Z'),
          },
        ],
      },
      documents: {
        create: [
          {
            docType: 'খতিয়ান',
            fileName: 'khatian-bs-5510.pdf',
            fileUrl: 'https://land.gov.bd/parcha/bs-5510-syl.pdf',
            ocrText: 'খতিয়ান নং ৫৫১০ • মৌজা রাধানগর • দাগ ৩১২ • পরিমাণ ৪৫ শতক',
          },
        ],
      },
    },
  });

  // 4. Fourth Parcel: Ishwardi, Pabna / Rajshahi (Mango Orchard / Agricultural)
  await prisma.parcel.create({
    data: {
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
      currentOwner: 'Abdur Rahim Mandal (আব্দুর রহিম মন্ডল)',
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
      taxRecords: {
        create: [
          {
            fiscalYear: '1433–1434 (2026–2027)',
            annualDemandBDT: 275.0,
            arrearAmountBDT: 0.0,
            totalDueBDT: 275.0,
            paidAmountBDT: 275.0,
            status: PaymentStatus.VERIFIED,
            trxId: 'NAGAD_88K120',
            paymentMethod: 'Nagad',
            dakhilaNumber: 'DAK-2026-119283',
            qrCodeUrl: 'https://land.gov.bd/verify/dakhila/DAK-2026-119283',
            paymentDate: new Date('2026-06-01'),
          },
        ],
      },
      timelineEvents: {
        create: [
          {
            eventType: 'TAX_PAID',
            title: 'Orchard Land Tax Cleared',
            description: '৳275 paid via Nagad. Dakhila DAK-2026-119283 issued.',
            actor: 'Abdur Rahim Mandal',
            referenceDoc: 'DAK-2026-119283',
            eventDate: new Date('2026-06-01T10:00:00Z'),
          },
        ],
      },
      documents: {
        create: [
          {
            docType: 'খতিয়ান',
            fileName: 'khatian-bs-3341.pdf',
            fileUrl: 'https://land.gov.bd/parcha/bs-3341-pab.pdf',
            ocrText: 'খতিয়ান নং ৩৩৪১ • মৌজা পাকশী • দাগ ৫৫০ • ১৮.৫০ শতক ফলদ বাগান',
          },
        ],
      },
    },
  });

  console.log(`✅ Seed completed with 4 national parcels across Dhaka, Chittagong, Sylhet, and Rajshahi!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
