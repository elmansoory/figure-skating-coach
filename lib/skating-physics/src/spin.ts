import { dragTorqueCoefficient, momentOfInertia, type Body, type Posture } from "./body";
import { smoothstep, STANDARD_GRAVITY } from "./jump";

export interface SpinParams {
  body: Body;
  entryPosture: Posture;
  finalPosture: Posture;
  /** Angular velocity when the spin is entered (rev/s) */
  entryOmega: number;
  /** Time held in the entry position before pulling in (s) */
  entryHold: number;
  /** Duration of the change of position (s) */
  transitionTime: number;
  duration: number;
  /** Blade–ice kinetic friction coefficient */
  friction: number;
  /** Mean lever arm of the sliding contact around the spin point (m) */
  contactRadius: number;
  /** Include aerodynamic drag on extended limbs */
  airDrag?: boolean;
  gravity?: number;
  dt?: number;
}

export interface SpinSample {
  t: number;
  omegaRevPerSec: number;
  inertia: number;
  angularMomentum: number;
  kineticEnergy: number;
  revolutions: number;
}

export interface SpinResult {
  inertiaEntry: number;
  inertiaFinal: number;
  frictionTorque: number;
  peakOmegaRevPerSec: number;
  peakRpm: number;
  totalRevolutions: number;
  /** ω_final/ω_entry if angular momentum were perfectly conserved = I_entry/I_final */
  idealSpeedUp: number;
  /** Work the skater's muscles do pulling in, ignoring losses: L²/2·(1/I_f − 1/I_e) */
  pullInWork: number;
  /** Time at which the spin stops, if it does within the simulated duration */
  stopTime: number | null;
  samples: SpinSample[];
}

export function simulateSpin(p: SpinParams): SpinResult {
  const g = p.gravity ?? STANDARD_GRAVITY;
  const dt = p.dt ?? 0.001;
  const Ie = momentOfInertia(p.body, p.entryPosture).total;
  const If = momentOfInertia(p.body, p.finalPosture).total;
  const de = p.airDrag === false ? 0 : dragTorqueCoefficient(p.body, p.entryPosture);
  const df = p.airDrag === false ? 0 : dragTorqueCoefficient(p.body, p.finalPosture);

  // Sliding friction μN acting at an average lever arm r_c gives a constant opposing torque.
  const frictionTorque = p.friction * p.body.massKg * g * p.contactRadius;

  const mix = (t: number) => smoothstep((t - p.entryHold) / Math.max(p.transitionTime, 1e-6));
  const inertiaAt = (t: number) => Ie + (If - Ie) * mix(t);
  const dragAt = (t: number) => de + (df - de) * mix(t);

  let L = Ie * p.entryOmega * 2 * Math.PI;
  const L0 = L;
  let angle = 0;
  let peak = 0;
  let stopTime: number | null = null;
  const samples: SpinSample[] = [];
  const sampleEvery = 0.02;
  let nextSample = 0;
  const steps = Math.ceil(p.duration / dt);

  for (let i = 0; i <= steps; i++) {
    const t = i * dt;
    const I = inertiaAt(t);
    const omega = L / I;
    peak = Math.max(peak, omega);
    if (t >= nextSample || i === steps) {
      samples.push({
        t,
        omegaRevPerSec: omega / (2 * Math.PI),
        inertia: I,
        angularMomentum: L,
        kineticEnergy: (L * L) / (2 * I),
        revolutions: angle / (2 * Math.PI),
      });
      nextSample += sampleEvery;
    }
    if (L <= 0) {
      stopTime = t;
      break;
    }
    // dL/dt = −τ_friction − c·ω²
    const torque = frictionTorque + dragAt(t) * omega * omega;
    angle += omega * dt;
    L = Math.max(0, L - torque * dt);
  }

  return {
    inertiaEntry: Ie,
    inertiaFinal: If,
    frictionTorque,
    peakOmegaRevPerSec: peak / (2 * Math.PI),
    peakRpm: (peak / (2 * Math.PI)) * 60,
    totalRevolutions: angle / (2 * Math.PI),
    idealSpeedUp: Ie / If,
    pullInWork: ((L0 * L0) / 2) * (1 / If - 1 / Ie),
    stopTime,
    samples,
  };
}
