import { momentOfInertia, type Body, type Posture } from "./body";

export const STANDARD_GRAVITY = 9.81;

export const JUMP_TYPES = {
  T: { name: "Toe loop", forwardTakeoff: false },
  S: { name: "Salchow", forwardTakeoff: false },
  Lo: { name: "Loop", forwardTakeoff: false },
  F: { name: "Flip", forwardTakeoff: false },
  Lz: { name: "Lutz", forwardTakeoff: false },
  A: { name: "Axel", forwardTakeoff: true },
} as const;

export type JumpType = keyof typeof JUMP_TYPES;

/** Revolutions required: an Axel takes off forwards, so it needs an extra half turn. */
export function requiredRevolutions(revolutions: number, type: JumpType): number {
  return revolutions + (JUMP_TYPES[type].forwardTakeoff ? 0.5 : 0);
}

export type RotationCall = "clean" | "q" | "<" | "<<" | "over";

/**
 * Model approximation of the technical panel's rotation call from the shortfall in
 * revolutions on landing. ISU: less than ¼ short = no call, on the quarter = q,
 * more than ¼ but less than ½ = <, ½ or more = <<. The q band here is ¼ to 0.3.
 */
export function rotationCall(shortfallRev: number): RotationCall {
  if (shortfallRev < -0.25) return "over";
  if (shortfallRev < 0.25) return "clean";
  if (shortfallRev < 0.3) return "q";
  if (shortfallRev < 0.5) return "<";
  return "<<";
}

export interface JumpParams {
  body: Body;
  revolutions: number;
  type: JumpType;
  /** Vertical take-off velocity of the centre of mass (m/s) */
  verticalVelocity: number;
  /** Horizontal speed across the ice (m/s) */
  horizontalVelocity: number;
  /** Angular velocity at the instant of take-off (rev/s) */
  takeoffOmega: number;
  takeoffPosture: Posture;
  airPosture: Posture;
  landingPosture: Posture;
  /** Time to pull into the air position (s) */
  pullInTime: number;
  /** Time spent opening out before landing (s) */
  openOutTime: number;
  /** Rotation completed on the ice before leaving it (rev) */
  preRotation: number;
  /** How much lower the centre of mass is at landing than at take-off (m) */
  landingDrop?: number;
  gravity?: number;
  dt?: number;
}

export interface JumpSample {
  t: number;
  heightM: number;
  omegaRevPerSec: number;
  inertia: number;
  revolutions: number;
}

export interface JumpResult {
  flightTime: number;
  peakHeight: number;
  distance: number;
  takeoffAngleDeg: number;
  angularMomentum: number;
  inertiaTakeoff: number;
  inertiaAir: number;
  inertiaLanding: number;
  maxOmegaRevPerSec: number;
  airRevolutions: number;
  totalRevolutions: number;
  required: number;
  shortfall: number;
  call: RotationCall;
  /** Take-off spin needed to land exactly fully rotated, other inputs unchanged (rev/s) */
  requiredTakeoffOmega: number;
  rotationalEnergyTakeoff: number;
  rotationalEnergyAir: number;
  samples: JumpSample[];
}

/** Smooth 0→1 ramp with zero slope at both ends. */
export const smoothstep = (x: number) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};

export function flightTime(verticalVelocity: number, gravity = STANDARD_GRAVITY, landingDrop = 0): number {
  // z(t) = v·t − ½g·t² = −drop  →  t = (v + √(v² + 2g·drop)) / g
  return (verticalVelocity + Math.sqrt(verticalVelocity ** 2 + 2 * gravity * landingDrop)) / gravity;
}

export function simulateJump(p: JumpParams): JumpResult {
  const g = p.gravity ?? STANDARD_GRAVITY;
  const dt = p.dt ?? 0.0005;
  const T = flightTime(p.verticalVelocity, g, p.landingDrop ?? 0);

  const I0 = momentOfInertia(p.body, p.takeoffPosture).total;
  const Iair = momentOfInertia(p.body, p.airPosture).total;
  const Iland = momentOfInertia(p.body, p.landingPosture).total;

  // If the requested transitions don't fit in the flight, compress them proportionally.
  const transitions = p.pullInTime + p.openOutTime;
  const scale = transitions > T ? T / transitions : 1;
  const tIn = p.pullInTime * scale;
  const tOut = p.openOutTime * scale;

  const inertiaAt = (t: number) => {
    if (t < tIn) return I0 + (Iair - I0) * smoothstep(t / tIn);
    if (t > T - tOut) return Iair + (Iland - Iair) * smoothstep((t - (T - tOut)) / tOut);
    return Iair;
  };

  // No external torque in flight (gravity acts through the centre of mass), so L = I·ω is constant.
  const L = I0 * p.takeoffOmega * 2 * Math.PI;

  const samples: JumpSample[] = [];
  const sampleEvery = 0.005;
  let nextSample = 0;
  let angle = 0;
  let maxOmega = 0;
  const steps = Math.ceil(T / dt);
  for (let i = 0; i <= steps; i++) {
    const t = Math.min(i * dt, T);
    const I = inertiaAt(t);
    const omega = L / I;
    maxOmega = Math.max(maxOmega, omega);
    if (t >= nextSample || i === steps) {
      samples.push({
        t,
        heightM: p.verticalVelocity * t - 0.5 * g * t * t,
        omegaRevPerSec: omega / (2 * Math.PI),
        inertia: I,
        revolutions: p.preRotation + angle / (2 * Math.PI),
      });
      nextSample += sampleEvery;
    }
    if (i < steps) {
      // Midpoint rule for the rotation angle
      const h = Math.min(dt, T - t);
      angle += (L / inertiaAt(t + h / 2)) * h;
    }
  }

  const airRevolutions = angle / (2 * Math.PI);
  const totalRevolutions = p.preRotation + airRevolutions;
  const required = requiredRevolutions(p.revolutions, p.type);
  const shortfall = required - totalRevolutions;

  return {
    flightTime: T,
    peakHeight: p.verticalVelocity ** 2 / (2 * g),
    distance: p.horizontalVelocity * T,
    takeoffAngleDeg: (Math.atan2(p.verticalVelocity, p.horizontalVelocity) * 180) / Math.PI,
    angularMomentum: L,
    inertiaTakeoff: I0,
    inertiaAir: Iair,
    inertiaLanding: Iland,
    maxOmegaRevPerSec: maxOmega / (2 * Math.PI),
    airRevolutions,
    totalRevolutions,
    required,
    shortfall,
    call: rotationCall(shortfall),
    // Air revolutions scale linearly with L, so the needed take-off spin follows directly.
    requiredTakeoffOmega: airRevolutions > 0 ? (p.takeoffOmega * (required - p.preRotation)) / airRevolutions : NaN,
    rotationalEnergyTakeoff: (L * L) / (2 * I0),
    rotationalEnergyAir: (L * L) / (2 * Iair),
    samples,
  };
}
