const bf = document.getElementById('bookingForm');
const serviceEl = document.getElementById('service');
const qs = new URLSearchParams(location.search);

if (qs.get('service') && serviceEl) {
  serviceEl.value = qs.get('service');
}

async function getQuote(data) {
  const r = await fetch(API + '/deliveries/quote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      size: data.petSize,
      service: data.service,
      distanceMiles: Number(data.distanceMiles || 0)
    })
  });

  const result = await r.json();

  if (!r.ok) {
    throw new Error(result.message || 'Unable to calculate quote');
  }

  return result;
}

if (bf) {
  bf.addEventListener('submit', async e => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(bf));

    try {
      // Check that the customer is logged in
      if (!token()) {
        throw new Error('Please log in before creating a booking.');
      }

      // Calculate price
      const quote = await getQuote(data);

      // Convert form fields into the structure expected by Delivery.js
      const booking = {
        pet: {
          name: data.petName,
          type: data.petType,
          size: data.petSize,
          notes: data.petNotes || ''
        },

        service: data.service,

        pickupAddress: data.pickupAddress,
        destinationAddress: data.destinationAddress,

        scheduledAt: data.scheduledAt || null,

        paymentMethod: data.paymentMethod,

        phone: data.phone || '',

        amount: Number(quote.total || 0),

        distanceMiles: Number(data.distanceMiles || 0)
      };

     
const r = await fetch(API + '/admin/deliveries', {
  method: 'POST',
  headers: headers(),
  body: JSON.stringify(booking)
});


      const j = await r.json();

      if (!r.ok) {
        throw new Error(j.message || 'Unable to create booking');
      }

      const n = document.getElementById('bookingNotice');

      n.innerHTML = `
        <strong>Delivery created successfully!</strong>
        <br>
        Tracking ID:
        <strong>${j.trackingId}</strong>
        <br>
        Estimated total:
        <strong>$${Number(j.amount || quote.total || 0).toFixed(2)}</strong>
        <br><br>
        <a class="btn btn-primary" href="/tracking.html?id=${encodeURIComponent(j.trackingId)}">
          Track Your Pet →
        </a>
      `;

      n.style.display = 'block';

      bf.reset();

      toast('Booking created successfully');

    } catch (err) {
      console.error('Booking error:', err);

      const n = document.getElementById('bookingNotice');

      if (n) {
        n.textContent = err.message || 'Unable to create booking';
        n.style.display = 'block';
      }

      toast(err.message || 'Unable to create booking');
    }
  });
}