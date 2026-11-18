import { rooms } from '../data/sampleData';
import apiClient from './apiClient';

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';

function normalizeCategory(category) {
  const images = category.images || [];
  return {
    id: category.slug,
    slug: category.slug,
    name: category.name,
    category: category.name,
    description: category.description || '',
    bed: category.bedConfiguration || '',
    occupancy: category.maxOccupancy,
    price: category.basePrice,
    image: images[0] || '',
    gallery: images,
    amenities: category.amenities || [],
    size: category.size || '',
    featured: false,
  };
}

export const roomService = {
  async getRooms() {
    if (demoMode) return rooms;
    const response = await apiClient.get('/rooms/categories');
    return response.data.data.map(normalizeCategory);
  },

  async getFeaturedRooms() {
    const allRooms = await this.getRooms();
    return allRooms.filter((room) => room.featured);
  },

  async getRoomById(id) {
    if (demoMode) return rooms.find((room) => room.id === id) || null;
    const allRooms = await this.getRooms();
    return allRooms.find((room) => room.id === id) || null;
  },
};
