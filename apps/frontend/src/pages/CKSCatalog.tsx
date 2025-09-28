import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCatalogItems, type CatalogItem } from "../shared/api/catalog";
import { useCart } from "../contexts/CartContext";
import { createHubOrder } from "../shared/api/hub";
import { useAuth, useUser } from "@clerk/clerk-react";

type CatalogKind = "products" | "services";

function formatProductInfo(item: CatalogItem): string | undefined {
  if (item.type !== "product") {
    return undefined;
  }
  // Show unit of measure or package info instead of price
  if (item.product?.packageSize) {
    return item.product.packageSize;
  }
  if (item.unitOfMeasure) {
    return `Unit: ${item.unitOfMeasure}`;
  }
  return undefined;
}

function formatDuration(item: CatalogItem): string | undefined {
  if (item.type !== "service" || !item.service?.durationMinutes) {
    return undefined;
  }
  const minutes = item.service.durationMinutes;
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours}${hours === 1 ? " hr" : " hrs"}`;
  }
  return `${minutes} min`;
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium border ${
        active ? "bg-black text-white border-black" : "bg-white text-black border-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function Card({
  item,
  onView,
  onAdd,
  isInCart,
}: {
  item: CatalogItem;
  onView: () => void;
  onAdd: () => void;
  isInCart: boolean;
}) {
  const subtitle = item.type === "product" ? formatProductInfo(item) : formatDuration(item);

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] w-full bg-gray-100 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex flex-col gap-2">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-gray-900 font-semibold leading-tight flex-1">{item.name}</h3>
              <span className="text-xs text-gray-700 font-mono bg-yellow-100 px-2 py-1 rounded font-semibold">{item.code}</span>
            </div>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onView}
              className="flex-1 h-9 px-3 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
            >
              View
            </button>
            <button
              onClick={onAdd}
              className={`flex-1 h-9 px-3 rounded-md text-sm transition-colors ${
                isInCart
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-black text-white hover:bg-neutral-800"
              }`}
            >
              {isInCart ? "Added" : "Add"}
            </button>
          </div>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 border border-gray-200">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DateSelectorModal({
  item,
  onClose,
  onConfirm
}: {
  item: CatalogItem;
  onClose: () => void;
  onConfirm: (date: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const [notes, setNotes] = useState("");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate) {
      onConfirm(selectedDate);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Schedule Service: {item.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Service Date
            </label>
            <input
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              rows={3}
              placeholder="Any special requirements..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-neutral-800"
            >
              Request Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CartPanel({ onClose, onCheckout }: { onClose: () => void; onCheckout: () => void }) {
  const cart = useCart();

  const totalItems = cart.getTotalItems();

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Product Order Cart</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {cart.items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Your cart is empty</p>
        ) : (
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.catalogCode} className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-500 font-mono">{item.catalogCode}</p>
                    {item.unitOfMeasure && (
                      <p className="text-sm text-gray-600">
                        Unit: {item.unitOfMeasure}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => cart.removeItem(item.catalogCode)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => cart.updateQuantity(item.catalogCode, item.quantity - 1)}
                    className="w-8 h-8 border rounded hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-12 text-center">{item.quantity}</span>
                  <button
                    onClick={() => cart.updateQuantity(item.catalogCode, item.quantity + 1)}
                    className="w-8 h-8 border rounded hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.items.length > 0 && (
        <div className="border-t p-4">
          <div className="flex justify-between mb-4">
            <span className="font-semibold">Total Items:</span>
            <span className="font-semibold">{totalItems}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full bg-black text-white py-2 rounded-md hover:bg-neutral-800"
          >
            Request Products
          </button>
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 24;

export default function CKSCatalog() {
  const [kind, setKind] = useState<CatalogKind>("products");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [selectedService, setSelectedService] = useState<CatalogItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const cart = useCart();
  const { getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(handle);
  }, [query]);

  const params = useMemo(
    () => ({
      type: kind === "products" ? "product" : "service",
      q: debouncedQuery || undefined,
      page: 1,
      pageSize: PAGE_SIZE,
    }),
    [kind, debouncedQuery],
  );

  const { data, isLoading, error } = useCatalogItems(params);
  const items = data?.items ?? [];

  const handleAddProduct = (item: CatalogItem) => {
    cart.addItem(item);
  };

  const handleAddService = (item: CatalogItem) => {
    setSelectedService(item);
  };

  const handleServiceConfirm = async (date: string) => {
    if (!selectedService || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createHubOrder({
        orderType: "service",
        title: selectedService.name,
        expectedDate: date,
        items: [{
          catalogCode: selectedService.code,
          quantity: 1,
        }],
      });

      alert("Service order created successfully!");
      setSelectedService(null);
    } catch (error) {
      console.error("Failed to create service order:", error);
      alert("Failed to create service order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createHubOrder({
        orderType: "product",
        title: `Product Order - ${cart.items.length} items`,
        items: cart.items.map(item => ({
          catalogCode: item.catalogCode,
          quantity: item.quantity,
        })),
      });

      alert("Product order created successfully!");
      cart.clearCart();
      setShowCart(false);
    } catch (error) {
      console.error("Failed to create product order:", error);
      alert("Failed to create product order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cartItemCount = cart.getTotalItems();

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              title="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">CKS Catalog</h1>
              <p className="text-sm text-gray-500 mt-1">Browse services and products available through CKS.</p>
            </div>
            <button
              onClick={() => navigate('/hub')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              title="Close catalog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <TabButton active={kind === "products"} onClick={() => setKind("products")}>
                Products
              </TabButton>
              <TabButton active={kind === "services"} onClick={() => setKind("services")}>
                Services
              </TabButton>
              {kind === "products" && cartItemCount > 0 && (
                <button
                  onClick={() => setShowCart(true)}
                  className="ml-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 relative"
                >
                  Cart ({cartItemCount})
                </button>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="relative max-w-xl">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${kind}...`}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="text-center text-red-500 py-16">Unable to load catalog. Please try again.</div>
        ) : isLoading ? (
          <div className="text-center text-gray-500 py-16">Loading catalog...</div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-500 py-16">No {kind} found.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <Card
                key={item.code}
                item={item}
                onView={() => alert(`${item.type === "product" ? "Product" : "Service"}: ${item.name}\n\n${item.description || 'No description available.'}`)}
                onAdd={() => item.type === "product" ? handleAddProduct(item) : handleAddService(item)}
                isInCart={cart.isInCart(item.code)}
              />
            ))}
          </div>
        )}
      </div>

      {showCart && (
        <CartPanel
          onClose={() => setShowCart(false)}
          onCheckout={handleCheckout}
        />
      )}

      {selectedService && (
        <DateSelectorModal
          item={selectedService}
          onClose={() => setSelectedService(null)}
          onConfirm={handleServiceConfirm}
        />
      )}
    </div>
  );
}