import { useEffect, useRef } from 'react';

// Node hues mirror `landing.glow.*` in tailwind.config.js (cyan/blue/purple).
// WebGL needs raw numeric colors, so they can't come from a Tailwind class.
const NODE_COLORS = [0x22d3ee, 0x4f8bff, 0xa970ff];
const CURSOR_TINT = 0x9fc0ff;

/**
 * Interactive WebGL background behind the hero: a slow-drifting network of nodes
 * that link up when they get close, link to the cursor, and gently part around
 * it — a nod to Zeno connecting the pieces of a project.
 *
 * `three` is dynamically imported inside the effect so it stays out of the
 * initial welcome bundle and never blocks first paint. If WebGL is unavailable
 * or the import fails, the static CSS glow (`.landing-glow-hero`) still shows.
 * Under prefers-reduced-motion it renders a single static frame with no loop.
 */
const HeroCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanup = () => {};

    void import('three')
      .then((T) => {
        if (disposed || !containerRef.current) return;

        const prefersReducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches;

        let width = container.clientWidth;
        let height = container.clientHeight;
        if (width === 0 || height === 0) return;

        const renderer = new T.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'low-power',
        });
        const dpr = Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height);
        renderer.domElement.className = 'landing-hero-canvas';
        container.appendChild(renderer.domElement);

        const scene = new T.Scene();
        // Orthographic camera in pixel space: (0,0) top-left, (w,h) bottom-right.
        const camera = new T.OrthographicCamera(0, width, 0, height, -10, 10);

        const count = Math.min(
          Math.max(Math.round((width * height) / 15000), 36),
          110,
        );
        const nodes = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 16, // px per second
          vy: (Math.random() - 0.5) * 16,
          color: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)],
        }));

        // Nodes (points).
        const nodePos = new Float32Array(count * 3);
        const nodeCol = new Float32Array(count * 3);
        const scratch = new T.Color();
        nodes.forEach((n, i) => {
          scratch.setHex(n.color);
          nodeCol[i * 3] = scratch.r;
          nodeCol[i * 3 + 1] = scratch.g;
          nodeCol[i * 3 + 2] = scratch.b;
        });
        const nodeGeo = new T.BufferGeometry();
        nodeGeo.setAttribute('position', new T.BufferAttribute(nodePos, 3));
        nodeGeo.setAttribute('color', new T.BufferAttribute(nodeCol, 3));
        const nodeMat = new T.PointsMaterial({
          size: 2.6 * dpr,
          vertexColors: true,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: T.AdditiveBlending,
          sizeAttenuation: false,
        });
        const points = new T.Points(nodeGeo, nodeMat);
        scene.add(points);

        // Links (line segments) — rebuilt each frame, capped by a generous
        // pre-allocated buffer (all pairs would be count*(count-1)/2).
        const maxSegments = count * count;
        const linePos = new Float32Array(maxSegments * 2 * 3);
        const lineCol = new Float32Array(maxSegments * 2 * 3);
        const lineGeo = new T.BufferGeometry();
        lineGeo.setAttribute('position', new T.BufferAttribute(linePos, 3));
        lineGeo.setAttribute('color', new T.BufferAttribute(lineCol, 3));
        const lineMat = new T.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          blending: T.AdditiveBlending,
        });
        const lines = new T.LineSegments(lineGeo, lineMat);
        scene.add(lines);

        const linkDist = Math.min(width, height) * 0.19;
        const cursorDist = linkDist * 1.5;
        const pointer = { x: -9999, y: -9999, active: false };

        const onPointerMove = (event: PointerEvent) => {
          const rect = container.getBoundingClientRect();
          pointer.x = event.clientX - rect.left;
          pointer.y = event.clientY - rect.top;
          pointer.active = true;
        };
        window.addEventListener('pointermove', onPointerMove);

        let segment = 0;
        const addSegment = (
          x1: number,
          y1: number,
          x2: number,
          y2: number,
          r: number,
          g: number,
          b: number,
        ) => {
          const o = segment * 6;
          linePos[o] = x1;
          linePos[o + 1] = y1;
          linePos[o + 2] = 0;
          linePos[o + 3] = x2;
          linePos[o + 4] = y2;
          linePos[o + 5] = 0;
          lineCol[o] = r;
          lineCol[o + 1] = g;
          lineCol[o + 2] = b;
          lineCol[o + 3] = r;
          lineCol[o + 4] = g;
          lineCol[o + 5] = b;
          segment += 1;
        };

        const step = (dt: number) => {
          for (const n of nodes) {
            n.x += n.vx * dt;
            n.y += n.vy * dt;
            if (n.x < 0) {
              n.x = 0;
              n.vx *= -1;
            } else if (n.x > width) {
              n.x = width;
              n.vx *= -1;
            }
            if (n.y < 0) {
              n.y = 0;
              n.vy *= -1;
            } else if (n.y > height) {
              n.y = height;
              n.vy *= -1;
            }
            // Gentle repulsion so the network parts around the cursor.
            if (pointer.active) {
              const dx = n.x - pointer.x;
              const dy = n.y - pointer.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < cursorDist * cursorDist && d2 > 0.5) {
                const d = Math.sqrt(d2);
                const push = (1 - d / cursorDist) * 26 * dt;
                n.x += (dx / d) * push;
                n.y += (dy / d) * push;
              }
            }
          }

          nodes.forEach((n, i) => {
            nodePos[i * 3] = n.x;
            nodePos[i * 3 + 1] = n.y;
            nodePos[i * 3 + 2] = 0;
          });
          nodeGeo.attributes.position.needsUpdate = true;

          segment = 0;
          for (let i = 0; i < count; i += 1) {
            for (let j = i + 1; j < count; j += 1) {
              const dx = nodes[i].x - nodes[j].x;
              const dy = nodes[i].y - nodes[j].y;
              const d2 = dx * dx + dy * dy;
              if (d2 < linkDist * linkDist) {
                const a = (1 - Math.sqrt(d2) / linkDist) * 0.5;
                scratch.setHex(nodes[i].color);
                addSegment(
                  nodes[i].x,
                  nodes[i].y,
                  nodes[j].x,
                  nodes[j].y,
                  scratch.r * a,
                  scratch.g * a,
                  scratch.b * a,
                );
              }
            }
            if (pointer.active) {
              const dx = nodes[i].x - pointer.x;
              const dy = nodes[i].y - pointer.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < cursorDist * cursorDist) {
                const a = (1 - Math.sqrt(d2) / cursorDist) * 0.8;
                scratch.setHex(CURSOR_TINT);
                addSegment(
                  nodes[i].x,
                  nodes[i].y,
                  pointer.x,
                  pointer.y,
                  scratch.r * a,
                  scratch.g * a,
                  scratch.b * a,
                );
              }
            }
          }
          lineGeo.setDrawRange(0, segment * 2);
          lineGeo.attributes.position.needsUpdate = true;
          lineGeo.attributes.color.needsUpdate = true;
        };

        const onResize = () => {
          const w = container.clientWidth;
          const h = container.clientHeight;
          if (w === 0 || h === 0) return;
          width = w;
          height = h;
          camera.right = w;
          camera.bottom = h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        let frameId = 0;
        let last = performance.now();
        const animate = () => {
          const now = performance.now();
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          step(dt);
          renderer.render(scene, camera);
          frameId = window.requestAnimationFrame(animate);
        };

        if (prefersReducedMotion) {
          step(0);
          renderer.render(scene, camera);
        } else {
          animate();
        }

        cleanup = () => {
          if (frameId) window.cancelAnimationFrame(frameId);
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('resize', onResize);
          nodeGeo.dispose();
          nodeMat.dispose();
          lineGeo.dispose();
          lineMat.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => {
        // WebGL/three unavailable — the CSS glow layer is the graceful fallback.
      });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    />
  );
};

export default HeroCanvas;
