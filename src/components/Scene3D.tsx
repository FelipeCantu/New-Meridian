"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// ═══════════════════════════════════════════════
//  Camera keyframes: [scrollT, posXYZ, lookXYZ]
// ═══════════════════════════════════════════════
const KF = [
  { t: 0.00, p: [0,  0.3, 13],   l: [0, 0.8,  0] },   // Hero — face on
  { t: 0.12, p: [0,  1.5, 10],   l: [0, 1.2,  0] },   // Rising
  { t: 0.20, p: [2,  3.0,  8],   l: [0, 2.0,  0] },   // Arc right
  { t: 0.30, p: [0,  4.5,  6],   l: [0, 3.2,  0] },   // Looking at bulb
  { t: 0.38, p: [-2, 4.0,  5],   l: [0, 3.0,  0] },   // Arc left
  { t: 0.45, p: [0,  5.5,  4],   l: [0, 4.5,  0] },   // Above the light
  { t: 0.52, p: [0,  4.0,  2],   l: [0, 3.0, -1] },   // Descending into crown
  { t: 0.58, p: [0,  2.8,  0.4], l: [0, 2.0, -2] },   // At the opening
  { t: 0.64, p: [0,  1.9, -0.3], l: [0, 1.5, -5] },   // INSIDE the head
  { t: 0.70, p: [0,  1.4, -2],   l: [0, 0.8, -8] },   // Emerging back
  { t: 0.78, p: [-4, 0.0, -6],   l: [0, 0.5,  0] },   // Wide shot from behind-left
  { t: 0.86, p: [0, -1.5, 10],   l: [0, 0.5,  0] },   // Album section
  { t: 0.93, p: [0, -2.5, 11],   l: [0,-0.5,  0] },   // Tour / contact
  { t: 1.00, p: [0, -3.2, 13],   l: [0,-1.0,  0] },   // Final
];

// Section visibility: [id, tStart, tEnd, dotIndex]
const SECTIONS: [string, number, number, number][] = [
  ["s-hero",      0.00, 0.10, 0],
  ["s-about",     0.14, 0.34, 1],
  ["s-threshold", 0.56, 0.72, 2],
  ["s-album",     0.75, 0.88, 3],
  ["s-tour",      0.88, 0.97, 4],
  ["s-contact",   0.95, 1.00, 5],
];

export default function Scene3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    // ── RENDERER ──────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x010c12);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── SCENE & CAMERA ────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x010c12, 0.048);

    const camera = new THREE.PerspectiveCamera(58, W / H, 0.05, 300);
    camera.position.set(0, 0.2, 13);

    const clock = new THREE.Clock();

    // ── BLOOM POST-PROCESSING ─────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 1.6, 0.8, 0.25);
    composer.addPass(bloom);

    // ════════════════════════════════
    //  LIGHTING
    // ════════════════════════════════
    scene.add(new THREE.AmbientLight(0x071820, 3.5));

    // Main bulb point light — warm teal
    const bulbPt = new THREE.PointLight(0x50e8ff, 14, 45);
    bulbPt.position.set(0, 4.5, 0);
    bulbPt.castShadow = true;
    bulbPt.shadow.mapSize.set(1024, 1024);
    scene.add(bulbPt);

    // Underwater caustic fills — drift slowly in animate()
    const caustic1 = new THREE.PointLight(0x003366, 6, 30);
    caustic1.position.set(4, -2, 6);
    scene.add(caustic1);
    const caustic2 = new THREE.PointLight(0x004455, 5, 28);
    caustic2.position.set(-5, 2, 4);
    scene.add(caustic2);
    const caustic3 = new THREE.PointLight(0x002244, 4, 22);
    caustic3.position.set(0, -4, 2);
    scene.add(caustic3);

    // Rim lights — warmer to make ceramic glow correctly
    const rimL = new THREE.DirectionalLight(0xd0e8ff, 1.4);  // cool blue-white key
    rimL.position.set(-6, 5, 3);
    rimL.castShadow = true;
    scene.add(rimL);
    const rimR = new THREE.DirectionalLight(0xffe8c0, 0.6);  // warm fill
    rimR.position.set(8, 2, 5);
    scene.add(rimR);
    const rimBack = new THREE.DirectionalLight(0x60c0d0, 0.5); // teal back rim
    rimBack.position.set(0, 3, -8);
    scene.add(rimBack);

    // Interior glow — activated when camera enters head
    const interiorPt = new THREE.PointLight(0x80ffff, 0, 16);
    interiorPt.position.set(0, 0.5, 0);
    scene.add(interiorPt);

    // ════════════════════════════════
    //  HEAD OF GAUL — real 3D scan from Sketchfab
    //  Loaded as GLB, ceramic material applied in-scene
    // ════════════════════════════════
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Glazed ceramic material applied to the loaded mesh
    const ceramicMat = new THREE.MeshPhysicalMaterial({
      color: 0xeeeae0,
      roughness: 0.10,
      metalness: 0.0,
      clearcoat: 0.92,
      clearcoatRoughness: 0.06,
    });

    gltfLoader.load("/head.glb", (gltf) => {
      const headModel = gltf.scene;
      // GLB Y range: -2.38 → 5.74 (8.1 units tall, face already baked toward +Z)
      // Shift down so the face sits at eye level and wild hair reaches the bulb at y=4.5
      headModel.position.set(0, -1.5, 0);
      headModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = ceramicMat;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      scene.add(headModel);
    });

    // Inner glow shell — visible when camera enters the head interior
    const innerShellPts = [
      new THREE.Vector2(0.30, -1.8),
      new THREE.Vector2(0.70, -1.0),
      new THREE.Vector2(1.30,  0.2),
      new THREE.Vector2(1.40,  1.2),
      new THREE.Vector2(1.20,  2.2),
      new THREE.Vector2(0.85,  2.9),
      new THREE.Vector2(0.50,  3.2),
    ];
    const innerGeo = new THREE.LatheGeometry(innerShellPts, 64);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x10c8c8,
      emissive: new THREE.Color(0x10ffee),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(innerGeo, innerMat));

    // Neck water collar
    const collarGeo = new THREE.TorusGeometry(0.52, 0.045, 8, 64);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x204060,
      emissive: new THREE.Color(0x102030),
      emissiveIntensity: 1.2,
    });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.y = -1.7;
    collar.rotation.x = Math.PI / 2;
    scene.add(collar);

    // ════════════════════════════════
    //  LIGHT BULB
    // ════════════════════════════════
    // Suspension cord
    const cordGeo = new THREE.CylinderGeometry(0.016, 0.016, 5.8, 6);
    const cord = new THREE.Mesh(cordGeo, new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.95 }));
    cord.position.set(0, 7.4, 0);
    scene.add(cord);

    // Bulb glass
    const bulbGeo = new THREE.SphereGeometry(0.3, 24, 16);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xc0ffff),
      emissiveIntensity: 6.0,
      roughness: 0.0,
      metalness: 0.1,
    });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(0, 4.5, 0);
    scene.add(bulb);

    // Concentric glow halos around bulb
    const haloColors = [0x20e8ff, 0x10a0c0, 0x085870];
    const haloOpacities = [0.08, 0.05, 0.025];
    for (let gi = 0; gi < 3; gi++) {
      const haloGeo = new THREE.SphereGeometry(0.55 + gi * 0.75, 16, 12);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(haloColors[gi]),
        transparent: true,
        opacity: haloOpacities[gi],
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(0, 4.5, 0);
      scene.add(halo);
    }

    // ════════════════════════════════
    //  BRANCHES  (recursive tree)
    // ════════════════════════════════
    const branchMat = new THREE.MeshStandardMaterial({ color: 0x1a0f06, roughness: 0.96 });

    function makeBranch(
      start: THREE.Vector3,
      dir: THREE.Vector3,
      length: number,
      radius: number,
      depth: number
    ) {
      if (depth <= 0 || length < 0.07) return;
      const end = start.clone().addScaledVector(dir, length);
      const mid = start.clone().add(end).multiplyScalar(0.5);

      const geo = new THREE.CylinderGeometry(radius * 0.6, radius, length, 5, 1);
      const branch = new THREE.Mesh(geo, branchMat);
      branch.castShadow = true;
      branch.position.copy(mid);
      branch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      scene.add(branch);

      const numChild = depth === 1 ? 2 : 3;
      for (let i = 0; i < numChild; i++) {
        const twist = (i / numChild) * Math.PI * 2 + Math.random() * 0.9;
        const spread = 0.45 + Math.random() * 0.55;
        const newDir = new THREE.Vector3(
          dir.x + Math.cos(twist) * spread,
          dir.y + 0.2 + Math.random() * 0.35,
          dir.z + Math.sin(twist) * spread
        ).normalize();
        makeBranch(end, newDir, length * (0.58 + Math.random() * 0.15), radius * 0.6, depth - 1);
      }
    }

    // 5 main branch arms radiating from above the bulb
    const branchOrigin = new THREE.Vector3(0, 4.5, 0);
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const outDir = new THREE.Vector3(Math.cos(ang) * 0.55, 1.0, Math.sin(ang) * 0.55).normalize();
      makeBranch(branchOrigin, outDir, 1.9, 0.065, 4);
    }

    // Cherry blossom petals scattered around branches
    const petalMat = new THREE.MeshBasicMaterial({
      color: 0xffb0d0,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const petalData: { mesh: THREE.Mesh; drift: number; bobOff: number }[] = [];
    for (let i = 0; i < 90; i++) {
      const geo = new THREE.PlaneGeometry(0.07, 0.07);
      const petal = new THREE.Mesh(geo, petalMat);
      const r = 1.8 + Math.random() * 5.5;
      const a = Math.random() * Math.PI * 2;
      petal.position.set(Math.cos(a) * r, 4 + Math.random() * 6.5, Math.sin(a) * r);
      petal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(petal);
      petalData.push({ mesh: petal, drift: (Math.random() - 0.5) * 0.004, bobOff: Math.random() * Math.PI * 2 });
    }

    // ════════════════════════════════
    //  NAUTILUS SHELLS
    // ════════════════════════════════
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0x70d8e0,
      emissive: new THREE.Color(0x103040),
      emissiveIntensity: 0.4,
      roughness: 0.18,
      metalness: 0.08,
      transparent: true,
      opacity: 0.78,
    });

    function makeShell(px: number, py: number, pz: number, scale: number) {
      const g = new THREE.Group();
      for (let ri = 0; ri < 7; ri++) {
        const r = (0.18 + ri * 0.12) * scale;
        const tube = (0.042 + ri * 0.018) * scale;
        const geo = new THREE.TorusGeometry(r, tube, 8, 40, Math.PI * 1.72);
        const mesh = new THREE.Mesh(geo, shellMat);
        mesh.rotation.z = ri * 0.44;
        g.add(mesh);
      }
      g.position.set(px, py, pz);
      g.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      g.rotation.y = Math.random() * Math.PI * 2;
      scene.add(g);
    }

    makeShell(-5.6, -0.4, 2.0, 1.25);
    makeShell( 5.1,  0.6, 2.8, 1.05);
    makeShell(-3.4, -2.6, -2.2, 0.95);
    makeShell( 4.2, -1.1, -3.0, 1.15);

    // ════════════════════════════════
    //  BUTTERFLIES
    // ════════════════════════════════
    interface ButterflyData {
      group: THREE.Group;
      basePos: THREE.Vector3;
      floatOff: number;
      wingPhase: number;
      lw: THREE.Mesh;
      rw: THREE.Mesh;
    }
    const butterflies: ButterflyData[] = [];

    function makeButterfly(px: number, py: number, pz: number) {
      const g = new THREE.Group();
      const wMat = new THREE.MeshStandardMaterial({
        color: 0x0d0d0d,
        emissive: new THREE.Color(0x051015),
        emissiveIntensity: 0.3,
        roughness: 0.5,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.94,
      });
      const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      const wGeo = new THREE.PlaneGeometry(0.58, 0.40);
      const lw = new THREE.Mesh(wGeo, wMat.clone());
      lw.position.x = -0.29;
      lw.rotation.y = 0.3;
      g.add(lw);
      const rw = new THREE.Mesh(wGeo, wMat.clone());
      rw.position.x = 0.29;
      rw.rotation.y = -0.3;
      g.add(rw);

      // White wing spots
      for (let si = 0; si < 3; si++) {
        const sg = new THREE.SphereGeometry(0.032, 4, 4);
        const sl = new THREE.Mesh(sg, spotMat);
        sl.position.set(-0.14 - si * 0.08, (si - 1) * 0.1, 0.01);
        lw.add(sl);
        const sr = new THREE.Mesh(sg.clone(), spotMat);
        sr.position.set(0.14 + si * 0.08, (si - 1) * 0.1, 0.01);
        rw.add(sr);
      }

      // Body
      const bGeo = new THREE.CylinderGeometry(0.024, 0.016, 0.44, 6);
      const bMesh = new THREE.Mesh(bGeo, new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.82 }));
      bMesh.rotation.z = Math.PI / 2;
      g.add(bMesh);

      g.position.set(px, py, pz);
      g.rotation.y = Math.random() * Math.PI * 2;
      scene.add(g);
      butterflies.push({ group: g, basePos: new THREE.Vector3(px, py, pz), floatOff: Math.random() * Math.PI * 2, wingPhase: Math.random() * Math.PI * 2, lw, rw });
    }

    [[-3, 5.5, 2], [3, 6.2, -1], [-1, 7, 3.2], [2, 5.1, 4.5],
     [-4, 4.6, -1.2], [1, 8.1, 1.3], [-2, 6.5, -3], [4, 7.2, 2.2]]
      .forEach(([x, y, z]) => makeButterfly(x, y, z));

    // ════════════════════════════════
    //  FISH
    // ════════════════════════════════
    interface FishData { mesh: THREE.Group; rx: number; rz: number; angle: number; speed: number; baseY: number; bobOff: number; }
    const fishInstances: FishData[] = [];

    const fishPalette = [
      { body: 0xff6600, fin: 0xffaa44 },  // goldfish
      { body: 0x3388ff, fin: 0x88ccff },  // tropical blue
      { body: 0xdddddd, fin: 0xaaaaaa },  // skeleton/pale
      { body: 0xff4499, fin: 0xff88cc },  // pink
      { body: 0x22cc66, fin: 0x88ffaa },  // green tropical
      { body: 0xffdd00, fin: 0xffee88 },  // yellow
    ];

    for (let i = 0; i < 24; i++) {
      const pal = fishPalette[i % fishPalette.length];
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: pal.body,
        emissive: new THREE.Color(pal.body).multiplyScalar(0.12),
        roughness: 0.28,
        metalness: 0.08,
        clearcoat: 0.5,
        clearcoatRoughness: 0.15,
      });
      const finMat = new THREE.MeshPhysicalMaterial({
        color: pal.fin,
        transparent: true,
        opacity: 0.72,
        roughness: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const g = new THREE.Group();

      // Body
      const bGeo = new THREE.SphereGeometry(0.28, 12, 8);
      bGeo.applyMatrix4(new THREE.Matrix4().makeScale(2.1, 1, 0.82));
      g.add(new THREE.Mesh(bGeo, bodyMat));

      // Tail
      const tGeo = new THREE.ConeGeometry(0.24, 0.42, 4);
      const tail = new THREE.Mesh(tGeo, finMat);
      tail.position.x = -0.64;
      tail.rotation.z = Math.PI / 2;
      g.add(tail);

      // Dorsal fin
      const dGeo = new THREE.ConeGeometry(0.11, 0.28, 4);
      const dorsal = new THREE.Mesh(dGeo, finMat);
      dorsal.position.set(0.08, 0.23, 0);
      g.add(dorsal);

      // Eye
      const eyeGeo = new THREE.SphereGeometry(0.046, 6, 6);
      const eye = new THREE.Mesh(eyeGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
      eye.position.set(0.4, 0.08, 0.22);
      g.add(eye);

      const rx = 4.5 + Math.random() * 7;
      const rz = 4.0 + Math.random() * 7;
      const angle = Math.random() * Math.PI * 2;
      const baseY = -4 + Math.random() * 9;
      const spd = (0.22 + Math.random() * 0.38) * (Math.random() < 0.5 ? 1 : -1);
      g.scale.setScalar(0.22 + Math.random() * 0.42);
      g.position.set(rx * Math.cos(angle), baseY, rz * Math.sin(angle));
      scene.add(g);
      fishInstances.push({ mesh: g, rx, rz, angle, speed: spd, baseY, bobOff: Math.random() * Math.PI * 2 });
    }

    // ════════════════════════════════
    //  WATER LILIES
    // ════════════════════════════════
    const padMat = new THREE.MeshStandardMaterial({ color: 0x1a4020, roughness: 0.85, side: THREE.DoubleSide });
    const bloomMat = new THREE.MeshStandardMaterial({ color: 0xffd0e0, emissive: new THREE.Color(0x441020), emissiveIntensity: 0.4 });

    [[-3, -3.2, 3.5], [3.5, -3.2, 4.2], [0, -3.2, 6.5], [-5, -3.2, 1.5], [5.2, -3.2, 2.2]]
      .forEach(([lx, ly, lz]) => {
        const padGeo = new THREE.CircleGeometry(0.62, 14, 0, Math.PI * 1.85);
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(lx, ly, lz);
        pad.rotation.x = -Math.PI / 2;
        scene.add(pad);
        for (let pi = 0; pi < 7; pi++) {
          const pa = (pi / 7) * Math.PI * 2;
          const pGeo = new THREE.PlaneGeometry(0.18, 0.34);
          const petal = new THREE.Mesh(pGeo, bloomMat);
          petal.position.set(lx + Math.cos(pa) * 0.13, ly + 0.06, lz + Math.sin(pa) * 0.13);
          petal.rotation.set(-Math.PI / 2 + 0.5, pa, 0);
          scene.add(petal);
        }
      });

    // ════════════════════════════════
    //  WATER SURFACE
    // ════════════════════════════════
    const waterSegments = 32;
    const waterGeo = new THREE.PlaneGeometry(50, 50, waterSegments, waterSegments);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x062030,
      roughness: 0.04,
      metalness: 0.0,
      transparent: true,
      opacity: 0.5,
      envMapIntensity: 1.2,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -3.2;
    scene.add(water);

    // ════════════════════════════════
    //  STONE ARCH + CAVE BACKDROP
    // ════════════════════════════════
    const stoneMat = new THREE.MeshPhysicalMaterial({ color: 0x23262c, roughness: 0.96, metalness: 0.0 });

    // Side pillars
    const pillarGeo = new THREE.CylinderGeometry(0.55, 0.68, 20, 10);
    [-9, 9].forEach((px) => {
      const p = new THREE.Mesh(pillarGeo, stoneMat);
      p.position.set(px, 1, -4.5);
      scene.add(p);
    });

    // Ceiling slab
    const slabGeo = new THREE.BoxGeometry(22, 1.4, 3.5);
    const slab = new THREE.Mesh(slabGeo, stoneMat);
    slab.position.set(0, 11, -4.5);
    scene.add(slab);

    // Hanging ceiling roots
    const rootMat = new THREE.MeshStandardMaterial({ color: 0x0e0b06, roughness: 0.92 });
    for (let ri = 0; ri < 16; ri++) {
      const len = 0.5 + Math.random() * 4.0;
      const rGeo = new THREE.CylinderGeometry(0.012, 0.005, len, 4);
      const rMesh = new THREE.Mesh(rGeo, rootMat);
      rMesh.position.set(-9 + ri * 1.2 + (Math.random() - 0.5) * 0.6, 11.0 - len / 2, -4.2 + (Math.random() - 0.5) * 1.5);
      scene.add(rMesh);
    }

    // Dark back wall
    const wallGeo = new THREE.PlaneGeometry(35, 24);
    const wall = new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({ color: 0x020508, roughness: 1.0 }));
    wall.position.set(0, 2, -9);
    scene.add(wall);

    // ════════════════════════════════
    //  PARTICLES
    // ════════════════════════════════
    const PC = 800;
    const pPos = new Float32Array(PC * 3);
    const pVel = new Float32Array(PC);
    for (let i = 0; i < PC; i++) {
      const r = 1.5 + Math.random() * 14;
      const th = Math.random() * Math.PI * 2;
      pPos[i * 3]     = Math.cos(th) * r;
      pPos[i * 3 + 1] = -7 + Math.random() * 22;
      pPos[i * 3 + 2] = Math.sin(th) * r;
      pVel[i] = 0.003 + Math.random() * 0.006;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x60d8e8,
      size: 0.065,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Interior sparkles — appear when camera enters head
    const IPC = 300;
    const ipPos = new Float32Array(IPC * 3);
    for (let i = 0; i < IPC; i++) {
      const r = Math.random() * 1.65;
      const th = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      ipPos[i * 3]     = r * Math.sin(phi) * Math.cos(th);
      ipPos[i * 3 + 1] = 0.5 + r * Math.sin(phi) * Math.sin(th) * 0.5;
      ipPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const ipGeo = new THREE.BufferGeometry();
    ipGeo.setAttribute("position", new THREE.BufferAttribute(ipPos, 3));
    const ipMat = new THREE.PointsMaterial({
      color: 0xc0ffff,
      size: 0.04,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(ipGeo, ipMat));

    // ════════════════════════════════
    //  CAMERA SPLINE
    // ════════════════════════════════
    const posSpline = new THREE.CatmullRomCurve3(
      KF.map((k) => new THREE.Vector3(k.p[0], k.p[1], k.p[2]))
    );
    const lookSpline = new THREE.CatmullRomCurve3(
      KF.map((k) => new THREE.Vector3(k.l[0], k.l[1], k.l[2]))
    );
    posSpline.tension = lookSpline.tension = 0.45;
    const tArr = KF.map((k) => k.t);

    function scrollToSpline(st: number): number {
      for (let i = 0; i < tArr.length - 1; i++) {
        if (st >= tArr[i] && st <= tArr[i + 1]) {
          return (i + (st - tArr[i]) / (tArr[i + 1] - tArr[i])) / (tArr.length - 1);
        }
      }
      return st >= 1 ? 1 : 0;
    }

    // ════════════════════════════════
    //  SCROLL STATE
    // ════════════════════════════════
    let targetT = 0;
    let smoothT = 0;
    const lookTarget = new THREE.Vector3(0, 0.8, 0);

    function applyScroll(st: number) {
      SECTIONS.forEach(([id, s, e, di]) => {
        document.getElementById(id)?.classList.toggle("on", st >= s && st <= e);
        document.querySelector(`[data-s="${di}"]`)?.classList.toggle("on", st >= s && st <= e);
      });
      document.getElementById("nav")?.classList.toggle("show", st > 0.04);
      document.getElementById("dots")?.classList.toggle("show", st > 0.04);
      if (st > 0.03) document.getElementById("scroll-hint")?.classList.add("hide");

      // Interior effect
      const iIn  = Math.max(0, Math.min(1, (st - 0.56) / 0.10));
      const iOut  = Math.max(0, Math.min(1, (0.78 - st) / 0.08));
      const iAmt  = iIn * iOut;
      interiorPt.intensity = iAmt * 22;
      ipMat.opacity = iAmt * 0.92;
      innerMat.emissiveIntensity = 0.5 + iAmt * 5.5;
      renderer.toneMappingExposure = 1.2 + iAmt * 0.9;
      (scene.fog as THREE.FogExp2).density = 0.048 - iAmt * 0.026;
      bloom.strength = 1.6 + iAmt * 1.8;
    }

    const handleScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      targetT = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    };
    window.addEventListener("scroll", handleScroll);

    document.querySelectorAll<HTMLElement>(".dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        const si = parseInt(dot.dataset.s || "0");
        const sec = SECTIONS[si];
        if (sec) {
          const mid = (sec[1] + sec[2]) / 2;
          window.scrollTo({ top: mid * (document.body.scrollHeight - window.innerHeight), behavior: "smooth" });
        }
      });
    });

    // Dismiss loading screen — head.glb streams in after scene is ready
    const loadEl = document.getElementById("loading");
    if (loadEl) setTimeout(() => loadEl.classList.add("out"), 1000);

    // ════════════════════════════════
    //  ANIMATION LOOP
    // ════════════════════════════════
    let raf: number;

    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      smoothT += (targetT - smoothT) * 0.055;
      applyScroll(smoothT);

      // Camera along spline
      const sp = scrollToSpline(smoothT);
      camera.position.lerp(posSpline.getPoint(sp), 0.07);
      lookTarget.lerp(lookSpline.getPoint(sp), 0.06);
      camera.lookAt(lookTarget);

      // Bulb pulse
      const pulse = Math.sin(t * 1.9) * 0.5 + 0.5;
      bulbPt.intensity = 12 + pulse * 6;
      bulbMat.emissiveIntensity = 5.5 + pulse * 2.5;

      // Caustic light drift — simulates underwater shimmering
      caustic1.position.x = 4  + Math.sin(t * 0.65) * 2.5;
      caustic1.position.z = 6  + Math.cos(t * 0.48) * 2.0;
      caustic2.position.x = -5 + Math.cos(t * 0.58) * 2.2;
      caustic2.position.z = 4  + Math.sin(t * 0.72) * 1.8;
      caustic3.position.x =      Math.sin(t * 0.41) * 3.0;

      // Water wave ripple
      const wVerts = waterGeo.attributes.position.array as Float32Array;
      for (let wi = 0; wi < wVerts.length; wi += 3) {
        const wx = wVerts[wi];
        const wz = wVerts[wi + 2];
        wVerts[wi + 1] = Math.sin(wx * 0.38 + t * 0.85) * 0.07 + Math.cos(wz * 0.31 + t * 0.66) * 0.045;
      }
      waterGeo.attributes.position.needsUpdate = true;
      waterGeo.computeVertexNormals();

      // Fish orbits
      fishInstances.forEach((fd) => {
        fd.angle += fd.speed * 0.012;
        fd.mesh.position.set(
          fd.rx * Math.cos(fd.angle),
          fd.baseY + Math.sin(t * 0.7 + fd.bobOff) * 0.3,
          fd.rz * Math.sin(fd.angle)
        );
        fd.mesh.rotation.y = -fd.angle + (fd.speed > 0 ? Math.PI : 0);
      });

      // Butterfly wing flap + float
      butterflies.forEach((bf) => {
        const flap = Math.sin(t * 4.2 + bf.wingPhase) * 0.55;
        bf.lw.rotation.y = 0.35 + flap;
        bf.rw.rotation.y = -0.35 - flap;
        bf.group.position.y = bf.basePos.y + Math.sin(t * 0.75 + bf.floatOff) * 0.2;
        bf.group.rotation.y += 0.004;
      });

      // Cherry petals drift
      petalData.forEach((pd) => {
        pd.mesh.rotation.y += pd.drift;
        pd.mesh.position.y -= 0.002;
        if (pd.mesh.position.y < 3.8) pd.mesh.position.y = 10.5;
      });

      // Rising particles
      const ppa = pGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PC; i++) {
        ppa[i * 3 + 1] += pVel[i];
        if (ppa[i * 3 + 1] > 15) ppa[i * 3 + 1] = -7;
      }
      pGeo.attributes.position.needsUpdate = true;
      particles.rotation.y += 0.0003;

      composer.render();
    }

    animate();

    // ── RESIZE ──
    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
      composer.setSize(W, H);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="c" />;
}
