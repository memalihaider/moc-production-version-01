import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  status: 'active' | 'low-stock' | 'out-of-stock';
  rating: number;
  reviews: number;
  image: string;
  brand: string;
  staffIds?: string[];
}

interface ProductsStore {
  products: Product[];
  getProductsByCategory: (category: string) => Product[];
  getProductsByBrand: (brand: string) => Product[];
  searchProducts: (query: string) => Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: number, product: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  updateStock: (id: number, quantity: number) => void;
}

export const useProductsStore = create<ProductsStore>()(
  persist((set, get) => ({
    products: [
      {
        id: 1,
        name: "Premium Shampoo",
        category: "Hair Care",
        description: "Professional-grade shampoo for all hair types",
        price: 24.99,
        cost: 12.50,
        stock: 45,
        status: "active",
        rating: 4.8,
        reviews: 127,
        image: "https://images.unsplash.com/photo-1584305650560-5198c489fe47?q=80&w=2070&auto=format&fit=crop",
        brand: "MAN OF CAVE",
        staffIds: ["mike", "alex"]
      },
      {
        id: 2,
        name: "Beard Oil",
        category: "Beard Care",
        description: "Nourishing beard oil with natural ingredients",
        price: 18.99,
        cost: 8.75,
        stock: 32,
        status: "active",
        rating: 4.6,
        reviews: 89,
        image: "https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?q=80&w=2070&auto=format&fit=crop",
        brand: "MAN OF CAVE",
        staffIds: ["mike", "sarah"]
      },
      {
        id: 3,
        name: "Hair Wax",
        category: "Styling",
        description: "Strong hold styling wax for modern looks",
        price: 16.99,
        cost: 7.25,
        stock: 28,
        status: "active",
        rating: 4.7,
        reviews: 156,
        image: "https://images.unsplash.com/photo-1597354984706-fac992d9306f?q=80&w=2070&auto=format&fit=crop",
        brand: "MAN OF CAVE"
      },
      {
        id: 4,
        name: "Aftershave Balm",
        category: "Skincare",
        description: "Soothing balm for post-shave care",
        price: 22.99,
        cost: 10.50,
        stock: 15,
        status: "low-stock",
        rating: 4.9,
        reviews: 203,
        image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=2070&auto=format&fit=crop",
        brand: "MAN OF CAVE"
      },
      {
        id: 5,
        name: "Hair Trimmer",
        category: "Tools",
        description: "Professional cordless hair trimmer",
        price: 79.99,
        cost: 35.00,
        stock: 8,
        status: "low-stock",
        rating: 4.7,
        reviews: 98,
        image: "https://images.unsplash.com/photo-1592647420148-bfcc1a3ed291?q=80&w=2070&auto=format&fit=crop",
        brand: "ProTools"
      },
      {
        id: 6,
        name: "Facial Scrub",
        category: "Skincare",
        description: "Exfoliating facial scrub for men",
        price: 28.99,
        cost: 12.00,
        stock: 0,
        status: "out-of-stock",
        rating: 4.5,
        reviews: 71,
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=2070&auto=format&fit=crop",
        brand: "SkinPro"
      }
    ],
    
    getProductsByCategory: (category) => {
      const allProducts = get().products;
      return allProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
    },
    
    getProductsByBrand: (brand) => {
      const allProducts = get().products;
      return allProducts.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
    },
    
    searchProducts: (query) => {
      const allProducts = get().products;
      const lowerQuery = query.toLowerCase();
      return allProducts.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.brand.toLowerCase().includes(lowerQuery)
      );
    },
    
    addProduct: (product) => {
      const newProduct: Product = {
        ...product,
        id: Math.max(...get().products.map(p => p.id), 0) + 1
      };
      set(state => ({ products: [...state.products, newProduct] }));
    },
    
    updateProduct: (id, updates) => {
      set(state => ({
        products: state.products.map(product =>
          product.id === id ? { ...product, ...updates } : product
        )
      }));
    },
    
    deleteProduct: (id) => {
      set(state => ({
        products: state.products.filter(product => product.id !== id)
      }));
    },
    
    updateStock: (id, quantity) => {
      set(state => ({
        products: state.products.map(product => {
          if (product.id === id) {
            const newStock = product.stock + quantity;
            const newStatus = newStock === 0 ? 'out-of-stock' : newStock < 10 ? 'low-stock' : 'active';
            return { ...product, stock: newStock, status: newStatus };
          }
          return product;
        })
      }));
    }
  }), { name: 'products-storage' })
);

export default useProductsStore;
