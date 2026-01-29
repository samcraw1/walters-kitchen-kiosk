import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('menu')
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [squareStatus, setSquareStatus] = useState(null)
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(false)

  // Check if already authenticated
  useEffect(() => {
    const savedPassword = localStorage.getItem('adminPassword')
    if (savedPassword) {
      setPassword(savedPassword)
      verifyPassword(savedPassword)
    }
  }, [])

  const verifyPassword = async (pwd) => {
    try {
      const res = await fetch(`${API_URL}/admin/categories`, {
        headers: { 'x-admin-password': pwd }
      })
      if (res.ok) {
        setAuthenticated(true)
        localStorage.setItem('adminPassword', pwd)
        loadData(pwd)
      } else {
        setError('Invalid password')
        localStorage.removeItem('adminPassword')
      }
    } catch (err) {
      setError('Connection error')
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    verifyPassword(password)
  }

  const loadData = async (pwd) => {
    setLoading(true)
    try {
      const headers = { 'x-admin-password': pwd }

      const [catRes, itemRes, squareRes, settingsRes] = await Promise.all([
        fetch(`${API_URL}/admin/categories`, { headers }),
        fetch(`${API_URL}/admin/items`, { headers }),
        fetch(`${API_URL}/admin/square/status`, { headers }),
        fetch(`${API_URL}/admin/settings`, { headers }),
      ])

      if (catRes.ok) setCategories(await catRes.json())
      if (itemRes.ok) setItems(await itemRes.json())
      if (squareRes.ok) setSquareStatus(await squareRes.json())
      if (settingsRes.ok) setSettings(await settingsRes.json())
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('adminPassword')
    setAuthenticated(false)
    setPassword('')
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 text-lg"
              autoFocus
            />
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full bg-wk-red text-white py-3 rounded-lg font-semibold text-lg hover:bg-red-700"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-wk-header text-white px-6 py-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h1 className="text-xl font-bold">Walter's Kitchen Admin</h1>
          <button onClick={logout} className="text-sm hover:underline">
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto flex">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'menu'
                ? 'text-wk-red border-b-2 border-wk-red'
                : 'text-gray-600'
            }`}
          >
            Menu
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'payments'
                ? 'text-wk-red border-b-2 border-wk-red'
                : 'text-gray-600'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab('printing')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'printing'
                ? 'text-wk-red border-b-2 border-wk-red'
                : 'text-gray-600'
            }`}
          >
            Printing
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : activeTab === 'menu' ? (
          <MenuManager
            categories={categories}
            items={items}
            password={password}
            onRefresh={() => loadData(password)}
          />
        ) : activeTab === 'payments' ? (
          <PaymentsManager
            squareStatus={squareStatus}
            password={password}
            onRefresh={() => loadData(password)}
          />
        ) : (
          <PrintingManager
            settings={settings}
            password={password}
            onRefresh={() => loadData(password)}
          />
        )}
      </div>
    </div>
  )
}

// Menu Manager Component
function MenuManager({ categories, items, password, onRefresh }) {
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newItem, setNewItem] = useState({ name: '', price: '', category_id: '' })

  const API_URL = import.meta.env.VITE_API_URL || '/api'
  const headers = {
    'Content-Type': 'application/json',
    'x-admin-password': password,
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) return
    await fetch(`${API_URL}/admin/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: newCategoryName, sort_order: categories.length }),
    })
    setNewCategoryName('')
    onRefresh()
  }

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category and all its items?')) return
    await fetch(`${API_URL}/admin/categories/${id}`, { method: 'DELETE', headers })
    onRefresh()
  }

  const addItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category_id) return
    await fetch(`${API_URL}/admin/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...newItem,
        price: parseFloat(newItem.price),
        sort_order: items.filter(i => i.category_id === newItem.category_id).length,
      }),
    })
    setNewItem({ name: '', price: '', category_id: '' })
    onRefresh()
  }

  const updateItem = async (id, updates) => {
    await fetch(`${API_URL}/admin/items/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    })
    setEditingItem(null)
    onRefresh()
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return
    await fetch(`${API_URL}/admin/items/${id}`, { method: 'DELETE', headers })
    onRefresh()
  }

  const toggleItemAvailable = async (item) => {
    await updateItem(item.id, { ...item, available: !item.available })
  }

  return (
    <div className="space-y-8">
      {/* Add Category */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Add Category</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={addCategory}
            className="px-6 py-2 bg-wk-red text-white rounded-lg font-medium"
          >
            Add
          </button>
        </div>
      </div>

      {/* Add Item */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Add Menu Item</h2>
        <div className="flex gap-4 flex-wrap">
          <select
            value={newItem.category_id}
            onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Item name"
            className="flex-1 px-4 py-2 border rounded-lg min-w-[200px]"
          />
          <input
            type="number"
            step="0.01"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            placeholder="Price"
            className="w-24 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={addItem}
            className="px-6 py-2 bg-wk-red text-white rounded-lg font-medium"
          >
            Add
          </button>
        </div>
      </div>

      {/* Categories & Items */}
      {categories.map(category => (
        <div key={category.id} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">{category.name}</h3>
            <button
              onClick={() => deleteCategory(category.id)}
              className="text-red-600 text-sm hover:underline"
            >
              Delete Category
            </button>
          </div>
          <div className="divide-y">
            {items
              .filter(item => item.category_id === category.id)
              .map(item => (
                <div key={item.id} className="px-6 py-3 flex items-center gap-4">
                  {editingItem === item.id ? (
                    <>
                      <input
                        type="text"
                        defaultValue={item.name}
                        id={`name-${item.id}`}
                        className="flex-1 px-3 py-1 border rounded"
                      />
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={item.price}
                        id={`price-${item.id}`}
                        className="w-24 px-3 py-1 border rounded"
                      />
                      <button
                        onClick={() => {
                          const name = document.getElementById(`name-${item.id}`).value
                          const price = parseFloat(document.getElementById(`price-${item.id}`).value)
                          updateItem(item.id, { ...item, name, price })
                        }}
                        className="text-green-600 font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="text-gray-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`flex-1 ${!item.available ? 'text-gray-400 line-through' : ''}`}>
                        {item.name}
                      </span>
                      <span className="text-gray-600">${parseFloat(item.price).toFixed(2)}</span>
                      <button
                        onClick={() => toggleItemAvailable(item)}
                        className={`text-sm ${item.available ? 'text-green-600' : 'text-gray-400'}`}
                      >
                        {item.available ? 'Available' : 'Hidden'}
                      </button>
                      <button
                        onClick={() => setEditingItem(item.id)}
                        className="text-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            {items.filter(i => i.category_id === category.id).length === 0 && (
              <div className="px-6 py-4 text-gray-400 text-sm">No items in this category</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Payments Manager Component
function PaymentsManager({ squareStatus, password, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const API_URL = import.meta.env.VITE_API_URL || '/api'

  // Check for OAuth callback on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')

    if (code && state) {
      // Handle OAuth callback
      handleOAuthCallback(code, state)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleOAuthCallback = async (code, state) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/admin/square/callback?code=${code}&state=${state}`, {
        headers: { 'x-admin-password': password },
      })
      const data = await res.json()
      if (data.success) {
        onRefresh()
      } else {
        setError(data.error || 'Failed to connect Square account')
      }
    } catch (err) {
      console.error('OAuth callback error:', err)
      setError('Failed to complete Square connection')
    }
    setLoading(false)
  }

  const connectSquare = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/admin/square/auth-url`, {
        headers: { 'x-admin-password': password },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to get authorization URL')
      }
    } catch (err) {
      console.error('Square connect error:', err)
      setError('Failed to initiate Square connection')
    }
    setLoading(false)
  }

  const disconnectSquare = async () => {
    if (!confirm('Are you sure you want to disconnect Square?')) return
    setLoading(true)
    try {
      await fetch(`${API_URL}/admin/square/disconnect`, {
        method: 'POST',
        headers: { 'x-admin-password': password },
      })
      onRefresh()
    } catch (err) {
      console.error('Disconnect error:', err)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Square Payments</h2>
        <p className="text-gray-600 mb-4">
          Connect the restaurant owner's Square account to receive payments directly.
          The kiosk fee ($3.00) will be sent to your platform account.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {squareStatus?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <span className="text-xl">✓</span>
              <span className="font-medium">Square Connected</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>Merchant ID:</strong> {squareStatus.merchantId}</p>
              <p><strong>Business Name:</strong> {squareStatus.businessName || 'N/A'}</p>
              <p><strong>Location ID:</strong> {squareStatus.locationId || 'N/A'}</p>
            </div>
            <button
              onClick={disconnectSquare}
              disabled={loading}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              {loading ? 'Disconnecting...' : 'Disconnect Square'}
            </button>
          </div>
        ) : (
          <button
            onClick={connectSquare}
            disabled={loading}
            className="px-6 py-3 bg-wk-red text-white rounded-lg font-semibold"
          >
            {loading ? 'Loading...' : 'Connect Square Account'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">How Split Payments Work</h2>
        <div className="space-y-3 text-gray-600">
          <p>When a customer pays:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Food cost goes to the restaurant owner's Square account</li>
            <li>Kiosk fee ($3.00) goes to your platform account</li>
            <li>Square fees (2.6% + $0.10) are deducted automatically</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Setup Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Click "Connect Square Account" above</li>
          <li>Log in with the restaurant owner's Square account</li>
          <li>Authorize the kiosk application</li>
          <li>You'll be redirected back here when complete</li>
        </ol>
      </div>
    </div>
  )
}

// Printing Manager Component
function PrintingManager({ settings, password, onRefresh }) {
  const [apiKey, setApiKey] = useState(settings.printnode_api_key || '')
  const [printerId, setPrinterId] = useState(settings.printnode_printer_id || '')
  const [printers, setPrinters] = useState([])
  const [loading, setLoading] = useState(false)
  const [testStatus, setTestStatus] = useState(null)
  const API_URL = import.meta.env.VITE_API_URL || '/api'

  const headers = {
    'Content-Type': 'application/json',
    'x-admin-password': password,
  }

  const saveApiKey = async () => {
    setLoading(true)
    try {
      await fetch(`${API_URL}/admin/settings/printnode_api_key`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ value: apiKey }),
      })
      onRefresh()
      // Fetch printers after saving API key
      fetchPrinters()
    } catch (err) {
      console.error('Save error:', err)
    }
    setLoading(false)
  }

  const savePrinterId = async () => {
    setLoading(true)
    try {
      await fetch(`${API_URL}/admin/settings/printnode_printer_id`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ value: printerId }),
      })
      onRefresh()
    } catch (err) {
      console.error('Save error:', err)
    }
    setLoading(false)
  }

  const fetchPrinters = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/print/printers`, { headers })
      if (res.ok) {
        setPrinters(await res.json())
      }
    } catch (err) {
      console.error('Fetch printers error:', err)
    }
  }

  const testPrint = async () => {
    setLoading(true)
    setTestStatus(null)
    try {
      const res = await fetch(`${API_URL}/admin/print/test`, {
        method: 'POST',
        headers,
      })
      if (res.ok) {
        setTestStatus({ success: true, message: 'Test receipt sent to printer!' })
      } else {
        const data = await res.json()
        setTestStatus({ success: false, message: data.error || 'Print failed' })
      }
    } catch (err) {
      setTestStatus({ success: false, message: 'Connection error' })
    }
    setLoading(false)
  }

  // Fetch printers on load if API key exists
  useState(() => {
    if (settings.printnode_api_key) {
      fetchPrinters()
    }
  }, [settings.printnode_api_key])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">PrintNode Setup</h2>
        <p className="text-gray-600 mb-4">
          Connect to PrintNode to automatically print order receipts at the restaurant.
        </p>

        <div className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PrintNode API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter PrintNode API key"
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button
                onClick={saveApiKey}
                disabled={loading}
                className="px-4 py-2 bg-wk-red text-white rounded-lg"
              >
                Save
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Get your API key from{' '}
              <a href="https://app.printnode.com/account/apikey" target="_blank" rel="noopener" className="text-blue-600 underline">
                PrintNode Dashboard
              </a>
            </p>
          </div>

          {/* Printer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Printer ID
            </label>
            <div className="flex gap-2">
              {printers.length > 0 ? (
                <select
                  value={printerId}
                  onChange={(e) => setPrinterId(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  <option value="">Select a printer</option>
                  {printers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={printerId}
                  onChange={(e) => setPrinterId(e.target.value)}
                  placeholder="Enter Printer ID"
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
              )}
              <button
                onClick={savePrinterId}
                disabled={loading}
                className="px-4 py-2 bg-wk-red text-white rounded-lg"
              >
                Save
              </button>
            </div>
            {printers.length === 0 && settings.printnode_api_key && (
              <button
                onClick={fetchPrinters}
                className="text-sm text-blue-600 underline mt-1"
              >
                Load printers
              </button>
            )}
          </div>

          {/* Test Print */}
          {settings.printnode_api_key && settings.printnode_printer_id && (
            <div className="pt-4 border-t">
              <button
                onClick={testPrint}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium"
              >
                {loading ? 'Printing...' : 'Test Print'}
              </button>
              {testStatus && (
                <p className={`mt-2 ${testStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testStatus.message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Setup Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Create a <a href="https://www.printnode.com" target="_blank" rel="noopener" className="text-blue-600 underline">PrintNode account</a> ($10/month)</li>
          <li>Download and install the PrintNode client on the restaurant computer</li>
          <li>Connect the receipt printer to that computer</li>
          <li>Get your API key from the PrintNode dashboard</li>
          <li>Enter the API key above and select your printer</li>
          <li>Click "Test Print" to verify it works</li>
        </ol>
      </div>
    </div>
  )
}
