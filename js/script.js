/* ==========================
   ⚡ MR METAR.IA — script.js
   - Reveal on scroll
   - Mobile menu
   - Parallax section bg
   - 3D WebGL (Home + Tech) via Three.js
========================== */

(() => {
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu toggle
  const burger = $("#burger");
  const mobileMenu = $("#mobileMenu");

  const setMobileState = (open) => {
    if (!burger || !mobileMenu) return;
    burger.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.classList.toggle("is-open", open);
  };

  if (burger && mobileMenu) {
    burger.addEventListener("click", () => {
      const isOpen = burger.getAttribute("aria-expanded") === "true";
      setMobileState(!isOpen);
    });

    $$(".mobile__link", mobileMenu).forEach((a) => {
      a.addEventListener("click", () => setMobileState(false));
    });

    // close on outside click
    document.addEventListener("click", (e) => {
      const isOpen = burger.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;
      const inside = mobileMenu.contains(e.target) || burger.contains(e.target);
      if (!inside) setMobileState(false);
    });
  }

  // Reveal on scroll (IntersectionObserver)
  const revealEls = $$(".reveal");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) en.target.classList.add("in-view");
    });
  }, { threshold: 0.15 });

  revealEls.forEach(el => io.observe(el));

  // Parallax backgrounds
  const parallaxSections = $$(".section--parallax");
  const onScroll = () => {
    const y = window.scrollY || 0;
    parallaxSections.forEach(sec => {
      const bg = $(".section__bg", sec);
      if (!bg) return;
      const r = sec.getBoundingClientRect();
      const prog = (r.top + r.height * 0.5) / (window.innerHeight);
      const offset = (prog - 0.5) * 14; // subtle
      bg.style.transform = `translate3d(0, ${offset}px, 0) scale(1.03)`;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ==========================
  // 3D: Home + Tech (Three.js)
  // ==========================
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function supportsWebGL() {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch {
      return false;
    }
  }

  function fitRendererToCanvas(renderer, camera, canvas) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // Pointer tracking (mouse + touch)
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const updatePointer = (clientX, clientY) => {
    pointer.tx = (clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((clientY / window.innerHeight) * 2 - 1);
  };

  window.addEventListener("mousemove", (e) => updatePointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (!e.touches || !e.touches[0]) return;
    updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  // Smooth pointer
  const lerp = (a, b, t) => a + (b - a) * t;

  // Scene factory: neon particles + rotating mesh
  function initNeonScene(canvas, mode = "hero") {
    if (reduceMotion || !supportsWebGL() || !canvas || !window.THREE) {
      if (canvas) canvas.style.display = "none";
      return null;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearAlpha(0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.2, mode === "hero" ? 6.2 : 7.2);

    // Lights
    const key = new THREE.PointLight(0x39a9ff, 1.1, 50);
    key.position.set(2.5, 1.8, 6);
    scene.add(key);

    const rim = new THREE.PointLight(0x22f2ff, 0.9, 50);
    rim.position.set(-2.5, -1.2, 5);
    scene.add(rim);

    const purple = new THREE.PointLight(0x7c4dff, 0.85, 50);
    purple.position.set(0, 2.2, 3);
    scene.add(purple);

    // Neon particles
    const particleCount = mode === "hero" ? 900 : 650;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = mode === "hero" ? 6 : 5.2;
      const x = (Math.random() - 0.5) * radius * 2;
      const y = (Math.random() - 0.5) * radius * 1.4;
      const z = (Math.random() - 0.5) * radius * 1.6;

      pos[i3 + 0] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;

      const mix = Math.random();
      // blend between cyan and purple
      const c1 = { r: 0x22/255, g: 0xF2/255, b: 0xFF/255 };
      const c2 = { r: 0x7C/255, g: 0x4D/255, b: 0xFF/255 };
      col[i3 + 0] = lerp(c1.r, c2.r, mix);
      col[i3 + 1] = lerp(c1.g, c2.g, mix);
      col[i3 + 2] = lerp(c1.b, c2.b, mix);
    }

    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: mode === "hero" ? 0.028 : 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    const points = new THREE.Points(geom, mat);
    scene.add(points);

    // Central mesh
    const mesh = (() => {
      if (mode === "hero") {
        const g = new THREE.TorusKnotGeometry(1.15, 0.36, 180, 16);
        const m = new THREE.MeshStandardMaterial({
          color: 0x0b1022,
          metalness: 0.65,
          roughness: 0.25,
          emissive: 0x07102a,
          emissiveIntensity: 0.55
        });
        const o = new THREE.Mesh(g, m);
        o.position.set(0.8, -0.15, 0);
        return o;
      } else {
        const g = new THREE.IcosahedronGeometry(1.45, 1);
        const m = new THREE.MeshStandardMaterial({
          color: 0x060b16,
          metalness: 0.72,
          roughness: 0.20,
          emissive: 0x081a33,
          emissiveIntensity: 0.72
        });
        const o = new THREE.Mesh(g, m);
        o.position.set(-0.9, 0.0, 0);
        return o;
      }
    })();

    scene.add(mesh);

    // Wireframe overlay (glow-ish)
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: mode === "hero" ? 0x22f2ff : 0x39a9ff, transparent: true, opacity: 0.35 })
    );
    wire.position.copy(mesh.position);
    scene.add(wire);

    // Subtle fog for depth
    scene.fog = new THREE.FogExp2(0x020611, mode === "hero" ? 0.07 : 0.08);

    // Resize
    const onResize = () => fitRendererToCanvas(renderer, camera, canvas);
    window.addEventListener("resize", onResize);
    onResize();

    let t = 0;

    // animate
    function tick() {
      t += 0.0055;

      pointer.x = lerp(pointer.x, pointer.tx, 0.06);
      pointer.y = lerp(pointer.y, pointer.ty, 0.06);

      // camera parallax
      camera.position.x = (mode === "hero" ? 0.12 : 0.10) + pointer.x * 0.22;
      camera.position.y = (mode === "hero" ? 0.20 : 0.15) + pointer.y * 0.18;
      camera.lookAt(0, 0, 0);

      // rotate mesh & wire
      mesh.rotation.y += 0.006 + pointer.x * 0.003;
      mesh.rotation.x += 0.003 + pointer.y * 0.002;
      wire.rotation.copy(mesh.rotation);

      // drift particles
      points.rotation.y = t * (mode === "hero" ? 0.55 : 0.45);
      points.rotation.x = Math.sin(t * 0.6) * 0.08;

      // mild pulse
      mat.opacity = 0.82 + Math.sin(t * 2.1) * 0.08;

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();

    return { renderer, scene, camera };
  }

  // Init scenes
  const heroCanvas = document.getElementById("heroCanvas");
  const techCanvas = document.getElementById("techCanvas");
  initNeonScene(heroCanvas, "hero");
  initNeonScene(techCanvas, "tech");

  // TECH ring interaction (drag on mobile/desktop)
  const ring = document.getElementById("techRing");
  if (ring) {
    let dragging = false;
    let lastX = 0;
    let rotY = 0;

    const setRot = () => {
      ring.style.transform = `rotateY(${rotY}deg) rotateX(10deg)`;
      ring.style.animation = "none"; // manual overrides
    };

    const start = (x) => {
      dragging = true;
      lastX = x;
      ring.parentElement?.classList.add("dragging");
    };

    const move = (x) => {
      if (!dragging) return;
      const dx = x - lastX;
      lastX = x;
      rotY += dx * 0.35;
      setRot();
    };

    const end = () => {
      dragging = false;
      ring.parentElement?.classList.remove("dragging");
      // return to auto spin after a moment
      setTimeout(() => {
        if (!dragging) {
          ring.style.animation = "";
          ring.style.transform = "";
        }
      }, 900);
    };

    // mouse
    ring.addEventListener("mousedown", (e) => start(e.clientX));
    window.addEventListener("mousemove", (e) => move(e.clientX));
    window.addEventListener("mouseup", end);

    // touch
    ring.addEventListener("touchstart", (e) => {
      const t = e.touches?.[0];
      if (t) start(t.clientX);
    }, { passive: true });

    ring.addEventListener("touchmove", (e) => {
      const t = e.touches?.[0];
      if (t) move(t.clientX);
    }, { passive: true });

    ring.addEventListener("touchend", end);
  }
})();