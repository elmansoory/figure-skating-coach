import { STANDARD_GRAVITY } from "./jump";

/** Clausius–Clapeyron slope of the ice/water melting line near 0 °C (K per Pa). */
export const MELTING_SLOPE_K_PER_PA = -7.4e-8;
export const LATENT_HEAT_FUSION = 334_000; // J/kg
export const WATER_DENSITY = 1000; // kg/m³

export interface GlideParams {
  massKg: number;
  initialSpeed: number;
  friction: number;
  /** Drag area C_d·A (m²); ~0.25–0.5 for an upright skater */
  dragArea: number;
  airDensity?: number;
  gravity?: number;
}

export interface GlideResult {
  stopTime: number;
  stopDistance: number;
  /** Distance with friction alone, ignoring air: v₀²/(2μg) */
  frictionOnlyDistance: number;
  samples: { t: number; speed: number; distance: number }[];
}

/**
 * m·dv/dt = −μ·m·g − ½ρ·C_dA·v². With a = μg and b = ρC_dA/(2m):
 *   v(t) = √(a/b)·tan(atan(v₀√(b/a)) − √(ab)·t)
 *   stop time  = atan(v₀√(b/a)) / √(ab)
 *   stop dist. = ln(1 + b·v₀²/a) / (2b)
 */
export function simulateGlide(p: GlideParams): GlideResult {
  const g = p.gravity ?? STANDARD_GRAVITY;
  const rho = p.airDensity ?? 1.25;
  const a = p.friction * g;
  const b = (rho * p.dragArea) / (2 * p.massKg);
  const v0 = p.initialSpeed;

  let stopTime: number;
  let stopDistance: number;
  let speedAt: (t: number) => number;
  let distanceAt: (t: number) => number;

  if (b < 1e-12) {
    stopTime = v0 / a;
    stopDistance = (v0 * v0) / (2 * a);
    speedAt = (t) => Math.max(0, v0 - a * t);
    distanceAt = (t) => v0 * t - 0.5 * a * t * t;
  } else {
    const k = Math.sqrt(a / b);
    const w = Math.sqrt(a * b);
    const phi0 = Math.atan(v0 / k);
    stopTime = phi0 / w;
    stopDistance = Math.log(1 + (b * v0 * v0) / a) / (2 * b);
    speedAt = (t) => Math.max(0, k * Math.tan(phi0 - w * t));
    // ∫ k·tan(φ₀ − w·t) dt = (k/w)·ln(cos(φ₀ − w·t)/cos φ₀)
    distanceAt = (t) => (k / w) * Math.log(Math.cos(phi0 - w * t) / Math.cos(phi0));
  }

  const samples = [];
  const n = 100;
  for (let i = 0; i <= n; i++) {
    const t = (stopTime * i) / n;
    samples.push({ t, speed: speedAt(t), distance: distanceAt(t) });
  }

  return { stopTime, stopDistance, frictionOnlyDistance: (v0 * v0) / (2 * a), samples };
}

export interface ContactParams {
  massKg: number;
  /** Width of the blade in contact (m): ~4 mm flat, ~1 mm on one edge */
  contactWidth: number;
  /** Length of the rocker in contact with the ice (m) */
  contactLength: number;
  iceTemperatureC: number;
  gravity?: number;
}

export function pressureMelting(p: ContactParams) {
  const g = p.gravity ?? STANDARD_GRAVITY;
  const area = p.contactWidth * p.contactLength;
  const pressure = (p.massKg * g) / area;
  const meltingPointC = MELTING_SLOPE_K_PER_PA * pressure;
  return {
    area,
    pressurePa: pressure,
    pressureAtm: pressure / 101_325,
    meltingPointC,
    meltsByPressureAlone: meltingPointC <= p.iceTemperatureC,
  };
}

/**
 * Upper bound on the water film from frictional heating, if all the friction work
 * μ·m·g per metre went into melting a strip as wide as the contact.
 */
export function frictionalMeltFilm(massKg: number, friction: number, contactWidth: number, gravity = STANDARD_GRAVITY) {
  const heatPerMetre = friction * massKg * gravity;
  const meltedMassPerMetre = heatPerMetre / LATENT_HEAT_FUSION;
  return {
    heatPerMetre,
    filmThicknessM: meltedMassPerMetre / (WATER_DENSITY * contactWidth),
  };
}

/** Lean angle from vertical needed to hold an edge on a curve: tan θ = v²/(g·R). */
export function edgeLeanAngleDeg(speed: number, radius: number, gravity = STANDARD_GRAVITY) {
  return (Math.atan((speed * speed) / (gravity * radius)) * 180) / Math.PI;
}
