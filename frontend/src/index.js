const booksUrl = '/books.json';
let books = [];
let cart = [];

function formatPrice(price) {
  return `Ksh ${price.toFixed(2)}`;
}

async function loadBooks() {
  try {
    const res = await fetch(booksUrl);
    books = await res.json();
    renderBooks(books);
    populateFilters();
    updateCartCount();
  } catch (err) {
    console.error('Could not load books.json', err);
    document.getElementById('booksList').innerHTML = '<p class="error">Unable to load books data.</p>';
  }
}

// If you want to switch back to backend during development, uncomment this version:
// async function loadBooks() {
//   try {
//     const res = await fetch('http://localhost:4000/books');
//     books = await res.json();
//     renderBooks(books);
//     populateFilters();
//     updateCartCount();
//   } catch (err) {
//     console.error('Could not fetch backend books', err);
//     document.getElementById('booksList').innerHTML = '<p class="error">Backend unavailable.</p>';
//   }
// }

function renderBooks(list) {
  const booksList = document.getElementById('booksList');
  booksList.innerHTML = '';
  if (!list.length) {
    booksList.innerHTML = '<p>No books found.</p>';
    return;
  }

  for (const book of list) {
    const item = document.createElement('li');
    item.className = 'book';
    item.innerHTML = `
      <img src="${book.image}" alt="${book.title}" loading="lazy" />
      <div class="book-info">
        <h3>${book.title}</h3>
        <p><strong>Author:</strong> ${book.author}</p>
        <p><strong>Genre:</strong> ${book.genre} • <strong>Year:</strong> ${book.year}</p>
        <p>${book.description}</p>
        <div class="book-actions">
          <button class="borrow-btn" data-id="${book.id}">Borrow</button>
          <button class="delete-btn" data-id="${book.id}">Delete</button>
        </div>
      </div>
      <div class="price">${formatPrice(book.price)}</div>
    `;

    booksList.appendChild(item);
  }

  booksList.querySelectorAll('.borrow-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const book = books.find((b) => b.id === id);
      if (book) {
        addToCart(book);
        alert(`Added \"${book.title}\" to your cart.`);
      }
    });
  });

  booksList.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      books = books.filter((b) => b.id !== id);
      renderBooks(books);
      populateFilters();
    });
  });
}

function addToCart(book) {
  const existing = cart.find((item) => item.id === book.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...book, qty: 1 });
  updateCartCount();
}

function updateCartCount() {
  const cartItems = document.getElementById('cartItems');
  cartItems.textContent = cart.reduce((sum, x) => sum + x.qty, 0).toString();
}

function populateFilters() {
  const genreFilter = document.getElementById('genreFilter');
  genreFilter.innerHTML = '<option value="">All</option>';
  const genres = [...new Set(books.map((b) => b.genre))];
  genres.forEach((g) => {
    const option = document.createElement('option');
    option.value = g;
    option.textContent = g;
    genreFilter.appendChild(option);
  });
}

function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const genre = document.getElementById('genreFilter').value;
  const sort = document.getElementById('sortBy').value;

  let filtered = [...books];
  if (genre) filtered = filtered.filter((b) => b.genre === genre);
  if (search) filtered = filtered.filter((b) => b.title.toLowerCase().includes(search));

  if (sort === 'year') filtered.sort((a, b) => b.year - a.year);
  if (sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'author') filtered.sort((a, b) => a.author.localeCompare(b.author));

  renderBooks(filtered);
}

function setupAddBookModal() {
  const addBookBtn = document.getElementById('addBookBtn');
  const modal = document.getElementById('bookModal');
  const close = modal.querySelector('.close');
  const form = document.getElementById('bookForm');

  addBookBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  close.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  window.addEventListener('click', (ev) => {
    if (ev.target === modal) modal.style.display = 'none';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const f = event.target;
    const newBook = {
      id: Date.now(),
      title: f.title.value.trim(),
      author: f.author.value.trim(),
      genre: f.genre.value.trim(),
      year: Number(f.year.value),
      pages: Number(f.pages.value),
      publisher: f.publisher.value.trim(),
      description: f.description.value.trim(),
      image: f.image.value.trim() || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
      price: Number(f.price.value) || 0,
    };
    books.push(newBook);
    renderBooks(books);
    populateFilters();
    modal.style.display = 'none';
    f.reset();
  });
}

function setupReturnModal() {
  const returnBtn = document.getElementById('return');
  const returnModal = document.getElementById('returnModal');
  const closeReturn = document.getElementById('closeReturnModal');
  const confirmReturn = document.getElementById('confirmReturn');

  returnBtn?.addEventListener('click', () => {
    returnModal.style.display = 'block';
  });
  closeReturn.addEventListener('click', () => {
    returnModal.style.display = 'none';
  });
  confirmReturn.addEventListener('click', () => {
    const borrowerId = Number(document.getElementById('borrowerIdInput').value);
    if (!Number.isInteger(borrowerId) || borrowerId <= 0) {
      alert('Enter a valid borrower ID.');
      return;
    }
    returnModal.style.display = 'none';
    alert('Return processed for borrower ID ' + borrowerId);
  });
}

function setupSearchAndFilters() {
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('genreFilter').addEventListener('change', applyFilters);
  document.getElementById('sortBy').addEventListener('change', applyFilters);
}

function setupCartModal() {
  document.getElementById('cart').addEventListener('click', () => {
    const modal = document.getElementById('modal');
    const message = document.getElementById('modalMessage');
    const details = document.getElementById('modalDetails');

    if (!cart.length) {
      message.innerHTML = '<p>No borrowed books yet.</p>';
      details.innerHTML = '';
    } else {
      message.innerHTML = '<h3>Your Borrowed Books</h3>';
      details.innerHTML = cart.map((item) => `<p>${item.title} by ${item.author} x ${item.qty}</p>`).join('');
    }
    modal.style.display = 'flex';
  });

  const close = document.querySelector('#modal .close');
  close?.addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
  });

  const modal = document.getElementById('modal');
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

function setupLogout() {
  document.getElementById('logout').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

window.addEventListener('DOMContentLoaded', () => {
  loadBooks();
  setupAddBookModal();
  setupReturnModal();
  setupSearchAndFilters();
  setupCartModal();
  setupLogout();
});
