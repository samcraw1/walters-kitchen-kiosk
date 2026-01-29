import { useState, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export default function CheckoutForm({ total, onSuccess, onCancel, isProcessing, error }) {
  const [cardError, setCardError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [squareReady, setSquareReady] = useState(false)
  const [squareConfig, setSquareConfig] = useState(null)
  const cardRef = useRef(null)
  const paymentsRef = useRef(null)

  // Load Square config and SDK
  useEffect(() => {
    const loadSquare = async () => {
      try {
        // Fetch Square config from API
        const res = await fetch(`${API_URL}/square/config`)
        const config = await res.json()
        setSquareConfig(config)

        // Load Square SDK
        const sdkUrl = config.environment === 'production'
          ? 'https://web.squarecdn.com/v1/square.js'
          : 'https://sandbox.web.squarecdn.com/v1/square.js'

        // Check if already loaded
        if (window.Square) {
          initializeSquare(config)
          return
        }

        const script = document.createElement('script')
        script.src = sdkUrl
        script.onload = () => initializeSquare(config)
        script.onerror = () => setCardError('Failed to load payment system')
        document.head.appendChild(script)
      } catch (err) {
        console.error('Square load error:', err)
        setCardError('Failed to initialize payment')
      }
    }

    loadSquare()

    return () => {
      if (cardRef.current) {
        cardRef.current.destroy()
      }
    }
  }, [])

  const initializeSquare = async (config) => {
    try {
      if (!window.Square) {
        setCardError('Payment system not available')
        return
      }

      const payments = window.Square.payments(config.applicationId, config.locationId)
      paymentsRef.current = payments

      const card = await payments.card()
      await card.attach('#card-container')
      cardRef.current = card

      setSquareReady(true)
    } catch (err) {
      console.error('Square init error:', err)
      setCardError('Failed to initialize card form')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!cardRef.current || !squareReady) {
      setCardError('Payment form not ready')
      return
    }

    setProcessing(true)
    setCardError('')

    try {
      // Tokenize the card
      const result = await cardRef.current.tokenize()

      if (result.status === 'OK') {
        // Process payment via our API
        const response = await fetch(`${API_URL}/square/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: result.token,
            amount: total,
            currency: 'USD',
          }),
        })

        const paymentResult = await response.json()

        if (paymentResult.success) {
          onSuccess(paymentResult.paymentId)
        } else {
          setCardError(paymentResult.error || 'Payment failed')
          setProcessing(false)
        }
      } else {
        const errors = result.errors.map(e => e.message).join(', ')
        setCardError(errors || 'Card validation failed')
        setProcessing(false)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setCardError(err.message || 'Payment processing failed')
      setProcessing(false)
    }
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <div className="bg-wk-red text-white px-6 py-4">
        <h1 className="text-3xl font-bold">Payment</h1>
        <p className="text-2xl font-bold mt-2">${total.toFixed(2)}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-md">
            <h2 className="text-xl font-bold mb-6">Enter Card Details</h2>

            {cardError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">{cardError}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            )}

            <div className="border-2 border-gray-300 rounded-lg p-6 bg-white min-h-[60px]">
              <div id="card-container"></div>
              {!squareReady && (
                <div className="flex items-center justify-center py-2">
                  <div className="spinner"></div>
                  <span className="ml-2 text-gray-500">Loading...</span>
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900">
                Test card: 4532 0123 4567 8901 (any future date, any CVC, any ZIP)
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 px-6 py-4 space-y-3">
          <button
            type="submit"
            disabled={!squareReady || processing || isProcessing}
            className="checkout-button"
          >
            {processing || isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="spinner mr-3"></div>
                Processing...
              </div>
            ) : (
              `Pay ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(total)}`
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={processing || isProcessing}
            className="w-full py-4 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
