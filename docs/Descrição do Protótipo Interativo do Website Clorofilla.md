# Descrição do Protótipo Interativo do Website Clorofilla

Este documento descreve textualmente o comportamento e as interações do protótipo do website da Clorofilla, com base nos mockups visuais (`mockups_descritivos_clorofilla.md`), conceitos de interatividade (`interaction_concepts.md`), e todos os feedbacks e refinamentos fornecidos pelo usuário. O objetivo é simular a experiência de navegação e as animações antes do desenvolvimento.

## 0. Tela de Carregamento (Loading Page)

*   **Comportamento:** Ao acessar o site, esta tela é exibida primeiro.
*   **Animação da Logo (GSAP):** A logo da Clorofilla (SVG) no centro da tela se anima. As linhas orgânicas da folha e do nome "clorofilla" são progressivamente desenhadas. Após o contorno ser completo, as cores da folha preenchem suavemente o símbolo. A animação dura aproximadamente 3 segundos.
*   **Transição:** Após a animação da logo e o carregamento do conteúdo principal, a tela de loading desaparece com um "fade out" suave, revelando a Seção Home.

## 1. Elementos Globais e Menu Criativo (Estilo Cortina)

*   **Gatilho do Menu (Nav Trigger):** Ícone minimalista (ex: três linhas finas) fixo no canto superior direito da tela.
    *   **Hover no Gatilho:** O ícone tem uma sutil animação de feedback.
*   **Abertura do Menu (Ao Clicar no Gatilho - GSAP):**
    *   Duas "cortinas" (overlays opacos com a cor primária escura da paleta) animam-se, abrindo-se do centro da tela para as laterais, revelando o menu em tela cheia por baixo.
*   **Menu em Tela Cheia (Overlay):**
    *   **Fundo:** Cor neutra clara (off-white).
    *   **Links de Navegação:** "Home", "Sobre", "O Que Fazemos", "Serviços", "Diferenciais", "Depoimentos", "Contato". Apresentados verticalmente no centro, com tipografia grande, moderna e bem espaçada.
        *   **Hover nos Links:** O texto do link muda para a cor de destaque secundária e um pequeno círculo animado (GSAP) aparece ao lado.
        *   **Clique nos Links:** A animação de fechamento do menu é acionada, e a página rola suavemente (GSAP) para a seção correspondente (ou para o topo da Home horizontal).
    *   **Ícone de Fechar Menu:** O ícone do gatilho (transformado em "X") permanece visível.
*   **Fechamento do Menu (GSAP):** As "cortinas" animam-se de volta, fechando-se.

## 2. Seção Home (Navegação Horizontal Sofisticada com Painéis "Colados" e Parallax - GSAP)

Esta seção apresentará uma sequência de navegação horizontal dinâmica, onde os painéis e uma imagem central se movem de forma coesa, com a imagem central exibindo um efeito de parallax, antes de transitar para o scroll vertical do site. A largura total da sequência horizontal é de duas telas e meia.

*   **Painel 1: Imagem Inicial de Tela Cheia (Largura: 1 tela)**
    *   **Visual:** Imagem de alta qualidade de uma construção moderna e ecológica integrada à natureza, ocupando toda a tela. Logo da Clorofilla no canto superior esquerdo. Título principal na metade inferior, texto secundário no canto superior direito/abaixo do título.
    *   **Interação (Scroll):** Ao iniciar o scroll para baixo, o Painel 1 começa a se mover para a esquerda.

*   **Sequência de Transição Horizontal Dinâmica (GSAP):**
    1.  **Movimento Inicial e Revelação do Painel 2:**
        *   O **Painel 1** (imagem de tela cheia) começa a deslizar horizontalmente para a esquerda.
        *   Imediatamente "colado" à borda direita do Painel 1 que se move, o **Painel 2** (fundo branco, texto, ocupando 0.5 da largura da tela) começa a aparecer da direita, movendo-se junto com o Painel 1 para a esquerda.

    2.  **Revelação da Imagem Central e Saída Parcial do Painel 1:**
        *   Enquanto o Painel 2 continua seu movimento para a esquerda (ainda "colado" ao Painel 1 que está saindo), a **Imagem Central** (nova imagem ecológica/sofisticada, ocupando 0.5 da largura da tela) começa a ser revelada, aparecendo "colada" à borda direita do Painel 2.
        *   A Imagem Central se move para a esquerda junto com o Painel 2, mas com um **efeito de parallax sutil** (movendo-se a uma velocidade ligeiramente diferente do Painel 2) para criar uma sensação de profundidade.
        *   Haverá um momento durante esta transição em que o Painel 2 ocupará a metade esquerda da tela e a Imagem Central ocupará a metade direita. Neste ponto, o Painel 1 já saiu completamente de vista pela esquerda.

    3.  **Entrada do Painel 3, Saída Completa do Painel 2 e Composição Final Horizontal:**
        *   Com a continuação do scroll, o **Painel 2** continua seu movimento para a esquerda até sair completamente de vista pela borda esquerda da tela.
        *   Enquanto o Painel 2 sai, a **Imagem Central** continua seu movimento para a esquerda (mantendo o parallax), posicionando-se para ocupar a metade esquerda da tela.
        *   O **Painel 3** (fundo laranja vibrante, texto branco, ocupando 0.5 da largura da tela) que já vinha aparecendo "colado" à borda direita da Imagem Central, continua seu movimento para a esquerda junto com ela, até ocupar a metade direita da tela.
        *   O estado final desta sequência horizontal é a **Imagem Central** ocupando a metade esquerda da tela e o **Painel 3** ocupando a metade direita da tela. O Painel 2 já saiu completamente de vista.

*   **Transição para Scroll Vertical:**
    *   **Interação:** Após a composição horizontal final (Imagem Central | Painel 3) estar visível, a próxima ação de rolagem do usuário para baixo iniciará a transição para o scroll vertical.
    *   **Animação:** Toda a composição horizontal (Imagem Central e Painel 3 como um grupo) desliza para cima, revelando a Seção "Sobre Nós" abaixo, e o site passa a ter navegação vertical.
    *   **Indicador de Rolagem Vertical:** Um indicador visual sutil (ex: seta para baixo animada) pode aparecer no final da sequência horizontal.

## 3. Seção Sobre Nós

*   **Rolagem:** Transição vertical suave a partir da Home horizontal.
*   **Apresentação do Conteúdo:** Textos institucionais aparecem com "fade in" e "slide up" sutil (GSAP).
*   **Vídeo Institucional:** Abre em player lightbox.

## 4. Seção O Que Fazemos (Áreas de Atuação)

*   **Rolagem:** Transição vertical suave.
*   **Grid de Cards:** Cards surgem com efeito "stagger" (GSAP).
    *   **Hover nos Cards:** Leve sombra e mudança de cor do ícone/título.

## 5. Seção Serviços Detalhados

*   **Rolagem:** Transição vertical suave.
*   **Acordeão Vertical para Categorias de Serviço (GSAP):**
    *   Painel de conteúdo expande/recolhe suavemente. Ícone "+"/"-" animado.
    *   Apenas um painel aberto por vez.

## 6. Seção Diferenciais

*   **Rolagem:** Transição vertical suave.
*   **Grid de Cards:** Similar à seção "O Que Fazemos".

## 7. Seção Depoimentos

*   **Rolagem:** Transição vertical suave.
*   **Carrossel Horizontal (GSAP):**
    *   Navegação com setas e indicadores de paginação. Transições suaves.

## 8. Seção Contato (Minimalista)

*   **Rolagem:** Transição vertical suave.
*   **Fundo:** Cor neutra clara, sem imagem.
*   **Formulário de Contato:** Feedback visual nos campos e botão.

## Comportamento Geral de Rolagem e Transições (GSAP)

*   **Rolagem Suave Vertical:** Após a Home, a rolagem entre as seções é suave e controlada.
*   **Efeitos de Paralaxe Sutis (Vertical):** Podem ser aplicados em fundos de seções verticais, se apropriado.
*   **Animações de Entrada de Elementos:** Textos, títulos e imagens em seções verticais terão animação de entrada sutil.

Este protótipo visa validar o fluxo e o impacto das animações, especialmente a nova Home horizontal.
