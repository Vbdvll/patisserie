// src/lib/data.ts
import { Category, Product } from '@/types';

export const SHOP_INFO = {
  name: "L'Atelier Gourmand & Pâtisserie",
  tagline: "Douceurs artisanales & délices du jour",
  phone: "+221770000000", // Numéro pour les commandes WhatsApp
  currency: "FCFA",
  address: "Dakar, Sénégal",
  isOpen: true,
  openingHours: "08h00 - 20h00"
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'Tous', sort_order: 0 },
  { id: 'patisserie', name: 'Pâtisseries', sort_order: 1 },
  { id: 'viennoiserie', name: 'Viennoiseries', sort_order: 2 },
  { id: 'gateaux', name: 'Gâteaux sur commande', sort_order: 3 },
  { id: 'boissons', name: 'Boissons fraîches', sort_order: 4 },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    shop_id: 'shop-1',
    category_id: 'patisserie',
    title: 'Éclair Gourmand au Chocolat',
    description: 'Pâte à choux croustillante, crème pâtissière onctueuse au chocolat noir.',
    price: 1500,
    image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
    is_available: true
  },
  {
    id: 'prod-2',
    shop_id: 'shop-1',
    category_id: 'patisserie',
    title: 'Tartelette Citron Meringuée',
    description: 'Pâte sablée pur beurre, crème citron jaune de Casamance et meringue dorée.',
    price: 2000,
    image_url: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=600&q=80',
    is_available: true
  },
  {
    id: 'prod-3',
    shop_id: 'shop-1',
    category_id: 'viennoiserie',
    title: 'Croissant Feuilleté Pur Beurre',
    description: 'Feuilletage aéré et croustillant, confectionné tous les matins dès 6h.',
    price: 800,
    image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    is_available: true
  },
  {
    id: 'prod-4',
    shop_id: 'shop-1',
    category_id: 'gateaux',
    title: 'Entremets Mangue & Passion (6/8 parts)',
    description: 'Mousse légère aux fruits tropicaux sur biscuit dacquoise noisette.',
    price: 14000,
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    is_available: true
  },
  {
    id: 'prod-5',
    shop_id: 'shop-1',
    category_id: 'boissons',
    title: 'Jus de Bissap Maison à la Menthe (50cl)',
    description: 'Infusion artisanale de fleurs d hibiscus et feuilles de menthe fraîche.',
    price: 1000,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    is_available: true
  }
];