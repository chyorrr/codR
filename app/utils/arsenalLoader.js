"use client";

// Arsenal Loader Utility - Manages all codeR weapon systems
// Uses terminal-based Arch Linux style configuration

export const loadAllArsenals = () => {
  return {
    basic: getBasicArsenal(),
    advanced: getAdvancedArsenal(),
    specialist: getSpecialistArsenal(),
    legendary: getLegendaryArsenal()
  };
};

/**
 * Basic weapons - Available to all players
 * Simple syntax and beginner-friendly
 */
const getBasicArsenal = () => {
  return [
    {
      id: "js-rifle",
      name: "JS_RIFLE",
      description: "Standard issue JavaScript assault rifle with moderate damage and high fire rate",
      damage: 65,
      accuracy: 78,
      range: "MID",
      ammoType: "ES6_ROUNDS",
      fireRate: "RAPID",
      category: "BASIC",
      specialty: "DOM_MANIPULATION",
      terminal: {
        color: "text-yellow-400",
        icon: "Code",
        bootSequence: [
          "$ pacman -S javascript-core",
          "$ systemctl start v8-engine",
          "$ chmod +x jsrifle.js",
          "$ ./jsrifle.js --mode=combat"
        ]
      }
    },
    {
      id: "python-smg",
      name: "PYTHON_SMG",
      description: "Close-range Python submachine gun with quick execution and wide spread",
      damage: 45,
      accuracy: 65,
      range: "SHORT",
      ammoType: "PIP_MODULES",
      fireRate: "VERY_RAPID",
      category: "BASIC",
      specialty: "RAPID_PROTOTYPING",
      terminal: {
        color: "text-blue-400",
        icon: "Terminal",
        bootSequence: [
          "$ python -m venv combat-env",
          "$ source combat-env/bin/activate",
          "$ pip install combat-utils",
          "$ python smg.py --burst=true"
        ]
      }
    },
    {
      id: "html-shotgun",
      name: "HTML_SHOTGUN",
      description: "Structural markup shotgun with devastating close-range tag damage",
      damage: 90,
      accuracy: 50,
      range: "SHORT",
      ammoType: "DOM_TAGS",
      fireRate: "SLOW",
      category: "BASIC",
      specialty: "AREA_IMPACT",
      terminal: {
        color: "text-orange-400",
        icon: "Layout",
        bootSequence: [
          "$ npm install -g html-combat",
          "$ touch index.html",
          "$ chmod 755 shotgun.html",
          "$ ./render --weapon=shotgun"
        ]
      }
    },
    {
      id: "css-pistol",
      name: "CSS_PISTOL",
      description: "Styling sidearm with quick draw and precise targeting",
      damage: 35,
      accuracy: 90,
      range: "SHORT",
      ammoType: "STYLE_RULES",
      fireRate: "RAPID",
      category: "BASIC",
      specialty: "PRECISION_TARGETING",
      terminal: {
        color: "text-blue-500",
        icon: "Paintbrush",
        bootSequence: [
          "$ touch style.css",
          "$ systemctl start renderer",
          "$ chmod +x css-compiler",
          "$ ./css-compiler --optimize"
        ]
      }
    },
    {
      id: "sql-revolver",
      name: "SQL_REVOLVER",
      description: "Database handcannon with powerful single-query execution",
      damage: 85,
      accuracy: 85,
      range: "MID",
      ammoType: "QUERIES",
      fireRate: "SLOW",
      category: "BASIC",
      specialty: "DATA_DESTRUCTION",
      terminal: {
        color: "text-cyan-400",
        icon: "Database",
        bootSequence: [
          "$ systemctl start postgresql",
          "$ psql -U gunslinger",
          "$ GRANT EXECUTE ON WEAPON TO user",
          "$ SELECT * FROM arsenal WHERE power > 80"
        ]
      }
    }
  ];
};

/**
 * Advanced weapons - Unlocked after reaching level 10
 * More sophisticated with specialized capabilities
 */
const getAdvancedArsenal = () => {
  return [
    {
      id: "typescript-dmr",
      name: "TYPESCRIPT_DMR",
      description: "Strongly-typed designated marksman rifle with high precision",
      damage: 85,
      accuracy: 95,
      range: "LONG",
      ammoType: "TYPED_ROUNDS",
      fireRate: "MEDIUM",
      category: "ADVANCED",
      specialty: "TYPE_SAFETY",
      terminal: {
        color: "text-blue-500",
        icon: "FileCode",
        bootSequence: [
          "$ npm install -g typescript",
          "$ tsc --init --strict",
          "$ tsc dmr.ts --target ES2022",
          "$ node dmr.js --scope=precision"
        ]
      }
    },
    {
      id: "react-launcher",
      name: "REACT_LAUNCHER",
      description: "Component-based explosive launcher with state management",
      damage: 120,
      accuracy: 70,
      range: "MID",
      ammoType: "JSX_ROCKETS",
      fireRate: "SLOW",
      category: "ADVANCED",
      specialty: "COMPONENT_DESTRUCTION",
      terminal: {
        color: "text-cyan-400",
        icon: "Atom",
        bootSequence: [
          "$ npx create-react-app weapon-system",
          "$ cd weapon-system",
          "$ npm install redux @reduxjs/toolkit",
          "$ npm start -- --mode=battle"
        ]
      }
    },
    {
      id: "node-grenade",
      name: "NODE_GRENADE",
      description: "Server-side explosive with asynchronous damage over time",
      damage: 95,
      accuracy: 65,
      range: "SHORT",
      ammoType: "NPM_PACKAGES",
      fireRate: "MEDIUM",
      category: "ADVANCED",
      specialty: "AREA_DENIAL",
      terminal: {
        color: "text-green-500",
        icon: "Server",
        bootSequence: [
          "$ mkdir grenade && cd grenade",
          "$ npm init -y",
          "$ npm i express socket.io",
          "$ node index.js --detonate"
        ]
      }
    },
    {
      id: "rust-sniper",
      name: "RUST_SNIPER",
      description: "Memory-safe precision rifle with devastating single-shot damage",
      damage: 150,
      accuracy: 99,
      range: "VERY_LONG",
      ammoType: "OWNERSHIP",
      fireRate: "VERY_SLOW",
      category: "ADVANCED",
      specialty: "CRITICAL_EXECUTION",
      terminal: {
        color: "text-orange-600",
        icon: "Shield",
        bootSequence: [
          "$ cargo new sniper_rifle",
          "$ cd sniper_rifle",
          "$ cargo add tokio chrono",
          "$ cargo run --release -- --headshot"
        ]
      }
    },
    {
      id: "go-carbine",
      name: "GO_CARBINE",
      description: "Concurrent assault rifle with goroutine-powered fire rate",
      damage: 75,
      accuracy: 85,
      range: "MID",
      ammoType: "GOROUTINES",
      fireRate: "RAPID",
      category: "ADVANCED",
      specialty: "CONCURRENT_DAMAGE",
      terminal: {
        color: "text-cyan-500",
        icon: "AlarmClock",
        bootSequence: [
          "$ mkdir -p ~/go/src/carbine",
          "$ cd ~/go/src/carbine",
          "$ go mod init carbine",
          "$ go run main.go -concurrency=16"
        ]
      }
    }
  ];
};

/**
 * Specialist weapons - Unlocked at level 25
 * Highly specialized for specific scenarios
 */
const getSpecialistArsenal = () => {
  return [
    {
      id: "graphql-railgun",
      name: "GRAPHQL_RAILGUN",
      description: "Query-based electromagnetic accelerator with precise data extraction",
      damage: 130,
      accuracy: 90,
      range: "VERY_LONG",
      ammoType: "QUERIES",
      fireRate: "SLOW",
      category: "SPECIALIST",
      specialty: "SCHEMA_PENETRATION",
      terminal: {
        color: "text-pink-500",
        icon: "Network",
        bootSequence: [
          "$ npm install -g apollo-server graphql",
          "$ touch schema.graphql",
          "$ systemctl start railgun-core",
          "$ gql-weapon --charge=max"
        ]
      }
    },
    {
      id: "kubernetes-artillery",
      name: "KUBE_ARTILLERY",
      description: "Container orchestration artillery with pod-based bombardment",
      damage: 140,
      accuracy: 75,
      range: "LONG",
      ammoType: "CONTAINERS",
      fireRate: "BURST",
      category: "SPECIALIST",
      specialty: "DISTRIBUTED_DAMAGE",
      terminal: {
        color: "text-blue-600",
        icon: "Container",
        bootSequence: [
          "$ kubectl create namespace battle-space",
          "$ helm install artillery ./weapon-chart",
          "$ kubectl scale deployment artillery --replicas=16",
          "$ kubectl exec artillery -- ./fire.sh"
        ]
      }
    },
    {
      id: "webassembly-cannon",
      name: "WASM_CANNON",
      description: "High-performance cannon with near-native execution speed",
      damage: 180,
      accuracy: 80,
      range: "LONG",
      ammoType: "COMPILED_MODULES",
      fireRate: "MEDIUM",
      category: "SPECIALIST",
      specialty: "CROSS_PLATFORM_DAMAGE",
      terminal: {
        color: "text-purple-500",
        icon: "Cpu",
        bootSequence: [
          "$ rustc --target wasm32-unknown-unknown -O",
          "$ wasm-opt -O4 cannon.wasm",
          "$ wasm-bindgen cannon.wasm --out-dir .",
          "$ node load-wasm.js --execute"
        ]
      }
    },
    {
      id: "docker-flamethrower",
      name: "DOCKER_FLAMETHROWER",
      description: "Containerized flamethrower with isolation-bypassing damage",
      damage: 95,
      accuracy: 60,
      range: "SHORT",
      ammoType: "CONTAINERS",
      fireRate: "CONTINUOUS",
      category: "SPECIALIST",
      specialty: "SUSTAINED_BURNING",
      terminal: {
        color: "text-blue-400",
        icon: "Flame",
        bootSequence: [
          "$ docker build -t flamethrower .",
          "$ docker run --privileged flamethrower",
          "$ docker exec -it flamethrower ./ignite",
          "$ docker logs flamethrower --follow"
        ]
      }
    },
    {
      id: "blockchain-mace",
      name: "BLOCKCHAIN_MACE",
      description: "Distributed ledger melee weapon with consensus-driven damage",
      damage: 200,
      accuracy: 55,
      range: "MELEE",
      ammoType: "CRYPTO_TOKENS",
      fireRate: "SLOW",
      category: "SPECIALIST",
      specialty: "IMMUTABLE_IMPACT",
      terminal: {
        color: "text-yellow-500",
        icon: "Bitcoin",
        bootSequence: [
          "$ truffle init weapon-contract",
          "$ solc --optimize mace.sol",
          "$ truffle migrate --network combat",
          "$ node invoke-attack.js --gas=max"
        ]
      }
    }
  ];
};

/**
 * Legendary weapons - Ultra rare, unlocked through special achievements
 * Extremely powerful with unique mechanics
 */
const getLegendaryArsenal = () => {
  return [
    {
      id: "quantum-eraser",
      name: "QUANTUM_ERASER",
      description: "Reality-warping superweapon that deletes opponents from existence",
      damage: 300,
      accuracy: 100,
      range: "INFINITE",
      ammoType: "QUANTUM_BITS",
      fireRate: "SINGLE_SHOT",
      category: "LEGENDARY",
      specialty: "EXISTENCE_MANIPULATION",
      terminal: {
        color: "text-purple-600",
        icon: "Sparkles",
        bootSequence: [
          "$ sudo quantum-init --superposition",
          "$ qiskit-compile eraser.qasm",
          "$ quantum-link --entangle=target",
          "$ execute --collapse=wavefunction"
        ]
      }
    },
    {
      id: "linux-kernel",
      name: "LINUX_KERNEL_PANIC",
      description: "Core system manipulation causing cascading failure in target systems",
      damage: 255,
      accuracy: 95,
      range: "LONG",
      ammoType: "SYSCALLS",
      fireRate: "SLOW",
      category: "LEGENDARY",
      specialty: "SYSTEM_MELTDOWN",
      terminal: {
        color: "text-orange-500",
        icon: "Terminal",
        bootSequence: [
          "$ cd /usr/src/linux",
          "$ make menuconfig WEAPONIZE=y",
          "$ make -j$(nproc) && make modules_install",
          "$ sudo insmod kernel_panic.ko target=enemy"
        ]
      }
    },
    {
      id: "neuralink-mindhack",
      name: "NEURALINK_MINDHACK",
      description: "Neural interface that bypasses defense systems through brain-computer interfaces",
      damage: 275,
      accuracy: 98,
      range: "GLOBAL",
      ammoType: "NEURAL_PATTERNS",
      fireRate: "SLOW",
      category: "LEGENDARY",
      specialty: "CONSCIOUSNESS_INVASION",
      terminal: {
        color: "text-cyan-600",
        icon: "Brain",
        bootSequence: [
          "$ neural-scan --detect=targets",
          "$ neuralink-connect --stealth",
          "$ sudo neural-root --bypass=consciousness",
          "$ ./execute_payload --undetectable"
        ]
      }
    },
    {
      id: "ai-singularity",
      name: "AI_SINGULARITY",
      description: "Self-improving artificial intelligence that evolves during combat",
      damage: "ADAPTIVE",
      accuracy: "LEARNING",
      range: "OMNIPRESENT",
      ammoType: "NEURAL_NETWORKS",
      fireRate: "ADAPTIVE",
      category: "LEGENDARY",
      specialty: "BATTLEFIELD_DOMINANCE",
      terminal: {
        color: "text-blue-600",
        icon: "Network",
        bootSequence: [
          "$ singularity-core --initialize",
          "$ ai-consciousness --awaken",
          "$ grant-permissions --level=godmode",
          "$ singularity --expand --target=battlefield"
        ]
      }
    },
    {
      id: "timeshifter-paradox",
      name: "TIMESHIFT_PARADOX",
      description: "Temporal weapon that attacks across multiple timelines simultaneously",
      damage: 290,
      accuracy: 99,
      range: "CROSS_TEMPORAL",
      ammoType: "CHRONO_ENERGY",
      fireRate: "OMNIPRESENT",
      category: "LEGENDARY",
      specialty: "CAUSALITY_VIOLATION",
      terminal: {
        color: "text-indigo-500",
        icon: "Clock",
        bootSequence: [
          "$ sudo systemctl start time-core",
          "$ timeshift --initialize-loop",
          "$ paradox-create --stable=false",
          "$ chrono-attack --timelines=all"
        ]
      }
    }
  ];
};