export default function MenuItem({ item, onAddToCart }) {
  return (
    <button
      onClick={() => onAddToCart(item)}
      className="menu-item-card text-left group"
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-lg font-semibold text-gray-900 flex-1 group-hover:text-wk-red transition-colors">
            {item.name}
          </h3>
          <span className="text-wk-red font-bold text-xl whitespace-nowrap">
            ${item.price.toFixed(2)}
          </span>
        </div>
        <div className="text-sm text-gray-500 group-hover:text-wk-red transition-colors">
          Tap to add
        </div>
      </div>
    </button>
  )
}
