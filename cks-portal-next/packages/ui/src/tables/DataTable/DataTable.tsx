import React, { useState, useMemo } from 'react';

export interface DataTableColumn {
  key: string;
  label: string;
  width?: string;
  clickable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  data: Array<Record<string, any>>;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  maxItems?: number;
  emptyMessage?: string;
  showSearch?: boolean;
  onRowClick?: (row: any) => void;
  searchFields?: string[]; // Which fields to search in
  externalSearchQuery?: string; // Allow external search control from TabSection
  filterOptions?: {
    field: string;
    options: string[];
    placeholder: string;
    onFilter?: (value: string) => void;
  };
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  searchPlaceholder = "Search...",
  onSearch,
  maxItems = 10,
  emptyMessage = "No data available",
  showSearch = true,
  onRowClick,
  searchFields,
  externalSearchQuery,
  filterOptions
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterValue, setFilterValue] = useState('');

  // Use external search if provided, otherwise use internal
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  // Filter data based on search query and filter dropdown
  const filteredData = useMemo(() => {
    let result = data;

    // Apply filter dropdown first
    if (filterOptions && filterValue && filterValue !== 'All Types') {
      result = result.filter(row => {
        const value = row[filterOptions.field];
        return value && String(value).toLowerCase() === filterValue.toLowerCase();
      });
    }

    // Then apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row => {
        // If searchFields specified, only search those
        if (searchFields && searchFields.length > 0) {
          return searchFields.some(field => {
            const value = row[field];
            return value && String(value).toLowerCase().includes(query);
          });
        }
        // Otherwise search all columns
        return columns.some(col => {
          const value = row[col.key];
          return value && String(value).toLowerCase().includes(query);
        });
      });
    }

    return result;
  }, [data, searchQuery, columns, searchFields, filterOptions, filterValue]);

  // Limit displayed items based on expansion state
  const displayedData = isExpanded ? filteredData : filteredData.slice(0, maxItems);
  const totalCount = data.length;
  const hasMore = filteredData.length > maxItems;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInternalSearchQuery(value);
    onSearch?.(value);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterValue(value);
    filterOptions?.onFilter?.(value);
  };

  // Add max indicator to placeholder
  const fullPlaceholder = `${searchPlaceholder} (first ${Math.min(maxItems, totalCount)} rows shown)`;

  return (
    <div style={{ width: '100%' }}>
      {showSearch && (
        <div style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <input
            type="text"
            placeholder={fullPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '50%',
              padding: '12px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#111827',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          {filterOptions && (
            <select
              value={filterValue}
              onChange={handleFilterChange}
              style={{
                padding: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#111827',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              <option value="">{filterOptions.placeholder}</option>
              {filterOptions.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        {displayedData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        color: '#374151',
                        fontWeight: 600,
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #e5e7eb',
                        width: column.width || 'auto',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    style={{
                      backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background-color 0.15s'
                    }}
                    onClick={() => onRowClick?.(row)}
                    onMouseEnter={(e) => {
                      if (onRowClick) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb';
                    }}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        style={{
                          padding: '12px',
                          color: '#111827',
                          fontSize: '14px',
                          borderBottom: '1px solid #e5e7eb'
                        }}
                      >
                        {column.render ? (
                          column.render(row[column.key], row)
                        ) : column.clickable ? (
                          <span
                            style={{
                              color: '#3b82f6',
                              cursor: 'pointer',
                              textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            {row[column.key] || '-'}
                          </span>
                        ) : (
                          row[column.key] || '-'
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}
          >
            {searchQuery ? `No results found for "${searchQuery}"` : emptyMessage}
          </div>
        )}
      </div>

      {hasMore && !searchQuery && (
        <div
          style={{
            marginTop: '12px',
            textAlign: 'center'
          }}
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              color: '#3b82f6',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {isExpanded ? `Collapse to ${maxItems} rows` : `Expand to view all ${filteredData.length} entries`}
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;