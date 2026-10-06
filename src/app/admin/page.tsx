'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
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
  Camera,
  Settings,
  Save,
  Image as ImageIcon,
  Download,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const SHOP_ID = process.env.NEXT_PUBLIC_DEFAULT_SHOP_ID || '00000000-0000-0000-0000-000000000001';
const EXPECTED_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'settings'>('sales');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Paramètres Boutique
  const [shopName, setShopName] = useState('');
  const [shopTagline, setShopTagline] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopCurrency, setShopCurrency] = useState('FCFA');
  const [shopAddress, setShopAddress] = useState('');
  const [shopLogoUrl, setShopLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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
      const [prodRes, catRes, salesRes, shopRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('shops').select('*').eq('id', SHOP_ID).single()
      ]);

      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (catRes.data) {
        setCategories(catRes.data as Category[]);
        if (catRes.data.length > 0 && !newCategory) {
          setNewCategory(catRes.data[0].id);
        }
      }
      if (salesRes.data) setSalesHistory(salesRes.data as Sale[]);

      if (shopRes.data) {
        setShopName(shopRes.data.name || '');
        setShopTagline(shopRes.data.tagline || '');
        setShopPhone(shopRes.data.whatsapp_number || '');
        setShopCurrency(shopRes.data.currency || 'FCFA');
        setShopAddress(shopRes.data.address || '');
        setShopLogoUrl(shopRes.data.logo_url || '');
      }
    } catch (err) {
      console.error('Erreur chargement admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Basculer la disponibilité (Rupture de stock)
  const toggleProductAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      const { error } = await supabase
        .from('products')
        .update({ is_available: nextStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_available: nextStatus } : p))
      );
    } catch (err) {
      console.error('Erreur bascule stock:', err);
      alert('Impossible de modifier la disponibilité.');
    }
  };

  // Exporter les ventes en CSV
  const exportSalesToCSV = () => {
    if (salesHistory.length === 0) {
      alert('Aucune vente enregistrée à exporter.');
      return;
    }

    const headers = ['ID Vente', 'Date', 'Heure', 'Articles', 'Mode Paiement', 'Type Commande', `Montant Total (${shopCurrency})`];

    const rows = salesHistory.map((s) => {
      const dateObj = s.created_at ? new Date(s.created_at) : new Date();
      const dateStr = dateObj.toLocaleDateString('fr-FR');
      const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const itemsList = s.items?.map((i) => `${i.title} (x${i.quantity})`).join(' | ') || '';

      return [
        `"${s.id}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${itemsList.replace(/"/g, '""')}"`,
        `"${s.payment_method}"`,
        `"${s.order_type}"`,
        s.total_amount
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ventes_${shopName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Caisse POS
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingSettings) return;

    try {
      setIsSavingSettings(true);
      let finalLogoUrl = shopLogoUrl;

      if (logoFile) {
        const compressedLogo = await compressImage(logoFile, 400, 400, 0.85);
        const fileName = `logo-${Date.now()}.webp`;
        const filePath = `branding/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, compressedLogo, {
            contentType: 'image/webp',
            cacheControl: '3600'
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        finalLogoUrl = publicUrlData.publicUrl;
        setShopLogoUrl(finalLogoUrl);
      }

      const { error } = await supabase
        .from('shops')
        .update({
          name: shopName,
          tagline: shopTagline,
          whatsapp_number: shopPhone,
          currency: shopCurrency,
          address: shopAddress,
          logo_url: finalLogoUrl
        })
        .eq('id', SHOP_ID);

      if (error) throw error;

      alert('Paramètres de la boutique mis à jour avec succès !');
      setLogoFile(null);
      setLogoPreview('');
    } catch (err) {
      console.error('Erreur mise à jour paramètres:', err);
      alert('Erreur lors de la sauvegarde des paramètres.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const totalRevenue = salesHistory.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  // Saisie du PIN
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
            <div className="flex items-center gap-2">
              {shopLogoUrl && (
                <img src={shopLogoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover border" />
              )}
              <div>
                <h1 className="text-base sm:text-lg font-bold text-stone-900">{shopName || 'Espace Gérant'}</h1>
                <p className="text-xs text-stone-500">{shopTagline || 'Administration'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
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
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'settings' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Paramètres</span>
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

      {/* Onglet 1 : Caisse POS */}
      {activeTab === 'sales' && (
        <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <h2 className="font-bold text-base text-stone-900 mb-3 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#E05A2B]" /> Encaisser un article
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products
                  .filter((p) => p.is_available)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToPosCart(p)}
                      className="p-3 text-left border border-stone-200 rounded-xl hover:border-stone-900 hover:bg-stone-50 transition-all flex flex-col justify-between h-24"
                    >
                      <span className="text-xs font-semibold line-clamp-2 text-stone-800">{p.title}</span>
                      <span className="text-xs font-bold text-[#E05A2B]">
                        {p.price.toLocaleString()} {shopCurrency}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Historique avec Export CSV */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Ventes ({salesHistory.length})
                  </h3>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold mt-1 inline-block">
                    Total : {totalRevenue.toLocaleString()} {shopCurrency}
                  </span>
                </div>

                <button
                  onClick={exportSalesToCSV}
                  className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#E05A2B]" />
                  Exporter en CSV (Excel)
                </button>
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
                        {Number(s.total_amount).toLocaleString()} {shopCurrency}
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
                  {posTotal.toLocaleString()} {shopCurrency}
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

      {/* Onglet 2 : Menu & Rupture de stock */}
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
                  <label className="font-semibold text-stone-700 block mb-1">Prix ({shopCurrency})</label>
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
                  <label className="font-semibold text-stone-700 block mb-1">Photo du plat (optimisée auto)</label>
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

          {/* Liste des plats avec Toggle Disponibilité */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h3 className="font-bold text-sm text-stone-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-stone-500" /> Gestion des plats & Disponibilité ({products.length})
            </h3>
            <div className="divide-y divide-stone-100">
              {products.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'}
                      alt={p.title}
                      className="w-11 h-11 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${p.is_available ? 'text-stone-900' : 'text-stone-400 line-through'}`}>
                          {p.title}
                        </span>
                        {!p.is_available && (
                          <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Rupture
                          </span>
                        )}
                      </div>
                      <span className="font-extrabold text-[#E05A2B]">
                        {p.price.toLocaleString()} {shopCurrency}
                      </span>
                    </div>
                  </div>

                  {/* Bouton Toggle Disponibilité */}
                  <button
                    onClick={() => toggleProductAvailability(p.id, p.is_available)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      p.is_available
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                    }`}
                  >
                    {p.is_available ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-emerald-600" /> En vente
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-stone-400" /> Épuisé
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Onglet 3 : Paramètres Boutique */}
      {activeTab === 'settings' && (
        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h2 className="font-bold text-base text-stone-900 mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#E05A2B]" /> Personnalisation de la Boutique
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              Ajustez l'identité, le numéro WhatsApp récepteur et la devise visible par vos clients.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Logo de l'établissement</label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoPreview || shopLogoUrl ? (
                      <img
                        src={logoPreview || shopLogoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-stone-400" />
                    )}
                  </div>
                  <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-stone-300 hover:border-stone-400 bg-stone-50 rounded-xl py-2.5 px-3 cursor-pointer text-stone-600 transition-colors">
                    <Camera className="w-4 h-4 text-stone-500" />
                    <span className="text-xs font-medium truncate">
                      {logoFile ? logoFile.name : 'Changer le logo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoFile(file);
                          setLogoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Nom commercial</label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Ex: Pâtisserie Le Régal"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E05A2B]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Slogan ou sous-titre</label>
                  <input
                    type="text"
                    value={shopTagline}
                    onChange={(e) => setShopTagline(e.target.value)}
                    placeholder="Ex: Saveurs artisanales & Brunch"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E05A2B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Numéro WhatsApp (avec indicatif)</label>
                  <input
                    type="text"
                    required
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    placeholder="Ex: +221771234567"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E05A2B]"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Format international (+221...)</span>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Devise affichée</label>
                  <input
                    type="text"
                    required
                    value={shopCurrency}
                    onChange={(e) => setShopCurrency(e.target.value)}
                    placeholder="Ex: FCFA, EUR, $"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E05A2B]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Adresse physique</label>
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="Ex: Sacré-Cœur 3, Dakar"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E05A2B]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full bg-[#E05A2B] hover:bg-[#c94d22] disabled:bg-stone-300 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Sauvegarder les modifications
                </button>
              </div>
            </form>
          </div>
        </main>
      )}
    </div>
  );
}