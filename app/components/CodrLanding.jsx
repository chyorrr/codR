"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useInView, useAnimation, useMotionValue, useSpring } from 'framer-motion';
import { Github, Linkedin, Zap, Users, Trophy, Terminal, Code, Clock, Shield, Binary, Cpu, Database, GitBranch, Crosshair, Skull, Sword, Target, Flame, Gamepad2, Users2, Award, Lock, ChevronDown, Play, Pause, Volume2, VolumeX, Settings, Star, Sparkles, Bolt, Layout, Paintbrush, FileCode, Atom, Server, AlarmClock, Network, Container, Bitcoin, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TargetCursor, CodeBackground } from './ClientComponents';
import { loadAllArsenals } from '../utils/arsenalLoader';

export default function CodrLanding() {
  const router = useRouter();
  const [terminalLines, setTerminalLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [killCount, setKillCount] = useState(0);
  const [isArenaActive, setIsArenaActive] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [currentRoundTime, setCurrentRoundTime] = useState('60');
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const weaponsRef = useRef(null);
  
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  // Safe viewport fallbacks for SSR - use them inside useEffect only
  const [vw, setVw] = useState(1920);
  const [vh, setVh] = useState(1080);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    }
  }, []);

  const codeLines = [
    '> ARENA_STATUS: INITIALIZING...',
    '> LOADING_DEATHMATCH_PROTOCOLS...',
    '> WEAPONS_SYSTEM: ONLINE',
    '> SCANNING_FOR_OPPONENTS...',
    '> NEURAL_NETWORK: ACTIVATED',
    '> QUANTUM_ALGORITHMS: READY',
    '> AWAITING_COMBATANTS...',
    '> STATUS: READY_TO_ELIMINATE'
  ];

  const roundTimeOptions = ['5', '30', '60', '120', '300'];
  
  // Enhanced mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      
      // Create subtle glitch effect on rapid movement
      const speed = Math.sqrt(e.movementX ** 2 + e.movementY ** 2);
      if (speed > 50) {
        setGlitchIntensity(speed / 100);
        setTimeout(() => setGlitchIntensity(0), 100);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (currentLine < codeLines.length) {
      const timer = setTimeout(() => {
        setTerminalLines(prev => [...prev, codeLines[currentLine]]);
        setCurrentLine(currentLine + 1);
      }, 600 + Math.random() * 400); // Variable timing for more realism
      return () => clearTimeout(timer);
    } else {
      // Start kill counter after terminal loads
      const killTimer = setInterval(() => {
        setKillCount(prev => Math.min(prev + 1, 1337));
      }, 30);
      
      // Cycle through round times
      const timeTimer = setInterval(() => {
        setCurrentRoundTime(prev => {
          const currentIndex = roundTimeOptions.indexOf(prev);
          return roundTimeOptions[(currentIndex + 1) % roundTimeOptions.length];
        });
      }, 2000);
      
      setTimeout(() => {
        clearInterval(killTimer);
        clearInterval(timeTimer);
        setIsArenaActive(true);
      }, 4000);
      
      return () => {
        clearInterval(killTimer);
        clearInterval(timeTimer);
      };
    }
  }, [currentLine, roundTimeOptions]);

  const gameFeatures = [
    { 
      icon: Crosshair, 
      title: 'PRECISION_TARGETING', 
      desc: 'Aim for perfect syntax. Miss and face elimination. Neural targeting systems guide your code.', 
      code: 'accuracy: 99.7%', 
      color: 'text-red-400', 
      glowColor: 'red',
      particles: 12
    },
    { 
      icon: Skull, 
      title: 'ELIMINATION_MODE', 
      desc: 'Last coder standing wins. No mercy for bugs. Quantum elimination protocols activated.', 
      code: 'survivors: 1/16', 
      color: 'text-red-400', 
      glowColor: 'red',
      particles: 15
    },
    { 
      icon: Flame, 
      title: 'RAPID_FIRE', 
      desc: 'Code fast or die. Variable time rounds from 5 seconds to 5 minutes of pure chaos.', 
      code: 'exec_time: 5s-5m', 
      color: 'text-red-400', 
      glowColor: 'red',
      particles: 20
    },
    { 
      icon: Trophy, 
      title: 'VICTORY_ROYALE', 
      desc: 'Climb the leaderboard. Become the apex coder. Legendary status awaits the worthy.', 
      code: 'rank: #1', 
      color: 'text-green-400', 
      glowColor: 'green',
      particles: 8
    }
  ];

  // Import weaponClasses from the arsenal loader
  const [weaponClasses, setWeaponClasses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('basic');
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [terminalActive, setTerminalActive] = useState(false);
  
  // Import arsenal data
  useEffect(() => {
    const allArsenals = loadAllArsenals();
    const initialCategory = 'basic';
    setWeaponClasses(allArsenals[initialCategory]);
    setSelectedCategory(initialCategory);
    // Preselect first weapon
    if (allArsenals[initialCategory] && allArsenals[initialCategory].length > 0) {
      setSelectedWeapon(allArsenals[initialCategory][0]);
      simulateTerminalBoot(allArsenals[initialCategory][0]);
    }
  }, []);
  
  const changeArsenalCategory = (category) => {
    const allArsenals = loadAllArsenals();
    setWeaponClasses(allArsenals[category] || []);
    setSelectedCategory(category);
    // Select first weapon in category
    if (allArsenals[category] && allArsenals[category].length > 0) {
      setSelectedWeapon(allArsenals[category][0]);
      simulateTerminalBoot(allArsenals[category][0]);
    }
  };
  
  const selectWeapon = (weapon) => {
    setSelectedWeapon(weapon);
    simulateTerminalBoot(weapon);
  };
  
  const simulateTerminalBoot = (weapon) => {
    if (!weapon || !weapon.terminal) return;
    
    setTerminalOutput([]);
    setTerminalActive(true);
    
    // Simulate typing effect for terminal commands
    let i = 0;
    const interval = setInterval(() => {
      if (i < weapon.terminal.bootSequence.length) {
        setTerminalOutput(prev => [...prev, weapon.terminal.bootSequence[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setTerminalOutput(prev => [...prev, 
            `$ weapon_initialized "${weapon.name}" --ready`, 
            `$ damage_output ${weapon.damage} --accuracy=${weapon.accuracy}`,
            `$ echo "WEAPON SYSTEM ONLINE"`
          ]);
        }, 500);
      }
    }, 300);
  };

  const codePatches = [
    'function eliminate() {',
    'const target = findWeakest();',
    'while(enemies.length > 0) {',
    'if (accuracy < 90%) die();',
    'for(let i = 0; i < kills; i++) {',
    'console.log("HEADSHOT!");',
    'return victory || death;',
    '} catch(error) { respawn(); }',
    'class Assassin extends Coder {',
    'async function hunt() {',
    'const weapons = ["python", "js"];',
    'export default Survivor;'
  ];

  const codeSnippets = [
    '// DEATHMATCH PROTOCOL v2.0',
    'const arena = new BattleRoyale({',
    '  mode: "ELIMINATION",',
    '  timeLimit: randomize(5, 300),',
    '  weapons: loadAllArsenals(),',
    '});',
    'arena.spawn(player, coordinates);',
    'while(arena.survivors > 1) {',
    '  player.scan().eliminate(target);',
    '  await arena.updateLeaderboard();',
    '} // VICTORY ACHIEVED',
    'export { Champion };'
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.9 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100
      }
    }
  };

  const glitchVariants = {
    normal: { 
      x: 0, 
      y: 0, 
      filter: "hue-rotate(0deg)" 
    },
    glitch: {
      x: [-2, 2, -1, 1, 0],
      y: [-1, 1, -2, 2, 0],
      filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(180deg)", "hue-rotate(0deg)"],
      transition: {
        duration: 0.2,
        repeat: 2
      }
    }
  };

  // background canvas handled by CodeBackground component

  // background canvas is provided by CodeBackground component (no client-side generation here)

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-x-hidden relative cursor-none">
      {/* Custom Target Cursor (GSAP-based) - hide system cursor so only crosshair shows */}
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />

      {/* Enhanced Header Navigation */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-red-500/20"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-4"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="relative"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
              >
                <Skull className="w-8 h-8 text-red-400" />
                <motion.div 
                  className="absolute inset-0 bg-red-500/30 rounded-full blur-lg"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.05, 0.15, 0.05]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-1/4 left-1/6 w-80 h-80 bg-red-600/20 rounded-full blur-3xl pointer-events-none"
                />
              </motion.div>
            </motion.div>

            <nav className="hidden md:flex items-center gap-8">
              {[
                { label: 'ARENA', icon: Target },
                { label: 'WEAPONS', icon: Sword },
                { label: 'LEADERBOARD', icon: Trophy },
                { label: 'SETTINGS', icon: Settings }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors cursor-target"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-bold">{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-red-400 transition-colors cursor-target"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </motion.button>
              
              <motion.div
                className="flex items-center gap-2 px-3 py-2 bg-red-600/20 border border-red-500/30 rounded-lg"
                animate={{ 
                  boxShadow: [
                    "0 0 0 rgba(220, 38, 38, 0)",
                    "0 0 20px rgba(220, 38, 38, 0.3)",
                    "0 0 0 rgba(220, 38, 38, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-xs font-bold">LIVE</span>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Canvas code splatter background */}
      <CodeBackground />

      {/* Enhanced Floating Particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="fixed w-1 h-1 bg-red-400/30 rounded-full pointer-events-none z-10"
          animate={{
            x: [0, vw],
            y: [
              Math.random() * vh,
              Math.random() * vh
            ],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "linear"
          }}
        />
      ))}

      {/* Enhanced danger zones with more complex animations */}
      <motion.div 
        animate={{ 
          scale: [1, 1.4, 1.2, 1.6, 1],
          opacity: [0.05, 0.15, 0.08, 0.12, 0.05],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/4 left-1/6 w-80 h-80 bg-red-600/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1.1, 1.5, 1],
          opacity: [0.05, 0.12, 0.06, 0.10, 0.05],
          rotate: [360, 180, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        className="absolute bottom-1/3 right-1/5 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1.3, 1.1, 1],
          opacity: [0.03, 0.08, 0.05, 0.10, 0.03],
          x: [-20, 20, -10, 15, 0],
          y: [-15, 10, -5, 20, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, delay: 4 }}
        className="absolute top-2/3 left-1/3 w-72 h-72 bg-red-500/10 rounded-full blur-2xl pointer-events-none"
      />

      {/* Enhanced Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ opacity, scale }}
        className="relative min-h-screen flex items-center justify-center py-20 pt-32"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Arena Status Header */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between mb-16"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 90, 180, 270, 360],
                    scale: [1, 1.2, 1, 1.2, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Crosshair className="w-8 h-8 text-red-400" />
                </motion.div>
                <motion.span 
                  className="text-red-400 text-sm tracking-[0.3em] font-bold"
                  animate={{ 
                    textShadow: [
                      "0 0 0 rgba(220, 38, 38, 0)",
                      "0 0 10px rgba(220, 38, 38, 0.8)",
                      "0 0 0 rgba(220, 38, 38, 0)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  DEATHMATCH_ARENA
                </motion.span>
                <motion.div 
                  className="flex-1 h-px bg-gradient-to-r from-red-500/50 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              </div>
              <div className="flex items-center gap-6 text-sm">
                <motion.div 
                  className="flex items-center gap-2"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-red-500 rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-red-400">LIVE</span>
                </motion.div>
                <motion.div 
                  className="text-orange-400"
                  variants={glitchVariants}
                  animate={glitchIntensity > 0.5 ? "glitch" : "normal"}
                >
                  KILLS: <motion.span 
                    className="font-bold text-xl"
                    animate={{ 
                      color: ["#fb923c", "#dc2626", "#fb923c"]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {killCount}
                  </motion.span>
                </motion.div>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-5 gap-12 items-center">
              {/* Enhanced Left: Title and CTA - Taking 3/5 columns */}
              <div className="lg:col-span-3">
                <motion.div
                  variants={itemVariants}
                >
                  <div className="mb-8">
                    <motion.h1 
                      className="text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 leading-none relative"
                      animate={{ 
                        textShadow: isArenaActive 
                          ? [
                              '0 0 20px rgba(220, 38, 38, 0.8)',
                              '0 0 40px rgba(220, 38, 38, 0.6)',
                              '0 0 20px rgba(220, 38, 38, 0.8)'
                            ]
                          : '0 0 10px rgba(220, 38, 38, 0.4)'
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <motion.span 
                        className="text-white font-sans tracking-tight relative inline-block"
                        whileHover={{ 
                          scale: 1.05,
                          rotateY: 5,
                          textShadow: "0 0 30px rgba(255, 255, 255, 0.8)"
                        }}
                      >
                        cod
                        <motion.div
                          className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg blur-xl opacity-0"
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.span>
                      <motion.span 
                        className="text-red-500 font-sans tracking-tight relative inline-block"
                        whileHover={{ 
                          scale: 1.1,
                          rotateY: -5,
                          textShadow: "0 0 30px rgba(220, 38, 38, 1)"
                        }}
                        animate={{
                          textShadow: [
                            "0 0 10px rgba(220, 38, 38, 0.5)",
                            "0 0 20px rgba(220, 38, 38, 0.8)",
                            "0 0 10px rgba(220, 38, 38, 0.5)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        R
                        <motion.div
                          className="absolute -inset-2 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-lg blur-xl opacity-60"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.6, 0.8, 0.6]
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </motion.span>
                    </motion.h1>
                    
                    <motion.div 
                      className="text-lg text-red-400 font-bold tracking-[0.2em] mb-2 relative"
                      animate={{ 
                        opacity: [0.7, 1, 0.7],
                        y: [0, -2, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="relative z-10">DEATHMATCH EDITION</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/20 to-red-600/0 blur-sm"
                        animate={{ 
                          x: [-100, 100],
                          opacity: [0, 1, 0]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          repeatType: "loop"
                        }}
                      />
                    </motion.div>
                  </div>
                  
                  {/* Enhanced Terminal */}
                  <div className="relative mb-10">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg blur opacity-30" />
                    <div className="relative bg-black/95 border border-red-500/40 p-1 rounded-lg cursor-target">
                      <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500/90" />
                              <div className="w-3 h-3 rounded-full bg-yellow-500/90" />
                              <div className="w-3 h-3 rounded-full bg-green-500/90" />
                            </div>
                            <span className="text-red-400/80 text-sm font-bold">ARENA_TERMINAL</span>
                          </div>
                          <div className="text-xs text-orange-400">
                            SURVIVORS: {isArenaActive ? '1/16' : '16/16'}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <AnimatePresence>
                            {terminalLines.map((line, i) => (
                              <motion.p 
                                key={i}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-red-400 text-base font-bold"
                              >
                                {line}
                              </motion.p>
                            ))}
                          </AnimatePresence>
                          {currentLine < codeLines.length && (
                            <motion.span 
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                              className="inline-block w-3 h-5 bg-red-400 ml-1"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-10">
                    <p className="text-gray-300 text-xl mb-3 font-sans leading-relaxed">
                      <span className="text-red-400 font-bold">ELIMINATE</span>. 
                      <span className="text-orange-400 font-bold mx-2">CODE</span>. 
                      <span className="text-yellow-400 font-bold">SURVIVE</span>.
                    </p>
                    <p className="text-gray-500 text-base">
                      Enter the arena where only the fastest coders survive. <br />
                      <span className="text-red-400">60-second deathmatch rounds</span> • 
                      <span className="text-orange-400 ml-2">Elimination gameplay</span> • 
                      <span className="text-yellow-400 ml-2">Last coder standing wins</span>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6">
                    <motion.button
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: '0 0 40px rgba(220, 38, 38, 0.8)',
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/matchmaking')}
                      className="relative group flex-1 cursor-target"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg blur opacity-60 group-hover:opacity-90 transition" />
                      <div className="relative flex items-center justify-center gap-3 bg-red-600 text-white px-10 py-5 rounded-lg font-sans font-bold text-lg">
                        <Crosshair className="w-6 h-6" />
                        <span>ENTER_ARENA</span>
                      </div>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center gap-3 bg-gray-900 border-2 border-red-500/40 text-red-400 px-10 py-5 rounded-lg font-sans font-bold text-lg hover:bg-red-500/10 transition-colors cursor-target"
                    >
                      <Github className="w-6 h-6" />
                      <span>GITHUB_AUTH</span>
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Right: Enhanced Code Editor - Taking 2/5 columns */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative"
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl blur opacity-25" />
                  <div className="relative bg-black/95 border-2 border-red-500/40 rounded-xl overflow-hidden cursor-target">
                    <div className="bg-gray-900 px-6 py-4 flex items-center justify-between border-b-2 border-red-500/30">
                      <div className="flex items-center gap-3">
                        <Sword className="w-5 h-5 text-red-400" />
                        <span className="text-sm text-gray-300 font-bold">arena_deathmatch.js</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs text-red-400 font-bold">LIVE_FIRE</span>
                      </div>
                    </div>
                    <div className="p-8 space-y-4">
                      {codeSnippets.map((line, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -25 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + i * 0.25 }}
                          className="flex items-start gap-4"
                        >
                          <span className="text-gray-600 text-sm select-none font-bold min-w-[20px]">{i + 1}</span>
                          <code className="text-sm leading-relaxed">
                            <span className="text-gray-500">{line.includes('//') ? line : ''}</span>
                            <span className="text-red-400">{line.includes('const') ? 'const ' : ''}</span>
                            <span className="text-orange-300">{line.includes('arena') ? 'arena' : ''}</span>
                            <span className="text-white">{line.includes('=') ? ' = ' : ''}</span>
                            <span className="text-yellow-400">{line.includes('new') ? 'new ' : ''}</span>
                            <span className="text-cyan-300">{line.includes('BattleRoyale') ? 'BattleRoyale' : ''}</span>
                            <span className="text-pink-400">{line.includes('while') ? 'while' : ''}</span>
                            <span className="text-green-400">{line.includes('eliminate') ? 'eliminate' : ''}</span>
                            <span className="text-white">{line.match(/[{}().]/g)?.join('') || ''}</span>
                          </code>
                        </motion.div>
                      ))}
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="flex items-center gap-4"
                      >
                        <span className="text-gray-600 text-sm font-bold">{codeSnippets.length + 1}</span>
                        <div className="w-3 h-5 bg-red-400" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Enhanced floating stats - repositioned to top-right of the editor card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute top-4 right-4 bg-black/85 border border-red-500/30 rounded-2xl p-3 backdrop-blur-md shadow-xl w-max text-center cursor-target"
                    whileHover={{ 
                      scale: 1.05,
                      borderColor: "rgba(220, 38, 38, 0.6)",
                      boxShadow: "0 0 30px rgba(220, 38, 38, 0.3)"
                    }}
                  >
                    <motion.div 
                      className="flex items-center gap-3"
                      animate={{ y: [0, -1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <motion.div 
                        className="p-2 bg-red-600/10 rounded-md"
                        animate={{ 
                          backgroundColor: [
                            "rgba(220, 38, 38, 0.1)",
                            "rgba(220, 38, 38, 0.2)",
                            "rgba(220, 38, 38, 0.1)"
                          ]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                          <Target className="w-7 h-7 text-red-400" />
                        </motion.div>
                      </motion.div>
                      <div className="text-left">
                        <motion.div 
                          className="text-xl font-bold text-red-400 leading-none"
                          key={currentRoundTime}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", damping: 15 }}
                        >
                          <motion.span 
                            className="text-2xl"
                            animate={{ 
                              textShadow: [
                                "0 0 0 rgba(220, 38, 38, 0)",
                                "0 0 10px rgba(220, 38, 38, 0.8)",
                                "0 0 0 rgba(220, 38, 38, 0)"
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {currentRoundTime}
                          </motion.span>
                          <span className="ml-1 text-sm text-gray-400">
                            {currentRoundTime === '300' ? 'MIN' : 'SEC'}
                          </span>
                        </motion.div>
                        <motion.div 
                          className="text-[10px] text-gray-400 font-bold uppercase"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          PER ROUND
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced scroll indicator */}
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="text-red-400/70 text-xs tracking-widest font-bold">ENTER_BATTLEGROUND</span>
            <motion.div 
              className="w-px h-20 bg-gradient-to-b from-red-500/60 to-transparent"
              animate={{ scaleY: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            />
            <Skull className="w-4 h-4 text-red-400/50" />
          </div>
        </motion.div>
      </motion.section>

      {/* Game Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/10 to-black" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="flex items-center gap-4 mb-6">
              <Gamepad2 className="w-8 h-8 text-red-400" />
              <span className="text-red-400 text-sm tracking-[0.3em] font-bold">COMBAT_SYSTEMS</span>
              <div className="h-px flex-1 bg-gradient-to-r from-red-500/40 to-transparent" />
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold font-sans mb-6">
              Weaponized <span className="text-red-400">Code</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl">
              Master different programming languages as deadly weapons. Each has unique damage, range, and specialty attacks.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {gameFeatures.map((feature, i) => {
              const Icon = feature.icon;
              const isSpecialGlow = feature.glowColor === 'red';
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -12, scale: 1.03 }}
                  className={`relative group cursor-target ${i % 2 === 1 ? 'md:mt-12' : ''}`}
                >
                  {/* Enhanced particle effects */}
                  {Array.from({ length: feature.particles }).map((_, particleIndex) => (
                    <motion.div
                      key={particleIndex}
                      className="absolute w-1 h-1 bg-red-400/40 rounded-full pointer-events-none"
                      animate={{
                        x: [
                          Math.random() * 400 - 200,
                          Math.random() * 400 - 200,
                          Math.random() * 400 - 200
                        ],
                        y: [
                          Math.random() * 300 - 150,
                          Math.random() * 300 - 150,
                          Math.random() * 300 - 150
                        ],
                        opacity: [0, 0.6, 0],
                        scale: [0, 1, 0]
                      }}
                      transition={{
                        duration: 4 + Math.random() * 2,
                        repeat: Infinity,
                        delay: particleIndex * 0.2,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                  
                  <motion.div 
                    className={`absolute -inset-1 rounded-xl blur opacity-0 group-hover:opacity-60 transition-all duration-500 ${
                      isSpecialGlow 
                        ? 'bg-gradient-to-r from-red-600 to-red-600' 
                        : 'bg-gradient-to-r from-red-600 to-orange-600'
                    }`}
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0, 0.3, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  />
                  
                  <div className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/30 p-8 rounded-xl group-hover:border-red-500/50 transition-all cursor-target overflow-hidden">
                    {/* Animated background pattern */}
                    <motion.div
                      className="absolute inset-0 opacity-5"
                      animate={{
                        backgroundPosition: ["0% 0%", "100% 100%"],
                      }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      style={{
                        backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23dc2626\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
                        backgroundSize: "60px 60px"
                      }}
                    />
                    
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className={`p-3 bg-black/50 rounded-lg border transition-colors relative ${
                            isSpecialGlow 
                              ? 'border-red-500/30 group-hover:border-red-500/60' 
                              : 'border-red-500/30 group-hover:border-red-500/60'
                          }`}
                          whileHover={{ 
                            boxShadow: "0 0 20px rgba(220, 38, 38, 0.5)",
                            scale: 1.1 
                          }}
                        >
                          <motion.div
                            animate={{ 
                              rotate: feature.title === 'RAPID_FIRE' ? [0, 360] : 0,
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                              scale: { duration: 2, repeat: Infinity }
                            }}
                          >
                            <Icon className={`w-8 h-8 ${feature.color} group-hover:scale-110 transition-transform relative z-10`} />
                          </motion.div>
                          
                          {/* Icon glow effect */}
                          <motion.div
                            className="absolute inset-0 rounded-lg blur-md opacity-0 group-hover:opacity-50"
                            animate={{
                              backgroundColor: [
                                "rgba(220, 38, 38, 0)",
                                "rgba(220, 38, 38, 0.3)",
                                "rgba(220, 38, 38, 0)"
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </motion.div>
                        
                        <div>
                          <motion.h3 
                            className="text-xl font-bold font-sans text-white mb-1"
                            whileHover={{ 
                              textShadow: "0 0 10px rgba(255, 255, 255, 0.8)"
                            }}
                          >
                            {feature.title}
                          </motion.h3>
                          <motion.code 
                            className="text-xs text-red-400/70 bg-black/50 px-2 py-1 rounded border border-red-500/20"
                            animate={{
                              borderColor: [
                                "rgba(220, 38, 38, 0.2)",
                                "rgba(220, 38, 38, 0.4)",
                                "rgba(220, 38, 38, 0.2)"
                              ]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            {feature.code}
                          </motion.code>
                        </div>
                      </div>
                    </div>
                    
                    <motion.p 
                      className="text-gray-400 leading-relaxed mb-6 relative z-10"
                      whileHover={{ color: "rgb(209, 213, 219)" }}
                    >
                      {feature.desc}
                    </motion.p>
                    
                    <motion.div 
                      className="h-px bg-gradient-to-r from-red-500/50 via-orange-500/30 to-transparent"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Weapon Classes */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="flex items-center gap-4 mb-8">
              <Sword className="w-8 h-8 text-orange-400" />
              <span className="text-orange-400 text-sm tracking-[0.3em] font-bold">WEAPON_LOADOUT</span>
              <div className="h-px flex-1 bg-gradient-to-r from-orange-500/40 to-transparent" />
            </div>
            <h3 className="text-4xl font-bold font-sans mb-8">
              Choose Your <span className="text-orange-400">Arsenal</span>
            </h3>
          </motion.div>

          <div className="space-y-8">
            {/* Arsenal Category Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-black/60 border border-orange-500/30 rounded-lg p-2 backdrop-blur-md"
            >
              <div className="grid grid-cols-4 gap-2">
                {['basic', 'advanced', 'specialist', 'legendary'].map((category) => (
                  <motion.button
                    key={category}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => changeArsenalCategory(category)}
                    className={`py-2 px-3 rounded font-mono text-sm transition-all ${
                      selectedCategory === category 
                        ? 'bg-orange-500/20 border-2 border-orange-500/60 text-orange-400' 
                        : 'bg-black/40 border border-orange-500/20 text-gray-400 hover:text-orange-400 hover:border-orange-500/40'
                    }`}
                  >
                    {category.toUpperCase()}
                  </motion.button>
                ))}
              </div>
            </motion.div>
            
            {/* Weapons Grid with Terminal */}
            <div className="grid md:grid-cols-5 gap-6">
              {/* Left side: Weapon selection */}
              <div className="md:col-span-2 space-y-4">
                {weaponClasses.map((weapon, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectWeapon(weapon)}
                    className={`relative group cursor-target ${
                      selectedWeapon?.id === weapon.id ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/20' : ''
                    }`}
                  >
                    <div className={`absolute -inset-0.5 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg blur opacity-0 ${
                      selectedWeapon?.id === weapon.id ? 'opacity-50' : 'group-hover:opacity-30'
                    } transition-all duration-300`} />
                    <div className="relative bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 p-4 rounded-lg group-hover:border-orange-500/60 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            selectedWeapon?.id === weapon.id ? 'bg-orange-400 animate-pulse' : 'bg-gray-500'
                          }`} />
                          <h4 className="text-sm font-bold text-orange-400 font-mono">{weapon.name}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-400">{weapon.damage}</div>
                          <div className="text-[10px] text-gray-500">DMG</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-black/40 rounded p-1 px-2">
                          <span className="text-gray-500">RANGE:</span>
                          <span className={`ml-1 font-bold ${
                            weapon.range === 'LONG' || weapon.range === 'VERY_LONG' || weapon.range === 'INFINITE' || weapon.range === 'GLOBAL' ? 'text-green-400' : 
                            weapon.range === 'MID' || weapon.range === 'CROSS_TEMPORAL' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {weapon.range}
                          </span>
                        </div>
                        <div className="bg-black/40 rounded p-1 px-2">
                          <span className="text-gray-500">AMMO:</span>
                          <span className="ml-1 font-bold text-cyan-400">{weapon.ammoType}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Right side: Terminal and weapon details */}
              <div className="md:col-span-3">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative h-full"
                >
                  {/* Arch Linux style terminal */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg blur opacity-25" />
                  <div className="relative bg-black/95 border border-orange-500/40 rounded-lg overflow-hidden h-full flex flex-col">
                    {/* Terminal header */}
                    <div className="bg-gray-900/80 px-4 py-2 flex items-center justify-between border-b border-orange-500/30">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500/90" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/90" />
                          <div className="w-3 h-3 rounded-full bg-green-500/90" />
                        </div>
                        <span className="text-orange-400 font-mono text-sm">arsenal@codeR:~$</span>
                      </div>
                      {selectedWeapon && (
                        <span className="text-xs text-gray-400">
                          {selectedWeapon.category} / {selectedWeapon.id}
                        </span>
                      )}
                    </div>
                    
                    {/* Terminal content */}
                    <div className="p-4 flex-grow font-mono bg-black overflow-y-auto">
                      {selectedWeapon ? (
                        <div className="space-y-4">
                          {/* Weapon specs */}
                          <div className="mb-4">
                            <div className={`text-lg font-bold ${selectedWeapon.terminal?.color || 'text-orange-400'}`}>
                              {selectedWeapon.name}
                            </div>
                            <div className="text-gray-400 text-sm mt-1">{selectedWeapon.description}</div>
                          </div>
                          
                          {/* Terminal output */}
                          <div className="bg-black/60 border border-gray-800 rounded p-3 font-mono text-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span className="text-green-500 text-xs">WEAPON_LOADER</span>
                            </div>
                            
                            <div className="space-y-1 text-xs">
                              <AnimatePresence>
                                {(terminalOutput || []).map((line, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="font-mono"
                                  >
                                    {typeof line === 'string' && line.startsWith && line.startsWith('$') ? (
                                      <>
                                        <span className="text-green-400">{String(line).split(' ')[0]}</span>
                                        <span className="text-orange-400"> {String(line).substring(String(line).indexOf(' ') + 1)}</span>
                                      </>
                                    ) : (
                                      <span className="text-gray-400">{String(line)}</span>
                                    )}
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                              {terminalActive && ((terminalOutput && terminalOutput.length) || 0) < 7 && (
                                <motion.span 
                                  animate={{ opacity: [1, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity }}
                                  className="inline-block w-2 h-4 bg-orange-400 ml-1"
                                />
                              )}
                            </div>
                          </div>
                          
                          {/* Weapon stats */}
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-black/40 border border-gray-800 rounded p-2 flex justify-between items-center">
                              <span className="text-xs text-gray-500">DAMAGE:</span>
                              <span className={`text-sm font-bold ${
                                typeof selectedWeapon.damage === 'number' && selectedWeapon.damage > 120 ? 'text-red-400' :
                                typeof selectedWeapon.damage === 'number' && selectedWeapon.damage > 80 ? 'text-orange-400' : 'text-yellow-400'
                              }`}>
                                {selectedWeapon.damage}
                              </span>
                            </div>
                            <div className="bg-black/40 border border-gray-800 rounded p-2 flex justify-between items-center">
                              <span className="text-xs text-gray-500">ACCURACY:</span>
                              <span className={`text-sm font-bold ${
                                typeof selectedWeapon.accuracy === 'number' && selectedWeapon.accuracy > 90 ? 'text-green-400' :
                                typeof selectedWeapon.accuracy === 'number' && selectedWeapon.accuracy > 70 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {selectedWeapon.accuracy}
                              </span>
                            </div>
                            <div className="bg-black/40 border border-gray-800 rounded p-2 flex justify-between items-center">
                              <span className="text-xs text-gray-500">FIRE RATE:</span>
                              <span className="text-sm font-bold text-cyan-400">{selectedWeapon.fireRate}</span>
                            </div>
                            <div className="bg-black/40 border border-gray-800 rounded p-2 flex justify-between items-center">
                              <span className="text-xs text-gray-500">SPECIALTY:</span>
                              <span className="text-sm font-bold text-purple-400">{selectedWeapon.specialty}</span>
                            </div>
                          </div>
                          
                          {/* Selection button */}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full mt-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/60 text-orange-400 py-2 px-4 rounded font-mono transition-colors"
                          >
                            $ SELECT_WEAPON --confirm
                          </motion.button>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          <span>Select a weapon to continue...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Battle Process Timeline */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-orange-950/8 to-black" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-6">
              <Target className="w-8 h-8 text-orange-400" />
              <span className="text-orange-400 text-sm tracking-[0.3em] font-bold">ELIMINATION_PROTOCOL</span>
              <div className="h-px flex-1 bg-gradient-to-r from-orange-500/40 to-transparent" />
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold font-sans mb-8">
              How to <span className="text-orange-400">Survive</span>
            </h2>
            <p className="text-gray-400 text-lg mb-20 max-w-3xl">
              Master the four-phase elimination protocol. Execute flawlessly or face instant termination.
            </p>

            <div className="relative">
              {/* Enhanced vertical line */}
              <div className="absolute left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500/60 via-red-500/40 to-transparent rounded-full" />

              <div className="space-y-16">
                {[
                  { 
                    step: '01', 
                    cmd: 'spawn', 
                    title: 'ARENA_SPAWN', 
                    desc: 'Drop into the coding arena. Choose your weapon class. Scan for threats and opportunities.',
                    icon: Target,
                    color: 'text-green-400'
                  },
                  { 
                    step: '02', 
                    cmd: 'hunt', 
                    title: 'TARGET_ACQUISITION', 
                    desc: 'Identify weak opponents. Set up killshots. Position for maximum elimination potential.',
                    icon: Crosshair,
                    color: 'text-yellow-400'
                  },
                  { 
                    step: '03', 
                    cmd: 'execute', 
                    title: 'CODE_ELIMINATION', 
                    desc: 'Deploy your weapon. Execute perfect syntax. Eliminate targets with precision strikes.',
                    icon: Skull,
                    color: 'text-orange-400'
                  },
                  { 
                    step: '04', 
                    cmd: 'victory', 
                    title: 'LAST_STANDING', 
                    desc: 'Survive the arena. Claim victory rewards. Ascend the leaderboard rankings.',
                    icon: Trophy,
                    color: 'text-red-400'
                  }
                ].map((item, i) => {
                  const StepIcon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ delay: i * 0.2 }}
                      className="relative flex gap-12 group"
                    >
                      {/* Enhanced Node */}
                      <div className="relative flex-shrink-0">
                        <motion.div 
                          whileHover={{ scale: 1.15 }}
                          className="w-24 h-24 bg-black border-3 border-orange-500 rounded-full flex flex-col items-center justify-center text-orange-400 font-bold relative z-10 group-hover:border-orange-400 transition-colors"
                        >
                          <span className="text-sm">{item.step}</span>
                          <StepIcon className="w-5 h-5 mt-1" />
                        </motion.div>
                        <motion.div 
                          className="absolute inset-0 bg-orange-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"
                          animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3]
                          }}
                          transition={{ 
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.5
                          }}
                        />
                      </div>

                      {/* Enhanced Content */}
                      <div className="flex-1 pb-8">
                        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-orange-500/30 rounded-xl p-8 group-hover:border-orange-500/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-orange-500/20">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <code className="text-sm text-orange-400 bg-black/50 px-3 py-2 rounded-lg border border-orange-500/30 font-bold">
                                $ {item.cmd}
                              </code>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                <span className="text-xs text-orange-400/70 font-bold">ACTIVE</span>
                              </div>
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold font-sans mb-4 text-white group-hover:text-orange-100 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-gray-400 leading-relaxed text-base group-hover:text-gray-300 transition-colors">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-yellow-950/8 to-black" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <Award className="w-8 h-8 text-yellow-400" />
              <span className="text-yellow-400 text-sm tracking-[0.3em] font-bold">APEX_LEGENDS</span>
              <div className="h-px w-20 bg-gradient-to-r from-yellow-500/40 to-transparent" />
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold font-sans mb-6">
              Hall of <span className="text-yellow-400">Champions</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Only the most lethal coders reach the top. Do you have what it takes?
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500/30 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 px-8 py-6 border-b-2 border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-yellow-400 font-mono">GLOBAL_RANKINGS</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    <span className="text-xs text-yellow-400 font-bold">LIVE</span>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-4">
                {[
                  { rank: 1, name: 'DEATH_CODER_X', kills: 1337, weapon: 'RUST_SNIPER', status: 'APEX_PREDATOR' },
                  { rank: 2, name: 'NULL_POINTER', kills: 892, weapon: 'PYTHON_ASSAULT', status: 'LEGENDARY' },
                  { rank: 3, name: 'STACK_OVERFLOW', kills: 743, weapon: 'JS_SHOTGUN', status: 'MASTER' },
                  { rank: 4, name: 'CODE_REAPER', kills: 621, weapon: 'GO_SMG', status: 'DIAMOND' },
                  { rank: 5, name: 'SYNTAX_SLAYER', kills: 589, weapon: 'C++_RIFLE', status: 'PLATINUM' }
                ].map((player, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:scale-[1.02] cursor-target ${
                      player.rank === 1 
                        ? 'bg-yellow-500/10 border-yellow-500/40 hover:border-yellow-500/60' 
                        : player.rank <= 3 
                        ? 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50'
                        : 'bg-gray-800/50 border-gray-600/30 hover:border-gray-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        player.rank === 1 ? 'bg-yellow-500 text-black' : 
                        player.rank <= 3 ? 'bg-orange-500 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {player.rank}
                      </div>
                      <div>
                        <div className="font-bold text-white font-mono">{player.name}</div>
                        <div className="text-xs text-gray-400">{player.weapon}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        player.rank === 1 ? 'text-yellow-400' : 
                        player.rank <= 3 ? 'text-orange-400' : 'text-gray-300'
                      }`}>
                        {player.kills}
                      </div>
                      <div className="text-xs text-gray-500">ELIMINATIONS</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/15 to-black" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto relative"
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-3xl blur-2xl opacity-40" />
            <div className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/40 rounded-3xl p-16 text-center cursor-target">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 3, repeat: Infinity }
                }}
                className="w-24 h-24 mx-auto mb-8 relative"
              >
                <Skull className="w-24 h-24 text-red-400" />
                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-3xl animate-pulse" />
              </motion.div>
              
              <h2 className="text-5xl lg:text-6xl xl:text-7xl font-bold font-sans mb-6">
                Enter the <span className="text-red-400">Arena</span>
              </h2>
              
              <div className="mb-8">
                <p className="text-gray-300 text-xl mb-4">
                  <code className="text-red-400 bg-black/50 px-3 py-1 rounded">$ codr --deathmatch</code>
                </p>
                <p className="text-gray-500 text-lg max-w-3xl mx-auto leading-relaxed">
                  The arena awaits. Code fast, eliminate targets, survive the chaos. 
                  <br />
                  <span className="text-red-400 font-bold">Only one can be the last coder standing.</span>
                </p>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-6 justify-center items-center">
                <motion.button
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: '0 0 50px rgba(220, 38, 38, 0.8)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/matchmaking')}
                  className="relative group cursor-target"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition" />
                  <div className="relative bg-red-600 text-white px-16 py-6 rounded-xl font-sans font-bold text-xl flex items-center gap-4">
                    <Crosshair className="w-7 h-7" />
                    <span>JOIN_DEATHMATCH</span>
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-red-500/50 text-red-400 px-16 py-6 rounded-xl font-sans font-bold text-xl hover:bg-red-500/10 transition-colors flex items-center gap-4"
                >
                  <Lock className="w-7 h-7" />
                  <span>SPECTATE_MODE</span>
                </motion.button>
              </div>
              
              <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400">16</div>
                  <div className="text-sm text-gray-500 font-bold">MAX PLAYERS</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400">
                    <span className="text-2xl">60</span>
                    <span className="text-lg text-gray-400">SEC</span>
                  </div>
                  <div className="text-sm text-gray-500 font-bold">PER ROUND</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">1</div>
                  <div className="text-sm text-gray-500 font-bold">SURVIVOR</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <motion.footer 
        className="border-t-2 border-red-500/30 py-16 bg-black/80 backdrop-blur-sm relative z-10 overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-red-400/20 rounded-full"
              animate={{
                x: [-20, vw],
                y: [
                  Math.random() * 200,
                  Math.random() * 200
                ],
                opacity: [0, 0.5, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 12 + Math.random() * 8,
                repeat: Infinity,
                delay: i * 2,
                ease: "linear"
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="flex flex-col lg:flex-row justify-between items-center gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div 
              className="flex items-center gap-4"
              variants={itemVariants}
            >
              <motion.div 
                className="relative"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                  scale: { duration: 3, repeat: Infinity }
                }}
              >
                <Skull className="w-8 h-8 text-red-400" />
                <motion.div 
                  className="absolute inset-0 bg-red-500/20 rounded-full blur-lg"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <motion.span 
                className="text-3xl font-bold font-sans"
                whileHover={{ 
                  scale: 1.05,
                  textShadow: "0 0 20px rgba(255, 255, 255, 0.8)"
                }}
              >
                cod<motion.span 
                  className="text-red-400"
                  animate={{
                    textShadow: [
                      "0 0 5px rgba(220, 38, 38, 0.5)",
                      "0 0 15px rgba(220, 38, 38, 0.8)",
                      "0 0 5px rgba(220, 38, 38, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  R
                </motion.span>
              </motion.span>
              <motion.div 
                className="text-red-400/60 text-sm font-bold tracking-wider"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                DEATHMATCH
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="text-center lg:text-left"
              variants={itemVariants}
            >
              <div className="text-gray-500 text-sm mb-2">
                <motion.code 
                  className="text-red-400"
                  animate={{ 
                    textShadow: [
                      "0 0 0 rgba(220, 38, 38, 0)",
                      "0 0 5px rgba(220, 38, 38, 0.5)",
                      "0 0 0 rgba(220, 38, 38, 0)"
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  © 2025 codR Arena Systems
                </motion.code>
              </div>
              <div className="text-gray-600 text-xs">
                Eliminate. Code. Survive. • Battle Royale Coding Platform
              </div>
              <motion.div 
                className="text-xs text-gray-700 mt-1"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Powered by Quantum Computing & Neural Networks
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-6"
              variants={itemVariants}
            >
              {[
                { Icon: Github, color: "#dc2626" },
                { Icon: Linkedin, color: "#dc2626" },
                { Icon: Terminal, color: "#dc2626" }
              ].map(({ Icon, color }, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ 
                    scale: 1.4, 
                    rotate: [0, -10, 10, 0],
                    color: color
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="relative group cursor-target"
                  transition={{ type: "spring", damping: 15 }}
                >
                  <Icon className="w-6 h-6 text-gray-500 hover:text-red-400 transition-colors" />
                  <motion.div 
                    className="absolute inset-0 bg-red-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute -inset-2 border border-red-500/0 rounded-full"
                    whileHover={{ 
                      borderColor: "rgba(220, 38, 38, 0.5)",
                      scale: 1.2
                    }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="mt-8 pt-8 border-t border-gray-800 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <motion.div 
              className="flex justify-center items-center gap-6 text-xs text-gray-600"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.span variants={itemVariants}>
                ARENA STATUS: <motion.span 
                  className="text-red-400"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ONLINE
                </motion.span>
              </motion.span>
              <motion.span variants={itemVariants}>•</motion.span>
              <motion.span variants={itemVariants}>
                ACTIVE BATTLES: <motion.span 
                  className="text-orange-400"
                  animate={{ 
                    textShadow: [
                      "0 0 0 rgba(251, 146, 60, 0)",
                      "0 0 5px rgba(251, 146, 60, 0.8)",
                      "0 0 0 rgba(251, 146, 60, 0)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  247
                </motion.span>
              </motion.span>
              <motion.span variants={itemVariants}>•</motion.span>
              <motion.span variants={itemVariants}>
                TOTAL ELIMINATIONS: <motion.span 
                  className="text-yellow-400"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    textShadow: [
                      "0 0 0 rgba(250, 204, 21, 0)",
                      "0 0 5px rgba(250, 204, 21, 0.8)",
                      "0 0 0 rgba(250, 204, 21, 0)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  15,347
                </motion.span>
              </motion.span>
            </motion.div>
            
            {/* Additional footer effects */}
            <motion.div
              className="mt-4 text-xs text-gray-700"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              Server Location: Quantum Cloud • Latency: &lt;1ms • Uptime: 99.99%
            </motion.div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}
