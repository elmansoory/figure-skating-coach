# Physics Lab model

Code: `lib/skating-physics` (tests: `pnpm --filter @workspace/skating-physics test`).
The model is meant for teaching and what-if analysis. Its outputs are estimates, not measurements.

## Body model — moment of inertia

`I = Σ mᵢ kᵢ²` about the vertical spin axis.

| Segment | Mass fraction | Model |
|---|---|---|
| Head + trunk | 57.8% | Rod tilted by the torso lean θ: `k² = k_up² cos²θ + k_flat² sin²θ` (k_up = 0.085 H, k_flat = 0.18 H) |
| Each arm | 5.0% | Radius of gyration interpolated from 0.09 H (wrapped) to a horizontal rod from the shoulder: `k² = s² + sL + L²/3` (s = 0.11 H, L = 0.44 H) |
| Skating leg | 16.1% | On the axis, k = 0.035 H |
| Free leg | 16.1% | Rod hinged at the hip (h = 0.06 H) swung out by φ: `I = m(h² + hL sinφ + L² sin²φ/3) + m k₀²` (L = 0.53 H) |

Mass fractions follow Dempster as tabulated by Winter (*Biomechanics and Motor Control of Human Movement*).
For a 55 kg, 1.65 m skater this gives ≈ 0.9 kg·m² tight and ≈ 2.6 kg·m² with the arms out, with spin
speed-ups of about 3–3.5×, in line with typical values.

## Jumps

- Flight time `t = (v_z + √(v_z² + 2gΔ))/g` (Δ = landing drop; 0 in the UI → `t = 2v_z/g`)
- Height `h = v_z²/2g`, distance `d = v_h t`
- In the air, gravity acts through the centre of mass, so there's no torque and `L = I(t)·ω(t)` is constant.
- The posture blends from take-off → air → landing (smoothstep over the pull-in and open-out times).
  The rotation `θ = θ_ice + ∫ L/I(t) dt` is integrated numerically (midpoint rule, 0.5 ms).
- Rotation call from the shortfall `s = required − θ`: `s < ¼` none, `¼ ≤ s < 0.3` q, `< ½` <, `≥ ½` <<.
  An Axel needs an extra ½ revolution.
- Because air revolutions are linear in L, the take-off spin needed for a full rotation is
  `ω₀ · (required − θ_ice) / θ_air`.
- Mass and height scale every inertia equally, so for a given ω₀ they don't change the rotation, only the
  angular momentum the take-off must produce.

## Spins

- `dL/dt = −τ_f − c ω²`, with blade friction `τ_f = μ m g r_c` and limb air drag
  `c = ½ρC_d Σ w (r₂⁴ − r₁⁴)/4` (arms 8 cm wide, leg 12 cm, torso 30 cm, C_d = 1, ρ = 1.25 kg/m³).
- Lossless speed-up is `I_entry / I_final`. The muscle work to pull in is `L²/2 · (1/I_f − 1/I_e)`.

## Blade and ice

- Glide: `m dv/dt = −μ m g − ½ ρ C_dA v²`, solved in closed form
  (stopping distance `ln(1 + b v₀²/a)/(2b)`, `a = μg`, `b = ρC_dA/2m`).
- Contact pressure `p = mg/(w·l)`. Pressure melting by Clausius–Clapeyron, `ΔT ≈ −7.4×10⁻⁸ K/Pa · p`,
  is well under 1 °C for realistic contacts, so pressure alone can't explain slipperiness on rink ice.
- Upper bound on the frictional melt film: `h = μ m g / (L_f ρ_w w)`.
- Edge lean on a curve: `tan θ = v²/(gR)`.

## Main simplifications

Rigid segments, no air drag in jumps, the take-off is not modelled (ω₀ and v_z are inputs), one constant
friction coefficient, and no blade-edge mechanics beyond the lean angle.
