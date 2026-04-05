import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import vm from 'vm';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BASE_DAMAGE = 100;
const CODE_TIMEOUT = 3000;

export async function POST(request) {
  try {
    const body = await request.json();
    const { weaponId, userCode } = body;

    if (!weaponId) {
      return NextResponse.json({ error: 'weaponId is required' }, { status: 400 });
    }

    if (!userCode || typeof userCode !== 'string' || !userCode.trim()) {
      return NextResponse.json({ error: 'userCode is required and must be a non-empty string' }, { status: 400 });
    }

    console.log(`[Judge] Processing weapon: ${weaponId}`);

    // Fetch weapon from Supabase
    const { data: weapon, error: weaponError } = await supabase
      .from('weapons')
      .select('*')
      .eq('id', weaponId)
      .single();

    if (weaponError || !weapon) {
      console.error('[Judge] Weapon fetch error:', weaponError);
      return NextResponse.json(
        { error: 'Weapon not found', details: weaponError?.message },
        { status: 404 }
      );
    }

    if (!weapon.test_cases || !Array.isArray(weapon.test_cases)) {
      return NextResponse.json(
        { error: 'Weapon has no test cases configured' },
        { status: 400 }
      );
    }

    // CRITICAL FIX: Use the function_name from the weapon record instead of hardcoding 'add'
    const functionName = weapon.function_name || 'solve';
    console.log(`[Judge] Weapon: ${weapon.name}, function: ${functionName}, ${weapon.test_cases.length} tests`);

    const testResults = [];
    let passedTests = 0;

    for (let i = 0; i < weapon.test_cases.length; i++) {
      const testCase = weapon.test_cases[i];

      try {
        let testPassed = false;
        let actualResult = null;
        let errorMessage = null;

        try {
          const sandbox = {
            testInput: testCase.input,
            expectedOutput: testCase.expected,
            result: null,
            passed: false,
            error: null,
            JSON: JSON,
            Array: Array,
            Object: Object,
            Math: Math,
            String: String,
            Number: Number,
            Boolean: Boolean,
            parseInt: parseInt,
            parseFloat: parseFloat,
            isNaN: isNaN,
            RegExp: RegExp,
            console: { log: () => {}, error: () => {}, warn: () => {} },
          };

          // DYNAMIC function call based on weapon's function_name
          const codeToExecute = `
${userCode}

// Test execution — dynamically calls the correct function
try {
  const fn = typeof ${functionName} === 'function' ? ${functionName} : null;
  if (!fn) {
    error = 'Function "${functionName}" is not defined. Make sure you named your function correctly.';
    passed = false;
  } else {
    const userResult = fn(...testInput);
    passed = JSON.stringify(userResult) === JSON.stringify(expectedOutput);
    result = userResult;
  }
} catch (err) {
  error = err.message;
  passed = false;
}
`;

          const context = vm.createContext(sandbox);
          vm.runInContext(codeToExecute, context, {
            timeout: CODE_TIMEOUT,
            displayErrors: true,
          });

          testPassed = sandbox.passed;
          actualResult = sandbox.result;
          if (sandbox.error) {
            errorMessage = sandbox.error;
          }

        } catch (vmError) {
          if (vmError.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
            errorMessage = 'Execution timed out (3 second limit)';
          } else if (vmError instanceof SyntaxError || vmError.name === 'SyntaxError') {
            errorMessage = `Syntax Error: ${vmError.message}`;
          } else {
            errorMessage = `Runtime Error: ${vmError.message}`;
          }
        }

        if (testPassed) passedTests++;

        testResults.push({
          testNumber: i + 1,
          description: testCase.description || `Test ${i + 1}`,
          input: testCase.input,
          expected: testCase.expected,
          actual: actualResult,
          passed: testPassed,
          error: errorMessage,
        });

      } catch (testError) {
        testResults.push({
          testNumber: i + 1,
          description: testCase.description || `Test ${i + 1}`,
          input: testCase.input,
          expected: testCase.expected,
          actual: null,
          passed: false,
          error: testError.message || 'Unknown execution error',
        });
      }
    }

    const totalTests = weapon.test_cases.length;
    const passPercentage = passedTests / totalTests;
    const damageDealt = Math.round(BASE_DAMAGE * passPercentage);

    console.log(`[Judge] Results: ${passedTests}/${totalTests} passed, ${damageDealt} damage`);

    return NextResponse.json({
      success: true,
      weaponId: weapon.id,
      weaponName: weapon.name,
      weaponDamage: weapon.damage,
      functionName,
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      passPercentage: Math.round(passPercentage * 100),
      damageDealt,
      testResults,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Judge] Critical error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during code execution',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Code Execution Judge',
    version: '4.0',
    status: 'online',
    execution: {
      engine: 'Node.js VM (Sandboxed)',
      language: 'javascript',
      timeout: `${CODE_TIMEOUT}ms`,
      features: ['dynamic function names', 'multiple test cases', 'syntax error detection']
    },
  });
}
