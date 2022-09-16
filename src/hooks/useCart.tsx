import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: newProduct } = await api.get<Product>(`/products/${productId}`)
      const { data: productStock } = await api.get<Stock>(`/stock/${productId}`)
      console.log(productStock)
      const productAlredyInTheCart = cart.find(product => product.id === productId)
      if (productAlredyInTheCart) {
        if (productAlredyInTheCart.amount >= productStock.amount) {
          toast.error("Quantidade solicitada fora de estoque")
          return
        }
        const newCart = cart.map(product => product.id === productId ? { ...product, amount: product.amount + 1 } : { ...product })
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else {
        newProduct.amount = 1
        setCart([...cart, newProduct])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]))
      }

    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productAlredyInTheCart = cart.find(product => product.id === productId)
      if (productAlredyInTheCart) {
        const newCart = cart.filter(product => product.id !== productId)
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else {
        throw new Error()
      }
    } catch {
      toast.error("Erro na remoção do produto")
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return

      const { data: productStock } = await api.get<Stock>(`/stock/${productId}`)

      if (amount > productStock.amount) {
        toast.error("Quantidade solicitada fora de estoque")
        return
      }

      const updateProduct = cart.map(product => product.id === productId ? { ...product, amount: amount } : { ...product })
      setCart(updateProduct)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateProduct))

    } catch {
      toast.error('Erro na alteração de quantidade do produto')

    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
