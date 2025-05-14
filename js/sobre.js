/**
 * sobre.js
 * Script específico para a seção "Sobre Nós" com animações GSAP
 */

// Função de inicialização que será chamada pelo loader.js
function initSobre() {
    console.log('Inicializando animações da seção "Sobre Nós"');
    
    // Verificar se GSAP está disponível
    if (typeof gsap === 'undefined') {
        console.error('GSAP não está carregado. As animações não serão executadas.');
        return;
    }
    
    // Limpar quaisquer animações anteriores para evitar duplicação
    if (window.sobreScrollTriggers) {
        window.sobreScrollTriggers.forEach(trigger => trigger.kill());
    }
    window.sobreScrollTriggers = [];
    
    // Verificar se os elementos existem no DOM
    const sobreSection = document.querySelector('.sobre-section');
    if (!sobreSection) {
        console.error('Elemento .sobre-section não encontrado no DOM');
        return;
    }
    
    // Definir manualmente a opacidade inicial de todos os elementos
    //gsap.set('.horizontal-line, .vertical-line, .logo-container, .sobre-title, .sobre-primary-text, .sobre-secondary-text', {
    //    opacity: 0
    //});
    
    // Criar a timeline SEM paused: true
    const sobreTimeline = gsap.timeline();
    
    // Animação da linha horizontal
    sobreTimeline.to('.horizontal-line', {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
    }, 0);
    
    // Animação da linha vertical
    sobreTimeline.to('.vertical-line', {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
    }, 0.2);
    
    // Animação da logo
    sobreTimeline.to('.logo-container', {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
    }, 0.4);
    
    // Animação do título - fade in da esquerda para a direita
    sobreTimeline.fromTo('.sobre-title', 
        { 
            opacity: 0,
            x: -50 
        },
        {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: 'power2.out'
        }, 
        0.6
    );
    
    // Animação do texto primário
    sobreTimeline.to('.sobre-primary-text', {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
    }, 1.0);
    
    // Animação do texto secundário
    sobreTimeline.to('.sobre-secondary-text', {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
    }, 1.2);
    
    // IMPORTANTE: Pausar a timeline imediatamente após criá-la
    // Isso evita que ela seja reproduzida automaticamente
    sobreTimeline.pause();
    
    // Criar um observador de interseção para detectar quando a seção está visível
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Se a seção está visível
            if (entry.isIntersecting) {
                console.log('Seção sobre está visível, iniciando animação');
                sobreTimeline.play();
            } else {
                console.log('Seção sobre não está mais visível, resetando animação');
                sobreTimeline.progress(0).pause();
            }
        });
    }, {
        // Configurar para disparar quando pelo menos 20% da seção estiver visível
        threshold: 0.2
    });
    
    // Iniciar a observação da seção
    observer.observe(sobreSection);
    
    // Efeito de parallax sutil no título durante a rolagem
    const titleParallax = gsap.to('.sobre-title', {
        y: -30,
        scrollTrigger: {
            trigger: '.sobre-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
            invalidateOnRefresh: true
        }
    });
    
    // Efeito de parallax sutil nos textos durante a rolagem
    const contentParallax = gsap.to('.sobre-content', {
        y: -20,
        scrollTrigger: {
            trigger: '.sobre-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
            invalidateOnRefresh: true
        }
    });
    
    // Armazenar os ScrollTriggers para poder limpá-los depois
    if (!window.sobreScrollTriggers) window.sobreScrollTriggers = [];
    window.sobreScrollTriggers.push(
        titleParallax.scrollTrigger,
        contentParallax.scrollTrigger
    );
    
    // Também armazenar o observador para poder limpá-lo depois
    window.sobreObserver = observer;
    
    console.log('Animações da seção "Sobre Nós" inicializadas com sucesso');
}

// Função para limpar recursos quando a seção for descarregada
function cleanupSobre() {
    if (window.sobreScrollTriggers) {
        window.sobreScrollTriggers.forEach(trigger => trigger.kill());
        window.sobreScrollTriggers = [];
    }
    
    if (window.sobreObserver) {
        window.sobreObserver.disconnect();
        window.sobreObserver = null;
    }
}

// Expor a função de inicialização globalmente para que possa ser chamada pelo loader.js
window.initSobre = initSobre;
window.cleanupSobre = cleanupSobre;
