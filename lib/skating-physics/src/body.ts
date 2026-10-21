// Segmental model of a skater's moment of inertia about the vertical spin axis.
//
// Segment masses use Dempster's proportions (as tabulated by Winter, "Biomechanics
// and Motor Control of Human Movement"): head+trunk 57.8%, each arm 5.0%, each leg
// 16.1% of body mass. Segment lengths and offsets are scaled by stature. Each limb is
// treated as a uniform rod, which is crude but captures the key point: inertia grows
// with the square of the distance of mass from the axis.

export interface Body {
  massKg: number;
  heightM: number;
}

export interface Posture {
  /** 0 = arms wrapped tight to the chest, 1 = arms straight out horizontally */
  armExtension: number;
  /** Free leg angle from vertical in degrees: 0 = beside the skating leg, 90 = horizontal */
  freeLegAngleDeg: number;
  /** Torso tilt from vertical in degrees: 0 = upright, 90 = horizontal (camel) */
  torsoLeanDeg: number;
}

export interface InertiaBreakdown {
  trunk: number;
  arms: number;
  skatingLeg: number;
  freeLeg: number;
  total: number;
}

export const MASS_FRACTION = {
  trunk: 0.578,
  arm: 0.05,
  leg: 0.161,
} as const;

// Fractions of stature
const ARM_LENGTH = 0.44;
const LEG_LENGTH = 0.53;
const SHOULDER_OFFSET = 0.11;
const HIP_OFFSET = 0.06;
const TRUNK_K_UPRIGHT = 0.085;
const TRUNK_K_HORIZONTAL = 0.18;
const ARM_K_TUCKED = 0.09;
const LIMB_THICKNESS_K = 0.03;
const SKATING_LEG_K = 0.035;

const deg = (d: number) => (d * Math.PI) / 180;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Radius of gyration of an arm extended horizontally from the shoulder: rod from s to s+L. */
function armKMax(heightM: number) {
  const s = SHOULDER_OFFSET * heightM;
  const L = ARM_LENGTH * heightM;
  return Math.sqrt(s * s + s * L + (L * L) / 3);
}

export function momentOfInertia(body: Body, posture: Posture): InertiaBreakdown {
  const { massKg: m, heightM: H } = body;
  const a = clamp01(posture.armExtension);
  const lean = deg(posture.torsoLeanDeg);
  const phi = deg(posture.freeLegAngleDeg);

  // A tilted rigid rod: I_vertical = I_long·cos²θ + I_perp·sin²θ
  const kUp = TRUNK_K_UPRIGHT * H;
  const kFlat = TRUNK_K_HORIZONTAL * H;
  const trunk =
    MASS_FRACTION.trunk * m * (kUp * kUp * Math.cos(lean) ** 2 + kFlat * kFlat * Math.sin(lean) ** 2);

  const kArm = ARM_K_TUCKED * H + a * (armKMax(H) - ARM_K_TUCKED * H);
  const arms = 2 * MASS_FRACTION.arm * m * kArm * kArm;

  const skatingLeg = MASS_FRACTION.leg * m * (SKATING_LEG_K * H) ** 2;

  // Rod hinged at the hip (offset h from the axis), swung out by φ:
  // I = m(h² + h·L·sinφ + L²·sin²φ/3) + m·k₀²
  const h = HIP_OFFSET * H;
  const L = LEG_LENGTH * H;
  const sinPhi = Math.sin(phi);
  const freeLeg =
    MASS_FRACTION.leg * m * (h * h + h * L * sinPhi + (L * L * sinPhi * sinPhi) / 3 + (LIMB_THICKNESS_K * H) ** 2);

  return { trunk, arms, skatingLeg, freeLeg, total: trunk + arms + skatingLeg + freeLeg };
}

/**
 * Aerodynamic drag coefficient c (N·m·s²) so that drag torque = c·ω².
 * For a limb of width w spanning radii r₁..r₂: τ = ½ρC_d·w·ω²·(r₂⁴ − r₁⁴)/4.
 */
export function dragTorqueCoefficient(body: Body, posture: Posture, airDensity = 1.25, dragCoefficient = 1.0): number {
  const H = body.heightM;
  const k = 0.5 * airDensity * dragCoefficient;
  const band = (width: number, r1: number, r2: number) => (width * (r2 ** 4 - r1 ** 4)) / 4;

  const s = SHOULDER_OFFSET * H;
  const armReach = clamp01(posture.armExtension) * ARM_LENGTH * H;
  const arms = 2 * band(0.08, s, s + armReach);

  const h = HIP_OFFSET * H;
  const legReach = LEG_LENGTH * H * Math.sin(deg(posture.freeLegAngleDeg));
  const leg = band(0.12, h, h + legReach);

  const torsoReach = 0.47 * H * Math.sin(deg(posture.torsoLeanDeg));
  const torso = band(0.3, 0, torsoReach);

  return k * (arms + leg + torso);
}

export const POSTURES = {
  armsOut: { armExtension: 1, freeLegAngleDeg: 0, torsoLeanDeg: 0 },
  takeoff: { armExtension: 0.5, freeLegAngleDeg: 30, torsoLeanDeg: 0 },
  airTight: { armExtension: 0, freeLegAngleDeg: 0, torsoLeanDeg: 0 },
  landing: { armExtension: 1, freeLegAngleDeg: 60, torsoLeanDeg: 0 },
  uprightEntry: { armExtension: 0.8, freeLegAngleDeg: 30, torsoLeanDeg: 0 },
  scratch: { armExtension: 0, freeLegAngleDeg: 0, torsoLeanDeg: 0 },
  sit: { armExtension: 0.6, freeLegAngleDeg: 90, torsoLeanDeg: 45 },
  camel: { armExtension: 0.8, freeLegAngleDeg: 90, torsoLeanDeg: 90 },
} satisfies Record<string, Posture>;

export type PostureName = keyof typeof POSTURES;
