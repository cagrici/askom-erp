// Dropdown utilities for better positioning and preventing scrollbars

export const initializeDropdowns = () => {
    // Initialize Bootstrap dropdowns with improved positioning
    const dropdowns = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                if (menu !== this.nextElementSibling) {
                    menu.classList.remove('show');
                }
            });
            
            const menu = this.nextElementSibling as HTMLElement;
            if (menu && menu.classList.contains('dropdown-menu')) {
                // Toggle current dropdown
                const isShowing = menu.classList.contains('show');
                
                if (!isShowing) {
                    // Calculate optimal position
                    const rect = this.getBoundingClientRect();
                    const menuHeight = getDropdownHeight(menu);
                    const windowHeight = window.innerHeight;
                    const spaceBelow = windowHeight - rect.bottom;
                    const spaceAbove = rect.top;
                    
                    // Remove any existing position classes
                    menu.classList.remove('dropdown-menu-end', 'dropup');
                    
                    // Check if we need to show dropdown upward
                    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
                        menu.classList.add('dropup');
                        // For dropup, we need to position it above the button
                        menu.style.position = 'absolute';
                        menu.style.top = 'auto';
                        menu.style.bottom = '100%';
                    } else {
                        // Standard dropdown position
                        menu.style.position = '';
                        menu.style.top = '';
                        menu.style.bottom = '';
                    }
                    
                    // Check if we need to align to right edge
                    const spaceRight = window.innerWidth - rect.right;
                    const menuWidth = getDropdownWidth(menu);
                    
                    if (spaceRight < menuWidth) {
                        menu.classList.add('dropdown-menu-end');
                    }
                    
                    menu.classList.add('show');
                } else {
                    menu.classList.remove('show');
                }
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        const target = e.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    // Close dropdowns on scroll to prevent positioning issues
    document.addEventListener('scroll', function() {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }, true);
};

// Get dropdown menu height (including hidden elements)
const getDropdownHeight = (menu: HTMLElement): number => {
    // Temporarily show to measure
    const wasHidden = !menu.classList.contains('show');
    if (wasHidden) {
        menu.style.visibility = 'hidden';
        menu.style.display = 'block';
        menu.classList.add('show');
    }
    
    const height = menu.offsetHeight;
    
    if (wasHidden) {
        menu.classList.remove('show');
        menu.style.display = '';
        menu.style.visibility = '';
    }
    
    return height;
};

// Get dropdown menu width (including hidden elements)
const getDropdownWidth = (menu: HTMLElement): number => {
    // Temporarily show to measure
    const wasHidden = !menu.classList.contains('show');
    if (wasHidden) {
        menu.style.visibility = 'hidden';
        menu.style.display = 'block';
        menu.classList.add('show');
    }
    
    const width = menu.offsetWidth;
    
    if (wasHidden) {
        menu.classList.remove('show');
        menu.style.display = '';
        menu.style.visibility = '';
    }
    
    return width;
};

// Prevent table scroll caused by dropdowns
export const preventTableScroll = () => {
    // Add CSS to prevent horizontal scroll on table containers
    const style = document.createElement('style');
    style.textContent = `
        .table-responsive {
            overflow-x: auto;
            overflow-y: visible !important;
        }
        
        .dropdown-menu {
            z-index: 1050;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .dropdown-menu.dropup {
            transform: translateY(-100%);
            margin-top: -2px !important;
        }
        
        .dropdown-menu.show {
            display: block;
        }
        
        /* Prevent dropdown from causing horizontal scroll */
        .table-responsive .dropdown {
            position: static;
        }
        
        .table-responsive .dropdown-menu {
            position: fixed !important;
            z-index: 1050;
        }
        
        /* Ensure dropdown stays in viewport */
        @media (max-width: 768px) {
            .dropdown-menu {
                position: fixed !important;
                left: 10px !important;
                right: 10px !important;
                width: auto !important;
                max-width: calc(100vw - 20px);
            }
        }
    `;
    
    document.head.appendChild(style);
};

// Initialize everything
export const initializeTableDropdowns = () => {
    preventTableScroll();
    initializeDropdowns();
};

// Clean up event listeners (useful for React components)
export const cleanupDropdowns = () => {
    const dropdowns = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    dropdowns.forEach(dropdown => {
        // Clone and replace to remove all event listeners
        const newDropdown = dropdown.cloneNode(true);
        dropdown.parentNode?.replaceChild(newDropdown, dropdown);
    });
};