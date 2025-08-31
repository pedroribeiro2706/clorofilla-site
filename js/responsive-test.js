/**
 * responsive-test.js
 * Script para testar a responsividade do site Clorofilla
 */

// Configurações
const DEBUG = true;
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let touchDistance = 0;
let touchDirection = '';
let lastScrollPosition = 0;
let debugOverlay = null;

// Criar overlay de debug para dispositivos móveis
function createDebugOverlay() {
    if (!DEBUG) return;
    
    // Verificar se já existe
    if (document.getElementById('debug-overlay')) return;
    
    // Criar overlay
    debugOverlay = document.createElement('div');
    debugOverlay.id = 'debug-overlay';
    debugOverlay.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 9999;
        max-width: 300px;
        max-height: 200px;
        overflow: auto;
    `;
    document.body.appendChild(debugOverlay);
    
    // Adicionar botão para fechar
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: red;
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 10px;
        cursor: pointer;
    `;
    closeBtn.addEventListener('click', () => {
        debugOverlay.style.display = 'none';
    });
    debugOverlay.appendChild(closeBtn);
    
    // Adicionar conteúdo inicial
    updateDebugInfo('Debug overlay inicializado');
}

// Atualizar informações no overlay de debug
function updateDebugInfo(message) {
    if (!DEBUG || !debugOverlay) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const msgElement = document.createElement('div');
    msgElement.innerHTML = `<span style="color:#aaa">[${timestamp}]</span> ${message}`;
    debugOverlay.appendChild(msgElement);
    
    // Limitar número de mensagens
    if (debugOverlay.children.length > 20) {
        debugOverlay.removeChild(debugOverlay.children[1]); // Mantém o botão de fechar
    }
    
    // Auto-scroll para a última mensagem
    debugOverlay.scrollTop = debugOverlay.scrollHeight;
}

// Função para verificar a responsividade
function testResponsiveness() {
    console.log('Testando responsividade do site Clorofilla');
    createDebugOverlay();
    
    // Verificar se estamos em um dispositivo móvel
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    console.log(`Tamanho da tela: ${window.innerWidth}px x ${window.innerHeight}px`);
    updateDebugInfo(`Tela: ${window.innerWidth}x${window.innerHeight}px | Mobile: ${isMobile ? 'Sim' : 'Não'} | Small: ${isSmallMobile ? 'Sim' : 'Não'}`);
    
    // Verificar se o scroll horizontal está funcionando corretamente
    const horizontalSection = document.querySelector('.horizontal-scroll-section');
    if (horizontalSection) {
        console.log('Seção de scroll horizontal encontrada');
        updateDebugInfo(`Horizontal scroll: ${horizontalSection.offsetWidth}px de largura`);
        
        // Verificar se os eventos de touch estão registrados
        const touchEvents = horizontalSection.getAttribute('data-touch-events');
        if (!touchEvents) {
            console.log('Registrando eventos de touch');
            horizontalSection.setAttribute('data-touch-events', 'registered');
            
            // Adicionar eventos de touch com informações detalhadas
            horizontalSection.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                lastScrollPosition = window.scrollY;
                
                const message = `Touch start: (${touchStartX}, ${touchStartY})`;
                console.log(message);
                updateDebugInfo(message);
            });
            
            horizontalSection.addEventListener('touchmove', (e) => {
                touchEndX = e.touches[0].clientX;
                touchEndY = e.touches[0].clientY;
                touchDistance = touchEndX - touchStartX;
                touchDirection = touchDistance > 0 ? 'direita' : 'esquerda';
                
                const message = `Touch move: dist=${Math.abs(touchDistance)}px | dir=${touchDirection}`;
                console.log(message);
                updateDebugInfo(message);
            });
            
            horizontalSection.addEventListener('touchend', (e) => {
                const verticalDistance = Math.abs(touchEndY - touchStartY);
                const horizontalDistance = Math.abs(touchEndX - touchStartX);
                const message = `Touch end: horiz=${horizontalDistance}px | vert=${verticalDistance}px`;
                
                console.log(message);
                updateDebugInfo(message);
                
                // Verificar se o scroll vertical foi bloqueado corretamente
                setTimeout(() => {
                    const currentScroll = window.scrollY;
                    const scrollDiff = Math.abs(currentScroll - lastScrollPosition);
                    
                    if (horizontalDistance > 50 && scrollDiff < 10) {
                        updateDebugInfo('✅ Scroll vertical bloqueado durante swipe horizontal');
                    } else if (horizontalDistance > 50) {
                        updateDebugInfo('❌ Scroll vertical NÃO bloqueado durante swipe horizontal');
                    }
                }, 100);
            });
            
            updateDebugInfo('✅ Eventos de touch registrados');
        }
    } else {
        console.log('Seção de scroll horizontal não encontrada');
        updateDebugInfo('❌ Seção de scroll horizontal não encontrada');
    }
    
    // Verificar se as seções estão com os estilos responsivos aplicados
    const sections = ['sobre', 'o-que-fazemos', 'diferenciais', 'contato'];
    sections.forEach(section => {
        const sectionElement = document.getElementById(section);
        if (sectionElement) {
            const computedStyle = window.getComputedStyle(sectionElement);
            const padding = computedStyle.padding;
            const width = computedStyle.width;
            
            console.log(`Seção ${section}: padding=${padding}, width=${width}`);
            updateDebugInfo(`Seção ${section}: padding=${padding}`);
            
            // Verificar elementos específicos por seção
            if (section === 'sobre') {
                const sobreTitle = sectionElement.querySelector('.sobre-title');
                if (sobreTitle) {
                    const fontSize = window.getComputedStyle(sobreTitle).fontSize;
                    updateDebugInfo(`Título Sobre: font-size=${fontSize}`);
                }
            } else if (section === 'o-que-fazemos') {
                const cards = sectionElement.querySelectorAll('.card');
                updateDebugInfo(`O que fazemos: ${cards.length} cards`);
            }
        } else {
            console.log(`Seção ${section} não encontrada`);
            updateDebugInfo(`❌ Seção ${section} não encontrada`);
        }
    });
    
    console.log('Teste de responsividade concluído');
    updateDebugInfo('Teste de responsividade concluído');
}

// Função para simular um swipe horizontal
function simulateHorizontalSwipe() {
    const horizontalSection = document.querySelector('.horizontal-scroll-section');
    if (!horizontalSection) {
        console.log('Seção horizontal não encontrada para simular swipe');
        updateDebugInfo('❌ Não foi possível simular swipe: seção não encontrada');
        return;
    }
    
    updateDebugInfo('Simulando swipe horizontal...');
    
    // Criar eventos sintéticos
    const touchStartEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        view: window,
        touches: [{
            identifier: Date.now(),
            target: horizontalSection,
            clientX: window.innerWidth * 0.8,
            clientY: window.innerHeight * 0.5,
            pageX: window.innerWidth * 0.8,
            pageY: window.innerHeight * 0.5
        }]
    });
    
    const touchMoveEvent = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        view: window,
        touches: [{
            identifier: Date.now(),
            target: horizontalSection,
            clientX: window.innerWidth * 0.2,
            clientY: window.innerHeight * 0.5,
            pageX: window.innerWidth * 0.2,
            pageY: window.innerHeight * 0.5
        }]
    });
    
    const touchEndEvent = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        view: window,
        touches: []
    });
    
    // Disparar eventos
    horizontalSection.dispatchEvent(touchStartEvent);
    
    setTimeout(() => {
        horizontalSection.dispatchEvent(touchMoveEvent);
        
        setTimeout(() => {
            horizontalSection.dispatchEvent(touchEndEvent);
            updateDebugInfo('Simulação de swipe concluída');
        }, 100);
    }, 100);
}

// Ouvir mensagens da página de teste
window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'testTouch') {
        simulateHorizontalSwipe();
    }
});

// Executar o teste quando a página for carregada
window.addEventListener('DOMContentLoaded', testResponsiveness);

// Executar o teste quando a janela for redimensionada
window.addEventListener('resize', () => {
    updateDebugInfo(`Tela redimensionada: ${window.innerWidth}x${window.innerHeight}px`);
    testResponsiveness();
});

console.log('Script de teste de responsividade carregado');
updateDebugInfo('Script de teste de responsividade carregado');
