import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, StatusBar,
  TextInput, Alert, RefreshControl, Linking,
} from 'react-native';
import * as Location from 'expo-location';

// ═══════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════
var DEFAULT_API = 'https://pideloya-v1-test.loca.lt';

var C = {
  bg: '#0A0A14', surface: '#12121F', card: '#1A1A2E', cardBorder: '#252545',
  accent: '#FF6B35', accentSoft: '#FF6B3520', red: '#CC0000', redSoft: '#CC000020',
  green: '#22C55E', greenSoft: '#22C55E20', blue: '#3B82F6', blueSoft: '#3B82F620',
  yellow: '#FACC15', yellowSoft: '#FACC1520', orange: '#F97316', orangeSoft: '#F9731620',
  white: '#F8FAFC', textPrimary: '#F8FAFC', textSecondary: '#94A3B8', textMuted: '#64748B',
};

var VEHICLE_EMOJI = { BICYCLE: '🚲', EBIKE: '⚡', MOTORCYCLE: '🏍️', CAR: '🚗' };
var STATUS_CONFIG = {
  SUBMITTED: { label: 'Solicitud Enviada', color: C.blue, bg: C.blueSoft, emoji: '📋', desc: 'Tu solicitud fue recibida. Estamos revisando tus datos.' },
  IN_REVIEW: { label: 'En Revisión', color: C.yellow, bg: C.yellowSoft, emoji: '🔍', desc: 'Un administrador está revisando tu solicitud.' },
  APPROVED: { label: 'Aprobado', color: C.green, bg: C.greenSoft, emoji: '✅', desc: '¡Felicidades! Ya puedes empezar a repartir.' },
  REJECTED: { label: 'Rechazado', color: C.red, bg: C.redSoft, emoji: '❌', desc: 'Lamentablemente tu solicitud fue rechazada.' },
  DOCS_INCOMPLETE: { label: 'Docs. Incompletos', color: C.orange, bg: C.orangeSoft, emoji: '📄', desc: 'Necesitamos documentos adicionales.' },
  DRAFT: { label: 'Borrador', color: C.textMuted, bg: '#ffffff10', emoji: '✏️', desc: 'Tu solicitud no ha sido completada.' },
};

var DEMO_ORDERS = [
  { id: '1', orderNumber: '#BK-990', restaurantName: 'Burger King Providencia', restaurantAddress: 'Av. Providencia 2124', restaurantLat: -33.4372, restaurantLon: -70.6506, total: 9990, items: [{ name: 'Whopper Meal', qty: 1 }] },
  { id: '2', orderNumber: '#PH-120', restaurantName: 'Pizza Hut Las Condes', restaurantAddress: 'Av. Apoquindo 4501', restaurantLat: -33.4189, restaurantLon: -70.6064, total: 14990, items: [{ name: 'Pizza Pepperoni', qty: 1 }] },
  { id: '3', orderNumber: '#SO-445', restaurantName: 'Sushi Osaka Vitacura', restaurantAddress: 'Av. Vitacura 3565', restaurantLat: -33.4259, restaurantLon: -70.6088, total: 16990, items: [{ name: 'Combo Salmón', qty: 1 }] },
];

function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  var toRad = function (x) { return (x * Math.PI) / 180; };
  var R = 6371;
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function App() {
  var _a = useState('login'), screen = _a[0], setScreen = _a[1];
  var _b = useState(null), driver = _b[0], setDriver = _b[1];
  var _c = useState(DEFAULT_API), apiBase = _c[0], setApiBase = _c[1];
  var _d = useState(null), driverLocation = _d[0], setDriverLocation = _d[1];
  var _e = useState([]), orders = _e[0], setOrders = _e[1];
  var _f = useState(null), selectedOrder = _f[0], setSelectedOrder = _f[1];
  var _g = useState(false), loading = _g[0], setLoading = _g[1];
  var _h = useState(false), refreshing = _h[0], setRefreshing = _h[1];
  var _i = useState(null), activeOrder = _i[0], setActiveOrder = _i[1];
  var _j = useState('restaurant'), mapMode = _j[0], setMapMode = _j[1];

  useEffect(function () {
    (async function () {
      try {
        var result = await Location.requestForegroundPermissionsAsync();
        if (result.status === 'granted') {
          var loc = await Location.getCurrentPositionAsync({});
          setDriverLocation(loc.coords);
          Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, distanceInterval: 10 },
            function (newLoc) { setDriverLocation(newLoc.coords); }
          );
        }
      } catch (e) {
        console.log('Location error:', e);
      }
    })();
  }, []);

  var loadOrders = async function (currentLoc) {
    if (currentLoc === undefined) currentLoc = driverLocation;
    setLoading(true);
    try {
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 5000);
      var res = await fetch(apiBase + '/api/driver/orders', { signal: controller.signal });
      clearTimeout(timeout);
      var data = await res.json();
      setOrders(data.map(function (o) {
        return Object.assign({}, o, {
          distanceKm: currentLoc ? haversineDistance(currentLoc.latitude, currentLoc.longitude, o.restaurantLat, o.restaurantLon) : null
        });
      }));
    } catch (e) {
      console.log('Orders fallback:', e);
      setOrders(DEMO_ORDERS.map(function (o) {
        return Object.assign({}, o, {
          distanceKm: currentLoc ? haversineDistance(currentLoc.latitude, currentLoc.longitude, o.restaurantLat, o.restaurantLon) : null
        });
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  var updateOrderStatus = async function (orderId, newStatus) {
    try {
      await fetch(apiBase + '/api/driver/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId, status: newStatus, driverEmail: driver ? driver.email : '' }),
      });
    } catch (e) {
      console.log('Update fail:', e);
    }
  };

  var handleLogin = function (driverData) {
    setDriver(driverData);
    if (driverData.isApproved) {
      setScreen('orders');
      loadOrders();
    } else {
      setScreen('status');
    }
  };

  var handleLogout = function () {
    setDriver(null);
    setScreen('login');
    setOrders([]);
    setActiveOrder(null);
  };

  var handleAcceptOrder = function (o) {
    Alert.alert('Confirmar', '¿Aceptar pedido de ' + o.restaurantName + '?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, aceptar', onPress: function () {
          setActiveOrder(o);
          setOrders(function (prev) { return prev.filter(function (x) { return x.id !== o.id; }); });
          setScreen('active');
          updateOrderStatus(o.id, 'PICKED_UP');
        }
      }
    ]);
  };

  var handleCompleteOrder = function () {
    if (!activeOrder) return;
    updateOrderStatus(activeOrder.id, 'DELIVERED');
    setActiveOrder(null);
    setScreen('orders');
    loadOrders();
    Alert.alert('🎉 ¡Completado!', 'Entrega exitosa. ¡Buen trabajo!');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      {screen === 'login' && <LoginScreen apiBase={apiBase} setApiBase={setApiBase} onLogin={handleLogin} />}
      {screen === 'status' && <StatusScreen driver={driver} onLogout={handleLogout} apiBase={apiBase} onRefresh={handleLogin} />}
      {screen === 'orders' && (
        <OrderListScreen
          orders={orders} loading={loading} refreshing={refreshing} driver={driver}
          activeOrder={activeOrder}
          onRefresh={function () { setRefreshing(true); loadOrders(); }}
          onSelectOrder={function (o) { setSelectedOrder(o); setScreen('detail'); }}
          onGoToActive={function () { setScreen('active'); }}
          onGoToEarnings={function () { setScreen('earnings'); }}
          onLogout={handleLogout}
        />
      )}
      {screen === 'detail' && <OrderDetailScreen order={selectedOrder} onBack={function () { setScreen('orders'); }} onAccept={handleAcceptOrder} />}
      {screen === 'active' && (
        <ActiveScreen
          order={activeOrder}
          onComplete={handleCompleteOrder}
          onBack={function () { setScreen('orders'); }}
          onOpenMap={function (o, m) { setSelectedOrder(o); setMapMode(m); setScreen('map'); }}
        />
      )}
      {screen === 'map' && <MapScreen order={selectedOrder} mapMode={mapMode} onBack={function () { setScreen('active'); }} />}
      {screen === 'earnings' && <EarningsScreen driver={driver} apiBase={apiBase} onBack={function () { setScreen('orders'); }} />}
    </View>
  );
}

// ═══════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════
function LoginScreen(props) {
  var apiBase = props.apiBase;
  var setApiBase = props.setApiBase;
  var onLogin = props.onLogin;

  var _a = useState(''), email = _a[0], setEmail = _a[1];
  var _b = useState(''), password = _b[0], setPassword = _b[1];
  var _c = useState(false), loading = _c[0], setLoading = _c[1];
  var _d = useState(''), error = _d[0], setError = _d[1];
  var _e = useState(false), showConfig = _e[0], setShowConfig = _e[1];

  var handleLogin = async function () {
    if (!email.trim() || !password.trim()) {
      setError('Ingresa email y contraseña');
      return;
    }
    setLoading(true);
    setError('');
    try {
      var res = await fetch(apiBase + '/api/driver/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim() }),
      });
      var data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error de autenticación');
        setLoading(false);
        return;
      }

      if (data.isFirstLogin) {
        Alert.alert(
          '🔐 Contraseña temporal',
          'Estás usando tu RUT como contraseña temporal. Te recomendamos cambiarla.',
          [{ text: 'Entendido', onPress: function () { onLogin(data); } }]
        );
      } else {
        onLogin(data);
      }
    } catch (e) {
      console.log('Login error:', e);
      setError('No se pudo conectar al servidor. Verifica la URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={{ padding: 30, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 70, height: 70, borderRadius: 20, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff' }}>PY</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: C.white }}>PídeloYa</Text>
          <Text style={{ color: C.accent, fontWeight: '700', fontSize: 14, marginTop: 2 }}>DRIVERS APP</Text>
        </View>

        <Text style={s.label}>Email de registro</Text>
        <TextInput style={s.input} placeholder="tu@email.com" placeholderTextColor={C.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={s.label}>Contraseña</Text>
        <TextInput style={s.input} placeholder="Tu RUT sin puntos ni guión" placeholderTextColor={C.textMuted} value={password} onChangeText={setPassword} secureTextEntry={true} />

        {error ? (
          <View style={{ backgroundColor: C.redSoft, borderRadius: 10, padding: 12, marginBottom: 15 }}>
            <Text style={{ color: '#FF6B6B', fontSize: 13, textAlign: 'center' }}>{'⚠️ ' + error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[s.loginBtn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.loginBtnTxt}>INICIAR SESIÓN</Text>
          )}
        </TouchableOpacity>

        <Text style={{ color: C.textMuted, fontSize: 12, textAlign: 'center', marginTop: 15, lineHeight: 18 }}>
          {'Tu primer login usa tu RUT como contraseña\n(sin puntos ni guión, ej: 184567892)'}
        </Text>

        <TouchableOpacity onPress={function () { setShowConfig(!showConfig); }} style={{ marginTop: 30 }}>
          <Text style={{ color: C.textMuted, fontSize: 11, textAlign: 'center' }}>
            {showConfig ? '▲ Ocultar configuración' : '⚙️ Configuración de servidor'}
          </Text>
        </TouchableOpacity>
        {showConfig && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: C.textMuted, fontSize: 10, marginBottom: 5 }}>SERVER URL:</Text>
            <TextInput style={[s.input, { fontSize: 12, padding: 10 }]} value={apiBase} onChangeText={setApiBase} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════
// STATUS SCREEN (No aprobados)
// ═══════════════════════════════════════
function StatusScreen(props) {
  var driver = props.driver;
  var onLogout = props.onLogout;
  var apiBase = props.apiBase;
  var onRefresh = props.onRefresh;

  var _a = useState(false), refreshing = _a[0], setRefreshing = _a[1];
  var statusCfg = STATUS_CONFIG[driver ? driver.status : 'DRAFT'] || STATUS_CONFIG.DRAFT;

  var handleRefreshStatus = async function () {
    setRefreshing(true);
    try {
      var cleanRut = driver && driver.rut ? driver.rut.replace(/[\.\-]/g, '') : '';
      var res = await fetch(apiBase + '/api/driver/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: driver.email, password: cleanRut }),
      });
      var data = await res.json();
      if (res.ok) {
        onRefresh(data);
      }
    } catch (e) {
      console.log('Refresh error:', e);
    }
    setRefreshing(false);
  };

  var driverName = driver ? (driver.firstName || '') + ' ' + (driver.lastNameP || '') : '';
  var driverVehicle = driver && driver.vehicleType ? (VEHICLE_EMOJI[driver.vehicleType] || '🚲') + ' ' + driver.vehicleType : '—';

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefreshStatus} tintColor={C.accent} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingTop: 10 }}>
          <View>
            <Text style={{ color: C.white, fontSize: 22, fontWeight: '800' }}>Mi Solicitud</Text>
            <Text style={{ color: C.textSecondary, fontSize: 13, marginTop: 2 }}>{'Hola, ' + (driver ? driver.firstName : '') + ' 👋'}</Text>
          </View>
          <TouchableOpacity onPress={onLogout} style={{ backgroundColor: '#ffffff10', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
            <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '600' }}>Salir</Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: statusCfg.bg, borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: statusCfg.color + '30' }}>
          <Text style={{ fontSize: 56, marginBottom: 12 }}>{statusCfg.emoji}</Text>
          <Text style={{ color: statusCfg.color, fontSize: 22, fontWeight: '800', textAlign: 'center' }}>{statusCfg.label}</Text>
          <Text style={{ color: C.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22 }}>{statusCfg.desc}</Text>
        </View>

        {driver && driver.rejectionReason && (driver.status === 'REJECTED' || driver.status === 'DOCS_INCOMPLETE') ? (
          <View style={{ backgroundColor: C.redSoft, borderRadius: 14, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#FF000030' }}>
            <Text style={{ color: '#FF8888', fontWeight: '700', fontSize: 13, marginBottom: 6 }}>{'📋 Detalle:'}</Text>
            <Text style={{ color: '#FFaaaa', fontSize: 13, lineHeight: 20 }}>{driver.rejectionReason}</Text>
          </View>
        ) : null}

        <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.cardBorder }}>
          <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 14 }}>DATOS DE TU SOLICITUD</Text>
          <InfoRow label="Nombre" value={driverName} />
          <InfoRow label="RUT" value={driver ? driver.rut : '—'} />
          <InfoRow label="Email" value={driver ? driver.email : '—'} />
          <InfoRow label="Teléfono" value={driver ? driver.phone : '—'} />
          <InfoRow label="Vehículo" value={driverVehicle} />
          <InfoRow label="Comuna" value={driver ? driver.comuna : '—'} />
        </View>

        <Text style={{ color: C.textMuted, fontSize: 12, textAlign: 'center', marginTop: 10 }}>
          {'↓ Desliza hacia abajo para actualizar el estado'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════
// ORDER LIST SCREEN (Aprobados)
// ═══════════════════════════════════════
function OrderListScreen(props) {
  var orders = props.orders;
  var loading = props.loading;
  var refreshing = props.refreshing;
  var onRefresh = props.onRefresh;
  var onSelectOrder = props.onSelectOrder;
  var driver = props.driver;
  var activeOrder = props.activeOrder;
  var onGoToActive = props.onGoToActive;
  var onGoToEarnings = props.onGoToEarnings;
  var onLogout = props.onLogout;

  var driverFirstName = driver ? driver.firstName : '';
  var vehicleEmoji = driver && driver.vehicleType ? (VEHICLE_EMOJI[driver.vehicleType] || '') : '';

  return (
    <SafeAreaView style={s.root}>
      <View style={{ padding: 20, paddingTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.cardBorder }}>
        <View>
          <Text style={{ color: C.white, fontSize: 22, fontWeight: '800' }}>Pedidos</Text>
          <Text style={{ color: C.textSecondary, fontSize: 13 }}>{'Hola, ' + driverFirstName + ' ' + vehicleEmoji}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={onGoToEarnings} style={{ backgroundColor: C.greenSoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 8 }}>
            <Text style={{ color: C.green, fontWeight: '700', fontSize: 13 }}>💰</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={{ backgroundColor: C.accentSoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 8 }}>
            <Text style={{ color: C.accent, fontWeight: '700', fontSize: 13 }}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={{ backgroundColor: '#ffffff10', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
            <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '600' }}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeOrder ? (
        <TouchableOpacity onPress={onGoToActive}
          style={{ backgroundColor: C.accent, margin: 15, marginBottom: 5, padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 22, marginRight: 10 }}>🚚</Text>
            <View>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>PEDIDO EN CURSO</Text>
              <Text style={{ color: '#ffffffbb', fontSize: 12 }}>Toca para continuar</Text>
            </View>
          </View>
          <Text style={{ color: '#fff', fontWeight: '800' }}>{'VER →'}</Text>
        </TouchableOpacity>
      ) : null}

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}>
        {loading && !refreshing ? <ActivityIndicator style={{ marginTop: 30 }} color={C.accent} /> : null}

        {orders.length === 0 && !loading ? (
          <View style={{ alignItems: 'center', marginTop: 60, padding: 30 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📭</Text>
            <Text style={{ color: C.textSecondary, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>No hay pedidos disponibles</Text>
            <Text style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6 }}>Desliza hacia abajo para actualizar</Text>
          </View>
        ) : null}

        <View style={{ padding: 15, paddingBottom: 30 }}>
          {orders.map(function (o) {
            return (
              <TouchableOpacity key={o.id} style={s.card} onPress={function () { onSelectOrder(o); }} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.white, fontSize: 17, fontWeight: '700' }}>{o.restaurantName}</Text>
                    <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 3 }}>{o.restaurantAddress}</Text>
                  </View>
                  <View style={{ backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                    <Text style={{ color: C.accent, fontWeight: '800', fontSize: 13 }}>{'$' + o.total.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: C.cardBorder, paddingTop: 12 }}>
                  <Text style={{ color: C.blue, fontWeight: '600', fontSize: 13 }}>{'📍 ' + (o.distanceKm ? o.distanceKm.toFixed(1) : '—') + ' km'}</Text>
                  <Text style={{ color: C.accent, fontWeight: '700', fontSize: 13 }}>{'Ver detalles →'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════
// ORDER DETAIL SCREEN
// ═══════════════════════════════════════
function OrderDetailScreen(props) {
  var o = props.order;
  var onBack = props.onBack;
  var onAccept = props.onAccept;

  if (!o) return null;
  return (
    <SafeAreaView style={s.root}>
      <TouchableOpacity onPress={onBack} style={{ padding: 20 }}>
        <Text style={{ color: C.accent, fontWeight: '600' }}>{'← Volver'}</Text>
      </TouchableOpacity>
      <ScrollView style={{ padding: 20 }}>
        <Text style={{ color: C.white, fontSize: 26, fontWeight: '800' }}>{o.restaurantName}</Text>
        <Text style={{ color: C.textSecondary, marginBottom: 24, marginTop: 4 }}>{o.restaurantAddress}</Text>

        <View style={[s.card, { backgroundColor: C.surface }]}>
          <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>RESUMEN DEL PEDIDO</Text>
          {o.items ? o.items.map(function (it, i) {
            return (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={{ color: C.textSecondary, fontSize: 15 }}>{'• ' + it.qty + 'x ' + it.name}</Text>
                {it.price ? <Text style={{ color: C.textMuted }}>{'$' + it.price.toLocaleString()}</Text> : null}
              </View>
            );
          }) : null}
          <View style={{ marginTop: 16, borderTopWidth: 1, borderColor: C.cardBorder, paddingTop: 12 }}>
            <Text style={{ color: C.accent, fontSize: 22, fontWeight: '800' }}>{'Total: $' + o.total.toLocaleString()}</Text>
          </View>
        </View>

        {o.distanceKm ? (
          <View style={{ backgroundColor: C.blueSoft, borderRadius: 12, padding: 14, marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, marginRight: 10 }}>📍</Text>
            <Text style={{ color: C.blue, fontWeight: '600' }}>{'A ' + o.distanceKm.toFixed(1) + ' km de tu ubicación'}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[s.loginBtn, { marginTop: 30, marginBottom: 40 }]} onPress={function () { onAccept(o); }}>
          <Text style={s.loginBtnTxt}>{'✅ ACEPTAR Y RETIRAR'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════
// ACTIVE DELIVERY SCREEN
// ═══════════════════════════════════════
function ActiveScreen(props) {
  var o = props.order;
  var onComplete = props.onComplete;
  var onOpenMap = props.onOpenMap;
  var onBack = props.onBack;

  var _a = useState('pickup'), step = _a[0], setStep = _a[1];
  if (!o) return null;
  var isPickup = step === 'pickup';

  return (
    <SafeAreaView style={s.root}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, justifyContent: 'space-between', borderBottomWidth: 1, borderColor: C.cardBorder }}>
        <TouchableOpacity onPress={onBack}><Text style={{ color: C.accent, fontWeight: '600' }}>{'← Volver'}</Text></TouchableOpacity>
        <Text style={{ color: C.white, fontSize: 17, fontWeight: '800' }}>PEDIDO EN CURSO</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: C.accent, marginRight: 4 }} />
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: isPickup ? C.cardBorder : C.green, marginLeft: 4 }} />
        </View>

        <Text style={{ color: isPickup ? C.accent : C.green, fontWeight: '800', textAlign: 'center', marginBottom: 20, fontSize: 15 }}>
          {isPickup ? '📦 ETAPA 1: RETIRO EN LOCAL' : '🏠 ETAPA 2: ENTREGA AL CLIENTE'}
        </Text>

        <View style={[s.card, { borderLeftColor: isPickup ? C.accent : C.green, borderLeftWidth: 4, padding: 22 }]}>
          <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>{isPickup ? 'RESTAURANTE' : 'CLIENTE'}</Text>
          <Text style={{ color: C.white, fontSize: 20, fontWeight: '800', marginVertical: 6 }}>{isPickup ? o.restaurantName : (o.customerName || 'Cliente')}</Text>
          <Text style={{ color: C.textSecondary, fontSize: 14 }}>{isPickup ? o.restaurantAddress : (o.customerAddress || 'Dirección de Entrega')}</Text>

          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: isPickup ? C.accentSoft : C.greenSoft, padding: 14, borderRadius: 12, alignItems: 'center' }}
            onPress={function () { onOpenMap(o, isPickup ? 'restaurant' : 'customer'); }}
          >
            <Text style={{ color: isPickup ? C.accent : C.green, fontWeight: '700' }}>{'🗺️ ABRIR EN GOOGLE MAPS'}</Text>
          </TouchableOpacity>
        </View>

        {isPickup ? (
          <TouchableOpacity style={[s.loginBtn, { marginTop: 30 }]} onPress={function () { setStep('delivery'); }}>
            <Text style={s.loginBtnTxt}>{'CONFIRMAR RETIRO ✅'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.loginBtn, { marginTop: 30, backgroundColor: C.green }]} onPress={onComplete}>
            <Text style={s.loginBtnTxt}>{'ENTREGA COMPLETADA 🎉'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════
// MAP SCREEN
// ═══════════════════════════════════════
function MapScreen(props) {
  var o = props.order;
  var mapMode = props.mapMode;
  var onBack = props.onBack;

  var lat = mapMode === 'restaurant' ? o.restaurantLat : (o.customerLat || -33.4489);
  var lon = mapMode === 'restaurant' ? o.restaurantLon : (o.customerLon || -70.6693);
  return (
    <SafeAreaView style={s.root}>
      <TouchableOpacity onPress={onBack} style={{ padding: 20 }}>
        <Text style={{ color: C.accent, fontWeight: '600' }}>{'← Volver'}</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🗺️</Text>
        <Text style={{ color: C.white, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>Navegación GPS</Text>
        <Text style={{ color: C.textSecondary, textAlign: 'center', marginBottom: 30 }}>Se abrirá Google Maps con la ruta</Text>
        <TouchableOpacity style={s.loginBtn} onPress={function () { Linking.openURL('https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lon); }}>
          <Text style={s.loginBtnTxt}>ABRIR GOOGLE MAPS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════
// EARNINGS SCREEN
// ═══════════════════════════════════════
function EarningsScreen(props) {
  var driver = props.driver;
  var apiBase = props.apiBase;
  var onBack = props.onBack;

  var _a = useState(null), data = _a[0], setData = _a[1];
  var _b = useState(true), loading = _b[0], setLoading = _b[1];
  var _c = useState('week'), period = _c[0], setPeriod = _c[1];

  var loadEarnings = async function (p) {
    if (p === undefined) p = period;
    setLoading(true);
    try {
      var email = driver ? driver.email : '';
      var res = await fetch(apiBase + '/api/driver/earnings?email=' + encodeURIComponent(email) + '&period=' + p);
      var json = await res.json();
      if (res.ok) setData(json);
    } catch (e) {
      console.log('Earnings error:', e);
    }
    setLoading(false);
  };

  useEffect(function () { loadEarnings(); }, []);

  var changePeriod = function (p) {
    setPeriod(p);
    loadEarnings(p);
  };

  var summary = data ? data.summary : { totalDeliveries: 0, totalEarnings: 0, avgEarningPerTrip: 0 };
  var allTime = data ? data.allTime : { totalDeliveries: 0, totalEarnings: 0 };
  var trips = data ? data.trips : [];

  var getLevel = function (deliveries) {
    if (deliveries >= 100) return { name: 'Diamante', emoji: '💎', color: '#A855F7' };
    if (deliveries >= 50) return { name: 'Oro', emoji: '🥇', color: C.yellow };
    if (deliveries >= 20) return { name: 'Plata', emoji: '🥈', color: C.textSecondary };
    return { name: 'Bronce', emoji: '🥉', color: C.accent };
  };
  var level = getLevel(allTime.totalDeliveries);

  return (
    <SafeAreaView style={s.root}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, justifyContent: 'space-between', borderBottomWidth: 1, borderColor: C.cardBorder }}>
        <TouchableOpacity onPress={onBack}><Text style={{ color: C.accent, fontWeight: '600' }}>{'← Volver'}</Text></TouchableOpacity>
        <Text style={{ color: C.white, fontSize: 17, fontWeight: '800' }}>MIS GANANCIAS</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Level Badge */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>{level.emoji}</Text>
          <Text style={{ color: level.color, fontSize: 18, fontWeight: '800' }}>{'Repartidor ' + level.name}</Text>
          <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{allTime.totalDeliveries + ' viajes totales'}</Text>
        </View>

        {/* Period Toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: C.cardBorder }}>
          {[{ key: 'week', label: 'Semana' }, { key: 'month', label: 'Mes' }, { key: 'all', label: 'Todo' }].map(function (item) {
            var isActive = period === item.key;
            return (
              <TouchableOpacity key={item.key} onPress={function () { changePeriod(item.key); }}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: isActive ? C.accent : 'transparent', alignItems: 'center' }}>
                <Text style={{ color: isActive ? '#fff' : C.textMuted, fontWeight: '700', fontSize: 13 }}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 30 }} color={C.accent} />
        ) : (
          <View>
            {/* Stats Grid */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <View style={{ flex: 1, backgroundColor: C.greenSoft, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: C.green + '30' }}>
                <Text style={{ color: C.green, fontSize: 28, fontWeight: '900' }}>{'$' + summary.totalEarnings.toLocaleString()}</Text>
                <Text style={{ color: C.green, fontSize: 11, fontWeight: '700', marginTop: 4 }}>GANANCIA</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: C.blueSoft, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: C.blue + '30' }}>
                <Text style={{ color: C.blue, fontSize: 28, fontWeight: '900' }}>{summary.totalDeliveries}</Text>
                <Text style={{ color: C.blue, fontSize: 11, fontWeight: '700', marginTop: 4 }}>VIAJES</Text>
              </View>
            </View>

            <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder }}>
              <Text style={{ color: C.textSecondary, fontSize: 13 }}>Promedio por viaje</Text>
              <Text style={{ color: C.accent, fontSize: 20, fontWeight: '800' }}>{'$' + summary.avgEarningPerTrip.toLocaleString()}</Text>
            </View>

            {/* Total Historico */}
            <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center' }}>
              <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>GANANCIAS TOTALES HISTÓRICAS</Text>
              <Text style={{ color: C.yellow, fontSize: 34, fontWeight: '900', marginTop: 8 }}>{'$' + allTime.totalEarnings.toLocaleString()}</Text>
            </View>

            {/* Trip History */}
            <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>{'ÚLTIMOS VIAJES (' + trips.length + ')'}</Text>
            {trips.map(function (trip) {
              return (
                <View key={trip.id} style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.white, fontSize: 14, fontWeight: '700' }}>{trip.restaurantName}</Text>
                    <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{'Para: ' + trip.customerName + ' • ' + trip.itemCount + ' items'}</Text>
                    <Text style={{ color: C.textMuted, fontSize: 10, marginTop: 2 }}>{new Date(trip.deliveredAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: C.green, fontSize: 16, fontWeight: '800' }}>{'+ $' + trip.driverEarning.toLocaleString()}</Text>
                    <Text style={{ color: C.textMuted, fontSize: 10 }}>{'Total: $' + trip.orderTotal.toLocaleString()}</Text>
                  </View>
                </View>
              );
            })}
            {trips.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 30 }}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>📭</Text>
                <Text style={{ color: C.textSecondary, fontSize: 14, textAlign: 'center' }}>Sin viajes en este período</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
function InfoRow(props) {
  var label = props.label;
  var value = props.value;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: C.cardBorder }}>
      <Text style={{ color: C.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: C.textPrimary, fontSize: 13, fontWeight: '600' }}>{value || '—'}</Text>
    </View>
  );
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
var s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  label: { color: C.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: C.card, color: C.white, padding: 16, borderRadius: 12, marginBottom: 15, fontSize: 15, borderWidth: 1, borderColor: C.cardBorder },
  loginBtn: { backgroundColor: C.accent, padding: 18, borderRadius: 12, alignItems: 'center' },
  loginBtnTxt: { color: C.white, fontWeight: '800', fontSize: 15 },
  card: { backgroundColor: C.card, padding: 18, marginVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder },
});
