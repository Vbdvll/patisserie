import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "L'Atelier Gourmand",
    short_name: 'Gourmand',
    description: 'Menu digital & Commande rapide',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F0E0E',
    theme_color: '#E05A2B',
    icons: [
      {
        src: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=192&q=80',
        sizes: '192x192',
        type: 'image/jpeg'
      },
      {
        src: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=512&q=80',
        sizes: '512x512',
        type: 'image/jpeg'
      }
    ]
  };
}