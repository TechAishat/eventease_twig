const USERS_KEY = 'ticketapp_users';
const SESSION_KEY = 'ticketapp_session';
const TICKETS_KEY = 'ticketapp_tickets_v1';

const body = document.body;
const pageId = body.dataset.pageId || '';

const toastRoot = document.getElementById('toast-root');
let toastTimeoutId = null;

const showToast = (variant, title, message) => {
  if (!toastRoot) return;
  toastRoot.textContent = '';

  const toast = document.createElement('div');
  toast.className = `toast ${variant === 'success' ? 'toast-success' : 'toast-error'}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const content = document.createElement('div');
  const strong = document.createElement('strong');
  strong.textContent = title;
  const paragraph = document.createElement('p');
  paragraph.textContent = message;
  content.append(strong, paragraph);

  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', 'Close notification');
  button.textContent = '×';
  button.addEventListener('click', () => clearToast());

  toast.append(content, button);
  toastRoot.appendChild(toast);

  clearTimeout(toastTimeoutId);
  toastTimeoutId = window.setTimeout(() => {
    clearToast();
  }, 4000);
};

const clearToast = () => {
  if (!toastRoot) return;
  toastRoot.textContent = '';
  clearTimeout(toastTimeoutId);
  toastTimeoutId = null;
};

const safeJsonParse = (value, defaultValue) => {
  try {
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error('Failed to parse JSON', error);
    return defaultValue;
  }
};

const readUsers = () => safeJsonParse(localStorage.getItem(USERS_KEY), []);
const writeUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const readTickets = () => safeJsonParse(localStorage.getItem(TICKETS_KEY), []);
const writeTickets = (tickets) => localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));

const readSession = () => safeJsonParse(localStorage.getItem(SESSION_KEY), null);
const writeSession = (session) => localStorage.setItem(SESSION_KEY, JSON.stringify(session));
const clearSession = () => localStorage.removeItem(SESSION_KEY);

const findUserByEmail = (users, email) =>
  users.find((user) => user.email.toLowerCase() === email.toLowerCase());

const getCurrentSession = () => {
  const session = readSession();
  if (!session) {
    return null;
  }
  const users = readUsers();
  const user = users.find((candidate) => candidate.id === session.userId);
  if (!user) {
    clearSession();
    return null;
  }
  return {
    token: session.token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
};

const createSession = (user) => {
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  writeSession({ token, userId: user.id, createdAt: new Date().toISOString() });
  return token;
};

const session = getCurrentSession();
const ticketsState = {
  tickets: readTickets(),
  filter: 'all',
  editingId: null
};

const headerLoginLink = document.querySelector('[data-auth-link="login"]');
const headerLogoutButton = document.querySelector('[data-action="logout"]');

const updateHeaderAuthState = () => {
  const hasSession = Boolean(getCurrentSession());
  if (headerLoginLink) {
    headerLoginLink.classList.toggle('hidden', hasSession);
  }
  if (headerLogoutButton) {
    headerLogoutButton.hidden = !hasSession;
  }
};

const ensureAuth = () => {
  if (!getCurrentSession()) {
    showToast('error', 'Session required', 'Your session has expired — please log in again.');
    window.location.replace('/auth/login');
    return false;
  }
  return true;
};

const ensureGuest = () => {
  if (getCurrentSession()) {
    window.location.replace('/dashboard');
    return false;
  }
  return true;
};

const handleLogout = () => {
  clearSession();
  updateHeaderAuthState();
  showToast('success', 'Signed out', 'You have been logged out.');
  window.location.replace('/');
};

if (headerLogoutButton) {
  headerLogoutButton.addEventListener('click', handleLogout);
}

const setButtonLoadingState = (button, isLoading) => {
  if (!button) return;
  const loadingText = button.dataset.loadingText;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText || 'Please wait…';
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
};

const renderDashboard = () => {
  const current = getCurrentSession();
  if (!current) return;

  const firstNameEl = document.querySelector('[data-dashboard="firstName"]');
  if (firstNameEl) {
    const firstName = current.user.name?.split(' ')[0] || 'there';
    firstNameEl.textContent = firstName;
  }

  const stats = {
    total: ticketsState.tickets.length,
    open: ticketsState.tickets.filter((ticket) => ticket.status === 'open').length,
    in_progress: ticketsState.tickets.filter((ticket) => ticket.status === 'in_progress').length,
    closed: ticketsState.tickets.filter((ticket) => ticket.status === 'closed').length
  };

  const completionRate = stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0;

  const statMap = {
    total: document.querySelector('[data-dashboard="stat-total"]'),
    open: document.querySelector('[data-dashboard="stat-open"]'),
    in_progress: document.querySelector('[data-dashboard="stat-in_progress"]'),
    closed: document.querySelector('[data-dashboard="stat-closed"]')
  };

  Object.entries(statMap).forEach(([key, element]) => {
    if (element) {
      element.textContent = stats[key];
    }
  });

  const progressCircle = document.querySelector('[data-dashboard="progress-circle"]');
  if (progressCircle) {
    progressCircle.style.background = `conic-gradient(#4f5dff ${completionRate}%, rgba(79, 93, 255, 0.2) ${completionRate}% 100%)`;
    progressCircle.textContent = `${completionRate}%`;
  }

  const recentList = document.querySelector('[data-dashboard="recent-list"]');
  const recentEmpty = document.querySelector('[data-dashboard="recent-empty"]');

  if (recentList && recentEmpty) {
    const recent = [...ticketsState.tickets]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    if (recent.length === 0) {
      recentEmpty.hidden = false;
      recentList.hidden = true;
      recentList.textContent = '';
    } else {
      recentEmpty.hidden = true;
      recentList.hidden = false;
      recentList.textContent = '';
      recent.forEach((ticket) => {
        const li = document.createElement('li');
        li.className = 'card-soft';
        li.style.display = 'grid';
        li.style.gap = '0.5rem';
        li.innerHTML = `
          <div class="ticket-meta">
            <strong>${ticket.title}</strong>
            <span class="tag tag-${ticket.status}">${ticket.status.replace('_', ' ')}</span>
          </div>
          <span style="color: #6c7391; font-size: 0.9rem">
            Created on ${new Date(ticket.createdAt).toLocaleDateString()}
          </span>
          ${ticket.description ? `<p style="margin: 0">${ticket.description}</p>` : ''}
        `;
        recentList.appendChild(li);
      });
    }
  }
};

const validateAuthFields = (form, fields) => {
  const errors = {};

  if (fields.includes('name')) {
    const name = form.elements.name.value.trim();
    if (!name) errors.name = 'Name is required.';
  }

  if (fields.includes('email')) {
    const email = form.elements.email.value.trim();
    if (!email) errors.email = 'Email is required.';
  }

  if (fields.includes('password')) {
    const password = form.elements.password.value;
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
  }

  if (fields.includes('confirmPassword')) {
    const confirm = form.elements.confirmPassword.value;
    if (!confirm) errors.confirmPassword = 'Confirm your password.';
    else if (confirm !== form.elements.password.value) errors.confirmPassword = 'Passwords do not match.';
  }

  form.querySelectorAll('.error-text').forEach((node) => {
    node.textContent = '';
  });

  Object.entries(errors).forEach(([field, message]) => {
    const errorNode = form.querySelector(`[data-error-for="${field}"]`);
    if (errorNode) errorNode.textContent = message;
  });

  return errors;
};

const handleLogin = () => {
  const form = document.getElementById('login-form');
  if (!form) return;

  if (!ensureGuest()) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const errors = validateAuthFields(form, ['email', 'password']);
    if (Object.keys(errors).length > 0) return;

    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;

    const users = readUsers();
    const user = findUserByEmail(users, email);

    if (!user || user.password !== password) {
      showToast('error', 'Login failed', 'Invalid credentials. Please try again.');
      return;
    }

    createSession(user);
    updateHeaderAuthState();
    showToast('success', 'Welcome back 👋', 'You are now signed in.');
    window.location.replace('/dashboard');
  });
};

const handleSignup = () => {
  const form = document.getElementById('signup-form');
  if (!form) return;

  if (!ensureGuest()) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const errors = validateAuthFields(form, ['name', 'email', 'password', 'confirmPassword']);
    if (Object.keys(errors).length > 0) return;

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;

    const users = readUsers();
    if (findUserByEmail(users, email)) {
      const errorNode = form.querySelector('[data-error-for="email"]');
      if (errorNode) errorNode.textContent = 'An account with that email already exists.';
      showToast('error', 'Signup failed', 'An account with that email already exists.');
      return;
    }

    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      password
    };
    users.push(user);
    writeUsers(users);

    createSession(user);
    updateHeaderAuthState();
    showToast('success', 'Account created', 'Welcome aboard! You are now signed in.');
    window.location.replace('/dashboard');
  });
};

const validateTicketPayload = (payload) => {
  const errors = {};

  if (!payload.title.trim()) errors.title = 'Title is required.';
  else if (payload.title.trim().length > 120) errors.title = 'Title must be 120 characters or less.';

  if (!['open', 'in_progress', 'closed'].includes(payload.status)) {
    errors.status = 'Status must be open, in progress, or closed.';
  }

  if (payload.description && payload.description.length > 500) {
    errors.description = 'Description must not exceed 500 characters.';
  }

  if (payload.priority && payload.priority.length > 40) {
    errors.priority = 'Priority label must not exceed 40 characters.';
  }

  return errors;
};

const renderTicketList = () => {
  const list = document.querySelector('[data-ticket-list]');
  const empty = document.querySelector('[data-ticket-empty]');
  const countNode = document.querySelector('[data-ticket-count]');

  if (!list || !empty || !countNode) return;

  const tickets = ticketsState.tickets.filter((ticket) =>
    ticketsState.filter === 'all' ? true : ticket.status === ticketsState.filter
  );

  const sorted = [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  countNode.textContent = sorted.length;

  if (sorted.length === 0) {
    empty.hidden = false;
    list.hidden = true;
    list.textContent = '';
    return;
  }

  empty.hidden = true;
  list.hidden = false;
  list.textContent = '';

  sorted.forEach((ticket) => {
    const article = document.createElement('article');
    article.className = 'card ticket-card';
    article.dataset.ticketId = ticket.id;
    article.innerHTML = `
      <div class="ticket-meta">
        <strong>${ticket.title}</strong>
        <span class="tag tag-${ticket.status}">${ticket.status.replace('_', ' ')}</span>
      </div>
      ${ticket.priority ? `<span style="font-weight: 600; color: #4f5dff">Priority: ${ticket.priority}</span>` : ''}
      ${ticket.description ? `<p style="margin: 0">${ticket.description}</p>` : ''}
      <div style="font-size: 0.85rem; color: #6c7391">
        <span>Created: ${new Date(ticket.createdAt).toLocaleString()}</span>
        ${ticket.updatedAt ? `<br />Updated: ${new Date(ticket.updatedAt).toLocaleString()}` : ''}
      </div>
      <div class="ticket-actions">
        <button type="button" class="btn" data-action="edit">Edit</button>
        <button type="button" class="btn btn-secondary" data-action="delete">Delete</button>
      </div>
    `;
    list.appendChild(article);
  });
};

const hydrateTicketsPage = () => {
  const createForm = document.getElementById('create-ticket-form');
  const editForm = document.getElementById('edit-ticket-form');
  const editEmptyState = document.getElementById('edit-empty-state');
  const filters = document.querySelector('[data-ticket-filters]');

  if (!createForm || !editForm || !editEmptyState || !filters) return;

  renderTicketList();

  filters.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      filters.querySelectorAll('button').forEach((btn) => {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-checked', 'true');
      ticketsState.filter = button.dataset.filterValue;
      renderTicketList();
    });
  });

  const resetFormErrors = (form) => {
    form.querySelectorAll('.error-text').forEach((node) => {
      node.textContent = '';
    });
  };

  createForm.addEventListener('submit', (event) => {
    event.preventDefault();
    resetFormErrors(createForm);

    const payload = {
      title: createForm.elements.title.value.trim(),
      status: createForm.elements.status.value,
      priority: createForm.elements.priority.value.trim(),
      description: createForm.elements.description.value.trim()
    };

    const errors = validateTicketPayload(payload);
    Object.entries(errors).forEach(([field, message]) => {
      const node = createForm.querySelector(`[data-error-for="create-${field}"]`);
      if (node) node.textContent = message;
    });

    if (Object.keys(errors).length > 0) return;

    const ticket = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    ticketsState.tickets = [ticket, ...ticketsState.tickets];
    writeTickets(ticketsState.tickets);
    createForm.reset();
    renderTicketList();
    renderDashboard();
    showToast('success', 'Ticket created', `“${ticket.title}” is now ${ticket.status.replace('_', ' ')}.`);
  });

  editForm.addEventListener('submit', (event) => {
    event.preventDefault();
    resetFormErrors(editForm);

    const id = editForm.elements.id.value;
    if (!id) return;

    const payload = {
      title: editForm.elements.title.value.trim(),
      status: editForm.elements.status.value,
      priority: editForm.elements.priority.value.trim(),
      description: editForm.elements.description.value.trim()
    };

    const errors = validateTicketPayload(payload);
    Object.entries(errors).forEach(([field, message]) => {
      const node = editForm.querySelector(`[data-error-for="edit-${field}"]`);
      if (node) node.textContent = message;
    });

    if (Object.keys(errors).length > 0) return;

    ticketsState.tickets = ticketsState.tickets.map((ticket) =>
      ticket.id === id ? { ...ticket, ...payload, updatedAt: new Date().toISOString() } : ticket
    );
    writeTickets(ticketsState.tickets);
    renderTicketList();
    renderDashboard();
    showToast('success', 'Ticket updated', 'Changes saved successfully.');
  });

  const resetEditState = () => {
    editForm.reset();
    editForm.hidden = true;
    editEmptyState.hidden = false;
    ticketsState.editingId = null;
  };

  editForm.querySelector('[data-action="cancel-edit"]').addEventListener('click', () => {
    resetEditState();
  });

  document.querySelector('[data-ticket-list]')?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const card = button.closest('[data-ticket-id]');
    if (!card) return;

    const ticketId = card.dataset.ticketId;
    const ticket = ticketsState.tickets.find((item) => item.id === ticketId);
    if (!ticket) return;

    if (button.dataset.action === 'edit') {
      ticketsState.editingId = ticketId;
      editForm.hidden = false;
      editEmptyState.hidden = true;
      editForm.elements.id.value = ticket.id;
      editForm.elements.title.value = ticket.title;
      editForm.elements.status.value = ticket.status;
      editForm.elements.priority.value = ticket.priority || '';
      editForm.elements.description.value = ticket.description || '';
      resetFormErrors(editForm);
      editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (button.dataset.action === 'delete') {
      const confirmed = window.confirm(`Delete “${ticket.title}”? This cannot be undone.`);
      if (!confirmed) return;

      ticketsState.tickets = ticketsState.tickets.filter((item) => item.id !== ticketId);
      writeTickets(ticketsState.tickets);
      if (ticketsState.editingId === ticketId) {
        resetEditState();
      }
      renderTicketList();
      renderDashboard();
      showToast('success', 'Ticket deleted', 'The ticket has been removed.');
    }
  });
};

const bootstrap = () => {
  updateHeaderAuthState();

  if (['dashboard', 'tickets'].includes(pageId)) {
    if (!ensureAuth()) return;
  }

  if (pageId === 'dashboard') {
    renderDashboard();
  }

  if (pageId === 'tickets') {
    renderDashboard();
    hydrateTicketsPage();
  }

  if (pageId === 'login') {
    handleLogin();
  }

  if (pageId === 'signup') {
    handleSignup();
  }
};

window.addEventListener('DOMContentLoaded', bootstrap);
