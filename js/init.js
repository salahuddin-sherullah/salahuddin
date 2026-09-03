/**
 * init.js — Skel framework initialisation
 *
 * Responsibilities:
 *  1. Registers CSS breakpoints so skel injects the right stylesheet at each
 *     viewport width (global → xlarge → large → medium → small → xsmall).
 *  2. Configures the skel-layers plugin which provides:
 *       navPanel  — the slide-in sidebar navigation (visible at ≤980px)
 *       navButton — the fixed top bar with hamburger icon (visible at ≤980px)
 *
 * Mobile nav HTML is defined here (not in HTML files) because skel-layers
 * injects it as a DOM layer outside the normal document flow.
 *
 * To update nav links: edit the <nav id="nav"> block in each HTML file.
 * Skel's "moveElement" action copies it into the panel automatically.
 *
 * To update social links in the panel footer: edit the navPanel.html string
 * in the navPanel config below.
 */

(function($) {

    skel.init({
        reset: 'full',

        /* ── Responsive breakpoints ─────────────────────────────────────────
         * Each entry injects an additional CSS file when the viewport is at
         * or below the given pixel width. Files stack — medium rules also
         * apply at small and xsmall, and so on.
         * ──────────────────────────────────────────────────────────────────*/
        breakpoints: {

            // All screen sizes — main stylesheet
            global: {
                range: '*',
                href: 'css/style.css',
                containers: 1400,
                grid: {
                    gutters: { vertical: '4em', horizontal: 0 }
                }
            },

            // ≤1680px
            xlarge: {
                range: '-1680',
                href: 'css/style-xlarge.css',
                containers: 1200
            },

            // ≤1280px
            large: {
                range: '-1280',
                href: 'css/style-large.css',
                containers: 960,
                grid: { gutters: { vertical: '2.5em' } },
                viewport: { scalable: false }
            },

            // ≤980px — hides desktop header, shows mobile nav bar & panel
            medium: {
                range: '-980',
                href: 'css/style-medium.css',
                containers: '90%',
                grid: { collapse: 1 }
            },

            // ≤736px
            small: {
                range: '-736',
                href: 'css/style-small.css',
                containers: '90%',
                grid: { gutters: { vertical: '1.25em' } }
            },

            // ≤480px
            xsmall: {
                range: '-480',
                href: 'css/style-xsmall.css',
                grid: { collapse: 2 }
            }

        },

        plugins: {
            layers: {

                // Enable CSS transform-based slide animations
                config: { transform: true },

                /* ── navPanel ──────────────────────────────────────────────
                 * The slide-in sidebar that appears when the hamburger is
                 * tapped. Visible only at ≤980px (medium breakpoint).
                 *
                 * Structure injected into the DOM:
                 *   .nav-panel-header  — title + × close button
                 *   [nav#nav clone]    — page nav links (moved in by skel)
                 *   .nav-panel-footer  — LinkedIn / GitHub / X social links
                 *
                 * Styles: css/style-medium.css → #navPanel, .nav-panel-*
                 * ──────────────────────────────────────────────────────────*/
                navPanel: {
                    animation: 'pushX',       // slide content right as panel opens
                    breakpoints: 'medium',
                    clickToHide: true,         // tap outside panel to close
                    height: '100%',
                    hidden: true,
                    html: '<div style="background:#02061D;color:#FFFFFF;min-height:100%;display:flex;flex-direction:column;"><div class="nav-panel-header"><span style="color:#FFFFFF;">Main Menu</span><a class="nav-close" data-action="toggleLayer" data-args="navPanel" aria-label="Close menu" style="color:rgba(255,255,255,0.72);text-decoration:none;">&#215;</a></div><div data-action="moveElement" data-args="nav"></div><div class="nav-panel-footer"><p class="nav-footer-label">Connect</p><div class="nav-social-links"><a href="https://www.linkedin.com/in/sallauddinn/" target="_blank" rel="noopener" aria-label="LinkedIn" style="color:#FFFFFF;"><svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>LinkedIn</a><a href="https://github.com/sallauddinn" target="_blank" rel="noopener" aria-label="GitHub" style="color:#FFFFFF;"><svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>GitHub</a><a href="https://twitter.com/sallauddinn" target="_blank" rel="noopener" aria-label="X / Twitter" style="color:#FFFFFF;"><svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>X</a></div></div></div>',
                    orientation: 'vertical',
                    position: 'top-left',
                    side: 'left',
                    width: 270
                },

                /* ── navButton ─────────────────────────────────────────────
                 * The full-width fixed top bar shown at ≤980px.
                 * Contains an inline SVG hamburger on the left and the site
                 * name to the right of it.
                 *
                 * width: '100%' is important — skel applies this as an inline
                 * style, so it must be set here (not just in CSS) to span the
                 * full viewport.
                 *
                 * Styles: css/style-medium.css → #navButton, .nav-site-name
                 * ──────────────────────────────────────────────────────────*/
                navButton: {
                    breakpoints: 'medium',
                    height: '56px',
                    html: '<a class="toggle" data-action="toggleLayer" data-args="navPanel" aria-label="Open menu" style="color:#FFFFFF;font-family:Inter,sans-serif;"><svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="5" width="24" height="2.5" rx="1.25" fill="#FFFFFF"/><rect x="1" y="12" width="24" height="2.5" rx="1.25" fill="#FFFFFF"/><rect x="1" y="19" width="24" height="2.5" rx="1.25" fill="#FFFFFF"/></svg><span class="nav-site-name">SALAHUDDIN</span></a>',
                    position: 'top-left',
                    side: 'top',
                    width: '100%'  // must match here; skel sets this as an inline style
                }

            }
        }
    });

    $(function() {
        var body = document.body;
        var articleStart = document.querySelector('[data-reading-start]');

        if (!body.classList.contains('article-page') ||
            body.getAttribute('data-reading-progress') === 'off' ||
            !articleStart) {
            return;
        }

        var progress = document.createElement('aside');
        var progressContent = document.createElement('div');
        var progressArticle = document.createElement('div');
        var progressKicker = document.createElement('span');
        var progressTitle = document.createElement('span');
        var progressActions = document.createElement('div');
        var progressFill = document.createElement('div');
        var pageTitle = document.querySelector('h1:not(.nav-title)');
        var articleKicker = document.querySelector('.textbox');
        var footer = document.getElementById('footer');
        var ticking = false;

        progress.className = 'reading-progress';
        progress.setAttribute('aria-label', 'Article reading tools');
        progressContent.className = 'reading-progress__content';
        progressArticle.className = 'reading-progress__article';
        progressKicker.className = 'reading-progress__kicker';
        progressKicker.textContent = articleKicker ? articleKicker.textContent.trim() : 'Article';
        progressTitle.className = 'reading-progress__title';
        progressTitle.textContent = pageTitle ? pageTitle.textContent.trim() : document.title;
        progressActions.className = 'reading-progress__actions';
        progressFill.className = 'reading-progress__fill';
        progressArticle.appendChild(progressKicker);
        progressArticle.appendChild(progressTitle);
        progressContent.appendChild(progressArticle);
        progressContent.appendChild(progressActions);
        progress.appendChild(progressContent);
        progress.appendChild(progressFill);
        body.appendChild(progress);

        function createAction(label, icon, handler) {
            var action = document.createElement('button');
            action.type = 'button';
            action.className = 'reading-progress__action';
            action.setAttribute('aria-label', label);
            action.innerHTML = icon;
            action.addEventListener('click', handler);
            progressActions.appendChild(action);
            return action;
        }

        var shareIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"></path></svg>';
        var printIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v7H6z"></path></svg>';
        var bookmarkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v20l-6-4-6 4z"></path></svg>';

        createAction('Share this article', shareIcon, function() {
            var shareData = { title: progressTitle.textContent, url: window.location.href };

            if (navigator.share) {
                navigator.share(shareData).catch(function() {});
            } else if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(shareData.url).catch(function() {});
            }
        });
        createAction('Print this article', printIcon, function() { window.print(); });
        var bookmarkAction = createAction('Save this article', bookmarkIcon, function() {
            bookmarkAction.classList.toggle('is-saved');
            bookmarkAction.setAttribute('aria-label', bookmarkAction.classList.contains('is-saved') ? 'Remove saved article' : 'Save this article');
        });

        function fixedNavigationHeight() {
            var mobileNavigation = document.getElementById('navButton');
            var desktopNavigation = document.getElementById('header');
            var navigation = mobileNavigation || desktopNavigation;

            return navigation ? navigation.getBoundingClientRect().height : 0;
        }

        function updateReadingProgress() {
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            var navigationHeight = fixedNavigationHeight();
            var start = articleStart.getBoundingClientRect().top + scrollTop - navigationHeight;
            var footerTop = footer ? footer.getBoundingClientRect().top + scrollTop : document.documentElement.scrollHeight;
            var end = Math.max(start + 1, footerTop - window.innerHeight + navigationHeight);
            var value = Math.max(0, Math.min(100, ((scrollTop - start) / (end - start)) * 100));
            var isReading = scrollTop >= start && scrollTop < footerTop;

            progressFill.style.width = value + '%';
            progress.classList.toggle('is-visible', isReading);
            ticking = false;
        }

        function requestUpdate() {
            if (!ticking) {
                window.requestAnimationFrame(updateReadingProgress);
                ticking = true;
            }
        }

        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate);
        window.addEventListener('load', requestUpdate);
        requestUpdate();
    });

})(jQuery);
