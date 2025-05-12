document.addEventListener("DOMContentLoaded", function() {
    gsap.registerPlugin(ScrollTrigger);

    const mainContentWrapper = document.getElementById("mainContentWrapper");
    const horizontalScrollSection = document.getElementById("horizontalScrollSection");
    const panels = gsap.utils.toArray(".panel");

    const panel1Hero = document.querySelector(".panel-hero");
    const panel1HeadingWrapper = document.querySelector(".hero-heading-wrapper");
    const panel1SubtextWrapper = document.querySelector(".hero-subtext-wrapper");
    const panel1Logo = document.querySelector(".panel-hero-logo"); // Logo is now position:fixed

    const panel3ImageContainer = document.querySelector(".panel-image-parallax-container");
    const panel3Image = document.querySelector(".panel-image-parallax-image");

    if (horizontalScrollSection && panels.length && mainContentWrapper) {
        let scrollAmount = window.innerWidth * 1.5; // 150vw

        const horizontalTween = gsap.to(horizontalScrollSection, {
            x: () => -scrollAmount,
            ease: "none",
            scrollTrigger: {
                trigger: mainContentWrapper, // Pin the main wrapper
                pin: true,
                scrub: 1,
                end: () => "+=" + scrollAmount, 
                invalidateOnRefresh: true
            }
        });

        // Parallax for Panel 1 Texts
        if (panel1Hero && panel1HeadingWrapper && panel1SubtextWrapper) {
            const panel1Width = panel1Hero.offsetWidth;
            gsap.to([panel1HeadingWrapper, panel1SubtextWrapper], {
                x: () => {
                    // Ajusta o valor de parallax baseado na largura da tela
                    const parallaxFactor = window.innerWidth < 768 ? -0.30 : -0.50;
                    return panel1Width * parallaxFactor;
                },
                ease: "none",
                scrollTrigger: {
                    trigger: panel1Hero, // Trigger based on panel1 itself
                    containerAnimation: horizontalTween, // Animation is controlled by the main horizontal scroll
                    start: "left right", // When left of panel1 hits right of viewport
                    end: "right left",   // When right of panel1 hits left of viewport
                    scrub: 1.5 // Smoother scrubbing
                }
            });
        }
        
        // Fade animation for FIXED Panel 1 Logo
        if (panel1Logo && panel1Hero) {
            const panel1ScrollDistanceForFade = panel1Hero.offsetWidth * 0.30;
            gsap.to(panel1Logo, {
                autoAlpha: 0, // Fade out
                ease: "none",
                scrollTrigger: {
                    trigger: horizontalScrollSection, // Trigger based on the scrolling container
                    containerAnimation: horizontalTween, // Animation is controlled by the main horizontal scroll
                    start: "left left", // Start fading as soon as horizontal scroll begins
                    end: () => "+=" + panel1ScrollDistanceForFade, // End fading when panel1 has scrolled 75% of its width
                    scrub: true,
                }
            });
        }

        // Parallax for Panel 3 Image
        if (panel3ImageContainer && panel3Image) {
            const imageContainerWidth = panel3ImageContainer.offsetWidth;
            const imageWidth = panel3Image.offsetWidth;
            const imageScrollAmount = imageWidth - imageContainerWidth;

            gsap.to(panel3Image, {
                x: () => -imageScrollAmount,
                ease: "none",
                scrollTrigger: {
                    trigger: panel3ImageContainer,
                    containerAnimation: horizontalTween,
                    start: "left right",
                    end: "right left",
                    scrub: 2
                }
            });
        }
    }

    const menuTrigger = document.getElementById("menuTrigger");
    const menuCloseTrigger = document.getElementById("menuCloseTrigger");
    const menuOverlay = document.getElementById("menuOverlay");

    if (menuTrigger && menuCloseTrigger && menuOverlay) {
        const menuTimeline = gsap.timeline({
            paused: true,
            onStart: () => {
                gsap.to(menuTrigger, { autoAlpha: 0, duration: 0.2 });
                document.body.style.overflow = "hidden"; // Prevent body scroll when menu is open
            },
            onReverseComplete: () => {
                gsap.to(menuTrigger, { autoAlpha: 1, duration: 0.2 });
                document.body.style.overflow = ""; // Restore body scroll
            }
        });

        menuTimeline.to(menuOverlay, {
            x: "0%",
            visibility: "visible",
            duration: 0.5,
            ease: "power2.inOut"
        });

        menuTrigger.addEventListener("click", () => {
            menuTimeline.play();
        });

        menuCloseTrigger.addEventListener("click", () => {
            menuTimeline.reverse();
        });

        const menuLinks = menuOverlay.querySelectorAll(".menu-nav a");
        menuLinks.forEach(link => {
            link.addEventListener("click", () => {
                menuTimeline.reverse();
                // Add smooth scroll to section if href is an ID
                const targetId = link.getAttribute("href");
                if (targetId && targetId.startsWith("#")) {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        // Ensure vertical sections are scrollable after horizontal pin ends
                        // This might need adjustment based on when the pin releases
                        // For now, a simple scrollIntoView after menu closes
                        setTimeout(() => {
                             targetElement.scrollIntoView({ behavior: "smooth" });
                        }, menuTimeline.duration() * 1000); // Wait for menu to close
                    }
                }
            });
        });
    }
});
