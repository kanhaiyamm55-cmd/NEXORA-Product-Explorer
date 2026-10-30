
import { fetchProducts, fetchCategories } from "./api.js";

import {
    getCart,
    saveCart
} from "./storage.js";


// DOM Elements
const productGrid = document.getElementById("product-grid");
const categoryTabs = document.getElementById("category-tabs");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");

const productCount = document.getElementById("product-count");
const skeletonContainer = document.getElementById("skeleton-container");

const errorBanner = document.getElementById("error-banner");
const errorMessage = document.getElementById("error-message");
const retryButton = document.getElementById("retry-button");

const emptyState = document.getElementById("empty-state");

const cartButton = document.getElementById("cart-button");
const cartDrawer = document.getElementById("cart-drawer");
const closeCart = document.getElementById("close-cart");
const overlay = document.getElementById("overlay");

const cartItemsContainer = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");

const toast = document.getElementById("toast");
const resetButton = document.getElementById("reset-button");
const checkoutButton = document.getElementById("checkout-button");


// Application State
let products = [];
let categories = [];

let activeCategory = "all";
let cart = getCart();

let toastTimer;


// Currency formatter
const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
});


// Escape HTML to prevent unsafe API text insertion
function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, (character) => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];

    });

}


// Loading State
function showLoading() {

    skeletonContainer.hidden = false;
    productGrid.hidden = true;

    errorBanner.hidden = true;
    emptyState.hidden = true;

    productCount.textContent = "Loading products...";

}


// Error State
function showError(message) {

    skeletonContainer.hidden = true;
    productGrid.hidden = true;

    errorBanner.hidden = false;
    errorMessage.textContent = message;

    productCount.textContent = "Unable to load products";

}


// Load Products From API
async function loadProducts() {

    showLoading();

    try {

        const [productData, categoryData] = await Promise.all([
            fetchProducts(),
            fetchCategories()
        ]);

        products = productData;
        categories = categoryData;

        renderCategories();
        renderProducts();

    } catch (error) {

        showError(error.message);

    }

}


// Render Category Tabs
function renderCategories() {

    const allCategories = ["all", ...categories];

    categoryTabs.innerHTML = allCategories.map(category => {

        const isActive = activeCategory === category;

        const label = category === "all"
            ? "All Products"
            : category.replace(/\b\w/g, letter => letter.toUpperCase());

        return `
            <button
                class="category-tab ${isActive ? "active" : ""}"
                data-category="${escapeHTML(category)}"
                aria-pressed="${isActive}"
            >
                ${escapeHTML(label)}
            </button>
        `;

    }).join("");

}


// Filter Products
function getFilteredProducts() {

    let filtered = [...products];

    // Category filtering
    if (activeCategory !== "all") {

        filtered = filtered.filter(product =>
            product.category === activeCategory
        );

    }

    // Search filtering
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (searchTerm) {

        filtered = filtered.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );

    }

    // Sorting
    const sortValue = sortSelect.value;

    switch (sortValue) {

        case "low-high":

            filtered.sort((a, b) => a.price - b.price);
            break;

        case "high-low":

            filtered.sort((a, b) => b.price - a.price);
            break;

        case "az":

            filtered.sort((a, b) =>
                a.title.localeCompare(b.title)
            );
            break;

        case "za":

            filtered.sort((a, b) =>
                b.title.localeCompare(a.title)
            );
            break;

        case "rating":

            filtered.sort((a, b) =>
                b.rating.rate - a.rating.rate
            );
            break;

    }

    return filtered;

}


// Render Product Cards
function renderProducts() {

    const filteredProducts = getFilteredProducts();

    skeletonContainer.hidden = true;
    productGrid.hidden = false;

    productCount.textContent =
        `${filteredProducts.length} products found`;

    if (filteredProducts.length === 0) {

        productGrid.innerHTML = "";
        emptyState.hidden = false;

        return;

    }

    emptyState.hidden = true;

    productGrid.innerHTML = filteredProducts.map(product => {

        const safeTitle = escapeHTML(product.title);
        const safeCategory = escapeHTML(product.category);
        const safeImage = escapeHTML(product.image);

        return `
            <article class="product-card">

                <div class="product-image-wrapper">

                    <span class="product-category">
                        ${safeCategory}
                    </span>

                    <img
                        src="${safeImage}"
                        alt="${safeTitle}"
                        class="product-image"
                        loading="lazy"
                    >

                </div>

                <div class="product-info">

                    <div class="product-rating">
                        ★ ${product.rating.rate}
                        <span>(${product.rating.count} reviews)</span>
                    </div>

                    <h3>${safeTitle}</h3>

                    <div class="product-bottom">

                        <strong>
                            ${currencyFormatter.format(product.price)}
                        </strong>

                        <button
                            class="add-button"
                            data-add="${product.id}"
                            aria-label="Add ${safeTitle} to cart"
                        >
                            + Add
                        </button>

                    </div>

                </div>

            </article>
        `;

    }).join("");

}


// Add Product To Cart
function addToCart(productId) {

    const product = products.find(item =>
        item.id === productId
    );

    if (!product) return;

    const existingItem = cart.find(item =>
        item.id === productId
    );

    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1
        });

    }

    updateCart();

    showToast("Product added to your bag!");

}


// Update Cart
function updateCart() {

    saveCart(cart);

    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    cartCount.textContent = totalItems;

    const totalPrice = cart.reduce(
        (total, item) =>
            total + item.price * item.quantity,
        0
    );

    cartTotal.textContent =
        currencyFormatter.format(totalPrice);

    renderCart();

}


// Render Cart Items
function renderCart() {

    if (cart.length === 0) {

        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <span>🛍️</span>
                <h3>Your bag is empty</h3>
                <p>Explore products and add your favourites.</p>
            </div>
        `;

        return;

    }

    cartItemsContainer.innerHTML = cart.map(item => `

        <article class="cart-item">

            <img
                src="${escapeHTML(item.image)}"
                alt="${escapeHTML(item.title)}"
            >

            <div class="cart-item-info">

                <h4>${escapeHTML(item.title)}</h4>

                <strong>
                    ${currencyFormatter.format(item.price)}
                </strong>

                <div class="quantity-controls">

                    <button data-decrease="${item.id}"
                        aria-label="Decrease quantity">−</button>

                    <span>${item.quantity}</span>

                    <button data-increase="${item.id}"
                        aria-label="Increase quantity">+</button>

                    <button data-remove="${item.id}"
                        class="remove-button"
                        aria-label="Remove product">Remove</button>

                </div>

            </div>

        </article>

    `).join("");

}


// Change Cart Quantity
function changeQuantity(productId, change) {

    const item = cart.find(item =>
        item.id === productId
    );

    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {

        cart = cart.filter(item =>
            item.id !== productId
        );

    }

    updateCart();

}


// Remove Cart Product
function removeFromCart(productId) {

    cart = cart.filter(item =>
        item.id !== productId
    );

    updateCart();

    showToast("Product removed from bag.");

}


// Open Cart
function openCart() {

    cartDrawer.classList.add("open");
    overlay.classList.add("show");

    cartDrawer.setAttribute("aria-hidden", "false");

}


// Close Cart
function hideCart() {

    cartDrawer.classList.remove("open");
    overlay.classList.remove("show");

    cartDrawer.setAttribute("aria-hidden", "true");

}


// Toast Notification
function showToast(message) {

    clearTimeout(toastTimer);

    toast.textContent = message;
    toast.classList.add("show");

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


// Event: Category Selection
categoryTabs.addEventListener("click", event => {

    const button = event.target.closest("[data-category]");

    if (!button) return;

    activeCategory = button.dataset.category;

    renderCategories();
    renderProducts();

});


// Event: Search
searchInput.addEventListener("input", renderProducts);


// Event: Sorting
sortSelect.addEventListener("change", renderProducts);


// Event: Add To Cart
productGrid.addEventListener("click", event => {

    const button = event.target.closest("[data-add]");

    if (!button) return;

    addToCart(Number(button.dataset.add));

});


// Event: Cart Quantity and Removal
cartItemsContainer.addEventListener("click", event => {

    const increase = event.target.closest("[data-increase]");
    const decrease = event.target.closest("[data-decrease]");
    const remove = event.target.closest("[data-remove]");

    if (increase) {
        changeQuantity(Number(increase.dataset.increase), 1);
    }

    if (decrease) {
        changeQuantity(Number(decrease.dataset.decrease), -1);
    }

    if (remove) {
        removeFromCart(Number(remove.dataset.remove));
    }

});


// Cart Controls
cartButton.addEventListener("click", openCart);
closeCart.addEventListener("click", hideCart);
overlay.addEventListener("click", hideCart);

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
        hideCart();
    }

});


// Retry API
retryButton.addEventListener("click", loadProducts);


// Reset Filters
resetButton.addEventListener("click", () => {

    activeCategory = "all";

    searchInput.value = "";
    sortSelect.value = "default";

    renderCategories();
    renderProducts();

});


// Checkout Placeholder
checkoutButton.addEventListener("click", () => {

    hideCart();

    if (cart.length > 0) {
        showToast("Shopping demo: Checkout is not connected.");
    } else {
        showToast("Your bag is empty.");
    }

});


// Initialize Application
async function init() {

    updateCart();

    await loadProducts();

}

init();
