import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSWRConfig } from 'swr';
import { useCatalogItems, type CatalogItem } from "../shared/api/catalog";
import { useCart } from "../contexts/CartContext";
import { createHubOrder } from "../shared/api/hub";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useAuth as useCksAuth } from "@cks/auth";
import { useHubRoleScope } from "../shared/api/hub";
import { useLoading } from "../contexts/LoadingContext";
import { useHubLoading } from "../contexts/HubLoadingContext";
import { useModals } from "../contexts/ModalProvider";
import { Button } from "@cks/ui";
import { fetchHubOrders } from "../shared/api/hub";

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

  // Determine card styling based on type and managedBy
  const getCardStyle = () => {
    if (item.type === 'product') {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        badge: { text: 'CKS Product', color: 'bg-green-100 text-green-700 border-green-300' }
      };
    }
    if (item.type === 'service') {
      // Keep color coding but use unified "CKS Service" badge
      if (item.managedBy === 'warehouse') {
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          badge: { text: 'CKS Service', color: 'bg-purple-100 text-purple-700 border-purple-300' }
        };
      }
      if (item.managedBy === 'manager') {
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          badge: { text: 'CKS Service', color: 'bg-blue-100 text-blue-700 border-blue-300' }
        };
      }
    }
    // Default fallback
    return {
      bg: 'bg-white',
      border: 'border-gray-200',
      badge: null
    };
  };

  const cardStyle = getCardStyle();

  // Limit visible tags to keep card heights consistent across the grid
  const allTags = Array.isArray(item.tags) ? item.tags : [];
  const maxTags = 3;
  const displayTags = allTags.slice(0, maxTags);
  const extraTags = Math.max(0, allTags.length - displayTags.length);

  return (
    <div className={`group ${cardStyle.bg} rounded-xl border ${cardStyle.border} shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full`}>
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
      <div className="p-4 flex flex-col min-h-[180px]">
        {/* Title + subtitle + badge area: fixed height to align buttons across cards */}
        <div className="flex-1">
          <div className="h-[100px] flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-gray-900 font-semibold leading-tight flex-1 line-clamp-2">{item.name}</h3>
              <span className="text-xs text-gray-700 font-mono bg-yellow-100 px-2 py-1 rounded font-semibold shrink-0">{item.code}</span>
            </div>
            <p className={`text-sm text-gray-500 ${subtitle ? '' : 'invisible'}`}>{subtitle ?? 'placeholder'}</p>
            {cardStyle.badge ? (
              <span className={`inline-flex self-start items-center text-xs px-2 py-1 rounded border font-medium ${cardStyle.badge.color}`}>
                {cardStyle.badge.text}
              </span>
            ) : (
              <span className="inline-flex self-start items-center text-xs px-2 py-1 rounded border font-medium invisible">placeholder</span>
            )}
          </div>
        </div>

        {/* Buttons - Always at same position */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={onView}
            className="flex-1 h-9 px-3 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            View
          </button>
          <button
            onClick={onAdd}
            className={`flex-1 h-9 px-3 rounded-md text-sm font-medium transition-colors ${
              isInCart
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-black text-white hover:bg-neutral-800"
            }`}
          >
            {isInCart ? "Added" : "Add"}
          </button>
        </div>

        {/* Tags - limit count to keep row heights aligned */}
        {displayTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {displayTags.map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 border border-gray-200">
                {t}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 border border-gray-200">
                +{extraTags} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DateSelectorModal({
  item,
  onClose,
  onConfirm,
  role,
  defaultDestination,
  customers,
  centers,
}: {
  item: CatalogItem;
  onClose: () => void;
  onConfirm: (
    availability: { tz: string; days: string[]; window: { start: string; end: string } },
    notes?: string | null,
    destination?: { code: string; role: 'center' } | undefined,
  ) => void;
  role: string | null;
  defaultDestination: string | null;
  customers: DestinationOption[];
  centers: DestinationOption[];
}) {
  const [days, setDays] = useState<string[]>([]);
  const [start, setStart] = useState<string>('09:00');
  const [end, setEnd] = useState<string>('17:00');
  const [notes, setNotes] = useState('');
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(defaultDestination);

  // Match CheckoutModal logic: always show for contractors, managers, customers, crew
  const needsDestination = useMemo(() => {
    const r = (role || '').trim().toLowerCase();
    if (!r) return (centers?.length || 0) > 0;
    if (r === 'center') return false; // Center orders auto-destination
    if (r === 'customer') return true;
    if (r === 'crew') return true;
    if (r === 'contractor' || r === 'manager') return true;
    return (centers?.length || 0) > 0;
  }, [role, centers]);

  const toggleDay = (d: string) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end || days.length === 0) {
      alert('Please select at least one day and a time range.');
      return;
    }
    let destination: { code: string; role: 'center' } | undefined = undefined;
    const r = (role || '').trim().toLowerCase();
    if (needsDestination) {
      const chosen = selectedCenter || defaultDestination || null;
      if (!chosen) {
        alert('Please select a destination center.');
        return;
      }
      destination = { code: chosen, role: 'center' };
    }
    onConfirm({ tz: browserTz, days, window: { start, end } }, notes?.trim() ? notes.trim() : undefined, destination);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Schedule Service: {item.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Availability Window</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {['mon','tue','wed','thu','fri','sat','sun'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`px-2 py-1 rounded border text-xs ${days.includes(d) ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'}`}
                >
                  {d.toUpperCase()}
                </button>
              ))}
              <button type="button" onClick={() => setDays(['mon','tue','wed','thu','fri'])} className="px-2 py-1 rounded border text-xs bg-gray-100 border-gray-300 text-gray-700">Mon–Fri</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">From</label>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <label className="text-sm text-gray-700">to</label>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <span className="ml-2 text-xs text-gray-500">{browserTz}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Provide your general availability. The manager will set the exact schedule when creating the service.</p>
          </div>
          {needsDestination && (
            <div className="mb-4">
              <div className="font-semibold mb-2">Destination</div>
              {(role === 'contractor' || role === 'manager') && (
                <div className="mb-2">
                  <label className="block text-sm text-gray-700 mb-1">Customer</label>
                  <select
                    value={selectedCustomer || ''}
                    onChange={(e) => {
                      const v = e.target.value || null;
                      setSelectedCustomer(v);
                      setSelectedCenter(null);
                    }}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{`${c.id}${c.name ? ` - ${c.name}` : ''}`}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Center</label>
                <select
                  value={selectedCenter || ''}
                  onChange={(e) => setSelectedCenter(e.target.value || null)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select center</option>
                  {centers
                    .filter((c) => !selectedCustomer || c.customerId === selectedCustomer)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{`${c.id}${c.name ? ` - ${c.name}` : ''}`}</option>
                    ))}
                </select>
              </div>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black" rows={3} placeholder="Buzz 8008, come to back door..." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-neutral-800">Request Service</button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DestinationOption = { id: string; name: string | null; customerId?: string | null };

type ServiceOption = {
  id: string;
  name: string | null;
  centerId?: string | null;
  centerName?: string | null;
  customerId?: string | null;
  contractorId?: string | null;
};

function CartPanel({
  onClose,
  onCheckout,
  role,
  prefillServiceId,
  defaultDestination,
  centers,
  customers,
  services,
  contractors,
}: {
  onClose: () => void;
  onCheckout: (
    availability: { tz: string; days: string[]; window: { start: string; end: string } },
    notes?: string | null,
    destination?: { code: string; role: 'center' },
    serviceId?: string | null
  ) => void;
  role: string | null;
  prefillServiceId?: string;
  defaultDestination: string | null;
  centers: DestinationOption[];
  customers: { id: string; name: string | null; contractorId?: string | null }[];
  services: ServiceOption[];
  contractors?: { id: string; name: string | null }[];
}) {
  const cart = useCart();

  const totalItems = cart.getTotalItems();
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [days, setDays] = useState<string[]>(['mon','tue','wed','thu','fri']);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [notes, setNotes] = useState<string>('');
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(customers.length === 1 ? customers[0].id : null);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(defaultDestination ?? null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  useEffect(() => {
    if (prefillServiceId && services.some(s => (s.id || '').toUpperCase() === prefillServiceId)) {
      setSelectedService(prefillServiceId);
    }
  }, [prefillServiceId, services]);

  useEffect(() => {
    if (!selectedCenter && centers && centers.length === 1) {
      setSelectedCenter(centers[0].id);
    }
  }, [centers, selectedCenter]);

  // Auto-fill when service is selected
  useEffect(() => {
    if (selectedService) {
      const service = services.find(s => s.id === selectedService);
      if (service) {
        // Auto-fill contractor (for managers)
        if (service.contractorId && role === 'manager') {
          setSelectedContractor(service.contractorId);
        }
        // Auto-fill customer (for contractor/manager roles)
        if (service.customerId && (role === 'contractor' || role === 'manager')) {
          setSelectedCustomer(service.customerId);
        }
        // Auto-fill center
        if (service.centerId) {
          setSelectedCenter(service.centerId);
        }
      }
    }
  }, [selectedService, services, role]);
  // Cascading filtered lists
  const filteredCustomers = useMemo(() => {
    const r = (role || '').trim().toLowerCase();
    if (r === 'manager') {
      if (selectedContractor) {
        return customers.filter((c) => (c.contractorId || '').toUpperCase() === selectedContractor.toUpperCase());
      }
      return customers;
    }
    return customers;
  }, [customers, role, selectedContractor]);

  const filteredCenters = useMemo(() => {
    if (selectedCustomer) {
      return centers.filter((c) => (c.customerId || '').toUpperCase() === selectedCustomer.toUpperCase());
    }
    return centers;
  }, [centers, selectedCustomer]);

  const needsDestination = useMemo(() => {
    const r = (role || '').trim().toLowerCase();
    if (!r) {
      return (centers?.length || 0) > 0;
    }
    if (r === 'center') return false; // Center orders auto-destination
    if (r === 'customer') return true;
    if (r === 'crew') return true;
    if (r === 'contractor' || r === 'manager') return true;
    return (centers?.length || 0) > 0;
  }, [role, centers]);

  const toggleDay = (d: string) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

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
          <div className="mb-4">
            <div className="font-semibold mb-2">Availability Window</div>
            <div className="text-xs text-gray-600 mb-2">Timezone: {browserTz}</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {['mon','tue','wed','thu','fri','sat','sun'].map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`px-2 py-1 rounded border text-xs ${days.includes(d) ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'}`}
                >
                  {d.toUpperCase()}
                </button>
              ))}
              <button
                onClick={() => setDays(['mon','tue','wed','thu','fri'])}
                className="px-2 py-1 rounded border text-xs bg-gray-100 border-gray-300 text-gray-700"
              >
                Mon–Fri
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">From</label>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <label className="text-sm text-gray-700">to</label>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            </div>
          </div>
          {/* Service selection (optional) */}
          {services.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold mb-2">Service (Optional)</div>
              <select
                value={selectedService || ''}
                onChange={(e) => {
                  const v = e.target.value || null;
                  setSelectedService(v);
                  // If cleared, don't reset customer/center - user might want to keep them
                }}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Select service (or order for center in general)</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {`${s.id}${s.name ? ` - ${s.name}` : ''}${s.centerName ? ` (${s.centerName})` : ''}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a service to link this order, or leave blank for a general center order
              </p>
            </div>
          )}

          {/* Smart Cascading Destination Selector */}
          {needsDestination && (
            <div className="mb-4">
              <div className="font-semibold mb-2">Destination</div>

              {/* Manager: Contractor → Customer → Center (Progressive Disclosure) */}
              {role === 'manager' && (
                <>
                  <div className="mb-2">
                    <label className="block text-sm text-gray-700 mb-1">Contractor</label>
                    <select
                      value={selectedContractor || ''}
                      onChange={(e) => {
                        const v = e.target.value || null;
                        setSelectedContractor(v);
                        setSelectedCustomer(null);
                        setSelectedCenter(null);
                      }}
                      disabled={!!selectedService}
                      className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select contractor</option>
                      {contractors && contractors.map((c) => (
                        <option key={c.id} value={c.id}>{`${c.id}${c.name ? ` - ${c.name}` : ''}`}</option>
                      ))}
                    </select>
                    {selectedService && (
                      <p className="text-xs text-gray-500 mt-1">Auto-filled from selected service</p>
                    )}
                  </div>
                  {/* Only show Customer after Contractor is selected */}
                  {(selectedContractor || selectedService) && (
                    <div className="mb-2">
                      <label className="block text-sm text-gray-700 mb-1">Customer</label>
                      <select
                        value={selectedCustomer || ''}
                        onChange={(e) => {
                          const v = e.target.value || null;
                          setSelectedCustomer(v);
                          setSelectedCenter(null);
                        }}
                        disabled={!!selectedService}
                        className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select customer</option>
                        {filteredCustomers.map((c) => (
                          <option key={c.id} value={c.id}>{`${c.id}${c.name ? ` - ${c.name}` : ''}`}</option>
                        ))}
                      </select>
                      {selectedService && (
                        <p className="text-xs text-gray-500 mt-1">Auto-filled from selected service</p>
                      )}
                    </div>
                  )}
                  {/* Only show Center after Customer is selected */}
                  {(selectedCustomer || selectedService) && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Center</label>
                      <select
                        value={selectedCenter || ''}
                        onChange={(e) => setSelectedCenter(e.target.value || null)}
                        disabled={!!selectedService}
                        className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select center</option>
                        {filteredCenters.map((c) => (
                          <option key={c.id} value={c.id}>{`${c.id}${c.name ? ` - ${c.name}` : ''}`}</option>
                        ))}
                      </select>
                      {selectedService && (
                        <p className="text-xs text-gray-500 mt-1">Auto-filled from selected service</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Contractor: Customer → Center (Progressive Disclosure) */}
              {role === 'contractor' && (
                <>
                  <div className="mb-2">
                    <label className="block text-sm text-gray-700 mb-1">Customer</label>
                    <select
                      value={selectedCustomer || ''}
                      onChange={(e) => {
                        const v = e.target.value || null;
                        setSelectedCustomer(v);
                        setSelectedCenter(null);
                      }}
                      disabled={!!selectedService}
                      className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{`${c.id}${c.name ? ` - ${c.name}` : ''}`}</option>
                      ))}
                    </select>
                    {selectedService && (
                      <p className="text-xs text-gray-500 mt-1">Auto-filled from selected service</p>
                    )}
                  </div>
                  {/* Only show Center after Customer is selected */}
                  {(selectedCustomer || selectedService) && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Center</label>
                      <select
                        value={selectedCenter || ''}
                        onChange={(e) => setSelectedCenter(e.target.value || null)}
                        disabled={!!selectedService}
                        className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select center</option>
                        {filteredCenters.map((c) => (
                          <option key={c.id} value={c.id}>{`${c.id}${c.name ? ` - ${c.name}` : ''}`}</option>
                        ))}
                      </select>
                      {selectedService && (
                        <p className="text-xs text-gray-500 mt-1">Auto-filled from selected service</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Customer/Crew: Just Center */}
              {(role === 'customer' || role === 'crew') && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Center</label>
                  <select
                    value={selectedCenter || ''}
                    onChange={(e) => setSelectedCenter(e.target.value || null)}
                    disabled={!!selectedService}
                    className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select center</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>{`${c.id}${c.name ? ` - ${c.name}` : ''}`}</option>
                    ))}
                  </select>
                  {selectedService && (
                    <p className="text-xs text-gray-500 mt-1">Auto-filled from selected service</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mb-4">
            <div className="font-semibold mb-2">Special Instructions (optional)</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add delivery details or special instructions..."
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div className="flex justify-between mb-4">
            <span className="font-semibold">Total Items:</span>
            <span className="font-semibold">{totalItems}</span>
          </div>
          {(() => {
            const r = (role || '').trim().toLowerCase();
            const needsDestination = r && r !== 'center';
            const hasDestination = !!(selectedCenter || defaultDestination);
            const isDisabled = needsDestination && !hasDestination;

            return (
              <>
                {isDisabled && centers.length === 0 && (
                  <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    Your account isn't linked to a center. Please contact your admin.
                  </div>
                )}
                <button
                  onClick={() => {
                    if (isDisabled) {
                      toast.error('Your account isn\'t linked to a center. Please contact your admin.');
                      return;
                    }
                    const availability = { tz: browserTz, days, window: { start, end } };
                    let destination: { code: string; role: 'center' } | undefined = undefined;
                    if (needsDestination) {
                      const chosen = selectedCenter || defaultDestination || null;
                      if (!chosen) {
                        toast.error('Please select a destination center before submitting.');
                        return;
                      }
                      destination = { code: chosen, role: 'center' };
                    }
                    onCheckout(availability, notes, destination, selectedService);
                  }}
                  disabled={isDisabled}
                  className={`w-full py-2 rounded-md ${
                    isDisabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  Request Products
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 20;

export default function CKSCatalog() {
  const navigate = useNavigate();
  const cart = useCart();
  const { getToken } = useClerkAuth();
  const { user } = useUser();
  const { role: authRole, code: authCode} = useCksAuth();
  const normalizedCode = useMemo(() => (authCode ? authCode.trim().toUpperCase() : null), [authCode]);
  const { data: scope } = useHubRoleScope(normalizedCode || undefined);
  const { mutate } = useSWRConfig();
  const { start } = useLoading();
  const { setHubLoading } = useHubLoading();
  const modals = useModals();

  // Read mode from URL params: ?mode=products or ?mode=services
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const catalogMode = useMemo(() => {
    const mode = searchParams.get('mode');
    if (mode === 'products' || mode === 'services') return mode;
    return null; // null = full catalog (both tabs visible)
  }, [searchParams]);
  const selectedServiceIdFromQuery = useMemo(() => {
    const sid = searchParams.get('serviceId');
    return sid && sid.trim().length > 0 ? sid.toUpperCase() : null;
  }, [searchParams]);

  const [kind, setKind] = useState<CatalogKind>(catalogMode === 'services' ? 'services' : 'products');
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCart, setShowCart] = useState(false);
  // Auto-open cart when navigated with serviceId (products mode)
  useEffect(() => {
    if (selectedServiceIdFromQuery && catalogMode === 'products') {
      setShowCart(true);
    }
  }, [selectedServiceIdFromQuery, catalogMode]);
  const [selectedService, setSelectedService] = useState<CatalogItem | null>(null);
  // Legacy product modal state removed; use universal modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managerServices, setManagerServices] = useState<ServiceOption[]>([]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    setCurrentPage(1);
  }, [kind, debouncedQuery, selectedCategory]);

  // Fetch active services for managers/contractors when cart is opened
  useEffect(() => {
    if (!showCart || !authRole || !normalizedCode) return;
    const r = authRole.toLowerCase();
    if (r !== 'manager' && r !== 'contractor') return;

    // Fetch orders and derive active services
    (async () => {
      try {
        const ordersData = await fetchHubOrders(normalizedCode);
        const serviceOrders = ordersData.serviceOrders || [];

        // Extract active services from transformed orders
        const activeServices = serviceOrders
          .filter((order) => {
            const serviceId = (order as any).serviceId || (order as any).transformedId;
            if (!serviceId) return false;
            const meta = (order as any).metadata || {};
            const svcStatus = (meta.serviceStatus || '').toLowerCase();
            return svcStatus === 'created' || svcStatus === 'in_progress' || svcStatus === 'in-progress';
          })
          .map((order) => {
            const serviceId = (order as any).serviceId || (order as any).transformedId;
            const meta = (order as any).metadata || {};
            const centerId = order.centerId || order.destination || null;

            return {
              id: serviceId,
              name: order.title || null,
              centerId: centerId,
              centerName: meta.centerName || null,
              customerId: meta.customerId || order.customerId || null,
              contractorId: meta.contractorId || null,
            };
          });

        setManagerServices(activeServices);
      } catch (err) {
        console.error('Failed to fetch services for manager/contractor', err);
      }
    })();
  }, [showCart, authRole, normalizedCode]);

  const params = useMemo(
    () => ({
      type: kind === "products" ? "product" : "service",
      category: selectedCategory || undefined,
      q: debouncedQuery || undefined,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    [kind, selectedCategory, debouncedQuery, currentPage],
  );

  const { data, isLoading, error } = useCatalogItems(params);
  const items = data?.items ?? [];
  const categories = useMemo(() => {
    const unique = new Set(items.map((item) => item.category).filter((value): value is string => Boolean(value)));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [items]);
  const pageData = data?.page ?? null;
  const total = pageData?.total ?? 0;
  const limit = pageData?.limit ?? PAGE_SIZE;
  const offset = pageData?.offset ?? 0;
  const hasMore = pageData?.hasMore ?? false;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showingFrom = total === 0 ? 0 : offset + 1;
  const showingTo = total === 0 ? 0 : Math.min(offset + items.length, total);

  // Manage loader based on catalog loading state
  useEffect(() => {
    let endLoader: (() => void) | null = null;

    if (isLoading) {
      endLoader = start();
    }

    return () => {
      if (endLoader) {
        endLoader();
      }
    };
  }, [isLoading, start]);

  const handleAddProduct = (item: CatalogItem) => {
    cart.addItem(item);
  };

  const handleAddService = (item: CatalogItem) => {
    setSelectedService(item);
  };

  const handleServiceConfirm = async (
    availability: { tz: string; days: string[]; window: { start: string; end: string } },
    notes?: string | null,
    destination?: { code: string; role: 'center' }
  ) => {
    if (!selectedService || isSubmitting) return;

    // Guard: destination required for non-center roles
    const r = (authRole || '').toLowerCase();
    const needsDestination = r && r !== 'center';
    if (needsDestination && !destination?.code) {
      toast.error('Please select a destination center before submitting.');
      return;
    }

    setIsSubmitting(true);
    setHubLoading(true); // Start loading immediately
    try {
      const result = await createHubOrder({
        orderType: "service",
        title: selectedService.name,
        notes: notes || undefined,
        destination: destination ? { code: destination.code, role: destination.role } : undefined,
        metadata: { availability },
        items: [{
          catalogCode: selectedService.code,
          quantity: 1,
        }],
      });

      const newOrder = result as any;
      const orderId = newOrder?.orderId || 'Unknown';
      toast.success(`Service order ${orderId} created successfully!`);
      setSelectedService(null);

      // Optimistically update cache with new order
      if (normalizedCode) {
        mutate(
          `/hub/orders/${normalizedCode}`,
          (current: any) => {
            if (!current) return current;
            return {
              ...current,
              orders: [newOrder, ...(current.orders || [])],
              serviceOrders: [newOrder, ...(current.serviceOrders || [])],
            };
          },
          { revalidate: false }
        );
      }

      // Redirect to hub with orders tab open
      navigate('/hub', { state: { openTab: 'orders' } });
    } catch (error) {
      console.error("Failed to create service order:", error);
      let message = "Failed to create service order. Please try again.";
      if (error instanceof Error && typeof error.message === 'string' && error.message.trim().length > 0) {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed && typeof parsed.error === 'string' && parsed.error.trim().length > 0) {
            message = parsed.error;
          }
        } catch (_) {
          message = error.message;
        }
      }
      toast.error(message);
      setHubLoading(false); // Turn off loading on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async (
    availability?: { tz: string; days: string[]; window: { start: string; end: string } },
    notesInput?: string | null,
    destination?: { code: string; role: 'center' },
    serviceId?: string | null
  ) => {
    if (cart.items.length === 0 || isSubmitting) return;

    // Guard: destination required for non-center roles
    const r = (authRole || '').toLowerCase();
    const needsDestination = r && r !== 'center';
    if (needsDestination && !destination?.code) {
      toast.error('Please select a destination center before submitting.');
      return;
    }

    setIsSubmitting(true);
    setHubLoading(true); // Start loading immediately
    try {
      const result = await createHubOrder({
        orderType: "product",
        title: `Product Order - ${cart.items.length} items`,
        notes: (notesInput && notesInput.trim().length > 0) ? notesInput.trim() : undefined,
        destination: destination ? { code: destination.code, role: destination.role } : undefined,
        metadata: availability ? { availability, ...(serviceId ? { serviceId } : {}) } : (serviceId ? { serviceId } : undefined),
        items: cart.items.map(item => ({
          catalogCode: item.catalogCode,
          quantity: item.quantity,
        })),
      });

      const newOrder = result as any;
      const orderId = newOrder?.orderId || 'Unknown';
      toast.success(`Product order ${orderId} created successfully!`);
      cart.clearCart();
      setShowCart(false);

      // Optimistically update cache with new order
      if (normalizedCode) {
        mutate(
          `/hub/orders/${normalizedCode}`,
          (current: any) => {
            if (!current) return current;
            return {
              ...current,
              orders: [newOrder, ...(current.orders || [])],
              productOrders: [newOrder, ...(current.productOrders || [])],
            };
          },
          { revalidate: false }
        );
      }

      // Redirect to hub with orders tab open
      navigate('/hub', { state: { openTab: 'orders' } });
    } catch (error) {
      console.error("Failed to create product order:", error);
      let message = "Failed to create product order. Please try again.";
      if (error instanceof Error && typeof error.message === 'string' && error.message.trim().length > 0) {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed && typeof parsed.error === 'string' && parsed.error.trim().length > 0) {
            message = parsed.error;
          }
        } catch (_) {
          // error.message might already be plain text
          message = error.message;
        }
      }
      toast.error(message);
      setHubLoading(false); // Turn off loading on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const cartItemCount = cart.getTotalItems();

  return (
    <div className="min-h-screen bg-transparent">
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
              {/* Only show tabs if not in filtered mode */}
              {!catalogMode && (
                <>
                  <TabButton active={kind === "products"} onClick={() => setKind("products")}>
                    Products
                  </TabButton>
                  <TabButton active={kind === "services"} onClick={() => setKind("services")}>
                    Services
                  </TabButton>
                </>
              )}
              {/* Show current view label when in filtered mode */}
              {catalogMode && (
                <div className="px-4 py-2 text-sm font-semibold text-gray-900">
                  {catalogMode === 'products' ? 'Products' : 'Services'}
                </div>
              )}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${kind}...`}
                className="w-full sm:max-w-xl rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 placeholder:text-gray-400"
              />
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full sm:w-64 rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="text-center text-red-500 py-16">Unable to load catalog. Please try again.</div>
        ) : isLoading ? (
          null
        ) : items.length === 0 ? (
          <div className="text-center text-gray-500 py-16">No {kind} found.</div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{showingFrom}-{showingTo}</span> of{" "}
                <span className="font-semibold">{total}</span> items
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1 || isLoading}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-sm text-gray-600 min-w-[110px] text-center">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={!hasMore || isLoading}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <Card
                  key={item.code}
                  item={item}
                  onView={() => {
                    if (item.type === 'service') {
                      modals.openById(item.code);
                    } else {
                      modals.openEntityModal('product', item.code);
                    }
                  }}
                  onAdd={() => item.type === "product" ? handleAddProduct(item) : handleAddService(item)}
                  isInCart={cart.isInCart(item.code)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {showCart && (
        <CartPanel
          onClose={() => setShowCart(false)}
          onCheckout={handleCheckout}
          role={authRole}
          prefillServiceId={selectedServiceIdFromQuery || undefined}
          defaultDestination={(() => {
            const r = (authRole || '').toLowerCase();
            // Crew: single center (if provided via scope)
            if (r === 'crew') {
              const rel = (scope as any)?.relationships || {};
              const center = rel.center || null;
              if (center?.id) return center.id;
              if (Array.isArray(rel.centers) && rel.centers.length > 0) return rel.centers[0].id;
              return null;
            }
            // Customer: if exactly one center, default
            if (r === 'customer') {
              const centers = (scope as any)?.relationships?.centers || [];
              return centers.length === 1 ? centers[0].id : null;
            }
            return null;
          })()}
          customers={(() => {
            const r = (authRole || '').toLowerCase();
            if (r === 'contractor' || r === 'manager') {
              return ((scope as any)?.relationships?.customers || []).map((c: any) => ({
                id: c.id,
                name: c.name || c.id,
                contractorId: c.contractorId || null
              }));
            }
            if (r === 'customer') {
              const customer = (scope as any)?.relationships?.customer;
              return customer ? [{ id: customer.id, name: customer.name || customer.id }] : [];
            }
            return [];
          })()}
          contractors={(() => {
            const r = (authRole || '').toLowerCase();
            if (r === 'manager') {
              return ((scope as any)?.relationships?.contractors || []).map((c: any) => ({
                id: c.id,
                name: c.name || c.id
              }));
            }
            return [];
          })()}
          centers={(() => {
            const r = (authRole || '').toLowerCase();
            if (r === 'manager') {
              const list = (scope as any)?.relationships?.centers || [];
              return list.map((x: any) => ({ id: x.id, name: x.name || x.id, customerId: x.customerId || null }));
            }
            if (r === 'contractor') {
              const list = (scope as any)?.relationships?.centers || [];
              return list.map((x: any) => ({ id: x.id, name: x.name || x.id, customerId: x.customerId || null }));
            }
            if (r === 'customer') {
              const list = (scope as any)?.relationships?.centers || [];
              return list.map((x: any) => ({ id: x.id, name: x.name || x.id }));
            }
            if (r === 'crew') {
              const rel = (scope as any)?.relationships || {};
              const list = Array.isArray(rel.centers) && rel.centers.length > 0 ? rel.centers : (rel.center ? [rel.center] : []);
              return list.map((x: any) => ({ id: x.id, name: x.name || x.id }));
            }
            // Fallbacks when role not resolved or no centers found
            const rel = (scope as any)?.relationships;
            if (rel?.center?.id) return [{ id: rel.center.id, name: rel.center.name || rel.center.id }];
            if (Array.isArray(rel?.centers) && rel.centers.length > 0) return rel.centers.map((x: any) => ({ id: x.id, name: x.name || x.id, customerId: x.customerId || null }));
            return [];
          })()}
          services={(() => {
            const r = (authRole || '').toLowerCase();
            const relationships = (scope as any)?.relationships || {};

            // For manager/contractor, use fetched services from orders
            if (r === 'manager' || r === 'contractor') {
              return managerServices;
            }

            // For customer/center/crew, use services from scope
            if (r === 'customer' || r === 'center' || r === 'crew') {
              const servicesList = relationships.services || [];
              // Filter to active services only (not completed/archived)
              return servicesList
                .filter((s: any) => {
                  const status = (s.status || '').toLowerCase();
                  return status !== 'completed' && status !== 'archived' && status !== 'cancelled';
                })
                .map((s: any) => {
                  // Extract metadata for auto-fill
                  const metadata = s.metadata || {};
                  return {
                    id: s.id,
                    name: s.name || null,
                    centerId: metadata.centerId || null,
                    centerName: metadata.centerName || null,
                    customerId: metadata.customerId || null,
                    contractorId: metadata.contractorId || null,
                  };
                });
            }

            return [];
          })()}
        />
      )}

      {selectedService && (
        <DateSelectorModal
          item={selectedService}
          onClose={() => setSelectedService(null)}
          onConfirm={handleServiceConfirm}
          role={authRole}
          defaultDestination={(() => {
            const r = (authRole || '').toLowerCase();
            // Prefer explicit role
            if (r === 'center') return normalizedCode;
            if (r === 'crew') {
              const center = (scope as any)?.relationships?.center;
              return center?.id || null;
            }
            // Fallback: infer from code prefix (CEN-xxx)
            if (normalizedCode && /^CEN-\d+$/i.test(normalizedCode)) {
              return normalizedCode;
            }
            // Fallback: scope may expose a single center relationship
            const rel = (scope as any)?.relationships;
            if (rel?.center?.id) return rel.center.id;
            if (Array.isArray(rel?.centers) && rel.centers.length === 1) return rel.centers[0].id;
            return null;
          })()}
          customers={(() => {
            const r = (authRole || '').toLowerCase();
            if (r === 'contractor' || r === 'manager') {
              return ((scope as any)?.relationships?.customers || []).map((c: any) => ({ id: c.id, name: c.name || c.id }));
            }
            if (r === 'customer') {
              const customer = (scope as any)?.relationships?.customer;
              return customer ? [{ id: customer.id, name: customer.name || customer.id }] : [];
            }
            // Fallback: provide customers list if available
            const rel = (scope as any)?.relationships;
            if (Array.isArray(rel?.customers) && rel.customers.length > 0) {
              return rel.customers.map((c: any) => ({ id: c.id, name: c.name || c.id }));
            }
            return [];
          })()}
          centers={(() => {
            const r = (authRole || '').toLowerCase();
            if (r === 'manager' || r === 'contractor') {
              const list = (scope as any)?.relationships?.centers || [];
              return list.map((x: any) => ({ id: x.id, name: x.name || x.id, customerId: x.customerId || null }));
            }
            if (r === 'customer') {
              const list = (scope as any)?.relationships?.centers || [];
              return list.map((x: any) => ({ id: x.id, name: x.name || x.id }));
            }
            if (r === 'center') {
              const center = (scope as any)?.relationships?.center || (scope as any)?.relationships?.centers?.[0];
              return center ? [{ id: center.id, name: center.name || center.id }] : [];
            }
            // Fallbacks when role not resolved
            const rel = (scope as any)?.relationships;
            if (rel?.center?.id) return [{ id: rel.center.id, name: rel.center.name || rel.center.id }];
            if (Array.isArray(rel?.centers) && rel.centers.length > 0) return rel.centers.map((x: any) => ({ id: x.id, name: x.name || x.id, customerId: x.customerId || null }));
            return [];
          })()}
        />
      )}

        {/* Product modal handled by universal modal via modals.openEntityModal */}
    </div>
  );
}


