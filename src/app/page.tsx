'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SHOP_INFO } from '@/lib/data';
import { Product, Category, CartItem } from '@/types';
import { ShoppingBag, Plus, Minus, Trash2, Clock, MapPin, Send, Loader2 } from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [deliveryType, setDeliveryType] = useState<'emporter' | 'livraison'>('emporter');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');

  // Charger les données depuis Supabase
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
        console.error('Erreur chargement données:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category_id === selectedCategory);

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

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-800">
      {/* Barre de navigation */}
      <header className="sticky top-0 z-30 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">{SHOP_INFO.name}</h1>
            <p className="text-xs text-stone-500">{SHOP_INFO.tagline}</p>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 bg-[#E05A2B] text-white px-4 py-2 rounded-full font-medium shadow-sm hover:bg-[#c94d22] transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">Panier</span>
            {totalItemsCount > 0 && (
              <span className="bg-white text-[#E05A2B] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Info boutique */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            ● Ouvert aujourd'hui ({SHOP_INFO.openingHours})
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Douceurs fraîches & créations du jour
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs sm:text-sm text-stone-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-[#E05A2B]" /> {SHOP_INFO.address}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-[#E05A2B]" /> Préparation : 15 - 30 min
            </span>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Produits */}
      <main className="max-w-6xl mx-auto px-4 py-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-stone-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#E05A2B]" />
            <span className="text-sm">Chargement des délices...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="h-48 w-full bg-stone-100 overflow-hidden relative">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-stone-900 mb-1">{product.title}</h3>
                    <p className="text-xs text-stone-500 line-clamp-2 mb-4 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <span className="font-extrabold text-[#E05A2B] text-lg">
                      {product.price.toLocaleString()} {SHOP_INFO.currency}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      className="flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Ajouter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Panier */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <h3 className="text-lg font-bold text-stone-900">Votre Panier</h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold"
                >
                  ✕ Fermer
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-center text-stone-400 py-12 text-sm">Votre panier est vide.</p>
              ) : (
                <div className="divide-y divide-stone-100 my-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-stone-800 leading-snug">{item.product.title}</h4>
                        <span className="text-xs text-stone-400">
                          {(item.product.price * item.quantity).toLocaleString()} {SHOP_INFO.currency}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-7 h-7 flex items-center justify-center border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-100"
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-7 h-7 flex items-center justify-center border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <div>
                    <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block mb-1">
                      Mode de retrait
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setDeliveryType('emporter')}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          deliveryType === 'emporter'
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'border-stone-200 text-stone-600'
                        }`}
                      >
                        À emporter (Gratuit)
                      </button>
                      <button
                        onClick={() => setDeliveryType('livraison')}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          deliveryType === 'livraison'
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'border-stone-200 text-stone-600'
                        }`}
                      >
                        Livraison (+1 500)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-600 block mb-1">Votre Nom</label>
                    <input
                      type="text"
                      placeholder="Ex: Abdallah"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#E05A2B]"
                    />
                  </div>

                  {deliveryType === 'livraison' && (
                    <div>
                      <label className="text-xs font-semibold text-stone-600 block mb-1">Adresse de livraison</label>
                      <input
                        type="text"
                        placeholder="Ex: Sacré-Cœur 3, Villa 123"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#E05A2B]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-stone-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-stone-500">Total à régler</span>
                  <span className="text-xl font-bold text-stone-900">
                    {grandTotal.toLocaleString()} {SHOP_INFO.currency}
                  </span>
                </div>
                <button
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Send className="w-5 h-5" /> Valider via WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}