import { REAL_SP_ESTABLISHMENTS } from '../data/establishments';

const STREET_VIEW_KEY = 'AIzaSyAIJinnkUYTK9D-JfUkvUci-c2vDOVaQDo';

export function getPlacePhoto(name: any, photoUrl: string | undefined, coords?: { lat: number, lng: number }): string | undefined {
  // If we already have a valid URL from Google or Unsplash, use it
  if (photoUrl && typeof photoUrl === 'string' && photoUrl.length > 10) return photoUrl;

  // Convert name to string safely
  let nameStr = '';
  if (name) {
    if (typeof name === 'string') {
      nameStr = name;
    } else if (typeof name === 'object') {
      nameStr = name.text || name.displayName?.text || name.displayName || name.name || '';
    }
  }
  
  // 1. Try local match (curated high quality photos)
  const normalize = (s: string) => 
    String(s).toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, "") 
     .replace(/[^a-z0-9]/g, '');

  const searchName = normalize(nameStr);
  if (searchName && searchName.length >= 3) {
    const localMatch = REAL_SP_ESTABLISHMENTS.find(e => {
      const localName = normalize(e.name);
      return localName.includes(searchName) || searchName.includes(localName);
    });
    if ((localMatch as any)?.photoUrl) return (localMatch as any).photoUrl;
  }

  // 2. Real Google Maps Street View Facade Photo for these exact coordinates
  if (coords && coords.lat && coords.lng) {
    return `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${coords.lat},${coords.lng}&fov=90&heading=235&pitch=10&key=${STREET_VIEW_KEY}`;
  }

  // 3. Intelligent Category Fallbacks based on name/keywords
  const lowerName = nameStr.toLowerCase();
  if (lowerName.includes('mecanica') || lowerName.includes('auto') || lowerName.includes('pneu') || lowerName.includes('alinhamento') || lowerName.includes('balanceamento') || lowerName.includes('oficina')) {
    return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80';
  }
  if (lowerName.includes('farmacia') || lowerName.includes('drogaria') || lowerName.includes('remedio') || lowerName.includes('saude')) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80';
  }
  if (lowerName.includes('posto') || lowerName.includes('gasolina') || lowerName.includes('combustivel') || lowerName.includes('shell') || lowerName.includes('petrobras')) {
    return 'https://images.unsplash.com/photo-1527018270876-096700c5cbb4?w=600&auto=format&fit=crop&q=80';
  }
  if (lowerName.includes('mercado') || lowerName.includes('supermercado') || lowerName.includes('mercearia') || lowerName.includes('hortifruti')) {
    return 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&auto=format&fit=crop&q=80';
  }
  if (lowerName.includes('pet') || lowerName.includes('veterinario') || lowerName.includes('cao') || lowerName.includes('gato')) {
    return 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=80';
  }
  if (lowerName.includes('padaria') || lowerName.includes('pao') || lowerName.includes('confeitaria')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80';
  }
  if (lowerName.includes('cafe') || lowerName.includes('cafeteria') || lowerName.includes('espresso')) {
    return 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80';
  }

  // 4. General commercial / storefront fallback
  return 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80';
}


