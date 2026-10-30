
const CART_KEY = "nexora_cart";


// Get saved cart
export function getCart() {

    try {

        const savedCart = localStorage.getItem(CART_KEY);

        if (!savedCart) {
            return [];
        }

        const cart = JSON.parse(savedCart);

        return Array.isArray(cart) ? cart : [];

    } catch (error) {

        console.error("Storage Read Error:", error);

        return [];

    }

}


// Save cart
export function saveCart(cart) {

    try {

        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

    } catch (error) {

        console.error("Storage Save Error:", error);

    }

}


// Clear cart
export function clearCart() {

    localStorage.removeItem(CART_KEY);

}
