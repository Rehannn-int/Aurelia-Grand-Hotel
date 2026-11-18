import { getEnv } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import RoomCategory from '../models/RoomCategory.js';
import Room from '../models/Room.js';

const env = getEnv();
if (process.env.SEED_DEMO_DATA !== 'true') {
  throw new Error('Seeding is disabled. Set SEED_DEMO_DATA=true to explicitly seed hotel inventory.');
}
if (env.NODE_ENV === 'production') throw new Error('Room inventory cannot be seeded in production.');

const categorySeed = [
  {
    name: 'Deluxe Room',
    slug: 'deluxe-room',
    description: 'A refined city-facing room with warm textures, plush bedding, and a restful design for short stays and longer visits.',
    basePrice: 7200,
    maxOccupancy: 2,
    bedConfiguration: 'Queen bed',
    size: '36 m²',
    amenities: ['City view', 'Rainfall shower', 'Complimentary breakfast', 'Workspace'],
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    name: 'Premium Deluxe Room',
    slug: 'premium-deluxe-room',
    description: 'An elevated stay with expanded living comfort, refined finishes, and a balcony for quiet morning coffee and sunset views.',
    basePrice: 9800,
    maxOccupancy: 3,
    bedConfiguration: 'King bed',
    size: '44 m²',
    amenities: ['Private balcony', 'Premium linens', 'Coffee station', 'Garden view'],
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    name: 'Executive Room',
    slug: 'executive-room',
    description: 'Executive comfort with tailored hospitality, a productive workspace, and elegant details designed for business travelers.',
    basePrice: 14000,
    maxOccupancy: 3,
    bedConfiguration: 'King bed',
    size: '50 m²',
    amenities: ['Executive lounge access', 'Workspace', 'High-speed Wi-Fi', 'In-room dining'],
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    name: 'Junior Suite',
    slug: 'junior-suite',
    description: 'A lounge-inspired suite with a separate seating area, soft natural light, and a generous layout for extended stays.',
    basePrice: 18500,
    maxOccupancy: 4,
    bedConfiguration: 'King bed + lounge sofa',
    size: '68 m²',
    amenities: ['Separate lounge', 'Deep soaking tub', 'Breakfast for two', 'Curated minibar'],
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    name: 'Executive Suite',
    slug: 'executive-suite',
    description: 'An elegant suite with elevated privacy, curated finishing details, and a graceful balance of work and leisure.',
    basePrice: 24000,
    maxOccupancy: 4,
    bedConfiguration: 'King bed + guest bed',
    size: '86 m²',
    amenities: ['Dining nook', 'Panoramic windows', 'Priority arrivals', 'Wellness kit'],
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    name: 'Presidential Suite',
    slug: 'presidential-suite',
    description: 'Our signature top-tier accommodation with grand proportions, sweeping views, and exceptional service for the most memorable stays.',
    basePrice: 42000,
    maxOccupancy: 6,
    bedConfiguration: 'King bed + twin daybeds',
    size: '150 m²',
    amenities: ['Private lounge', 'Butler service', 'Spa access', 'Executive dining'],
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    ],
  },
];

const roomSeed = {
  'deluxe-room': [
    { roomNumber: '101', floor: 1, description: 'Deluxe room with warm natural textures and floor-to-ceiling daylight.' },
    { roomNumber: '102', floor: 1, description: 'A quiet deluxe room overlooking the garden courtyard and city skyline.' },
    { roomNumber: '103', floor: 2, description: 'Comfort-focused deluxe room with a restful palette and generous sleeping space.' },
  ],
  'premium-deluxe-room': [
    { roomNumber: '201', floor: 2, description: 'Premium deluxe room with a private balcony and curated bath amenities.' },
    { roomNumber: '202', floor: 2, description: 'Sunlit premium room with refined seating and elevated comfort for longer stays.' },
    { roomNumber: '203', floor: 3, description: 'Premium deluxe stay designed for couples seeking a calm and polished atmosphere.' },
  ],
  'executive-room': [
    { roomNumber: '301', floor: 3, description: 'Executive room with a dedicated work corner and elevated lounge comforts.' },
    { roomNumber: '302', floor: 3, description: 'Business-ready executive room with high-speed connectivity and restful finishes.' },
    { roomNumber: '303', floor: 4, description: 'Executive accommodation balancing productivity, privacy, and comfort.' },
  ],
  'junior-suite': [
    { roomNumber: '401', floor: 4, description: 'Junior suite with elevated lounge seating and a cozy, generous layout.' },
    { roomNumber: '402', floor: 4, description: 'Junior suite offering spacious comfort with distinctive hospitality touches.' },
  ],
  'executive-suite': [
    { roomNumber: '501', floor: 5, description: 'Executive suite with panoramic views and a spacious living-dining arrangement.' },
    { roomNumber: '502', floor: 5, description: 'Elegant executive suite with layered textures and a thoughtful guest flow.' },
  ],
  'presidential-suite': [
    { roomNumber: '601', floor: 6, description: 'Presidential suite with grand proportions, serene interiors, and bespoke hospitality.' },
    { roomNumber: '602', floor: 6, description: 'Top-floor presidential suite for elevated stays with privacy and indulgence.' },
  ],
};

await connectDatabase(env.MONGODB_URI);
try {
  let categoryCount = 0;
  let roomCount = 0;

  for (const categoryData of categorySeed) {
    const category = await RoomCategory.findOneAndUpdate(
      { slug: categoryData.slug },
      {
        $set: {
          ...categoryData,
          active: true,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );
    categoryCount += 1;

    const roomEntries = roomSeed[categoryData.slug] || [];
    for (const roomData of roomEntries) {
      const roomDoc = {
        roomNumber: roomData.roomNumber,
        category: category._id,
        description: roomData.description,
        operationalStatus: 'available',
        housekeepingStatus: 'clean',
        floor: roomData.floor,
        amenities: categoryData.amenities,
        images: categoryData.images,
        active: true,
      };

      await Room.findOneAndUpdate(
        { roomNumber: roomDoc.roomNumber },
        { $setOnInsert: roomDoc },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        },
      );
      roomCount += 1;
    }
  }

  console.info(`Seeded ${categoryCount} room categories and ${roomCount} room records.`);
} finally {
  await disconnectDatabase();
}

