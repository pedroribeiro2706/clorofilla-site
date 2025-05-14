/**
 * loader.js
 * Script responsável pelo carregamento dinâmico das seções do site
 */

document.addEventListener('DOMContentLoaded', async () => {
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
    
    // Lista de seções para carregar
    const secoes = [
        { id: 'sobre', initFunc: 'initSobre' },
        { id: 'o-que-fazemos', initFunc: null }, // Esta seção não tem função init
        { id: 'servicos', initFunc: null },
        { id: 'diferenciais', initFunc: null },
        { id: 'depoimentos', initFunc: null },
        { id: 'contato', initFunc: null }
    ];
    
    // Verificar se as seções existem no DOM
    secoes.forEach(secao => {
        const elemento = document.getElementById(secao.id);
        console.log(`Loader.js: Seção #${secao.id} ${elemento ? 'encontrada' : 'NÃO encontrada'} no DOM`);
    });
    
    // Carregar cada seção em sequência
    for (const secao of secoes) {
        await carregarSecao(secao.id, secao.initFunc);
    }
    
    console.log('Loader.js: Todas as seções foram carregadas');
});

/**
 * Carrega o conteúdo de uma seção via fetch()
 * @param {string} id - ID da seção a ser carregada
 * @param {string|null} initFuncName - Nome da função de inicialização (se existir)
 */
async function carregarSecao(id, initFuncName) {
    const elemento = document.getElementById(id);
    if (!elemento) {
        console.error(`Loader.js: Elemento #${id} não encontrado no DOM`);
        return;
    }
    
    // Indicador de carregamento
    elemento.innerHTML = `
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
    
    try {
        // 1. Carregar HTML
        const url = `./secoes/${id}.html`;
        console.log(`Loader.js: Carregando ${url}`);
        
        const resposta = await fetch(url);
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status} ${resposta.statusText}`);
        }
        
        const html = await resposta.text();
        elemento.innerHTML = html;
        console.log(`Loader.js: HTML inserido no elemento #${id}`);
        
        // 2. Carregar CSS
        const cssPath = `./css/${id}.css`;
        if (!document.querySelector(`link[href="${cssPath}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link);
            console.log(`Loader.js: CSS para ${id} adicionado`);
        }
        
        // 3. Carregar script
        const scriptPath = `./js/${id.replace('-', '_')}.js`;
        await carregarScript(scriptPath);
        
        // 4. Inicializar a seção se tiver função de inicialização
        if (initFuncName && typeof window[initFuncName] === 'function') {
            console.log(`Loader.js: Executando ${initFuncName}()`);
            window[initFuncName]();
        }
        
        // 5. Atualizar ScrollTrigger
        if (typeof ScrollTrigger !== 'undefined') {
            console.log('Loader.js: Atualizando ScrollTrigger');
            ScrollTrigger.refresh();
        }
        
        // 6. Disparar evento personalizado para compatibilidade com código existente
        const secaoCarregadaEvent = new CustomEvent('secaoCarregada', { 
            detail: { id: id }
        });
        document.dispatchEvent(secaoCarregadaEvent);
        console.log(`Loader.js: Evento secaoCarregada disparado para #${id}`);
        
    } catch (erro) {
        console.error(`Loader.js: Erro ao carregar seção ${id}:`, erro);
        elemento.innerHTML = `
            <div class="error-container" style="text-align: center; padding: 40px; background-color: #fff5f5; border-radius: 8px; margin: 20px;">
                <div style="color: #e53e3e; font-size: 48px; margin-bottom: 20px;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 style="color: #e53e3e; margin-bottom: 10px;">Erro ao carregar a seção ${id.replace('-', ' ')}</h3>
                <p style="color: #666; margin-bottom: 20px;">${erro.message}</p>
                <div style="font-size: 14px; background-color: #f8f8f8; padding: 10px; border-radius: 4px; text-align: left; max-width: 600px; margin: 0 auto; overflow: auto;">
                    <code>Dica: Para visualizar corretamente o site, use um servidor web local como o Live Server do VS Code.</code>
                </div>
            </div>
        `;
    }
}

/**
 * Carrega um script de forma assíncrona
 * @param {string} src - Caminho do script
 * @returns {Promise} - Promise que resolve quando o script é carregado
 */
async function carregarScript(src) {
    // Se o script já estiver carregado, não carrega novamente
    if (document.querySelector(`script[src="${src}"]`)) {
        console.log(`Loader.js: Script ${src} já está carregado`);
        return;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log(`Loader.js: Script ${src} carregado com sucesso`);
            resolve();
        };
        script.onerror = (erro) => {
            console.warn(`Loader.js: Erro ao carregar script ${src}`, erro);
            resolve(); // Resolve mesmo com erro para não bloquear outras seções
        };
        document.body.appendChild(script);
    });
}
