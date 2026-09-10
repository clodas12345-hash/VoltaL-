import { MapPin as MapPinType } from '../types';

export const CUISINE_PHOTO_PRESETS: Record<string, { photos: string[]; sampleNames: string[]; price: string; description: string }> = {
  mexicana: {
    photos: [
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=600&auto=format&fit=crop&q=80',
    ],
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
    photos: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
    ],
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
    photos: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
    ],
    sampleNames: [
      'The Burger Box Artesanal',
      'Smash & Grill Burger House',
      'Texas Smokehouse Burgers',
    ],
    price: 'R$ 35 - R$ 65 por pessoa',
    description: 'Hambúrgueres artesanais na brasa, smash burgers e batatas rústicas.',
  },
  pizza: {
    photos: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595750011505-1a80d402377b?w=600&auto=format&fit=crop&q=80',
    ],
    sampleNames: [
      'Pizzaria Bella Napoli',
      'Forno a Lenha Napolitano',
      'La Trattoria & Pizza DOC',
    ],
    price: 'R$ 50 - R$ 95 por pessoa',
    description: 'Pizzas artesanais com fermentação natural e assadas no forno a lenha.',
  },
  sushi: {
    photos: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    ],
    sampleNames: [
      'Kansai Sushi Lounge',
      'Yoi Temakeria & Sushi',
      'Mori Izakaya & Japanese Food',
    ],
    price: 'R$ 60 - R$ 130 por pessoa',
    description: 'Sushis frescos, sashimis de salmão e atum, combinados contemporâneos e temakis.',
  },
  padaria: {
    photos: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    ],
    sampleNames: [
      'Padaria Pão & Companhia',
      'Boulangerie Artesanal & Café',
      'Bella Paulista Panificadora',
    ],
    price: 'R$ 20 - R$ 45 por pessoa',
    description: 'Pães artesanais, croissants, bolos frescos, lanches de chapa e sucos naturais.',
  },
  cafe: {
    photos: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&auto=format&fit=crop&q=80',
    ],
    sampleNames: [
      'Café Espresso & Grão Especial',
      'The Coffee Roasters',
      'Santo Grão Cafeteria',
    ],
    price: 'R$ 15 - R$ 40 por pessoa',
    description: 'Cafés especiais coados e expressos, tortas finas e ambiente aconchegante.',
  },
  mecanica: {
    photos: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&auto=format&fit=crop&q=80',
    ],
    sampleNames: [
      'Auto Center & Alinhamento Total',
      'Oficina Mecânica & Pneus Express',
      'Centro Automotivo Especializado',
    ],
    price: 'Serviço sob orçamento',
    description: 'Serviços automotivos completos, alinhamento 3D, balanceamento, suspensão e troca de óleo com equipamentos de ponta.',
  },
  farmacia: {
    photos: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
    ],
    sampleNames: [
      'Drogaria & Farmácia Popular 24h',
      'Farmácia Saúde & Bem-Estar',
      'Drogaria São Paulo & Manipulação',
    ],
    price: 'Medicamentos e Perfumaria',
    description: 'Medicamentos éticos e genéricos, perfumaria completa, cosméticos e atendimento farmacêutico 24 horas.',
  },
  posto: {
    photos: [
      'https://images.unsplash.com/photo-1527018270876-096700c5cbb4?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80',
    ],
    sampleNames: [
      'Posto de Combustíveis 24 Horas',
      'Auto Posto Rodovia & Conveniência',
      'Posto Shell / Petrobras Express',
    ],
    price: 'Preço competitivo',
    description: 'Combustíveis aditivados e comuns, calibragem de pneus, troca de óleo e loja de conveniência.',
  },
  mercado: {
    photos: [
      'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    ],
    sampleNames: [
      'Supermercado & Mercearia Central',
      'Mercado Express 24h',
      'Hortifrúti & Empório da Cidade',
    ],
    price: 'Variedade e economia',
    description: 'Alimentos frescos, açougue, hortifrúti selecionado, padaria e produtos de limpeza e mercearia.',
  },
  pet: {
    photos: [
      'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&auto=format&fit=crop&q=80',
    ],
    sampleNames: [
      'Pet Shop & Clínica Veterinária 24h',
      'Amigo Pet Banho & Tosa',
      'Casa do Cachorro & Gato',
    ],
    price: 'Serviços e Acessórios',
    description: 'Banho e tosa profissional, atendimento veterinário de emergência, rações premium e acessórios.',
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
  let presetKey = '';
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
  } else if (norm.includes('alinhamento') || norm.includes('balanceamento') || norm.includes('mecanica') || norm.includes('pneu') || norm.includes('carro') || norm.includes('oficina') || norm.includes('auto')) {
    presetKey = 'mecanica';
  } else if (norm.includes('farmacia') || norm.includes('remedio') || norm.includes('drogaria') || norm.includes('saude')) {
    presetKey = 'farmacia';
  } else if (norm.includes('posto') || norm.includes('gasolina') || norm.includes('combustivel')) {
    presetKey = 'posto';
  } else if (norm.includes('mercado') || norm.includes('supermercado') || norm.includes('compras') || norm.includes('hortifruti')) {
    presetKey = 'mercado';
  } else if (norm.includes('pet') || norm.includes('veterinario') || norm.includes('cao') || norm.includes('gato')) {
    presetKey = 'pet';
  }

  let preset = presetKey ? CUISINE_PHOTO_PRESETS[presetKey] : undefined;
  
  if (!preset) {
    const capitalizedKeyword = keyword ? keyword.charAt(0).toUpperCase() + keyword.slice(1) : 'Local';
    // Choose professional storefront/service fallback photos
    preset = {
      photos: [
        'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
      ],
      sampleNames: [
        `${capitalizedKeyword} Central`,
        `Espaço ${capitalizedKeyword} 24h`,
        `${capitalizedKeyword} & Cia`,
      ],
      price: 'R$ 25 - R$ 150',
      description: `Estabelecimento especializado em ${keyword || 'serviços e comércio'} com atendimento profissional e localização privilegiada.`,
    };
  }


  // Generate 2 or 3 establishments nearby (between 300m and 850m from user)
  const offsets = [
    { dLat: 0.0032, dLng: 0.0028, dist: 420 }, // ~420m away
    { dLat: -0.0041, dLng: 0.0035, dist: 630 }, // ~630m away
    { dLat: 0.0025, dLng: -0.0045, dist: 780 }, // ~780m away
  ];

  let categoryName = 'Restaurante';
  if (presetKey === 'mecanica') categoryName = 'Oficina Mecânica';
  else if (presetKey === 'farmacia') categoryName = 'Farmácia';
  else if (presetKey === 'posto') categoryName = 'Posto de Combustível';
  else if (presetKey === 'mercado') categoryName = 'Supermercado';
  else if (presetKey === 'pet') categoryName = 'Pet Shop';
  else if (presetKey === 'padaria') categoryName = 'Padaria';
  else if (presetKey === 'cafe') categoryName = 'Cafeteria';
  else if (keyword) {
    categoryName = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  }

  return preset.sampleNames.slice(0, 3).map((name, idx) => {
    const offset = offsets[idx % offsets.length];
    const placeLat = userLat + offset.dLat;
    const placeLng = userLng + offset.dLng;

    return {
      id: `radar-gen-${presetKey || 'custom'}-${idx}-${Math.abs(Math.floor(userLat * 1000))}`,
      name: name,
      address: `Avenida Principal, ${100 + idx * 45} - Próximo a Você`,
      lat: placeLat,
      lng: placeLng,
      category: categoryName,
      rating: Number((4.7 + idx * 0.1).toFixed(1)),
      userRatingsTotal: 180 + idx * 75,
      photoUrl: preset.photos[idx % preset.photos.length],
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
