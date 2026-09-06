import { REAL_SP_ESTABLISHMENTS } from '../data/establishments';

export function getPlacePhoto(name: any, photoUrl: string | undefined): string | undefined {
  // If we already have a valid URL from Google, use it
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
  
  if (!nameStr || typeof nameStr !== 'string') return undefined;

  // Robust normalization: lowercase, remove accents, remove non-alphanumeric
  const normalize = (s: string) => 
    s.toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, "") // Remove accents
     .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric

  const searchName = normalize(nameStr);
  if (!searchName || searchName.length < 3) return undefined;

  const localMatch = REAL_SP_ESTABLISHMENTS.find(e => {
    const localName = normalize(e.name);
    // Check for direct inclusion in either direction
    return localName.includes(searchName) || searchName.includes(localName);
  });

  return localMatch?.photoUrl;
}
