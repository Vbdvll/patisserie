'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SHOP_INFO } from '@/lib/data';
import { compressImage } from '@/lib/compressImage';
import { Product, Category, Sale, SaleItem } from '@/types';
import {
  PlusCircle,
  ShoppingCart,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  Package,
  Loader2,
  Lock,
  LogOut,
  Delete,
  Camera
} from 'lucide-react';

const SHOP_ID = process.env.NEXT_PUBLIC_DEFAULT_SHOP_ID || '00000000-0000-0000-0000-000000000001';
const EXPECTED_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'sales' | 'products'>('sales');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Formulaire d'ajout
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Caisse POS
  const [posCart, setPosCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'especes' | 'wave' | 'orange_money'>('wave');
  const [orderType, setOrderType] = useState<'sur_place' | 'a_emporter' | 'livraison'>('sur_place');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handlePinPress = (digit: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setPinError(false);

      if (nextPin.length === 4) {
        if (nextPin === EXPECTED_PIN) {
          sessionStorage.setItem('admin_authenticated', 'true');
          setIsAuthenticated(true);
          loadData();
        } else {
          setPinError(true);
          setTimeout(() => setPinInput(''), 600);
        }
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setPinInput('');
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes, salesRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(20)
      ]);

      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (catRes.data) {
        setCategories(catRes.data as Category[]);
        if (catRes.data.length > 0 && !newCategory) {
          setNewCategory(catRes.data[0].id);
        }
      }
      if (salesRes.data) setSalesHistory(salesRes.data as Sale[]);
    } catch (err) {
      console.error('Erreur chargement admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToPosCart = (product: Product) => {
    setPosCart((prev) => {
      const exists = prev.find((item) => item.product_id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product_id: product.id, title: product.title, price: product.price, quantity: 1 }];
    });
  };

  const removeFromPosCart = (productId: string) => {
    setPosCart((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const posTotal = posCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleValidateSale = async () => {
    if (posCart.length === 0 || isSubmittingSale) return;

    try {
      setIsSubmittingSale(true);
      const salePayload = {
        shop_id: SHOP_ID,
        order_type: orderType,
        payment_method: paymentMethod,
        total_amount: posTotal,
        status: 'payee',
        items: posCart
      };

      const { data, error } = await supabase.from('sales').insert([salePayload]).select();
      if (error) throw error;

      if (data && data.length > 0) {
        setSalesHistory([data[0] as Sale, ...salesHistory]);
      }
      setPosCart([]);
      alert('Vente enregistrée avec succès !');
    } catch (err) {
      console.error('Erreur vente:', err);
      alert('Erreur lors de l\'enregistrement de la vente.');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice || isSubmittingProduct) return;

    try {
      setIsSubmittingProduct(true);
      let finalImageUrl = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80';

      // Compression et upload si une photo a été choisie
      if (imageFile) {
        const compressedBlob = await compressImage(imageFile, 800, 800, 0.75);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
        const filePath = `items/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, compressedBlob, {
            contentType: 'image/webp',
            cacheControl: '3600'
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      }

      const productPayload = {
        shop_id: SHOP_ID,
        category_id: newCategory || categories[0]?.id || 'patisserie',
        title: newTitle,
        description: newDesc || 'Préparation artisanale du jour.',
        price: Number(newPrice),
        image_url: finalImageUrl,
        is_available: true
      };

      const { data, error } = await supabase.from('products').insert([productPayload]).select();
      if (error) throw error;

      if (data && data.length > 0) {
        setProducts([data[0] as Product, ...products]);
      }

      setNewTitle('');
      setNewPrice('');
      setNewDesc('');
      setImageFile(null);
      setImagePreview('');
      alert('Nouveau plat publié au menu !');
    } catch (err) {
      console.error('Erreur ajout produit:', err);
      alert('Échec de la publication.');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const totalRevenue = salesHistory.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  // Saisie du code PIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-xs bg-white rounded-3xl p-6 border border-stone-200 shadow-xl text-center">
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-700">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-stone-900">Espace Gérant</h2>
          <p className="text-xs text-stone-500 mb-6">Saisissez le code PIN pour déverrouiller</p>

          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  pinError
                    ? 'bg-red-500 animate-pulse'
                    : pinInput.length > index
                    ? 'bg-stone-900 scale-110'
                    : 'bg-stone-200'
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handlePinPress(digit)}
                className="h-12 rounded-xl bg-stone-50 text-stone-800 font-bold text-base hover:bg-stone-200 active:scale-95 transition-all"
              >
                {digit}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePinPress('0')}
              className="h-12 rounded-xl bg-stone-50 text-stone-800 font-bold text-base hover:bg-stone-200 active:scale-95 transition-all"
            >
              0
            </button>
            <button
              onClick={handlePinDelete}
              className="h-12 rounded-xl bg-stone-50 text-stone-600 flex items-center justify-center hover:bg-stone-200 active:scale-95 transition-all"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <Link href="/" className="text-xs text-stone-500 hover:text-stone-900 block mt-2">
            ← Retour à la vitrine
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center gap-2 text-stone-500">
        <Loader2 className="w-6 h-6 animate-spin text-[#E05A2B]" />
        <span>Chargement des données...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 border border-stone-200 rounded-lg px-2.5 py-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Vitrine
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-stone-900">Espace Gérant</h1>
              <p className="text-xs text-stone-500">{SHOP_INFO.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'sales' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              Caisse
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'products' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              Menu
            </button>
            <button
              onClick={handleLogout}
              title="Verrouiller"
              className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Caisse POS */}
      {activeTab === 'sales' && (
        <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <h2 className="font-bold text-base text-stone-900 mb-3 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#E05A2B]" /> Encaisser un article
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToPosCart(p)}
                    className="p-3 text-left border border-stone-200 rounded-xl hover:border-stone-900 hover:bg-stone-50 transition-all flex flex-col justify-between h-24"
                  >
                    <span className="text-xs font-semibold line-clamp-2 text-stone-800">{p.title}</span>
                    <span className="text-xs font-bold text-[#E05A2B]">
                      {p.price.toLocaleString()} {SHOP_INFO.currency}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Ventes en base ({salesHistory.length})
                </h3>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-bold">
                  Total : {totalRevenue.toLocaleString()} {SHOP_INFO.currency}
                </span>
              </div>

              <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
                {salesHistory.length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">Aucune vente enregistrée.</p>
                ) : (
                  salesHistory.map((s) => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-stone-800">
                          {s.items?.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
                        </div>
                        <span className="text-stone-400 capitalize">
                          {s.created_at ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} • {s.payment_method} • {s.order_type}
                        </span>
                      </div>
                      <span className="font-bold text-stone-900 text-sm">
                        {Number(s.total_amount).toLocaleString()} {SHOP_INFO.currency}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between h-fit">
            <div>
              <h3 className="font-bold text-base text-stone-900 pb-3 border-b border-stone-100">
                Ticket en cours
              </h3>

              {posCart.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">Cliquez sur un produit pour l'ajouter.</p>
              ) : (
                <div className="divide-y divide-stone-100 my-3">
                  {posCart.map((item) => (
                    <div key={item.product_id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-stone-800">{item.title}</div>
                        <span className="text-stone-400">{item.price.toLocaleString()} x {item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{(item.price * item.quantity).toLocaleString()}</span>
                        <button
                          onClick={() => removeFromPosCart(item.product_id)}
                          className="text-red-500 font-bold hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 pt-3 border-t border-stone-100">
                <label className="text-xs font-semibold text-stone-600 block">Paiement</label>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  {(['wave', 'orange_money', 'especes'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 rounded-lg border font-semibold capitalize ${
                        paymentMethod === m ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <label className="text-xs font-semibold text-stone-600 block mt-2">Type</label>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  {(['sur_place', 'a_emporter', 'livraison'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setOrderType(t)}
                      className={`py-1.5 rounded-lg border font-semibold capitalize ${
                        orderType === t ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200'
                      }`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 mt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-stone-500">Total à encaisser</span>
                <span className="text-lg font-black text-stone-900">
                  {posTotal.toLocaleString()} {SHOP_INFO.currency}
                </span>
              </div>
              <button
                disabled={posCart.length === 0 || isSubmittingSale}
                onClick={handleValidateSale}
                className="w-full bg-[#E05A2B] disabled:bg-stone-300 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {isSubmittingSale ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Encaisser la commande
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Menu & Ajout avec Photo et Compression */}
      {activeTab === 'products' && (
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm mb-6">
            <h2 className="font-bold text-base text-stone-900 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#E05A2B]" /> Ajouter un plat / gâteau avec photo
            </h2>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Nom du plat ou gâteau</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tarte Mangue Fondante"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E05A2B]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Prix ({SHOP_INFO.currency})</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 2500"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E05A2B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E05A2B]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Photo du plat (compressée auto)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-stone-300 hover:border-stone-400 bg-stone-50 rounded-xl py-2 px-3 cursor-pointer text-stone-600 transition-colors">
                      <Camera className="w-4 h-4 text-stone-500" />
                      <span className="text-xs font-medium truncate">
                        {imageFile ? imageFile.name : 'Prendre / Choisir photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Sablé croustillant, brunoise de mangue fraîche du Sénégal."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E05A2B]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingProduct}
                className="bg-stone-900 disabled:bg-stone-400 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-stone-800 transition-colors flex items-center gap-2"
              >
                {isSubmittingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                Publier sur le menu en ligne
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h3 className="font-bold text-sm text-stone-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-stone-500" /> Plats enregistrés en base ({products.length})
            </h3>
            <div className="divide-y divide-stone-100">
              {products.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900 text-sm">{p.title}</span>
                    <p className="text-stone-500">{p.description}</p>
                  </div>
                  <span className="font-extrabold text-[#E05A2B] text-sm whitespace-nowrap">
                    {p.price.toLocaleString()} {SHOP_INFO.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}