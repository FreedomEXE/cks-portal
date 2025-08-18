import React from 'react';
import Button from './Button';

export type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export default function Pagination({ page, pageSize, total, onPageChange, className = '' }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const prev = () => onPageChange(Math.max(1, page - 1));
  const next = () => onPageChange(Math.min(pages, page + 1));
  return (
    <div className={["flex items-center gap-2", className].join(' ')}>
      <Button onClick={prev} disabled={page <= 1}>Prev</Button>
      <span className="text-sm text-ink-600">Page {page} of {pages}</span>
      <Button onClick={next} disabled={page >= pages}>Next</Button>
    </div>
  );
}
