import React from 'react';
import { Link } from '@inertiajs/react';

interface PaginationProps {
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function Pagination({ links }: PaginationProps) {
    // No need to render pagination if there are fewer than 3 links (prev, next)
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <nav aria-label="Page navigation">
            <ul className="pagination justify-content-center">
                {links.map((link, index) => {
                    // Skip if the label contains "Next &raquo;" and url is null
                    if (link.label.includes("Next") && !link.url) {
                        return null;
                    }

                    // Skip if the label contains "&laquo; Previous" and url is null
                    if (link.label.includes("Previous") && !link.url) {
                        return null;
                    }

                    // Style the "Previous" and "Next" buttons
                    let label = link.label;
                    if (link.label.includes("Previous")) {
                        label = "«";
                    } else if (link.label.includes("Next")) {
                        label = "»";
                    }

                    return (
                        <li key={index} className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}>
                            {link.url ? (
                                <Link href={link.url} className="page-link" dangerouslySetInnerHTML={{ __html: label }} />
                            ) : (
                                <span className="page-link" dangerouslySetInnerHTML={{ __html: label }} />
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
