/* ══════════════════════════════════════════
   VehicleOS — app.js
   Pure frontend with dummy API placeholders
══════════════════════════════════════════ */

'use strict';

// ── STATE ──────────────────────────────────
const state = {
  user: null,
  vehicles: [],
  services: [],
};

// ── BACKEND API ────────────────────────────
const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'vehicle_service_auth_token';

axios.defaults.withCredentials = true;

function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    delete axios.defaults.headers.common.Authorization;
  }
}

setAuthToken(localStorage.getItem(AUTH_TOKEN_KEY));

function apiError(error, fallback) {
  return new Error(error.response?.data?.message || fallback);
}

function normalizeUser(user) {
  const parts = String(user.name || '').trim().split(/\s+/);
  return {
    id: user.id,
    firstName: parts[0] || 'User',
    lastName: parts.slice(1).join(' ') || '',
    email: user.email,
    phone: user.phone || '',
  };
}

function normalizeVehicle(vehicle) {
  return {
    id: vehicle.id,
    customerName: vehicle.customer_name,
    customerEmail: vehicle.customer_email,
    name: vehicle.name,
    model: vehicle.model,
    number: vehicle.number,
    type: vehicle.type,
    date: formatInputDate(vehicle.purchase_date),
  };
}

function normalizeService(service) {
  return {
    id: service.id,
    vehicleId: service.vehicle_id,
    type: service.service_type,
    customType: service.custom_service_type || '',
    cost: Number(service.cost),
    date: formatInputDate(service.date),
    notes: service.notes || '',
  };
}

function formatInputDate(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

const API = {
  async login(email, password) {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      setAuthToken(res.data.token);
      return normalizeUser(res.data.user);
    } catch (error) {
      throw apiError(error, 'Login failed');
    }
  },
  async register(data) {
    try {
      const name = `${data.firstName} ${data.lastName}`.trim();
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email: data.email,
        password: data.password,
      });
      setAuthToken(res.data.token);
      return normalizeUser(res.data.user);
    } catch (error) {
      throw apiError(error, 'Registration failed');
    }
  },
  async getMyVehicles() {
    try {
      const res = await axios.get(`${API_BASE_URL}/vehicles/my`);
      return res.data.vehicles.map(normalizeVehicle);
    } catch (error) {
      throw apiError(error, 'Failed to fetch vehicles');
    }
  },
  async getServicesForVehicle(vehicleId) {
    try {
      const res = await axios.get(`${API_BASE_URL}/services/${vehicleId}`);
      return res.data.services.map(normalizeService);
    } catch (error) {
      throw apiError(error, 'Failed to fetch services');
    }
  },
  async getAllServices(vehicles) {
    const serviceGroups = await Promise.allSettled(
      vehicles.map(vehicle => this.getServicesForVehicle(vehicle.id))
    );
    return serviceGroups
      .filter(group => group.status === 'fulfilled')
      .flatMap(group => group.value);
  },
  async addVehicle(vehicle) {
    try {
      const res = await axios.post(`${API_BASE_URL}/vehicles/add`, {
        customer_name: vehicle.customerName,
        customer_email: vehicle.customerEmail,
        name: vehicle.name,
        model: vehicle.model,
        number: vehicle.number,
        type: vehicle.type,
        purchase_date: vehicle.date,
      });
      return { ...vehicle, id: res.data.vehicleId };
    } catch (error) {
      throw apiError(error, 'Failed to add vehicle');
    }
  },
  async addService(service) {
    try {
      const res = await axios.post(`${API_BASE_URL}/services/add`, {
        vehicle_id: service.vehicleId,
        service_type: service.type,
        custom_service_type: service.customType || null,
        cost: service.cost,
        date: service.date,
        notes: service.notes,
      });
      return { ...service, id: res.data.serviceId };
    } catch (error) {
      throw apiError(error, 'Failed to save service');
    }
  },
  async deleteVehicle(id) {
    try {
      await axios.delete(`${API_BASE_URL}/vehicles/${id}`);
    } catch (error) {
      throw apiError(error, 'Failed to delete vehicle');
    }
    return true;
  },
  async logout() {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch {
      // Local logout should still clear the UI even if the server session already expired.
    } finally {
      setAuthToken(null);
    }
  },
  async updateProfile(data) {
    await delay(700);
    return data;
  },
};

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// ── AUTH HELPERS ───────────────────────────
function showCard(id) {
  document.querySelectorAll('.auth-card').forEach(c => c.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
  } else {
    inp.type = 'password';
    btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
  }
}

// ── VALIDATION ─────────────────────────────
function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function clearErrs(...ids) {
  ids.forEach(id => setErr(id, ''));
}
function markInput(inputId, err) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (err) inp.classList.add('error');
  else inp.classList.remove('error');
}

function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

// ── AUTH FORMS ─────────────────────────────
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  let valid = true;
  clearErrs('login-email-err', 'login-pw-err');

  if (!validateEmail(email)) { setErr('login-email-err', 'Enter a valid email'); markInput('login-email', true); valid = false; }
  else markInput('login-email', false);
  if (password.length < 1) { setErr('login-pw-err', 'Password is required'); markInput('login-password', true); valid = false; }
  else markInput('login-password', false);

  if (!valid) return;

  const btn = document.getElementById('login-btn');
  setLoading(btn, true);
  try {
    const user = await API.login(email, password);
    state.user = user;
    launchApp();
  } catch {
    setErr('login-pw-err', 'Login failed. Please try again.');
  } finally {
    setLoading(btn, false);
  }
});

document.getElementById('register-form').addEventListener('submit', async e => {
  e.preventDefault();
  const fname = document.getElementById('reg-fname').value.trim();
  const lname = document.getElementById('reg-lname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pw    = document.getElementById('reg-pw').value;
  const cpw   = document.getElementById('reg-cpw').value;
  let valid   = true;
  clearErrs('reg-fname-err','reg-lname-err','reg-email-err','reg-pw-err','reg-cpw-err');

  if (!fname)              { setErr('reg-fname-err', 'First name required'); valid = false; }
  if (!lname)              { setErr('reg-lname-err', 'Last name required'); valid = false; }
  if (!validateEmail(email)) { setErr('reg-email-err', 'Enter a valid email'); valid = false; }
  if (pw.length < 8)       { setErr('reg-pw-err', 'Minimum 8 characters'); valid = false; }
  if (pw !== cpw)          { setErr('reg-cpw-err', 'Passwords do not match'); valid = false; }
  if (!valid) return;

  const btn = document.getElementById('register-btn');
  setLoading(btn, true);
  try {
    const user = await API.register({ firstName: fname, lastName: lname, email, password: pw });
    state.user = user;
    launchApp();
  } catch {
    setErr('reg-email-err', 'Registration failed. Try again.');
  } finally {
    setLoading(btn, false);
  }
});

async function launchApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');
  try {
    await loadAppData();
  } catch (error) {
    showToast(error.message || 'Could not load account data', 'error');
  }
  initApp();
}

async function loadAppData() {
  state.vehicles = await API.getMyVehicles();
  state.services = await API.getAllServices(state.vehicles);
}

function seedDemoData() {
  const today = new Date();
  const fmt = d => d.toISOString().split('T')[0];

  state.vehicles = [
    { id: 1, customerName: 'Alex Mitchell', customerEmail: 'alex@example.com', name: 'Honda', model: 'Honda Civic 2021', number: 'ABC-1234', type: 'Sedan', date: '2021-03-15' },
    { id: 2, customerName: 'Sarah Jenkins', customerEmail: 'sarah.j@example.com', name: 'Toyota', model: 'Toyota Highlander 2020', number: 'XYZ-5678', type: 'SUV', date: '2020-07-22' },
  ];

  const d1 = new Date(today); d1.setMonth(d1.getMonth() - 1);
  const d2 = new Date(today); d2.setMonth(d2.getMonth() - 3);
  const d3 = new Date(today); d3.setMonth(d3.getMonth() - 5);

  state.services = [
    { id: 101, vehicleId: 1, type: 'Oil Change',        cost: 85,  date: fmt(d1), notes: 'Synthetic 5W-30' },
    { id: 102, vehicleId: 2, type: 'Tire Rotation',     cost: 55,  date: fmt(d2), notes: 'All four tires' },
    { id: 103, vehicleId: 1, type: 'Brake Inspection',  cost: 120, date: fmt(d3), notes: 'Front pads replaced' },
    { id: 104, vehicleId: 2, type: 'Battery Check',     cost: 30,  date: fmt(d3), notes: 'Battery good' },
  ];
}

// ── APP INIT ───────────────────────────────
function initApp() {
  const u = state.user;
  document.getElementById('avatar-initials').textContent = initials(u.firstName, u.lastName);
  setWelcome();
  updateVehicleSelects();
  renderDashboard();
  renderVehicles();
  renderServicesList();
  renderHistory();
  fillProfile();

  // Search by Email Listener
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderVehicles();
      renderHistory();
      
      // Auto-navigate to Vehicles if they search to show results easily, unless on history
      const activeNav = document.querySelector('.nav-item.active')?.dataset.page;
      if (searchInput.value.trim() && activeNav !== 'history' && activeNav !== 'vehicles') {
        navigate('vehicles');
      }
    });
  }

  // Nav links
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigate(link.dataset.page);
      closeSidebar();
    });
  });
}

function setWelcome() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('welcome-msg').textContent = `${greet}, ${state.user.firstName}!`;
}

function initials(f, l) { return ((f?.[0] || '') + (l?.[0] || '')).toUpperCase(); }

// ── NAVIGATION ─────────────────────────────
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
  const titles = { dashboard: 'Dashboard', vehicles: 'Vehicles', services: 'Services', history: 'History', profile: 'Profile' };
  document.getElementById('page-title').textContent = titles[page] || page;
  window.scrollTo(0, 0);
}

// ── SIDEBAR (MOBILE) ───────────────────────
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  sb.classList.toggle('open');
  ov.classList.toggle('visible');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}
window.toggleSidebar = toggleSidebar;
window.closeSidebar  = closeSidebar;

// ── LOADING STATE ──────────────────────────
function setLoading(btn, on) {
  const txt = btn.querySelector('.btn-text');
  const ldr = btn.querySelector('.btn-loader');
  if (!txt || !ldr) return;
  if (on) { txt.classList.add('hidden'); ldr.classList.remove('hidden'); btn.disabled = true; }
  else    { txt.classList.remove('hidden'); ldr.classList.add('hidden'); btn.disabled = false; }
}

// ── TOAST ──────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  const m = document.getElementById('toast-msg');
  const ic = t.querySelector('.toast-icon');
  m.textContent = msg;
  t.className = 'toast';
  if (type === 'error') { t.classList.add('error'); ic.className = 'fa-solid fa-circle-xmark toast-icon'; }
  else ic.className = 'fa-solid fa-circle-check toast-icon';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3500);
}

// ── MODALS ─────────────────────────────────
function showModal(id) {
  const m = document.getElementById(id);
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function hideModal(id) {
  const m = document.getElementById(id);
  m.classList.remove('open');
  document.body.style.overflow = '';
}
function closeModalOutside(e, id) {
  if (e.target === document.getElementById(id)) hideModal(id);
}
window.showModal = showModal;
window.hideModal = hideModal;
window.closeModalOutside = closeModalOutside;

// ── VEHICLE SELECTS ────────────────────────
function updateVehicleSelects(filterEmail = '', targetPrefix = null) {
  const selects = targetPrefix 
    ? [targetPrefix === 'inline' ? 'svc-vehicle-inline' : 'svc-vehicle']
    : ['svc-vehicle', 'svc-vehicle-inline', 'hist-filter-vehicle'];
    
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.value;
    // Keep first option
    while (el.options.length > 1) el.remove(1);
    
    let filteredVehicles = [];
    if (filterEmail) {
      const query = filterEmail.toLowerCase();
      filteredVehicles = state.vehicles.filter(v => v.customerEmail && v.customerEmail.toLowerCase().includes(query));
    } else if (id === 'hist-filter-vehicle') {
      // History filter dropdown should still show all vehicles by default
      filteredVehicles = state.vehicles;
    }

    filteredVehicles.forEach(v => {
      const o = new Option(`${v.customerName ? v.customerName + ' - ' : ''}${v.name} (${v.number})`, v.id);
      el.add(o);
    });
    el.value = prev;
  });
}

function filterServiceVehicles(type) {
  const inputId = type === 'inline' ? 'svc-email-inline' : 'svc-email';
  const val = document.getElementById(inputId).value.trim();
  updateVehicleSelects(val, type);
}
window.filterServiceVehicles = filterServiceVehicles;

// ── DASHBOARD ──────────────────────────────
function renderDashboard() {
  const total    = state.vehicles.length;
  const totalCost = state.services.reduce((s, x) => s + Number(x.cost), 0);
  const sorted   = [...state.services].sort((a,b) => b.date.localeCompare(a.date));
  const lastDate = sorted[0]?.date || '—';

  document.getElementById('stat-total-vehicles').textContent = total;
  document.getElementById('stat-upcoming').textContent       = Math.min(total * 1, 3);
  document.getElementById('stat-last-service').textContent   = lastDate !== '—' ? fmtDate(lastDate) : '—';
  document.getElementById('stat-total-cost').textContent     = `₹${totalCost.toLocaleString()}`;

  // Recent vehicles
  const vl = document.getElementById('dash-vehicles-list');
  if (!state.vehicles.length) {
    vl.innerHTML = '<div class="empty-state" style="padding:30px"><div class="empty-icon"><i class="fa-solid fa-car-side"></i></div><p>No vehicles yet</p></div>';
  } else {
    vl.innerHTML = state.vehicles.slice(0, 4).map(v => `
      <div class="dash-item">
        <div class="dash-item-icon bg-amber"><i class="${typeIcon(v.type)}"></i></div>
        <div class="dash-item-info">
          <div class="dash-item-name">${esc(v.customerName || v.name)}</div>
          <div class="dash-item-sub">${esc(v.name)} - ${esc(v.model)}</div>
        </div>
        <div class="dash-item-meta">${esc(v.number)}</div>
      </div>`).join('');
  }

  // Recent services
  const sl = document.getElementById('dash-services-list');
  if (!state.services.length) {
    sl.innerHTML = '<div class="empty-state" style="padding:30px"><div class="empty-icon"><i class="fa-solid fa-wrench"></i></div><p>No services logged</p></div>';
  } else {
    sl.innerHTML = sorted.slice(0, 4).map(s => {
      const v = state.vehicles.find(x => x.id == s.vehicleId);
      return `
        <div class="dash-item">
          <div class="dash-item-icon bg-sky"><i class="fa-solid fa-wrench"></i></div>
          <div class="dash-item-info">
            <div class="dash-item-name">${esc(s.type)}</div>
            <div class="dash-item-sub">${v ? esc(v.customerName || v.name) + ' (' + esc(v.number) + ')' : 'Unknown'}</div>
          </div>
          <div class="dash-item-meta">
            <div>₹${Number(s.cost).toFixed(0)}</div>
            <div style="font-size:0.72rem;margin-top:2px">${fmtDate(s.date)}</div>
          </div>
        </div>`;
    }).join('');
  }

  // Profile stats
  document.getElementById('pstat-v').textContent  = total;
  document.getElementById('pstat-s').textContent  = state.services.length;
  document.getElementById('pstat-c').textContent  = `₹${totalCost.toLocaleString()}`;
}

// ── VEHICLES ───────────────────────────────
function renderVehicles() {
  const grid  = document.getElementById('vehicles-grid');
  const empty = document.getElementById('vehicles-empty');
  
  const searchInput = document.getElementById('global-search');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let data = state.vehicles;
  if (query) {
    data = data.filter(v => 
      (v.customerEmail && v.customerEmail.toLowerCase().includes(query)) ||
      (v.customerName && v.customerName.toLowerCase().includes(query))
    );
  }

  if (!data.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  grid.innerHTML = data.map(v => vehicleCard(v)).join('');
}

function vehicleCard(v) {
  const typeClass = 'vc-banner-' + v.type.toLowerCase().replace(/\s+/g,'-');
  const icon = typeIcon(v.type);
  const svcCount = state.services.filter(s => s.vehicleId == v.id).length;
  const lastSvc  = [...state.services].filter(s => s.vehicleId == v.id).sort((a,b) => b.date.localeCompare(a.date))[0];
  return `
    <div class="vehicle-card" id="vc-${v.id}">
      <div class="vehicle-card-banner ${typeClass}">
        <i class="${icon}"></i>
        <span class="vehicle-plate-badge">${esc(v.number)}</span>
      </div>
      <div class="vehicle-card-body">
        <div class="vehicle-card-name">${esc(v.customerName || v.name)}</div>
        <div class="vehicle-card-model" style="color:var(--text-faint); margin-bottom: 8px;">
          ${v.customerEmail ? `<i class="fa-solid fa-envelope" style="font-size:0.7em;"></i> ${esc(v.customerEmail)}` : 'No Email Provided'}
        </div>
        <div class="vehicle-card-model"><strong>Vehicle:</strong> ${esc(v.name)} - ${esc(v.model)}</div>
        <div class="vehicle-card-meta">
          <span class="vm-tag"><i class="fa-solid fa-layer-group"></i>${esc(v.type)}</span>
          <span class="vm-tag"><i class="fa-solid fa-wrench"></i>${svcCount} service${svcCount !== 1 ? 's' : ''}</span>
          ${lastSvc ? `<span class="vm-tag"><i class="fa-regular fa-clock"></i>${fmtDate(lastSvc.date)}</span>` : ''}
        </div>
        <div class="vehicle-card-actions">
          <button class="vc-action-btn" onclick="openServiceForVehicle(${v.id})"><i class="fa-solid fa-plus"></i> Service</button>
          <button class="vc-action-btn" onclick="filterHistoryByVehicle(${v.id})"><i class="fa-solid fa-clock-rotate-left"></i> History</button>
          <button class="vc-action-btn danger" onclick="deleteVehicle(${v.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`;
}

function openServiceForVehicle(id) {
  const v = state.vehicles.find(x => x.id == id);
  if (v && v.customerEmail) {
    document.getElementById('svc-email').value = v.customerEmail;
    filterServiceVehicles('modal');
  } else {
    document.getElementById('svc-email').value = '';
    filterServiceVehicles('modal');
  }
  document.getElementById('svc-vehicle').value = id;
  showModal('add-service-modal');
}
function filterHistoryByVehicle(id) {
  document.getElementById('hist-filter-vehicle').value = id;
  navigate('history');
  renderHistory();
}
window.openServiceForVehicle  = openServiceForVehicle;
window.filterHistoryByVehicle = filterHistoryByVehicle;

document.getElementById('add-vehicle-form').addEventListener('submit', async e => {
  e.preventDefault();
  const customerName = document.getElementById('v-customer-name').value.trim();
  const customerEmail = document.getElementById('v-customer-email').value.trim();
  const name   = document.getElementById('v-name').value.trim();
  const model  = document.getElementById('v-model').value.trim();
  const number = document.getElementById('v-number').value.trim();
  const type   = document.getElementById('v-type').value;
  const date   = document.getElementById('v-date').value;
  let valid    = true;
  clearErrs('v-customer-name-err','v-name-err','v-model-err','v-number-err','v-type-err');

  if (!customerName) { setErr('v-customer-name-err', 'Customer name required'); valid = false; }
  if (!name)   { setErr('v-name-err',   'Vehicle name required'); valid = false; }
  if (!model)  { setErr('v-model-err',  'Model required');        valid = false; }
  if (!number) { setErr('v-number-err', 'Plate number required'); valid = false; }
  if (!type)   { setErr('v-type-err',   'Select a vehicle type'); valid = false; }
  if (!valid) return;

  const btn = e.submitter;
  setLoading(btn, true);
  try {
    const v = await API.addVehicle({ customerName, customerEmail, name, model, number, type, date });
    state.vehicles.push(v);
    e.target.reset();
    hideModal('add-vehicle-modal');
    renderVehicles();
    renderDashboard();
    updateVehicleSelects();
    showToast(`"${v.name}" added successfully!`);
  } catch {
    showToast('Failed to add vehicle', 'error');
  } finally {
    setLoading(btn, false);
  }
});

async function deleteVehicle(id) {
  if (!confirm('Remove this vehicle? This will also delete its service records.')) return;
  try {
    await API.deleteVehicle(id);
    state.vehicles  = state.vehicles.filter(v => v.id !== id);
    state.services  = state.services.filter(s => s.vehicleId !== id);
    renderVehicles();
    renderDashboard();
    renderServicesList();
    renderHistory();
    updateVehicleSelects();
    showToast('Vehicle removed');
  } catch (error) {
    showToast(error.message || 'Failed to delete vehicle', 'error');
  }
}
window.deleteVehicle = deleteVehicle;

// ── SERVICE FORMS ──────────────────────────
// Toggle custom service type input based on selection
function toggleCustomServiceType() {
  const type = document.getElementById('svc-type').value;
  const customWrap = document.getElementById('custom-svc-type-wrap');
  const customInput = document.getElementById('svc-custom-type');
  if (type === 'Other') {
    customWrap.classList.remove('hidden');
    customInput.setAttribute('required', '');
  } else {
    customWrap.classList.add('hidden');
    customInput.removeAttribute('required');
  }
}

function toggleCustomServiceTypeInline() {
  const type = document.getElementById('svc-type-inline').value;
  const customWrap = document.getElementById('custom-svc-type-inline-wrap');
  const customInput = document.getElementById('svc-custom-type-inline');
  if (type === 'Other') {
    customWrap.classList.remove('hidden');
    customInput.setAttribute('required', '');
  } else {
    customWrap.classList.add('hidden');
    customInput.removeAttribute('required');
  }
}

window.toggleCustomServiceType = toggleCustomServiceType;
window.toggleCustomServiceTypeInline = toggleCustomServiceTypeInline;

async function saveService(vehicleId, type, customType, cost, date, notes, btn) {
  if (!vehicleId) return false;
  const v = state.vehicles.find(x => x.id == vehicleId);
  setLoading(btn, true);
  try {
    const s = await API.addService({ vehicleId: Number(vehicleId), type, customType, cost: parseFloat(cost), date, notes });
    state.services.push(s);
    renderDashboard();
    renderServicesList();
    renderHistory();
    renderVehicles();
    showToast(`Service "${type}" logged for ${v?.name || 'vehicle'}`);
    return true;
  } catch {
    showToast('Failed to save service', 'error');
    return false;
  } finally {
    setLoading(btn, false);
  }
}

// Modal form
document.getElementById('add-service-form').addEventListener('submit', async e => {
  e.preventDefault();
  const vid   = document.getElementById('svc-vehicle').value;
  const type  = document.getElementById('svc-type').value;
  const customType = document.getElementById('svc-custom-type').value.trim();
  const cost  = document.getElementById('svc-cost').value;
  const date  = document.getElementById('svc-date').value;
  const notes = document.getElementById('svc-notes').value.trim();
  let valid   = true;
  clearErrs('svc-v-err','svc-t-err','svc-ct-err','svc-c-err','svc-d-err');

  if (!vid)  { setErr('svc-v-err', 'Select a vehicle');    valid = false; }
  if (!type) { setErr('svc-t-err', 'Select service type'); valid = false; }
  if (type === 'Other' && !customType) { setErr('svc-ct-err', 'Enter custom service type'); valid = false; }
  if (!cost || cost < 0) { setErr('svc-c-err', 'Enter valid cost'); valid = false; }
  if (!date) { setErr('svc-d-err', 'Select a date');       valid = false; }
  if (!valid) return;

  const ok = await saveService(vid, type, customType, cost, date, notes, e.submitter);
  if (ok) { e.target.reset(); hideModal('add-service-modal'); }
});

// Inline form on Services page
document.getElementById('inline-service-form').addEventListener('submit', async e => {
  e.preventDefault();
  const vid   = document.getElementById('svc-vehicle-inline').value;
  const type  = document.getElementById('svc-type-inline').value;
  const customType = document.getElementById('svc-custom-type-inline').value.trim();
  const cost  = document.getElementById('svc-cost-inline').value;
  const date  = document.getElementById('svc-date-inline').value;
  const notes = document.getElementById('svc-notes-inline').value.trim();
  let valid   = true;
  clearErrs('svc-v-err-inline','svc-t-err-inline','svc-ct-err-inline','svc-c-err-inline','svc-d-err-inline');

  if (!vid)  { setErr('svc-v-err-inline', 'Select a vehicle');    valid = false; }
  if (!type) { setErr('svc-t-err-inline', 'Select service type'); valid = false; }
  if (type === 'Other' && !customType) { setErr('svc-ct-err-inline', 'Enter custom service type'); valid = false; }
  if (!cost || cost < 0) { setErr('svc-c-err-inline', 'Enter valid cost'); valid = false; }
  if (!date) { setErr('svc-d-err-inline', 'Select a date');       valid = false; }
  if (!valid) return;

  const ok = await saveService(vid, type, customType, cost, date, notes, e.submitter);
  if (ok) e.target.reset();
});

// ── SERVICES LIST ──────────────────────────
function renderServicesList() {
  const list  = document.getElementById('services-recent-list');
  const empty = document.getElementById('services-empty');
  const sorted = [...state.services].sort((a,b) => b.date.localeCompare(a.date));
  if (!sorted.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = sorted.slice(0, 10).map(s => {
    const v = state.vehicles.find(x => x.id == s.vehicleId);
    return `
      <div class="svc-log-item">
        <div class="svc-log-icon"><i class="fa-solid fa-wrench"></i></div>
        <div class="svc-log-info">
          <div class="svc-log-type">${esc(s.type)}</div>
          <div class="svc-log-vehicle"><i class="fa-solid fa-user" style="font-size:0.7rem;margin-right:4px"></i>${v ? esc(v.customerName || v.name) + ' | ' + esc(v.number) : 'Unknown'}</div>
          ${s.notes ? `<div style="font-size:0.75rem;color:var(--text-faint);margin-top:3px">${esc(s.notes)}</div>` : ''}
        </div>
        <div class="svc-log-meta">
          <div class="svc-log-cost">₹${Number(s.cost).toFixed(2)}</div>
          <div class="svc-log-date">${fmtDate(s.date)}</div>
        </div>
      </div>`;
  }).join('');
}

// ── HISTORY ────────────────────────────────
function renderHistory() {
  const filterVid  = document.getElementById('hist-filter-vehicle').value;
  const filterFrom = document.getElementById('hist-filter-from').value;
  const filterTo   = document.getElementById('hist-filter-to').value;
  const filterEmail = document.getElementById('hist-filter-email').value.trim().toLowerCase();
  const tbody      = document.getElementById('history-tbody');
  const empty      = document.getElementById('history-empty');
  const tableWrap  = document.getElementById('history-table-wrap');

  const searchInput = document.getElementById('global-search');
  const query       = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let data = [...state.services].sort((a,b) => b.date.localeCompare(a.date));
  if (filterVid)  data = data.filter(s => s.vehicleId == filterVid);
  if (filterFrom) data = data.filter(s => s.date >= filterFrom);
  if (filterTo)   data = data.filter(s => s.date <= filterTo);

  if (query || filterEmail) {
    const activeQuery = query || filterEmail;
    data = data.filter(s => {
      const v = state.vehicles.find(x => x.id == s.vehicleId);
      if (!v) return false;
      return (v.customerEmail && v.customerEmail.toLowerCase().includes(activeQuery)) ||
             (v.customerName && v.customerName.toLowerCase().includes(activeQuery));
    });
  }

  if (!data.length) {
    tableWrap.style.display = 'none';
    empty.classList.remove('hidden');
    return;
  }
  tableWrap.style.display = '';
  empty.classList.add('hidden');

  // Find latest per vehicle
  const latestIds = new Set();
  const seen = {};
  [...state.services].sort((a,b) => b.date.localeCompare(a.date)).forEach(s => {
    if (!seen[s.vehicleId]) { seen[s.vehicleId] = true; latestIds.add(s.id); }
  });

  tbody.innerHTML = data.map(s => {
    const v = state.vehicles.find(x => x.id == s.vehicleId);
    const isLatest = latestIds.has(s.id);
    return `
      <tr class="${isLatest ? 'latest-service' : ''}">
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:0.75rem" class="bg-amber">
              <i class="${typeIcon(v?.type || 'other')}"></i>
            </div>
            <div>
              <div style="font-weight:500">${v ? esc(v.customerName || v.name) : '<em style="color:var(--text-faint)">Deleted</em>'}</div>
              ${v ? `<div style="font-size:0.75rem;color:var(--text-muted)">${v.customerEmail ? esc(v.customerEmail) + ' • ' : ''}${esc(v.name)} - ${esc(v.number)}</div>` : ''}
            </div>
          </div>
        </td>
        <td><span class="svc-badge"><i class="fa-solid fa-wrench" style="color:var(--amber);font-size:0.75rem"></i>${esc(s.type)}</span></td>
        <td>${fmtDate(s.date)}</td>
        <td class="cost-cell">₹${Number(s.cost).toFixed(2)}</td>
        <td style="color:var(--text-muted);font-size:0.82rem;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.notes) || '—'}</td>
        <td>${isLatest ? '<span class="latest-tag"><i class="fa-solid fa-star"></i> Latest</span>' : '<span style="font-size:0.78rem;color:var(--text-faint)">—</span>'}</td>
      </tr>`;
  }).join('');
}

function clearHistoryFilters() {
  document.getElementById('hist-filter-vehicle').value = '';
  document.getElementById('hist-filter-from').value    = '';
  document.getElementById('hist-filter-to').value      = '';
  if (document.getElementById('hist-filter-email')) {
    document.getElementById('hist-filter-email').value = '';
  }
  renderHistory();
}
window.clearHistoryFilters = clearHistoryFilters;
window.renderHistory       = renderHistory;

// ── PROFILE ────────────────────────────────
function fillProfile() {
  const u = state.user;
  document.getElementById('profile-avatar-display').textContent  = initials(u.firstName, u.lastName);
  document.getElementById('profile-name-display').textContent    = `${u.firstName} ${u.lastName}`;
  document.getElementById('profile-email-display').textContent   = u.email;
  document.getElementById('prof-fname').value  = u.firstName;
  document.getElementById('prof-lname').value  = u.lastName;
  document.getElementById('prof-email').value  = u.email;
  document.getElementById('prof-phone').value  = u.phone || '';
}

document.getElementById('profile-info-form').addEventListener('submit', async e => {
  e.preventDefault();
  const fname = document.getElementById('prof-fname').value.trim();
  const lname = document.getElementById('prof-lname').value.trim();
  const email = document.getElementById('prof-email').value.trim();
  const phone = document.getElementById('prof-phone').value.trim();

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    const u = await API.updateProfile({ ...state.user, firstName: fname, lastName: lname, email, phone });
    state.user = u;
    fillProfile();
    document.getElementById('avatar-initials').textContent = initials(fname, lname);
    setWelcome();
    showToast('Profile updated!');
  } catch {
    showToast('Update failed', 'error');
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('profile-pw-form').addEventListener('submit', async e => {
  e.preventDefault();
  await delay(600);
  showToast('Password updated!');
  e.target.reset();
});

// ── LOGOUT ─────────────────────────────────
async function logout() {
  if (!confirm('Sign out?')) return;
  await API.logout();
  state.user = null; state.vehicles = []; state.services = [];
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').style.display = '';
  showCard('login-card');
  document.getElementById('login-form').reset();
}
window.logout = logout;

// ── HELPERS ────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(str) {
  if (!str || str === '—') return str || '—';
  try {
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return str; }
}

function typeIcon(type) {
  const map = {
    'Sedan':      'fa-solid fa-car',
    'SUV':        'fa-solid fa-truck-monster',
    'Truck':      'fa-solid fa-truck-pickup',
    'Van':        'fa-solid fa-van-shuttle',
    'Motorcycle': 'fa-solid fa-motorcycle',
    'Electric':   'fa-solid fa-bolt',
    'Other':      'fa-solid fa-car-side',
  };
  return map[type] || 'fa-solid fa-car';
}

// ── DEFAULT DATE FOR SERVICE FORMS ─────────
(function setTodayDates() {
  const today = new Date().toISOString().split('T')[0];
  ['svc-date','svc-date-inline'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
})();

// ── EXPOSE GLOBAL HELPERS ──────────────────
window.showCard  = showCard;
window.togglePw  = togglePw;
window.navigate  = navigate;
