"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, User, Shield, Code, Zap, Wifi, Activity, Cpu, Globe, Radar, Target, Crosshair, Users, Timer, Gamepad2, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MatchmakingPage = () => {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [foundOpponent, setFoundOpponent] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [searchCancelled, setSearchCancelled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [teamSize, setTeamSize] = useState("1v1");
  const [gameMode, setGameMode] = useState("deathmatch");
  const [matchTime, setMatchTime] = useState(60);
  const [isSearching, setIsSearching] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const [networkNodes, setNetworkNodes] = useState(847);
  const [pingValue, setPingValue] = useState(12);
  const [searchRadius, setSearchRadius] = useState(0);
  const [foundPlayers, setFoundPlayers] = useState([]);
  const [systemLoad, setSystemLoad] = useState(45);
  const [radarSweep, setRadarSweep] = useState(0);
  const terminalRef = useRef(null);

  // Team size options
  const teamSizes = ["1v1", "2v2", "3v3", "4v4"];

  // Game mode options
  const gameModes = [
    { id: 'deathmatch', name: 'Deathmatch', description: 'Free-for-all elimination' },
    { id: 'capture_the_flag', name: 'Capture The Flag', description: 'Steal the enemy flag and return it to base' },
    { id: 'king_of_the_hill', name: 'King of the Hill', description: 'Control the hill for points' },
    { id: 'escort', name: 'Escort', description: 'Escort the payload to the destination' }
  ];

  // Set match time based on team size
  useEffect(() => {
    switch(teamSize) {
      case "1v1": setMatchTime(60); break;
      case "2v2": setMatchTime(90); break;
      case "3v3": setMatchTime(120); break;
      case "4v4": setMatchTime(180); break;
      default: setMatchTime(60);
    }
  }, [teamSize]);

  // Mock opponent data with more detailed stats
  const mockOpponents = [
    {
      username: "dev_rage",
      avatar: "https://github.com/github.png",
      rank: "Silver III",
      languages: ["JavaScript", "Python", "Go"],
      wins: 47,
      losses: 23,
      specialty: "Full-Stack Destroyer",
      killStreak: 12,
      avgResponseTime: 2.3,
      location: "Tokyo, JP",
      status: "online",
      weaponPreference: "JS_RIFLE"
    },
    {
      username: "code_ninja",
      avatar: "https://github.com/github.png", 
      rank: "Gold I",
      languages: ["Rust", "C++", "TypeScript"],
      wins: 89,
      losses: 34,
      specialty: "Systems Architect",
      killStreak: 8,
      avgResponseTime: 1.8,
      location: "Berlin, DE",
      status: "in_match",
      weaponPreference: "RUST_SNIPER"
    },
    {
      username: "byte_hunter",
      avatar: "https://github.com/github.png",
      rank: "Platinum II", 
      languages: ["Java", "Kotlin", "Swift"],
      wins: 156,
      losses: 67,
      specialty: "Mobile Dominator",
      killStreak: 23,
      avgResponseTime: 1.5,
      location: "San Francisco, US",
      status: "searching",
      weaponPreference: "JAVA_CARBINE"
    },
    {
      username: "syntax_slayer",
      avatar: "https://github.com/github.png",
      rank: "Diamond I",
      languages: ["Python", "Go", "Rust", "C++"],
      wins: 234,
      losses: 45,
      specialty: "Algorithm Assassin",
      killStreak: 34,
      avgResponseTime: 1.2,
      location: "Stockholm, SE",
      status: "online",
      weaponPreference: "PYTHON_RAILGUN"
    },
    {
      username: "null_pointer",
      avatar: "https://github.com/github.png",
      rank: "Master",
      languages: ["Assembly", "C", "Rust", "Go"],
      wins: 445,
      losses: 78,
      specialty: "Low-Level Lunatic", 
      killStreak: 67,
      avgResponseTime: 0.9,
      location: "Zurich, CH",
      status: "online",
      weaponPreference: "ASM_CANNON"
    }
  ];

  const terminalSequence = [
    "> Initializing codeR protocol...",
    "> Authenticating user credentials...",
    "> Connected to global coding network.",
    "> Scanning available opponents...",
    "> Analyzing skill compatibility...",
    "> Cross-referencing battle histories...",
    "> Establishing secure connection...",
    "> Match found! Initializing combat environment...",
    "> Preparing battlefield protocols...",
    "> Ready for engagement."
  ];

  const startSearch = () => {
    setIsSearching(true);
    setShowOptions(false);
    setSearchRadius(0);
    setFoundPlayers([]);
    
    // Add initial logs about selected options
    setLogs([
      { 
        id: 'config-1', 
        text: `> MATCHMAKING_CONFIG: TEAM_SIZE=${teamSize}`, 
        timestamp: new Date().toLocaleTimeString(),
        type: 'config'
      },
      { 
        id: 'config-2', 
        text: `> MATCHMAKING_CONFIG: GAME_MODE=${gameMode}`, 
        timestamp: new Date().toLocaleTimeString(),
        type: 'config'
      },
      { 
        id: 'config-3', 
        text: `> MATCHMAKING_CONFIG: ROUND_TIME=${matchTime}s`, 
        timestamp: new Date().toLocaleTimeString(),
        type: 'config'
      },
    ]);
    
    // Start radar expansion
    const radarExpansion = setInterval(() => {
      setSearchRadius(prev => {
        if (prev >= 100) {
          clearInterval(radarExpansion);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
    
    // Simulate finding players during search
    setTimeout(() => {
      const foundPlayersList = mockOpponents.slice(0, 3).map((player, i) => ({
        ...player,
        distance: Math.floor(Math.random() * 500) + 100,
        compatibility: Math.floor(Math.random() * 40) + 60
      }));
      setFoundPlayers(foundPlayersList);
    }, 3000);
    
    // Start the search sequence after displaying config
    setTimeout(() => {
      runSearchSequence();
    }, 1500);
  };
  
  const runSearchSequence = () => {
    const addLog = (index) => {
      if (index >= terminalSequence.length) {
        // Sequence complete, reveal opponent
        setTimeout(() => {
          const randomOpponent = mockOpponents[Math.floor(Math.random() * mockOpponents.length)];
          setOpponent(randomOpponent);
          setFoundOpponent(true);
        }, 1500);
        return;
      }

      setTimeout(() => {
        setLogs(prev => [...prev, { 
          id: `search-${index}`, 
          text: terminalSequence[index], 
          timestamp: new Date().toLocaleTimeString(),
          type: 'search'
        }]);
        
        // Auto-scroll terminal
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
        
        addLog(index + 1);
      }, Math.random() * 1000 + 800); // Random delay between 800-1800ms
    };

    addLog(0);
  };

  useEffect(() => {
    if (searchCancelled) {
      setIsSearching(false);
      setShowOptions(true);
      setLogs([]);
    }
  }, [searchCancelled]);

  const handleCancelSearch = () => {
    if (isSearching) {
      setSearchCancelled(true);
      setIsSearching(false);
      setShowOptions(true);
      setLogs([]);
    } else {
      router.push('/');
    }
  };
  
  const selectRandomOptions = () => {
    // Randomly select team size
    const randomTeamSize = teamSizes[Math.floor(Math.random() * teamSizes.length)];
    setTeamSize(randomTeamSize);
    
    // Randomly select game mode
    const randomGameMode = gameModes[Math.floor(Math.random() * gameModes.length)].id;
    setGameMode(randomGameMode);
    
    // Start search with random selections
    setTimeout(startSearch, 500);
  };

  const handleStartBattle = () => {
    // Navigate to battle page (to be created)
    router.push('/battle');
  };

  const getRankColor = (rank) => {
    if (rank.includes('Silver')) return 'text-gray-400';
    if (rank.includes('Gold')) return 'text-yellow-400';
    if (rank.includes('Platinum')) return 'text-blue-400';
    if (rank.includes('Diamond')) return 'text-purple-400';
    return 'text-green-400';
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        {/* Matrix-style falling code */}
        {mounted && [...Array(30)].map((_, i) => (
          <motion.div
            key={`code-${i}`}
            className="absolute text-green-500/20 font-mono text-xs"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: -20,
              opacity: 0 
            }}
            animate={{ 
              y: (typeof window !== 'undefined' ? window.innerHeight : 1080) + 20,
              opacity: [0, 0.8, 0]
            }}
            transition={{ 
              duration: Math.random() * 10 + 15,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          >
            {Math.random().toString(36).substring(2, 15)}
          </motion.div>
        ))}
        
        {/* Network connection lines */}
        {mounted && [...Array(8)].map((_, i) => (
          <motion.div
            key={`network-${i}`}
            className="absolute w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent"
            style={{
              left: `${10 + i * 12}%`,
              height: '100%'
            }}
            animate={{
              opacity: [0.1, 0.6, 0.1],
              scaleY: [1, 1.2, 1]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
        
        {/* Floating data packets */}
        {mounted && [...Array(15)].map((_, i) => (
          <motion.div
            key={`packet-${i}`}
            className="absolute w-2 h-2 bg-cyan-400/40 rounded-full"
            initial={{
              x: -20,
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)
            }}
            animate={{
              x: (typeof window !== 'undefined' ? window.innerWidth : 1920) + 20,
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "linear"
            }}
          />
        ))}
        
        {/* Pulsing network nodes */}
        {mounted && [...Array(12)].map((_, i) => (
          <motion.div
            key={`node-${i}`}
            className="absolute w-3 h-3 border border-green-500/40 rounded-full"
            style={{
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 90 + 5}%`
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
              borderColor: [
                "rgba(34, 197, 94, 0.4)",
                "rgba(6, 182, 212, 0.6)", 
                "rgba(34, 197, 94, 0.4)"
              ]
            }}
            transition={{
              duration: 2 + Math.random(),
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>

      {/* Enhanced Terminal Header with System Stats */}
      <div className="relative z-10 border-b border-green-500/30 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <motion.button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-green-500/10 rounded-lg transition-colors cursor-target"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowLeft className="w-5 h-5 text-green-400" />
              </motion.button>
              <div className="font-mono text-green-400">
                <span className="text-xl font-bold">codeR</span>
                <span className="text-green-500/60 ml-2">// Matchmaking Terminal v3.1</span>
              </div>
            </div>
            
            {/* System Status Indicators */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs text-cyan-400">{networkNodes} nodes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-yellow-400" />
                <span className="font-mono text-xs text-yellow-400">{pingValue}ms</span>
              </div>
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-red-400" />
                <span className="font-mono text-xs text-red-400">{systemLoad}%</span>
              </div>
              <motion.div
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-green-400 font-mono"
              >
                █
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Enhanced Terminal Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Terminal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/70 border border-green-500/40 rounded-lg backdrop-blur-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 px-6 py-3 border-b border-green-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>
                    <span className="text-green-400 font-mono text-sm">terminal@codeR:~$</span>
                  </div>
                  {isSearching && (
                    <div className="flex items-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border border-green-500/60 border-t-green-500 rounded-full"
                      />
                      <span className="text-green-400 font-mono text-xs">SCANNING</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div 
                ref={terminalRef}
                className="h-96 overflow-y-auto font-mono text-sm p-6 space-y-3"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,20,0,0.95) 100%)'
                }}
              >
                <AnimatePresence>
                  {logs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ 
                        delay: index * 0.1,
                        type: "spring",
                        damping: 25,
                        stiffness: 120
                      }}
                      className="flex items-start space-x-3 group"
                    >
                      <span className="text-green-500/60 text-xs mt-0.5 select-none min-w-[70px]">
                        [{log.timestamp}]
                      </span>
                      <div className="flex-1">
                        <motion.span
                          className={`${
                            log.type === 'config' ? 'text-cyan-400' :
                            log.type === 'search' ? 'text-green-400' :
                            'text-yellow-400'
                          } group-hover:text-white transition-colors`}
                          whileHover={{ scale: 1.02 }}
                        >
                          {log.text}
                        </motion.span>
                        {index === logs.length - 1 && !foundOpponent && (
                          <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="text-green-400 ml-1"
                          >
                            █
                          </motion.span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {!foundOpponent && logs.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pt-4 border-t border-green-500/20"
                  >
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-green-500/60 font-mono text-xs"
                    >
                      Network scan active... {networkNodes} nodes | {foundPlayers.length} potential matches
                    </motion.div>
                    
                    {/* Live search stats */}
                    <div className="mt-2 grid grid-cols-3 gap-4 text-xs">
                      <div className="bg-black/40 rounded p-2 border border-green-500/20">
                        <div className="text-green-400">RADIUS</div>
                        <div className="text-white font-bold">{searchRadius}%</div>
                      </div>
                      <div className="bg-black/40 rounded p-2 border border-cyan-500/20">
                        <div className="text-cyan-400">FOUND</div>
                        <div className="text-white font-bold">{foundPlayers.length}</div>
                      </div>
                      <div className="bg-black/40 rounded p-2 border border-yellow-500/20">
                        <div className="text-yellow-400">PING</div>
                        <div className="text-white font-bold">{pingValue}ms</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
            {/* Match Summary & Actions (placed below terminal) */}
            {foundOpponent && opponent && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-black/40 border border-green-500/20 rounded-lg p-4 backdrop-blur-sm"
              >
                <div className="text-red-400 font-mono text-sm flex items-center mb-3">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  BATTLE_CONFIG
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-black/30 rounded p-2 text-center border border-green-500/10">
                    <div className="text-green-300 font-mono text-xs">MODE</div>
                    <div className="text-white font-mono text-sm font-bold truncate">{gameModes.find(m => m.id === gameMode)?.name || gameMode}</div>
                  </div>
                  <div className="bg-black/30 rounded p-2 text-center border border-green-500/10">
                    <div className="text-green-300 font-mono text-xs">TEAM</div>
                    <div className="text-white font-mono text-sm font-bold">{teamSize}</div>
                  </div>
                  <div className="bg-black/30 rounded p-2 text-center border border-green-500/10">
                    <div className="text-green-300 font-mono text-xs">TIME</div>
                    <div className="text-white font-mono text-sm font-bold">{matchTime}s</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.button
                    onClick={handleStartBattle}
                    className="w-full bg-transparent border border-green-500/20 text-white py-3 px-4 rounded-lg font-mono font-bold transition-all"
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(34, 197, 94, 0.06)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Target className="w-4 h-4 inline mr-2 text-green-300" />
                    ENGAGE_COMBAT
                  </motion.button>
                  <motion.button
                    className="w-full bg-transparent border border-green-500/20 text-white py-3 px-4 rounded-lg font-mono transition-all"
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(34, 197, 94, 0.04)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <User className="w-4 h-4 inline mr-2 text-green-300" />
                    VIEW_FULL_PROFILE
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Enhanced Control Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/50 border border-green-500/30 rounded-lg p-6 backdrop-blur-md"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  onClick={handleCancelSearch}
                  disabled={foundOpponent}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-3 px-4 rounded-lg font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-target"
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(239, 68, 68, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-4 h-4 inline mr-2" />
                  {isSearching ? 'ABORT' : 'EXIT'}
                </motion.button>
                
                {isSearching && (
                  <motion.button
                    onClick={() => {
                      setIsSearching(false);
                      setShowOptions(true);
                      setLogs([]);
                    }}
                    disabled={foundOpponent}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 py-3 px-4 rounded-lg font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-target"
                    whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(234, 179, 8, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    RECONFIGURE
                  </motion.button>
                )}
                
                <motion.button
                  disabled={!foundOpponent}
                  className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 py-3 px-4 rounded-lg font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-target"
                  whileHover={{ scale: foundOpponent ? 1.02 : 1, boxShadow: foundOpponent ? "0 0 20px rgba(59, 130, 246, 0.3)" : "none" }}
                  whileTap={{ scale: foundOpponent ? 0.98 : 1 }}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  SPECTATE
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Radar & Opponent Display */}
          <div className="space-y-6">
            {/* Radar Scanner */}
            {isSearching && !foundOpponent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/70 border border-cyan-500/40 rounded-lg p-6 backdrop-blur-md"
              >
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Radar className="w-5 h-5 text-cyan-400" />
                    <span className="text-cyan-400 font-mono text-sm">OPPONENT_SCANNER</span>
                  </div>
                  <div className="text-cyan-300/60 font-mono text-xs">Range: {searchRadius}% | Targets: {foundPlayers.length}</div>
                </div>
                
                {/* Radar Display */}
                <div className="relative w-64 h-64 mx-auto">
                  {/* Radar Background */}
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 bg-gradient-radial from-cyan-500/5 to-transparent"></div>
                  <div className="absolute inset-4 rounded-full border border-cyan-500/20"></div>
                  <div className="absolute inset-8 rounded-full border border-cyan-500/15"></div>
                  <div className="absolute inset-12 rounded-full border border-cyan-500/10"></div>
                  
                  {/* Center crosshair */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Crosshair className="w-4 h-4 text-cyan-400" />
                  </div>
                  
                  {/* Radar sweep */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 w-0 h-0 transform -translate-x-1/2 -translate-y-1/2"
                    style={{ transformOrigin: 'center' }}
                  >
                    <motion.div
                      className="w-32 h-px bg-gradient-to-r from-cyan-400 to-transparent"
                      animate={{ rotate: radarSweep }}
                      transition={{ duration: 0.05, ease: "linear" }}
                      style={{ transformOrigin: 'left center' }}
                    />
                  </motion.div>
                  
                  {/* Search radius indicator */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-green-400/50"
                    style={{
                      transform: `scale(${searchRadius / 100})`,
                      transformOrigin: 'center'
                    }}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* Found players */}
                  {foundPlayers.map((player, i) => (
                    <motion.div
                      key={player.username}
                      className="absolute w-2 h-2 bg-red-400 rounded-full"
                      style={{
                        left: `${45 + Math.cos(i * 60) * 20}%`,
                        top: `${45 + Math.sin(i * 60) * 20}%`
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.5, 1], 
                        opacity: 1,
                        boxShadow: [
                          "0 0 0 rgba(248, 113, 113, 0)",
                          "0 0 20px rgba(248, 113, 113, 0.8)",
                          "0 0 10px rgba(248, 113, 113, 0.4)"
                        ]
                      }}
                      transition={{ 
                        delay: i * 0.5,
                        duration: 0.5,
                        boxShadow: { duration: 2, repeat: Infinity }
                      }}
                    />
                  ))}
                </div>
                
                {/* Found Players List */}
                {foundPlayers.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-cyan-400 font-mono text-xs mb-2">DETECTED TARGETS:</div>
                    {foundPlayers.map((player, i) => (
                      <motion.div
                        key={player.username}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.3 }}
                        className="flex items-center justify-between bg-black/40 rounded px-3 py-2 border border-cyan-500/20"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                          <span className="text-white font-mono text-xs">{player.username}</span>
                        </div>
                        <div className="text-cyan-400 font-mono text-xs">
                          {player.compatibility}% | {player.distance}km
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Opponent Found Display */}
            <AnimatePresence>
              {foundOpponent && opponent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                  transition={{ 
                    duration: 1,
                    type: "spring",
                    damping: 15,
                    stiffness: 100
                  }}
                  className="bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 border-2 border-red-500/40 rounded-xl p-6 backdrop-blur-md relative overflow-hidden"
                >
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                    }} />
                  </div>
                  
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-bold text-red-400 font-mono mb-3"
                      >
                        MATCH_FOUND
                      </motion.h2>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"
                      />
                    </div>

                    {/* Enhanced Opponent Info */}
                    <div className="space-y-6">
                      {/* Avatar & Basic Info */}
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center space-x-4"
                      >
                        <div className="relative">
                          <motion.img
                            src={opponent.avatar}
                            alt={opponent.username}
                            className="w-20 h-20 rounded-xl border-3 border-red-500/60"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          />
                          <motion.div
                            className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-black flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </motion.div>
                        </div>
                        <div className="flex-1">
                          <motion.div
                            className="text-2xl font-bold text-red-400 font-mono mb-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                          >
                            @{opponent.username}
                          </motion.div>
                          <div className={`text-sm font-mono mb-2 ${getRankColor(opponent.rank)}`}>
                            <Shield className="w-4 h-4 inline mr-1" />
                            {opponent.rank}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {opponent.location} • {opponent.avgResponseTime}s avg
                          </div>
                        </div>
                      </motion.div>

                      {/* Enhanced Stats Grid */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="bg-black/40 rounded-lg p-4 border border-green-500/30 relative overflow-hidden">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          />
                          <div className="relative z-10">
                            <div className="text-green-400 font-mono text-sm">WINS</div>
                            <motion.div
                              className="text-2xl font-bold text-white"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 1, type: "spring" }}
                            >
                              {opponent.wins}
                            </motion.div>
                          </div>
                        </div>
                        <div className="bg-black/40 rounded-lg p-4 border border-red-500/30 relative overflow-hidden">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1 }}
                          />
                          <div className="relative z-10">
                            <div className="text-red-400 font-mono text-sm">LOSSES</div>
                            <motion.div
                              className="text-2xl font-bold text-white"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 1.1, type: "spring" }}
                            >
                              {opponent.losses}
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Kill Streak & Performance */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="bg-black/30 rounded-lg p-4 border border-purple-500/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-400 font-mono text-sm">CURRENT_STREAK</span>
                          <Zap className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-purple-300 mb-2">{opponent.killStreak}</div>
                        <div className="text-xs text-gray-400">
                          Preferred: {opponent.weaponPreference}
                        </div>
                      </motion.div>

                      {/* Languages */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.3 }}
                        className="space-y-3"
                      >
                        <div className="text-yellow-400 font-mono text-sm flex items-center">
                          <Code className="w-4 h-4 mr-2" />
                          ARSENAL
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {opponent.languages.map((lang, i) => (
                            <motion.span
                              key={i}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.4 + i * 0.1 }}
                              className="px-3 py-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 rounded-lg text-xs font-mono font-bold"
                              whileHover={{ scale: 1.1, backgroundColor: "rgba(234, 179, 8, 0.3)" }}
                            >
                              {lang}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>

                      {/* Specialty */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/30"
                      >
                        <div className="text-purple-400 font-mono text-sm flex items-center mb-2">
                          <Target className="w-4 h-4 mr-2" />
                          SPECIALTY
                        </div>
                        <div className="text-purple-300 font-mono text-lg font-bold">
                          {opponent.specialty}
                        </div>
                      </motion.div>
                      
                      {/* Match details moved above (below terminal) to avoid duplication */}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Game Configuration Panel */}
            {!foundOpponent && showOptions && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-black/60 to-gray-900/60 border-2 border-green-500/30 rounded-xl p-6 backdrop-blur-md relative overflow-hidden"
              >
                {/* Animated grid background */}
                <div className="absolute inset-0 opacity-10">
                  <div 
                    className="w-full h-full"
                    style={{
                      backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity }
                      }}
                      className="w-4 h-4 bg-green-500 rounded-full"
                    />
                    <span className="text-green-400 font-mono text-lg font-bold">BATTLE_CONFIGURATION</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent" />
                  </div>
                  
                  {/* Team Size Selection */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                  >
                    <div className="font-mono text-green-400 mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      <span className="text-green-500/60 mr-2">[1]</span> 
                      SELECT_TEAM_SIZE
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {teamSizes.map((size, i) => (
                        <motion.button
                          key={size}
                          onClick={() => setTeamSize(size)}
                          className={`py-2 px-3 font-mono text-sm border rounded-md transition-all relative overflow-hidden ${
                            teamSize === size 
                              ? 'bg-green-500/20 border-green-500/60 text-green-400 shadow-md shadow-green-500/10' 
                              : 'border-green-500/20 text-green-500/60 hover:bg-green-500/10 hover:border-green-500/40'
                          }`}
                          whileHover={{ scale: 1.04, y: -1 }}
                          whileTap={{ scale: 0.96 }}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.08 }}
                        >
                          {teamSize === size && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-green-500/8 to-transparent"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                            />
                          )}
                          <div className="relative z-10 font-bold">{size}</div>
                        </motion.button>
                      ))}
                    </div>
                    <motion.div
                      className="font-mono text-green-500/60 text-sm mt-2 flex items-center"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Timer className="w-4 h-4 mr-1" />
                      DURATION: {matchTime}s per round
                    </motion.div>
                  </motion.div>
                  
                  {/* Game Mode Selection */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8"
                  >
                    <div className="font-mono text-green-400 mb-4 flex items-center">
                      <Gamepad2 className="w-5 h-5 mr-2" />
                      <span className="text-green-500/60 mr-2">[2]</span> 
                      SELECT_GAME_MODE
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {gameModes.map((mode, i) => (
                        <motion.button
                          key={mode.id}
                          onClick={() => setGameMode(mode.id)}
                          className={`py-2 px-3 font-mono text-sm text-left border rounded-md transition-all relative overflow-hidden ${
                            gameMode === mode.id 
                              ? 'bg-green-500/20 border-green-500/60 text-green-400 shadow-md shadow-green-500/10' 
                              : 'border-green-500/20 text-green-500/60 hover:bg-green-500/10 hover:border-green-500/40'
                          }`}
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + i * 0.08 }}
                        >
                          {gameMode === mode.id && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-green-500/8 to-transparent"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            />
                          )}
                          <div className="relative z-10">
                            <div className="font-bold text-base">{mode.name}</div>
                            <div className="text-xs opacity-70 mt-1 truncate">{mode.description}</div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                  
                  {/* Enhanced Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <motion.button
                      onClick={startSearch}
                      className="bg-transparent border border-green-500/20 text-green-400 font-mono py-3 px-4 rounded-lg font-bold transition-all relative overflow-hidden"
                      whileHover={{ 
                        scale: 1.03, 
                        boxShadow: "0 8px 30px rgba(34, 197, 94, 0.08)",
                        y: -1
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/6 to-white/0"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="relative z-10 flex items-center justify-center text-sm">
                        <Target className="w-4 h-4 mr-2" />
                        INITIATE_SEARCH
                      </div>
                    </motion.button>
                    
                    <motion.button
                      onClick={selectRandomOptions}
                      className="bg-transparent border border-green-500/20 text-green-400 font-mono py-3 px-4 rounded-lg font-bold transition-all relative overflow-hidden"
                      whileHover={{ 
                        scale: 1.03, 
                        boxShadow: "0 8px 30px rgba(59, 130, 246, 0.06)",
                        y: -1
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/6 to-white/0"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="relative z-10 flex items-center justify-center text-sm">
                        <Zap className="w-4 h-4 mr-2" />
                        RANDOM_CONFIG
                      </div>
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            )}
            
            {/* Enhanced Waiting State */}
            {!foundOpponent && isSearching && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/40 border border-green-500/20 rounded-lg p-8 backdrop-blur-sm text-center relative overflow-hidden"
              >
                {/* Animated scanning lines */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="relative z-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 border-4 border-green-500/30 border-t-green-500 border-r-green-500 rounded-full mx-auto mb-6"
                  />
                  
                  <motion.div
                    className="text-green-400 font-mono text-2xl font-bold mb-4"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    NETWORK_SCANNING
                  </motion.div>
                  
                  <div className="text-green-500/60 font-mono text-lg mb-6">
                    Locating worthy adversaries...
                  </div>
                  
                  {/* Enhanced search parameters display */}
                  <div className="bg-black/40 rounded-lg p-4 border border-green-500/20">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-green-400 font-mono font-bold">{teamSize}</div>
                        <div className="text-green-500/60 text-xs">TEAM SIZE</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400 font-mono font-bold">
                          {gameModes.find(m => m.id === gameMode)?.name || gameMode}
                        </div>
                        <div className="text-green-500/60 text-xs">GAME MODE</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400 font-mono font-bold">{matchTime}s</div>
                        <div className="text-green-500/60 text-xs">DURATION</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchmakingPage;