document.addEventListener("DOMContentLoaded", (event) => {
    gsap.registerPlugin(Observer, ScrollTrigger, ScrollSmoother, SplitText, Observer);


    if (typeof Observer === "undefined") {
        console.error("Observer plugin do GSAP NÃO está carregado! (confira o import/script)");
      } else {
        console.log("Observer carregado e pronto.");
      }

    // --- GLOBAL HELPER QUE ADICIONA O CLEANUP E SALVA A REFERÊNCIA PARA FUNÇÕES SPLITTEXT ---
    function createSplitTextOnce(element, options) {
        if (element._splitText) element._splitText.revert();
        const split = new SplitText(element, options);
        element._splitText = split;
        return split;
    }

    // --- ANIMAÇÃO PADRÃO PARA O HEADER ---
    
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
        // Veja: não depende mais do primary/título existir!
        const secondaryText = secondaryTextSelector ? section.querySelector(secondaryTextSelector) : null;
        const logo = logoSelector ? section.querySelector(logoSelector) : null;
    
        // Animação do título e texto primário (como antes)
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
    
        // Agora a animação do secundário SEM depender do bloco acima!
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
    

    // gsap.to(".section-transition:not(:last-child)", {
    //   yPercent: -100, 
    //   ease: "none",
    //   stagger: 0.5,
    //   scrollTrigger: {
    //     trigger: "#container",
    //     start: "top top",
    //     end: "+=300%",
    //     scrub: true,
    //     pin: true
    //   }
    // });

    // gsap.set(".section-transition", {zIndex: (i, target, targets) => targets.length - i});


    // ##################################################################################
                        // ANIMAÇÕES DA NAVEGAÇÃO DO MENU //
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
              // Após abrir o overlay, faz fade-in stagger dos itens do menu:
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
          delay: 0.36, // Dá tempo dos itens sumirem primeiro
          ease: "power2.in",
          onComplete: () => {
            menuOverlay.classList.remove('menu-open');
            menuOverlay.style.visibility = 'hidden';
            // Reseta os itens para o próximo open
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
                        // ANIMAÇÕES DO SCROLL HORIZONTAL //
    // ##################################################################################

    const panels = gsap.utils.toArray(".panel");
    const horizontalSection = document.querySelector(".horizontal-scroll-section");

    // Inicialização do ScrollSmoother
    if (horizontalSection && panels.length) {
        
        let scrollAmount = window.innerWidth * 1.5; // 150vw

        // Navegação do Scroll Horizontal
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

            gsap.set(splitHeading.words, { yPercent: 100, opacity: 1 }); // Começa "escondido" para baixo

            gsap.to(splitHeading.words, {
                yPercent: 0,
                duration: 1.2,
                delay: 1,
                ease: "power3.out",
                stagger: 0.02, // Letras vão subindo uma a uma
                scrollTrigger: {
                    trigger: headingWrapper,
                    start: "top 80%", // Quando 80% do wrapper entra na tela
                    once: true // Só anima uma vez
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
                stagger: 0.07, // Mais espaçado para multiline
                scrollTrigger: {
                    trigger: subtextWrapper,
                    start: "top 85%",
                    once: true
                }
            });
        }


        
        // Verifica se os elementos existem
        if (".panel-hero-logo" && ".panel-hero") {

            // Calcula a distância de scroll para o fade
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
        const lottieContainer = section.querySelector('#lottieLogoVertical');

        // Salva conteúdo original para reset
        const originalTitleHTML = title.innerHTML;
        const originalParagraph = paragraph.textContent;

        // Variável global para Lottie instance
        let lottieAnim = null;

        // Função de efeito typewriter manual
        function typewriterEffect(text, targetElem, cursorElem, onComplete) {
            let i = 0;
            targetElem.textContent = '';
            cursorElem.style.opacity = 1;
            function typeNextChar() {
            if (i < text.length) {
                targetElem.textContent += text[i++];
                setTimeout(typeNextChar, 72); // velocidade do typewriter (ms)
            } else {
                cursorElem.style.opacity = 0.7; // Mantém cursor visível no final
                if (typeof onComplete === 'function') onComplete();
            }
            }
            typeNextChar();
        }

        // Função de reset do estado inicial
        function resetSection() {
            // Reset do título
            title.innerHTML = originalTitleHTML;
            title.classList.remove('section-typing_text');
            // Reset do parágrafo
            paragraph.textContent = originalParagraph;
            paragraph.style.opacity = '';
            paragraph.style.transform = '';
            paragraph.style.opacity = '0'; // Esconde ao resetar

            // Reset do Lottie
            if (lottieAnim) {
            lottieAnim.destroy();
            lottieAnim = null;
            }
            lottieContainer.innerHTML = '';
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

        // Animação 1: Título com typewriter
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
            // Inicia efeito typewriter e segue após terminar
            return gsap.delayedCall(0, () => {
            typewriterEffect('. . . COMEÇA NO PRESENTE', typewriterSpan, cursorSpan, () => {
                timeline.play(); // Segue para o próximo passo da timeline
            });
            timeline.pause(); // Pausa timeline até terminar typewriter
            });
        });

        // Animação 2: Parágrafo com SplitText (linhas subindo)
        timeline.to({}, { duration: 0.3 }); // Pequeno delay
        timeline.add(() => {
            const split = createSplitTextOnce(paragraph, { type: "lines", linesClass: "split-line", mask: "lines" });

            gsap.set(paragraph, { opacity: 1 }); // Garante que só aparece quando animar
            gsap.set(split.lines, { yPercent: 100, opacity: 1 });
            gsap.to(split.lines, {
            yPercent: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.13,
            onComplete: () => {
                timeline.play(); // Segue para Lottie
            }
            });
            timeline.pause(); // Pausa timeline até SplitText terminar
        });

        // Animação 3: Lottie, só depois do texto
        timeline.to({}, { duration: 0.0 }); // Delay opcional
        timeline.add(() => {
            // Limpa Lottie anterior se houver
            if (lottieAnim) {
            lottieAnim.destroy();
            lottieAnim = null;
            }
            lottieContainer.innerHTML = '';
            // Inicia Lottie
            lottieAnim = lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: './assets/logo-vertical-cor-2.json'
            });
        });

        // Painel 4: Animação do título vindo da esquerda no scroll horizontal

        // 1. Seletor do título
        const orangeTitle = document.querySelector('.panel-content-orange-title');
        const orangePanel = document.querySelector('.panel.panel-content-orange');

        // 2. Animação: título sai da esquerda e entra na posição original
        if (orangeTitle && orangePanel) {
            // Define o quanto ele vai começar fora da tela (em px ou em %)
            gsap.set(orangeTitle, { x: '-120%', opacity: 0.8 }); // começa bem fora da esquerda

            gsap.to(orangeTitle, {
                x: '0%',
                opacity: 0.8,
                ease: 'expo.out',
                duration: 1.2,
                scrollTrigger: {
                trigger: orangePanel,
                containerAnimation: scrollHorizontal, // sua timeline de scroll horizontal
                start: 'left 72%',  // Quando a seção começa a entrar na viewport
                end: 'right 80%',   // Fim da animação (ajuste conforme quiser)
                scrub: 3,             // Faz o movimento ser suave e atrelado ao scroll
                // markers: true,     // Habilite para debugar a animação
                }
            });
        }
    }



// ##################################################################################
                        // ANIMAÇÃO DO HEADER "SOBRE NÓS" //
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
// ANIMAÇÃO "MINIMIZANDO RISCOS" COM SCROLLTRIGGER SIMPLES
// ##################################################################################  

    // Elementos
    const minimizandoTitle = document.querySelector('.minimizando-title');
    const riscosTitle = document.querySelector('.riscos-title');
    const subtitleWrapper = document.querySelector('.minimizando-subtitle-wrapper');
    const minimizandoContainer = document.querySelector('.minimizando-riscos-container');

    if (minimizandoContainer && minimizandoTitle && riscosTitle && subtitleWrapper) {
    // Estado inicial dos elementos (fora de lugar, invisível se quiser fade)
    gsap.set(minimizandoTitle, { x: 80 });            // Começa mais à direita
    gsap.set(riscosTitle, { x: -100 });                // Começa mais à esquerda (opcional, para dar mais movimento)
    gsap.set(subtitleWrapper, { x: 80, opacity: 0 }); // Fora e invisível

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

    // Subtítulo + seta deslizam para a esquerda e fazem fade in
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
// SLIDE SEÇÃO SOBRE NÓS
// ##################################################################################


    const itsSection = document.querySelector('.image-text-slider-section');
    if (!itsSection) return;
  
    const itsContainer = itsSection.querySelector('.its-container');
    const itsContentSlider = itsSection.querySelector('.its-content-slider');
    const slides = itsSection.querySelectorAll('.its-slide');
    const itsBgImages = itsSection.querySelectorAll('.its-image-frame .its-slide-bg-image');
  
    // ---- Animação Parallax & Zoom (usando GSAP ScrollTrigger, sem IntersectionObserver) ----
  
    if (itsContainer && itsContentSlider && itsBgImages.length > 0) {
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
    }
  
    const nextButton = itsSection.querySelector('.its-slider-navigation .its-arrow.next');
    const nextButtonTitleText = nextButton ? nextButton.querySelector('.its-next-slide-title-text') : null;
  
    // Parallax & zoom anim (mantém igual, omiti para clareza, use seu trecho anterior...)
  
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
      
            // Ativa o próximo slide (box inteiro)
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
      console.warn('Slider não pôde ser inicializado: elementos faltando ou contagem de slides/imagens não corresponde.');
    }



    // ##################################################################################
                        // ANIMAÇÃO TEXTOS HEADER "O QUE FAZEMOS"//
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
            trigger: '.oqf-header-elements', // igual à sua timeline original
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
        // Fade BG em toda a seção "O Que Fazemos"
        const oqfSection = document.querySelector('#o-que-fazemos');
        if (oqfSection) {
            gsap.set(oqfSection, { backgroundColor: 'rgba(153,179,129,0)' });
            gsap.timeline({
                scrollTrigger: {
                    trigger: diffTop, // mantém o header como gatilho
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
                        // ANIMAÇÃO ENTRADA DOS CARDS O QUE FAZEMOS//
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
        id: 'oqfCardsGridEntrance',
        onEnter: () => {
          setupQuestionMarquees(cardContainers); // Inicia marquee toda vez que a grid entra na viewport
        },
        onLeave: () => {
          resetMarqueeTimelines(); // Reseta marquee quando sai da viewport
        },
        onEnterBack: () => {
          setupQuestionMarquees(cardContainers); // Inicia de novo ao voltar
        },
        onLeaveBack: () => {
          resetMarqueeTimelines(); // Reseta ao sair para cima
        }
    }
    // ,
    // onComplete: () => {
    //     setupQuestionMarquees(cardContainers);
    // }
    });

    cardsTimeline.fromTo(cardContainers, 
    { opacity: 0, scale: 0.8, y: 50, transformOrigin: "bottom center" },
    { opacity: 1, scale: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power2.out" }
    );




    // ##################################################################################
                        // FUNÇÃO PARA CONFIGURAR O EFEITO MARQUEE NOS CARDS //
    // ##################################################################################

    // Array para armazenar as timelines de marquee dos cards
    // let oqfMarqueeTimelines = [];

    // function setupQuestionMarquees(cardContainers) {
    //     // Limpa timelines anteriores
    //     oqfMarqueeTimelines.forEach(tl => tl && tl.kill());
    //     oqfMarqueeTimelines = [];

    //     // Pequeno delay para garantir cálculo de largura correta
    //     gsap.delayedCall(0.1, () => {
    //         cardContainers.forEach((cardContainer, index) => {
    //             const questionEl = cardContainer.querySelector('.oqf-question');
    //             const cardFrontEl = cardContainer.querySelector('.oqf-card-front');
    //             if (!questionEl || !cardFrontEl) {
    //                 oqfMarqueeTimelines[index] = null;
    //                 return;
    //             }

    //             const questionWidth = questionEl.scrollWidth;
    //             const cardFrontWidth = cardFrontEl.offsetWidth;
    //             const pixelsPerSecond = 100;
    //             const finalX = -questionWidth - 30;
    //             const duration = (cardFrontWidth - finalX) / pixelsPerSecond;

    //             // Cria a timeline do marquee
    //             const marqueeTimeline = gsap.timeline({ repeat: -1, paused: true });
    //             marqueeTimeline.set(questionEl, { x: cardFrontWidth, autoAlpha: 1 })
    //             .to(questionEl, { x: finalX, duration: duration, ease: 'none' })
    //             .set(questionEl, { x: cardFrontWidth }); // Reset para recomeçar o loop

    //             oqfMarqueeTimelines[index] = marqueeTimeline;

    //             // Stagger inicial
    //             const delays = [0.1, 0.5, 0.2, 0.6, 0.3, 0.7];
    //             const delay = delays[index] !== undefined ? delays[index] : 0;
    //             gsap.delayedCall(delay, () => marqueeTimeline.play());
    //         });
    //     });
    // }


    // ##################################################################################
                        // FUNÇÃO PARA CONFIGURAR O EFEITO FLIP NOS CARDS //
    // ##################################################################################

    // Seletores principais
    const oqfCardContainers = document.querySelectorAll('.oqf-card-container');
    const oqfGrid = document.querySelector('.oqf-grid');

    // Array global para armazenar as timelines de flip
    let oqfFlipTimelines = [];

    // Função para configurar flips (independente de qualquer marquee)
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

    // Função para resetar todos os flips quando grid sai da viewport
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
            onLeave: () => {
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
//                  ANIMAÇÃO SLIDES DIFERENCIAIS + SPLITTEXT não scrubbado
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

// Inicializa todos os slides: só o primeiro visível no início
diferenciaisSlides.forEach((slide, i) => {
  slide.style.zIndex = i;
  slide.style.visibility = i === 0 ? 'visible' : 'hidden';
  gsap.set(slide, { y: 0 });
});

// ============== OVERLAY DO PRIMEIRO SLIDE (fade independente, sem scrub) ==============
const firstSlide = diferenciaisSlides[0];
if (firstSlide) {
  const firstOverlay = firstSlide.querySelector('.diferenciais-overlay');
  if (firstOverlay) {
    gsap.set(firstOverlay, { opacity: 0 });

    let userScrolled = false;

    // Escuta qualquer rolagem de usuário
    window.addEventListener('scroll', () => {
      userScrolled = true;
    }, { once: true });

    ScrollTrigger.create({
      trigger: firstSlide,
      start: 'top 15%',
      end: 'bottom top',
      onEnter: () => {
        // Só faz fade-in se foi scroll do usuário
        if (userScrolled) {
          gsap.to(firstOverlay, { opacity: 0.75, duration: 1.2, ease: 'power2.out' });
        } else {
          gsap.set(firstOverlay, { opacity: 0.75 });
        }
      },
      onLeave: () => {
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
        // Slide está entrando
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
        // Quando slide está animando: dispara reveal uma única vez
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

          // Animação do <p>
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

// ============== HACK: Força animação do texto do primeiro slide ao entrar no topo ==============
ScrollTrigger.create({
  trigger: container,
  start: "top top",
  end: "+=1", // só para executar uma vez
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





// ##################################################################################
//                  ANIMAÇÃO TÍTULO CONTATO
// ##################################################################################

    // Certifique-se de que gsap esteja carregado
    gsap.set('.word-esq', { x: '120%', opacity: 0 });
    gsap.set('.word-dir', { x: '-120%', opacity: 0 });
    gsap.set('#contato-form', { opacity: 0 });
    gsap.set('.contato-card', { opacity: 0 });

    // Fade in do formulário (sem scrub)
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
        start: 'top 75%', // ajuste para iniciar a animação quando desejar
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



      // ##################################################################################
      //                  ANIMAÇÃO FUNDO MINIMIZANDO RISCOS
      // ##################################################################################
      
      // Fade in/out background color for the “Sobre” section
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