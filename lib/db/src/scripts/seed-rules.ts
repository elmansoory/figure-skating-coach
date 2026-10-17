import { db, pool, rulesTable, type InsertRule } from "../index";

const SINGLE_PAIR_RULES = "ISU Special Regulations & Technical Rules – Single & Pair Skating";
const SCALE_OF_VALUES = "ISU Communication – Scale of Values and GOE guidelines";
const TECH_HANDBOOK = "ISU Technical Panel Handbook – Single Skating";

// Reference summaries for coaches. Always check the current season's ISU
// communications for exact values before a competition.
const RULES: InsertRule[] = [
  // general
  {
    category: "general",
    title: "How a segment is scored",
    description:
      "Total Segment Score = Technical Element Score (TES) + Program Component Score (PCS) − Deductions. The competition result is the sum of the Short Program and Free Skating segment scores.",
    details:
      "TES: base value of each element plus its GOE, as identified by the technical panel.\nPCS: the judges' component marks multiplied by the segment factor.\nDeductions: falls, time, costume/prop and other violations applied by the referee and technical panel.",
    isuReference: SINGLE_PAIR_RULES,
  },
  {
    category: "general",
    title: "Officials: technical panel and judges",
    description:
      "Elements and their levels are identified by the technical panel (Technical Controller, Technical Specialist and Assistant Technical Specialist). A panel of up to nine judges awards GOE and component marks, supervised by the referee.",
    details:
      "The technical panel calls jump rotations, edges and spin/step levels, which fixes the base value.\nThe judges only evaluate quality (GOE) and components (PCS).",
    isuReference: SINGLE_PAIR_RULES,
  },
  {
    category: "general",
    title: "Program durations (senior singles)",
    description:
      "Short Program: 2 min 40 s ± 10 s. Free Skating: 4 min ± 10 s. Timing starts with the first movement and ends at the complete stop.",
    details: "Junior and novice programs have shorter durations – check the category's rules.",
    isuReference: SINGLE_PAIR_RULES,
  },
  {
    category: "general",
    title: "Senior age eligibility",
    description:
      "From the 2024/25 season a skater must have reached 17 years of age before 1 July preceding the competition to enter senior international events.",
    details: "The minimum age was raised in steps: 15 (2022/23), 16 (2023/24), 17 (2024/25 onwards).",
    isuReference: "ISU General Regulations – age eligibility",
  },

  // jumps
  {
    category: "jumps",
    title: "Jump types and codes",
    description:
      "There are six recognised jump types: Toe loop (T), Salchow (S), Loop (Lo), Flip (F), Lutz (Lz) and Axel (A). The number of revolutions prefixes the code, e.g. 3Lz, 4T, 2A.",
    details:
      "Toe jumps (T, F, Lz) are assisted by the toe pick; edge jumps (S, Lo, A) take off from an edge.\nThe Axel is the only jump taking off forwards, so it has an extra half revolution.",
    isuReference: SCALE_OF_VALUES,
  },
  {
    category: "jumps",
    title: "Rotation calls: q, < and <<",
    description:
      "The technical panel checks the rotation on landing. Missing rotation reduces the GOE and, beyond a quarter, the base value.",
    details:
      "q (quarter) – landed exactly a quarter short: full base value, GOE reduced.\n< (under-rotated) – more than a quarter but less than half short: reduced base value.\n<< (downgraded) – half a revolution or more short: valued as the jump with one revolution less.",
    isuReference: TECH_HANDBOOK,
  },
  {
    category: "jumps",
    title: "Edge calls on Flip and Lutz: ! and e",
    description:
      "Flip should take off from a back inside edge, Lutz from a back outside edge. Take-off edge errors are marked by the technical panel.",
    details:
      "! (unclear edge) – base value unchanged, GOE must be reduced.\ne (wrong edge) – base value reduced and GOE must be reduced.",
    isuReference: TECH_HANDBOOK,
  },
  {
    category: "jumps",
    title: "Jump combinations and repetitions (Free Skating)",
    description:
      "Senior Free Skating allows a maximum of seven jump elements, one of which must be an Axel-type jump. Up to three may be combinations or sequences, and only one combination may contain three jumps.",
    details:
      "Only two triple or quadruple jumps may be repeated, and each only once; at least one of the repetitions must be in a combination or sequence.\nAn extra or non-permitted repetition receives no value.",
    isuReference: SINGLE_PAIR_RULES,
  },
  {
    category: "jumps",
    title: "Second-half bonus",
    description:
      "Jumps performed in the second half of a program earn a 10% bonus on their base value: the last jump element in the Short Program and the last three jump elements in the Free Skating.",
    isuReference: SINGLE_PAIR_RULES,
  },

  // spins
  {
    category: "spins",
    title: "Spin codes",
    description:
      "Spins are coded by position and type: U (upright), L (layback), C (camel), S (sit); Co = combination, F = flying entry, C prefix = change of foot. Example: FCSp4, CCoSp3, LSp4.",
    isuReference: SCALE_OF_VALUES,
  },
  {
    category: "spins",
    title: "Spin levels",
    description:
      "Spins receive a level from B (basic) to 4. The level is set by the number of features achieved: one feature for Level 1, two for Level 2, three for Level 3 and four for Level 4.",
    details:
      "Typical features: difficult variations of position, change of foot by jump, difficult entry or exit, clear change of edge, both directions, at least 8 revolutions in one position without changing position or variation.\nA position counts only when held for at least 2 revolutions.",
    isuReference: TECH_HANDBOOK,
  },

  // steps
  {
    category: "steps",
    title: "Step Sequence levels",
    description:
      "The Step Sequence (StSq) receives a level from B to 4 based on the variety and difficulty of turns and steps, rotations in both directions, use of body movements and difficult turn combinations.",
    details:
      "Difficult turns: twizzles, brackets, loops, counters, rockers and three turns, executed on clean edges.\nThe sequence should cover the full ice surface.",
    isuReference: TECH_HANDBOOK,
  },
  {
    category: "steps",
    title: "Choreographic Sequence",
    description:
      "The Choreographic Sequence (ChSq1) in Free Skating has a fixed base value and no level; it is evaluated only by GOE on its creativity, musicality and use of the ice.",
    isuReference: SCALE_OF_VALUES,
  },

  // goe
  {
    category: "goe",
    title: "Grade of Execution scale",
    description:
      "Each judge grades every element from −5 to +5. Each GOE step is worth 10% of the element's base value. The highest and lowest marks are dropped and the rest are averaged (trimmed mean).",
    details: "A fall on an element always results in a GOE of −5.",
    isuReference: SCALE_OF_VALUES,
  },
  {
    category: "goe",
    title: "Positive GOE criteria for jumps",
    description:
      "Positive GOE is built from criteria such as very good height and distance, good take-off and landing, effortless flow from entry to exit, steps or unexpected entry, body position variations, and matching the music.",
    details: "For +4 and +5 the first three criteria in the guidelines must be clearly present.",
    isuReference: SCALE_OF_VALUES,
  },

  // pcs
  {
    category: "pcs",
    title: "Program Components",
    description:
      "Since 2022/23 there are three program components: Composition, Presentation and Skating Skills. Each is marked from 0.25 to 10.00 in steps of 0.25.",
    details:
      "Composition: intentional, developed arrangement of all movements according to the music.\nPresentation: involvement through intent, energy and execution; musical sensitivity.\nSkating Skills: edges, steps, turns, flow, speed and control.",
    isuReference: SINGLE_PAIR_RULES,
  },
  {
    category: "pcs",
    title: "Component factors",
    description:
      "Component marks are multiplied by a factor that depends on the segment so that PCS is balanced against TES. For senior singles the factor is 1.67 in the Short Program and 3.33 in the Free Skating.",
    isuReference: SINGLE_PAIR_RULES,
  },

  // penalties
  {
    category: "penalties",
    title: "Fall deductions (singles)",
    description:
      "Each fall is deducted from the segment score: −1 for the first and second falls, −2 for the third and fourth, −3 for the fifth and following.",
    details: "A fall is in addition to the −5 GOE on the element where it happened.",
    isuReference: SINGLE_PAIR_RULES,
  },
  {
    category: "penalties",
    title: "Time and other violations",
    description:
      "−1 for every 5 seconds lacking or in excess of the required program time. Costume or prop violations, illegal elements and interruptions also carry deductions applied by the referee.",
    isuReference: SINGLE_PAIR_RULES,
  },
];

async function main() {
  const existing = await db.select({ title: rulesTable.title }).from(rulesTable);
  const existingTitles = new Set(existing.map((r) => r.title));
  const missing = RULES.filter((r) => !existingTitles.has(r.title));

  if (missing.length > 0) {
    await db.insert(rulesTable).values(missing);
  }
  console.log(`Inserted ${missing.length} rules (${existingTitles.size} already present)`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
