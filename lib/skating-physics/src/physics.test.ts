import { test } from "node:test";
import assert from "node:assert/strict";
import {
  POSTURES,
  edgeLeanAngleDeg,
  flightTime,
  frictionalMeltFilm,
  momentOfInertia,
  pressureMelting,
  rotationCall,
  simulateGlide,
  simulateJump,
  simulateSpin,
  type JumpParams,
} from "./index";

const body = { massKg: 55, heightM: 1.65 };
const close = (actual: number, expected: number, tol: number, msg?: string) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ""} expected ${expected} ± ${tol}, got ${actual}`);

const baseJump: JumpParams = {
  body,
  revolutions: 4,
  type: "T",
  verticalVelocity: 3.25,
  horizontalVelocity: 4,
  takeoffOmega: 2.5,
  takeoffPosture: POSTURES.takeoff,
  airPosture: POSTURES.airTight,
  landingPosture: POSTURES.landing,
  pullInTime: 0.12,
  openOutTime: 0.1,
  preRotation: 0.25,
};

test("inertia grows with arm extension and stays in a realistic range", () => {
  const tight = momentOfInertia(body, POSTURES.airTight).total;
  const out = momentOfInertia(body, POSTURES.armsOut).total;
  assert.ok(tight > 0.7 && tight < 1.2, `tight I = ${tight}`);
  assert.ok(out / tight > 2.5 && out / tight < 4, `ratio = ${out / tight}`);
  const breakdown = momentOfInertia(body, POSTURES.camel);
  close(breakdown.total, breakdown.trunk + breakdown.arms + breakdown.skatingLeg + breakdown.freeLeg, 1e-12);
});

test("inertia scales with mass and with height squared", () => {
  const i1 = momentOfInertia(body, POSTURES.armsOut).total;
  close(momentOfInertia({ ...body, massKg: 110 }, POSTURES.armsOut).total, 2 * i1, 1e-9);
  close(momentOfInertia({ ...body, heightM: 3.3 }, POSTURES.armsOut).total, 4 * i1, 1e-9);
});

test("flight time follows projectile motion", () => {
  close(flightTime(3, 9.81), 0.6116, 1e-4);
  // Landing lower than take-off lengthens the flight
  assert.ok(flightTime(3, 9.81, 0.05) > flightTime(3, 9.81));
  const r = simulateJump(baseJump);
  close(r.peakHeight, 3.25 ** 2 / (2 * 9.81), 1e-9);
  close(r.samples.at(-1)!.heightM, 0, 1e-6, "lands at take-off height");
});

test("angular momentum is conserved in the air", () => {
  const r = simulateJump(baseJump);
  for (const s of r.samples) close(s.inertia * s.omegaRevPerSec * 2 * Math.PI, r.angularMomentum, 1e-9);
  close(r.maxOmegaRevPerSec, (r.inertiaTakeoff / r.inertiaAir) * baseJump.takeoffOmega, 1e-6);
});

test("with no change of position, revolutions = ω·t", () => {
  const r = simulateJump({
    ...baseJump,
    takeoffPosture: POSTURES.airTight,
    landingPosture: POSTURES.airTight,
    preRotation: 0,
  });
  close(r.airRevolutions, baseJump.takeoffOmega * r.flightTime, 1e-6);
});

test("default quad toe loop is fully rotated; less take-off spin gets a call", () => {
  assert.equal(simulateJump(baseJump).call, "clean");
  assert.notEqual(simulateJump({ ...baseJump, takeoffOmega: 2.1 }).call, "clean");
});

test("required take-off spin lands the jump exactly", () => {
  const r = simulateJump({ ...baseJump, takeoffOmega: 2.0 });
  const fixed = simulateJump({ ...baseJump, takeoffOmega: r.requiredTakeoffOmega });
  close(fixed.totalRevolutions, fixed.required, 1e-3);
});

test("lower gravity gives longer flights and more rotation", () => {
  const earth = simulateJump(baseJump);
  const moon = simulateJump({ ...baseJump, gravity: 1.62 });
  assert.ok(moon.flightTime > 5 * earth.flightTime);
  assert.ok(moon.totalRevolutions > earth.totalRevolutions);
});

test("axel needs an extra half revolution", () => {
  assert.equal(simulateJump({ ...baseJump, type: "A", revolutions: 3 }).required, 3.5);
});

test("rotation calls follow the ISU thresholds", () => {
  assert.equal(rotationCall(0.1), "clean");
  assert.equal(rotationCall(0.26), "q");
  assert.equal(rotationCall(0.4), "<");
  assert.equal(rotationCall(0.5), "<<");
  assert.equal(rotationCall(-0.3), "over");
});

test("frictionless spin conserves L and speeds up by I_entry/I_final", () => {
  const r = simulateSpin({
    body,
    entryPosture: POSTURES.uprightEntry,
    finalPosture: POSTURES.scratch,
    entryOmega: 1.6,
    entryHold: 0.5,
    transitionTime: 0.5,
    duration: 3,
    friction: 0,
    contactRadius: 0,
    airDrag: false,
  });
  for (const s of r.samples) close(s.angularMomentum, r.samples[0].angularMomentum, 1e-9);
  close(r.samples.at(-1)!.omegaRevPerSec / 1.6, r.idealSpeedUp, 1e-6);
  // Pulling in raises rotational kinetic energy by exactly the muscle work
  close(r.samples.at(-1)!.kineticEnergy - r.samples[0].kineticEnergy, r.pullInWork, 1e-6);
});

test("friction alone slows a spin linearly in L", () => {
  const r = simulateSpin({
    body,
    entryPosture: POSTURES.scratch,
    finalPosture: POSTURES.scratch,
    entryOmega: 5,
    entryHold: 100,
    transitionTime: 1,
    duration: 2,
    friction: 0.01,
    contactRadius: 0.02,
    airDrag: false,
  });
  const lost = r.samples[0].angularMomentum - r.samples.at(-1)!.angularMomentum;
  close(lost, r.frictionTorque * 2, 1e-3);
});

test("glide: closed form agrees with friction-only limit and stops", () => {
  const noDrag = simulateGlide({ massKg: 55, initialSpeed: 6, friction: 0.005, dragArea: 0 });
  close(noDrag.stopDistance, 36 / (2 * 0.005 * 9.81), 1e-6);
  const withDrag = simulateGlide({ massKg: 55, initialSpeed: 6, friction: 0.005, dragArea: 0.35 });
  assert.ok(withDrag.stopDistance < noDrag.stopDistance);
  close(withDrag.samples.at(-1)!.speed, 0, 1e-6);
  close(withDrag.samples.at(-1)!.distance, withDrag.stopDistance, 1e-6);
});

test("pressure alone cannot melt typical rink ice", () => {
  const r = pressureMelting({ massKg: 55, contactWidth: 0.004, contactLength: 0.03, iceTemperatureC: -5 });
  close(r.pressurePa, (55 * 9.81) / 0.00012, 1e-6);
  assert.ok(r.meltingPointC > -1 && r.meltingPointC < 0);
  assert.equal(r.meltsByPressureAlone, false);
});

test("melt film and edge lean", () => {
  close(frictionalMeltFilm(55, 0.005, 0.004).filmThicknessM, (0.005 * 55 * 9.81) / 334_000 / 1000 / 0.004, 1e-15);
  close(edgeLeanAngleDeg(5, 2.548), 45, 0.01);
});
