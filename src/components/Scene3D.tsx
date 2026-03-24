"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// ═══════════════════════════════════════════════
//  Camera keyframes: [scrollT, posXYZ, lookXYZ]
// ═══════════════════════════════════════════════
const KF = [
  { t: 0.0, p: [0, 0.3, 13], l: [0, 0.8, 0] },
  { t: 0.12, p: [0, 1.5, 10], l: [0, 1.2, 0] },
  { t: 0.2, p: [2, 3, 8], l: [0, 2, 0] },
  { t: 0.3, p: [0, 4.5, 6], l: [0, 3.2, 0] },
  { t: 0.38, p: [-2, 4, 5], l: [0, 3, 0] },
  { t: 0.45, p: [0, 5.5, 4], l: [0, 4.5, 0] },
  { t: 0.52, p: [0, 4, 2], l: [0, 3, -1] },
  { t: 0.58, p: [0, 2.8, 0.4], l: [0, 2, -2] },
  { t: 0.64, p: [0, 1.9, -0.3], l: [0, 1.5, -5] },
  { t: 0.7, p: [0, 1.4, -2], l: [0, 0.8, -8] },
  { t: 0.78, p: [-4, 0, -6], l: [0, 0.5, 0] },
  { t: 0.86, p: [0, -1.5, 10], l: [0, 0.5, 0] },
  { t: 0.93, p: [0, -2.5, 11], l: [0, -0.5, 0] },
  { t: 1.0, p: [0, -3.2, 13], l: [0, -1, 0] },
];

// Section visibility windows: [id, start, end, dotIndex]
const SECTIONS: [string, number, number, number][] = [
  ["s-hero", 0.0, 0.1, 0],
  ["s-about", 0.14, 0.34, 1],
  ["s-threshold", 0.56, 0.72, 2],
  ["s-album", 0.75, 0.88, 3],
  ["s-tour", 0.88, 0.97, 4],
  ["s-contact", 0.95, 1.0, 5],
];

export default function Scene3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    // ── RENDERER ──
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x010c12);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ── SCENE & CAMERA ──
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x010c12, 0.055);
    const camera = new THREE.PerspectiveCamera(58, W / H, 0.05, 300);
    camera.position.set(0, 0.2, 13);

    const clock = new THREE.Clock();

    // ════════════════
    //  LIGHTING
    // ════════════════
    scene.add(new THREE.AmbientLight(0x081828, 2.2));

    const bulbPt = new THREE.PointLight(0x60f0f0, 10, 35);
    bulbPt.position.set(0, 4.2, 0);
    bulbPt.castShadow = true;
    scene.add(bulbPt);

    const fillPt1 = new THREE.PointLight(0x003850, 3, 22);
    fillPt1.position.set(0, -6, 4);
    scene.add(fillPt1);

    const fillPt2 = new THREE.PointLight(0x002840, 2, 28);
    fillPt2.position.set(-9, 1, 4);
    scene.add(fillPt2);

    const fillPt3 = new THREE.PointLight(0x001a30, 1.5, 28);
    fillPt3.position.set(9, 3, 2);
    scene.add(fillPt3);

    const interiorPt = new THREE.PointLight(0xa0ffff, 0, 12);
    interiorPt.position.set(0, 1.8, 0);
    scene.add(interiorPt);

    // ════════════════
    //  HEAD GEOMETRY
    // ════════════════
    const profile: [number, number][] = [
      [0.0, -4.2], [0.65, -3.6], [0.88, -3.0], [1.2, -2.4],
      [1.55, -1.8], [1.72, -1.1], [1.85, -0.4], [1.92, 0.3],
      [1.95, 1.0], [1.88, 1.7], [1.75, 2.3], [1.55, 2.9],
      [1.28, 3.4], [0.9, 3.7], [0.48, 3.9], [0.0, 4.0],
    ];
    const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
    const headGeo = new THREE.LatheGeometry(pts, 48);

    // Organic displacement
    const pos = headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      const n =
        Math.sin(x * 3.1 + y * 2.7) * Math.cos(z * 2.3) * 0.06;
      pos.setXYZ(i, x + n, y + n * 0.3, z + n);
    }
    headGeo.computeVertexNormals();

    const headMat = new THREE.MeshStandardMaterial({
      color: 0x1c2a36,
      roughness: 0.88,
      metalness: 0.08,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.castShadow = true;
    scene.add(headMesh);

    // Inner surface
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x080e14,
      emissive: 0x003040,
      emissiveIntensity: 0.8,
      roughness: 0.95,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(headGeo, innerMat));

    // ════════════════
    //  LIGHT BULB
    // ════════════════
    const bulbGroup = new THREE.Group();
    bulbGroup.position.set(0, 5.2, 0);
    scene.add(bulbGroup);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xc8ffff,
      emissiveIntensity: 4,
      roughness: 0,
      metalness: 0,
      transparent: true,
      opacity: 0.92,
    });
    bulbGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 20), bulbMat));

    // Glow halos
    [1.0, 1.6, 2.5, 3.8].forEach((r, i) => {
      bulbGroup.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(r, 8, 8),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(0.15, 0.9, 0.9),
            transparent: true,
            opacity: 0.07 - i * 0.012,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.BackSide,
          })
        )
      );
    });

    // Wire cord
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1.4, 4),
      new THREE.MeshBasicMaterial({ color: 0x303030 })
    );
    cord.position.y = 0.9;
    bulbGroup.add(cord);

    // ════════════════
    //  BRANCHES
    // ════════════════
    const branchMat = new THREE.MeshStandardMaterial({
      color: 0x6b5840,
      roughness: 0.95,
      metalness: 0,
    });

    function makeBranch(
      a: THREE.Vector3,
      b: THREE.Vector3,
      thick: number,
      depth: number
    ) {
      const dir = new THREE.Vector3().subVectors(b, a);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      const cyl = new THREE.CylinderGeometry(thick * 0.55, thick, len, 5);
      const m = new THREE.Mesh(cyl, branchMat);
      m.position.copy(mid);
      const up = new THREE.Vector3(0, 1, 0);
      const axis = new THREE.Vector3().crossVectors(
        up,
        dir.clone().normalize()
      );
      const angle = Math.acos(
        Math.min(1, Math.max(-1, up.dot(dir.clone().normalize())))
      );
      if (axis.length() > 0.001)
        m.setRotationFromAxisAngle(axis.normalize(), angle);
      scene.add(m);

      if (depth > 0) {
        const count = depth > 2 ? 3 : 2;
        for (let k = 0; k < count; k++) {
          const spread = 0.9 - depth * 0.08;
          const theta =
            (k / count) * Math.PI * 2 + Math.random() * 0.6;
          const nextLen = len * (0.6 + Math.random() * 0.15);
          const nb = new THREE.Vector3(
            b.x + Math.sin(theta) * nextLen * spread,
            b.y + nextLen * (0.55 + Math.random() * 0.2),
            b.z + Math.cos(theta) * nextLen * 0.35
          );
          makeBranch(b, nb, thick * 0.62, depth - 1);
        }
      }
    }

    (
      [
        [[-0.9, 4, 0.1], [-2.2, 5.5, -0.6], 0.14, 5],
        [[0.9, 4, 0.1], [2.2, 5.5, -0.6], 0.14, 5],
        [[-0.4, 4, 0.3], [-0.8, 5.8, 1], 0.1, 4],
        [[0.4, 4, 0.3], [0.9, 5.6, 0.9], 0.1, 4],
        [[0, 4, 0], [0, 6.2, 0.1], 0.09, 3],
      ] as [number[], number[], number, number][]
    ).forEach(([a, b, t, d]) =>
      makeBranch(new THREE.Vector3(...a), new THREE.Vector3(...b), t, d)
    );

    // ════════════════
    //  FLOWERS
    // ════════════════
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0ff,
      emissive: 0x303050,
      emissiveIntensity: 0.4,
      roughness: 0.7,
    });
    const ctrMat = new THREE.MeshStandardMaterial({
      color: 0xfff060,
      emissive: 0xcc9900,
      emissiveIntensity: 0.6,
    });
    const allFlowers: THREE.Group[] = [];

    function makeFlower(px: number, py: number, pz: number) {
      const g = new THREE.Group();
      g.position.set(px, py, pz);
      g.rotation.set(
        (Math.random() - 0.5) * 0.6,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.4
      );
      for (let p = 0; p < 6; p++) {
        const a = (p / 6) * Math.PI * 2;
        const pGeo = new THREE.SphereGeometry(0.13, 5, 4);
        pGeo.scale(0.5, 1.3, 0.28);
        const pm = new THREE.Mesh(pGeo, petalMat);
        pm.position.set(Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13);
        pm.rotation.y = -a;
        g.add(pm);
      }
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), ctrMat));
      scene.add(g);
      allFlowers.push(g);
    }

    (
      [
        [-3, 6.2, -0.4], [3, 5.8, -0.3], [-2.6, 7, -0.1],
        [2.2, 7.2, 0.1], [-1.4, 6.6, 0.5], [1.6, 6.9, 0.4],
        [4.1, 5.2, 0.5], [-4.2, 5.6, 0.3], [-0.5, 7.4, 0.1],
        [0.3, 6.1, -0.5],
      ] as [number, number, number][]
    ).forEach(([x, y, z]) => makeFlower(x, y, z));

    // ════════════════
    //  FISH
    // ════════════════
    const fishColors = [
      0xff4400, 0xff7700, 0xffaa00, 0x00aaff, 0x2266ff, 0xff44aa, 0xffff33,
    ];

    interface FishData {
      mesh: THREE.Group;
      rx: number;
      rz: number;
      angle: number;
      speed: number;
      baseY: number;
      bobOff: number;
    }
    const fishInstances: FishData[] = [];

    for (let i = 0; i < 22; i++) {
      const col = fishColors[i % fishColors.length];
      const fm = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.25,
        roughness: 0.3,
        metalness: 0.2,
      });
      const g = new THREE.Group();
      const bodyGeo = new THREE.SphereGeometry(0.28, 8, 6);
      bodyGeo.applyMatrix4(new THREE.Matrix4().makeScale(2.2, 1, 1));
      g.add(new THREE.Mesh(bodyGeo, fm));
      const tailGeo = new THREE.ConeGeometry(0.22, 0.38, 4);
      const tail = new THREE.Mesh(tailGeo, fm);
      tail.position.x = -0.55;
      tail.rotation.z = Math.PI / 2;
      g.add(tail);

      const rx = 4 + Math.random() * 6;
      const rz = 4 + Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      const baseY = -4 + Math.random() * 9;
      const spd =
        (0.25 + Math.random() * 0.4) * (Math.random() < 0.5 ? 1 : -1);
      g.scale.setScalar(0.28 + Math.random() * 0.45);
      g.position.set(rx * Math.cos(angle), baseY, rz * Math.sin(angle));
      scene.add(g);
      fishInstances.push({
        mesh: g,
        rx,
        rz,
        angle,
        speed: spd,
        baseY,
        bobOff: Math.random() * Math.PI * 2,
      });
    }

    // ════════════════
    //  PARTICLES
    // ════════════════
    const PC = 700;
    const pPos = new Float32Array(PC * 3);
    const pVel = new Float32Array(PC);
    for (let i = 0; i < PC; i++) {
      const r = 1.5 + Math.random() * 14;
      const th = Math.random() * Math.PI * 2;
      pPos[i * 3] = Math.cos(th) * r;
      pPos[i * 3 + 1] = -7 + Math.random() * 18;
      pPos[i * 3 + 2] = Math.sin(th) * r;
      pVel[i] = 0.002 + Math.random() * 0.005;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x40c8d0,
      size: 0.06,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Inner glow particles
    const IPC = 250;
    const ipPos = new Float32Array(IPC * 3);
    for (let i = 0; i < IPC; i++) {
      const r = Math.random() * 1.8;
      const th = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      ipPos[i * 3] = r * Math.sin(phi) * Math.cos(th);
      ipPos[i * 3 + 1] = 1.5 + r * Math.sin(phi) * Math.sin(th) * 0.6;
      ipPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const ipGeo = new THREE.BufferGeometry();
    ipGeo.setAttribute("position", new THREE.BufferAttribute(ipPos, 3));
    const ipMat = new THREE.PointsMaterial({
      color: 0xc0ffff,
      size: 0.035,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(ipGeo, ipMat));

    // ════════════════
    //  WATER SURFACE
    // ════════════════
    const wGeo = new THREE.PlaneGeometry(80, 80, 32, 32);
    const wMat = new THREE.MeshStandardMaterial({
      color: 0x00222e,
      roughness: 0.15,
      metalness: 0.9,
      transparent: true,
      opacity: 0.55,
    });
    const water = new THREE.Mesh(wGeo, wMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -5.2;
    scene.add(water);
    const wY0 = new Float32Array(wGeo.attributes.position.count);
    for (let i = 0; i < wY0.length; i++)
      wY0[i] = wGeo.attributes.position.getY(i);

    // ════════════════
    //  WATER LILIES
    // ════════════════
    const lilyPadMat = new THREE.MeshStandardMaterial({
      color: 0x112a14,
      roughness: 0.9,
    });
    const lilyPetalMat = new THREE.MeshStandardMaterial({
      color: 0xe8eaff,
      emissive: 0x303250,
      emissiveIntensity: 0.35,
      roughness: 0.75,
    });

    (
      [
        [-5.5, -5.1, -3.2],
        [5.2, -5.1, -4.5],
        [-3, -5.1, 4.8],
        [6.5, -5.1, 2.5],
        [-6, -5.1, -0.5],
      ] as [number, number, number][]
    ).forEach(([x, y, z]) => {
      const pad = new THREE.Mesh(
        new THREE.CircleGeometry(0.85, 18),
        lilyPadMat
      );
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(x, y, z);
      scene.add(pad);
      for (let p = 0; p < 8; p++) {
        const a = (p / 8) * Math.PI * 2;
        const pGeo2 = new THREE.SphereGeometry(0.18, 5, 4);
        pGeo2.applyMatrix4(new THREE.Matrix4().makeScale(0.4, 1.3, 0.28));
        const pm = new THREE.Mesh(pGeo2, lilyPetalMat);
        pm.position.set(
          x + Math.cos(a) * 0.18,
          y + 0.4,
          z + Math.sin(a) * 0.18
        );
        pm.rotation.set(0.35, a, 0);
        scene.add(pm);
      }
    });

    // Stone key on the floor
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0x3a3530,
      roughness: 0.9,
      metalness: 0.15,
    });
    const keyMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6),
      keyMat
    );
    keyMesh.rotation.z = Math.PI / 2;
    keyMesh.position.set(2.5, -5.15, 1);
    scene.add(keyMesh);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.04, 6, 16),
      keyMat
    );
    ring.position.set(3.05, -5.15, 1);
    ring.rotation.y = Math.PI / 2;
    scene.add(ring);

    // ════════════════
    //  CAMERA SPLINE
    // ════════════════
    const posSpline = new THREE.CatmullRomCurve3(
      KF.map((k) => new THREE.Vector3(...k.p))
    );
    const lookSpline = new THREE.CatmullRomCurve3(
      KF.map((k) => new THREE.Vector3(...k.l))
    );
    posSpline.tension = lookSpline.tension = 0.45;
    const tArr = KF.map((k) => k.t);

    function scrollToSpline(st: number): number {
      for (let i = 0; i < tArr.length - 1; i++) {
        if (st >= tArr[i] && st <= tArr[i + 1]) {
          const local = (st - tArr[i]) / (tArr[i + 1] - tArr[i]);
          return (i + local) / (tArr.length - 1);
        }
      }
      return st >= 1 ? 1 : 0;
    }

    // ════════════════
    //  SCROLL STATE
    // ════════════════
    let targetT = 0;
    let smoothT = 0;
    const lookTarget = new THREE.Vector3(0, 0.8, 0);

    function applyScroll(st: number) {
      SECTIONS.forEach(([id, s, e, di]) => {
        const el = document.getElementById(id);
        const dot = document.querySelector(`[data-s="${di}"]`);
        if (st >= s && st <= e) {
          el?.classList.add("on");
          dot?.classList.add("on");
        } else {
          el?.classList.remove("on");
          dot?.classList.remove("on");
        }
      });

      const nav = document.getElementById("nav");
      const dotsEl = document.getElementById("dots");
      if (st > 0.04) {
        nav?.classList.add("show");
        dotsEl?.classList.add("show");
      } else {
        nav?.classList.remove("show");
        dotsEl?.classList.remove("show");
      }

      if (st > 0.03)
        document.getElementById("scroll-hint")?.classList.add("hide");

      // Interior intensity
      const iIn = Math.max(0, Math.min(1, (st - 0.56) / 0.1));
      const iOut = Math.max(0, Math.min(1, (0.78 - st) / 0.08));
      const interiorAmt = iIn * iOut;
      interiorPt.intensity = interiorAmt * 18;
      ipMat.opacity = interiorAmt * 0.85;
      renderer.toneMappingExposure = 1.1 + interiorAmt * 1.0;
      (scene.fog as THREE.FogExp2).density = 0.055 - interiorAmt * 0.028;
      innerMat.emissiveIntensity = 0.8 + interiorAmt * 2.0;
    }

    const handleScroll = () => {
      const maxScroll =
        document.body.scrollHeight - window.innerHeight;
      targetT = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    };
    window.addEventListener("scroll", handleScroll);

    // Dot click navigation
    document.querySelectorAll<HTMLElement>(".dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        const si = parseInt(dot.dataset.s || "0");
        const sec = SECTIONS[si];
        if (sec) {
          const mid = (sec[1] + sec[2]) / 2;
          const maxScroll =
            document.body.scrollHeight - window.innerHeight;
          window.scrollTo({ top: mid * maxScroll, behavior: "smooth" });
        }
      });
    });

    // ════════════════
    //  LOADING
    // ════════════════
    let loadPct = 0;
    const loadFill = document.getElementById("load-fill");
    const loadEl = document.getElementById("loading");

    // ════════════════
    //  ANIMATION LOOP
    // ════════════════
    let raf: number;

    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Loading
      if (loadPct < 100) {
        loadPct = Math.min(100, loadPct + 1.8);
        if (loadFill) loadFill.style.right = 100 - loadPct + "%";
        if (loadPct >= 100)
          setTimeout(() => loadEl?.classList.add("out"), 600);
      }

      // Smooth scroll
      smoothT += (targetT - smoothT) * 0.055;
      applyScroll(smoothT);

      // Camera
      const sp = scrollToSpline(smoothT);
      const tPos = posSpline.getPoint(sp);
      const tLook = lookSpline.getPoint(sp);
      camera.position.lerp(tPos, 0.07);
      lookTarget.lerp(tLook, 0.06);
      camera.lookAt(lookTarget);

      // Pulsing bulb
      const pulse = Math.sin(t * 1.8) * 0.5 + 0.5;
      bulbPt.intensity = 8 + pulse * 4;
      bulbMat.emissiveIntensity = 3.5 + pulse * 1.5;
      bulbGroup.position.y = 5.2 + Math.sin(t * 0.7) * 0.05;

      // Fish
      fishInstances.forEach((fd) => {
        fd.angle += fd.speed * 0.012;
        fd.mesh.position.set(
          fd.rx * Math.cos(fd.angle),
          fd.baseY + Math.sin(t * 0.7 + fd.bobOff) * 0.28,
          fd.rz * Math.sin(fd.angle)
        );
        fd.mesh.rotation.y =
          -fd.angle + (fd.speed > 0 ? Math.PI : 0);
        if (fd.mesh.children[1])
          fd.mesh.children[1].rotation.z =
            Math.PI / 2 + Math.sin(t * 4 + fd.bobOff) * 0.2;
      });

      // Flowers sway
      allFlowers.forEach((f, i) => {
        f.rotation.y += 0.002 * (i % 2 === 0 ? 1 : -1);
        f.position.y += Math.sin(t * 0.4 + i * 0.8) * 0.0008;
      });

      // Particles rise
      const ppa = pGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PC; i++) {
        ppa[i * 3 + 1] += pVel[i];
        if (ppa[i * 3 + 1] > 11) ppa[i * 3 + 1] = -7;
      }
      pGeo.attributes.position.needsUpdate = true;
      particles.rotation.y += 0.0004;

      // Water ripple
      const wa = wGeo.attributes.position;
      for (let i = 0; i < wY0.length; i++) {
        const wx = wa.getX(i),
          wz = wa.getZ(i);
        wa.setY(
          i,
          wY0[i] +
            Math.sin(t * 0.6 + wx * 0.25) * 0.07 +
            Math.cos(t * 0.4 + wz * 0.18) * 0.05
        );
      }
      wa.needsUpdate = true;
      wGeo.computeVertexNormals();

      // Head breathing
      headMesh.scale.y = 1 + Math.sin(t * 0.5) * 0.003;

      renderer.render(scene, camera);
    }

    animate();

    // ── RESIZE ──
    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", handleResize);

    // ── CLEANUP ──
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="c" />;
}
