(function initPolicyPaperSectionNav() {
    var shell = document.querySelector('.policy-article-nav-shell');
    var toggle = document.querySelector('.policy-article-nav-toggle');
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-policy-nav-target]'));
    var sections = links.map(function(link) { return document.getElementById(link.getAttribute('data-policy-nav-target')); }).filter(Boolean);

    if (!shell || !toggle || !sections.length) return;

    function setOpen(isOpen) {
        document.body.classList.toggle('policy-article-nav-open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
    }

    toggle.addEventListener('click', function() { setOpen(!document.body.classList.contains('policy-article-nav-open')); });
    links.forEach(function(link) { link.addEventListener('click', function() { setOpen(false); }); });

    function update() {
        var scrollY = window.pageYOffset || document.documentElement.scrollTop;
        var firstTop = sections[0].getBoundingClientRect().top + scrollY;
        shell.classList.toggle('is-visible', scrollY >= firstTop - 180);
        var active = sections[0].id;
        sections.forEach(function(section) {
            if (section.getBoundingClientRect().top <= 180) active = section.id;
        });
        links.forEach(function(link) { link.classList.toggle('active', link.getAttribute('data-policy-nav-target') === active); });
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
})();
