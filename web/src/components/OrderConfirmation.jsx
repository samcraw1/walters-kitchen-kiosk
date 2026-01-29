import { useEffect, useState } from 'react'

export default function OrderConfirmation({ orderNumber, onNewOrder }) {
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          onNewOrder()
          return 30
        }
        return c - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onNewOrder])

  return (
    <div className="kiosk-container flex items-center justify-center bg-gradient-to-b from-wk-red to-red-700">
      <div className="text-center text-white max-w-2xl px-6">
        <div className="text-8xl mb-6">✓</div>

        <h1 className="text-6xl font-bold mb-4">Order Confirmed!</h1>

        <div className="bg-white bg-opacity-20 rounded-xl p-8 mb-8 backdrop-blur">
          <p className="text-2xl mb-4">Your Order Number:</p>
          <p className="text-7xl font-black mb-4 font-mono">{orderNumber}</p>
          <p className="text-2xl opacity-90">
            Show this number when you pick up your order
          </p>
        </div>

        <div className="bg-white bg-opacity-10 rounded-xl p-6 mb-8">
          <p className="text-xl mb-2">Restaurant Address:</p>
          <p className="text-2xl font-semibold">8010 N Stemmons Fwy</p>
          <p className="text-2xl font-semibold">Dallas, TX 75247</p>
          <p className="text-xl mt-4 opacity-90">Phone: (469) 489-4654</p>
        </div>

        <div className="bg-white bg-opacity-10 rounded-xl p-6 mb-8">
          <p className="text-xl opacity-90">An email confirmation has been sent</p>
        </div>

        <button
          onClick={onNewOrder}
          className="bg-white text-wk-red font-bold text-3xl px-12 py-6 rounded-xl hover:bg-gray-100 transition-colors min-h-touch"
        >
          Start New Order
        </button>

        <p className="text-lg opacity-75 mt-8">
          Returning to menu in {countdown} seconds...
        </p>
      </div>
    </div>
  )
}
