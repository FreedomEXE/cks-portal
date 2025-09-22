import React, { useMemo, useState } from 'react';

type CatalogKind = 'products' | 'services';

type BaseItem = {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  imageUrl?: string;
};

type Product = BaseItem & {
  price?: string;
  sku?: string;
};

type Service = BaseItem & {
  duration?: string; // e.g. "2 hrs"
};

const mockProducts: Product[] = [
  { id: 'p1', name: 'Syringes', price: '$12.00 / box', tags: ['medical', 'consumable'], imageUrl: 'https://picsum.photos/seed/syringe/600/400' },
  { id: 'p2', name: 'Antigen Test Kit', price: '$39.00', tags: ['testing'], imageUrl: 'https://picsum.photos/seed/antigen/600/400' },
  { id: 'p3', name: 'Isolation Gown', price: '$15.50', tags: ['ppe'], imageUrl: 'https://picsum.photos/seed/gown/600/400' },
  { id: 'p4', name: '3-Ply Masks', price: '$9.99 / 50', tags: ['ppe'], imageUrl: 'https://picsum.photos/seed/masks/600/400' },
  { id: 'p5', name: 'Hand Sanitizer', price: '$4.99', tags: ['hygiene'], imageUrl: 'https://picsum.photos/seed/sanitizer/600/400' },
];

const mockServices: Service[] = [
  { id: 's1', name: 'Equipment Maintenance', duration: '2 hrs', tags: ['service', 'maintenance'], imageUrl: 'https://picsum.photos/seed/maintenance/600/400' },
  { id: 's2', name: 'On-site Training', duration: 'Half-day', tags: ['service', 'training'], imageUrl: 'https://picsum.photos/seed/training/600/400' },
  { id: 's3', name: 'Inventory Audit', duration: '1 day', tags: ['service', 'audit'], imageUrl: 'https://picsum.photos/seed/audit/600/400' },
];

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium border ${
        active ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function Card({
  title,
  subtitle,
  tags,
  imageUrl,
  onView,
}: {
  title: string;
  subtitle?: string;
  tags?: string[];
  imageUrl?: string;
  onView: () => void;
}) {
  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] w-full bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-gray-900 font-semibold leading-tight">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onView} className="h-9 px-3 rounded-md bg-black text-white text-sm hover:bg-neutral-800 transition-colors">
            View
          </button>
        </div>
        {tags && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
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

export default function CKSCatalog() {
  const [kind, setKind] = useState<CatalogKind>('products');
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const base = kind === 'products' ? mockProducts : mockServices;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      (i.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [kind, query]);

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CKS Catalog</h1>
              <p className="text-sm text-gray-500 mt-1">Browse services and products available through CKS.</p>
            </div>
            <div className="flex items-center gap-2">
              <TabButton active={kind === 'products'} onClick={() => setKind('products')}>Products</TabButton>
              <TabButton active={kind === 'services'} onClick={() => setKind('services')}>Services</TabButton>
            </div>
          </div>
          {/* Search */}
          <div className="mt-4">
            <div className="relative max-w-xl">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${kind}...`}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 placeholder:text-gray-400"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-16">No {kind} found.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              <Card
                key={it.id}
                title={it.name}
                subtitle={
                  'price' in it && it.price ? it.price : 'duration' in it && it.duration ? it.duration : undefined
                }
                tags={it.tags}
                imageUrl={it.imageUrl}
                onView={() => alert(`${kind === 'products' ? 'Product' : 'Service'}: ${it.name}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
