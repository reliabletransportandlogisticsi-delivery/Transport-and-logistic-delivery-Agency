/*
 * Transport and Pet Delivery Solution — Admin page
 * Requires public/js/app.js to load first.
 */

const adminUser = JSON.parse(localStorage.getItem('pawgoUser') || 'null');

if (!token() || adminUser?.role !== 'admin') {
  window.location.href = '/login.html';
}

// ============================================================
// PAGE ELEMENTS
// ============================================================

const form = document.getElementById('adminBookingForm');
const customerSelect = document.getElementById('customerId');
const customerNameInput = document.getElementById('customerNameInput');
const customerNameList = document.getElementById('customerNameList');

const customerType = document.getElementById('customerType');
const existingCustomerFields = document.getElementById('existingCustomerFields');
const newCustomerFields = document.getElementById('newCustomerFields');
const newCustomerName = document.getElementById('newCustomerName');
const newCustomerEmail = document.getElementById('newCustomerEmail');
const customerPhone = document.getElementById('adminPhone');

const quoteDisplay = document.getElementById('adminQuote');
const notice = document.getElementById('adminBookingNotice');

// ============================================================
// SHOW EXISTING OR NEW CUSTOMER FIELDS
// ============================================================

function updateCustomerFields() {
  if (!customerType) return;

  const isNewCustomer = customerType.value === 'new';

  if (existingCustomerFields) {
    existingCustomerFields.hidden = isNewCustomer;
  }

  if (newCustomerFields) {
    newCustomerFields.hidden = !isNewCustomer;
  }

  if (customerNameInput) {
    customerNameInput.required = !isNewCustomer;
    customerNameInput.disabled = isNewCustomer;
  }

  if (customerSelect) {
    customerSelect.disabled = isNewCustomer;
  }

  if (newCustomerName) {
    newCustomerName.required = isNewCustomer;
    newCustomerName.disabled = !isNewCustomer;
  }

  if (newCustomerEmail) {
    newCustomerEmail.required = isNewCustomer;
    newCustomerEmail.disabled = !isNewCustomer;
  }

  if (isNewCustomer) {
    if (customerNameInput) customerNameInput.value = '';
    if (customerSelect) customerSelect.value = '';
  } else {
    if (newCustomerName) newCustomerName.value = '';
    if (newCustomerEmail) newCustomerEmail.value = '';
  }
}

if (customerType) {
  customerType.addEventListener('change', updateCustomerFields);
  updateCustomerFields();
}

// ============================================================
// LOAD ADMIN DASHBOARD
// ============================================================

async function loadDashboard() {
  try {
    const [statsResponse, deliveriesResponse] = await Promise.all([
      fetch(API + '/admin/stats', {
        headers: headers()
      }),

      fetch(API + '/admin/deliveries', {
        headers: headers()
      })
    ]);

    if (
      [statsResponse.status, deliveriesResponse.status].some(
        status => status === 401 || status === 403
      )
    ) {
      window.location.href = '/login.html';
      return;
    }

    if (!statsResponse.ok) {
      throw new Error('Unable to load admin statistics.');
    }

    if (!deliveriesResponse.ok) {
      throw new Error('Unable to load deliveries.');
    }

    const stats = await statsResponse.json();
    const deliveries = await deliveriesResponse.json();

    const setText = (id, value) => {
      const element = document.getElementById(id);

      if (element) {
        element.textContent = value;
      }
    };

    setText('users', stats.users || 0);
    setText('deliveries', stats.deliveries || 0);
    setText('active', stats.active || 0);
    setText('contacts', stats.contacts || 0);

    const rows = document.getElementById('adminRows');

    if (!rows) return;

    rows.replaceChildren();

    deliveries.forEach(delivery => {
      const tr = document.createElement('tr');

      const trackingCell = document.createElement('td');
      const trackingLink = document.createElement('a');

      trackingLink.href =
        '/tracking.html?id=' +
        encodeURIComponent(delivery.trackingId || '');

      trackingLink.textContent = delivery.trackingId || '—';

      trackingCell.appendChild(trackingLink);
      tr.appendChild(trackingCell);

      const petCell = document.createElement('td');
      petCell.textContent = delivery.pet?.name || '—';
      tr.appendChild(petCell);

      const customerCell = document.createElement('td');

      customerCell.textContent =
        delivery.customerSnapshot?.name || 'Guest';

      tr.appendChild(customerCell);

      const statusCell = document.createElement('td');
      const statusBadge = document.createElement('span');

      statusBadge.className =
        'badge ' +
        (delivery.status === 'delivered' ? 'green' : 'orange');

      statusBadge.textContent =
        String(delivery.status || '').replaceAll('_', ' ');

      statusCell.appendChild(statusBadge);
      tr.appendChild(statusCell);

      const amountCell = document.createElement('td');

      amountCell.textContent =
        '$' + Number(delivery.amount || 0).toFixed(2);

      tr.appendChild(amountCell);

      rows.appendChild(tr);
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    toast('Unable to load admin dashboard.');
  }
}

// ============================================================
// LOAD CUSTOMERS
// ============================================================

async function loadCustomers() {
  if (!customerSelect) {
    console.error(
      'The customerId select was not found in admin.html.'
    );

    return;
  }

  try {
    const response = await fetch(API + '/admin/customers', {
      headers: headers()
    });

    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login.html';
      return;
    }

    if (!response.ok) {
      throw new Error(
        'Unable to load customers (HTTP ' +
        response.status +
        ').'
      );
    }

    const customers = await response.json();

    customerSelect.innerHTML =
      '<option value="">Select a customer</option>';

    if (customerNameList) {
      customerNameList.replaceChildren();
    }

    customers.forEach(customer => {
      const name = customer.name || 'Unnamed customer';
      const email = customer.email || 'No email';

      const displayName = `${name} — ${email}`;

      const option = document.createElement('option');

      option.value = customer._id;
      option.textContent = displayName;
      option.dataset.phone = customer.phone || '';

      customerSelect.appendChild(option);

      if (customerNameList) {
        const suggestion = document.createElement('option');

        suggestion.value = displayName;

        customerNameList.appendChild(suggestion);
      }
    });

    syncCustomerInput();

  } catch (error) {
    console.error('Customer loading error:', error);

    customerSelect.innerHTML =
      '<option value="">Unable to load customers</option>';

    if (customerNameList) {
      customerNameList.replaceChildren();
    }

    toast('Unable to load customers.');
  }
}

// ============================================================
// MATCH EXISTING CUSTOMER
// ============================================================

function syncCustomerInput() {
  if (!customerSelect || !customerNameInput) {
    return null;
  }

  const enteredName = customerNameInput.value.trim();

  const matchedCustomer = Array.from(
    customerSelect.options
  ).find(option =>
    option.value &&
    option.textContent === enteredName
  );

  customerSelect.value = matchedCustomer
    ? matchedCustomer.value
    : '';

  if (customerPhone) {
    customerPhone.value =
      matchedCustomer?.dataset?.phone || '';
  }

  return matchedCustomer || null;
}

if (customerNameInput) {
  customerNameInput.addEventListener(
    'input',
    syncCustomerInput
  );

  customerNameInput.addEventListener(
    'change',
    syncCustomerInput
  );
}

if (customerSelect) {
  customerSelect.addEventListener('change', () => {
    const selected =
      customerSelect.options[customerSelect.selectedIndex];

    if (customerPhone) {
      customerPhone.value =
        selected?.dataset?.phone || '';
    }

    if (selected?.value && customerNameInput) {
      customerNameInput.value = selected.textContent;
    }
  });
}

// ============================================================
// CALCULATE BOOKING PRICE
// ============================================================

async function calculateAdminQuote() {
  const sizeElement =
    document.getElementById('adminPetSize');

  const serviceElement =
    document.getElementById('adminService');

  const distanceElement =
    document.getElementById('adminDistance');

  if (
    !sizeElement ||
    !serviceElement ||
    !distanceElement ||
    !quoteDisplay
  ) {
    console.error(
      'One or more quote fields are missing from admin.html.'
    );

    return null;
  }

  try {
    const response = await fetch(API + '/deliveries/quote', {
      method: 'POST',

      headers: {
        ...headers(),
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        size: sizeElement.value,
        service: serviceElement.value,
        distanceMiles: Number(distanceElement.value || 0)
      })
    });

    const quote = await response.json();

    if (!response.ok) {
      throw new Error(
        quote.message || 'Unable to calculate quote.'
      );
    }

    quoteDisplay.textContent =
      '$' + Number(quote.total || 0).toFixed(2);

    return quote;

  } catch (error) {
    console.error('Quote error:', error);

    return null;
  }
}

[
  'adminPetSize',
  'adminService',
  'adminDistance'
].forEach(id => {
  const element = document.getElementById(id);

  if (element) {
    element.addEventListener(
      'change',
      calculateAdminQuote
    );

    element.addEventListener(
      'input',
      calculateAdminQuote
    );
  }
});

// ============================================================
// CREATE ADMIN BOOKING
// ============================================================

if (form) {
  form.addEventListener('submit', async event => {
    event.preventDefault();

    try {
      const bookingCustomer = {};

      // ------------------------------------------------------
      // EXISTING CUSTOMER OR NEW CUSTOMER
      // ------------------------------------------------------

      if (customerType?.value === 'new') {
        const name =
          (newCustomerName?.value || '').trim();

        const email =
          (newCustomerEmail?.value || '')
            .trim()
            .toLowerCase();

        if (!name || !email) {
          throw new Error(
            'Please enter the new customer name and email.'
          );
        }

        bookingCustomer.newCustomer = {
          name: name,
          email: email,
          phone: (customerPhone?.value || '').trim()
        };

      } else if (customerType?.value === 'existing') {
        const matchedCustomer = syncCustomerInput();

        if (!matchedCustomer?.value) {
          throw new Error(
            'Please choose an existing customer from the suggestions.'
          );
        }

        bookingCustomer.customerId =
          matchedCustomer.value;

      } else {
        throw new Error(
          'Please choose a customer type.'
        );
      }

      // ------------------------------------------------------
      // CALCULATE PRICE
      // ------------------------------------------------------

      const quote = await calculateAdminQuote();

      if (!quote) {
        throw new Error(
          'Unable to calculate booking price. ' +
          'Please check the booking fields and try again.'
        );
      }

      const getValue = id => {
        const element = document.getElementById(id);

        return element ? element.value : '';
      };

      // ------------------------------------------------------
      // BUILD BOOKING
      // ------------------------------------------------------

      const booking = {
        ...bookingCustomer,

        pet: {
          name: getValue('adminPetName').trim(),
          type: getValue('adminPetType'),
          size: getValue('adminPetSize'),
          notes: getValue('adminPetNotes').trim()
        },

        service: getValue('adminService'),

        pickupAddress:
          getValue('adminPickup').trim(),

        destinationAddress:
          getValue('adminDestination').trim(),

        scheduledAt:
          getValue('adminScheduledAt') || null,

        distanceMiles:
          Number(getValue('adminDistance') || 0),

        paymentMethod:
          getValue('adminPayment'),

        phone:
          (customerPhone?.value || '').trim(),

        amount:
          Number(quote.total || 0)
      };

      // ------------------------------------------------------
      // SEND BOOKING TO BACKEND
      // ------------------------------------------------------

      const response = await fetch(
        API + '/admin/deliveries',
        {
          method: 'POST',

          headers: {
            ...headers(),
            'Content-Type': 'application/json'
          },

          body: JSON.stringify(booking)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'Unable to create booking.'
        );
      }

      // ------------------------------------------------------
      // DISPLAY SUCCESS MESSAGE
      // ------------------------------------------------------

      if (notice) {
        notice.replaceChildren();

        const success = document.createElement('strong');

        success.textContent =
          'Booking created successfully!';

        notice.appendChild(success);
        notice.appendChild(
          document.createElement('br')
        );
        notice.appendChild(
          document.createElement('br')
        );

        notice.appendChild(
          document.createTextNode('Customer: ')
        );

        const customerName =
          document.createElement('strong');

        customerName.textContent =
          result.customer?.name ||
          bookingCustomer.newCustomer?.name ||
          'Customer';

        notice.appendChild(customerName);

        notice.appendChild(
          document.createElement('br')
        );

        notice.appendChild(
          document.createTextNode('Tracking ID: ')
        );

        const trackingId =
          document.createElement('strong');

        trackingId.textContent =
          result.trackingId || 'Created';

        notice.appendChild(trackingId);

        notice.appendChild(
          document.createElement('br')
        );

        notice.appendChild(
          document.createTextNode('Amount: ')
        );

        const amount =
          document.createElement('strong');

        amount.textContent =
          '$' + Number(result.amount || 0).toFixed(2);

        notice.appendChild(amount);

        notice.appendChild(
          document.createElement('br')
        );

        notice.appendChild(
          document.createElement('br')
        );

        const trackingLink =
          document.createElement('a');

        trackingLink.className = 'btn btn-primary';

        trackingLink.href =
          '/tracking.html?id=' +
          encodeURIComponent(result.trackingId || '');

        trackingLink.textContent =
          'Track Delivery →';

        notice.appendChild(trackingLink);

        notice.style.display = 'block';
      }

      // ------------------------------------------------------
      // RESET FORM
      // ------------------------------------------------------

      form.reset();

      if (customerSelect) {
        customerSelect.value = '';
      }

      if (customerNameInput) {
        customerNameInput.value = '';
      }

      if (customerPhone) {
        customerPhone.value = '';
      }

      if (customerType) {
        customerType.value = 'existing';
      }

      updateCustomerFields();

      if (quoteDisplay) {
        quoteDisplay.textContent = '$49.00';
      }

      toast('Admin booking created successfully');

      await loadDashboard();
      await loadCustomers();

    } catch (error) {
      console.error(
        'Booking creation error:',
        error
      );

      if (notice) {
        notice.textContent =
          error.message ||
          'Unable to create booking.';

        notice.style.display = 'block';
      }

      toast(
        error.message ||
        'Unable to create booking'
      );
    }
  });
}

// ============================================================
// START ADMIN PAGE
// ============================================================

(async function startAdminPage() {
  await loadCustomers();
  await loadDashboard();
  await calculateAdminQuote();
})();