# Mockups Visuais Descritivos do Website Clorofilla

Este documento descreve textualmente os mockups visuais para cada seção do website da Clorofilla, aplicando as diretrizes visuais (`visual_guidelines.md`), os conceitos de interatividade (`interaction_concepts.md`) e os wireframes (`wireframes_clorofilla.md`) previamente aprovados. O objetivo é fornecer uma visão clara de como o site se parecerá e se comportará antes da criação do protótipo interativo e do desenvolvimento.

## 0. Tela de Carregamento (Loading Page)

*   **Fundo:** Cor sólida suave da paleta de neutros (ex: off-white ou cinza muito claro) ou um degradê sutil com os tons primários da Clorofilla.
*   **Elemento Central:** A logo da Clorofilla (versão SVG) no centro da tela.
*   **Animação da Logo (GSAP):**
    *   **Conceito:** A logo pode surgir com um efeito de "desenho" progressivo de suas linhas orgânicas, seguido pelo preenchimento suave das cores da folha. Alternativamente, as partes da logo (texto "clorofilla" e o símbolo da folha) podem surgir de pontos diferentes e se encaixar no centro, com uma leve pulsação ou brilho suave ao completar a formação.
    *   **Detalhes:** A animação deve ser fluida, elegante e relativamente rápida (2-4 segundos no máximo) para não frustrar o usuário.
*   **Indicador de Progresso (Opcional):** Uma barra de progresso fina e discreta abaixo da logo, ou um círculo que se completa em torno da logo.
*   **Transição:** Ao final do carregamento, a tela de loading desaparece com um fade out suave, revelando a Seção Home.

## 1. Elementos Globais e Menu Criativo

*   **Gatilho do Menu (Nav Trigger):**
    *   **Visual:** Um ícone minimalista e elegante no canto superior direito. Poderia ser um conjunto de três linhas finas que se animam ao interagir (ex: transformando-se em um "X" quando o menu está aberto) ou um ícone abstrato inspirado na forma da folha da logo da Clorofilla.
    *   **Cor:** Cor de destaque secundária ou um tom neutro escuro, garantindo contraste com o fundo das seções.
*   **Animação de Abertura do Menu (Estilo Cortina - GSAP):**
    *   **Ao Clicar no Gatilho:** Duas "cortinas" (overlays opacos com as cores primárias da paleta, ex: verde petróleo) se abrem do centro da tela para as laterais, revelando o menu por baixo.
    *   **Fundo do Menu Revelado:** Um fundo limpo (cor neutra clara) ocupando a tela inteira.
*   **Conteúdo do Menu Revelado:**
    *   **Links de Navegação:** Dispostos verticalmente no centro da tela, com tipografia grande, moderna e bem espaçada. Cor do texto principal (ex: verde escuro ou azul petróleo), com efeito de hover sutil (ex: mudança para a cor de destaque secundária ou um sublinhado animado).
        *   Home (leva ao topo da sequência horizontal da Home)
        *   Sobre
        *   O Que Fazemos
        *   Serviços
        *   Diferenciais
        *   Depoimentos
        *   Contato
    *   **Logo da Clorofilla (Opcional):** Pequena, no topo ou no rodapé do menu overlay.
    *   **Links Sociais (Opcional):** Ícones discretos no rodapé do menu overlay.
*   **Animação de Fechamento do Menu:** As "cortinas" se fecham suavemente.

## 2. Seção Home (Navegação Horizontal Sofisticada com Painéis "Colados" e Parallax)

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

    3.  **Entrada do Painel 3, Saída do Painel 2 e Composição Final Horizontal:**
        *   Com a continuação do scroll, o **Painel 2** começa a sair pela borda esquerda da tela, e a **Imagem Central** continua seu movimento para a esquerda (mantendo o parallax), posicionando-se na metade esquerda da tela.
        *   O **Painel 3** (fundo laranja vibrante, texto branco, ocupando 0.5 da largura da tela) começa a aparecer da direita, "colado" à borda direita da Imagem Central, e também se move para a esquerda junto com ela, posicionando-se na metade direita da tela.
        *   O estado final desta sequência horizontal é a **Imagem Central** ocupando a metade esquerda da tela e o **Painel 3** ocupando a metade direita da tela. O Painel 2 já saiu completamente de vista pela esquerda.

*   **Transição para Scroll Vertical:**
    *   **Interação:** Após a composição horizontal final (Imagem Central | Painel 3) estar visível, a próxima ação de rolagem do usuário para baixo iniciará a transição para o scroll vertical.
    *   **Animação:** Toda a composição horizontal (Imagem Central e Painel 3 como um grupo) desliza para cima, revelando a Seção "Sobre Nós" abaixo, e o site passa a ter navegação vertical.
    *   **Indicador de Rolagem Vertical:** Um indicador visual sutil (ex: seta para baixo animada) pode aparecer no final da sequência horizontal.

## 3. Seção Sobre Nós

*   **Fundo:** Cor neutra clara ou um leve degradê da paleta.
*   **Título da Seção:** Tipografia de heading, cor primária.
*   **Texto Institucional:** Blocos de texto com tipografia de corpo legível, cor neutra escura. (Sem linha do tempo).
*   **Placeholder para Vídeo Institucional:** Área definida com ícone de "play" sobre thumbnail. Abre em modal.

## 4. Seção O Que Fazemos (Áreas de Atuação)

*   **Fundo:** Similar à seção Sobre Nós ou variação sutil.
*   **Título da Seção e Texto Introdutório.**
*   **Grid de Áreas de Atuação:** Cards em grid responsivo. Ícone personalizado, título, descrição. Hover com sombra/elevação ou mudança de cor.

## 5. Seção Serviços Detalhados

*   **Título da Seção.**
*   **Sistema de Navegação (Acordeão Vertical):** Títulos das categorias clicáveis. Painel de conteúdo expande/recolhe com animação. Ícone "+"/"-". Apenas um painel aberto por vez.
*   **Conteúdo de Cada Serviço:** Nome, descrição, ícones temáticos.

## 6. Seção Diferenciais

*   **Título da Seção.**
*   **Grid de Diferenciais:** Similar ao grid de "O Que Fazemos".

## 7. Seção Depoimentos

*   **Título da Seção.**
*   **Carrossel de Depoimentos (Rolagem Horizontal - GSAP):** Cards elegantes. Navegação com setas e indicadores. Transições suaves.

## 8. Seção Contato (Minimalista)

*   **Título da Seção.**
*   **Fundo:** Cor neutra clara, sem imagem, mapa ou endereço.
*   **Formulário de Contato:** Campos com design limpo. Botão de envio com cor de destaque.
*   **Informações de Contato:** Telefone, Email. Links para redes sociais.

## Considerações Gerais de Design para os Mockups:

*   **Consistência, Responsividade, Qualidade Visual, Paleta de Cores:** Conforme definido anteriormente. A Home horizontal exigirá atenção especial na adaptação para mobile (provavelmente se tornando uma sequência vertical ou com interações de swipe simplificadas).

Estes mockups descritivos, com a Home detalhada, servirão como guia para o protótipo e desenvolvimento.
