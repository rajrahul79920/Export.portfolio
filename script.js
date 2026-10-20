(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  $("#year").textContent = new Date().getFullYear();

  // Split scroll-reveal paragraphs into words
  $$(".reveal-words").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
  });

  // Product card slideshows
  $$(".slides").forEach((s, i) => {
    const imgs = $$("img", s);
    if (imgs.length < 2 || reduce) return;
    let k = 0;
    setTimeout(() => setInterval(() => {
      imgs[k].classList.remove("is-on");
      k = (k + 1) % imgs.length;
      imgs[k].classList.add("is-on");
    }, 2800), i * 600);
  });

  // Without GSAP (offline / blocked CDN) or with reduced motion: show everything, no scroll effects
  if (!window.gsap || !window.ScrollTrigger || reduce) {
    $$(".reveal-words .w").forEach((w) => w.classList.add("on"));
    document.documentElement.classList.add("no-motion");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const vh = () => window.innerHeight;
  const vw = () => window.innerWidth;

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id === "#top" ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else if (target === 0) scrollTo({ top: 0, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  }));

  /* ---------- Hero: intro ---------- */
  const baseFilter = "grayscale(1) sepia(0.32) contrast(1.08) brightness(0.82)";
  const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
  intro
    .fromTo(".hero__img",
      { yPercent: 16, opacity: 0, filter: `${baseFilter} blur(14px)` },
      { yPercent: 0, opacity: 1, filter: `${baseFilter} blur(0px)`, duration: 1.8 })
    .from(".hero__glow", { scale: 0.4, opacity: 0, duration: 2 }, 0)
    .from(".hero__title .m > span", { yPercent: 115, duration: 1.3, stagger: 0.07 }, 0.3)
    .from(".hero__title .badge, .hero__intro", { opacity: 0, y: 24, duration: 1.1, stagger: 0.12 }, 0.8)
    .from(".hero__bar, .hero__foot, .dock", { opacity: 0, duration: 1 }, 1);

  // Idle "breathing" on the portrait
  gsap.to(".hero__img", { scale: 1.022, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.8 });
  gsap.to(".hero__glow", { opacity: 0.6, duration: 2.8, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2 });

  // Mouse parallax: portrait leans toward the cursor, title drifts the other way
  if (finePointer) {
    gsap.set(".hero__tilt", { transformPerspective: 1000, transformOrigin: "50% 100%" });
    const tx = gsap.quickTo(".hero__tilt", "x", { duration: 1.2, ease: "power3" });
    const ty = gsap.quickTo(".hero__tilt", "y", { duration: 1.2, ease: "power3" });
    const ry = gsap.quickTo(".hero__tilt", "rotationY", { duration: 1.2, ease: "power3" });
    const hx = gsap.quickTo(".hero__title", "x", { duration: 1.4, ease: "power3" });
    const gx = gsap.quickTo(".hero__glow", "x", { duration: 2, ease: "power3" });
    const gy = gsap.quickTo(".hero__glow", "y", { duration: 2, ease: "power3" });
    window.addEventListener("mousemove", (e) => {
      if (window.scrollY > vh()) return;
      const nx = e.clientX / vw() - 0.5;
      const ny = e.clientY / vh() - 0.5;
      tx(nx * 26); ty(ny * 10); ry(nx * 7);
      hx(nx * -22);
      gx(nx * 160); gy(ny * 90);
    });
  }

  // Hero recedes as the next section slides over it
  gsap.timeline({ scrollTrigger: { trigger: ".what", start: "top bottom", end: "top top", scrub: true } })
    .to(".hero__figure", { scale: 0.86, yPercent: 6, transformOrigin: "50% 100%", ease: "none" }, 0)
    .to(".hero__title", { yPercent: -40, ease: "none" }, 0)
    .to(".hero__bar, .hero__foot", { opacity: 0, ease: "none" }, 0);

  /* ---------- Cursor square + product preview ---------- */
  if (finePointer) {
    const sq = $(".cursor-sq");
    const fol = $(".follow");
    const folImg = $(".follow__img img");
    const sx = gsap.quickTo(sq, "x", { duration: 0.55, ease: "power3" });
    const sy = gsap.quickTo(sq, "y", { duration: 0.55, ease: "power3" });
    const fx = gsap.quickTo(fol, "x", { duration: 0.7, ease: "power3" });
    const fy = gsap.quickTo(fol, "y", { duration: 0.7, ease: "power3" });
    let shown = false;
    window.addEventListener("mousemove", (e) => {
      if (!shown) { gsap.to(sq, { opacity: 1, duration: 0.4 }); shown = true; }
      sx(e.clientX - 52); sy(e.clientY + 38);
      fx(e.clientX + 24); fy(e.clientY - 70);
    });
    $$(".product").forEach((p) => {
      p.addEventListener("mouseenter", () => {
        folImg.src = p.dataset.follow;
        gsap.to(fol, { scale: 1, opacity: 1, rotation: 0, duration: 0.5, ease: "back.out(1.6)" });
      });
      p.addEventListener("mouseleave", () => gsap.to(fol, { scale: 0, opacity: 0, rotation: -8, duration: 0.35, ease: "power2.in" }));
    });
  }

  // Little floating squares
  gsap.to(".sq-deco", { y: -12, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1 });

  /* ---------- Word-by-word reveal ---------- */
  $$(".reveal-words").forEach((el) => {
    const words = $$(".w", el);
    const inWhat = el.closest(".what");
    ScrollTrigger.create({
      trigger: inWhat || el,
      start: inWhat ? "top 55%" : "top 85%",
      end: inWhat ? "top -60%" : "bottom 45%",
      onUpdate: (self) => {
        const n = Math.round(self.progress * words.length);
        words.forEach((w, i) => w.classList.toggle("on", i < n));
      },
    });
  });

  /* ---------- Floating spice cards rise through "What I do" ---------- */
  const fly = gsap.timeline({
    scrollTrigger: { trigger: ".what", start: "top 35%", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true },
  });
  $$(".fl").forEach((el, i) => {
    const sp = parseFloat(el.dataset.speed) || 1;
    fly.fromTo(el,
      { y: 0, rotation: i % 2 ? 5 : -5 },
      { y: () => -(vh() + el.offsetHeight) * 1.08 * sp, rotation: i % 2 ? -3 : 3, ease: "none", duration: 1 },
      i * 0.14);
  });

  /* ---------- Big headings: letters rise ---------- */
  $$(".split-up").forEach((h) => {
    [...h.childNodes].forEach((n) => {
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      [...n.textContent].forEach((c) => {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = c;
        frag.appendChild(s);
      });
      n.replaceWith(frag);
    });
    gsap.from($$(".ch", h), {
      yPercent: 60, opacity: 0, duration: 1, ease: "power4.out", stagger: 0.035,
      scrollTrigger: { trigger: h, start: "top 88%", toggleActions: "play none none reverse" },
    });
  });

  /* ---------- Products ---------- */
  $$(".product").forEach((p) => {
    const card = $(".product__card", p);
    gsap.fromTo(card,
      { clipPath: "inset(14% 10% 14% 10% round 8px)" },
      { clipPath: "inset(0% 0% 0% 0% round 8px)", ease: "none",
        scrollTrigger: { trigger: p, start: "top 95%", end: "top 40%", scrub: true } });
    gsap.to(card, {
      scale: 0.8, opacity: 0.25, transformOrigin: "50% 0%", ease: "none",
      scrollTrigger: { trigger: p, start: "bottom 75%", end: "bottom 5%", scrub: true },
    });
    gsap.fromTo($(".slides", p), { yPercent: -6 }, {
      yPercent: 6, ease: "none",
      scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true },
    });
    gsap.from($$(".product__info > *, .product__bottom > *", p), {
      y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08,
      scrollTrigger: { trigger: p, start: "top 70%", toggleActions: "play none none reverse" },
    });
  });
  gsap.from(".more__list li", {
    y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.05,
    scrollTrigger: { trigger: ".more", start: "top 80%", toggleActions: "play none none reverse" },
  });

  /* ---------- Markets: cards slide over the pinned giant text ---------- */
  gsap.from(".markets__giant span", {
    yPercent: 40, opacity: 0, duration: 1.2, ease: "power4.out", stagger: 0.1,
    scrollTrigger: { trigger: ".markets", start: "top 60%", toggleActions: "play none none reverse" },
  });
  $$(".mcard").forEach((c, i) => {
    gsap.fromTo(c,
      { y: 140, rotation: i % 2 ? 7 : -7 },
      { y: -140, rotation: i % 2 ? -3 : 3, ease: "none",
        scrollTrigger: { trigger: c, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- Counters ---------- */
  $$("[data-count]").forEach((el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    const obj = { v: 0 };
    el.textContent = "0" + suffix;
    gsap.to(obj, {
      v: target, duration: 1.8, ease: "power3.out",
      onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString("en-IN") + suffix; },
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
  gsap.from(".stat", {
    y: 50, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1,
    scrollTrigger: { trigger: ".stats", start: "top 85%" },
  });

  /* ---------- About ---------- */
  gsap.from(".about__start > *", {
    y: 50, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.12,
    scrollTrigger: { trigger: ".about__start", start: "top 80%" },
  });
  gsap.fromTo(".about__photo img", { yPercent: -10 }, {
    yPercent: 0, ease: "none",
    scrollTrigger: { trigger: ".about__photo", start: "top bottom", end: "bottom top", scrub: true },
  });

  /* ---------- On the ground: horizontal scroll ---------- */
  const track = $(".ground__track");
  const trackDist = () => Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
  gsap.to(track, {
    x: () => -trackDist(), ease: "none",
    scrollTrigger: {
      trigger: ".ground", start: "top top", end: () => "+=" + trackDist(),
      pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
    },
  });

  /* ---------- Focus ---------- */
  gsap.fromTo(".focus__photo img", { scale: 1.15 }, {
    scale: 1, ease: "none",
    scrollTrigger: { trigger: ".focus__photo", start: "top bottom", end: "bottom 40%", scrub: true },
  });
  gsap.from(".timeline__row, .focus .btn", {
    x: 40, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08,
    scrollTrigger: { trigger: ".timeline", start: "top 80%" },
  });

  /* ---------- Process ---------- */
  gsap.from(".step", {
    y: 60, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08,
    scrollTrigger: { trigger: ".steps", start: "top 80%" },
  });

  /* ---------- CTA: images burst out from the centre and fly past ---------- */
  const unit = (v) => {
    v = v.trim();
    return parseFloat(v) * (v.endsWith("vh") ? vh() : vw()) / 100;
  };
  const burst = gsap.timeline({
    scrollTrigger: { trigger: ".cta", start: "top 75%", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true },
  });
  burst.fromTo(".cta__center", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" }, 0.2);
  $$(".scatter figure").forEach((f) => {
    const cs = getComputedStyle(f);
    const X = () => unit(cs.getPropertyValue("--x"));
    const Y = () => unit(cs.getPropertyValue("--y"));
    const s = parseFloat(f.dataset.s) || 1;
    burst
      .fromTo(f,
        { x: () => X() * 0.1, y: () => Y() * 0.1, scale: 0.2, opacity: 0, rotation: gsap.utils.random(-20, 20) },
        { x: X, y: Y, scale: s, opacity: 1, rotation: 0, duration: 1, ease: "power2.out" }, 0)
      .to(f, { x: () => X() * 1.45, y: () => Y() * 1.45, scale: s * 1.5, opacity: 0.35, duration: 1, ease: "power1.in" }, 1.1);
  });

  /* ---------- Contact details ---------- */
  gsap.from(".clist li", {
    y: 40, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08,
    scrollTrigger: { trigger: ".clist", start: "top 85%" },
  });

  /* ---------- Footer logo ---------- */
  gsap.from(".logo--big, .footer__ready > *", {
    y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08,
    scrollTrigger: { trigger: ".footer", start: "top 85%" },
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
