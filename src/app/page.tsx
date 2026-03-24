"use client";

import dynamic from "next/dynamic";

const Scene3D = dynamic(() => import("@/components/Scene3D"), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      {/* Loading screen */}
      <div id="loading">
        <div className="load-title">New Meridian</div>
        <div className="load-sub">Loading the abyss</div>
        <div className="load-track">
          <div className="load-fill" id="load-fill" />
        </div>
      </div>

      {/* 3D Canvas */}
      <Scene3D />

      {/* Scroll driver */}
      <div id="scroll-driver" />

      {/* Overlays */}
      <div className="vignette" />
      <div className="grain" />
      <div className="scanlines" />

      {/* Navigation */}
      <nav id="nav">
        <a className="nav-logo" href="#">
          New Meridian
        </a>
        <ul className="nav-links">
          <li>
            <a href="#">About</a>
          </li>
          <li>
            <a href="#">Music</a>
          </li>
          <li>
            <a href="#">Tour</a>
          </li>
          <li>
            <a href="#">Connect</a>
          </li>
        </ul>
      </nav>

      {/* Progress dots */}
      <div id="dots">
        <div className="dot on" data-s="0" />
        <div className="dot" data-s="1" />
        <div className="dot" data-s="2" />
        <div className="dot" data-s="3" />
        <div className="dot" data-s="4" />
        <div className="dot" data-s="5" />
      </div>

      {/* Scroll hint */}
      <div id="scroll-hint">
        <div className="hint-line" />
        <div className="hint-label">Scroll</div>
      </div>

      {/* ─── CONTENT SECTIONS ─── */}

      {/* Hero */}
      <div className="section on" id="s-hero">
        <div className="hero-band">New Meridian</div>
        <div className="hero-tag">
          Progressive Post-Hardcore &nbsp;&middot;&nbsp; Est. 2019
        </div>
      </div>

      {/* About */}
      <div className="section" id="s-about">
        <div className="sec-label">The Band</div>
        <h2 className="sec-heading">
          Sound born
          <br />
          from the deep
        </h2>
        <p className="sec-body">
          New Meridian forge music at the collision point of raw aggression and
          oceanic atmosphere. Heavy riffs dissolve into shimmering ambience
          before surging back — a relentless tide between chaos and
          transcendence.
        </p>
        <p className="sec-body" style={{ marginTop: 12 }}>
          Formed in the Pacific Northwest, the five-piece have spent years
          building their world in basements and warehouses before breaking
          surface.
        </p>
      </div>

      {/* Threshold (inside the head) */}
      <div className="section" id="s-threshold">
        <div className="big-text">
          Step Inside
          <br />
          The Light
        </div>
        <div className="sub-text">A new record — arriving 2026</div>
      </div>

      {/* Album */}
      <div className="section" id="s-album">
        <div className="album-block">
          <div className="label">Latest Release</div>
          <h2>
            Hollow
            <br />
            Meridian
          </h2>
          <div className="release">Full-Length &middot; Out Now</div>
          <button className="cta-btn">Stream Now</button>
        </div>
      </div>

      {/* Tour */}
      <div className="section" id="s-tour">
        <div>
          <div className="sec-label">On Tour — 2026</div>
          <h2
            className="sec-heading"
            style={{ fontSize: "clamp(22px, 2.8vw, 38px)" }}
          >
            World Tour
          </h2>
          <div style={{ marginTop: 28 }}>
            <div className="tour-row">
              <span className="date">APR 18</span>
              <span className="city">Los Angeles, CA</span>
              <span className="venue">The Wiltern</span>
            </div>
            <div className="tour-row">
              <span className="date">APR 25</span>
              <span className="city">New York, NY</span>
              <span className="venue">Brooklyn Steel</span>
            </div>
            <div className="tour-row">
              <span className="date">MAY 08</span>
              <span className="city">London, UK</span>
              <span className="venue">Roundhouse</span>
            </div>
            <div className="tour-row">
              <span className="date">MAY 21</span>
              <span className="city">Berlin, DE</span>
              <span className="venue">Berghain Kantine</span>
            </div>
            <div className="tour-row">
              <span className="date">JUN 04</span>
              <span className="city">Tokyo, JP</span>
              <span className="venue">Zepp DiverCity</span>
            </div>
          </div>
          <div className="tour-ticket">→ All Dates & Tickets</div>
        </div>
      </div>

      {/* Contact */}
      <div className="section" id="s-contact">
        <div className="sec-label">Stay Connected</div>
        <h2
          className="sec-heading"
          style={{ fontSize: "clamp(28px, 4vw, 52px)" }}
        >
          New Meridian
        </h2>
        <div className="contact-links">
          <a href="#">Instagram</a>
          <a href="#">Spotify</a>
          <a href="#">Apple Music</a>
          <a href="#">Bandcamp</a>
          <a href="#">Press</a>
        </div>
        <p
          style={{
            marginTop: 28,
            fontSize: 11,
            letterSpacing: 3,
            color: "rgba(80,160,180,0.3)",
          }}
        >
          © 2026 New Meridian. All rights reserved.
        </p>
      </div>
    </>
  );
}
