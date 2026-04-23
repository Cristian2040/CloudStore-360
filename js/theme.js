/**
 * Theme Switcher Logic
 * Handles Light/Dark mode toggling and persistence
 */

const ThemeManager = {
    init() {
        // Load saved theme or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);

        // Wait for DOM to be ready to inject button
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.injectToggler());
        } else {
            this.injectToggler();
        }
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    },

    toggleTheme() {
        const current = localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    injectToggler() {
        const userDropdown = document.querySelector('#user-dropdown-menu');

        // Prevent double injection
        if (!userDropdown || document.getElementById('theme-toggle-btn')) return;

        const divider = userDropdown.querySelector('.navbar-dropdown-divider');

        const toggleBtn = document.createElement('a');
        toggleBtn.href = "#";
        toggleBtn.className = "navbar-dropdown-item";
        toggleBtn.id = "theme-toggle-btn";
        toggleBtn.innerHTML = `
            <span id="theme-icon"><i data-lucide="moon-star" style="width:1em; height:1em; vertical-align: middle;"></i></span>
            <span>Cambiar Tema</span>
        `;

        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleTheme();
        });

        // Insert before the divider (or at the end if no divider)
        if (divider) {
            userDropdown.insertBefore(toggleBtn, divider);
        } else {
            userDropdown.appendChild(toggleBtn);
        }

        if (window.lucide) window.lucide.createIcons({ root: toggleBtn });
    }
};

// Initialize immediately to prevent flash if possible
ThemeManager.init();
