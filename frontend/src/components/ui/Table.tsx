import React from 'react';

export type TableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  headers?: string[];
  rows?: React.ReactNode[][];
};

export default function Table({ className = '', headers, rows, children, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table {...props} className={["table", className].filter(Boolean).join(' ')}>
        {headers ? (
          <thead>
            <tr>{headers.map((h, i) => (<th key={i} className="text-left font-semibold">{h}</th>))}</tr>
          </thead>
        ) : null}
        {rows ? (
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => (<td key={j}>{c}</td>))}</tr>
            ))}
          </tbody>
        ) : children}
      </table>
    </div>
  );
}
