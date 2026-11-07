export const CITIES = [
  { code: 'GOA', name: 'Goa', country: 'India', tagline: 'Beaches & sunsets' },
  { code: 'DEL', name: 'Delhi', country: 'India', tagline: 'History & street food' },
  { code: 'BOM', name: 'Mumbai', country: 'India', tagline: 'The city of dreams' },
  { code: 'BLR', name: 'Bengaluru', country: 'India', tagline: 'Gardens & cafés' },
  { code: 'JAI', name: 'Jaipur', country: 'India', tagline: 'The Pink City' },
  { code: 'DXB', name: 'Dubai', country: 'UAE', tagline: 'Skyline & souks' },
  { code: 'SIN', name: 'Singapore', country: 'Singapore', tagline: 'Garden city' },
  { code: 'BKK', name: 'Bangkok', country: 'Thailand', tagline: 'Street food & temples' },
];

export const cityName = (code) => CITIES.find((c) => c.code === code)?.name ?? code;
