export default function Cart({
  items,
  onUpdateQuantity,
  onRemove,
  onClear,
  onCheckout,
  isMobile = false,
}) {
  const KIOSK_FEE = 3.00
  const TAX_RATE = 0.0825

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = (subtotal + KIOSK_FEE) * TAX_RATE
  const total = subtotal + KIOSK_FEE + tax

  return (
    <div className={`flex flex-col ${isMobile ? '' : 'h-full'} bg-gray-50`}>
      {/* Header - hide on mobile since drawer has its own */}
      {!isMobile && (
        <div className="bg-wk-header text-white px-4 py-4 shrink-0">
          <h2 className="text-xl font-semibold">Your Order</h2>
          <p className="text-sm opacity-80">Items in cart: {items.length}</p>
        </div>
      )}

      {/* Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">No items yet</p>
              <p className="text-sm">Select items from the menu</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm flex-1">
                    {item.name}
                  </h4>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="text-red-600 hover:text-red-700 font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="quantity-button text-sm w-8 h-8"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="quantity-button text-sm w-8 h-8"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-gray-300 bg-white px-4 py-4 shrink-0">
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Kiosk Fee:</span>
            <span className="font-semibold">${KIOSK_FEE.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (8.25%):</span>
            <span className="font-semibold">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="font-bold text-wk-red">Total:</span>
            <span className="font-bold text-wk-red text-lg">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="checkout-button"
          >
            Proceed to Pay
          </button>
          <button
            onClick={onClear}
            disabled={items.length === 0}
            className="w-full py-3 text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear Order
          </button>
        </div>
      </div>
    </div>
  )
}
