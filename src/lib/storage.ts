import { Client, MonthlyPackage, ContentItem, ContentType, ContentStatus } from '../types';

const CLIENTS_KEY = 'metaa_craze_clients_v1';
const PACKAGES_KEY = 'metaa_craze_packages_v1';
const CONTENT_KEY = 'metaa_craze_content_v1';
const ACCESS_SESSION_KEY = 'metaa_craze_access_session_v1';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  'Graphic Post': 'Graphic Post',
  'Video': 'Video',
  'Special Day Post': 'Special Day Post',
  'Cover Photo': 'Cover Photo',
  'Other': 'Other'
};

export const initialClients: Client[] = [
  {
    id: 'client-1',
    clientId: 'MC-CL-001',
    name: 'Apex Apparel',
    companyName: 'Apex Apparel Holdings Ltd',
    contactPerson: 'Dinesh Perera',
    contactNumber: '+94 77 123 4567',
    email: 'dinesh@apexapparel.lk',
    monthlyPackageFee: 'LKR 150,000 / Month',
    status: 'Active',
    notes: 'Premium formal & casual menswear brand. Requires high aesthetic standards and clean typography.',
    createdAt: '2026-08-01T09:00:00Z',
    defaultGraphicPostQty: 5,
    defaultVideoQty: 5,
    defaultSpecialDayPostQty: 1,
    defaultCoverPhotoQty: 1
  },
  {
    id: 'client-2',
    clientId: 'MC-CL-002',
    name: 'Cinnamon Bay Resort',
    companyName: 'Cinnamon Bay Hospitality (Pvt) Ltd',
    contactPerson: 'Amara Wickramasinghe',
    contactNumber: '+94 71 889 2233',
    email: 'marketing@cinnamonbayresort.com',
    monthlyPackageFee: 'LKR 250,000 / Month',
    status: 'Active',
    notes: 'Luxury boutique beachfront villas in Mirissa. Drone footage and sunset specials prioritized.',
    createdAt: '2026-07-15T11:30:00Z',
    defaultGraphicPostQty: 8,
    defaultVideoQty: 4,
    defaultSpecialDayPostQty: 2,
    defaultCoverPhotoQty: 1
  },
  {
    id: 'client-3',
    clientId: 'MC-CL-003',
    name: 'Urban Crust Pizza',
    companyName: 'Urban Crust Gourmet Kitchen',
    contactPerson: 'Kavinda Silva',
    contactNumber: '+94 76 554 9900',
    email: 'kavinda@urbancrust.lk',
    monthlyPackageFee: 'LKR 120,000 / Month',
    status: 'Active',
    notes: 'Artisan sourdough pizza chain with 3 Colombo branches. Heavy focus on weekend food reels.',
    createdAt: '2026-08-20T14:15:00Z',
    defaultGraphicPostQty: 6,
    defaultVideoQty: 3,
    defaultSpecialDayPostQty: 1,
    defaultCoverPhotoQty: 0
  },
  {
    id: 'client-4',
    clientId: 'MC-CL-004',
    name: 'Pulse Fitness Club',
    companyName: 'Pulse Wellness & Athletics',
    contactPerson: 'Shenal Fernando',
    contactNumber: '+94 70 334 1122',
    email: 'shenal@pulsefitness.lk',
    monthlyPackageFee: 'LKR 175,000 / Month',
    status: 'Active',
    notes: 'Elite gym and personal training studio. Emphasize trainer tips and transformation reels.',
    createdAt: '2026-09-01T10:00:00Z',
    defaultGraphicPostQty: 4,
    defaultVideoQty: 6,
    defaultSpecialDayPostQty: 1,
    defaultCoverPhotoQty: 1
  },
  {
    id: 'client-5',
    clientId: 'MC-CL-005',
    name: 'Old Town Heritage Gem',
    companyName: 'Old Town Antiques & Jewellery',
    contactPerson: 'M. Rizwan',
    contactNumber: '+94 77 990 0112',
    email: 'rizwan@oldtownheritage.com',
    monthlyPackageFee: 'LKR 100,000 / Month',
    status: 'Inactive',
    notes: 'Paused campaigns for store renovation during Q4 2026.',
    createdAt: '2026-06-10T08:00:00Z',
    defaultGraphicPostQty: 4,
    defaultVideoQty: 0,
    defaultSpecialDayPostQty: 0,
    defaultCoverPhotoQty: 0
  }
];

export const initialPackages: MonthlyPackage[] = [
  // October 2026 (Month 10)
  {
    id: 'pkg-oct-2026-1',
    packageId: 'PKG-202610-001',
    clientId: 'client-1', // Apex Apparel
    month: 10,
    year: 2026,
    graphicPostQty: 5,
    videoQty: 5,
    specialDayPostQty: 1,
    coverPhotoQty: 1,
    otherQty: 0,
    totalDeliverables: 12,
    status: 'Active',
    notes: 'Formal wear festive drop & corporate wear campaign for October.',
    createdAt: '2026-09-25T10:00:00Z'
  },
  {
    id: 'pkg-oct-2026-2',
    packageId: 'PKG-202610-002',
    clientId: 'client-2', // Cinnamon Bay
    month: 10,
    year: 2026,
    graphicPostQty: 8,
    videoQty: 4,
    specialDayPostQty: 2,
    coverPhotoQty: 1,
    otherQty: 0,
    totalDeliverables: 15,
    status: 'Active',
    notes: 'Early bird winter holiday bookings and wellness weekend packages.',
    createdAt: '2026-09-26T11:00:00Z'
  },
  {
    id: 'pkg-oct-2026-3',
    packageId: 'PKG-202610-003',
    clientId: 'client-3', // Urban Crust
    month: 10,
    year: 2026,
    graphicPostQty: 6,
    videoQty: 3,
    specialDayPostQty: 1,
    coverPhotoQty: 0,
    otherQty: 0,
    totalDeliverables: 10,
    status: 'Active',
    notes: 'Truffle Mushroom seasonal special launch & Oktoberfest promo.',
    createdAt: '2026-09-27T09:30:00Z'
  },
  {
    id: 'pkg-oct-2026-4',
    packageId: 'PKG-202610-004',
    clientId: 'client-4', // Pulse Fitness
    month: 10,
    year: 2026,
    graphicPostQty: 4,
    videoQty: 6,
    specialDayPostQty: 1,
    coverPhotoQty: 1,
    otherQty: 0,
    totalDeliverables: 12,
    status: 'Active',
    notes: 'HIIT boot camp intake & nutrition spotlight series.',
    createdAt: '2026-09-28T08:00:00Z'
  },
  // September 2026 (Month 9) - For history
  {
    id: 'pkg-sep-2026-1',
    packageId: 'PKG-202609-001',
    clientId: 'client-1',
    month: 9,
    year: 2026,
    graphicPostQty: 6,
    videoQty: 4,
    specialDayPostQty: 1,
    coverPhotoQty: 1,
    otherQty: 0,
    totalDeliverables: 12,
    status: 'Completed',
    notes: 'September Spring/Summer clearance campaign.',
    createdAt: '2026-08-25T10:00:00Z'
  }
];

export const initialContent: ContentItem[] = [
  // Apex Apparel (Client 1) - October 2026
  {
    id: 'cnt-101',
    contentId: 'CNT-202610-001',
    clientId: 'client-1',
    packageId: 'pkg-oct-2026-1',
    month: 10,
    year: 2026,
    contentType: 'Graphic Post',
    contentNumber: 1,
    displayNumber: 'Graphic Post 01',
    title: '10% discount for formal wear festive early bird',
    plannedDate: '2026-10-05',
    actualPublishedDate: '2026-10-05',
    status: 'Published',
    postUrl: 'https://instagram.com/p/DB1example01',
    remarks: 'Approved by Dinesh without revisions. Reached 3.4k impressions.',
    createdAt: '2026-09-28T10:00:00Z',
    updatedAt: '2026-10-05T14:30:00Z'
  },
  {
    id: 'cnt-102',
    contentId: 'CNT-202610-002',
    clientId: 'client-1',
    packageId: 'pkg-oct-2026-1',
    month: 10,
    year: 2026,
    contentType: 'Graphic Post',
    contentNumber: 2,
    displayNumber: 'Graphic Post 02',
    title: 'New formal wear collection introduction & fabric quality spotlight',
    plannedDate: '2026-10-10',
    actualPublishedDate: '2026-10-10',
    status: 'Published',
    postUrl: 'https://instagram.com/p/DB1example02',
    remarks: 'Carousel format showing cuff stitching and linen weave.',
    createdAt: '2026-09-28T10:15:00Z',
    updatedAt: '2026-10-10T16:00:00Z'
  },
  {
    id: 'cnt-103',
    contentId: 'CNT-202610-003',
    clientId: 'client-1',
    packageId: 'pkg-oct-2026-1',
    month: 10,
    year: 2026,
    contentType: 'Graphic Post',
    contentNumber: 3,
    displayNumber: 'Graphic Post 03',
    title: "Men's casual linen shirts weekend edit",
    plannedDate: '2026-10-15',
    actualPublishedDate: '',
    status: 'Approved',
    postUrl: '',
    remarks: 'Client approved caption and colour palette on 12th Oct.',
    createdAt: '2026-09-28T10:30:00Z',
    updatedAt: '2026-10-12T09:20:00Z'
  },
  {
    id: 'cnt-104',
    contentId: 'CNT-202610-004',
    clientId: 'client-1',
    packageId: 'pkg-oct-2026-1',
    month: 10,
    year: 2026,
    contentType: 'Graphic Post',
    contentNumber: 4,
    displayNumber: 'Graphic Post 04',
    title: 'Smart casual blazer styling tips for executive meetings',
    plannedDate: '2026-10-20',
    actualPublishedDate: '',
    status: 'In Progress',
    postUrl: '',
    remarks: 'Drafting 4-slide carousel layout with moodboard graphics.',
    createdAt: '2026-09-28T10:45:00Z',
    updatedAt: '2026-10-14T11:00:00Z'
  },
  {
    id: 'cnt-105',
    contentId: 'CNT-202610-005',
    clientId: 'client-1',
    packageId: 'pkg-oct-2026-1',
    month: 10,
    year: 2026,
    contentType: 'Graphic Post',
    contentNumber: 5,
    displayNumber: 'Graphic Post 05',
    title: 'Month-end corporate shopping privilege announcement',
    plannedDate: '2026-10-27',
    actualPublishedDate: '',
    status: 'Not Started',
    postUrl: '',
    remarks: 'Waiting for final discount code confirmation from Apex accounts.',
    createdAt: '2026-09-28T11:00:00Z',
    updatedAt: '2026-09-28T11:00:00Z'
  },
  {
    id: 'cnt-106',
    contentId: 'CNT-202610-006',
    clientId: 'client-1',
    packageId: 'pkg-oct-2026-1',
    month: 10,
    year: 2026,
    contentType: 'Video',
    contentNumber: 1,
    displayNumber: 'Video 01',
    title: 'Formal wear collection showcase reel (Fast-cut model b-roll)',
    plannedDate: '2026-10-08',
    actualPublishedDate: '2026-10-08',
    status: 'Published',
    postUrl: 'https://www.tiktok.com/@apexapparel/video/72899120938',
    remarks: 'High organic engagement. Over 15k views on TikTok.',
    createdAt: '2026-09-28T11:15:00Z',
    updatedAt: '2026-10-08T18:00:00Z'
  },
  {
    id: 'cnt-107',
    contentId: 'CNT-202610-007',
    clientId: 'client-1',
    packageId: 'pkg-oct-2026-1',
    month: 10,
    year: 2026,
    contentType: 'Video',
    contentNumber: 2,
    displayNumber: 'Video 02',
    title: 'Behind the Scenes: Tailoring perfection in workshop',
    plannedDate: '2026-10-14',
    actualPublishedDate: '',
    status: 'Pending Approval',
    postUrl: '',
    remarks: 'Submitted 45s reel preview to Dinesh on WhatsApp for final nod.',
    createdAt: '2026-09-28T11:30:00Z',
    updatedAt: '2026-10-13T16:45:00Z'
  },
  {
    id: 'cnt-108',
    contentId: 'CNT-202610-008',
    clientId: 'client-1',
    packageId: 'pkg-oct-2026-1',
    month: 10,
    year: 2026,
    contentType: 'Video',
    contentNumber: 3,
    displayNumber: 'Video 03',
    title: '3 Ways to Style a Navy Suit for Weddings and Work',
    plannedDate: '2026-10-18',
    actualPublishedDate: '',
    status: 'In Progress',
    postUrl: '',
    remarks: 'Colour grading voiceover sync.',
    createdAt: '2026-09-28T11:45:00Z',
    updatedAt: '2026-10-14T10:00:00Z'
  },
  {
    id: 'cnt-109',
    contentId: 'CNT-202610-009',
    clientId: 'client-1',
    packageId: 'pkg-oct-2026-1',
    month: 10,
    year: 2026,
    contentType: 'Video',
    contentNumber: 4,
    displayNumber: 'Video 04',
    title: 'Customer review & unboxing luxury suit packaging',
    plannedDate: '2026-10-22',
    actualPublishedDate: '',
    status: 'Not Started',
    postUrl: '',
    remarks: 'Scheduled shoot on 19th October at flagship store.',
    createdAt: '2026-09-28T12:00:00Z',
    updatedAt: '2026-09-28T12:00:00Z'
  },
  {
    id: 'cnt-110',
    contentId: 'CNT-202610-010',
    clientId: 'client-1',
    packageId: 'pkg-oct-2026-1',
    month: 10,
    year: 2026,
    contentType: 'Video',
    contentNumber: 5,
    displayNumber: 'Video 05',
    title: 'October Month wrap-up reel & upcoming Winter teaser',
    plannedDate: '2026-10-30',
    actualPublishedDate: '',
    status: 'Not Started',
    postUrl: '',
    remarks: '',
    createdAt: '2026-09-28T12:15:00Z',
    updatedAt: '2026-09-28T12:15:00Z'
  },
  {
    id: 'cnt-111',
    contentId: 'CNT-202610-011',
    clientId: 'client-1',
    packageId: 'pkg-oct-2026-1',
    month: 10,
    year: 2026,
    contentType: 'Special Day Post',
    contentNumber: 1,
    displayNumber: 'Special Day Post 01',
    title: 'World Teachers’ Day & Mentorship tribute post',
    plannedDate: '2026-10-05',
    actualPublishedDate: '2026-10-05',
    status: 'Published',
    postUrl: 'https://facebook.com/apexapparel/posts/99123847',
    remarks: 'Published on Facebook & LinkedIn.',
    createdAt: '2026-09-28T12:30:00Z',
    updatedAt: '2026-10-05T08:00:00Z'
  },
  {
    id: 'cnt-112',
    contentId: 'CNT-202610-012',
    clientId: 'client-1',
    packageId: 'pkg-oct-2026-1',
    month: 10,
    year: 2026,
    contentType: 'Cover Photo',
    contentNumber: 1,
    displayNumber: 'Cover Photo 01',
    title: 'October Autumn Elegance Facebook & LinkedIn Banner',
    plannedDate: '2026-10-01',
    actualPublishedDate: '2026-10-01',
    status: 'Published',
    postUrl: 'https://facebook.com/apexapparel',
    remarks: 'Updated across FB Page and LinkedIn Company page.',
    createdAt: '2026-09-28T12:45:00Z',
    updatedAt: '2026-10-01T09:00:00Z'
  },

  // Cinnamon Bay Resort (Client 2) - October 2026 (15 deliverables, 12 published)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `cnt-20${i + 1}`,
    contentId: `CNT-202610-02${i + 1}`,
    clientId: 'client-2',
    packageId: 'pkg-oct-2026-2',
    month: 10,
    year: 2026,
    contentType: 'Graphic Post' as ContentType,
    contentNumber: i + 1,
    displayNumber: `Graphic Post 0${i + 1}`,
    title: [
      'Sunset infinity pool luxury package feature',
      'Private candlelight beach dinner experience',
      'Spa and Ayurveda rejuvenation retreat discount',
      'Signature Sri Lankan seafood feast menu spotlight',
      'Oceanfront villa morning view and breakfast bed',
      'Early bird winter getaway booking offer (15% off)',
      'Whale watching seasonal excursion package',
      'Cocktail hour happy hour 2-for-1 at Palm Bar'
    ][i],
    plannedDate: `2026-10-0${(i * 3) + 2}`.slice(0, 10),
    actualPublishedDate: i < 6 ? `2026-10-0${(i * 3) + 2}`.slice(0, 10) : '',
    status: (i < 6 ? 'Published' : i === 6 ? 'Approved' : 'In Progress') as ContentStatus,
    postUrl: i < 6 ? `https://instagram.com/cinnamonbayresort/p/oct${i + 1}` : '',
    remarks: i < 6 ? 'High tourist response via DMs' : 'In final review',
    createdAt: '2026-09-26T12:00:00Z',
    updatedAt: '2026-10-10T12:00:00Z'
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `cnt-21${i + 1}`,
    contentId: `CNT-202610-03${i + 1}`,
    clientId: 'client-2',
    packageId: 'pkg-oct-2026-2',
    month: 10,
    year: 2026,
    contentType: 'Video' as ContentType,
    contentNumber: i + 1,
    displayNumber: `Video 0${i + 1}`,
    title: [
      'Drone flyover: Golden hour above Mirissa Bay',
      'Master Chef culinary preparation of Jumbo Prawns',
      'Guest experience reel: 48 hours at Cinnamon Bay',
      'Sunset yoga session on private ocean deck'
    ][i],
    plannedDate: `2026-10-0${(i * 6) + 4}`.slice(0, 10),
    actualPublishedDate: i < 3 ? `2026-10-0${(i * 6) + 4}`.slice(0, 10) : '',
    status: (i < 3 ? 'Published' : 'In Progress') as ContentStatus,
    postUrl: i < 3 ? `https://www.tiktok.com/@cinnamonbay/video/99823${i}` : '',
    remarks: i < 3 ? 'Viral organic reach on TikTok' : '',
    createdAt: '2026-09-26T12:00:00Z',
    updatedAt: '2026-10-12T12:00:00Z'
  })),
  {
    id: 'cnt-221',
    contentId: 'CNT-202610-041',
    clientId: 'client-2',
    packageId: 'pkg-oct-2026-2',
    month: 10,
    year: 2026,
    contentType: 'Special Day Post',
    contentNumber: 1,
    displayNumber: 'Special Day Post 01',
    title: 'World Tourism Day greetings & sustainable hospitality pledge',
    plannedDate: '2026-10-04',
    actualPublishedDate: '2026-10-04',
    status: 'Published',
    postUrl: 'https://instagram.com/p/DBtourism26',
    remarks: 'Shared by Sri Lanka Tourism repost.',
    createdAt: '2026-09-26T12:00:00Z',
    updatedAt: '2026-10-04T09:00:00Z'
  },
  {
    id: 'cnt-222',
    contentId: 'CNT-202610-042',
    clientId: 'client-2',
    packageId: 'pkg-oct-2026-2',
    month: 10,
    year: 2026,
    contentType: 'Special Day Post',
    contentNumber: 2,
    displayNumber: 'Special Day Post 02',
    title: 'Full Moon Poya Day serene beach reflection',
    plannedDate: '2026-10-25',
    actualPublishedDate: '',
    status: 'Approved',
    postUrl: '',
    remarks: 'Scheduled in advance.',
    createdAt: '2026-09-26T12:00:00Z',
    updatedAt: '2026-10-11T14:00:00Z'
  },
  {
    id: 'cnt-223',
    contentId: 'CNT-202610-043',
    clientId: 'client-2',
    packageId: 'pkg-oct-2026-2',
    month: 10,
    year: 2026,
    contentType: 'Cover Photo',
    contentNumber: 1,
    displayNumber: 'Cover Photo 01',
    title: 'Tropical Retreat October Facebook Banner',
    plannedDate: '2026-10-01',
    actualPublishedDate: '2026-10-01',
    status: 'Published',
    postUrl: 'https://facebook.com/cinnamonbayresort',
    remarks: 'Clean high-res drone image banner.',
    createdAt: '2026-09-26T12:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z'
  },

  // Urban Crust (Client 3) - October 2026
  {
    id: 'cnt-301',
    contentId: 'CNT-202610-051',
    clientId: 'client-3',
    packageId: 'pkg-oct-2026-3',
    month: 10,
    year: 2026,
    contentType: 'Graphic Post',
    contentNumber: 1,
    displayNumber: 'Graphic Post 01',
    title: 'Truffle Mushroom Artisan Pizza launch promo',
    plannedDate: '2026-10-03',
    actualPublishedDate: '2026-10-03',
    status: 'Published',
    postUrl: 'https://instagram.com/p/DBpizzanew',
    remarks: 'Store sold out in 3 hours.',
    createdAt: '2026-09-27T10:00:00Z',
    updatedAt: '2026-10-03T17:00:00Z'
  },
  {
    id: 'cnt-302',
    contentId: 'CNT-202610-052',
    clientId: 'client-3',
    packageId: 'pkg-oct-2026-3',
    month: 10,
    year: 2026,
    contentType: 'Graphic Post',
    contentNumber: 2,
    displayNumber: 'Graphic Post 02',
    title: 'Midweek BOGO: Buy 1 Large Get Garlic Dough Balls Free',
    plannedDate: '2026-10-07',
    actualPublishedDate: '2026-10-07',
    status: 'Published',
    postUrl: 'https://instagram.com/p/DBbogo26',
    remarks: 'Active promo story highlight.',
    createdAt: '2026-09-27T10:00:00Z',
    updatedAt: '2026-10-07T12:00:00Z'
  },
  {
    id: 'cnt-303',
    contentId: 'CNT-202610-053',
    clientId: 'client-3',
    packageId: 'pkg-oct-2026-3',
    month: 10,
    year: 2026,
    contentType: 'Graphic Post',
    contentNumber: 3,
    displayNumber: 'Graphic Post 03',
    title: 'Sourdough 48-Hour Fermentation craftsmanship post',
    plannedDate: '2026-10-12',
    actualPublishedDate: '',
    status: 'On Hold',
    postUrl: '',
    remarks: 'Client requested hold until new chef photoshoot is finalized.',
    createdAt: '2026-09-27T10:00:00Z',
    updatedAt: '2026-10-11T15:00:00Z'
  },
  {
    id: 'cnt-304',
    contentId: 'CNT-202610-054',
    clientId: 'client-3',
    packageId: 'pkg-oct-2026-3',
    month: 10,
    year: 2026,
    contentType: 'Video',
    contentNumber: 1,
    displayNumber: 'Video 01',
    title: 'Woodfired oven 90-second blistering cheese pull ASMR',
    plannedDate: '2026-10-06',
    actualPublishedDate: '2026-10-06',
    status: 'Published',
    postUrl: 'https://www.tiktok.com/@urbancrust/video/11029384',
    remarks: 'Over 28k views and 1.8k saves.',
    createdAt: '2026-09-27T10:00:00Z',
    updatedAt: '2026-10-06T18:30:00Z'
  },
  {
    id: 'cnt-305',
    contentId: 'CNT-202610-055',
    clientId: 'client-3',
    packageId: 'pkg-oct-2026-3',
    month: 10,
    year: 2026,
    contentType: 'Special Day Post',
    contentNumber: 1,
    displayNumber: 'Special Day Post 01',
    title: 'International Pizza & Pasta Festival celebration',
    plannedDate: '2026-10-15',
    actualPublishedDate: '',
    status: 'Approved',
    postUrl: '',
    remarks: 'Scheduled for publishing with UberEats promo code.',
    createdAt: '2026-09-27T10:00:00Z',
    updatedAt: '2026-10-13T10:00:00Z'
  },

  // Pulse Fitness (Client 4) - October 2026
  {
    id: 'cnt-401',
    contentId: 'CNT-202610-061',
    clientId: 'client-4',
    packageId: 'pkg-oct-2026-4',
    month: 10,
    year: 2026,
    contentType: 'Graphic Post',
    contentNumber: 1,
    displayNumber: 'Graphic Post 01',
    title: 'October Fitness Reset: 30-Day transformation challenge signup',
    plannedDate: '2026-10-02',
    actualPublishedDate: '2026-10-02',
    status: 'Published',
    postUrl: 'https://instagram.com/p/DBpulse01',
    remarks: '18 new member signups recorded through link in bio.',
    createdAt: '2026-09-28T09:00:00Z',
    updatedAt: '2026-10-02T11:00:00Z'
  },
  {
    id: 'cnt-402',
    contentId: 'CNT-202610-062',
    clientId: 'client-4',
    packageId: 'pkg-oct-2026-4',
    month: 10,
    year: 2026,
    contentType: 'Video',
    contentNumber: 1,
    displayNumber: 'Video 01',
    title: 'Trainer Tip: Proper deadlift mechanics & spine protection',
    plannedDate: '2026-10-09',
    actualPublishedDate: '2026-10-09',
    status: 'Published',
    postUrl: 'https://instagram.com/reel/DBdeadlift',
    remarks: 'Saved by 340 users.',
    createdAt: '2026-09-28T09:00:00Z',
    updatedAt: '2026-10-09T17:00:00Z'
  },
  {
    id: 'cnt-403',
    contentId: 'CNT-202610-063',
    clientId: 'client-4',
    packageId: 'pkg-oct-2026-4',
    month: 10,
    year: 2026,
    contentType: 'Video',
    contentNumber: 2,
    displayNumber: 'Video 02',
    title: 'High Intensity Spin Class high-energy pump reel',
    plannedDate: '2026-10-11',
    actualPublishedDate: '',
    status: 'Approved',
    postUrl: '',
    remarks: 'Ready to post on Friday evening.',
    createdAt: '2026-09-28T09:00:00Z',
    updatedAt: '2026-10-10T14:00:00Z'
  },
  {
    id: 'cnt-404',
    contentId: 'CNT-202610-064',
    clientId: 'client-4',
    packageId: 'pkg-oct-2026-4',
    month: 10,
    year: 2026,
    contentType: 'Special Day Post',
    contentNumber: 1,
    displayNumber: 'Special Day Post 01',
    title: 'World Mental Health Day: The Mind-Body Connection in Exercise',
    plannedDate: '2026-10-10',
    actualPublishedDate: '2026-10-10',
    status: 'Published',
    postUrl: 'https://instagram.com/p/DBmentalhealth',
    remarks: 'Heartfelt post with positive community sentiment.',
    createdAt: '2026-09-28T09:00:00Z',
    updatedAt: '2026-10-10T09:00:00Z'
  },

  // September 2026 (Month 9) - Completed client-1 records for history
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `cnt-sep-10${i + 1}`,
    contentId: `CNT-202609-00${i + 1}`,
    clientId: 'client-1',
    packageId: 'pkg-sep-2026-1',
    month: 9,
    year: 2026,
    contentType: 'Graphic Post' as ContentType,
    contentNumber: i + 1,
    displayNumber: `Graphic Post 0${i + 1}`,
    title: [
      'Spring/Summer clearance sale kickoff announcement',
      'Exclusive bespoke tailoring booking promotion',
      'Cotton fabric breatheability infographic carousel',
      'Weekend style inspiration: Smart casual loafers & chinos',
      'Customer spotlight: Corporate lawyer in custom 3-piece',
      'End of season last chance discount reminder'
    ][i],
    plannedDate: `2026-09-0${(i * 4) + 2}`.slice(0, 10),
    actualPublishedDate: `2026-09-0${(i * 4) + 2}`.slice(0, 10),
    status: 'Published' as ContentStatus,
    postUrl: `https://instagram.com/p/sep_apex_post_${i + 1}`,
    remarks: 'Delivered and published on schedule.',
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: `2026-09-0${(i * 4) + 2}T12:00:00Z`.slice(0, 19) + 'Z'
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `cnt-sep-11${i + 1}`,
    contentId: `CNT-202609-01${i + 1}`,
    clientId: 'client-1',
    packageId: 'pkg-sep-2026-1',
    month: 9,
    year: 2026,
    contentType: 'Video' as ContentType,
    contentNumber: i + 1,
    displayNumber: `Video 0${i + 1}`,
    title: [
      'Suit fit guide: How jacket sleeves should fall',
      'Fabric cutting precision masterclass',
      'How to fold a pocket square like a gentleman',
      '30-second wardrobe essentials transition video'
    ][i],
    plannedDate: `2026-09-0${(i * 6) + 5}`.slice(0, 10),
    actualPublishedDate: `2026-09-0${(i * 6) + 5}`.slice(0, 10),
    status: 'Published' as ContentStatus,
    postUrl: `https://tiktok.com/@apex/video/sep_vid_${i + 1}`,
    remarks: 'High engagement and direct leads.',
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: `2026-09-0${(i * 6) + 5}T15:00:00Z`.slice(0, 19) + 'Z'
  })),
  {
    id: 'cnt-sep-121',
    contentId: 'CNT-202609-021',
    clientId: 'client-1',
    packageId: 'pkg-sep-2026-1',
    month: 9,
    year: 2026,
    contentType: 'Special Day Post',
    contentNumber: 1,
    displayNumber: 'Special Day Post 01',
    title: 'Binara Full Moon Poya Day peace message',
    plannedDate: '2026-09-25',
    actualPublishedDate: '2026-09-25',
    status: 'Published',
    postUrl: 'https://facebook.com/apex/posts/poya26',
    remarks: 'Published on schedule.',
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-09-25T08:00:00Z'
  },
  {
    id: 'cnt-sep-122',
    contentId: 'CNT-202609-022',
    clientId: 'client-1',
    packageId: 'pkg-sep-2026-1',
    month: 9,
    year: 2026,
    contentType: 'Cover Photo',
    contentNumber: 1,
    displayNumber: 'Cover Photo 01',
    title: 'September Spring/Summer Refresh Banner',
    plannedDate: '2026-09-01',
    actualPublishedDate: '2026-09-01',
    status: 'Published',
    postUrl: 'https://facebook.com/apex',
    remarks: 'Refreshed header.',
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-09-01T09:00:00Z'
  }
];

// Storage helpers
export const getStoredClients = (): Client[] => {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (!raw) {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(initialClients));
      return initialClients;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading clients from storage:', e);
    return initialClients;
  }
};

export const saveClients = (clients: Client[]): void => {
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch (e) {
    console.error('Error saving clients:', e);
  }
};

export const getStoredPackages = (): MonthlyPackage[] => {
  try {
    const raw = localStorage.getItem(PACKAGES_KEY);
    if (!raw) {
      localStorage.setItem(PACKAGES_KEY, JSON.stringify(initialPackages));
      return initialPackages;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading packages from storage:', e);
    return initialPackages;
  }
};

export const savePackages = (packages: MonthlyPackage[]): void => {
  try {
    localStorage.setItem(PACKAGES_KEY, JSON.stringify(packages));
  } catch (e) {
    console.error('Error saving packages:', e);
  }
};

export const getStoredContent = (): ContentItem[] => {
  try {
    const raw = localStorage.getItem(CONTENT_KEY);
    if (!raw) {
      localStorage.setItem(CONTENT_KEY, JSON.stringify(initialContent));
      return initialContent;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading content from storage:', e);
    return initialContent;
  }
};

export const saveContent = (content: ContentItem[]): void => {
  try {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
  } catch (e) {
    console.error('Error saving content:', e);
  }
};

// Reset to sample data helper
export const resetToInitialData = () => {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(initialClients));
  localStorage.setItem(PACKAGES_KEY, JSON.stringify(initialPackages));
  localStorage.setItem(CONTENT_KEY, JSON.stringify(initialContent));
};

const ADMIN_USERS_KEY = 'metaa_craze_admin_users_v1';

const initialAdminUsers = [
  {
    id: 'admin-1',
    name: 'Agency Management',
    email: 'imadu.mcraze@gmail.com',
    roleTitle: 'Managing Director',
    addedAt: '2026-08-01T00:00:00Z'
  }
];

export const getStoredAdminUsers = () => {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(initialAdminUsers));
    return initialAdminUsers;
  } catch (e) {
    return initialAdminUsers;
  }
};

export const saveAdminUsers = (users: any[]) => {
  try {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving admin users:', e);
  }
};

export const getStoredAccessSession = (): { role: 'admin' | 'viewer' | 'client'; clientId?: string } => {
  try {
    const raw = localStorage.getItem(ACCESS_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading access session:', e);
  }
  return { role: 'admin' };
};

export const saveAccessSession = (session: { role: 'admin' | 'viewer' | 'client'; clientId?: string }): void => {
  try {
    localStorage.setItem(ACCESS_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Error saving access session:', e);
  }
};

// Formats number to 2 digits, e.g. 1 -> "01"
export const formatContentNumber = (num: number): string => {
  return num < 10 ? `0${num}` : `${num}`;
};

// Generate content title / display label, e.g. "Graphic Post 01"
export const formatDisplayNumber = (type: ContentType, num: number): string => {
  return `${type} ${formatContentNumber(num)}`;
};

// Check if content item is overdue
export const isContentOverdue = (item: ContentItem, referenceDateStr: string = new Date().toISOString().split('T')[0]): boolean => {
  if (item.status === 'Published') return false;
  if (!item.plannedDate) return false;
  return item.plannedDate < referenceDateStr;
};
