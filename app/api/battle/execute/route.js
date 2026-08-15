import { NextResponse } from 'next/server';
import vm from 'vm';
import { getWeaponById } from '../../../lib/weapons';
import { safeQuery } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CODE_TIMEOUT = 2000;      // per test case
const COMPILE_TIMEOUT = 2000;   // defining the user's functions
const MAX_CODE_LENGTH = 20_000;

/**
 * POST /api/battle/execute — the Judge.
 *
 * User code is compiled once inside a locked-down VM context, then each test
 * case calls the resulting function. Damage scales with the weapon's rating and
 * the fraction of tests passed.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body' }, { status: 400 });
  }

  const { weaponId, userCode } = body || {};

  if (!weaponId) {
    return NextResponse.json({ error: 'weaponId is required' }, { status: 400 });
  }
  if (typeof userCode !== 'string' || !userCode.trim()) {
    return NextResponse.json({ error: 'Write some code before attacking.' }, { status: 400 });
  }
  if (userCode.length > MAX_CODE_LENGTH) {
    return NextResponse.json({ error: 'Solution exceeds the 20,000 character limit.' }, { status: 413 });
  }

  const weapon = await resolveWeapon(weaponId);
  if (!weapon) {
    return NextResponse.json({ error: `Unknown weapon "${weaponId}"` }, { status: 404 });
  }
  if (!Array.isArray(weapon.test_cases) || weapon.test_cases.length === 0) {
    return NextResponse.json({ error: 'This weapon has no test cases configured.' }, { status: 400 });
  }

  const functionName = weapon.function_name || 'solve';
  const started = Date.now();

  // ---- Compile once ---------------------------------------------------------
  let context;
  try {
    context = vm.createContext(createSandbox());
    vm.runInContext(userCode, context, { timeout: COMPILE_TIMEOUT, displayErrors: true });
  } catch (err) {
    return NextResponse.json(
      {
        success: true,
        weaponId: weapon.id,
        weaponName: weapon.name,
        functionName,
        totalTests: weapon.test_cases.length,
        passedTests: 0,
        failedTests: weapon.test_cases.length,
        passPercentage: 0,
        damageDealt: 0,
        perfect: false,
        compileError: formatError(err),
        testResults: [],
        durationMs: Date.now() - started,
      },
      { status: 200 }
    );
  }

  // The named function must exist before we bother running tests.
  let hasFunction = false;
  try {
    hasFunction = vm.runInContext(`typeof ${functionName} === 'function'`, context, { timeout: 500 });
  } catch {
    hasFunction = false;
  }

  if (!hasFunction) {
    return NextResponse.json({
      success: true,
      weaponId: weapon.id,
      weaponName: weapon.name,
      functionName,
      totalTests: weapon.test_cases.length,
      passedTests: 0,
      failedTests: weapon.test_cases.length,
      passPercentage: 0,
      damageDealt: 0,
      perfect: false,
      compileError: `No function named "${functionName}" was defined. Name your function exactly ${functionName}.`,
      testResults: [],
      durationMs: Date.now() - started,
    });
  }

  // ---- Run the tests --------------------------------------------------------
  const testResults = [];
  let passedTests = 0;

  weapon.test_cases.forEach((testCase, i) => {
    const result = runTest(context, functionName, testCase, i);
    if (result.passed) passedTests += 1;
    testResults.push(result);
  });

  const totalTests = weapon.test_cases.length;
  const passRatio = passedTests / totalTests;
  const perfect = passedTests === totalTests;
  const baseDamage = weapon.damage || 30;
  const damageDealt = Math.round(baseDamage * passRatio);

  return NextResponse.json({
    success: true,
    weaponId: weapon.id,
    weaponName: weapon.name,
    weaponDamage: baseDamage,
    functionName,
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    passPercentage: Math.round(passRatio * 100),
    damageDealt,
    perfect,
    compileError: null,
    testResults,
    durationMs: Date.now() - started,
  });
}

function runTest(context, functionName, testCase, index) {
  const base = {
    testNumber: index + 1,
    description: testCase.description || `Test ${index + 1}`,
    input: testCase.input,
    expected: testCase.expected,
  };

  try {
    context.__args = deepClone(testCase.input);
    context.__expected = deepClone(testCase.expected);
    context.__actual = undefined;
    context.__passed = false;
    context.__error = null;

    vm.runInContext(
      `
      try {
        __actual = ${functionName}(...__args);
        __passed = __eq(__actual, __expected);
      } catch (e) {
        __error = e && e.message ? e.message : String(e);
        __passed = false;
      }
      `,
      context,
      { timeout: CODE_TIMEOUT, displayErrors: true }
    );

    return {
      ...base,
      actual: serialise(context.__actual),
      passed: Boolean(context.__passed),
      error: context.__error,
    };
  } catch (err) {
    return {
      ...base,
      actual: null,
      passed: false,
      error: formatError(err),
    };
  }
}

/**
 * A deliberately small global surface: enough to solve algorithm problems,
 * nothing that touches the host (no require, process, fetch, timers or globals).
 */
function createSandbox() {
  const sandbox = {
    // data types
    Array, Object, String, Number, Boolean, Math, JSON, Date,
    Map, Set, WeakMap, WeakSet, Symbol, BigInt, RegExp,
    Promise, Error, TypeError, RangeError,
    // numeric helpers
    parseInt, parseFloat, isNaN, isFinite, NaN, Infinity, undefined,
    // console is captured, never forwarded to the server log
    console: { log: () => {}, error: () => {}, warn: () => {}, info: () => {}, debug: () => {} },
    // harness slots
    __args: [], __expected: undefined, __actual: undefined, __passed: false, __error: null,
  };

  // Deep equality that ignores key order for plain objects.
  sandbox.__eq = function equals(a, b) {
    if (a === b) return true;
    if (typeof a === 'number' && typeof b === 'number') {
      if (Number.isNaN(a) && Number.isNaN(b)) return true;
    }
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) => equals(item, b[i]));
    }
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && equals(a[k], b[k]));
  };

  return sandbox;
}

function deepClone(value) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value ?? null));
  }
}

/** Values crossing back out of the VM must be plain and JSON-safe. */
function serialise(value) {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function formatError(err) {
  if (!err) return 'Unknown error';
  if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
    return `Execution timed out (${CODE_TIMEOUT}ms limit) — check for an infinite loop.`;
  }
  if (err instanceof SyntaxError || err.name === 'SyntaxError') {
    return `Syntax Error: ${err.message}`;
  }
  return `${err.name || 'Error'}: ${err.message || String(err)}`;
}

/** Local catalog first; the database can still supply custom weapons. */
async function resolveWeapon(weaponId) {
  const local = getWeaponById(weaponId);
  if (local) return local;

  const rows = await safeQuery(
    (supabase) => supabase.from('weapons').select('*').eq('id', weaponId).limit(1),
    []
  );
  return rows?.[0] || null;
}

export async function GET() {
  return NextResponse.json({
    service: 'Code Execution Judge',
    version: '5.0',
    status: 'online',
    execution: {
      engine: 'Node.js VM (sandboxed, no host globals)',
      language: 'javascript',
      compileTimeout: `${COMPILE_TIMEOUT}ms`,
      perTestTimeout: `${CODE_TIMEOUT}ms`,
      maxCodeLength: MAX_CODE_LENGTH,
      features: [
        'compile-once execution',
        'order-insensitive deep equality',
        'syntax + runtime error reporting',
        'weapon-scaled damage',
        'works without a database',
      ],
    },
  });
}
