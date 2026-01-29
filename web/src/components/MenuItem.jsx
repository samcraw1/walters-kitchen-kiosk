export default function MenuItem({ item, onAddToCart }) {
  return (
    <button
      onClick={() => onAddToCart(item)}
      className="w-full text-left px-3 md:px-5 py-3 md:py-4 hover:bg-gray-50 transition-colors duration-150 active:bg-gray-100 min-h-touch"
    >
      <div className="flex justify-between items-center gap-3">
        <span className="text-gray-900 text-sm md:text-base">
          {item.name}
        </span>
        <span className="text-gray-900 font-medium text-sm md:text-base whitespace-nowrap">
          ${item.price.toFixed(2)}
        </span>
      </div>
    </button>
  )
}
