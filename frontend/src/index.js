"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let cartCount = 0;
let cart = [];
// FETCH BOOKS FUNCTION
function fetchBooks() {
    return __awaiter(this, arguments, void 0, function* (params = {}) {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const url = `http://localhost:4000/books${queryParams ? `?${queryParams}` : ''}`;
            console.log("Fetching books from:", url);
            const response = yield fetch(url);
            return yield response.json();
        }
        catch (error) {
            console.error("Error fetching books:", error);
            return [];
        }
    });
}
// DISPLAY BOOKS FUNCTION
function displayBooks(books) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const booksList = document.getElementById("booksList");
        booksList.innerHTML = "";
        if (books.length === 0) {
            booksList.innerHTML = "<p>No books found matching your search criteria.</p>";
            return;
        }
        // Create the edit modal
        const editModal = document.createElement("div");
        editModal.id = "editModal";
        editModal.style.display = "none";
        editModal.innerHTML = `
    <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Edit Book</h2>
        <form id="editBookForm">
            <input type="hidden" id="editBookId">
            <label>Title:</label>
            <input type="text" id="editTitle">
            <label>Author:</label>
            <input type="text" id="editAuthor">
            <label>Price:</label>
            <input type="number" id="editPrice">
            <button type="submit">Update</button>
        </form>
    </div>
    `;
        document.body.appendChild(editModal);
        // Create an instance of BorrowModal to be used by all borrow buttons
        const borrowModal = new BorrowModal();
        books.forEach((book) => {
            var _a, _b;
            const bookItem = document.createElement("li");
            bookItem.classList.add("book");
            bookItem.title = book.description;
            bookItem.innerHTML = `
            <img src="${book.image}" alt="${book.title}"> 
            <div>
                <strong>${book.title}</strong> by ${book.author} <br> 
                Genre: ${book.genre} | Year: ${book.year} | Pages: ${book.pages} <br>
                Price: <strong>${book.price}</strong>
            </div>
            <button class="borrow" data-book-id="${book.id}">Borrow</button>
             
            <div class="book-actions">
                <span class="edit-icon" title="Edit">✏️</span>
                <span class="delete-icon" title="Delete">❌</span>
            </div>
        `;
            booksList.appendChild(bookItem);
            // Add event listener to the borrow button for this specific book
            const borrowButton = bookItem.querySelector(".borrow");
            if (borrowButton) {
                borrowButton.addEventListener("click", () => {
                    // Get the book ID from the data attribute and open the modal
                    const bookId = parseInt(borrowButton.dataset.bookId || '0', 10);
                    if (bookId) {
                        borrowModal.openBorrowModal(bookId);
                    }
                    else {
                        console.error('No book ID found for this button');
                    }
                });
            }
            // Handle Delete with Confirmation
            (_a = bookItem.querySelector(".delete-icon")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
                if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
                    deleteBook(book.id, bookItem);
                }
            });
            // Handle Edit (opens modal)
            (_b = bookItem.querySelector(".edit-icon")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
                openEditModal(book);
            });
        });
        // Close Edit Modal
        (_a = document.querySelector(".close-modal")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
            editModal.style.display = "none";
        });
        // Handle Edit Form Submission
        (_b = document.getElementById("editBookForm")) === null || _b === void 0 ? void 0 : _b.addEventListener("submit", (event) => {
            event.preventDefault();
            const bookId = document.getElementById("editBookId").value;
            const updatedBook = {
                title: document.getElementById("editTitle").value,
                author: document.getElementById("editAuthor").value,
                price: parseFloat(document.getElementById("editPrice").value),
            };
            fetch(`http://localhost:4000/books/${bookId}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedBook),
            })
                .then((response) => __awaiter(this, void 0, void 0, function* () {
                const data = yield response.json();
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error("Access denied: Only Admins and Librarians can update books");
                    }
                    throw new Error(data.message || "Failed to update book");
                }
                alert("Book updated successfully!");
                editModal.style.display = "none";
                location.reload();
            }))
                .catch(error => {
                console.error("Error updating book:", error);
                alert(error.message); // Show the custom "Access denied" message for 403
            });
        });
    });
}
// Function to Delete a Book
function deleteBook(bookId, bookElement) {
    fetch(`http://localhost:4000/books/${bookId}`, {
        method: "DELETE",
        credentials: "include",
    })
        .then(response => {
        if (!response.ok)
            throw new Error("Failed to delete book");
        bookElement.remove(); // Remove from UI
    })
        .catch(error => {
        console.error("Error deleting book:", error);
        alert("Access denied: Only Admins can delete book");
    });
}
// Function to Open Edit Modal
function openEditModal(book) {
    const editModal = document.getElementById("editModal");
    document.getElementById("editBookId").value = book.id.toString();
    document.getElementById("editTitle").value = book.title;
    document.getElementById("editAuthor").value = book.author;
    document.getElementById("editPrice").value = book.price.toString();
    editModal.style.display = "block";
}
// BORROW MODAL CLASS
class BorrowModal {
    constructor() {
        this.bookData = null;
        this.selectedCopyId = null;
        // Create modal elements
        this.modal = document.createElement('div');
        this.backdrop = document.createElement('div');
        // Set up modal styles
        this.setupModalStyles();
        // Setup close behavior
        this.setupCloseEvents();
    }
    setupModalStyles() {
        // Backdrop styles
        this.backdrop.style.position = 'fixed';
        this.backdrop.style.top = '0';
        this.backdrop.style.left = '0';
        this.backdrop.style.width = '100%';
        this.backdrop.style.height = '100%';
        this.backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.backdrop.style.zIndex = '1000';
        // Modal styles
        this.modal.style.position = 'fixed';
        this.modal.style.top = '50%';
        this.modal.style.left = '50%';
        this.modal.style.transform = 'translate(-50%, -50%)';
        this.modal.style.backgroundColor = 'white';
        this.modal.style.padding = '20px';
        this.modal.style.borderRadius = '5px';
        this.modal.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        this.modal.style.zIndex = '1001';
        this.modal.style.width = '400px';
        this.modal.style.maxWidth = '90%';
    }
    setupCloseEvents() {
        // Close when clicking on backdrop
        this.backdrop.addEventListener('click', () => {
            this.close();
        });
        // Handle escape key press
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.modal.parentElement) {
                this.close();
            }
        });
    }
    fetchBookCopies(bookId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`http://localhost:4000/books/available/${bookId}`, {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!response.ok)
                    throw new Error(`Failed to fetch book copies: ${response.statusText}`);
                const result = yield response.json();
                console.log("API response:", result);
                return Object.assign(Object.assign({}, result), { copies: result.copies || [] });
            }
            catch (error) {
                console.error('Error fetching book copies:', error);
                throw error;
            }
        });
    }
    borrow(copyId) {
        return fetch(`http://localhost:4000/books/borrow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ copy_id: copyId })
        })
            .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to borrow book: ${response.statusText}`);
            }
            return response.json();
        })
            .then(() => {
            // Success notification
            this.showNotification('Book borrowedsuccessfully!', 'success');
            this.close();
        })
            .catch(error => {
            console.error('Error borrowing book:', error);
            this.showNotification('Failed to borrow book. Please try again.', 'error');
        });
    }
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.color = 'white';
        notification.style.backgroundColor = type === 'success' ? '#4caf50' : '#f44336';
        notification.style.zIndex = '2000';
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    openBorrowModal(bookId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                console.log("bookid", bookId);
                this.bookData = yield this.fetchBookCopies(bookId);
                if (!((_a = this.bookData) === null || _a === void 0 ? void 0 : _a.copies) || this.bookData.copies.length === 0) {
                    this.showNotification('No copies available for borrowing', 'error');
                    return;
                }
                console.log("bookData:", this.bookData);
                this.modal.innerHTML = '';
                const header = document.createElement('h2');
                const bookTitle = this.bookData.copies.length > 0 ? this.bookData.copies[0].title : "Unknown Book";
                header.textContent = `Borrow: ${bookTitle}`;
                console.log("Book copies:", this.bookData.copies);
                const availableCopies = this.bookData.copies.filter(copy => ['available', 'returned'].includes(copy.status));
                const copiesList = document.createElement('div');
                if (this.bookData.copies.length === 0) {
                    copiesList.innerHTML = '<p style="color: #f44336;">No copies available for borrowing.</p>';
                }
                else {
                    this.bookData.copies.forEach(copy => {
                        const copyItem = document.createElement('div');
                        copyItem.innerHTML = `
                    <strong>Copy ID:</strong> ${copy.copy_id} <br>
                    <strong>Status:</strong> ${copy.status} <br>
                    <strong>Condition:</strong> ${copy.condition} <br>
                    <strong>Location:</strong> ${copy.location} <br>
                    <strong>Author:</strong> ${copy.author} <br>
                `;
                        Object.assign(copyItem.style, {
                            padding: '10px',
                            border: '1px solid #eee',
                            marginBottom: '5px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            backgroundColor: '#f9f9f9'
                        });
                        copyItem.addEventListener('click', () => {
                            document.querySelectorAll('.copy-selected').forEach(el => el.classList.remove('copy-selected'));
                            copyItem.classList.add('copy-selected');
                            this.selectedCopyId = copy.copy_id;
                            console.log("✅ Selected Copy:", this.selectedCopyId);
                            // Enable the "Add to Cart" button when a copy is selected
                            borrowButton.disabled = false;
                            borrowButton.style.backgroundColor = '#1976d2';
                        });
                        copiesList.appendChild(copyItem);
                    });
                }
                this.modal.appendChild(copiesList);
                this.modal.innerHTML = ''; // Clear previous content
                this.modal.appendChild(header);
                const borrowButton = document.createElement('button');
                borrowButton.textContent = 'Borrow book';
                borrowButton.disabled = availableCopies.length === 0;
                borrowButton.style.backgroundColor = borrowButton.disabled ? '#ccc' : '#1976d2';
                borrowButton.addEventListener('click', () => {
                    if (this.selectedCopyId) {
                        this.borrow(this.selectedCopyId);
                    }
                    else {
                        this.showNotification('Please select a copy to borrow', 'error');
                    }
                });
                this.modal.append(header, copiesList, borrowButton);
                document.body.appendChild(this.modal);
            }
            catch (error) {
                console.error('Error opening borrow modal:', error);
                this.showNotification('Failed to load book information', 'error');
            }
        });
    }
    close() {
        var _a;
        this.modal.remove();
        (_a = this.backdrop) === null || _a === void 0 ? void 0 : _a.remove();
        this.selectedCopyId = null;
    }
}
// MAIN INITIALIZATION (EXAMPLE)
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch books on page load
        const books = yield fetchBooks();
        // Display the books
        yield displayBooks(books);
        // Set up search/filter functionality if needed
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (event) => __awaiter(void 0, void 0, void 0, function* () {
                event.preventDefault();
                // Get search parameters
                const formData = new FormData(searchForm);
                const params = {};
                for (const [key, value] of formData.entries()) {
                    if (typeof value === 'string' && value.trim() !== '') {
                        params[key] = value.trim();
                    }
                }
                // Fetch and display filtered books
                const filteredBooks = yield fetchBooks(params);
                yield displayBooks(filteredBooks);
            }));
        }
    }
    catch (error) {
        console.error('Error initializing application:', error);
    }
}));
function populateFilters() {
    return __awaiter(this, void 0, void 0, function* () {
        const books = yield fetchBooks();
        const genres = new Set();
        books.forEach((book) => genres.add(book.genre));
        const genreFilter = document.getElementById("genreFilter");
        genreFilter.innerHTML = '<option value="">All Genres</option>';
        genres.forEach((genre) => {
            const option = document.createElement("option");
            option.value = genre;
            option.textContent = genre;
            genreFilter.appendChild(option);
        });
    });
}
function handleSearch() {
    return __awaiter(this, void 0, void 0, function* () {
        const searchQuery = document.getElementById("searchInput").value.trim();
        const selectedGenre = document.getElementById("genreFilter").value;
        const sortBy = document.getElementById("sortBy").value;
        const params = {};
        if (searchQuery) {
            params.search = searchQuery;
        }
        if (selectedGenre) {
            params.genre = selectedGenre;
        }
        if (sortBy) {
            params.sortBy = sortBy;
        }
        const books = yield fetchBooks(params);
        displayBooks(books);
    });
}
function addToCart(title, author, price) {
    const existingItem = cart.find((item) => item.title === title);
    if (existingItem) {
        existingItem.quantity++;
    }
    else {
        cart.push({ title, author, price, quantity: 1 });
    }
    cartCount++;
    updateCartCountDisplay();
}
function updateCartCountDisplay() {
    const cartCountElement = document.getElementById("cartItems");
    if (cartCountElement) {
        cartCountElement.textContent = ` ${cartCount} `;
    }
}
function addCartItems(title) {
    return __awaiter(this, void 0, void 0, function* () {
        const books = yield fetchBooks();
        const book = books.find((book) => book.title === title);
        if (!book) {
            console.error(`Book "${title}" not found in JSON data.`);
            return;
        }
        addToCart(book.title, book.author, book.price);
    });
}
function showCartModal() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("showCartModal is running!");
        const modal = document.getElementById("modal");
        const modalMessage = document.getElementById("modalMessage");
        const modalDetails = document.getElementById("modalDetails");
        if (cart.length === 0) {
            modalMessage.innerHTML = "<p>No borrowed books yet😥.</p>";
            modalDetails.innerHTML = "";
        }
        else {
            modalMessage.innerHTML = "<h3>📚Borrowed books:</h3>";
            modalDetails.innerHTML = "";
            let totalAmount = 0;
            cart.forEach((cartItem, index) => {
                totalAmount += cartItem.price * cartItem.quantity;
                const cartRow = document.createElement("div");
                cartRow.innerHTML = `
 <p><strong>📖 ${cartItem.title}</strong> by ${cartItem.author} - Ksh ${cartItem.price} x ${cartItem.quantity}</p>
                <div class="plus-minus">
                <button class="decrease" data-index="${index}">➖</button>
                <span>${cartItem.quantity}</span>
                <button class="increase" data-index="${index}">➕</button>
                <button class="remove" data-index="${index}">❌ Remove</button>
                </div>            `;
                modalDetails.appendChild(cartRow);
            });
            const totalElement = document.createElement("p");
            totalElement.innerHTML = `<strong>Total: Ksh ${totalAmount}</strong>`;
            modalDetails.appendChild(totalElement);
        }
        modal.style.display = "flex";
        // Close modal when 'X' button is clicked
        closeModal.addEventListener("click", () => {
            modal.style.display = "none";
        });
        // Close modal when clicking outside the modal content
        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    });
}
function setupEventListeners() {
    var _a, _b, _c;
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSearch();
        }
    });
    // Add search button event listener if you have one
    const searchButton = document.getElementById("searchButton");
    if (searchButton) {
        searchButton.addEventListener("click", handleSearch);
    }
    // Add event listeners for filters
    (_a = document.getElementById("genreFilter")) === null || _a === void 0 ? void 0 : _a.addEventListener("change", handleSearch);
    (_b = document.getElementById("sortBy")) === null || _b === void 0 ? void 0 : _b.addEventListener("change", handleSearch);
    // Add event listener for cart
    (_c = document.getElementById("cart")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", showCartModal);
}
document.addEventListener("DOMContentLoaded", () => __awaiter(void 0, void 0, void 0, function* () {
    const logoutBtn = document.getElementById("logout");
    logoutBtn.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield fetch("http://localhost:4000/users/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        console.log("Logout successful");
        alert("Logout successful!");
        window.location.href = "index.html";
    }));
}));
const closeModal = document.querySelector(".close");
function addBookBtn() {
    var _a;
    const addBookBtn = document.getElementById("addBookBtn");
    const bookModal = document.getElementById("bookModal");
    const successMessage = document.getElementById("successMessage");
    (_a = document.getElementById("bookForm")) === null || _a === void 0 ? void 0 : _a.addEventListener("submit", (event) => __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        const title = document.getElementById("title").value;
        const author = document.getElementById("author").value;
        const year = parseInt(document.getElementById("year").value, 10);
        const genre = document.getElementById("genre").value;
        const pages = parseInt(document.getElementById("pages").value, 10);
        const publisher = document.getElementById("publisher").value;
        const description = document.getElementById("description").value;
        const image = document.getElementById("image").value;
        const price = parseInt(document.getElementById("price").value, 10);
        const book = { title, author, genre, year, pages, publisher, description, image, price };
        try {
            const response = yield fetch("http://localhost:4000/books", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(book),
            });
            if (!response.ok)
                throw new Error("Failed to add book");
            const newBook = yield response.json();
            console.log("Book added:", newBook);
            // Refresh books list
            fetchBooks();
            // Close modal
            successMessage.textContent = "Book added successfully!";
            successMessage.style.display = "block";
            // Close the modal after a short delay
            setTimeout(() => {
                bookModal.style.display = "none";
                successMessage.style.display = "none"; // Hide message after closing modal
            }, 1500);
            //     // Clear form fields
            //     bookForm.reset();
            //   (document.getElementById("modal") as HTMLElement).style.display = "none";
        }
        catch (error) {
            console.error("Error:", error);
            alert("Access denied: Only Admins can create  book");
        }
    }));
    addBookBtn.addEventListener("click", () => {
        bookModal.style.display = "flex";
    });
    // Close modal when 'X' button is clicked
    closeModal.addEventListener("click", () => {
        bookModal.style.display = "none";
    });
    // Close modal when clicking outside the modal content
    window.addEventListener("click", (event) => {
        if (event.target === bookModal) {
            bookModal.style.display = "flex";
        }
    });
    // Show modal when "Add Book" button is clicked
}
addBookBtn();
// Function to open the return book modal
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded!");
    // Get references to elements
    const returnButton = document.getElementById("return");
    const returnModal = document.getElementById("returnModal");
    const confirmReturn = document.getElementById("confirmReturn");
    const closeReturnModal = document.getElementById("closeReturnModal");
    // Check if elements exist
    if (!returnButton) {
        console.error("Return button not found!");
        return;
    }
    if (!returnModal || !confirmReturn || !closeReturnModal) {
        console.error("Modal elements not found!");
        return;
    }
    console.log("All elements found successfully");
    // Add event listeners
    returnButton.addEventListener("click", () => {
        console.log("Return button clicked!");
        openReturnModal();
    });
    confirmReturn.addEventListener("click", () => {
        console.log("Confirm return clicked!");
        const borrowerInput = document.getElementById("borrowerIdInput");
        const borrowerId = parseInt(borrowerInput.value);
        if (isNaN(borrowerId)) {
            alert("Please enter a valid Borrower ID.");
            return;
        }
        closeModal();
        returnBook(borrowerId);
    });
    closeReturnModal.addEventListener("click", () => {
        console.log("Closing modal.");
        closeModal();
    });
    // Open modal function
    function openReturnModal() {
        console.log("Opening return modal...");
        returnModal.style.display = "block";
        // Clear any previous input
        const borrowerInput = document.getElementById("borrowerIdInput");
        borrowerInput.value = "";
        borrowerInput.focus();
    }
    // Close modal function
    function closeModal() {
        returnModal.style.display = "none";
    }
});
// Function to return book (separate from the DOM-related code)
function returnBook(borrowerId) {
    console.log(`Returning book with Borrower ID: ${borrowerId}`);
    fetch(`http://localhost:4000/books/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ borrower_id: borrowerId })
    })
        .then(response => {
        console.log("Response received from server.");
        if (!response.ok)
            throw new Error("Failed to return book");
        return response.json();
    })
        .then(data => {
        console.log("Book returned successfully!", data);
        alert("Book returned successfully!");
    })
        .catch(error => {
        console.error("Error returning book:", error);
        alert("Failed to return book. Please try again.");
    });
}
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        // Initial fetch of all books (no filters)
        const books = yield fetchBooks();
        displayBooks(books);
        populateFilters();
        updateCartCountDisplay();
        setupEventListeners();
    });
}
init();
