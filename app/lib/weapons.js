/**
 * codR weapon catalog — the offline-first source of truth for gameplay.
 *
 * Every weapon is a real coding challenge. The Supabase `weapons` table, when
 * reachable, is merged on top of this catalog (see /api/weapons) so the arena is
 * always playable even with no database at all.
 *
 * Combat maths: opponents have 100 HP, so `damage` is the HP removed by a
 * flawless solve. 2-4 clean solves should win a round.
 */

export const TIERS = {
  basic: { label: 'BASIC', unlock_level: 0, color: 'text-green-400' },
  advanced: { label: 'ADVANCED', unlock_level: 3, color: 'text-yellow-400' },
  specialist: { label: 'SPECIALIST', unlock_level: 6, color: 'text-orange-400' },
  legendary: { label: 'LEGENDARY', unlock_level: 10, color: 'text-red-400' },
};

export const DIFFICULTY_DAMAGE = { easy: 30, medium: 38, hard: 46, expert: 55 };

export const WEAPON_CATALOG = [
  // ─────────────────────────────── BASIC ───────────────────────────────
  {
    id: 'js-pistol',
    name: 'JS_PISTOL',
    description: 'Reliable sidearm. Sums an array of integers. Every combatant starts here.',
    category: 'Primary',
    tier: 'basic',
    difficulty: 'easy',
    damage: 30,
    speed: 92,
    accuracy: 88,
    fireRate: 'RAPID',
    range: 'SHORT',
    ammoType: 'INT32',
    specialty: 'Warm-up',
    unlock_level: 0,
    challenge_type: 'Arrays',
    challenge_code: 'Return the sum of all numbers in the array. An empty array sums to 0.',
    function_name: 'sumArray',
    starter_code: 'function sumArray(nums) {\n  // your code here\n}',
    hints: ['reduce() is your friend', 'Remember the empty-array case'],
    test_cases: [
      { input: [[1, 2, 3]], expected: 6, description: 'Simple positives' },
      { input: [[]], expected: 0, description: 'Empty array' },
      { input: [[-5, 5, 10]], expected: 10, description: 'Mixed signs' },
      { input: [[100]], expected: 100, description: 'Single element' },
    ],
  },
  {
    id: 'string-shiv',
    name: 'STRING_SHIV',
    description: 'Close-quarters blade. Reverses a string character by character.',
    category: 'Secondary',
    tier: 'basic',
    difficulty: 'easy',
    damage: 30,
    speed: 96,
    accuracy: 90,
    fireRate: 'INSTANT',
    range: 'SHORT',
    ammoType: 'UTF8',
    specialty: 'Strings',
    unlock_level: 0,
    challenge_type: 'Strings',
    challenge_code: 'Return the input string reversed.',
    function_name: 'reverseString',
    starter_code: 'function reverseString(str) {\n  // your code here\n}',
    hints: ['split, reverse, join', 'Empty string stays empty'],
    test_cases: [
      { input: ['hello'], expected: 'olleh', description: 'Basic word' },
      { input: [''], expected: '', description: 'Empty string' },
      { input: ['codR'], expected: 'Rdoc', description: 'Mixed case' },
      { input: ['racecar'], expected: 'racecar', description: 'Palindrome' },
    ],
  },
  {
    id: 'fizz-carbine',
    name: 'FIZZ_CARBINE',
    description: 'The classic. Burst-fire FizzBuzz for a given upper bound.',
    category: 'Primary',
    tier: 'basic',
    difficulty: 'easy',
    damage: 32,
    speed: 85,
    accuracy: 86,
    fireRate: 'BURST',
    range: 'MID',
    ammoType: 'MODULO',
    specialty: 'Control flow',
    unlock_level: 0,
    challenge_type: 'Logic',
    challenge_code:
      'Return an array of length n. For each i from 1 to n: "FizzBuzz" if divisible by 15, "Fizz" if by 3, "Buzz" if by 5, otherwise the number itself (as a number, not a string).',
    function_name: 'fizzBuzz',
    starter_code: 'function fizzBuzz(n) {\n  // your code here\n}',
    hints: ['Check 15 before 3 and 5', 'Non-matching entries stay numbers'],
    test_cases: [
      { input: [5], expected: [1, 2, 'Fizz', 4, 'Buzz'], description: 'First five' },
      { input: [3], expected: [1, 2, 'Fizz'], description: 'Stops at three' },
      { input: [15], expected: [1, 2, 'Fizz', 4, 'Buzz', 'Fizz', 7, 8, 'Fizz', 'Buzz', 11, 'Fizz', 13, 14, 'FizzBuzz'], description: 'Hits FizzBuzz' },
      { input: [0], expected: [], description: 'Zero yields nothing' },
    ],
  },
  {
    id: 'peak-scope',
    name: 'PEAK_SCOPE',
    description: 'Marksman optic. Finds the largest value in a list of numbers.',
    category: 'Secondary',
    tier: 'basic',
    difficulty: 'easy',
    damage: 30,
    speed: 90,
    accuracy: 94,
    fireRate: 'SINGLE',
    range: 'LONG',
    ammoType: 'FLOAT64',
    specialty: 'Scanning',
    unlock_level: 0,
    challenge_type: 'Arrays',
    challenge_code: 'Return the largest number in the array. Return null for an empty array.',
    function_name: 'findMax',
    starter_code: 'function findMax(nums) {\n  // your code here\n}',
    hints: ['Math.max(...nums) — but guard the empty case', 'Negatives must still work'],
    test_cases: [
      { input: [[1, 7, 3]], expected: 7, description: 'Middle max' },
      { input: [[-9, -2, -40]], expected: -2, description: 'All negative' },
      { input: [[]], expected: null, description: 'Empty array' },
      { input: [[5, 5, 5]], expected: 5, description: 'All equal' },
    ],
  },

  // ────────────────────────────── ADVANCED ──────────────────────────────
  {
    id: 'py-railgun',
    name: 'PY_RAILGUN',
    description: 'Charged shot. Locates the two indices whose values hit the target sum.',
    category: 'Primary',
    tier: 'advanced',
    difficulty: 'medium',
    damage: 38,
    speed: 70,
    accuracy: 91,
    fireRate: 'CHARGED',
    range: 'LONG',
    ammoType: 'HASHMAP',
    specialty: 'Hash lookups',
    unlock_level: 3,
    challenge_type: 'Hash maps',
    challenge_code:
      'Given an array of numbers and a target, return the indices of the two numbers that add up to the target, in ascending order. Exactly one solution exists. Return [] if none.',
    function_name: 'twoSum',
    starter_code: 'function twoSum(nums, target) {\n  // your code here\n}',
    hints: ['A Map of value → index gets you O(n)', 'Return indices ascending, e.g. [0, 2]'],
    test_cases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], description: 'Front pair' },
      { input: [[3, 2, 4], 6], expected: [1, 2], description: 'Skips first element' },
      { input: [[3, 3], 6], expected: [0, 1], description: 'Duplicate values' },
      { input: [[1, 2], 99], expected: [], description: 'No solution' },
    ],
  },
  {
    id: 'anagram-blade',
    name: 'ANAGRAM_BLADE',
    description: 'Twin daggers. Decides whether two strings are anagrams of each other.',
    category: 'Secondary',
    tier: 'advanced',
    difficulty: 'medium',
    damage: 36,
    speed: 78,
    accuracy: 89,
    fireRate: 'DUAL',
    range: 'MID',
    ammoType: 'CHARMAP',
    specialty: 'Frequency counts',
    unlock_level: 3,
    challenge_type: 'Strings',
    challenge_code: 'Return true if the two strings are anagrams of each other, false otherwise. Comparison is case-sensitive.',
    function_name: 'isAnagram',
    starter_code: 'function isAnagram(a, b) {\n  // your code here\n}',
    hints: ['Sort both, or count characters', 'Different lengths can never match'],
    test_cases: [
      { input: ['listen', 'silent'], expected: true, description: 'Classic anagram' },
      { input: ['hello', 'world'], expected: false, description: 'Not an anagram' },
      { input: ['', ''], expected: true, description: 'Both empty' },
      { input: ['aab', 'abb'], expected: false, description: 'Same letters, wrong counts' },
    ],
  },
  {
    id: 'rle-shotgun',
    name: 'RLE_SHOTGUN',
    description: 'Spread compressor. Run-length encodes a string into char+count pairs.',
    category: 'Primary',
    tier: 'advanced',
    difficulty: 'medium',
    damage: 40,
    speed: 66,
    accuracy: 84,
    fireRate: 'PUMP',
    range: 'SHORT',
    ammoType: 'BYTES',
    specialty: 'Compression',
    unlock_level: 3,
    challenge_type: 'Strings',
    challenge_code:
      'Run-length encode the string: each run of identical characters becomes the character followed by its count. "aaabb" → "a3b2". Empty input returns "".',
    function_name: 'runLengthEncode',
    starter_code: 'function runLengthEncode(str) {\n  // your code here\n}',
    hints: ['Track the current char and a counter', 'Single characters still get a count of 1'],
    test_cases: [
      { input: ['aaabb'], expected: 'a3b2', description: 'Two runs' },
      { input: ['abc'], expected: 'a1b1c1', description: 'No repeats' },
      { input: [''], expected: '', description: 'Empty input' },
      { input: ['wwwwwww'], expected: 'w7', description: 'Single long run' },
    ],
  },
  {
    id: 'palindrome-pike',
    name: 'PALINDROME_PIKE',
    description: 'Reach weapon. Detects palindromes, ignoring case and punctuation.',
    category: 'Secondary',
    tier: 'advanced',
    difficulty: 'medium',
    damage: 36,
    speed: 74,
    accuracy: 87,
    fireRate: 'THRUST',
    range: 'MID',
    ammoType: 'REGEX',
    specialty: 'Two pointers',
    unlock_level: 3,
    challenge_type: 'Strings',
    challenge_code:
      'Return true if the string is a palindrome once you ignore case and every non-alphanumeric character.',
    function_name: 'isPalindrome',
    starter_code: 'function isPalindrome(str) {\n  // your code here\n}',
    hints: ['Strip with /[^a-z0-9]/g after lowercasing', 'An empty result counts as a palindrome'],
    test_cases: [
      { input: ['A man, a plan, a canal: Panama'], expected: true, description: 'Classic phrase' },
      { input: ['race a car'], expected: false, description: 'Not a palindrome' },
      { input: [' '], expected: true, description: 'Only punctuation' },
      { input: ['0P'], expected: false, description: 'Digit vs letter' },
    ],
  },

  // ───────────────────────────── SPECIALIST ─────────────────────────────
  {
    id: 'rust-sniper',
    name: 'RUST_SNIPER',
    description: 'Long-range precision. Longest substring with no repeating characters.',
    category: 'Primary',
    tier: 'specialist',
    difficulty: 'hard',
    damage: 46,
    speed: 52,
    accuracy: 96,
    fireRate: 'BOLT',
    range: 'VERY_LONG',
    ammoType: 'WINDOW',
    specialty: 'Sliding window',
    unlock_level: 6,
    challenge_type: 'Sliding window',
    challenge_code:
      'Return the length of the longest substring that contains no repeated characters.',
    function_name: 'lengthOfLongestSubstring',
    starter_code: 'function lengthOfLongestSubstring(str) {\n  // your code here\n}',
    hints: ['Slide a window and remember the last index of each char', 'Never move the left edge backwards'],
    test_cases: [
      { input: ['abcabcbb'], expected: 3, description: 'Repeating pattern' },
      { input: ['bbbbb'], expected: 1, description: 'All identical' },
      { input: ['pwwkew'], expected: 3, description: 'Window must slide' },
      { input: [''], expected: 0, description: 'Empty string' },
      { input: ['dvdf'], expected: 3, description: 'Classic edge case' },
    ],
  },
  {
    id: 'binary-lance',
    name: 'BINARY_LANCE',
    description: 'Halves the battlefield each strike. Binary search over a sorted array.',
    category: 'Secondary',
    tier: 'specialist',
    difficulty: 'hard',
    damage: 44,
    speed: 88,
    accuracy: 98,
    fireRate: 'PIERCE',
    range: 'LONG',
    ammoType: 'LOG_N',
    specialty: 'Divide & conquer',
    unlock_level: 6,
    challenge_type: 'Searching',
    challenge_code:
      'The array is sorted ascending. Return the index of target using binary search, or -1 if it is absent.',
    function_name: 'binarySearch',
    starter_code: 'function binarySearch(nums, target) {\n  // your code here\n}',
    hints: ['mid = (lo + hi) >> 1', 'Loop while lo <= hi'],
    test_cases: [
      { input: [[1, 3, 5, 7, 9], 7], expected: 3, description: 'Present, right half' },
      { input: [[1, 3, 5, 7, 9], 1], expected: 0, description: 'First element' },
      { input: [[1, 3, 5], 4], expected: -1, description: 'Absent' },
      { input: [[], 1], expected: -1, description: 'Empty array' },
    ],
  },
  {
    id: 'paren-guard',
    name: 'PAREN_GUARD',
    description: 'Defensive turret. Validates balanced brackets in any expression.',
    category: 'Special',
    tier: 'specialist',
    difficulty: 'hard',
    damage: 44,
    speed: 64,
    accuracy: 93,
    fireRate: 'AUTO',
    range: 'MID',
    ammoType: 'STACK',
    specialty: 'Stacks',
    unlock_level: 6,
    challenge_type: 'Stacks',
    challenge_code:
      'Return true when every bracket in the string — (), [] and {} — is closed in the correct order.',
    function_name: 'isBalanced',
    starter_code: 'function isBalanced(str) {\n  // your code here\n}',
    hints: ['Push openers, pop and compare on closers', 'The stack must be empty at the end'],
    test_cases: [
      { input: ['()[]{}'], expected: true, description: 'All pairs' },
      { input: ['(]'], expected: false, description: 'Mismatched pair' },
      { input: ['{[()]}'], expected: true, description: 'Nested' },
      { input: ['('], expected: false, description: 'Never closed' },
      { input: [''], expected: true, description: 'Empty string' },
    ],
  },
  {
    id: 'spiral-mortar',
    name: 'SPIRAL_MORTAR',
    description: 'Area denial. Walks a matrix in spiral order and flattens it.',
    category: 'Primary',
    tier: 'specialist',
    difficulty: 'hard',
    damage: 48,
    speed: 46,
    accuracy: 82,
    fireRate: 'ARC',
    range: 'INFINITE',
    ammoType: 'MATRIX',
    specialty: 'Matrices',
    unlock_level: 6,
    challenge_type: 'Matrices',
    challenge_code:
      'Return all elements of the matrix in spiral order, starting top-left and moving clockwise.',
    function_name: 'spiralOrder',
    starter_code: 'function spiralOrder(matrix) {\n  // your code here\n}',
    hints: ['Track top/bottom/left/right boundaries', 'Re-check boundaries before the reverse passes'],
    test_cases: [
      { input: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], expected: [1, 2, 3, 6, 9, 8, 7, 4, 5], description: '3x3 matrix' },
      { input: [[[1, 2], [3, 4]]], expected: [1, 2, 4, 3], description: '2x2 matrix' },
      { input: [[[7]]], expected: [7], description: 'Single cell' },
      { input: [[]], expected: [], description: 'Empty matrix' },
    ],
  },

  // ───────────────────────────── LEGENDARY ─────────────────────────────
  {
    id: 'asm-cannon',
    name: 'ASM_CANNON',
    description: 'Siege-grade. Computes Levenshtein edit distance between two strings.',
    category: 'Special',
    tier: 'legendary',
    difficulty: 'expert',
    damage: 55,
    speed: 28,
    accuracy: 99,
    fireRate: 'SIEGE',
    range: 'GLOBAL',
    ammoType: 'DP_TABLE',
    specialty: 'Dynamic programming',
    unlock_level: 10,
    challenge_type: 'Dynamic programming',
    challenge_code:
      'Return the minimum number of single-character insertions, deletions or substitutions needed to turn word A into word B.',
    function_name: 'editDistance',
    starter_code: 'function editDistance(a, b) {\n  // your code here\n}',
    hints: ['Build an (a.length+1) x (b.length+1) DP grid', 'Seed row 0 and column 0 with their indices'],
    test_cases: [
      { input: ['horse', 'ros'], expected: 3, description: 'Classic case' },
      { input: ['intention', 'execution'], expected: 5, description: 'Longer words' },
      { input: ['', 'abc'], expected: 3, description: 'Empty source' },
      { input: ['same', 'same'], expected: 0, description: 'Identical' },
    ],
  },
  {
    id: 'quantum-nuke',
    name: 'QUANTUM_NUKE',
    description: 'Arena-clearing ordnance. Fewest coins that make up the target amount.',
    category: 'Special',
    tier: 'legendary',
    difficulty: 'expert',
    damage: 55,
    speed: 22,
    accuracy: 97,
    fireRate: 'ONE_SHOT',
    range: 'GLOBAL',
    ammoType: 'ANTIMATTER',
    specialty: 'Optimisation',
    unlock_level: 10,
    challenge_type: 'Dynamic programming',
    challenge_code:
      'Given coin denominations and an amount, return the fewest coins needed to make that amount, or -1 if it is impossible. You have unlimited coins of each denomination.',
    function_name: 'coinChange',
    starter_code: 'function coinChange(coins, amount) {\n  // your code here\n}',
    hints: ['dp[i] = min coins for amount i', 'Seed dp[0] = 0 and fill upward'],
    test_cases: [
      { input: [[1, 2, 5], 11], expected: 3, description: '5 + 5 + 1' },
      { input: [[2], 3], expected: -1, description: 'Impossible' },
      { input: [[1], 0], expected: 0, description: 'Zero amount' },
      { input: [[1, 3, 4], 6], expected: 2, description: 'Greedy would fail' },
    ],
  },
];

/** Fast id lookup. */
export const WEAPONS_BY_ID = WEAPON_CATALOG.reduce((acc, w) => {
  acc[w.id] = w;
  return acc;
}, {});

export function getWeaponById(id) {
  return WEAPONS_BY_ID[id] || null;
}

/** Weapons playable at a given level, newest tiers last. */
export function weaponsForLevel(level = 0) {
  return WEAPON_CATALOG.filter((w) => w.unlock_level <= level);
}

/** XP → level. 100 XP per level, capped at 30. */
export function levelFromXp(xp = 0) {
  return Math.min(30, Math.floor(Math.max(0, xp) / 100));
}

export function xpProgress(xp = 0) {
  const level = levelFromXp(xp);
  const into = Math.max(0, xp) - level * 100;
  return { level, into, needed: 100, percent: Math.min(100, Math.round(into)) };
}
