/**
 * sobre.js
 * Script específico para a seção "Sobre Nós" com animações GSAP modernas
 */

// Função de inicialização que pode ser chamada tanto no DOMContentLoaded quanto após o carregamento via fetch
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
    
    // Timeline principal para a seção
    const sobreTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: '.sobre-section',
            start: 'top 70%',
            // markers: true, // Remover em produção
            toggleActions: 'play none none none'
        }
    });
    
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
    
    // Animações adicionais com ScrollTrigger para elementos que aparecem durante a rolagem
    
    // Efeito de parallax sutil no título durante a rolagem
    gsap.to('.sobre-title', {
        y: -30,
        scrollTrigger: {
            trigger: '.sobre-section',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        }
    });
    
    // Efeito de parallax sutil nos textos durante a rolagem
    gsap.to('.sobre-content', {
        y: -20,
        scrollTrigger: {
            trigger: '.sobre-section',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        }
    });
    
    // Animação para dispositivos móveis
    // Ajustar animações para telas menores
    const mediaQuery = window.matchMedia('(max-width: 576px)');
    if (mediaQuery.matches) {
        // Reconfigurar animações para mobile se necessário
        sobreTimeline.clear();
        
        // Animação simplificada para mobile
        sobreTimeline
            .to('.horizontal-line', { opacity: 1, duration: 0.5 }, 0)
            .to('.logo-container', { opacity: 1, duration: 0.5 }, 0.3)
            .to('.sobre-title', { opacity: 1, duration: 0.5 }, 0.6)
            .to('.sobre-primary-text', { opacity: 1, duration: 0.5 }, 0.9)
            .to('.sobre-secondary-text', { opacity: 1, duration: 0.5 }, 1.1);
    }
    
    // Armazenar os ScrollTriggers para poder limpá-los depois
    if (!window.sobreScrollTriggers) window.sobreScrollTriggers = [];
    window.sobreScrollTriggers.push(sobreTimeline.scrollTrigger);
}

// Chamar a função de inicialização quando o DOM for carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('sobre.js: DOMContentLoaded disparado');
    // Verificar se a seção já está no DOM
    if (document.querySelector('.sobre-section')) {
        console.log('sobre.js: Seção sobre já está no DOM, inicializando...');
        initSobre();
    } else {
        console.log('sobre.js: Seção sobre ainda não está no DOM, aguardando evento secaoCarregada...');
    }
});

// Escutar o evento personalizado disparado pelo loader.js
document.addEventListener('secaoCarregada', function(event) {
    console.log('sobre.js: Evento secaoCarregada recebido para a seção:', event.detail.id);
    
    // Verificar se a seção carregada é 'sobre'
    if (event.detail.id === 'sobre') {
        console.log('sobre.js: Seção sobre foi carregada via fetch, inicializando...');
        
        // Pequeno timeout para garantir que o DOM está completamente renderizado
        setTimeout(function() {
            initSobre();
            
            // Forçar o refresh do ScrollTrigger
            if (typeof ScrollTrigger !== 'undefined') {
                console.log('sobre.js: Atualizando ScrollTrigger...');
                ScrollTrigger.refresh();
            }
        }, 100);
    }
});

// Expor a função de inicialização globalmente para que possa ser chamada pelo loader.js
window.initSobre = initSobre;
