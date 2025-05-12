/**
 * loader.js
 * Script responsável pelo carregamento dinâmico das seções do site
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Loader.js: DOM carregado, iniciando carregamento das seções');
    
    // Exibir mensagem de aviso se estiver usando o protocolo file://
    if (window.location.protocol === 'file:') {
        console.warn('Loader.js: Você está abrindo o site diretamente do sistema de arquivos. O carregamento via fetch pode não funcionar. Considere usar um servidor local como o Live Server do VS Code.');
        
        // Adicionar alerta visual na página
        const alertaEl = document.createElement('div');
        alertaEl.style.position = 'fixed';
        alertaEl.style.top = '0';
        alertaEl.style.left = '0';
        alertaEl.style.right = '0';
        alertaEl.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        alertaEl.style.color = 'white';
        alertaEl.style.padding = '10px';
        alertaEl.style.textAlign = 'center';
        alertaEl.style.zIndex = '9999';
        alertaEl.style.fontSize = '14px';
        alertaEl.innerHTML = 'Aviso: Para visualizar corretamente o site, use um servidor web local como o Live Server do VS Code.';
        document.body.appendChild(alertaEl);
    }
    
    // Lista de IDs das seções para carregar
    const secoes = ['sobre', 'o-que-fazemos', 'servicos', 'diferenciais', 'depoimentos', 'contato'];
    
    // Verificar se as seções existem no DOM
    secoes.forEach(id => {
        const elemento = document.getElementById(id);
        console.log(`Loader.js: Seção #${id} ${elemento ? 'encontrada' : 'NÃO encontrada'} no DOM`);
    });
    
    // Carregar cada seção
    secoes.forEach(id => carregarSecao(id));
});

/**
 * Carrega o conteúdo de uma seção via fetch()
 * @param {string} id - ID da seção a ser carregada
 */
function carregarSecao(id) {
    const secaoElement = document.getElementById(id);
    if (!secaoElement) {
        console.error(`Loader.js: Elemento #${id} não encontrado no DOM`);
        return;
    }
    
    // Adicionar indicador de carregamento
    secaoElement.innerHTML = `
        <div class="loading-indicator" style="text-align: center; padding: 40px;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #198754; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 20px; color: #666;">Carregando ${id.replace('-', ' ')}...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    console.log(`Loader.js: Iniciando carregamento da seção ${id} via fetch`);
    const url = `./secoes/${id}.html`;
    console.log(`Loader.js: Tentando carregar ${url}`);
    
    fetch(url)
        .then(response => {
            console.log(`Loader.js: Resposta para ${id}:`, response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`Erro ao carregar a seção ${id}: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            console.log(`Loader.js: Conteúdo HTML recebido para ${id} (${html.length} caracteres)`);
            secaoElement.innerHTML = html;
            console.log(`Loader.js: HTML inserido no elemento #${id}`);
            
            // Disparar um evento personalizado para notificar que o conteúdo foi carregado
            const secaoCarregadaEvent = new CustomEvent('secaoCarregada', { 
                detail: { id: id }
            });
            document.dispatchEvent(secaoCarregadaEvent);
            console.log(`Loader.js: Evento secaoCarregada disparado para #${id}`);
            
            // Carregar e executar o script específico da seção, se existir
            const scriptPath = `./js/${id.replace('-', '_')}.js`;
            
            // Verificar se o script já foi carregado
            const scriptJaCarregado = Array.from(document.querySelectorAll('script')).some(s => 
                s.src.includes(`/${id.replace('-', '_')}.js`) || s.src.includes(`\\${id.replace('-', '_')}.js`)
            );
            
            if (scriptJaCarregado) {
                console.log(`Loader.js: Script para ${id} já está carregado, não será carregado novamente`);
                
                // Se o script já está carregado, tenta executar sua função de inicialização
                if (id === 'sobre' && typeof initSobre === 'function') {
                    console.log('Loader.js: Executando initSobre() novamente');
                    initSobre();
                }
            } else {
                console.log(`Loader.js: Tentando carregar script ${scriptPath}`);
                
                const script = document.createElement('script');
                script.src = scriptPath;
                script.onload = () => {
                    console.log(`Loader.js: Script para ${id} carregado com sucesso`);
                };
                script.onerror = () => {
                    console.log(`Loader.js: Script para ${id} não encontrado ou com erro`);
                    // Silenciosamente ignora se o script não existir
                };
                document.body.appendChild(script);
            }
            
            // Carregar CSS específico da seção, se ainda não estiver carregado
            if (!document.querySelector(`link[href="./css/${id}.css"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `./css/${id}.css`;
                document.head.appendChild(link);
                console.log(`Loader.js: CSS para ${id} adicionado ao head`);
            }
        })
        .catch(error => {
            console.error(`Loader.js: Erro ao carregar a seção ${id}:`, error);
            secaoElement.innerHTML = `
                <div class="error-container" style="text-align: center; padding: 40px; background-color: #fff5f5; border-radius: 8px; margin: 20px;">
                    <div style="color: #e53e3e; font-size: 48px; margin-bottom: 20px;">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h3 style="color: #e53e3e; margin-bottom: 10px;">Erro ao carregar a seção ${id.replace('-', ' ')}</h3>
                    <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
                    <div style="font-size: 14px; background-color: #f8f8f8; padding: 10px; border-radius: 4px; text-align: left; max-width: 600px; margin: 0 auto; overflow: auto;">
                        <code>Dica: Para visualizar corretamente o site, use um servidor web local como o Live Server do VS Code.</code>
                    </div>
                </div>
            `;
        });
}
