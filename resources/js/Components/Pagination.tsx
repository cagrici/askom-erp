import React from 'react';
import { Link } from '@inertiajs/react';

interface PaginationProps {
  links?: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
}

export default function Pagination({ links = [] }: PaginationProps) {
  // Don't render pagination if there's only 1 page or no links
  if (!links || links.length <= 3) {
    return null;
  }

  return (
    <nav aria-label="Page navigation">
      <ul className="pagination">
        {links.map((link, key) => {
          // Skip if it's the "..." separator (which has no URL)
          // Skip if it's the prev/next buttons which will be handled separately
          if (link.label === '&laquo; Previous' || link.label === 'Next &raquo;') {
            return null;
          }

          return (
            <li
              key={key}
              className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
            >
              {link.url ? (
                <Link className="page-link" href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
              ) : (
                <span className="page-link" dangerouslySetInnerHTML={{ __html: link.label }} />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
