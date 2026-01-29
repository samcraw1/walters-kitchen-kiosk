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
  const [showMobileCart, setShowMobileCart] = useState(false)

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

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
      <div className="bg-wk-header text-white px-4 md:px-6 py-2 md:py-3 shadow-lg">
        <div className="flex items-center">
          <img src="/logo.svg" alt="Walter's Kitchen Restaurant & Bar" className="h-10 md:h-14" />
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

        {/* Cart Section - Desktop */}
        <div className="hidden md:flex w-80 border-l border-gray-300 bg-gray-50 flex-col">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            onClear={clearCart}
            onCheckout={() => setShowCheckout(true)}
          />
        </div>
      </div>

      {/* Mobile Cart Button */}
      {cartItemCount > 0 && (
        <button
          onClick={() => setShowMobileCart(true)}
          className="md:hidden fixed bottom-4 left-4 right-4 bg-wk-red text-white py-4 rounded-lg font-semibold text-lg shadow-lg flex items-center justify-center gap-2"
        >
          <span>View Cart</span>
          <span className="bg-white text-wk-red px-2 py-0.5 rounded-full text-sm font-bold">
            {cartItemCount}
          </span>
        </button>
      )}

      {/* Mobile Cart Drawer */}
      {showMobileCart && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileCart(false)}
          />
          <div className="relative mt-auto bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Your Order</h2>
              <button
                onClick={() => setShowMobileCart(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <Cart
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onClear={clearCart}
                onCheckout={() => {
                  setShowMobileCart(false)
                  setShowCheckout(true)
                }}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
