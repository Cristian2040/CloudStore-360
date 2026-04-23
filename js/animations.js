/**
 * Animations and Icons Initialization
 * Uses Lucide for icons and Anime.js for animations
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.error('Lucide library not loaded');
        return;
    }

    // 2. Wait a bit for the SVG injection to complete by Lucide
    setTimeout(() => {
        initializeAnimations();
    }, 100);
});

function initializeAnimations(container = document) {
    if (typeof anime === 'undefined') {
        console.error('Anime.js library not loaded');
        return;
    }

    // Encuentra todos los iconos o elementos que requieren animación solo en el contenedor, e ignora los ya inicializados.
    const animatedElements = container.querySelectorAll('[data-anim]:not([data-anim-initialized="true"])');

    animatedElements.forEach(el => {
        const animType = el.getAttribute('data-anim');

        // Marcar como inicializado para prevenir eventos duplicados
        el.setAttribute('data-anim-initialized', 'true');

        // Configurar el puntero y la transición predeterminada si es un botón o un icono interactivo
        if (el.tagName.toLowerCase() === 'button' || el.tagName.toLowerCase() === 'a' || el.closest('button') || el.closest('a')) {
            el.style.cursor = 'pointer';
        }

        // Setup base animation handlers based on type
        switch (animType) {
            case 'bounce':
                setupBounceAnimation(el);
                break;
            case 'pulse':
                setupPulseAnimation(el);
                break;
            case 'spin':
                setupSpinAnimation(el);
                break;
            case 'wiggle':
                setupWiggleAnimation(el);
                break;
            case 'shake':
                setupShakeAnimation(el);
                break;
            default:
                // Default subtle scale
                setupScaleAnimation(el);
                break;
        }
    });

    // Auto-play some animations on page load
    anime({
        targets: '[data-anim="bounce"]',
        translateY: [0, -10, 0],
        duration: 1500,
        easing: 'easeOutElastic(1, .8)',
        delay: anime.stagger(100)
    });

    // General entrance animation for all icons that haven't been animated yet, solo en el contenedor actual
    const iconsToAnimate = Array.from(container.querySelectorAll('i[data-lucide] svg, .lucide')).filter(svg => !svg.dataset.entranceDone);

    if (iconsToAnimate.length > 0) {
        anime({
            targets: iconsToAnimate,
            scale: [0.3, 1],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutElastic(1, .6)',
            delay: anime.stagger(20),
            complete: function () {
                iconsToAnimate.forEach(svg => svg.dataset.entranceDone = 'true');
            }
        });
    }
}

function setupBounceAnimation(el) {
    el.addEventListener('mouseenter', () => {
        anime({
            targets: el,
            translateY: [0, -5, 0],
            duration: 600,
            easing: 'easeOutQuad'
        });
    });
}

function setupPulseAnimation(el) {
    el.addEventListener('mouseenter', () => {
        anime({
            targets: el,
            scale: [1, 1.2, 1],
            duration: 800,
            easing: 'easeInOutSine'
        });
    });
}

function setupSpinAnimation(el) {
    el.addEventListener('mouseenter', () => {
        anime({
            targets: el,
            rotate: '1turn',
            duration: 800,
            easing: 'easeInOutSine'
        });
    });
}

function setupWiggleAnimation(el) {
    el.addEventListener('mouseenter', () => {
        anime({
            targets: el,
            rotate: [
                { value: -10, duration: 100, easing: 'easeInOutSine' },
                { value: 10, duration: 100, easing: 'easeInOutSine' },
                { value: -10, duration: 100, easing: 'easeInOutSine' },
                { value: 0, duration: 100, easing: 'easeInOutSine' }
            ]
        });
    });
}

function setupShakeAnimation(el) {
    el.addEventListener('mouseenter', () => {
        anime({
            targets: el,
            translateX: [
                { value: -5, duration: 100, easing: 'easeInOutSine' },
                { value: 5, duration: 100, easing: 'easeInOutSine' },
                { value: -5, duration: 100, easing: 'easeInOutSine' },
                { value: 0, duration: 100, easing: 'easeInOutSine' }
            ]
        });
    });
}

function setupScaleAnimation(el) {
    el.addEventListener('mouseenter', () => {
        anime({
            targets: el,
            scale: 1.1,
            duration: 200,
            easing: 'easeOutQuad'
        });
    });
    el.addEventListener('mouseleave', () => {
        anime({
            targets: el,
            scale: 1,
            duration: 200,
            easing: 'easeOutQuad'
        });
    });
}

// Export for global dynamic calls
window.initGlobalAnimations = initializeAnimations;
