import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo')

export default function CheckoutForm({ total, onSuccess, onCancel, isProcessing, error }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutFormContent
        total={total}
        onSuccess={onSuccess}
        onCancel={onCancel}
        isProcessing={isProcessing}
        error={error}
      />
    </Elements>
  )
}

function CheckoutFormContent({ total, onSuccess, onCancel, isProcessing, error }) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardError, setCardError] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setCardError('Stripe is not loaded')
      return
    }

    setProcessing(true)
    setCardError('')

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, currency: 'usd' }),
      })

      const { clientSecret } = await response.json()

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      })

      if (result.error) {
        setCardError(result.error.message)
        setProcessing(false)
      } else if (result.paymentIntent.status === 'succeeded') {
        onSuccess(result.paymentIntent.id)
      }
    } catch (err) {
      setCardError(err.message)
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

            <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '20px',
                      color: '#000000',
                      '::placeholder': {
                        color: '#999999',
                      },
                    },
                    invalid: {
                      color: '#DC2626',
                    },
                  },
                }}
              />
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900">
                Test card: 4242 4242 4242 4242 (any future date, any CVC)
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 px-6 py-4 space-y-3">
          <button
            type="submit"
            disabled={!stripe || processing || isProcessing}
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
