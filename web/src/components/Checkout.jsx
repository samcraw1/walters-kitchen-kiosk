import { useState } from 'react'
import CheckoutForm from './CheckoutForm'

const KIOSK_FEE = 3.00
const TAX_RATE = 0.0825

export default function Checkout({ cart, onSuccess, onCancel }) {
  const [step, setStep] = useState('review') // review, info, payment
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    location: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = (subtotal + KIOSK_FEE) * TAX_RATE
  const total = subtotal + KIOSK_FEE + tax

  const handleInfoSubmit = (e) => {
    e.preventDefault()
    if (!customerInfo.name.trim() || !customerInfo.phone.trim() || !customerInfo.location.trim()) {
      setError('Please fill in all fields')
      return
    }
    setError('')
    setStep('payment')
  }

  const handlePaymentSuccess = async (paymentIntentId) => {
    setIsProcessing(true)
    setError('')

    try {
      // Create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          subtotal,
          tax,
          kioskFee: KIOSK_FEE,
          total,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          deliveryLocation: customerInfo.location,
          paymentIntentId,
        }),
      })

      if (!response.ok) throw new Error('Failed to create order')

      const { orderNumber } = await response.json()
      onSuccess(orderNumber)
    } catch (err) {
      setError(err.message)
      setIsProcessing(false)
    }
  }

  if (step === 'review') {
    return (
      <CheckoutReview
        cart={cart}
        subtotal={subtotal}
        tax={tax}
        total={total}
        onNext={() => setStep('info')}
        onCancel={onCancel}
      />
    )
  }

  if (step === 'info') {
    return (
      <CheckoutInfo
        customerInfo={customerInfo}
        onUpdate={setCustomerInfo}
        onNext={handleInfoSubmit}
        onBack={() => setStep('review')}
        error={error}
      />
    )
  }

  return (
    <CheckoutForm
      total={total}
      onSuccess={handlePaymentSuccess}
      onCancel={onCancel}
      isProcessing={isProcessing}
      error={error}
    />
  )
}

function CheckoutReview({ cart, subtotal, tax, total, onNext, onCancel }) {
  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <div className="bg-wk-red text-white px-6 py-4">
        <h1 className="text-3xl font-bold">Order Review</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <h2 className="text-xl font-bold mb-4">Items in Your Order:</h2>
        <div className="space-y-4 mb-8">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <span className="text-2xl font-bold text-wk-red">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Order Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Kiosk Fee:</span>
              <span>$3.00</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Tax (8.25%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-wk-red border-t border-gray-300 pt-3">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 px-6 py-4 space-y-3">
        <button
          onClick={onNext}
          className="checkout-button"
        >
          Continue to Payment
        </button>
        <button
          onClick={onCancel}
          className="w-full py-4 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function CheckoutInfo({ customerInfo, onUpdate, onNext, onBack, error }) {
  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <div className="bg-wk-red text-white px-6 py-4">
        <h1 className="text-3xl font-bold">Customer Information</h1>
      </div>

      <form onSubmit={onNext} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-lg font-semibold mb-2">Name</label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => onUpdate({ ...customerInfo, name: e.target.value })}
                className="input-field text-xl"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2">Phone</label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => onUpdate({ ...customerInfo, phone: e.target.value })}
                className="input-field text-xl"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2">Delivery Location</label>
              <textarea
                value={customerInfo.location}
                onChange={(e) => onUpdate({ ...customerInfo, location: e.target.value })}
                className="input-field text-xl min-h-24"
                placeholder="Enter delivery address or location"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 px-6 py-4 space-y-3">
          <button
            type="submit"
            className="checkout-button"
          >
            Continue to Payment
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-4 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  )
}
