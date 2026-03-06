import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, SafeAreaView, StatusBar, TextInput, Image, ActivityIndicator } from 'react-native';
import { Home, Search, ShoppingBag, Clock, User, ChevronLeft, MapPin, Star, Plus, Minus, Trash2 } from 'lucide-react-native';

const TUNNEL_URL = "https://c3c2964af1d106.lhr.life/api";

const C = {
  bg: '#f8f9fa',
  primary: '#E11D48',
  primaryLight: '#fff1f2',
  secondary: '#64748b',
  card: '#ffffff',
  text: '#0f172a',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b'
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('HOME');
  const [apiBase] = useState(TUNNEL_URL);

  // State
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [couponCode, setCouponCode] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'payment'
  const [paymentMethod, setPaymentMethod] = useState('card');

  const [user] = useState({ email: 'customer@test.com', name: 'Usuario Demo', role: 'CUSTOMER' });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${apiBase}/restaurants`);
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data);
      }
    } catch (e) {
      Alert.alert("Error", "Error al conectar con la API.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${apiBase}/orders?email=${user.email}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      // Handle error implicitly
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, restaurant) => {
    if (cart.length > 0 && cart[0].restaurantId !== restaurant.id) {
      Alert.alert("Atención", "Solo puedes hacer pedidos de un restaurante a la vez.");
      return;
    }
    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
      setCart(cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...product, productId: product.id, quantity: 1, restaurantId: restaurant.id }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeCartItem = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = cartTotal > 15000 ? 0 : 1990;
  const serviceFee = Math.round(cartTotal * 0.05);
  const grandTotal = Math.max(0, cartTotal + deliveryFee + serviceFee - discountAmount);

  const handleValidateCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await fetchWithTimeout(`${apiBase}/coupons/validate`, {
        method: 'POST',
        body: JSON.stringify({
          code: couponInput.trim(),
          restaurantId: cart[0].restaurantId,
          subtotal: cartTotal,
          customerEmail: user.email
        })
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
        setCouponCode(null);
        setDiscountAmount(0);
      } else if (data.success) {
        setCouponCode(data.coupon.code);
        setDiscountAmount(data.discountAmount);
        setCouponInput('');
        Alert.alert("Cupón Aplicado", `Has ahorrado $${data.discountAmount.toLocaleString()}`);
      }
    } catch (e) {
      Alert.alert("Error", "Ocurrió un error al validar el cupón");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${apiBase}/orders`, {
        method: 'POST',
        body: JSON.stringify({
          customerEmail: user.email,
          restaurantId: cart[0].restaurantId,
          items: cart,
          total: grandTotal,
          paymentMethod: paymentMethod === 'card' ? 'CARD' : 'CASH',
          couponCode: couponCode || undefined
        })
      });
      if (res.ok) {
        setCart([]);
        setCouponCode(null);
        setDiscountAmount(0);
        setCheckoutStep('cart');
        setCurrentScreen('ORDERS');
        fetchOrders();
        Alert.alert("🎉 ¡Éxito!", "Tu pedido ha sido creado correctamente.");
      } else {
        throw new Error("Fallo");
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo procesar el pedido.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERS ---
  const renderHome = () => {
    const filtered = restaurants.filter(r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>¿Qué vas a</Text>
          <Text style={[styles.title, { color: C.warning }]}>pedir hoy? 🔥</Text>
        </View>

        <View style={styles.searchBox}>
          <Search color={C.secondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar restaurantes o categorías..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 50 }} /> : (
          <View style={styles.list}>
            <Text style={styles.sectionTitle}>Restaurantes Destacados</Text>
            {filtered.map(r => (
              <TouchableOpacity key={r.id} style={styles.card} onPress={() => { setSelectedRestaurant(r); setCurrentScreen('RESTAURANT'); }}>
                <Image source={{ uri: r.image || 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80' }} style={styles.cardImage} />
                <View style={styles.cardBody}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.cardTitle}>{r.name}</Text>
                    <View style={styles.ratingBadge}>
                      <Star color="#fff" size={12} fill="#fff" />
                      <Text style={styles.ratingText}>4.8</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>{r.category} • 20-35 min</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <MapPin color={C.secondary} size={14} />
                    <Text style={{ color: C.secondary, fontSize: 12, marginLeft: 4 }}>{r.address}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderRestaurant = () => {
    if (!selectedRestaurant) return null;
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => setCurrentScreen('HOME')} style={{ padding: 8, marginLeft: -8 }}>
            <ChevronLeft color={C.text} size={28} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle} numberOfLines={1}>{selectedRestaurant.name}</Text>
          <View style={{ width: 28 }} />
        </View>
        <ScrollView contentContainerStyle={styles.container}>
          <Image source={{ uri: selectedRestaurant.image || 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80' }} style={styles.heroImage} />
          <Text style={[styles.title, { marginTop: 15 }]}>{selectedRestaurant.name}</Text>
          <Text style={styles.cardSubtitle}>{selectedRestaurant.category} • Envío gratis</Text>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Menú Principal</Text>
            {selectedRestaurant.products.map(p => (
              <View key={p.id} style={styles.productRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productDesc} numberOfLines={2}>{p.description}</Text>
                  <Text style={styles.productPrice}>${p.price.toLocaleString()}</Text>
                </View>
                {p.image && <Image source={{ uri: p.image }} style={styles.productImage} />}
                <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(p, selectedRestaurant)}>
                  <Plus color="#fff" size={20} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderCart = () => {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>Mi Carrito</Text>
          <View style={{ width: 28 }} />
        </View>
        {cart.length === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag color={C.border} size={64} />
            <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
            <Text style={styles.emptyDesc}>Agrega productos de tus restaurantes favoritos.</Text>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setCurrentScreen('HOME')}>
              <Text style={styles.btnSecondaryText}>Explorar Restaurantes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.container}>
            {checkoutStep === 'payment' ? (
              <View>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }} onPress={() => setCheckoutStep('cart')}>
                  <ChevronLeft color={C.primary} size={20} />
                  <Text style={{ color: C.primary, fontWeight: 'bold' }}>Volver al Carrito</Text>
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>Método de Pago</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                  <TouchableOpacity style={[styles.payMethodBtn, paymentMethod === 'card' && styles.payMethodActive]} onPress={() => setPaymentMethod('card')}>
                    <Text style={[styles.payMethodText, paymentMethod === 'card' && styles.payMethodTextActive]}>Tarjeta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.payMethodBtn, paymentMethod === 'cash' && styles.payMethodActive]} onPress={() => setPaymentMethod('cash')}>
                    <Text style={[styles.payMethodText, paymentMethod === 'cash' && styles.payMethodTextActive]}>Efectivo</Text>
                  </TouchableOpacity>
                </View>
                {paymentMethod === 'card' && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontWeight: 'bold', color: C.secondary, marginBottom: 10 }}>Ingresa tu tarjeta (Test)</Text>
                    <TextInput style={styles.inputField} placeholder="0000 0000 0000 0000" keyboardType="numeric" />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                      <TextInput style={[styles.inputField, { flex: 1 }]} placeholder="MM/AA" />
                      <TextInput style={[styles.inputField, { flex: 1 }]} placeholder="CVV" keyboardType="numeric" />
                    </View>
                  </View>
                )}

                <TouchableOpacity style={[styles.btnPrimary, loading && { opacity: 0.7 }]} onPress={submitOrder} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Pagar ${grandTotal.toLocaleString()}</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.cartList}>
                  {cart.map(item => (
                    <View key={item.productId} style={styles.cartItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.cartItemPrice}>${(item.price * item.quantity).toLocaleString()}</Text>
                      </View>
                      <View style={styles.qtyControls}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => item.quantity > 1 ? updateQuantity(item.productId, -1) : removeCartItem(item.productId)}>
                          {item.quantity === 1 ? <Trash2 color={C.primary} size={16} /> : <Minus color={C.text} size={16} />}
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, 1)}>
                          <Plus color={C.text} size={16} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Coupons */}
                {!couponCode ? (
                  <View style={styles.couponBox}>
                    <TextInput style={styles.couponInput} placeholder="Ingresa un cupón" value={couponInput} onChangeText={setCouponInput} />
                    <TouchableOpacity style={styles.couponBtn} onPress={handleValidateCoupon} disabled={validatingCoupon}>
                      {validatingCoupon ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.couponBtnText}>Aplicar</Text>}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.couponBox, { backgroundColor: C.success + '20', borderColor: C.success }]}>
                    <Text style={{ color: C.success, fontWeight: 'bold', flex: 1, padding: 10 }}>{couponCode} aplicado (-${discountAmount})</Text>
                    <TouchableOpacity style={{ padding: 10 }} onPress={() => { setCouponCode(null); setDiscountAmount(0); }}><Trash2 color={C.text} size={16} /></TouchableOpacity>
                  </View>
                )}

                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>${cartTotal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tarifa de servicio</Text>
                    <Text style={styles.summaryValue}>${serviceFee.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Envío</Text>
                    <Text style={[styles.summaryValue, deliveryFee === 0 && { color: C.success }]}>{deliveryFee === 0 ? 'Gratis' : `$${deliveryFee.toLocaleString()}`}</Text>
                  </View>
                  {discountAmount > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Descuento Cupón</Text>
                      <Text style={{ fontWeight: 'bold', color: C.success }}>-${discountAmount.toLocaleString()}</Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                    <Text style={styles.summaryTotalLabel}>Total a Pagar</Text>
                    <Text style={styles.summaryTotalValue}>${grandTotal.toLocaleString()}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.btnPrimary} onPress={() => setCheckoutStep('payment')}>
                  <Text style={styles.btnPrimaryText}>Ir a Pagar</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderOrders = () => {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>Mis Pedidos</Text>
          <View style={{ width: 28 }} />
        </View>
        {loading ? <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 50 }} /> : (
          <ScrollView contentContainerStyle={styles.container}>
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <Search color={C.border} size={64} />
                <Text style={styles.emptyTitle}>Aún no tienes pedidos</Text>
              </View>
            ) : (
              orders.map(order => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={styles.cardTitle}>{order.restaurant?.name || 'Restaurante'}</Text>
                    <Text style={styles.orderStatus(order.status)}>{order.status}</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                  <View style={{ marginTop: 15, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: 'bold' }}>Total:</Text>
                    <Text style={{ fontWeight: 'bold', color: C.primary }}>${order.total.toLocaleString()}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderProfile = () => {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>Mi Perfil</Text>
          <View style={{ width: 28 }} />
        </View>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User color="#fff" size={40} />
            </View>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>

          <View style={styles.profileMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setCurrentScreen('ORDERS'); fetchOrders(); }}>
              <Clock color={C.secondary} size={22} />
              <Text style={styles.menuItemText}>Historial de pedidos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <MapPin color={C.secondary} size={22} />
              <Text style={styles.menuItemText}>Direcciones guardadas</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={{ flex: 1 }}>
        {currentScreen === 'HOME' && renderHome()}
        {currentScreen === 'RESTAURANT' && renderRestaurant()}
        {currentScreen === 'CART' && renderCart()}
        {currentScreen === 'ORDERS' && renderOrders()}
        {currentScreen === 'PROFILE' && renderProfile()}
      </View>

      {/* FOOTER TAB BAR */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => setCurrentScreen('HOME')}>
          <Home color={currentScreen === 'HOME' || currentScreen === 'RESTAURANT' ? C.primary : C.secondary} size={24} />
          <Text style={[styles.navText, (currentScreen === 'HOME' || currentScreen === 'RESTAURANT') && styles.navTextActive]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => { setCurrentScreen('ORDERS'); fetchOrders(); }}>
          <Clock color={currentScreen === 'ORDERS' ? C.primary : C.secondary} size={24} />
          <Text style={[styles.navText, currentScreen === 'ORDERS' && styles.navTextActive]}>Pedidos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => setCurrentScreen('PROFILE')}>
          <User color={currentScreen === 'PROFILE' ? C.primary : C.secondary} size={24} />
          <Text style={[styles.navText, currentScreen === 'PROFILE' && styles.navTextActive]}>Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => setCurrentScreen('CART')}>
          <View style={styles.cartIconWrapper}>
            <ShoppingBag color={currentScreen === 'CART' ? C.primary : C.secondary} size={24} />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navText, currentScreen === 'CART' && styles.navTextActive]}>Carrito</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '900', color: C.text, letterSpacing: -1 },
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border },
  appBarTitle: { fontSize: 18, fontWeight: 'bold', color: C.text, textAlign: 'center', flex: 1 },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: C.border, marginBottom: 25 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, color: C.text },

  list: { paddingBottom: 20 },
  card: { backgroundColor: C.card, borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: C.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  cardImage: { width: '100%', height: 160, backgroundColor: '#eee' },
  cardBody: { padding: 15 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  cardSubtitle: { fontSize: 14, color: C.secondary, marginTop: 4 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },

  heroImage: { width: '100%', height: 200, borderRadius: 20, backgroundColor: '#eee' },
  menuSection: { marginTop: 30 },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.border },
  productName: { fontSize: 16, fontWeight: 'bold', color: C.text, marginBottom: 4 },
  productDesc: { fontSize: 13, color: C.secondary, marginBottom: 8, lineHeight: 18 },
  productPrice: { fontSize: 16, fontWeight: '800', color: C.primary },
  productImage: { width: 80, height: 80, borderRadius: 15, marginLeft: 10 },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 15 },

  cartList: { marginBottom: 20 },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  cartItemPrice: { fontSize: 16, fontWeight: 'bold', color: C.text, marginTop: 4 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 10, padding: 5 },
  qtyBtn: { padding: 8 },
  qtyText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 15 },

  payMethodBtn: { flex: 1, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  payMethodActive: { backgroundColor: C.primary, borderColor: C.primary },
  payMethodText: { fontWeight: 'bold', color: C.secondary },
  payMethodTextActive: { color: '#fff' },
  inputField: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, padding: 15, borderRadius: 10 },
  couponBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 5, overflow: 'hidden' },
  couponInput: { flex: 1, padding: 10, marginLeft: 5 },
  couponBtn: { backgroundColor: C.text, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  couponBtnText: { color: '#fff', fontWeight: 'bold' },

  summaryCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: C.border, marginBottom: 25 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: C.secondary, fontSize: 15 },
  summaryValue: { fontWeight: 'bold', fontSize: 15, color: C.text },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 15, marginTop: 5, marginBottom: 0 },
  summaryTotalLabel: { fontSize: 18, fontWeight: '800', color: C.text },
  summaryTotalValue: { fontSize: 24, fontWeight: '900', color: C.primary },

  btnPrimary: { backgroundColor: C.primary, padding: 18, borderRadius: 15, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },

  btnSecondary: { backgroundColor: C.primaryLight, padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 20, paddingHorizontal: 30 },
  btnSecondaryText: { color: C.primary, fontSize: 15, fontWeight: 'bold' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: C.text, marginTop: 20, marginBottom: 10 },
  emptyDesc: { textAlign: 'center', color: C.secondary, lineHeight: 22 },

  orderCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: C.border },
  orderStatus: (status) => ({
    fontSize: 12, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, overflow: 'hidden',
    backgroundColor: status === 'DELIVERED' ? '#dcfce7' : status === 'PENDING' ? '#fef3c7' : '#fee2e2',
    color: status === 'DELIVERED' ? '#166534' : status === 'PENDING' ? '#92400e' : '#991b1b',
  }),

  profileHeader: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  profileName: { fontSize: 24, fontWeight: 'bold', color: C.text },
  profileEmail: { fontSize: 15, color: C.secondary, marginTop: 4 },

  profileMenu: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 40 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  menuItemText: { fontSize: 16, fontWeight: '600', color: C.text, marginLeft: 15 },

  logoutBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5' },
  logoutText: { color: C.primary, fontSize: 16, fontWeight: 'bold' },

  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border, paddingBottom: 25, paddingTop: 10 },
  navTab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 10, fontWeight: '600', color: C.secondary, marginTop: 4 },
  navTextActive: { color: C.primary, fontWeight: '800' },
  cartIconWrapper: { position: 'relative' },
  cartBadge: { position: 'absolute', top: -5, right: -10, backgroundColor: C.primary, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});
