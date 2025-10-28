document.addEventListener('DOMContentLoaded', () => {

  // ===== FRONT PAGE LOGIC =====
  const frontPage = document.getElementById('frontPage');
  const enterBookingBtn = document.getElementById('enterBooking');

  if (enterBookingBtn && frontPage) {
    enterBookingBtn.addEventListener('click', () => {
      // Fade out animation
      frontPage.style.opacity = '0';
      setTimeout(() => {
        frontPage.style.display = 'none';
        document.querySelector('.app').style.display = 'block';
      }, 600);
    });
  }

  // ===== EXISTING BOOKING SYSTEM =====

  // Basic elements
  const steps = Array.from(document.querySelectorAll('.step'));
  const panels = Array.from(document.querySelectorAll('.panel'));
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const curStepText = document.getElementById('curStep');

  // Booking elements
  const bookBtn = document.getElementById('bookBtn');
  const bookingForm = document.getElementById('bookingForm');
  const searchFlightsBtn = document.getElementById('searchFlights');
  const fromInput = document.getElementById('from');
  const toInput = document.getElementById('to');
  const departDate = document.getElementById('departDate');
  const returnDate = document.getElementById('returnDate');
  const passengersSelect = document.getElementById('passengers');
  const tripRadios = Array.from(document.querySelectorAll('input[name="tripType"]'));
  const returnWrap = document.getElementById('returnWrap');

  // Flights elements
  const departFlightsEl = document.getElementById('departFlights');
  const returnFlightsEl = document.getElementById('returnFlights');
  const returnListWrap = document.getElementById('returnList');
  const promoInput = document.getElementById('promoCode');
  const applyPromo = document.getElementById('applyPromo');
  const totalPriceEl = document.getElementById('totalPrice');
  const promoDesc = document.getElementById('promoDesc');

  // Passengers & summary
  const passengersContainer = document.getElementById('passengersContainer');
  const savePassengersBtn = document.getElementById('savePassengers');
  const summaryEl = document.getElementById('summary');
  const bookNowBtn = document.getElementById('bookNow');

  if (!steps.length || !panels.length || !prevBtn || !nextBtn || !curStepText) return;

  let current = 0;

  const state = {
    tripType: 'round',
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    passengers: 1,
    departOptions: [],
    returnOptions: [],
    selectedDepart: null,
    selectedReturn: null,
    passengerData: [],
    discount: 0,
    promoName: ''
  };

  // Flight templates
  const departTemplates = [
    { flightNo: 'SP102', time: '08:20', duration: '3h', price: 2000, seats: 25, type: 'Economy', terminal: 'A' },
    { flightNo: 'SP205', time: '11:00', duration: '3.5h', price: 3500, seats: 15, type: 'Premium Economy', terminal: 'B' },
    { flightNo: 'SP308', time: '15:00', duration: '3h', price: 5000, seats: 8, type: 'Business', terminal: 'C' },
    { flightNo: 'SP410', time: '18:00', duration: '3h', price: 7000, seats: 5, type: 'First Class', terminal: 'D' }
  ];
  const returnTemplates = [
    { flightNo: 'SP511', time: '09:00', duration: '3h', price: 2000, seats: 25, type: 'Economy', terminal: 'A' },
    { flightNo: 'SP612', time: '12:00', duration: '3.5h', price: 3500, seats: 15, type: 'Premium Economy', terminal: 'B' },
    { flightNo: 'SP713', time: '16:00', duration: '3h', price: 5000, seats: 8, type: 'Business', terminal: 'C' },
    { flightNo: 'SP814', time: '19:00', duration: '3h', price: 7000, seats: 5, type: 'First Class', terminal: 'D' }
  ];

  // Step navigation
  function showStep(i) {
    current = i;
    steps.forEach((s, idx) => s.classList.toggle('active', idx === i));
    panels.forEach((p, idx) => p.hidden = idx !== i);
    prevBtn.disabled = i === 0;
    nextBtn.textContent = i === panels.length - 1 ? 'Finish' : 'Next';
    curStepText.textContent = i + 1;
  }
  showStep(0);

  if (bookBtn) bookBtn.addEventListener('click', () => showStep(1));
  if (prevBtn) prevBtn.addEventListener('click', () => { if (current > 0) showStep(current - 1); });

  nextBtn.addEventListener('click', () => {
    if (current === 0) return showStep(1);

    if (current === 1) {
      const from = fromInput.value.trim();
      const to = toInput.value.trim();
      const dep = departDate.value;
      const ret = returnDate.value;
      const passengers = parseInt(passengersSelect.value, 10);

      if (!from || !to || !dep) return alert('Please fill From, To and Departure date');
      if (state.tripType === 'round' && !ret) return alert('Please fill Return date for round trip');
      if (state.tripType === 'round' && ret < dep) return alert('Return date must be same or after departure');

      state.from = from;
      state.to = to;
      state.departDate = dep;
      state.returnDate = ret;
      state.passengers = passengers;

      buildFlightOptions();
      return showStep(2);
    }

    if (current === 2) {
      if (!state.selectedDepart) return alert('Please select a departing flight');
      if (state.tripType === 'round' && !state.selectedReturn) return alert('Please select a return flight');
      buildPassengerForms();
      return showStep(3);
    }

    if (current === 3) {
      if (state.passengerData.length !== state.passengers) return alert('Please save passenger details');
      buildSummary();
      return showStep(4);
    }

    if (current === 4) {
      alert('Booking completed! (demo)');
      resetApp();
    }
  });

  // Trip type radio
  tripRadios.forEach(r => r.addEventListener('change', ev => {
    state.tripType = ev.target.value;
    returnWrap.style.display = state.tripType === 'oneway' ? 'none' : '';
  }));

  // Search flights
  if (searchFlightsBtn) {
    searchFlightsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      nextBtn.click();
    });
  }

  // Build flight options
  function buildFlightOptions() {
    departFlightsEl.innerHTML = '';
    returnFlightsEl.innerHTML = '';

    state.departOptions = departTemplates.map(t => ({ ...t, date: state.departDate, from: state.from, to: state.to }));
    state.returnOptions = state.tripType === 'round'
      ? returnTemplates.map(t => ({ ...t, date: state.returnDate, from: state.to, to: state.from }))
      : [];

    renderFlights();
  }

  function renderFlights() {
    departFlightsEl.innerHTML = '';
    state.departOptions.forEach((f, idx) => departFlightsEl.appendChild(createFlightCard(f, 'depart', idx)));

    if (state.tripType === 'round') {
      returnListWrap.style.display = '';
      returnFlightsEl.innerHTML = '';
      state.returnOptions.forEach((f, idx) => returnFlightsEl.appendChild(createFlightCard(f, 'return', idx)));
    } else {
      returnListWrap.style.display = 'none';
    }
    updateTotalDisplay();
  }

  function createFlightCard(f, kind, idx) {
    const el = document.createElement('div');
    el.className = 'flight-card';
    el.innerHTML = `
      <div>
        <h3>${escapeHtml(f.type)}</h3>
        <p>${escapeHtml(f.from)} → ${escapeHtml(f.to)}</p>
        <p>${escapeHtml(f.time)} • ${escapeHtml(f.duration)}</p>
        <p>Flight No: ${escapeHtml(f.flightNo)}</p>
        <p>Terminal: ${escapeHtml(f.terminal)}</p>
        <p>Seats Available: ${escapeHtml(String(f.seats))}</p>
        <p class="price">₱${Number(f.price).toLocaleString()}</p>
        <button class="select-btn">Select</button>
      </div>
    `;
    el.querySelector('.select-btn').addEventListener('click', () => {
      if (kind === 'depart') {
        state.selectedDepart = f;
        markSelected(departFlightsEl, idx);
      } else {
        state.selectedReturn = f;
        markSelected(returnFlightsEl, idx);
      }
      updateTotalDisplay();
    });
    return el;
  }

  function markSelected(listEl, idx) {
    Array.from(listEl.children).forEach((child, i) => child.classList.toggle('selected', i === idx));
  }

  // Promo logic
  if (applyPromo) {
    applyPromo.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      const promos = { SKY10: 0.10, VIP20: 0.20, FIRST30: 0.30 };
      if (promos[code]) {
        state.discount = promos[code];
        promoDesc.textContent = `Promo Applied: ${Math.round(state.discount * 100)}% OFF (${code})`;
      } else {
        state.discount = 0;
        promoDesc.textContent = 'Invalid promo code';
      }
      updateTotalDisplay();
    });
  }

  function updateTotalDisplay() {
    let base = 0;
    if (state.selectedDepart) base += Number(state.selectedDepart.price) || 0;
    if (state.tripType === 'round' && state.selectedReturn) base += Number(state.selectedReturn.price) || 0;
    const total = base * state.passengers * (1 - (state.discount || 0));
    totalPriceEl.textContent = `₱${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  // Passenger form builder
  function buildPassengerForms() {
    passengersContainer.innerHTML = '';
    state.passengerData = [];
    for (let i = 0; i < state.passengers; i++) {
      const box = document.createElement('div');
      box.className = 'passenger-box';
      box.innerHTML = `
        <div style="font-weight:700;margin-bottom:8px">Passenger ${i + 1}</div>
        <div class="passenger-grid">
          <label>Full name<input type="text" class="p-name" required></label>
          <label>Date of Birth<input type="date" class="p-dob" required></label>
          <label>Passport No<input type="text" class="p-pass" required></label>
          <label>Email<input type="email" class="p-email" required></label>
        </div>
      `;
      passengersContainer.appendChild(box);
    }
  }

  savePassengersBtn.addEventListener('click', () => {
    const names = Array.from(document.querySelectorAll('.p-name')).map(i => i.value.trim());
    const dobs = Array.from(document.querySelectorAll('.p-dob')).map(i => i.value);
    const passes = Array.from(document.querySelectorAll('.p-pass')).map(i => i.value.trim());
    const emails = Array.from(document.querySelectorAll('.p-email')).map(i => i.value.trim());

    for (let i = 0; i < names.length; i++) {
      if (!names[i] || !dobs[i] || !passes[i] || !emails[i]) return alert(`Please complete details for passenger ${i + 1}`);
    }

    state.passengerData = names.map((n, idx) => ({
      name: n, dob: dobs[idx], passport: passes[idx], email: emails[idx]
    }));

    alert('Passenger details saved.');
  });

  function buildSummary() {
    summaryEl.innerHTML = '';
    const d = state.selectedDepart, r = state.selectedReturn;
    let perPax = (d ? d.price : 0) + ((state.tripType === 'round' && r) ? r.price : 0);
    let total = perPax * state.passengers;
    let discount = total * (state.discount || 0);
    let final = total - discount;

    summaryEl.innerHTML += `<div class="summary-row"><div>From</div><div>${state.from}</div></div>`;
    summaryEl.innerHTML += `<div class="summary-row"><div>To</div><div>${state.to}</div></div>`;
    summaryEl.innerHTML += `<div class="summary-row"><div>Passengers</div><div>${state.passengers}</div></div>`;
    summaryEl.innerHTML += `<div class="summary-row"><div>Base Total</div><div>₱${total.toLocaleString()}</div></div>`;
    summaryEl.innerHTML += `<div class="summary-row"><div>Discount</div><div>₱${discount.toLocaleString()}</div></div>`;
    summaryEl.innerHTML += `<div class="summary-row"><div>Final Total</div><div>₱${final.toLocaleString()}</div></div>`;
  }

  bookNowBtn.addEventListener('click', () => {
    alert('Booking successful! (Demo)');
    resetApp();
  });

  function resetApp() {
    state.selectedDepart = null;
    state.selectedReturn = null;
    state.passengerData = [];
    state.discount = 0;
    promoInput.value = '';
    promoDesc.textContent = '';
    totalPriceEl.textContent = '₱0.00';
    showStep(0);
  }

  function escapeHtml(str) {
    return str?.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m])) || '';
  }

});
