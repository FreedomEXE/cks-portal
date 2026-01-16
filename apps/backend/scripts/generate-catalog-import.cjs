const fs = require('node:fs');
const path = require('node:path');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(value);
      value = '';
    } else if (ch === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (ch === '\r') {
      // Ignore CR
    } else {
      value += ch;
    }
  }

  if (value.length > 0 || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows.map((cols) => cols.map((col) => col.trim()));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(value) {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

function normalizeSpaces(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function inferUnitOfMeasure(pack) {
  if (!pack) return 'unit';
  const lower = pack.toLowerCase();
  if (lower.includes('each')) return 'each';
  if (lower.includes('box')) return 'box';
  if (lower.includes('case') || lower.includes('/cs') || lower.includes('cs')) return 'case';
  if (lower.includes('pack')) return 'pack';
  if (lower.includes('roll')) return 'roll';
  if (lower.includes('dozen')) return 'dozen';
  return 'unit';
}

function jsonLiteral(obj) {
  return JSON.stringify(obj).replace(/'/g, "''");
}

const PRODUCT_CATEGORY_TAGS = {
  'garbage-bags': ['waste', 'liners', 'janitorial'],
  'garbage-bags-clear': ['waste', 'liners', 'clear'],
  'cleaning-solutions': ['chemicals', 'cleaner', 'janitorial'],
  'cleaning-equipment': ['equipment', 'tools', 'janitorial'],
  'roll-towels': ['paper', 'restroom', 'dispensers'],
  'folded-towels': ['paper', 'restroom'],
  'bathroom-tissue': ['paper', 'restroom'],
  'facial-tissue': ['paper', 'comfort'],
  'kitchen-towels': ['paper', 'kitchen'],
  'kitchen-products': ['kitchen', 'disposables'],
  'safety-products': ['ppe', 'safety'],
  'hygiene-products': ['hygiene', 'restroom'],
};

const SERVICE_GROUP_TAGS = {
  'ceilings-pipes-and-stairs': ['high-dusting', 'interior'],
  'walls': ['interior', 'surface'],
  'window': ['glass', 'interior'],
  'furnitures': ['interior', 'upholstery'],
  'floors': ['floor-care'],
  'carpets-rugs': ['floor-care', 'carpet'],
  'rubber': ['floor-care'],
  'parking': ['exterior', 'degrease'],
  'staircase': ['interior', 'stairs'],
  'restrooms': ['restroom', 'sanitization'],
  'kitchens': ['kitchen', 'sanitization'],
  'baseboards': ['detail', 'interior'],
  'elevators': ['interior', 'detail'],
  'garbage-chute': ['waste', 'sanitization'],
  'compactor': ['waste', 'sanitization'],
  'outdoor-garbage-bins': ['waste', 'exterior'],
  'indoor-garbage-bins': ['waste', 'interior'],
  'exterior': ['exterior', 'pressure-wash'],
};

const PRODUCT_CATEGORY_LABELS = new Map([
  ['GARBAGE BAGS', 'garbage-bags'],
  ['GARBAGE BAGS CLEAR', 'garbage-bags-clear'],
  ['CHLEANING SOLUTION (LIQUIDS)', 'cleaning-solutions'],
  ['CLEANING SOLUTION (LIQUIDS)', 'cleaning-solutions'],
  ['CLEANING EQUIPMENT', 'cleaning-equipment'],
  ['ROLL TOWELS', 'roll-towels'],
  ['FOLDED TOWELS', 'folded-towels'],
  ['BATHROOM TISSUE', 'bathroom-tissue'],
  ['FACIAL TISSUE', 'facial-tissue'],
  ['KITCHEN TOWELS', 'kitchen-towels'],
  ['KITCHEN PRODUCTS', 'kitchen-products'],
  ['SAFETY PRODUCTS', 'safety-products'],
  ['HYGIENE PRODUCTS', 'hygiene-products'],
]);

function normalizeProductCategory(raw) {
  if (!raw) return 'general';
  const cleaned = normalizeSpaces(raw).toUpperCase();
  return PRODUCT_CATEGORY_LABELS.get(cleaned) || slugify(cleaned);
}

function buildProductDescription(name, pack, categorySlug) {
  const base = normalizeSpaces(name);
  const categoryLabel = titleCase(categorySlug.replace(/-/g, ' '));
  if (pack) {
    return `Commercial-grade ${base.toLowerCase()} for daily facility use. Category: ${categoryLabel}. Pack size: ${pack}.`;
  }
  return `Commercial-grade ${base.toLowerCase()} for daily facility use. Category: ${categoryLabel}.`;
}

function buildServiceDescription(name, groupLabel) {
  const service = normalizeSpaces(name);
  const group = groupLabel ? titleCase(groupLabel.replace(/-/g, ' ')) : 'facility care';
  return `Professional ${service.toLowerCase()} for ${group.toLowerCase()} areas with detail-oriented finishing and safety checks.`;
}

function buildTags(baseTags, name) {
  const tags = new Set(baseTags);
  const tokens = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 3);
  tokens.slice(0, 4).forEach((token) => tags.add(token));
  return Array.from(tags);
}

function formatId(prefix, index) {
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

function loadProducts(csvPath) {
  const text = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(text);
  const products = [];
  let currentCategory = 'general';

  for (const row of rows) {
    const [rawName, rawPack] = row;
    if (!rawName) continue;
    const name = normalizeSpaces(rawName);
    if (!name) continue;

    if (!rawPack) {
      const candidate = normalizeProductCategory(name);
      if (PRODUCT_CATEGORY_TAGS[candidate] || PRODUCT_CATEGORY_LABELS.has(name.toUpperCase())) {
        currentCategory = candidate;
        continue;
      }
    }

    const category = currentCategory;
    const pack = rawPack ? normalizeSpaces(rawPack) : null;
    const unit = inferUnitOfMeasure(pack);
    const tags = buildTags(PRODUCT_CATEGORY_TAGS[category] || ['supplies'], name);
    const description = buildProductDescription(name, pack, category);

    products.push({
      name,
      description,
      category,
      unit_of_measure: unit,
      package_size: pack,
      tags,
    });
  }

  return products;
}

function loadServices(csvPath) {
  const text = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(text);
  const services = [];
  let currentGroup = '';
  let isFirstRow = true;

  for (const row of rows) {
    const [rawGroup, rawName] = row;
    if (isFirstRow) {
      isFirstRow = false;
      continue;
    }
    if (rawGroup) {
      currentGroup = normalizeSpaces(rawGroup);
    }
    if (!rawName) continue;
    const name = normalizeServiceName(rawName);
    if (!name) continue;

    const groupSlug = currentGroup ? slugify(currentGroup) : 'general';
    const tags = buildTags(SERVICE_GROUP_TAGS[groupSlug] || ['service'], name);
    const description = buildServiceDescription(name, groupSlug);

    services.push({
      name,
      description,
      category: groupSlug,
      unit_of_measure: 'service',
      duration_minutes: 120,
      service_window: 'flex',
      crew_required: 2,
      tags,
    });
  }

  return services;
}

function normalizeServiceName(value) {
  const trimmed = normalizeSpaces(value);
  if (!trimmed) return '';

  const fixes = [
    [/froor/gi, 'floor'],
    [/halways/gi, 'hallways'],
    [/sitewalks/gi, 'sidewalks'],
    [/wooden walls/gi, 'wooden wall'],
    [/cleaning\/polish/gi, 'cleaning and polish'],
    [/cleaning\/steam/gi, 'cleaning and steam'],
    [/cleaning\/scrubbing/gi, 'cleaning and scrubbing'],
    [/cleaning\/sanitizing/gi, 'cleaning and sanitizing'],
    [/cleaning\/power washing/gi, 'cleaning and power washing'],
    [/restroom walls\/partitions/gi, 'restroom walls and partitions'],
  ];

  let output = trimmed;
  fixes.forEach(([pattern, replacement]) => {
    output = output.replace(pattern, replacement);
  });

  return titleCase(output);
}

function buildSql(products, services) {
  const lines = [];
  lines.push('BEGIN;');

  products.forEach((product, index) => {
    const productId = formatId('PRD', index + 1);
    const tags = `ARRAY[${product.tags.map((tag) => `'${tag.replace(/'/g, "''")}'`).join(', ')}]`;
    const attributes = jsonLiteral(product.package_size ? { pack_size: product.package_size } : {});

    lines.push(
      `INSERT INTO catalog_products (product_id, name, description, tags, category, unit_of_measure, package_size, attributes, metadata, is_active) VALUES (` +
        `'${productId}', ` +
        `'${product.name.replace(/'/g, "''")}', ` +
        `'${product.description.replace(/'/g, "''")}', ` +
        `${tags}, ` +
        `'${product.category}', ` +
        `'${product.unit_of_measure}', ` +
        `${product.package_size ? `'${product.package_size.replace(/'/g, "''")}'` : 'NULL'}, ` +
        `'${attributes}'::jsonb, ` +
        `'{"source":"import"}'::jsonb, ` +
        `TRUE` +
      `) ON CONFLICT (product_id) DO UPDATE SET ` +
        `name = EXCLUDED.name, description = EXCLUDED.description, tags = EXCLUDED.tags, category = EXCLUDED.category, ` +
        `unit_of_measure = EXCLUDED.unit_of_measure, package_size = EXCLUDED.package_size, attributes = EXCLUDED.attributes, metadata = EXCLUDED.metadata, is_active = TRUE;`
    );
  });

  services.forEach((service, index) => {
    const serviceId = formatId('SRV', index + 1);
    const tags = `ARRAY[${service.tags.map((tag) => `'${tag.replace(/'/g, "''")}'`).join(', ')}]`;
    const attributes = jsonLiteral({ crew_required: service.crew_required });

    lines.push(
      `INSERT INTO catalog_services (service_id, name, description, tags, category, unit_of_measure, duration_minutes, service_window, crew_required, attributes, metadata, is_active) VALUES (` +
        `'${serviceId}', ` +
        `'${service.name.replace(/'/g, "''")}', ` +
        `'${service.description.replace(/'/g, "''")}', ` +
        `${tags}, ` +
        `'${service.category}', ` +
        `'${service.unit_of_measure}', ` +
        `${service.duration_minutes}, ` +
        `'${service.service_window}', ` +
        `${service.crew_required}, ` +
        `'${attributes}'::jsonb, ` +
        `'{"source":"import"}'::jsonb, ` +
        `TRUE` +
      `) ON CONFLICT (service_id) DO UPDATE SET ` +
        `name = EXCLUDED.name, description = EXCLUDED.description, tags = EXCLUDED.tags, category = EXCLUDED.category, ` +
        `unit_of_measure = EXCLUDED.unit_of_measure, duration_minutes = EXCLUDED.duration_minutes, service_window = EXCLUDED.service_window, ` +
        `crew_required = EXCLUDED.crew_required, attributes = EXCLUDED.attributes, metadata = EXCLUDED.metadata, is_active = TRUE;`
    );
  });

  lines.push('COMMIT;');
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const outPath = outIndex !== -1 ? args[outIndex + 1] : null;

  const productsCsv = path.resolve(process.cwd(), 'docs', 'Supply MASTER LIST.xlsx - Sheet1.csv');
  const servicesCsv = path.resolve(process.cwd(), 'docs', 'Service List.xlsx - Sheet1.csv');

  if (!fs.existsSync(productsCsv)) {
    throw new Error(`Missing products CSV at ${productsCsv}`);
  }
  if (!fs.existsSync(servicesCsv)) {
    throw new Error(`Missing services CSV at ${servicesCsv}`);
  }

  const products = loadProducts(productsCsv);
  const services = loadServices(servicesCsv);
  const sql = buildSql(products, services);

  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, sql, 'utf8');
    console.log(`Wrote ${products.length} products and ${services.length} services to ${outPath}`);
  } else {
    console.log(sql);
  }
}

main();
