"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const KF = [
  { t: 0.00, p: [ 0,   0.6,  8.5], l: [0,  0.5,  0] },
  { t: 0.10, p: [ 0,   1.6,  7.5], l: [0,  1.2,  0] },
  { t: 0.18, p: [ 2,   3.2,  6.5], l: [0,  2.4,  0] },
  { t: 0.28, p: [ 0,   5.0,  5.0], l: [0,  3.6,  0] },
  { t: 0.36, p: [-2,   4.4,  5.0], l: [0,  3.2,  0] },
  { t: 0.44, p: [ 0,   7.0,  3.0], l: [0,  4.0,  0] },
  { t: 0.52, p: [ 0,   4.4,  1.5], l: [0,  2.8, -1] },
  { t: 0.58, p: [ 0,   2.8,  0.2], l: [0,  2.0, -2] },
  { t: 0.64, p: [ 0,   1.5, -0.4], l: [0,  1.0, -5] },
  { t: 0.70, p: [ 0,   0.8, -2.8], l: [0,  0.4, -8] },
  { t: 0.78, p: [-5,   0.4, -5.5], l: [0,  0.8,  0] },
  { t: 0.86, p: [ 0,  -1.2,  9.0], l: [0,  0.4,  0] },
  { t: 0.93, p: [ 0,  -2.2, 10.0], l: [0, -0.6,  0] },
  { t: 1.00, p: [ 0,  -3.2, 11.5], l: [0, -1.2,  0] },
];

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

    // ── RENDERER ──────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x00101e);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.90;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── SCENE ─────────────────────────────────────────────
    const scene = new THREE.Scene();
    // Deep ocean fog — dense, blue-black
    scene.fog = new THREE.FogExp2(0x00101e, 0.042);  // slightly less dense, more teal-blue

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.05, 300);
    camera.position.set(0, 0.6, 8.5);
    const clock = new THREE.Clock();

    // ── POST-PROCESSING ───────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 1.1, 0.9, 0.52);
    composer.addPass(bloom);

    // ── Seeded RNG ────────────────────────────────────────
    let _s = 42;
    const rng = () => ((_s = (_s * 9301 + 49297) % 233280) / 233280);

    // ════════════════════════════════
    //  LIGHTING
    // ════════════════════════════════
    // Deep ocean ambient — cool blue-teal wash
    scene.add(new THREE.AmbientLight(0x041826, 4.5));

    // Filtered sunlight from the surface above — blue-green shaft
    const surfaceLight = new THREE.DirectionalLight(0x40a0c0, 1.6);
    surfaceLight.position.set(2, 20, 5);
    surfaceLight.castShadow = true;
    surfaceLight.shadow.mapSize.set(1024, 1024);
    scene.add(surfaceLight);

    // Floor bounce — subtle teal from below (seafloor scatter)
    const floorBounce = new THREE.HemisphereLight(0x001820, 0x002810, 1.2);
    scene.add(floorBounce);

    // Warm Edison bulb — primary light source on the head
    const bulbPt = new THREE.PointLight(0xffe8a0, 18, 50);
    bulbPt.position.set(0, 4.0, 0);
    bulbPt.castShadow = true;
    bulbPt.shadow.mapSize.set(1024, 1024);
    bulbPt.shadow.bias = -0.002;
    scene.add(bulbPt);

    // Warm key — rakes across ceramic glaze from front-top
    const keyLight = new THREE.DirectionalLight(0xffd090, 1.8);
    keyLight.position.set(-2, 8, 9);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Cool back rim — deep teal/blue separates head from darkness
    const rimBack = new THREE.DirectionalLight(0x0a4870, 1.6);
    rimBack.position.set(0, 3, -12);
    scene.add(rimBack);

    // Side fill — subtle blue from the right
    const sideFill = new THREE.DirectionalLight(0x061828, 1.0);
    sideFill.position.set(9, 2, 4);
    scene.add(sideFill);

    // Drifting caustic lights — 6 shimmering underwater light patches
    const causticA = new THREE.PointLight(0x006496, 9, 38);
    causticA.position.set(4, 2, 6);
    scene.add(causticA);
    const causticB = new THREE.PointLight(0x0080b0, 8, 34);
    causticB.position.set(-5, 3, 5);
    scene.add(causticB);
    const causticC = new THREE.PointLight(0x004870, 7, 30);
    causticC.position.set(0, 1, 2);
    scene.add(causticC);
    const causticD = new THREE.PointLight(0x20a0b8, 6, 28);
    causticD.position.set(6, -2, -3);
    scene.add(causticD);
    const causticE = new THREE.PointLight(0x005878, 7, 32);
    causticE.position.set(-4, -1, -4);
    scene.add(causticE);
    const causticF = new THREE.PointLight(0x008898, 5, 24);
    causticF.position.set(2, 4, -6);
    scene.add(causticF);

    // Coral/reef glow — warm bioluminescent accent from floor level
    const reefGlow = new THREE.PointLight(0xff4060, 2.5, 18);
    reefGlow.position.set(-6, -5.5, 4);
    scene.add(reefGlow);
    const reefGlow2 = new THREE.PointLight(0x40d0c0, 2.0, 16);
    reefGlow2.position.set(7, -5.5, -3);
    scene.add(reefGlow2);

    // Interior glow (scroll-triggered)
    const interiorPt = new THREE.PointLight(0x80ffee, 0, 18);
    interiorPt.position.set(0, 0.8, 0);
    scene.add(interiorPt);

    // ════════════════════════════════
    //  HEAD — white glazed ceramic
    // ════════════════════════════════
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const ceramicMat = new THREE.MeshPhysicalMaterial({
      color: 0xf2ede5,
      roughness: 0.08,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      ior: 1.52,
    });

    gltfLoader.load("/head.glb", (gltf) => {
      const headModel = gltf.scene;
      headModel.position.set(0, -1.5, 0);
      headModel.rotation.y = Math.PI / 2;
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

    // Inner shell (interior cavity glow)
    const innerPts = [
      new THREE.Vector2(0.28, -1.8), new THREE.Vector2(0.65, -1.0),
      new THREE.Vector2(1.25,  0.3), new THREE.Vector2(1.38,  1.3),
      new THREE.Vector2(1.18,  2.3), new THREE.Vector2(0.80,  3.0),
      new THREE.Vector2(0.45,  3.3),
    ];
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x10d0d0, emissive: new THREE.Color(0x20ffee), emissiveIntensity: 0.5,
      transparent: true, opacity: 0.0, side: THREE.BackSide, depthWrite: false,
    });
    scene.add(new THREE.Mesh(new THREE.LatheGeometry(innerPts, 64), innerMat));

    // ════════════════════════════════
    //  LIGHT BULB
    // ════════════════════════════════
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 7.5, 5),
      new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 0.95 })
    );
    cord.position.set(0, 7.75, 0);
    scene.add(cord);

    const bulbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 20, 14),
      new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: new THREE.Color(0xfffab0),
        emissiveIntensity: 9.0, roughness: 0.0, metalness: 0.0,
      })
    );
    bulbMesh.position.set(0, 4.0, 0);
    scene.add(bulbMesh);

    const haloColors    = [0xffff90, 0xffe090, 0xc0d8f0, 0x102840];
    const haloOpacities = [0.12, 0.065, 0.030, 0.014];
    for (let i = 0; i < 4; i++) {
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.40 + i * 0.72, 14, 10),
        new THREE.MeshBasicMaterial({
          color: haloColors[i], transparent: true, opacity: haloOpacities[i],
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
        })
      );
      halo.position.set(0, 4.0, 0);
      scene.add(halo);
    }

    // ════════════════════════════════
    //  OCEAN FLOOR
    // ════════════════════════════════
    // Dark sandy/rocky seabed
    const floorGeo = new THREE.PlaneGeometry(80, 80, 20, 20);
    // Gently undulate verts for organic feel
    const fv = floorGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < fv.length; i += 3) {
      fv[i + 2] += (rng() - 0.5) * 0.4; // z displacement in plane space
    }
    floorGeo.computeVertexNormals();
    const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({
      color: 0x18281a,   // dark sandy green — algae-covered seabed
      roughness: 0.96, metalness: 0.0,
      emissive: new THREE.Color(0x040a04), emissiveIntensity: 0.5,
    }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -6.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Rocks — pre-seed random positions, then fill when rock.glb loads
    const rockSpawns: { x: number; z: number; sc: number; ry: number; rx: number }[] = [];
    for (let i = 0; i < 20; i++) {
      const a = rng() * Math.PI * 2, r = 2.5 + rng() * 11;
      rockSpawns.push({ x: Math.cos(a) * r, z: Math.sin(a) * r,
        sc: 0.55 + rng() * 1.5, ry: rng() * Math.PI * 2, rx: (rng() - 0.5) * 0.3 });
    }
    gltfLoader.load('/rock.glb', (gltf) => {
      const tmpl = gltf.scene;
      rockSpawns.forEach(p => {
        const rock = tmpl.clone(true);
        rock.traverse(c => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        rock.scale.setScalar(p.sc);
        rock.rotation.set(p.rx, p.ry, 0);
        rock.position.set(p.x, -6.5, p.z);
        scene.add(rock);
      });
    });

    // ════════════════════════════════
    //  KELP FOREST
    // ════════════════════════════════
    const kelpMat = new THREE.MeshStandardMaterial({
      color: 0x1e4a14,
      emissive: new THREE.Color(0x0a2008),
      emissiveIntensity: 0.4,
      roughness: 0.88,
      side: THREE.DoubleSide,
    });

    const kelpData: { blades: THREE.Mesh[]; phase: number }[] = [];

    function makeKelp(kx: number, kz: number, height: number) {
      const g = new THREE.Group();
      const blades: THREE.Mesh[] = [];
      const segs = Math.ceil(height / 0.7);
      for (let s = 0; s < segs; s++) {
        const w = 0.14 - (s / segs) * 0.06;
        const blade = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.65), kelpMat);
        blade.position.y = s * 0.62 + 0.3;
        blade.rotation.y = s * 0.55 + rng() * 0.5;
        blade.rotation.z = (rng() - 0.5) * 0.15;
        g.add(blade);
        blades.push(blade);
      }
      g.position.set(kx, -6.5, kz);
      scene.add(g);
      kelpData.push({ blades, phase: rng() * Math.PI * 2 });
    }

    // Kelp clusters around the scene
    [[-7, 3], [-6, -2], [-8, -5], [6, 4], [7, -1], [8, -6],
     [-3, 8], [3, 9], [0, 10], [-9, 1], [9, 2], [-5, -8], [5, -7]]
      .forEach(([kx, kz]) => makeKelp(kx + (rng()-0.5)*0.8, kz + (rng()-0.5)*0.8, 2.5 + rng() * 2.0));

    // ════════════════════════════════
    //  CORAL — real GLB from Hyper3D
    // ════════════════════════════════
    // Color tints for coral variety — vivid reef colors
    const coralTints = [0xff3050, 0xff7020, 0xffcc20, 0xe030a0, 0x30d0b0, 0xffffff, 0xff60c0, 0x60e0c0];

    const coralSpawns: { x: number; z: number; sc: number; ry: number; tint: number }[] = [];
    for (let i = 0; i < 18; i++) {
      const a = rng() * Math.PI * 2, r = 3 + rng() * 10;
      coralSpawns.push({ x: Math.cos(a) * r, z: Math.sin(a) * r,
        sc: 0.40 + rng() * 0.90, ry: rng() * Math.PI * 2,
        tint: coralTints[i % coralTints.length] });
    }

    gltfLoader.load('/coral.glb', (gltf) => {
      const tmpl = gltf.scene;
      coralSpawns.forEach(p => {
        const coral = tmpl.clone(true);
        const tintCol = new THREE.Color(p.tint);
        coral.traverse(c => {
          if ((c as THREE.Mesh).isMesh) {
            const m = c as THREE.Mesh;
            m.castShadow = true;
            m.receiveShadow = true;
            // Apply vivid tint — corals should pop with saturated colour
            const orig = Array.isArray(m.material) ? m.material[0] : m.material;
            const mat = (orig as THREE.MeshStandardMaterial).clone() as THREE.MeshStandardMaterial;
            mat.color.lerp(tintCol, 0.75);
            mat.emissive.copy(tintCol).multiplyScalar(0.18);
            mat.emissiveIntensity = 1.2;
            mat.roughness = Math.max(0, mat.roughness - 0.1);
            mat.needsUpdate = true;
            m.material = mat;
          }
        });
        coral.scale.setScalar(p.sc);
        coral.rotation.y = p.ry;
        coral.position.set(p.x, -6.5, p.z);
        scene.add(coral);
      });
    });

    // ════════════════════════════════
    //  SEA TURTLE
    // ════════════════════════════════
    gltfLoader.load('/turtle.glb', (gltf) => {
      const turtleScene = gltf.scene;
      turtleScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      const tWrapper = new THREE.Group();
      tWrapper.add(turtleScene);
      tWrapper.scale.setScalar(2.4);  // large, majestic
      const tAng = rng() * Math.PI * 2;
      const tRx  = 10 + rng() * 4;
      const tRz  = 9  + rng() * 4;
      const tBob = rng() * Math.PI * 2;
      tWrapper.position.set(tRx * Math.cos(tAng), -2.5, tRz * Math.sin(tAng));
      scene.add(tWrapper);
      turtleData = { g: tWrapper, rx: tRx, rz: tRz, ang: tAng, spd: 0.032, baseY: -2.5, bob: tBob };
    });

    // ════════════════════════════════
    //  STARFISH — ocean floor scatter
    // ════════════════════════════════
    const starfishSpawns: { x: number; z: number; sc: number; ry: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const a = rng() * Math.PI * 2, r = 3 + rng() * 9;
      starfishSpawns.push({
        x: Math.cos(a) * r, z: Math.sin(a) * r,
        sc: 0.30 + rng() * 0.45, ry: rng() * Math.PI * 2,
      });
    }
    gltfLoader.load('/starfish.glb', (gltf) => {
      const tmpl = gltf.scene;
      starfishSpawns.forEach(p => {
        const sf = tmpl.clone(true);
        sf.traverse(c => {
          if ((c as THREE.Mesh).isMesh) {
            const m = c as THREE.Mesh;
            m.castShadow = true;
            m.receiveShadow = true;
          }
        });
        sf.scale.setScalar(p.sc);
        sf.rotation.y = p.ry;
        sf.position.set(p.x, -6.35, p.z);   // just above the seabed
        scene.add(sf);
      });
    });

    // ════════════════════════════════
    //  SHIPWRECK — far background
    // ════════════════════════════════
    gltfLoader.load('/shipwreck.glb', (gltf) => {
      const wreck = gltf.scene;
      wreck.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.castShadow = true;
          m.receiveShadow = true;
          // Deep-water colour shift — cool desaturated blue-green
          const orig = Array.isArray(m.material) ? m.material[0] : m.material;
          const mat = (orig as THREE.MeshStandardMaterial).clone() as THREE.MeshStandardMaterial;
          mat.color.lerp(new THREE.Color(0x1a3a4a), 0.35);
          mat.roughness = Math.min(1, (mat.roughness || 0.8) + 0.1);
          mat.needsUpdate = true;
          m.material = mat;
        }
      });
      wreck.scale.setScalar(8.5);
      wreck.rotation.set(0, Math.PI * 0.75, 0.12);  // tilted as if settled on seabed
      wreck.position.set(-10, -5.8, -18);            // far back, resting on the floor
      scene.add(wreck);
    });

    // ════════════════════════════════
    //  REALISTIC FISH
    // ════════════════════════════════

    // Species color palette for tinting GLB fish instances
    const fishTints = [
      0x1a6fb5,  // Blue tang
      0xff5500,  // Clownfish orange
      0x8045b0,  // Anthias purple
      0xd4a820,  // Yellowtail gold
      0x248060,  // Green wrasse
      0xb0c8e0,  // Silverside
      0xe04020,  // Grouper red
      0x20a0c0,  // Teal
      0xc040a0,  // Magenta
    ];

    // ── Turtle orbit data ──────────────────────────────────
    interface TurtleData {
      g: THREE.Group;
      rx: number; rz: number; ang: number; spd: number;
      baseY: number; bob: number;
    }
    let turtleData: TurtleData | null = null;

    interface FishData {
      g: THREE.Group;
      rx: number; rz: number; ang: number; spd: number;
      baseY: number; bob: number; phase: number;
    }
    const fish: FishData[] = [];

    // Pre-seed RNG params for 22 fish so they're ready when GLB loads
    const fishParams: { tint: number; sc: number; rx: number; rz: number; ang: number; baseY: number; spd: number; bob: number; phase: number }[] = [];
    for (let i = 0; i < 22; i++) {
      fishParams.push({
        tint: fishTints[i % fishTints.length],
        sc:   0.35 + rng() * 0.40,
        rx:   5.5  + rng() * 7,
        rz:   5.5  + rng() * 7,
        ang:  rng() * Math.PI * 2,
        baseY: -4.0 + rng() * 8,
        spd:  (0.15 + rng() * 0.40) * (rng() < 0.5 ? 1 : -1),
        bob:  rng() * Math.PI * 2,
        phase: rng() * Math.PI * 2,
      });
    }

    // Load real 3D fish GLB generated by Hyper3D AI, spawn 22 tinted instances
    gltfLoader.load('/fish.glb', (fishGltf) => {
      const template = fishGltf.scene;

      fishParams.forEach((p) => {
        // Clone the full fish scene for each instance
        const instance = template.clone(true);

        // Apply species color tint to every mesh in the clone
        const tintCol = new THREE.Color(p.tint);
        instance.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.castShadow = true;
            // Clone the material and apply tint, preserving roughness/metalness
            const orig = Array.isArray(m.material) ? m.material[0] : m.material;
            const mat = (orig as THREE.MeshStandardMaterial).clone() as THREE.MeshStandardMaterial;
            // Blend original color with species tint (60% tint, 40% original)
            const blended = mat.color.clone().lerp(tintCol, 0.65);
            mat.color.copy(blended);
            mat.emissive.copy(tintCol).multiplyScalar(0.05);
            mat.needsUpdate = true;
            m.material = mat;
          }
        });

        // The Hyper3D fish is oriented along its natural axis — rotate to face +X
        instance.rotation.y = Math.PI / 2;

        const wrapper = new THREE.Group();
        wrapper.add(instance);
        wrapper.scale.setScalar(p.sc);
        wrapper.position.set(p.rx * Math.cos(p.ang), p.baseY, p.rz * Math.sin(p.ang));
        scene.add(wrapper);

        fish.push({
          g: wrapper,
          rx: p.rx, rz: p.rz, ang: p.ang,
          spd: p.spd,
          baseY: p.baseY,
          bob: p.bob,
          phase: p.phase,
        });
      });
    });

    // ── Fallback: legacy buildFish (never called, kept for TS type safety) ──
    function buildFish(sp: { body: number; belly: number; fin: number; stripe: number | null }): THREE.Group & { tail: THREE.Group; pL: THREE.Mesh; pR: THREE.Mesh } {
      const g = new THREE.Group() as THREE.Group & { tail: THREE.Group; pL: THREE.Mesh; pR: THREE.Mesh };

      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: sp.body, roughness: 0.20, metalness: 0.05,
        clearcoat: 0.8, clearcoatRoughness: 0.08,
        emissive: new THREE.Color(sp.body).multiplyScalar(0.08),
      });
      const bellyMat = new THREE.MeshPhysicalMaterial({
        color: sp.belly, roughness: 0.25, metalness: 0.02,
        clearcoat: 0.5, clearcoatRoughness: 0.12,
      });
      const finMat = new THREE.MeshPhysicalMaterial({
        color: sp.fin, roughness: 0.30, side: THREE.DoubleSide,
        transparent: true, opacity: 0.82,
        emissive: new THREE.Color(sp.fin).multiplyScalar(0.10),
      });

      // ── BODY: extruded fish profile — looks like a fish from every angle ──────
      const profile = new THREE.Shape();
      // tail end → top back
      profile.moveTo(-2.0,  0.02);
      profile.quadraticCurveTo(-1.55,  0.60, -0.90,  0.52);
      // back top → dorsal fin base
      profile.quadraticCurveTo(-0.40,  0.48,  0.05,  0.50);
      // dorsal fin spike
      profile.lineTo( 0.10,  1.05);
      profile.lineTo( 0.55,  1.08);
      profile.lineTo( 0.65,  0.50);
      // continue to head crown
      profile.quadraticCurveTo( 1.30,  0.46,  1.95,  0.10);
      // nose tip
      profile.quadraticCurveTo( 2.12,  0.00,  1.95, -0.22);
      // belly
      profile.quadraticCurveTo( 1.20, -0.48,  0.30, -0.52);
      // pectoral fin notch
      profile.lineTo( 0.10, -0.80);
      profile.lineTo(-0.30, -0.52);
      // belly continues to tail
      profile.quadraticCurveTo(-1.10, -0.48, -1.55, -0.22);
      // lower tail lobe
      profile.quadraticCurveTo(-1.75, -0.50, -2.0, -0.02);
      profile.closePath();

      // Belly highlight sub-shape (hole acts as lighter interior)
      // We handle belly as a separate overlaid mesh instead

      const extSettings = { depth: 0.60, bevelEnabled: true, bevelSize: 0.04, bevelSegments: 2, bevelThickness: 0.04 };
      const bodyGeo = new THREE.ExtrudeGeometry(profile, extSettings);
      bodyGeo.center();
      bodyGeo.applyMatrix4(new THREE.Matrix4().makeScale(1.0, 1.0, 1.0));
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      g.add(bodyMesh);

      // Belly highlight — lighter lower body
      const bellyProfile = new THREE.Shape();
      bellyProfile.moveTo(-1.4, -0.10);
      bellyProfile.quadraticCurveTo( 0.20, -0.48,  1.60, -0.10);
      bellyProfile.quadraticCurveTo( 0.20, -0.18, -1.4, -0.10);
      const bellyExt = { depth: 0.62, bevelEnabled: false };
      const bellyGeo = new THREE.ExtrudeGeometry(bellyProfile, bellyExt);
      bellyGeo.center();
      const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
      g.add(bellyMesh);

      // ── TAIL GROUP — animated wag pivot ─────────────────────────────────────
      const tailGroup = new THREE.Group();
      tailGroup.position.x = -2.0;

      // Forked caudal: two triangular lobes extending from tail pivot
      const tailMat = new THREE.MeshPhysicalMaterial({
        color: sp.fin, roughness: 0.28, side: THREE.DoubleSide,
        transparent: true, opacity: 0.86,
        emissive: new THREE.Color(sp.fin).multiplyScalar(0.12),
      });
      const tailExt = { depth: 0.55, bevelEnabled: false };

      const tUp = new THREE.Shape();
      tUp.moveTo(0,  0.05); tUp.lineTo(-0.85,  0.78); tUp.lineTo(-0.65,  0.05); tUp.closePath();
      const tUpGeo = new THREE.ExtrudeGeometry(tUp, tailExt);
      tUpGeo.center();
      tailGroup.add(new THREE.Mesh(tUpGeo, tailMat));

      const tDn = new THREE.Shape();
      tDn.moveTo(0, -0.05); tDn.lineTo(-0.85, -0.78); tDn.lineTo(-0.65, -0.05); tDn.closePath();
      const tDnGeo = new THREE.ExtrudeGeometry(tDn, tailExt);
      tDnGeo.center();
      tailGroup.add(new THREE.Mesh(tDnGeo, tailMat));

      g.add(tailGroup);

      // ── PECTORAL FINS — side paddles (animated refs) ─────────────────────────
      const pShape = new THREE.Shape();
      pShape.moveTo(0, 0); pShape.quadraticCurveTo(0.50, 0.28, 0.75, 0.05);
      pShape.quadraticCurveTo(0.55, -0.12, 0, 0);
      const pExt = { depth: 0.06, bevelEnabled: false };
      const pFinGeo = new THREE.ExtrudeGeometry(pShape, pExt);
      pFinGeo.center();

      const pL = new THREE.Mesh(pFinGeo, finMat);
      pL.position.set(0.15, -0.18, 0.36);
      pL.rotation.set(0.15, 0.40, 0.20);
      g.add(pL);

      const pR = new THREE.Mesh(pFinGeo.clone(), finMat);
      pR.position.set(0.15, -0.18, -0.36);
      pR.rotation.set(-0.15, -0.40, 0.20);
      g.add(pR);

      // ── EYE ─────────────────────────────────────────────────────────────────
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.05 })
      );
      eye.position.set(1.72, 0.22, 0.28);
      g.add(eye);
      const eyeShine = new THREE.Mesh(
        new THREE.SphereGeometry(0.042, 5, 5),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      eyeShine.position.set(1.82, 0.27, 0.32);
      g.add(eyeShine);

      // ── STRIPE for clownfish / banded species ────────────────────────────────
      if (sp.stripe !== null) {
        const stripeMat = new THREE.MeshStandardMaterial({ color: sp.stripe, roughness: 0.25 });
        const stripeShape = new THREE.Shape();
        stripeShape.moveTo(-0.12, -0.80); stripeShape.lineTo( 0.12, -0.80);
        stripeShape.lineTo( 0.12,  1.05); stripeShape.lineTo(-0.12,  1.05);
        stripeShape.closePath();
        const stripeExt = { depth: 0.64, bevelEnabled: false };
        const stripeGeo = new THREE.ExtrudeGeometry(stripeShape, stripeExt);
        stripeGeo.center();
        const s1 = new THREE.Mesh(stripeGeo, stripeMat);
        s1.position.x = 0.38;
        g.add(s1);
        const s2 = s1.clone();
        s2.position.x = -0.55;
        g.add(s2);
      }

      g.tail = tailGroup;
      g.pL   = pL;
      g.pR   = pR;
      return g;
    }

    // Fish are now spawned inside the gltfLoader.load('/fish.glb') callback above

    // ════════════════════════════════
    //  WATER SURFACE
    // ════════════════════════════════
    const waterGeo = new THREE.PlaneGeometry(80, 80, 48, 48);
    const water = new THREE.Mesh(waterGeo, new THREE.MeshPhysicalMaterial({
      color: 0x041828,
      roughness: 0.02, metalness: 0.0,
      transparent: true, opacity: 0.60,
      envMapIntensity: 1.8,
    }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = -3.0;
    scene.add(water);

    // ════════════════════════════════
    //  GOD RAYS — animated light shafts
    // ════════════════════════════════
    interface RayData {
      mesh: THREE.Mesh;
      mat: THREE.MeshBasicMaterial;
      baseX: number; baseZ: number;
      phase: number; freq: number;
      peakOpacity: number; tiltZ: number; tiltY: number;
    }
    const rays: RayData[] = [];
    for (let ri = 0; ri < 12; ri++) {
      const w = 0.18 + rng() * 0.45;
      const rayGeo = new THREE.PlaneGeometry(w, 24 + rng() * 6);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xc8e8ff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const ray = new THREE.Mesh(rayGeo, mat);
      const bx = -6 + rng() * 12;
      const bz = -5 + rng() * 10;
      ray.position.set(bx, 4.0, bz);
      const tiltZ = (rng() - 0.5) * 0.30;
      const tiltY = rng() * Math.PI;
      ray.rotation.set(0, tiltY, tiltZ);
      scene.add(ray);
      rays.push({
        mesh: ray, mat,
        baseX: bx, baseZ: bz,
        phase: rng() * Math.PI * 2,
        freq: 0.18 + rng() * 0.45,    // how fast it pulses
        peakOpacity: 0.028 + rng() * 0.055,
        tiltZ, tiltY,
      });
    }

    // ════════════════════════════════
    //  RISING BUBBLES
    // ════════════════════════════════
    const PC = 1200;
    const pPos = new Float32Array(PC * 3);
    const pVel = new Float32Array(PC);
    const pWobble = new Float32Array(PC); // horizontal wobble phase
    for (let i = 0; i < PC; i++) {
      const r = 1.5 + rng() * 15, th = rng() * Math.PI * 2;
      pPos[i * 3]     = Math.cos(th) * r;
      pPos[i * 3 + 1] = -8 + rng() * 24;
      pPos[i * 3 + 2] = Math.sin(th) * r;
      pVel[i]     = 0.004 + rng() * 0.006;
      pWobble[i]  = rng() * Math.PI * 2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xc8e8ff,      // pale silver-blue bubbles
      size: 0.045,
      transparent: true, opacity: 0.30,
      blending: THREE.AdditiveBlending,
      depthWrite: false, sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Fine sediment — very small, barely visible drifting dust
    const SC = 500;
    const sPos = new Float32Array(SC * 3);
    for (let i = 0; i < SC; i++) {
      sPos[i * 3]     = (rng() - 0.5) * 28;
      sPos[i * 3 + 1] = -6 + rng() * 14;
      sPos[i * 3 + 2] = (rng() - 0.5) * 28;
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    const sediment = new THREE.Points(sGeo, new THREE.PointsMaterial({
      color: 0x8090a0, size: 0.022, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    scene.add(sediment);

    // Interior sparkles
    const IPC = 280;
    const ipPos = new Float32Array(IPC * 3);
    for (let i = 0; i < IPC; i++) {
      const r = rng() * 1.55, th = rng() * Math.PI * 2, ph = rng() * Math.PI;
      ipPos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      ipPos[i * 3 + 1] = 0.6 + r * Math.sin(ph) * Math.sin(th) * 0.5;
      ipPos[i * 3 + 2] = r * Math.cos(ph);
    }
    const ipGeo = new THREE.BufferGeometry();
    ipGeo.setAttribute("position", new THREE.BufferAttribute(ipPos, 3));
    const ipMat = new THREE.PointsMaterial({
      color: 0xc0ffee, size: 0.038, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    scene.add(new THREE.Points(ipGeo, ipMat));

    // ════════════════════════════════
    //  CAMERA SPLINE
    // ════════════════════════════════
    const posSpline  = new THREE.CatmullRomCurve3(KF.map(k => new THREE.Vector3(k.p[0], k.p[1], k.p[2])));
    const lookSpline = new THREE.CatmullRomCurve3(KF.map(k => new THREE.Vector3(k.l[0], k.l[1], k.l[2])));
    posSpline.tension = lookSpline.tension = 0.42;
    const tArr = KF.map(k => k.t);

    function scrollToSpline(st: number): number {
      for (let i = 0; i < tArr.length - 1; i++) {
        if (st >= tArr[i] && st <= tArr[i + 1])
          return (i + (st - tArr[i]) / (tArr[i + 1] - tArr[i])) / (tArr.length - 1);
      }
      return st >= 1 ? 1 : 0;
    }

    let targetT = 0, smoothT = 0;
    const lookTarget = new THREE.Vector3(0, 0.5, 0);

    function applyScroll(st: number) {
      SECTIONS.forEach(([id, s, e, di]) => {
        document.getElementById(id)?.classList.toggle("on", st >= s && st <= e);
        document.querySelector(`[data-s="${di}"]`)?.classList.toggle("on", st >= s && st <= e);
      });
      document.getElementById("nav")?.classList.toggle("show", st > 0.04);
      document.getElementById("dots")?.classList.toggle("show", st > 0.04);
      if (st > 0.03) document.getElementById("scroll-hint")?.classList.add("hide");

      const iIn  = Math.max(0, Math.min(1, (st - 0.56) / 0.10));
      const iOut = Math.max(0, Math.min(1, (0.78 - st) / 0.08));
      const iAmt = iIn * iOut;
      interiorPt.intensity       = iAmt * 24;
      ipMat.opacity              = iAmt * 0.90;
      innerMat.emissiveIntensity = 0.5 + iAmt * 5.0;
      renderer.toneMappingExposure          = 0.90 + iAmt * 1.20;
      (scene.fog as THREE.FogExp2).density  = 0.042 - iAmt * 0.022;
      bloom.strength                        = 1.10 + iAmt * 2.40;
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

      // Camera
      const sp = scrollToSpline(smoothT);
      camera.position.lerp(posSpline.getPoint(sp), 0.07);
      lookTarget.lerp(lookSpline.getPoint(sp), 0.06);
      camera.lookAt(lookTarget);

      // Bulb pulse
      const pulse = Math.sin(t * 1.8) * 0.5 + 0.5;
      bulbPt.intensity = 11 + pulse * 7;
      (bulbMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 6.0 + pulse * 3.0;

      // Caustic drift — 6 roving light patches simulating filtered surface ripple
      causticA.position.set( 4 + Math.sin(t * 0.58) * 3.5,  2 + Math.sin(t * 0.32) * 1.2,  6 + Math.cos(t * 0.42) * 2.5);
      causticB.position.set(-5 + Math.cos(t * 0.51) * 3.0,  3 + Math.sin(t * 0.44) * 0.8,  5 + Math.sin(t * 0.67) * 2.2);
      causticC.position.set( Math.sin(t * 0.37) * 4.2,      1 + Math.cos(t * 0.29) * 1.0,  2 + Math.cos(t * 0.55) * 3.0);
      causticD.position.set( 6 + Math.cos(t * 0.43) * 2.8, -2 + Math.sin(t * 0.61) * 0.9, -3 + Math.sin(t * 0.38) * 2.0);
      causticE.position.set(-4 + Math.sin(t * 0.66) * 2.5, -1 + Math.cos(t * 0.48) * 0.7, -4 + Math.cos(t * 0.52) * 2.4);
      causticF.position.set( 2 + Math.cos(t * 0.35) * 3.2,  4 + Math.sin(t * 0.27) * 1.1, -6 + Math.sin(t * 0.72) * 1.8);
      // Reef glows pulse gently like bioluminescence
      reefGlow.intensity  = 2.0 + Math.sin(t * 1.1) * 0.8;
      reefGlow2.intensity = 1.8 + Math.cos(t * 0.9) * 0.6;

      // God ray beams — each pulses independently at its own frequency & phase
      rays.forEach(r => {
        // Smooth sinusoidal pulse — clamp to 0 so rays fully disappear between flashes
        const pulse = Math.max(0, Math.sin(t * r.freq + r.phase));
        // Slow horizontal drift so the beam wanders slightly
        r.mesh.position.x = r.baseX + Math.sin(t * 0.12 + r.phase) * 1.4;
        r.mesh.position.z = r.baseZ + Math.cos(t * 0.09 + r.phase) * 1.0;
        r.mat.opacity = pulse * pulse * r.peakOpacity;  // squared = sharper flash onset
      });

      // Water ripple
      const wVerts = waterGeo.attributes.position.array as Float32Array;
      for (let wi = 0; wi < wVerts.length; wi += 3) {
        const wx = wVerts[wi], wz = wVerts[wi + 2];
        wVerts[wi + 1] = Math.sin(wx * 0.30 + t * 0.55) * 0.06
                       + Math.cos(wz * 0.25 + t * 0.48) * 0.04
                       + Math.sin((wx + wz) * 0.18 + t * 0.72) * 0.03;
      }
      waterGeo.attributes.position.needsUpdate = true;
      waterGeo.computeVertexNormals();

      // Fish — orbit + tail wag + pectoral flutter
      fish.forEach(f => {
        f.ang += f.spd * 0.011;
        f.g.position.set(
          f.rx * Math.cos(f.ang),
          f.baseY + Math.sin(t * 0.55 + f.bob) * 0.35,
          f.rz * Math.sin(f.ang)
        );
        // Face direction of motion (fish +Z forward in GLB, mapped to world swim dir)
        f.g.rotation.y = -f.ang - Math.PI / 2 + (f.spd > 0 ? 0 : Math.PI);
        // Gentle body roll when banking through a turn
        f.g.rotation.z = Math.sin(t * 1.8 + f.phase) * 0.08;
      });

      // Sea turtle — slow graceful orbit
      if (turtleData) {
        turtleData.ang += turtleData.spd * 0.008;
        turtleData.g.position.set(
          turtleData.rx * Math.cos(turtleData.ang),
          turtleData.baseY + Math.sin(t * 0.28 + turtleData.bob) * 0.55,
          turtleData.rz * Math.sin(turtleData.ang)
        );
        // Face the direction of travel
        turtleData.g.rotation.y = -turtleData.ang - Math.PI / 2;
        // Subtle body tilt — turtles bank gently
        turtleData.g.rotation.z = Math.sin(t * 0.5) * 0.06;
        turtleData.g.rotation.x = Math.sin(t * 0.28 + turtleData.bob) * 0.04;
      }

      // Kelp sway
      kelpData.forEach((kd, ki) => {
        kd.blades.forEach((blade, bi) => {
          const depth = bi / kd.blades.length;
          blade.rotation.z = Math.sin(t * 0.62 + kd.phase + bi * 0.3) * (0.08 + depth * 0.18);
          blade.rotation.x = Math.cos(t * 0.48 + kd.phase + bi * 0.2) * (0.04 + depth * 0.10);
        });
        void ki;
      });

      // Rising bubbles with horizontal wobble
      const ppa = pGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PC; i++) {
        ppa[i * 3]     += Math.sin(t * 0.8 + pWobble[i]) * 0.003;
        ppa[i * 3 + 1] += pVel[i];
        if (ppa[i * 3 + 1] > 16) ppa[i * 3 + 1] = -8;
      }
      pGeo.attributes.position.needsUpdate = true;

      // Sediment drift
      const spa = sGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < SC; i++) {
        spa[i * 3]     += Math.sin(t * 0.25 + i * 0.4) * 0.001;
        spa[i * 3 + 1] -= 0.0005;
        if (spa[i * 3 + 1] < -6.5) spa[i * 3 + 1] = 7.5;
      }
      sGeo.attributes.position.needsUpdate = true;

      composer.render();
    }

    animate();

    const handleResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
      composer.setSize(W, H);
      bloom.setSize(W, H);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      composer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0 }} />;
}
