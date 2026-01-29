import MenuItem from './MenuItem'

export default function MenuCategories({
  categories,
  selectedCategory,
  onSelectCategory,
  menuData,
  onAddToCart,
}) {
  const currentItems = menuData[selectedCategory] || []

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <div className="flex gap-0 px-2 md:px-4 py-0 min-w-min">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`px-3 md:px-5 py-3 md:py-4 text-sm md:text-base font-medium transition-colors duration-200 whitespace-nowrap ${
                selectedCategory === category
                  ? 'text-wk-red border-b-[3px] border-wk-red'
                  : 'text-gray-600 border-b-[3px] border-transparent hover:text-gray-900'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-20 md:pb-0">
        <div className="divide-y divide-gray-200 bg-white mx-2 md:mx-4 my-2 md:my-4 rounded-lg shadow-sm">
          {currentItems.map(item => (
            <MenuItem
              key={item.id}
              item={item}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
