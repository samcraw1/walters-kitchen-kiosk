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
      <div className="bg-white border-b border-gray-300 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4 py-2 min-w-min">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`menu-category-tab ${
                selectedCategory === category ? 'active' : ''
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-2 gap-4 auto-rows-max">
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
