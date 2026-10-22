import React from "react";
import "./PalmBotanicalAnimation.css";

import palmTopLeftImg from "/assets/palm-frond-top-left.png";
import palmBottomRightImg from "/assets/palm-frond-bottom-right.png";

/**
 * PalmBotanicalAnimation
 *
 * Implements an ultra-crisp, buttery-smooth botanical entrance for Escora Holidays:
 * 1. Pin-sharp rendering of the exact muted sage watercolor artwork with zero blur or milky wash-out.
 * 2. Hardware-accelerated GPU reveal expanding naturally from the stem base outward.
 * 3. Smooth monotonic easing with zero micro-stuttering or stepping.
 * 4. Completely still, tranquil resting state once settled (no heartbeat or pulsing).
 * 5. Perfectly framed corners with clean, open center for page content.
 */
export default function PalmBotanicalAnimation() {
  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* ====================================================================
          PRIMARY FROND: Top-Left Arching Coconut Frond
          ==================================================================== */}
      <div className="absolute top-0 left-0 w-[280px] sm:w-[380px] md:w-[460px] lg:w-[520px] xl:w-[560px] max-w-[48vw] palm-frond-tl">
        <img
          src={palmTopLeftImg}
          alt=""
          className="w-full h-auto block select-none pointer-events-none drop-shadow-none"
          loading="eager"
          decoding="sync"
        />
      </div>

      {/* ====================================================================
          SECONDARY FROND: Bottom-Right Coconut Frond (~70% Balanced Scale)
          ==================================================================== */}
      <div className="absolute bottom-0 right-0 w-[220px] sm:w-[300px] md:w-[360px] lg:w-[410px] xl:w-[440px] max-w-[40vw] palm-frond-br">
        <img
          src={palmBottomRightImg}
          alt=""
          className="w-full h-auto block select-none pointer-events-none drop-shadow-none"
          loading="eager"
          decoding="sync"
        />
      </div>
    </div>
  );
}
