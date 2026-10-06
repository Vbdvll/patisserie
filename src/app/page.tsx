'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SHOP_INFO } from '@/lib/data';
import { Product, Category, CartItem } from '@/types';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Search,
  SlidersHorizontal,
  Menu,
  ArrowRight,
  Send,
  Loader2,
  Cake,
  Croissant,
  Coffee,
  Sparkles,
  UtensilsCrossed,
  X,
  Sun,
  Moon
} from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Gestion du Thème (Dark / Light)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Panier & Commande
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [deliveryType, setDeliveryType] = useState<'emporter' | 'livraison'>('emporter');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');

  // Récupérer le thème sauvegardé
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextTheme = !prev;
      localStorage.setItem('app_theme', nextTheme ? 'dark' : 'light');
      return nextTheme;
    });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [catRes, prodRes] = await Promise.all([
          supabase.from('categories').select('*').order('sort_order', { ascending: true }),
          supabase.from('products').select('*').eq('is_available', true).order('created_at', { ascending: false })
        ]);

        if (catRes.data) {
          setCategories([{ id: 'all', name: 'Tous', sort_order: 0 }, ...catRes.data]);
        }
        if (prodRes.data) {
          setProducts(prodRes.data as Product[]);
        }
      } catch (err) {
        console.error('Erreur chargement vitrine:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filtrage combiné : catégorie + recherche
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = deliveryType === 'livraison' ? 1500 : 0;
  const grandTotal = subtotal + deliveryFee;

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    let message = `*Nouvelle commande - ${SHOP_INFO.name}*\n\n`;
    message += `👤 *Client* : ${customerName || 'Non renseigné'}\n`;
    message += `📍 *Mode* : ${deliveryType === 'livraison' ? `Livraison (${customerAddress || 'Adresse à préciser'})` : 'À emporter'}\n\n`;
    message += `*Articles commandés :*\n`;

    cart.forEach((item) => {
      message += `• ${item.product.title} (x${item.quantity}) : ${(item.product.price * item.quantity).toLocaleString()} ${SHOP_INFO.currency}\n`;
    });

    if (deliveryType === 'livraison') {
      message += `• Frais de livraison : ${deliveryFee.toLocaleString()} ${SHOP_INFO.currency}\n`;
    }

    message += `\n*TOTAL : ${grandTotal.toLocaleString()} ${SHOP_INFO.currency}*`;

    window.open(`https://wa.me/${SHOP_INFO.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'all':
        return <Sparkles className="w-5 h-5" />;
      case 'patisserie':
        return <Cake className="w-5 h-5" />;
      case 'viennoiserie':
        return <Croissant className="w-5 h-5" />;
      case 'boissons':
        return <Coffee className="w-5 h-5" />;
      default:
        return <UtensilsCrossed className="w-5 h-5" />;
    }
  };

  return (
    <div
      className={`min-h-screen flex justify-center selection:bg-[#E05A2B] selection:text-white transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0F0E0E] text-stone-100' : 'bg-[#F4F1EA] text-stone-900'
      }`}
    >
      {/* Conteneur Mobile-First */}
      <div
        className={`w-full max-w-md min-h-screen flex flex-col border-x transition-colors duration-300 relative ${
          isDarkMode
            ? 'bg-[#141212] border-stone-800/60'
            : 'bg-[#FAF7F2] border-stone-300/70 shadow-xl'
        }`}
      >
        {/* 1. Header supérieur */}
        <header
          className={`px-5 pt-6 pb-3 flex items-center justify-between sticky top-0 backdrop-blur-md z-30 transition-colors duration-300 ${
            isDarkMode ? 'bg-[#141212]/95 border-b border-stone-800/40' : 'bg-[#FAF7F2]/95 border-b border-stone-200'
          }`}
        >
          <div className="flex items-center gap-1">
            <Link
              href="/admin"
              className={`p-2 -ml-2 rounded-xl transition-colors ${
                isDarkMode ? 'text-stone-400 hover:text-white hover:bg-stone-800/50' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              <Menu className="w-6 h-6" />
            </Link>

            {/* Bouton Toggle Thème (Soleil / Lune) */}
            <button
              onClick={toggleTheme}
              aria-label="Changer de thème"
              className={`p-2 rounded-xl transition-all active:scale-90 ${
                isDarkMode
                  ? 'text-amber-400 hover:bg-stone-800/60'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-stone-700" />}
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E05A2B] animate-pulse"></span>
              <h1
                className={`font-extrabold tracking-widest text-base uppercase font-serif ${
                  isDarkMode ? 'text-stone-100' : 'text-stone-900'
                }`}
              >
                {SHOP_INFO.name}
              </h1>
            </div>
            <p className={`text-[10px] tracking-[0.2em] uppercase font-medium ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              Pâtisserie Fine & Traiteur
            </p>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className={`relative p-2 -mr-2 rounded-xl transition-colors ${
              isDarkMode ? 'text-stone-300 hover:text-white hover:bg-stone-800/50' : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200'
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
            {totalItemsCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#E05A2B] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#141212]">
                {totalItemsCount}
              </span>
            )}
          </button>
        </header>

        {/* 2. Barre de recherche */}
        <div className="px-5 py-3">
          <div className="relative flex items-center">
            <Search className={`w-4 h-4 absolute left-4 pointer-events-none ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`} />
            <input
              type="text"
              placeholder="Rechercher croissant, tarte, boisson..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-2xl pl-11 pr-11 py-3 text-xs focus:outline-none focus:border-[#E05A2B] transition-colors border ${
                isDarkMode
                  ? 'bg-[#1F1C1B] border-stone-800 text-stone-100 placeholder-stone-500'
                  : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
              }`}
            />
            <button className={`absolute right-3 p-1.5 rounded-lg ${isDarkMode ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-700'}`}>
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Hero Card Gourmet */}
        <div className="px-5 py-3">
          <div
            className={`relative overflow-hidden rounded-3xl border p-5 shadow-2xl transition-colors duration-300 ${
              isDarkMode
                ? 'bg-gradient-to-br from-stone-900 via-[#1C1817] to-stone-950 border-stone-800/80 text-white'
                : 'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 border-stone-800 text-white'
            }`}
          >
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
                alt="Vitrine gourmande"
                className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent" />
            </div>

            <div className="relative z-10 max-w-[70%]">
              <span className="font-serif italic text-xs text-[#E05A2B] font-semibold tracking-wide">
                Fait Maison & Pur Beurre
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight text-white mt-1 leading-snug">
                Frais.<br />
                Artisanal.<br />
                <span className="text-[#E05A2B]">Inoubliable.</span>
              </h2>
              <p className="text-[11px] text-stone-300 mt-2 leading-relaxed">
                Ingrédients nobles sélectionnés avec passion.
              </p>

              <button
                onClick={() => {
                  const element = document.getElementById('products-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-4 bg-[#E05A2B] hover:bg-[#c94d22] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-[#E05A2B]/25 active:scale-95 transition-all"
              >
                Commander <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
              <span className="w-3.5 h-1.5 rounded-full bg-[#E05A2B]" />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
            </div>
          </div>
        </div>

        {/* 4. Barre de Catégories avec icônes */}
        <div className="py-4">
          <div className="flex items-center gap-4 overflow-x-auto px-5 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#E05A2B] text-white shadow-lg shadow-[#E05A2B]/30 scale-105'
                        : isDarkMode
                        ? 'bg-[#1C1817] text-stone-400 border border-stone-800/80 group-hover:border-stone-700 group-hover:text-stone-200'
                        : 'bg-white text-stone-600 border border-stone-200 shadow-sm group-hover:border-stone-400 group-hover:text-stone-900'
                    }`}
                  >
                    {getCategoryIcon(cat.id)}
                  </div>
                  <span
                    className={`text-[11px] font-medium transition-colors ${
                      isSelected
                        ? isDarkMode ? 'text-white font-bold' : 'text-stone-900 font-bold'
                        : isDarkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Grille de Produits */}
        <main id="products-section" className="px-5 pb-28 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-sm font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-stone-300' : 'text-stone-700'
              }`}
            >
              {selectedCategory === 'all' ? 'Nos créations' : categories.find((c) => c.id === selectedCategory)?.name}
            </h3>
            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              {filteredProducts.length} article{filteredProducts.length > 1 ? 's' : ''}
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-stone-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#E05A2B]" />
              <span className="text-xs">Chargement des délices...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              className={`text-center py-16 border rounded-2xl p-6 ${
                isDarkMode ? 'bg-[#1A1716] border-stone-800/60 text-stone-400' : 'bg-white border-stone-200 text-stone-500'
              }`}
            >
              <p className="text-sm">Aucun produit ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded-2xl overflow-hidden flex flex-col justify-between transition-all group ${
                    isDarkMode
                      ? 'bg-[#1C1918] border-stone-800/70 hover:border-stone-700'
                      : 'bg-white border-stone-200 shadow-sm hover:border-stone-300'
                  }`}
                >
                  <div className="h-32 w-full bg-stone-200 overflow-hidden relative">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        className={`font-bold text-xs line-clamp-1 ${
                          isDarkMode ? 'text-stone-100' : 'text-stone-900'
                        }`}
                      >
                        {product.title}
                      </h4>
                      <p
                        className={`text-[10px] line-clamp-2 mt-1 leading-snug ${
                          isDarkMode ? 'text-stone-400' : 'text-stone-500'
                        }`}
                      >
                        {product.description}
                      </p>
                    </div>

                    <div
                      className={`flex items-center justify-between mt-3 pt-2 border-t ${
                        isDarkMode ? 'border-stone-800/50' : 'border-stone-100'
                      }`}
                    >
                      <span className="font-extrabold text-xs text-[#E05A2B]">
                        {product.price.toLocaleString()} {SHOP_INFO.currency}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                          isDarkMode
                            ? 'bg-stone-800 hover:bg-[#E05A2B] text-stone-200 hover:text-white'
                            : 'bg-stone-100 hover:bg-[#E05A2B] text-stone-700 hover:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* 6. Barre d'action Panier Flottante */}
        {totalItemsCount > 0 && !isCartOpen && (
          <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-5 z-20">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-[#E05A2B] hover:bg-[#c94d22] text-white py-3.5 px-5 rounded-2xl font-bold flex items-center justify-between shadow-xl shadow-[#E05A2B]/25 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs font-black">
                  {totalItemsCount}
                </span>
                <span className="text-xs uppercase tracking-wider font-extrabold">Voir mon panier</span>
              </div>
              <span className="text-sm font-black">
                {subtotal.toLocaleString()} {SHOP_INFO.currency}
              </span>
            </button>
          </div>
        )}

        {/* 7. Modal Panier Latéral */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
            <div
              className={`w-full max-w-md border-l h-full flex flex-col justify-between p-6 overflow-y-auto transition-colors duration-300 ${
                isDarkMode ? 'bg-[#161413] border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900 shadow-2xl'
              }`}
            >
              <div>
                <div
                  className={`flex items-center justify-between pb-4 border-b ${
                    isDarkMode ? 'border-stone-800' : 'border-stone-200'
                  }`}
                >
                  <h3
                    className={`text-base font-bold flex items-center gap-2 ${
                      isDarkMode ? 'text-white' : 'text-stone-900'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5 text-[#E05A2B]" /> Votre Panier
                  </h3>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className={`p-1 rounded-lg transition-colors ${
                      isDarkMode ? 'text-stone-400 hover:text-white' : 'text-stone-400 hover:text-stone-700'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <p className="text-center text-stone-400 py-16 text-xs">Votre panier est encore vide.</p>
                ) : (
                  <div
                    className={`divide-y my-4 ${
                      isDarkMode ? 'divide-stone-800/60' : 'divide-stone-100'
                    }`}
                  >
                    {cart.map((item) => (
                      <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <h4
                            className={`text-xs font-semibold line-clamp-1 ${
                              isDarkMode ? 'text-stone-200' : 'text-stone-800'
                            }`}
                          >
                            {item.product.title}
                          </h4>
                          <span className="text-[11px] text-stone-400">
                            {(item.product.price * item.quantity).toLocaleString()} {SHOP_INFO.currency}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                              isDarkMode
                                ? 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-400" /> : <Minus className="w-3.5 h-3.5" />}
                          </button>
                          <span
                            className={`text-xs font-bold w-4 text-center ${
                              isDarkMode ? 'text-white' : 'text-stone-900'
                            }`}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                              isDarkMode
                                ? 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cart.length > 0 && (
                  <div
                    className={`space-y-4 pt-4 border-t ${
                      isDarkMode ? 'border-stone-800/60' : 'border-stone-100'
                    }`}
                  >
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5 text-stone-400">
                        Mode de commande
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setDeliveryType('emporter')}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            deliveryType === 'emporter'
                              ? isDarkMode
                                ? 'bg-stone-100 text-stone-900 border-white'
                                : 'bg-stone-900 text-white border-stone-900'
                              : isDarkMode
                              ? 'bg-stone-900/60 border-stone-800 text-stone-400'
                              : 'bg-stone-100 border-stone-200 text-stone-600'
                          }`}
                        >
                          À emporter
                        </button>
                        <button
                          onClick={() => setDeliveryType('livraison')}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            deliveryType === 'livraison'
                              ? isDarkMode
                                ? 'bg-stone-100 text-stone-900 border-white'
                                : 'bg-stone-900 text-white border-stone-900'
                              : isDarkMode
                              ? 'bg-stone-900/60 border-stone-800 text-stone-400'
                              : 'bg-stone-100 border-stone-200 text-stone-600'
                          }`}
                        >
                          Livraison (+1 500)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-stone-400">Votre Nom</label>
                      <input
                        type="text"
                        placeholder="Ex: Fatou"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={`w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#E05A2B] ${
                          isDarkMode
                            ? 'bg-[#1F1C1B] border-stone-800 text-stone-100 placeholder-stone-600'
                            : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400'
                        }`}
                      />
                    </div>

                    {deliveryType === 'livraison' && (
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-stone-400">Adresse de livraison</label>
                        <input
                          type="text"
                          placeholder="Ex: Almadies, en face de l'ambassade"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          className={`w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#E05A2B] ${
                            isDarkMode
                              ? 'bg-[#1F1C1B] border-stone-800 text-stone-100 placeholder-stone-600'
                              : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div
                  className={`pt-4 border-t mt-6 ${
                    isDarkMode ? 'border-stone-800' : 'border-stone-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-stone-400">Total à payer</span>
                    <span className="text-lg font-black text-[#E05A2B]">
                      {grandTotal.toLocaleString()} {SHOP_INFO.currency}
                    </span>
                  </div>
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-colors text-xs uppercase tracking-wider"
                  >
                    <Send className="w-4 h-4" /> Envoyer sur WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}