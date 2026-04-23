/**
 * Sidebar Navigation Logic
 * Handles collapsing/expanding the sidebar, hover effects, and persisting state.
 */

const SidebarManager = {
    init() {
        this.sidebar = document.getElementById('sidebar');
        this.toggleBtn = document.getElementById('sidebar-toggle');
        this.body = document.body;

        if (!this.sidebar) return;

        // Load saved state: is it pinned open or collapsed?
        // Default we can assume collapsed (sidebar-collapsed = true) for the hover effect
        const isCollapsed = localStorage.getItem('sidebar-collapsed') !== 'false';

        if (isCollapsed) {
            this.collapse();
        } else {
            this.expand();
        }

        // Setup listeners
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        }

        // Hover events for expansion when collapsed
        this.sidebar.addEventListener('mouseenter', () => {
            if (this.body.classList.contains('sidebar-collapsed')) {
                this.sidebar.classList.add('hover-expanded');
            }
        });

        this.sidebar.addEventListener('mouseleave', () => {
            if (this.body.classList.contains('sidebar-collapsed')) {
                this.sidebar.classList.remove('hover-expanded');
            }
        });
    },

    toggle() {
        if (this.body.classList.contains('sidebar-collapsed')) {
            // It was collapsed, now we pin it open
            this.expand();
            this.sidebar.classList.remove('hover-expanded');
        } else {
            // It was open, now we close it
            this.collapse();
        }
    },

    collapse() {
        this.body.classList.add('sidebar-collapsed');
        this.sidebar.classList.add('collapsed');
        localStorage.setItem('sidebar-collapsed', 'true');

        if (this.toggleBtn) {
            this.toggleBtn.innerHTML = '<i data-lucide="chevron-right"></i>';
            if (window.lucide) window.lucide.createIcons({ root: this.toggleBtn });
        }
    },

    expand() {
        this.body.classList.remove('sidebar-collapsed');
        this.sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebar-collapsed', 'false');

        if (this.toggleBtn) {
            this.toggleBtn.innerHTML = '<i data-lucide="chevron-left"></i>';
            if (window.lucide) window.lucide.createIcons({ root: this.toggleBtn });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    SidebarManager.init();
});
