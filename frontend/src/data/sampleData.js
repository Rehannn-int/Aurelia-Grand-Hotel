import hotelExterior from '../assets/images/hotel/hotel-exterior.jpg';
import guestArrival from '../assets/images/hotel/guest-arrival.jpg';
import signatureSuite from '../assets/images/rooms/signature-suite.jpg';
import deluxeRoom from '../assets/images/rooms/deluxe-room.jpg';
import residenceRoom from '../assets/images/rooms/residence-villa.jpg';
import familyRoom from '../assets/images/rooms/family-loft.jpg';
import poolVilla from '../assets/images/rooms/pool-villa.jpg';
import gardenRoom from '../assets/images/rooms/garden-suite.jpg';
import hotelLobby from '../assets/images/hotel/lobby-grand.jpg';
import fineDining from '../assets/images/restaurant/dining-room.jpg';
import poolDeck from '../assets/images/facilities/pool-deck.jpg';
import spaWellness from '../assets/images/facilities/spa-wellness.jpg';
import privateEvents from '../assets/images/gallery/hotel-facilities.jpg';
import balconyView from '../assets/images/gallery/balcony-view.jpg';
import bathroomLuxury from '../assets/images/facilities/bathroom-luxury.jpg';

export const rooms = [
  {
    id: 'signature-suite',
    slug: 'signature-suite',
    name: 'Sierra Suite',
    category: 'Signature Suite',
    description: 'A tranquil suite with oak detailing, curated local art, and a private balcony overlooking the gardens.',
    bed: 'King bed',
    occupancy: 2,
    price: 12500,
    image: signatureSuite,
    gallery: [signatureSuite, balconyView, bathroomLuxury],
    amenities: ['Garden view', 'Private balcony', 'Rainfall shower', 'Complimentary breakfast'],
    size: '48 m²',
    featured: true,
  },
  {
    id: 'deluxe-room',
    slug: 'deluxe-room',
    name: 'Harbor Deluxe',
    category: 'Deluxe Room',
    description: 'Warm natural textures, refined amenities, and skyline panoramas designed for restorative nights.',
    bed: 'Queen bed',
    occupancy: 2,
    price: 7200,
    image: deluxeRoom,
    gallery: [deluxeRoom, balconyView, bathroomLuxury],
    amenities: ['City view', 'Workspace', 'Luxury bath', 'In-room coffee'],
    size: '36 m²',
    featured: true,
  },
  {
    id: 'residence',
    slug: 'residence',
    name: 'Estate Residence',
    category: 'Residence',
    description: 'A residential hideaway with expanded living space, a soaking tub, and curated local touches.',
    bed: 'King bed + sofa',
    occupancy: 4,
    price: 16800,
    image: residenceRoom,
    gallery: [residenceRoom, poolVilla, hotelLobby],
    amenities: ['Living area', 'Dining nook', 'Bathtub', 'Priority check-in'],
    size: '68 m²',
    featured: true,
  },
  {
    id: 'family-room',
    slug: 'family-room',
    name: 'Willow Family Loft',
    category: 'Family Room',
    description: 'Comfort-forward family accommodation with generous sleeping arrangements and calming palette.',
    bed: '2 Queen beds',
    occupancy: 5,
    price: 9800,
    image: familyRoom,
    gallery: [familyRoom, gardenRoom, hotelLobby],
    amenities: ['Family dining area', 'High-speed Wi-Fi', 'Smart TV', 'Lounge seating'],
    size: '52 m²',
    featured: false,
  },
  {
    id: 'poolside-villa',
    slug: 'poolside-villa',
    name: 'Solstice Pavilion',
    category: 'Poolside Villa',
    description: 'A breezy terrace home with direct pool access, lush surroundings, and an airy open-plan lounge.',
    bed: 'King bed',
    occupancy: 3,
    price: 13400,
    image: poolVilla,
    gallery: [poolVilla, poolDeck, balconyView],
    amenities: ['Pool access', 'Terrace seating', 'Indoor-outdoor bath', 'Luggage support'],
    size: '60 m²',
    featured: false,
  },
  {
    id: 'garden-room',
    slug: 'garden-room',
    name: 'Muse Terrace',
    category: 'Garden Room',
    description: 'Serene garden-facing space with handcrafted details and a generous terrace for slow mornings.',
    bed: 'Queen bed',
    occupancy: 2,
    price: 6800,
    image: gardenRoom,
    gallery: [gardenRoom, deluxeRoom, balconyView],
    amenities: ['Garden terrace', 'Luxury linens', 'Rain shower', 'Complimentary tea'],
    size: '32 m²',
    featured: false,
  },
];

export const experiences = [
  {
    title: 'Fine Dining',
    description: 'Seasonal tasting menus and intimate wine pairings shaped by local ingredients.',
    image: fineDining,
  },
  {
    title: 'Swimming Pool',
    description: 'A warm, light-filled pool deck for restorative afternoons and sunset rituals.',
    image: poolDeck,
  },
  {
    title: 'Spa & Wellness',
    description: 'Holistic therapies, thermal rituals, and personalized wellness journeys.',
    image: spaWellness,
  },
  {
    title: 'Private Events',
    description: 'Elegant spaces for celebrations, intimate gatherings, and elevated hosting.',
    image: privateEvents,
  },
];

export const testimonials = [
  {
    name: 'Elena M.',
    quote: 'The attention to detail felt effortless. Every moment was thoughtful, warm, and beautifully considered.',
  },
  {
    name: 'Marcus T.',
    quote: 'An exceptional stay from check-in to checkout. The design, staff, and atmosphere felt genuinely elevated.',
  },
  {
    name: 'Priya S.',
    quote: 'A refined boutique hotel experience that balances comfort, design, and genuine hospitality perfectly.',
  },
];

export const offers = [
  {
    title: 'Weekend Escape',
    description: 'Two nights in a signature suite with breakfast and a sunset wellness ritual.',
    tag: 'Sample offer',
  },
  {
    title: 'Extended Stay',
    description: 'Enjoy a complimentary late checkout when booking three nights or more.',
    tag: 'Sample offer',
  },
  {
    title: 'Romantic Getaway',
    description: 'A candlelit dinner for two and a welcome amenity in our garden pavilion.',
    tag: 'Sample offer',
  },
];

export const gallery = [
  { src: hotelExterior, alt: 'Hotel exterior' },
  { src: signatureSuite, alt: 'Private suite' },
  { src: poolVilla, alt: 'Pool villa seating' },
  { src: fineDining, alt: 'Restaurant dining' },
  { src: balconyView, alt: 'Scenic balcony view' },
  { src: hotelLobby, alt: 'Hotel lobby' },
];
