
const BASE_URL = "https://fakestoreapi.com";

// Fetch all products
export async function fetchProducts() {

    try {

        const response = await fetch(`${BASE_URL}/products`);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const products = await response.json();

        return products;

    } catch (error) {

        console.error("Product API Error:", error);

        throw new Error(
            "Unable to load products. Please check your internet connection."
        );

    }

}


// Fetch all categories
export async function fetchCategories() {

    try {

        const response = await fetch(
            `${BASE_URL}/products/categories`
        );

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        return await response.json();

    } catch (error) {

        console.error("Category API Error:", error);

        throw error;

    }

}
