/**
 * o_que_fazemos.js
 * Script específico para a seção "O que fazemos"
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Script da seção "O que fazemos" carregado');
    
    // Inicializar animações para os cards
    const areaCards = document.querySelectorAll('.area-card');
    
    // Adicionar efeito de hover nos cards
    areaCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('card-hover');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('card-hover');
        });
    });
    
    // Animação de entrada dos cards (se a biblioteca AOS não estiver sendo usada)
    if (typeof AOS === 'undefined') {
        // Animação simples com GSAP se disponível
        if (typeof gsap !== 'undefined') {
            gsap.from('.area-card', {
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out",
                paused: true, // Inicia a animação pausada
                scrollTrigger: {
                    trigger: '.areas-atuacao-grid',
                    start: 'top 80%',
                    end: 'bottom 20%',
                    toggleActions: 'play pause resume reset',
                    // markers: true, // Descomentar para debug
                    once: false
                }
            });
        }
    }
});
