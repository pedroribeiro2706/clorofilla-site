document.addEventListener("DOMContentLoaded", async (event) => {
    // 08/2026 — tarefa 2.5/A: o plugin Observer saiu daqui e do index.html.
    // Ele era baixado do CDN (9,8 KB) em toda visita e nao criava NADA: medido no Chrome,
    // Observer.getAll().length === 0 no celular e no computador. Mesmo caso do ScrollSmoother
    // removido na Fase 1. Junto saiu um bloco de diagnostico esquecido que imprimia
    // "Observer carregado e pronto." no console a cada visita.
    gsap.registerPlugin(ScrollTrigger, SplitText);

    // ======================================================================
    // ETAPA C (31/08/2026) — ESPERAR A FONTE ANTES DE PICAR OS TEXTOS
    // ======================================================================
    //
    // O PROBLEMA. Para animar um paragrafo linha por linha, o SplitText corta
    // o texto em linhas perguntando ao navegador ONDE CADA LINHA QUEBRA. E a
    // quebra depende da fonte: com a fonte provisoria do sistema, as letras
    // tem larguras diferentes e as linhas caem em outros lugares. A fonte
    // deste site vem do Adobe TypeKit, servidor externo, e demora.
    //
    // Resultado: o site cortava com a regua errada. Quando a fonte certa
    // chegava, os cortes ja estavam feitos — nos lugares errados. O proprio
    // GSAP avisava, ate 4x por carregamento, nas duas larguras:
    //     "SplitText called before fonts loaded"
    // E a explicacao mais forte para a quebra intermitente que o Pedro viu no
    // celular em 29/08, e para a pagina que variava de 516 para 376 elementos
    // entre duas execucoes sem nenhuma alteracao de codigo.
    //
    // ⚠️ POR QUE NAO BASTA UM `await document.fonts.ready`.
    // Ele resolve CEDO DEMAIS. Medido em 31/08, celular em 4G lento:
    //
    //      274 ms — fonts.ready resolve com ZERO fontes conhecidas
    //     1192 ms — resolve de novo, com 14 (ainda incompleto)
    //     2310 ms — as 45 fontes so agora COMECAM a carregar
    //     4425 ms — DOMContentLoaded (era aqui que se picava o texto)
    //     5158 ms — as fontes realmente terminam
    //
    // `document.fonts.ready` promete "as fontes PENDENTES terminaram". No
    // comeco da vida da pagina nao ha nenhuma pendente — o CSS do TypeKit nem
    // chegou — entao ele resolve na hora, sem nada carregado. Usar so isso
    // deixaria PIOR: picaria aos 274 ms em vez de aos 4425 ms.
    //
    // A SOLUCAO AQUI: esperar o evento `loadingdone` E confirmar, 150 ms
    // depois, que nao comecou outra rodada de carregamento. Com desistencia
    // automatica em 4 s, para que uma fonte que nunca chega nao trave o site.
    //
    // ⚠️ ISTO NAO RESOLVE GIRAR O TELEFONE. Ao girar, a largura muda e as
    // linhas deveriam ser cortadas de novo. A solucao oficial do GSAP para os
    // dois casos e `autoSplit: true` com as animacoes criadas dentro de
    // `onSplit()` — mas ela exige reorganizar os 8 pontos onde o texto e
    // picado. Ficou combinado com o Pedro fazer isso JUNTO com a etapa E
    // (trocar o isNarrow por gsap.matchMedia), que mexe nesses mesmos pontos.
    // Motivo: girar o telefone ja nao funciona hoje por causa do isNarrow,
    // lido uma unica vez no carregamento — entao adiantar o autoSplit sozinho
    // nao entregaria o beneficio, e custaria mexer duas vezes no mesmo codigo.

    function quandoFontesProntas(limiteMs = 4000) {
        return new Promise((resolve) => {
            if (!document.fonts) return resolve("sem-api");

            let encerrado = false;
            const encerrar = (motivo) => {
                if (encerrado) return;
                encerrado = true;
                clearTimeout(relogio);
                document.fonts.removeEventListener("loadingdone", aoTerminarRodada);
                resolve(motivo);
            };

            // `size > 0` e o que separa "terminou de verdade" de "ainda nao
            // comecou": sem o CSS das fontes, o conjunto esta vazio e o status
            // ja diz "loaded".
            const prontas = () => document.fonts.status === "loaded" && document.fonts.size > 0;

            const aoTerminarRodada = () => {
                if (!prontas()) return;
                const quantas = document.fonts.size;
                // Confirma que nao arrancou outra rodada logo em seguida.
                setTimeout(() => {
                    if (encerrado) return;
                    if (document.fonts.status === "loaded" && document.fonts.size === quantas) {
                        encerrar("fontes-carregadas");
                    }
                    // Se mudou, ignora: o proximo loadingdone reavalia.
                }, 150);
            };

            const relogio = setTimeout(() => encerrar("desistiu-por-tempo"), limiteMs);
            document.fonts.addEventListener("loadingdone", aoTerminarRodada);
            aoTerminarRodada();
        });
    }

    window.__clorofillaFontes = { inicio: performance.now() };
    window.__clorofillaFontes.motivo = await quandoFontesProntas();
    window.__clorofillaFontes.fim = performance.now();
    // (as duas linhas acima so servem para a ferramenta de medicao; sao baratas)


    // --- GLOBAL HELPER QUE ADICIONA O CLEANUP E SALVA A REFERÃŠNCIA PARA FUNÃ‡Ã•ES SPLITTEXT ---
    function createSplitTextOnce(element, options) {
        if (element._splitText) element._splitText.revert();
        const split = new SplitText(element, options);
        element._splitText = split;
        return split;
    }

    // --- ANIMAÃ‡ÃƒO PADRÃƒO PARA O HEADER ---
    
    function animateSectionHeader({
        sectionSelector,
        titleSelector,
        primaryTextSelector,
        secondaryTextSelector = null,
        logoSelector = null,
        titleFromX = -700,
        trigger = null,
        triggerStart = 'top 45%',
        triggerEnd = '10% 15%',
        stagger = 0.02,
        linesClass = 'split-line',
        idPrefix = '',
        // NOVO:
        secondaryTrigger = null,
        secondaryTriggerStart = 'top top',
        secondaryTriggerEnd = 'bottom top'
    }) {
        const section = document.querySelector(sectionSelector);
        const title = section && section.querySelector(titleSelector);
        const primaryText = section && section.querySelector(primaryTextSelector);
        // Veja: nÃ£o depende mais do primary/tÃ­tulo existir!
        const secondaryText = secondaryTextSelector ? section.querySelector(secondaryTextSelector) : null;
        const logo = logoSelector ? section.querySelector(logoSelector) : null;
    
        // AnimaÃ§Ã£o do tÃ­tulo e texto primÃ¡rio (como antes)
        if (title && primaryText) {
            const splitPrimaryText = createSplitTextOnce(primaryText, {
                type: "lines,words",
                linesClass,
                mask: "lines"
            });
            gsap.set(title, { opacity: 1, x: titleFromX });
            gsap.set(splitPrimaryText.words, { yPercent: 100, opacity: 1 });
    
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: trigger || section,
                    start: triggerStart,
                    end: triggerEnd,
                    scrub: 2,
                    id: idPrefix + 'SectionTrigger'
                }
            });
            // Se houver logo, anima primeiro
            if (logo) {
                gsap.set(logo, { opacity: 0, yPercent: -50 });
                tl.fromTo(logo, { opacity: 0, yPercent: -50 }, { opacity: 1, yPercent: 0, duration: 0.6, ease: 'power3.out' }, '+=0.5');
            }
            tl.to(title, {
                x: 0,
                duration: 1,
                ease: 'back.out(0.7)'
            }, 0)
            .to(splitPrimaryText.words, {
                yPercent: 0,
                duration: 0.5,
                stagger,
                ease: 'power3.out'
            }, 0.2);
        }
    
        // Agora a animaÃ§Ã£o do secundÃ¡rio SEM depender do bloco acima!
        if (secondaryText) {
            const splitSecondaryText = createSplitTextOnce(secondaryText, {
                type: "lines,words",
                linesClass,
                mask: "lines"
            });
            gsap.set(splitSecondaryText.words, { yPercent: 100, opacity: 1 });
    
            gsap.timeline({
                scrollTrigger: {
                    trigger: secondaryTrigger || trigger || section,
                    start: secondaryTriggerStart,
                    end: secondaryTriggerEnd,
                    scrub: 2,
                    id: idPrefix + 'SecondaryTextTrigger'
                }
            }).to(splitSecondaryText.words, {
                yPercent: 0,
                duration: 0.5,
                stagger,
                ease: 'power3.out'
            }, 0.4);
        }
    }
    

    // 08/2026 — tarefa 2.5/A: removidas 14 linhas de um gsap.to(".section-transition")
    // comentado, que nunca chegou a rodar. Esta no historico do git se fizer falta.


    // ##################################################################################
                        // ANIMAÃ‡Ã•ES DA NAVEGAÃ‡ÃƒO DO MENU //
    // ##################################################################################

    const menuTrigger = document.getElementById('menuTrigger');
    const menuOverlay = document.getElementById('menuOverlay');
    const menuClose = document.getElementById('menuCloseTrigger');

    function openMenu() {
        menuOverlay.classList.add('menu-open');
        menuOverlay.style.visibility = 'visible';
        gsap.fromTo(menuOverlay, 
          { scaleX: 0, opacity: 0 },
          { 
            scaleX: 1, 
            opacity: 1, 
            duration: 0.65, 
            ease: "power3.inOut",
            onComplete: () => {
              // ApÃ³s abrir o overlay, faz fade-in stagger dos itens do menu:
              const menuItems = document.querySelectorAll('.menu-nav ul li');
              gsap.to(menuItems, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.09,
                ease: "power3.out"
              });
            }
          }
        );
      }

      function closeMenu() {
        const menuItems = document.querySelectorAll('.menu-nav ul li');
        // Some os itens antes do overlay
        gsap.to(menuItems, {
          opacity: 0,
          y: 32,
          duration: 0.3,
          stagger: { each: 0.04, from: "end" },
          ease: "power2.in"
        });
        // Depois fecha o overlay
        gsap.to(menuOverlay, {
          scaleX: 0,
          opacity: 0,
          duration: 0.5,
          delay: 0.36, // DÃ¡ tempo dos itens sumirem primeiro
          ease: "power2.in",
          onComplete: () => {
            menuOverlay.classList.remove('menu-open');
            menuOverlay.style.visibility = 'hidden';
            // Reseta os itens para o prÃ³ximo open
            gsap.set(menuItems, { opacity: 0, y: 32 });
          }
        });
      }

      // Seleciona todos os links do menu
      const menuLinks = document.querySelectorAll('.menu-nav ul li a');

      // Para cada link, adiciona o evento de fechar o menu ao clicar
      menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
      });

    menuTrigger.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);


    // ##################################################################################
                        // ANIMAÃ‡Ã•ES DO SCROLL HORIZONTAL //
    // ##################################################################################

    const panels = gsap.utils.toArray('.panel');
    const horizontalSection = document.querySelector('.horizontal-scroll-section');
    const isNarrow = window.matchMedia('(max-width: 991px)').matches;

    // Mobile-only: fade out fixed hero logo as the hero scrolls out
    if (isNarrow) {
      const logoEl = document.querySelector('.panel-hero-logo');
      const heroEl = document.querySelector('#hero');
      if (logoEl && heroEl) {
        // Fade OUT while hero scrolls out of view (finish ~25% after top leaves viewport)
        gsap.to(logoEl, {
          autoAlpha: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: heroEl,
            start: 'top top',
            end: 'top -25%',
            scrub: true
          }
        });

        // Fade IN as hero re-enters viewport from below up to top
        gsap.to(logoEl, {
          autoAlpha: 1,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: {
            trigger: heroEl,
            start: 'top bottom',
            end: 'top top',
            scrub: true
          }
        });
      }
    }

    // Mobile-only: Panel 2 vertical animations (replica do fluxo desktop, sem containerAnimation)
    if (isNarrow) {
      const panel2 = document.querySelector('.panel.panel-content-white');
      if (panel2) {
        const p2Title = panel2.querySelector('h2');
        const p2Paragraph = panel2.querySelector('.panel-content-white-paragraph');
        const p2Logo = panel2.querySelector('#lottieLogoVertical');
        const originalTitleHTML = p2Title ? p2Title.innerHTML : '';
        const originalParagraphText = p2Paragraph ? p2Paragraph.textContent : '';
        // (a instancia do Lottie foi removida na tarefa 2.14)

        // Estado inicial
        if (p2Title) gsap.set(p2Title, { opacity: 0 });
        if (p2Logo) gsap.set(p2Logo, { opacity: 0, y: 20 });
        if (p2Paragraph) gsap.set(p2Paragraph, { opacity: 0 });

        function mobileTypewriter(text, targetElem, cursorElem, onComplete) {
          let i = 0;
          targetElem.textContent = '';
          cursorElem.style.opacity = 1;
          function typeNextChar() {
            if (i < text.length) {
              targetElem.textContent += text[i++];
              setTimeout(typeNextChar, 72);
            } else {
              cursorElem.style.opacity = 0.7;
              if (typeof onComplete === 'function') onComplete();
            }
          }
          typeNextChar();
        }

        ScrollTrigger.create({
          trigger: panel2,
          start: 'top 80%',
          end: 'bottom top',
          onEnter: () => {
            // 1) TÃ­tulo com typewriter
            if (p2Title) {
              const plainText = (p2Title.textContent || '').trim();
              p2Title.innerHTML = '';
              const typeSpan = document.createElement('span');
              typeSpan.className = 'typewriter-text';
              const cursorSpan = document.createElement('span');
              cursorSpan.className = 'cursor';
              cursorSpan.textContent = '_';
              p2Title.appendChild(typeSpan);
              p2Title.appendChild(cursorSpan);
              p2Title.classList.add('section-typing_text');
              gsap.set(p2Title, { opacity: 1 });

              mobileTypewriter(plainText, typeSpan, cursorSpan, () => {
                // 2) ParÃ¡grafo com SplitText apÃ³s concluir o tÃ­tulo
                if (p2Paragraph) {
                  const split = createSplitTextOnce(p2Paragraph, { type: 'lines', linesClass: 'split-line', mask: 'lines' });
                  gsap.set(p2Paragraph, { opacity: 1 });
                  gsap.set(split.lines, { yPercent: 100, opacity: 1 });
                  gsap.to(split.lines, { yPercent: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out' });
                }

                  // 3) a entrada do logo, por ultimo — ver a nota da tarefa 2.14 abaixo
                  if (p2Logo) {
                    gsap.fromTo(p2Logo,
                      { opacity: 0, y: 20 },
                      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
                  }
              });
            }
          },
          onLeaveBack: () => {
            // Reset
            if (p2Title) {
              p2Title.innerHTML = originalTitleHTML;
              p2Title.classList.remove('section-typing_text');
              gsap.set(p2Title, { opacity: 0 });
            }
            if (p2Paragraph) {
              p2Paragraph.textContent = originalParagraphText;
              gsap.set(p2Paragraph, { opacity: 0 });
            }
                        if (p2Logo) gsap.set(p2Logo, { opacity: 0, y: 20 });
          }
        });
      }
    }

    // Mobile-only: Panel 3 and 4 parallax (vertical)
    if (isNarrow) {
      // Panel 3: parallax image moves slightly on scroll
      const panel3 = document.querySelector('.panel.panel-image-parallax-container');
      const panel3Img = panel3 && panel3.querySelector('.panel-image-parallax-image');
      if (panel3 && panel3Img) {
        gsap.fromTo(panel3Img,
          { yPercent: -20 },
          {
            yPercent: 20,
            ease: 'none',
            scrollTrigger: {
              trigger: panel3,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          }
        );
      }

      // Panel 4: content moves a bit faster upward to suggest covering panel 3
      const panel4 = document.querySelector('.panel.panel-content-orange');
      const panel4Inner = panel4 && panel4.querySelector('.panel-content-orange-text-container') || panel4;
      if (panel4 && panel4Inner) {
        gsap.fromTo(panel4Inner,
          { yPercent: 6 },
          {
            yPercent: -12,
            ease: 'none',
            scrollTrigger: {
              trigger: panel4,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true
            }
          }
        );
      }
    }

    // InicializaÃ§Ã£o do ScrollSmoother
    if (horizontalSection && panels.length && !isNarrow) {
        
        let scrollAmount = window.innerWidth * 1.5; // 150vw

        // NavegaÃ§Ã£o do Scroll Horizontal
        const scrollHorizontal = gsap.to(horizontalSection, {
            x: () => -scrollAmount,
            ease: "none",
            scrollTrigger: {
                trigger: horizontalSection, // Pin the horizontal scroll section
                pin: true,
                scrub: 1,
                end: () => "+=" + scrollAmount, 
                invalidateOnRefresh: true
            }
        });


        // Efeito Parallax para a imagem de fundo
        const parallaxImage = document.querySelector('.panel-hero-background-image');

        if (parallaxImage) {
            gsap.to(parallaxImage, {
                x: '20%', // Movimento horizontal da imagem
                ease: "none",
                scrollTrigger: {
                    trigger: '.panel-hero-background-image-wrap',
                    containerAnimation: scrollHorizontal, // Vincula ao scroll horizontal
                    start: "left center",
                    end: "right center",
                    scrub: true
                }
            });
        }


        // Seleciona os elementos
        const panelHero = document.querySelector('.panel-hero');
        const headingWrapper = document.querySelector('.hero-heading-wrapper');
        const subtextWrapper = document.querySelector('.hero-subtext-wrapper');
        const headingText = document.querySelector('.panel-hero-title');
        const subtextText = document.querySelector('.panel-hero-secondary-text');

        // Split e anima o heading (letras ou palavras)
        if (headingWrapper) {

            const splitHeading = createSplitTextOnce(headingText, { type: "lines,words", mask: "lines", });

            gsap.set(splitHeading.words, { yPercent: 100, opacity: 1 }); // ComeÃ§a "escondido" para baixo

            gsap.to(splitHeading.words, {
                yPercent: 0,
                duration: 1.2,
                delay: 1,
                ease: "power3.out",
                stagger: 0.02, // Letras vÃ£o subindo uma a uma
                scrollTrigger: {
                    trigger: headingWrapper,
                    start: "top 80%", // Quando 80% do wrapper entra na tela
                    once: true // SÃ³ anima uma vez
                }
            });
        }


        // Split e anima o subtexto (por linha e palavra)
        if (subtextWrapper) {
            const splitSubtext = createSplitTextOnce(subtextText, { type: "lines,words", mask: "lines" });

            gsap.set(splitSubtext.lines, { yPercent: 100, opacity: 1 });

            gsap.to(splitSubtext.lines, {
                yPercent: 0,
                duration: 1.2,
                delay: 1.5,
                ease: "power3.out",
                stagger: 0.07, // Mais espaÃ§ado para multiline
                scrollTrigger: {
                    trigger: subtextWrapper,
                    start: "top 85%",
                    once: true
                }
            });
        }


        
        // Verifica se os elementos existem
        if (".panel-hero-logo" && ".panel-hero") {

            // Calcula a distÃ¢ncia de scroll para o fade
            const distanciaLogoFade = document.querySelector('.panel-hero').offsetWidth * 0.30;
            
            // Fade animation for fixed logo in .panel-hero
            gsap.to(".panel-hero-logo", {
                autoAlpha: 0, // Fade out
                ease: "none",
                scrollTrigger: {
                    trigger: ".horizontal-scroll-section", // Trigger based on the scrolling container
                    containerAnimation: scrollHorizontal, // Animation is controlled by the main horizontal scroll
                    start: "left left", // Start fading as soon as horizontal scroll begins
                    end: () => "+=" + distanciaLogoFade, // End fading when .panel-hero has scrolled 75% of its width
                    scrub: true,
                }
            });
        }


        const imageContainer = document.querySelector('.panel-image-parallax-container');
        const image = document.querySelector('.panel-image-parallax-image');

        // Parallax para a imagem do Panel 3
        if (imageContainer && image) {
            const imageContainerWidth = imageContainer.offsetWidth;
            const imageWidth = image.offsetWidth;
            const imageScrollAmount = imageWidth - imageContainerWidth;

            gsap.to(image, {
                x: () => -imageScrollAmount,
                ease: "none",
                scrollTrigger: {
                    trigger: imageContainer,
                    containerAnimation: scrollHorizontal,
                    start: "left right",
                    end: "right left",
                    scrub: 2
                }
            });
        }


          // Seletores principais
        const section = document.querySelector('.panel.panel-content-white');
        const title = section.querySelector('h2');
        const paragraph = section.querySelector('.panel-content-white-paragraph');
        const logoContainer = section.querySelector('#lottieLogoVertical');

        // Salva conteÃºdo original para reset
        const originalTitleHTML = title.innerHTML;
        const originalParagraph = paragraph.textContent;

        // (a instancia do Lottie foi removida na tarefa 2.14)

        // FunÃ§Ã£o de efeito typewriter manual
        function typewriterEffect(text, targetElem, cursorElem, onComplete) {
            let i = 0;
            targetElem.textContent = '';
            cursorElem.style.opacity = 1;
            function typeNextChar() {
            if (i < text.length) {
                targetElem.textContent += text[i++];
                setTimeout(typeNextChar, 72); // velocidade do typewriter (ms)
            } else {
                cursorElem.style.opacity = 0.7; // MantÃ©m cursor visÃ­vel no final
                if (typeof onComplete === 'function') onComplete();
            }
            }
            typeNextChar();
        }

        // FunÃ§Ã£o de reset do estado inicial
        function resetSection() {
            // Reset do tÃ­tulo
            title.innerHTML = originalTitleHTML;
            title.classList.remove('section-typing_text');
            // Reset do parÃ¡grafo
            paragraph.textContent = originalParagraph;
            paragraph.style.opacity = '';
            paragraph.style.transform = '';
            paragraph.style.opacity = '0'; // Esconde ao resetar

            // Reset do logo (antes: destruia a instancia do Lottie e limpava o container)
            if (logoContainer) gsap.set(logoContainer, { opacity: 0, y: 20 });
        }

        // Timeline principal com ScrollTrigger
        const timeline = gsap.timeline({
            paused: true,
            defaults: { ease: 'power3.out' },
            scrollTrigger: {
            trigger: section,
            containerAnimation: scrollHorizontal, // use o seu scrollHorizontal aqui
            start: "left right",
            end: "right left",
            toggleActions: "play none none reset",
            onEnter: resetSection,
            onLeaveBack: resetSection,
            id: "panel2Timeline"
            }
        });

        // AnimaÃ§Ã£o 1: TÃ­tulo com typewriter
        timeline.add(() => {
            const typewriterSpan = document.createElement('span');
            typewriterSpan.className = 'typewriter-text';
            const cursorSpan = document.createElement('span');
            cursorSpan.className = 'cursor';
            cursorSpan.textContent = '_';
            title.innerHTML = '';
            title.appendChild(typewriterSpan);
            title.appendChild(cursorSpan);
            title.classList.add('section-typing_text');
            // Inicia efeito typewriter e segue apÃ³s terminar
            return gsap.delayedCall(0, () => {
            typewriterEffect('. . . COMEÃ‡A NO PRESENTE', typewriterSpan, cursorSpan, () => {
                timeline.play(); // Segue para o prÃ³ximo passo da timeline
            });
            timeline.pause(); // Pausa timeline atÃ© terminar typewriter
            });
        });

        // AnimaÃ§Ã£o 2: ParÃ¡grafo com SplitText (linhas subindo)
        timeline.to({}, { duration: 0.3 }); // Pequeno delay
        timeline.add(() => {
            const split = createSplitTextOnce(paragraph, { type: "lines", linesClass: "split-line", mask: "lines" });

            gsap.set(paragraph, { opacity: 1 }); // Garante que sÃ³ aparece quando animar
            gsap.set(split.lines, { yPercent: 100, opacity: 1 });
            gsap.to(split.lines, {
            yPercent: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.13,
            onComplete: () => {
                timeline.play(); // Segue para a entrada do logo
            }
            });
            timeline.pause(); // Pausa timeline atÃ© SplitText terminar
        });

        // Animacao 3: a entrada do logo, so depois do texto
        // 08/2026 — tarefa 2.14: o Lottie saiu daqui.
        // A biblioteca lottie-web pesava 298,4 KB e a animacao .json outros 26,8 KB —
        // 325 KB baixados em toda visita para animar um logo. O logo agora e um SVG
        // comum de 8,8 KB (assets/logo-clorofilla-cor.svg, extraido do proprio .json e
        // conferido pixel a pixel), e a entrada e uma animacao de GSAP.
        // Decisao do Pedro em 31/08: entrada simples, com o logo surgindo de baixo.
        // A animacao antiga (o traco se desenhando) NAO foi reproduzida — foi escolha
        // consciente dele. Os arquivos .json/.lottie/.webm continuam em assets/ caso
        // um dia queira de volta; deixaram apenas de ser baixados.
        if (logoContainer) {
            timeline.fromTo(logoContainer,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
        }

        // Painel 4: AnimaÃ§Ã£o do tÃ­tulo vindo da esquerda no scroll horizontal

        // 1. Seletor do tÃ­tulo
        const orangeTitle = document.querySelector('.panel-content-orange-title');
        const orangePanel = document.querySelector('.panel.panel-content-orange');

        // 2. AnimaÃ§Ã£o: tÃ­tulo sai da esquerda e entra na posiÃ§Ã£o original
        if (orangeTitle && orangePanel) {
            // Define o quanto ele vai comeÃ§ar fora da tela (em px ou em %)
            gsap.set(orangeTitle, { x: '-120%', opacity: 0.8 }); // comeÃ§a bem fora da esquerda

            gsap.to(orangeTitle, {
                x: '0%',
                opacity: 0.8,
                ease: 'expo.out',
                duration: 1.2,
                scrollTrigger: {
                trigger: orangePanel,
                containerAnimation: scrollHorizontal, // sua timeline de scroll horizontal
                start: 'left 72%',  // Quando a seÃ§Ã£o comeÃ§a a entrar na viewport
                end: 'right 80%',   // Fim da animaÃ§Ã£o (ajuste conforme quiser)
                scrub: 3,             // Faz o movimento ser suave e atrelado ao scroll
                // markers: true,     // Habilite para debugar a animaÃ§Ã£o
                }
            });
        }
    }



    const servicosAccordionTriggers = document.querySelectorAll('.servicos-accordion-trigger');

    if (servicosAccordionTriggers.length) {
      const toggleAccordionPanel = (trigger, expand) => {
        if (!trigger) return;
        const item = trigger.closest('.servicos-accordion-item');
        const panelId = trigger.getAttribute('aria-controls');
        const panel = panelId ? document.getElementById(panelId) : null;

        trigger.setAttribute('aria-expanded', String(expand));
        if (item) {
          item.classList.toggle('is-open', expand);
        }
        if (panel) {
          if (expand) {
            panel.removeAttribute('hidden');
          } else {
            panel.setAttribute('hidden', '');
          }
        }
      };

      servicosAccordionTriggers.forEach((trigger) => {
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        toggleAccordionPanel(trigger, isExpanded);
      });

      servicosAccordionTriggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
          const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

          servicosAccordionTriggers.forEach((otherTrigger) => {
            if (otherTrigger === trigger) return;
            toggleAccordionPanel(otherTrigger, false);
          });

          toggleAccordionPanel(trigger, !isExpanded);
          ScrollTrigger.refresh();
        });

        trigger.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();

          const triggersArray = Array.from(servicosAccordionTriggers);
          const currentIndex = triggersArray.indexOf(trigger);
          if (currentIndex === -1) return;

          const direction = event.key === 'ArrowDown' ? 1 : -1;
          const nextIndex = (currentIndex + direction + triggersArray.length) % triggersArray.length;

          triggersArray[nextIndex].focus();
        });
      });
    }

    const servicosItemTriggers = document.querySelectorAll('.servicos-item-trigger');

    if (servicosItemTriggers.length) {
      const toggleItemPanel = (trigger, expand) => {
        if (!trigger) return;
        const panelId = trigger.getAttribute('aria-controls');
        const panel = panelId ? document.getElementById(panelId) : null;

        trigger.setAttribute('aria-expanded', String(expand));
        if (panel) {
          if (expand) {
            panel.removeAttribute('hidden');
          } else {
            panel.setAttribute('hidden', '');
          }
        }
      };

      servicosItemTriggers.forEach((trigger) => {
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        toggleItemPanel(trigger, isExpanded);

        trigger.addEventListener('click', () => {
          const expanded = trigger.getAttribute('aria-expanded') === 'true';
          toggleItemPanel(trigger, !expanded);
          ScrollTrigger.refresh();
        });

        trigger.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();

          const list = trigger.closest('.servicos-accordion-list');
          if (!list) return;

          const triggers = Array.from(list.querySelectorAll('.servicos-item-trigger'));
          const currentIndex = triggers.indexOf(trigger);
          if (currentIndex === -1) return;

          const direction = event.key === 'ArrowDown' ? 1 : -1;
          const nextIndex = (currentIndex + direction + triggers.length) % triggers.length;

          triggers[nextIndex].focus();
        });
      });
      ScrollTrigger.refresh();
    }




// ##################################################################################
                        // ANIMAÃ‡ÃƒO DO HEADER "SOBRE NÃ“S" //
// ##################################################################################    

    
    const sobreTitle = document.querySelector('.sobre-title');
    const sobrePrimaryText = document.querySelector('.sobre-primary-text');
    const sobreSecondaryText = document.querySelector('.sobre-secondary-text');

    // Verifica se os elementos existem
    if (sobreTitle && sobrePrimaryText && sobreSecondaryText) {
        
        animateSectionHeader({
            sectionSelector: '.sobre-section',
            titleSelector: '.sobre-title',
            primaryTextSelector: '.sobre-primary-text',
            logoSelector: '.sobre-logo',
            secondaryTextSelector: '.sobre-secondary-text',
            linesClass: 'sobre-line',
            idPrefix: 'sobre',
            secondaryTrigger: '.sobre-header-elements', // mantido
            secondaryTriggerStart: 'top top',
            secondaryTriggerEnd: 'bottom top'
        });
    }


// ##################################################################################
// ANIMAÃ‡ÃƒO "MINIMIZANDO RISCOS" COM SCROLLTRIGGER SIMPLES
// ##################################################################################  

    // Elementos
    const minimizandoTitle = document.querySelector('.minimizando-title');
    const riscosTitle = document.querySelector('.riscos-title');
    const subtitleWrapper = document.querySelector('.minimizando-subtitle-wrapper');
    const minimizandoContainer = document.querySelector('.minimizando-riscos-container');

    if (minimizandoContainer && minimizandoTitle && riscosTitle && subtitleWrapper) {
    // Estado inicial dos elementos (fora de lugar, invisÃ­vel se quiser fade)
    gsap.set(minimizandoTitle, { x: 80 });            // ComeÃ§a mais Ã  direita
    gsap.set(riscosTitle, { x: -100 });                // ComeÃ§a mais Ã  esquerda (opcional, para dar mais movimento)
    gsap.set(subtitleWrapper, { x: 80, opacity: 0 }); // Fora e invisÃ­vel

    // "Minimizando" desliza para a esquerda
    gsap.to(minimizandoTitle, {
        x: -300, // Valor negativo = para a esquerda
        ease: 'power3.out',
        scrollTrigger: {
        trigger: minimizandoContainer,
        start: 'top 50%',
        end: 'bottom 20%',
        scrub: 2,
        // markers: true,
        invalidateOnRefresh: true
        }
    });

    // "Riscos" desliza para a direita
    gsap.to(riscosTitle, {
        x: 200, // Valor positivo = para a direita
        ease: 'power3.out',
        scrollTrigger: {
        trigger: minimizandoContainer,
        start: 'top 30%',
        end: 'bottom 20%',
        scrub: 2,
        // markers: true,
        invalidateOnRefresh: true
        }
    });

    // SubtÃ­tulo + seta deslizam para a esquerda e fazem fade in
    gsap.to(subtitleWrapper, {
        x: -80,
        opacity: 1,
        ease: 'power3.out',
        scrollTrigger: {
        trigger: minimizandoContainer,
        start: 'top 20%',
        end: 'bottom 20%',
        scrub: 1.5,
        // markers: true,
        invalidateOnRefresh: true
        }
    });
    }


// ##################################################################################
// SLIDE SEÃ‡ÃƒO SOBRE NÃ“S
// ##################################################################################


    const itsSection = document.querySelector('.image-text-slider-section');
    if (!itsSection) return;
  
    const itsContainer = itsSection.querySelector('.its-container');
    const itsContentSlider = itsSection.querySelector('.its-content-slider');
    const slides = itsSection.querySelectorAll('.its-slide');
    const itsBgImages = itsSection.querySelectorAll('.its-image-frame .its-slide-bg-image');
  
    // ---- AnimaÃ§Ã£o Parallax & Zoom (usando GSAP ScrollTrigger, sem IntersectionObserver) ----
  
    if (itsContainer && itsContentSlider && itsBgImages.length > 0) {
      if (!isNarrow) {
      // Parallax no container
      gsap.fromTo(
        itsContainer,
        { yPercent: 5 },
        {
          yPercent: -15,
          ease: "none",
          scrollTrigger: {
            trigger: itsSection,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.8,
            invalidateOnRefresh: true,
            id: "imageTextSliderParallax"
            // markers: true
          }
        }
      );
  
      // Zoom nas imagens de fundo (todas, para o efeito de profundidade)
      gsap.to(itsBgImages, {
        scale: 1.25,
        xPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: itsSection,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
          invalidateOnRefresh: true,
          id: "imageZoomEffect"
          // markers: true
        }
      });
  
      // Parallax no content slider
      gsap.to(itsContentSlider, {
        y: 550,
        ease: "none",
        scrollTrigger: {
          trigger: itsSection,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
          invalidateOnRefresh: true,
          id: "contentSliderParallax"
          // markers: true
        }
      });
      } else {
        // Mobile: sem parallax/zoom; limpa transforms para respeitar posicionamento natural
        gsap.set([itsContainer, itsContentSlider, itsBgImages], { clearProps: 'transform' });
      }
    }
  
    const nextButton = itsSection.querySelector('.its-slider-navigation .its-arrow.next');
    const nextButtonTitleText = nextButton ? nextButton.querySelector('.its-next-slide-title-text') : null;
  
    // Parallax & zoom anim (mantÃ©m igual, omiti para clareza, use seu trecho anterior...)
  
    let currentSlideIndex = 0;
  
    function updateNextSlideTitle() {
      if (!nextButtonTitleText || slides.length === 0) return;
      const nextIdx = (currentSlideIndex + 1) % slides.length;
      const nextSlideTitleElement = slides[nextIdx].querySelector('.its-slide-title');
      nextButtonTitleText.textContent = nextSlideTitleElement ? nextSlideTitleElement.textContent : '';
    }
  
    function animateSlideTransition(oldIndex, newIndex) {
        const DURATION = 0.6;
        const oldSlide = slides[oldIndex];
        const newSlide = slides[newIndex];
      
        // Fade out do box inteiro do slide atual
        gsap.to(oldSlide, {
          autoAlpha: 0,
          duration: DURATION / 2,
          ease: "power1.in",
          onComplete: () => {
            oldSlide.classList.remove('active');
            itsBgImages[oldIndex].classList.remove('active');
      
            // Ativa o prÃ³ximo slide (box inteiro)
            newSlide.classList.add('active');
            itsBgImages[newIndex].classList.add('active');
      
            // Fade in do box novo
            gsap.fromTo(newSlide,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: DURATION * 0.7, ease: "power1.out" }
            );
          }
        });
      
        // Crossfade das imagens de fundo continua normal
        gsap.to(itsBgImages[oldIndex], {
          autoAlpha: 0,
          duration: DURATION,
          ease: "power1.inOut"
        });
        gsap.to(itsBgImages[newIndex], {
          autoAlpha: 1,
          duration: DURATION,
          ease: "power1.inOut"
        });
      }
  
    if (
      slides.length > 0 &&
      itsBgImages.length === slides.length &&
      nextButton
    ) {
      gsap.set(slides[0].querySelectorAll('.its-slide-title, .its-slide-text, .its-navigation'), { autoAlpha: 1, y: 0 });
      updateNextSlideTitle();
  
      nextButton.addEventListener('click', () => {
        const oldIndex = currentSlideIndex;
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        animateSlideTransition(oldIndex, currentSlideIndex);
        updateNextSlideTitle();
      });
    } else {
      console.warn('Slider nÃ£o pÃ´de ser inicializado: elementos faltando ou contagem de slides/imagens nÃ£o corresponde.');
    }



    // ##################################################################################
                        // ANIMAÃ‡ÃƒO TEXTOS HEADER "O QUE FAZEMOS"//
    // ##################################################################################

    const oqfTitle = document.querySelector('.oqf-title');
    const oqfPrimaryText = document.querySelector('.oqf-primary-text');
    const oqfSecondaryText = document.querySelector('.oqf-secondary-text');

    if (oqfTitle && oqfPrimaryText && oqfSecondaryText) {

        animateSectionHeader({
            sectionSelector: '.o-que-fazemos-intro',
            titleSelector: '.oqf-title',
            primaryTextSelector: '.oqf-primary-text',
            logoSelector: '.sobre-logo',
            secondaryTextSelector: '.oqf-secondary-text',
            linesClass: 'oqf-line',
            idPrefix: 'oqf',
            trigger: '.oqf-header-elements', // igual Ã  sua timeline original
            triggerStart: 'top 45%',
            triggerEnd: '10% 15%',
            secondaryTrigger: '.oqf-header-elements', // igual ao original
            secondaryTriggerStart: 'top top',
            secondaryTriggerEnd: 'bottom top'
        });
        
    }

    // ##################################################################################
                        // HEADER DIFERENCIAIS TOPO //
    // ##################################################################################
    const diffTop = document.querySelector('#diferenciais-topo');
    if (diffTop) {
        // Fade BG em toda a seÃ§Ã£o "O Que Fazemos"
        const oqfSection = document.querySelector('#o-que-fazemos');
        if (oqfSection) {
            gsap.set(oqfSection, { backgroundColor: 'rgba(153,179,129,0)' });
            gsap.timeline({
                scrollTrigger: {
                    trigger: diffTop, // mantÃ©m o header como gatilho
                    start: 'top 75%',
                    end: 'bottom 50%',
                    scrub: true,
                    // markers: true
                }
            })
            .to(oqfSection, {
                backgroundColor: 'rgba(153,179,129,0.75)',
                duration: 0.25,
                ease: 'power2.out'
            })
            .to(oqfSection, {
                backgroundColor: 'rgba(153,179,129,1)',
                duration: 0.25,
                ease: 'power2.out'
            });
        }

        // Header text animation
        animateSectionHeader({
            sectionSelector: '#diferenciais-topo',
            titleSelector: '.diferenciais-title',
            primaryTextSelector: '.diferenciais-primary-text',
            logoSelector: '.sobre-logo',
            secondaryTextSelector: '.diferenciais-secondary-text',
            titleFromX: 700,
            trigger: diffTop,
            triggerStart: 'top 45%',
            triggerEnd: '10% 15%',
            linesClass: 'diff-line',
            idPrefix: 'difTop'
        });
    }



    // ##################################################################################
                        // ANIMAÃ‡ÃƒO ENTRADA DOS CARDS O QUE FAZEMOS//
    // ##################################################################################

    // Timeline de entrada dos cards com ScrollTrigger
    const cardContainers = document.querySelectorAll('.oqf-card-container');

    const cardsTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: '.oqf-grid',
        start: 'top 80%',
        end: 'bottom 20%',
        once: true,
        toggleActions: 'play reverse play reverse',
        // onEnter | onLeave | onEnterBack | onLeaveBack
        // markers: true,
        id: 'oqfCardsGridEntrance'
                    // 08/2026 — tarefa 2.13: removidos os callbacks onEnter / onLeave /
                    // onEnterBack / onLeaveBack. Eles chamavam setupQuestionMarquees() e
                    // resetMarqueeTimelines(), que nao existiam — o efeito marquee havia sido
                    // desativado e so as chamadas ficaram. Cada entrada ou saida desta secao
                    // na tela disparava um ReferenceError dentro do ciclo de atualizacao do
                    // ScrollTrigger. Medido antes e depois em WebKit e Blink: a remocao
                    // elimina a excecao e NAO altera o comportamento visual — os cards
                    // continuam entrando e revertendo exatamente como antes.
    }
    });

    cardsTimeline.fromTo(cardContainers, 
    { opacity: 0, scale: 0.8, y: 50, transformOrigin: "bottom center" },
    { opacity: 1, scale: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power2.out" }
    );




    // 08/2026 — tarefa 2.5/A: aqui ficava a funcao setupQuestionMarquees(), comentada e
    // sem uso desde antes deste projeto (39 linhas). O efeito "marquee" — a pergunta do
    // card deslizando na horizontal — foi desativado por quem construiu o site. As chamadas
    // que sobraram para ela ja tinham sido removidas na tarefa 2.13. O corpo morto saiu
    // agora. Para reativar o efeito, o codigo esta no historico do git.


    // ##################################################################################
                        // FUNÃ‡ÃƒO PARA CONFIGURAR O EFEITO FLIP NOS CARDS //
    // ##################################################################################

    // Seletores principais
    const oqfCardContainers = document.querySelectorAll('.oqf-card-container');
    const oqfGrid = document.querySelector('.oqf-grid');

    // Array global para armazenar as timelines de flip
    let oqfFlipTimelines = [];

    // FunÃ§Ã£o para configurar flips (independente de qualquer marquee)
    function setupCardFlips(cardContainers) {
        // Limpa flips anteriores
        if (oqfFlipTimelines.length) {
            oqfFlipTimelines.forEach(tl => tl && tl.kill());
            oqfFlipTimelines = [];
        }

        cardContainers.forEach((container, index) => {
            const card = container.querySelector('.oqf-card');
            if (!card) return;

            let isAnimating = false;

            // Set inicial das propriedades 3D
            gsap.set(card, {
                transformStyle: "preserve-3d",
                transformPerspective: 1000,
                rotationY: 0,
                transformOrigin: "center center"
            });

            // Backface visibility para as faces
            const front = card.querySelector('.oqf-card-front');
            const back = card.querySelector('.oqf-card-back');
            if (front && back) {
                gsap.set([front, back], { backfaceVisibility: "hidden" });
            }

            // Timeline do flip
            const flipTl = gsap.timeline({
                paused: true,
                onStart: () => { isAnimating = true; },
                onComplete: () => { isAnimating = false; },
                onReverseComplete: () => { isAnimating = false; }
            })
            .to(card, {
                rotationY: 180,
                duration: 0.6,
                ease: "power2.inOut"
            });

            oqfFlipTimelines[index] = flipTl;

            // Eventos de hover
            container.addEventListener('mouseenter', () => {
                if (!isAnimating && Math.abs(gsap.getProperty(card, 'rotationY') % 360) < 10) {
                    flipTl.play();
                }
            });

            container.addEventListener('mouseleave', () => {
                if (!isAnimating && Math.abs(gsap.getProperty(card, 'rotationY') % 360) > 170) {
                    flipTl.reverse();
                }
            });
        });
    }

    // FunÃ§Ã£o para resetar todos os flips quando grid sai da viewport
    function resetCardFlips(cardContainers) {
        cardContainers.forEach((container, idx) => {
            const card = container.querySelector('.oqf-card');
            if (card) {
                gsap.set(card, { rotationY: 0 });
            }
        });
    }

    // Chama o setup no ScrollTrigger (entrada do grid)
    gsap.timeline({
        scrollTrigger: {
            trigger: oqfGrid,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse',
            onEnter: () => {
                setupCardFlips(oqfCardContainers);
            },
            onLeave: function () {
                resetCardFlips(oqfCardContainers);
            },
            onEnterBack: () => {
                setupCardFlips(oqfCardContainers);
            },
            onLeaveBack: () => {
                resetCardFlips(oqfCardContainers);
            }
        }
    }).fromTo(oqfCardContainers,
        { opacity: 0, scale: 0.8, y: 50, transformOrigin: "bottom center" },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power2.out" }
    );





// ##################################################################################
//                  ANIMAÃ‡ÃƒO SLIDES DIFERENCIAIS + SPLITTEXT nÃ£o scrubbado
// ##################################################################################

const diferenciaisSlides = gsap.utils.toArray('.diferenciais-section');
const container = document.querySelector('.vertical-section-diferenciais');
const totalSlides = diferenciaisSlides.length;

// SplitText: aplica para cada heading DENTRO do slide
const headingSplitData = diferenciaisSlides.map(slide => {
  const heading = slide.querySelector('.diferenciais-heading');
  if (!heading) return null;
  const split = new SplitText(heading, { type: "lines,chars" });
  gsap.set(split.chars, { yPercent: 100, opacity: 0, display: 'inline-block' });
  return { split, heading, slide, revealed: false, timeline: null };
}).filter(Boolean);

const parallaxAmount = 20;
const scrollDuration = (totalSlides - 1) * window.innerHeight;

// Inicializa todos os slides: sÃ³ o primeiro visÃ­vel no inÃ­cio
diferenciaisSlides.forEach((slide, i) => {
  slide.style.zIndex = i;
  slide.style.visibility = i === 0 ? 'visible' : 'hidden';
  gsap.set(slide, { y: 0 });
});

// Mobile vs Desktop behavior
if (isNarrow) {
  // Mobile fallback: per-slide triggers (no pin)
  diferenciaisSlides.forEach((slide, i) => {
    slide.style.visibility = 'visible';
    const overlay = slide.querySelector('.diferenciais-overlay');
    const splitData = headingSplitData[i];

    // Initial state
    if (overlay) gsap.set(overlay, { opacity: 0 });

    const textElem = slide.querySelector('.diferenciais-text');

    function revealText() {
      if (!splitData) return;
      if (!splitData.revealed) {
        splitData.revealed = true;
        const tl = gsap.timeline();
        tl.to(splitData.split.chars, {
          yPercent: 0,
          opacity: 1,
          stagger: { each: 0.02, amount: 0.6, from: 'random' },
          duration: 0.5,
          ease: 'power2.out'
        });
        if (textElem) {
          tl.fromTo(
            textElem,
            { x: -40, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
            '-=0.35'
          );
        }
        splitData.timeline = tl;
      }
    }

    function hideText() {
      if (!splitData) return;
      if (splitData.revealed) {
        splitData.revealed = false;
        if (splitData.timeline) splitData.timeline.kill();
        gsap.to(splitData.split.chars, {
          yPercent: 100,
          opacity: 0,
          duration: 0.35,
          ease: 'power2.in'
        });
        if (textElem) {
          gsap.to(textElem, { x: -40, opacity: 0, duration: 0.35, ease: 'power2.in' });
        }
      }
    }

    // 1) Scroll down: when top approaches top → overlay fade in, reveal text
    //    when slide leaves upwards → overlay fade out, hide text
    ScrollTrigger.create({
      trigger: slide,
      start: 'top 12%',
      end: 'bottom top',
      onEnter: () => {
        if (overlay) gsap.to(overlay, { opacity: 0.75, duration: 0.5, ease: 'power2.out' });
        revealText();
      },
      onLeave: () => {
        if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        hideText();
      }
    });

    // 2) Scroll up: fade in when slide bottom nears viewport bottom (~80% visible)
    ScrollTrigger.create({
      trigger: slide,
      start: 'bottom 65%',
      end: 'top bottom',
      onEnterBack: () => {
        if (overlay) {
          const tl = gsap.timeline();
          tl.to(overlay, { opacity: 0.75, duration: 0.45, ease: 'power2.out' })
            .add(() => revealText(), '>-0.05');
        } else {
          revealText();
        }
      },
      onLeaveBack: () => {
        if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        hideText();
      }
    });

    // 3) Scroll up: hide exactly when slide leaves the viewport by the bottom
    ScrollTrigger.create({
      trigger: slide,
      start: 'top bottom',
      end: 'top top',
      onLeaveBack: () => {
        if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        hideText();
      }
    });
  });

  // Safety reset: leaving the Diferenciais section upward resets all overlays/text
  const diffSectionEl = document.querySelector('#diferenciais');
  if (diffSectionEl) {
    ScrollTrigger.create({
      trigger: diffSectionEl,
      start: 'top bottom',
      end: 'bottom top',
      onLeaveBack: () => {
        diferenciaisSlides.forEach((slide, i) => {
          const overlay = slide.querySelector('.diferenciais-overlay');
          if (overlay) gsap.set(overlay, { opacity: 0 });
          const textElem = slide.querySelector('.diferenciais-text');
          if (textElem) gsap.set(textElem, { x: -40, opacity: 0 });
          const hd = headingSplitData[i];
          if (hd && hd.split) {
            gsap.set(hd.split.chars, { yPercent: 100, opacity: 0 });
            hd.revealed = false;
            if (hd.timeline) hd.timeline.kill();
            hd.timeline = null;
          }
        });
      }
    });
  }
} else {
// ============== OVERLAY DO PRIMEIRO SLIDE (fade independente, sem scrub) ==============
const firstSlide = diferenciaisSlides[0];
if (firstSlide) {
  const firstOverlay = firstSlide.querySelector('.diferenciais-overlay');
  if (firstOverlay) {
    gsap.set(firstOverlay, { opacity: 0 });

    let userScrolled = false;

    // Escuta qualquer rolagem de usuÃ¡rio
    window.addEventListener('scroll', () => {
      userScrolled = true;
    }, { once: true });

    ScrollTrigger.create({
      trigger: firstSlide,
      start: 'top 15%',
      end: 'bottom top',
      onEnter: () => {
        // SÃ³ faz fade-in se foi scroll do usuÃ¡rio
        if (userScrolled) {
          gsap.to(firstOverlay, { opacity: 0.75, duration: 1.2, ease: 'power2.out' });
        } else {
          gsap.set(firstOverlay, { opacity: 0.75 });
        }
      },
      onLeave: function () {
        gsap.to(firstOverlay, { opacity: 0, duration: 0.4, ease: 'power2.out' });
      },
      onEnterBack: () => {
        gsap.to(firstOverlay, { opacity: 0.75, duration: 0.4, ease: 'power2.out' });
      },
      onLeaveBack: () => {
        gsap.to(firstOverlay, { opacity: 0, duration: 0.4, ease: 'power2.out' });
      }
    });
  }
}

// ============== SCROLLTRIGGER PRINCIPAL DOS SLIDES ==============
ScrollTrigger.create({
  trigger: container,
  start: "top top",
  end: `+=${scrollDuration}`,
  pin: true,
  anticipatePin: 0.15,
  scrub: 3,
  onUpdate: (self) => {
    const progress = self.progress * (totalSlides - 1);

    diferenciaisSlides.forEach((slide, i) => {
      const overlay = slide.querySelector('.diferenciais-overlay');
      const prevSlide = diferenciaisSlides[i - 1];
      const splitData = headingSplitData[i];
      let localProgress = progress - (i - 1);

      // ========== SCRUB PART (overlay etc) ==========
      if (progress > i - 1 && progress <= i) {
        // Slide estÃ¡ entrando
        slide.style.visibility = "visible";
        slide.style.zIndex = totalSlides + 2;
        gsap.set(slide, { y: (1 - localProgress) * 100 + "vh" });

        // Overlay
        let overlayOpacity = 0;
        if (localProgress >= 0.75) {
          overlayOpacity = gsap.utils.mapRange(0.75, 1, 0, 0.75, localProgress);
        }
        if (overlay && i > 0) gsap.set(overlay, { opacity: overlayOpacity });

        // Parallax do anterior
        if (i > 0 && prevSlide) {
          prevSlide.style.visibility = "visible";
          prevSlide.style.zIndex = totalSlides;
          gsap.set(prevSlide, { y: -parallaxAmount * localProgress + "vh" });
          const prevOverlay = prevSlide.querySelector('.diferenciais-overlay');
          if (prevOverlay) gsap.set(prevOverlay, { opacity: 0.75 });
        }
      } else if (progress > i && progress <= i + 1) {
        // Slide fixo no topo
        slide.style.visibility = "visible";
        slide.style.zIndex = totalSlides + 2;
        gsap.set(slide, { y: 0 });
        if (overlay && i > 0) gsap.set(overlay, { opacity: 0.75 });
      } else {
        // Fora de cena
        slide.style.visibility = "hidden";
        gsap.set(slide, { y: 0 });
        if (overlay) gsap.set(overlay, { opacity: 0 });
      }

      // ========== NON-SCRUB PART (SplitText trigger apenas uma vez) ==========
      if (splitData) {
        // Quando slide estÃ¡ animando: dispara reveal uma Ãºnica vez
        if (!splitData.revealed && progress > i - 1 && progress <= i && localProgress >= 0.75) {
          splitData.revealed = true;
          // Timeline com ease!
          splitData.timeline = gsap.timeline();

          // Array randomizado para stagger
          splitData.timeline.to(splitData.split.chars, {
            yPercent: 0,
            opacity: 1,
            stagger: { each: 0.02, amount: 0.6, from: "random" },
            duration: 0.5,
            ease: "power2.out"
          });

          // AnimaÃ§Ã£o do <p>
          const textElem = slide.querySelector('.diferenciais-text');
          if (textElem) {
            splitData.timeline.fromTo(
              textElem,
              { x: -40, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
              "-=0.35"
            );
          }
        }

        // Quando slide volta a ser escondido: reseta (com hack para o primeiro)
        let shouldReset = false;

        if (splitData.revealed) {
          if (i === 0) {
            const slideRect = slide.getBoundingClientRect();
            if (slideRect.top > 1 || progress <= i - 1) shouldReset = true;
          } else {
            const slideRect = slide.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            if (progress <= i - 1 || slideRect.top >= viewportHeight) shouldReset = true;
          }

          if (shouldReset) {
            splitData.revealed = false;
            if (splitData.timeline) splitData.timeline.kill();
            // Anima o fade out das letras (SplitText)
            gsap.to(splitData.split.chars, {
              yPercent: 100,
              opacity: 0,
              duration: 0.4,
              stagger: { each: 0.01, amount: 0.2, from: "random" },
              ease: "power2.in"
            });
            // Fade out do <p>
            const textElem = slide.querySelector('.diferenciais-text');
            if (textElem) {
              gsap.to(textElem, {
                x: -40,
                opacity: 0,
                duration: 0.4,
                ease: "power2.in"
              });
            }
          }
        }
      }
    });
  }
});
}

// ============== HACK: ForÃ§a animaÃ§Ã£o do texto do primeiro slide ao entrar no topo ==============
ScrollTrigger.create({
  trigger: container,
  start: "top top",
  end: "+=1", // sÃ³ para executar uma vez
  onEnter: () => {
    const splitData = headingSplitData[0];
    if (splitData && !splitData.revealed) {
      splitData.revealed = true;
      splitData.timeline = gsap.timeline();

      splitData.timeline.to(splitData.split.chars, {
        yPercent: 0,
        opacity: 1,
        stagger: { each: 0.02, amount: 0.6, from: "random" },
        duration: 0.5,
        ease: "power2.out"
      });

      const textElem = diferenciaisSlides[0].querySelector('.diferenciais-text');
      if (textElem) {
        splitData.timeline.fromTo(
          textElem,
          { x: -40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
          "-=0.35"
        );
      }
    }
  }
});



    const servicosTitle = document.querySelector('.servicos-title');
    const servicosPrimaryText = document.querySelector('.servicos-primary-text');

    if (servicosTitle && servicosPrimaryText) {
        animateSectionHeader({
            sectionSelector: '.servicos-intro',
            titleSelector: '.servicos-title',
            primaryTextSelector: '.servicos-primary-text',
            secondaryTextSelector: '.servicos-secondary-text',
            logoSelector: '.servicos-logo',
            linesClass: 'servicos-line',
            idPrefix: 'servicos',
            trigger: '.servicos-header-elements',
            triggerStart: 'top 95%',
            triggerEnd: 'top 20%',
            secondaryTrigger: '.servicos-content',
            secondaryTriggerStart: 'top 85%',
            secondaryTriggerEnd: 'top 30%'
        });

        ScrollTrigger.refresh();
    }





// ##################################################################################
//                  ANIMAÃ‡ÃƒO TÃTULO CONTATO
// ##################################################################################

    // Certifique-se de que gsap esteja carregado
    gsap.set('.word-esq', { x: '120%', opacity: 0 });
    gsap.set('.word-dir', { x: '-120%', opacity: 0 });
    gsap.set('#contato-form', { opacity: 0 });
    gsap.set('.contato-card', { opacity: 0 });

    // Fade in do formulÃ¡rio (sem scrub)
    gsap.to('#contato-form', {
      opacity: 1,
      duration: 2.5,
      //delay: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        id: 'contatoForm',
        trigger: '#contato-form',
        start: 'top 60%',
        end: 'bottom top',
        toggleActions: 'play none none reverse',
        //markers: true // remover depois de testar
      }
    });

    // Fade in dos cards com stagger (sem scrub)
    gsap.to('.contato-card', {
      opacity: 1,
      duration: 2,
      ease: 'power3.out',
      stagger: { each: 0.3, from: 'start' },
      scrollTrigger: {
        id: 'contatoCards',
        trigger: '#contato-card',
        start: 'top 80%',
        end: 'bottom top',
        toggleActions: 'play none none reverse',
        //markers: true // remover depois de testar
      }
    });
  
    gsap.timeline({
      scrollTrigger: {
        trigger: '.contato-title',
        start: 'top 75%', // ajuste para iniciar a animaÃ§Ã£o quando desejar
        // once: true,
        scrub: 2,
        //markers: true
      }
    })
    .to(['.word-esq', '.word-dir'], {
        x: '0%',
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0 // zero = juntos
      }, 0);

    const contatoForm = document.getElementById('contato-form');
    const contatoFeedback = document.getElementById('contato-feedback');

    if (contatoForm) {
      const submitButton = contatoForm.querySelector('button[type="submit"]');

      const setFeedback = (message, type = '') => {
        if (!contatoFeedback) return;
        contatoFeedback.textContent = message;
        contatoFeedback.classList.remove('is-success', 'is-error');
        if (type) contatoFeedback.classList.add(type);
      };

      contatoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (contatoForm.reportValidity && !contatoForm.reportValidity()) return;

        const formData = new FormData(contatoForm);
        formData.append('ajax', '1');

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Enviando...';
        }
        setFeedback('Enviando mensagem...');

        try {
          const response = await fetch(contatoForm.action, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
          });

          const data = await response.json().catch(() => ({ success: false }));

          if (response.ok && data.success) {
            contatoForm.reset();
            setFeedback('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'is-success');
          } else {
            const errorMessage = (data && data.message) || 'N�o foi poss�vel enviar sua mensagem. Tente novamente.';
            setFeedback(errorMessage, 'is-error');
          }
        } catch (error) {
          console.error(error);
          setFeedback('Erro de conex�o. Verifique sua internet e tente novamente.', 'is-error');
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'ENVIAR';
          }
        }
      });
    }



      // ##################################################################################
      //                  ANIMAÃ‡ÃƒO FUNDO MINIMIZANDO RISCOS
      // ##################################################################################
      
      // Fade in/out background color for the â€œSobreâ€ section
      const riscosContainer = document.querySelector('.minimizando-riscos-container');
      const sobreSection = document.querySelector('.vertical-section-sobre');
      if (riscosContainer && sobreSection) {
        // Start with transparent background
        // Ensure inner container is transparent so section color is visible
        gsap.set(riscosContainer, { backgroundColor: 'transparent' });
        // Start section with transparent color
        gsap.set(sobreSection, { backgroundColor: 'rgba(251, 244, 234, 0)' });

        gsap.timeline({
          scrollTrigger: {
            trigger: riscosContainer,
            start: 'top 75%',   // container top reaches 25% from viewport top
            end: 'bottom 10%', // 10% before container bottom reaches viewport bottom
            scrub: true,
            // toggleActions: 'play pause resume reset', // follows project conventions
            // markers: true // uncomment for debugging
          }
        })
        // Fade in
        .to(sobreSection, {
          backgroundColor: 'rgba(245, 235, 220, 1)',
          duration: 0.25,
          ease: 'power2.out'
        })
        // Fade out
        .to(sobreSection, {
          backgroundColor: 'rgba(245, 235, 220, 0)',
          duration: 0.25,
          ease: 'power2.out'
        });
      }

      
      
    
    
    


});






