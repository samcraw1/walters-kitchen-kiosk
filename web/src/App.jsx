import { useState, useEffect } from 'react'
import MenuCategories from './components/MenuCategories'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import OrderConfirmation from './components/OrderConfirmation'
import { menuData } from './data/menu'

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('Appetizers')
  const [cart, setCart] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderConfirmation, setOrderConfirmation] = useState(null)

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id)
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prevCart, { ...item, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      )
    }
  }

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId))
  }

  const clearCart = () => {
    setCart([])
  }

  const handleCheckoutSuccess = (orderNumber) => {
    setOrderConfirmation(orderNumber)
    setShowCheckout(false)
    setCart([])
  }

  if (orderConfirmation) {
    return (
      <OrderConfirmation
        orderNumber={orderConfirmation}
        onNewOrder={() => setOrderConfirmation(null)}
      />
    )
  }

  if (showCheckout) {
    return (
      <Checkout
        cart={cart}
        onSuccess={handleCheckoutSuccess}
        onCancel={() => setShowCheckout(false)}
      />
    )
  }

  return (
    <div className="kiosk-container bg-white">
      {/* Header */}
      <div className="bg-wk-red text-white px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Walter's Kitchen</h1>
            <p className="text-sm opacity-90">Food Ordering Kiosk</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">8010 N Stemmons Fwy, Dallas, TX</p>
            <p>(469) 489-4654</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Menu Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MenuCategories
            categories={Object.keys(menuData)}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            menuData={menuData}
            onAddToCart={addToCart}
          />
        </div>

        {/* Cart Section */}
        <div className="w-80 border-l border-gray-300 bg-gray-50 flex flex-col">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            onClear={clearCart}
            onCheckout={() => setShowCheckout(true)}
          />
        </div>
      </div>
    </div>
  )
}
