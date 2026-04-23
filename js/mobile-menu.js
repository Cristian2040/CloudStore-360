document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navbarMenu = document.querySelector('.navbar-menu');

    if (!mobileBtn || !navbarMenu) return;

    let overlay = document.querySelector('.navbar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'navbar-overlay';
        document.body.appendChild(overlay);
    }

    const toggleMobileMenu = (forceState) => {
        let isOpening = forceState !== undefined ? forceState : !mobileBtn.classList.contains('active');

        if (isOpening) {
            mobileBtn.classList.add('active');
            navbarMenu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            mobileBtn.classList.remove('active');
            navbarMenu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    mobileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMobileMenu();
    });

    overlay.addEventListener('click', () => {
        toggleMobileMenu(false);
    });

    // Close when a link inside is clicked
    navbarMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => toggleMobileMenu(false));
    });

    // Close on Escape or resizing to desktop
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggleMobileMenu(false);
    });

    // Logic to move .navbar-user to mobile navbar on small screens
    const topbarUserContainer = document.querySelector('.topbar .navbar-user');
    const mobileNavbarContainer = document.querySelector('.navbar-container');
    const toggleBtnReference = document.getElementById('mobile-menu-btn');

    // We create a wrapper to hold the user icons on mobile
    let mobileUserWrapper = document.querySelector('.navbar-user-mobile');
    if (!mobileUserWrapper && mobileNavbarContainer && toggleBtnReference) {
        mobileUserWrapper = document.createElement('div');
        mobileUserWrapper.className = 'navbar-user-mobile';
        // Insert right before the hamburger menu
        mobileNavbarContainer.insertBefore(mobileUserWrapper, toggleBtnReference);
    }

    const handleResponsiveLayout = () => {
        if (window.innerWidth <= 768) {
            // Move from topbar to mobile navbar
            if (topbarUserContainer && mobileUserWrapper && topbarUserContainer.children.length > 0) {
                while (topbarUserContainer.firstChild) {
                    mobileUserWrapper.appendChild(topbarUserContainer.firstChild);
                }
            }
        } else {
            // Move back to topbar
            if (topbarUserContainer && mobileUserWrapper && mobileUserWrapper.children.length > 0) {
                while (mobileUserWrapper.firstChild) {
                    topbarUserContainer.appendChild(mobileUserWrapper.firstChild);
                }
            }
            toggleMobileMenu(false);
        }
    };

    // Run once on load
    handleResponsiveLayout();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            handleResponsiveLayout();
        }, 150);
    });
});
