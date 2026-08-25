import { MapPin as MapPinType } from '../types';

export const CUISINE_PHOTO_PRESETS: Record<string, { photoUrl: string; sampleNames: string[]; price: string; description: string }> = {
  mexicana: {
    photoUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
    sampleNames: [
      'El Mexicano Taquería & Bar',
      'Si Señor Cocina Mexicana',
      'Guacamole Cantina & Tacos',
      'La Catrina Tacos & Burritos',
    ],
    price: 'R$ 45 - R$ 90 por pessoa',
    description: 'Especialista em comida mexicana com tacos artesanais, quesadillas, guacamole fresco, burritos e drinks típicos.',
  },
  manicoba: {
    photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    sampleNames: [
      'Tacacá & Maniçoba do Pará',
      'Restaurante Amazônia - Maniçoba Tradicional',
      'Sabores de Belém & Maniçoba Paraense',
      'Casa do Norte & Culinária Paraense',
    ],
    price: 'R$ 40 - R$ 85 por pessoa',
    description: 'Maniçoba tradicional com folhas de maniva moídas e cozidas por 7 dias, paio, lombo e carnes defumadas. Acompanha arroz e farinha d água.',
  },
  hamburguer: {
    photoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    sampleNames: [
      'The Burger Box Artesanal',
      'Smash & Grill Burger House',
      'Texas Smokehouse Burgers',
    ],
    price: 'R$ 35 - R$ 65 por pessoa',
    description: 'Hambúrgueres artesanais na brasa, smash burgers e batatas rústicas.',
  },
  pizza: {
    photoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    sampleNames: [
      'Pizzaria Bella Napoli',
      'Forno a Lenha Napolitano',
      'La Trattoria & Pizza DOC',
    ],
    price: 'R$ 50 - R$ 95 por pessoa',
    description: 'Pizzas artesanais com fermentação natural e assadas no forno a lenha.',
  },
  sushi: {
    photoUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80',
    sampleNames: [
      'Kansai Sushi Lounge',
      'Yoi Temakeria & Sushi',
      'Mori Izakaya & Japanese Food',
    ],
    price: 'R$ 60 - R$ 130 por pessoa',
    description: 'Sushis frescos, sashimis de salmão e atum, combinados contemporâneos e temakis.',
  },
  padaria: {
    photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    sampleNames: [
      'Padaria Pão & Companhia',
      'Boulangerie Artesanal & Café',
      'Bella Paulista Panificadora',
    ],
    price: 'R$ 20 - R$ 45 por pessoa',
    description: 'Pães artesanais, croissants, bolos frescos, lanches de chapa e sucos naturais.',
  },
  cafe: {
    photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    sampleNames: [
      'Café Espresso & Grão Especial',
      'The Coffee Roasters',
      'Santo Grão Cafeteria',
    ],
    price: 'R$ 15 - R$ 40 por pessoa',
    description: 'Cafés especiais coados e expressos, tortas finas e ambiente aconchegante.',
  },
};

// Haversine distance in meters
export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // radius of Earth in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Helper to normalize strings (remove accents and lowercase)
export function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Generate realistic simulated radar matches within 1km of the user when in demo mode
export function generateDemoRadarPlaces(
  userLat: number,
  userLng: number,
  keyword: string,
  radiusMeters = 1000
): MapPinType[] {
  const norm = normalizeText(keyword);

  // Identify category key
  let presetKey = 'mexicana';
  if (norm.includes('mexic') || norm.includes('taco') || norm.includes('burrito') || norm.includes('nacho') || norm.includes('guacamole')) {
    presetKey = 'mexicana';
  } else if (norm.includes('manicoba') || norm.includes('mani') || norm.includes('para') || norm.includes('tacaca') || norm.includes('belem') || norm.includes('amaz')) {
    presetKey = 'manicoba';
  } else if (norm.includes('hamburguer') || norm.includes('burger') || norm.includes('lanche')) {
    presetKey = 'hamburguer';
  } else if (norm.includes('pizza') || norm.includes('massa') || norm.includes('cantina')) {
    presetKey = 'pizza';
  } else if (norm.includes('sushi') || norm.includes('japones') || norm.includes('oriental') || norm.includes('temaki')) {
    presetKey = 'sushi';
  } else if (norm.includes('padaria') || norm.includes('pao') || norm.includes('confeitaria')) {
    presetKey = 'padaria';
  } else if (norm.includes('cafe') || norm.includes('doces') || norm.includes('bolo')) {
    presetKey = 'cafe';
  }

  const preset = CUISINE_PHOTO_PRESETS[presetKey] || CUISINE_PHOTO_PRESETS.mexicana;

  // Generate 2 or 3 establishments nearby (between 300m and 850m from user)
  const offsets = [
    { dLat: 0.0032, dLng: 0.0028, dist: 420 }, // ~420m away
    { dLat: -0.0041, dLng: 0.0035, dist: 630 }, // ~630m away
    { dLat: 0.0025, dLng: -0.0045, dist: 780 }, // ~780m away
  ];

  return preset.sampleNames.slice(0, 3).map((name, idx) => {
    const offset = offsets[idx % offsets.length];
    const placeLat = userLat + offset.dLat;
    const placeLng = userLng + offset.dLng;

    return {
      id: `radar-gen-${presetKey}-${idx}-${Math.abs(Math.floor(userLat * 1000))}`,
      name: name,
      address: `Avenida Principal, ${100 + idx * 45} - Próximo a Você`,
      lat: placeLat,
      lng: placeLng,
      category: 'Restaurante',
      rating: Number((4.7 + idx * 0.1).toFixed(1)),
      userRatingsTotal: 180 + idx * 75,
      photoUrl: preset.photoUrl,
      priceLevel: preset.price,
      description: `${preset.description} (Detectado pelo Radar)`,
      peakHours: 'Pico das 12h00 às 14h00 e 19h30 às 22h30',
      openingHours: [
        'segunda-feira: 11:30 – 23:00',
        'terça-feira: 11:30 – 23:00',
        'quarta-feira: 11:30 – 23:00',
        'quinta-feira: 11:30 – 23:00',
        'sexta-feira: 11:30 – 00:00',
        'sábado: 11:30 – 00:00',
        'domingo: 12:00 – 22:00',
      ],
    };
  });
}
