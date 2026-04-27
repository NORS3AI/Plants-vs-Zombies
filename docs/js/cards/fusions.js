/**
 * Fusion Plants
 *
 * Evolved plants created by placing 3 of a base plant on the grid.
 * They are never rolled in the shop or in packs — they only come
 * into existence via the merge system in placement.js. Each fusion
 * inherits the abilities of its base plant so the identity carries
 * through the chain.
 *
 * Some chains span two tiers (e.g. Seedling Scrubber → Blooming
 * Scrubber → Scrubber); the middle-tier plants carry their own
 * `evolution` metadata so the merge can cascade.
 *
 * All plants here are category: 'fusion' and notInShop: true.
 */

export const FUSION_PLANTS = [
  // ============================================================
  // Seedling Scrubber → Blooming Scrubber → Scrubber
  // ============================================================
  {
    id: 'blooming_scrubber',
    name: 'Blooming Scrubber',
    type: 'plant',
    rarity: 'common',
    category: 'fusion',
    cost: null,
    sell: { min: 3, max: 5 },
    health: 20,
    damage: 10,
    castTime: 1.3,
    range: 1,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Seedling Scrubbers. Sprouted, fast, a step up.',
    abilities: [],
    notInShop: true,
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'scrubber' },
  },
  {
    id: 'scrubber',
    name: 'Scrubber',
    type: 'plant',
    rarity: 'uncommon',
    category: 'fusion',
    cost: null,
    sell: { min: 4, max: 7 },
    health: 75,
    damage: 40,
    castTime: 1.5,
    range: 1,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Blooming Scrubbers. Full-grown brawler.',
    abilities: [],
    notInShop: true,
    evolution: { requiresCount: 6, requiresSameId: true, intoId: 'epic_scrubber' },
  },

  // ============================================================
  // Ironroot Sentry → Ironroot Archer → Ironroot Knight
  // ============================================================
  {
    id: 'ironroot_archer',
    name: 'Ironroot Archer',
    type: 'plant',
    rarity: 'uncommon',
    category: 'fusion',
    cost: null,
    sell: { min: 4, max: 7 },
    health: 45,
    damage: 20,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Ironroot Sentries. Now shoots at range.',
    abilities: [],
    notInShop: true,
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'ironroot_knight' },
  },
  {
    id: 'ironroot_knight',
    name: 'Ironroot Knight',
    type: 'plant',
    rarity: 'rare',
    category: 'fusion',
    cost: null,
    sell: { min: 5, max: 8 },
    health: 100,
    damage: 65,
    castTime: 1.6,
    range: 1,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Ironroot Archers. Heavy melee champion.',
    abilities: [],
    notInShop: true,
  },

  // ============================================================
  // Frost-Bite Willow → Frozen Willow → Pulsing Willow
  // ============================================================
  {
    id: 'frozen_willow',
    name: 'Frozen Willow',
    type: 'plant',
    rarity: 'epic',
    category: 'fusion',
    cost: null,
    sell: { min: 6, max: 9 },
    health: 120,
    damage: 85,
    castTime: 2.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Frost-Bite Willows. Colder, heavier hits.',
    abilities: [{ type: 'slow_on_hit', percent: 0.6, duration: 2.5 }],
    notInShop: true,
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'pulsing_willow' },
  },
  {
    id: 'pulsing_willow',
    name: 'Pulsing Willow',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 240,
    damage: 160,
    castTime: 2.5,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Frozen Willows. Every hit is a deep freeze.',
    abilities: [{ type: 'slow_on_hit', percent: 0.75, duration: 3.0 }],
    notInShop: true,
  },

  // ============================================================
  // Cinder-Fern → Smoldering Fern → Horned Fern
  // ============================================================
  {
    id: 'smoldering_fern',
    name: 'Smoldering Fern',
    type: 'plant',
    rarity: 'rare',
    category: 'fusion',
    cost: null,
    sell: { min: 5, max: 8 },
    health: 75,
    damage: 40,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Cinder-Ferns. Hotter, faster firebolts.',
    abilities: [{ type: 'projectile', element: 'fire' }],
    notInShop: true,
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'horned_fern' },
  },
  {
    id: 'horned_fern',
    name: 'Horned Fern',
    type: 'plant',
    rarity: 'epic',
    category: 'fusion',
    cost: null,
    sell: { min: 6, max: 9 },
    health: 160,
    damage: 90,
    castTime: 1.6,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Smoldering Ferns. Horned firestorm.',
    abilities: [{ type: 'projectile', element: 'fire' }],
    notInShop: true,
  },

  // ============================================================
  // Void-Petal Bloom → Void Bloom
  // ============================================================
  {
    id: 'void_bloom',
    name: 'Void Bloom',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 120,
    damage: 65,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Void-Petal Blooms. Splash damage through the void.',
    abilities: [{ type: 'splash', radius: 1 }],
    notInShop: true,
  },

  // ============================================================
  // Solar Archon → Solar Breach → Solae
  // (Solae is the only 4-way merge in the game — every other
  //  fusion uses requiresCount: 3.)
  // ============================================================
  {
    id: 'solar_breach',
    name: 'Solar Breach',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 175,
    damage: 150,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Solar Archons. Piercing beam + adjacent heal aura.',
    abilities: [
      { type: 'beam' },
      { type: 'heal_adjacent', value: 8, interval: 2.0 },
    ],
    notInShop: true,
    evolution: { requiresCount: 4, requiresSameId: true, intoId: 'solae' },
  },
  {
    id: 'solae',
    name: 'Solae',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 10, max: 15 },
    health: 500,
    damage: 600,
    castTime: 3.0,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 4 Solar Breaches. Star-forged. Piercing beam + adjacent heal aura.',
    abilities: [
      { type: 'beam' },
      { type: 'heal_adjacent', value: 12, interval: 2.0 },
    ],
    notInShop: true,
  },

  // ============================================================
  // Dragon-Breath Snapdragon → Runite Dragon
  // ============================================================
  {
    id: 'runite_dragon',
    name: 'Runite Dragon',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 100,
    damage: 85,
    castTime: 2.0,
    range: 6,
    attackPattern: 'cone',
    targetingDefault: 'first',
    description: 'Fusion: 3 Dragon-Breath Snapdragons. Runic cone burst.',
    abilities: [{ type: 'cone_damage', width: 3, depth: 6 }],
    notInShop: true,
  },

  // ============================================================
  // Void-Reaper Lily → Void Lily
  // ============================================================
  {
    id: 'void_lily',
    name: 'Void Lily',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 165,
    damage: 80,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Void-Reaper Lilies. Executes sub-15% HP enemies.',
    abilities: [{ type: 'execute', threshold: 0.15, bossExempt: true }],
    notInShop: true,
  },

  // ============================================================
  // Midas Mandrake → Bloody Mandrake
  // ============================================================
  {
    id: 'bloody_mandrake',
    name: 'Bloody Mandrake',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 160,
    damage: 92,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Midas Mandrakes. Blood-for-gold harvest.',
    abilities: [],
    economy: { goldPerKill: 'round_number' },
    notInShop: true,
  },

  // ============================================================
  // Gilded Rose → Thorn (economy)
  // ============================================================
  {
    id: 'thorn',
    name: 'Thorn',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 200,
    damage: 0,
    castTime: 10.0,
    range: 0,
    attackPattern: 'none',
    targetingDefault: 'none',
    description: 'Fusion: 3 Gilded Roses. Generates 120 Gold every 10 seconds.',
    abilities: [],
    economy: { goldPerCast: 120 },
    notInShop: true,
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'pinecone' },
  },

  // ============================================================
  // Lily Weed × 5 → Blue Lily (omni-pattern; hits all 8 directions)
  // ============================================================
  {
    id: 'blue_lily',
    name: 'Blue Lily',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 10, max: 15 },
    health: 300,
    damage: 1000,
    castTime: 0.1,
    range: 2,
    attackPattern: 'omni',
    targetingDefault: 'first',
    description: 'Fusion: 5 Lily Weeds. Lashes in all 8 directions up to 2 tiles away. 0.1s cast, 1000 DMG — deletes anything it catches.',
    abilities: [],
    notInShop: true,
  },

  // ============================================================
  // PACK-EXCLUSIVE FUSION TARGETS (Mythic / Arcane / Frenzy base)
  // ============================================================

  // Bramble-Whip Vine × 3 → Thorned Vine
  {
    id: 'thorned_vine',
    name: 'Thorned Vine',
    type: 'plant',
    rarity: 'uncommon',
    category: 'fusion',
    cost: null,
    sell: { min: 4, max: 7 },
    health: 50,
    damage: 18,
    castTime: 1.8,
    range: 1,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Bramble-Whip Vines. Heavier slows, sturdier.',
    abilities: [{ type: 'slow_on_hit', percent: 0.2, duration: 1.5 }],
    notInShop: true,
  },

  // Glimmer-Spore × 3 → Radiant Spore
  {
    id: 'radiant_spore',
    name: 'Radiant Spore',
    type: 'plant',
    rarity: 'rare',
    category: 'fusion',
    cost: null,
    sell: { min: 5, max: 8 },
    health: 75,
    damage: 35,
    castTime: 1.8,
    range: 8,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Glimmer-Spores. Brighter light, sharper shots.',
    abilities: [{ type: 'reveal_invisible' }],
    notInShop: true,
  },

  // Stone-Root Bulwark × 3 → Granite Bulwark
  {
    id: 'granite_bulwark',
    name: 'Granite Bulwark',
    type: 'plant',
    rarity: 'epic',
    category: 'fusion',
    cost: null,
    sell: { min: 6, max: 9 },
    health: 200,
    damage: 0,
    castTime: 0,
    range: 0,
    attackPattern: 'none',
    targetingDefault: 'none',
    description: 'Fusion: 3 Stone-Root Bulwarks. Immovable wall; reflects 20% of damage.',
    abilities: [{ type: 'reflect_damage', percent: 0.2 }],
    notInShop: true,
  },

  // Amber Grain × 3 → Golden Grain
  {
    id: 'golden_grain',
    name: 'Golden Grain',
    type: 'plant',
    rarity: 'uncommon',
    category: 'fusion',
    cost: null,
    sell: { min: 3, max: 5 },
    health: 50,
    damage: 0,
    castTime: 0,
    range: 0,
    attackPattern: 'none',
    targetingDefault: 'none',
    description: 'Fusion: 3 Amber Grains. +3 Gold per lane kill.',
    abilities: [],
    economy: { goldPerLaneKill: 3 },
    notInShop: true,
  },

  // Storm-Caster Orchid × 3 → Thunder Orchid
  {
    id: 'thunder_orchid',
    name: 'Thunder Orchid',
    type: 'plant',
    rarity: 'rare',
    category: 'fusion',
    cost: null,
    sell: { min: 5, max: 8 },
    health: 80,
    damage: 35,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Storm-Caster Orchids. Lightning arcs to 4 targets.',
    abilities: [{ type: 'chain_lightning', maxJumps: 4, jumpRadius: 3 }],
    notInShop: true,
  },

  // Frost-Thistle × 3 → Glacial Thistle
  {
    id: 'glacial_thistle',
    name: 'Glacial Thistle',
    type: 'plant',
    rarity: 'epic',
    category: 'fusion',
    cost: null,
    sell: { min: 6, max: 9 },
    health: 150,
    damage: 70,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Frost-Thistles. 10% stun chance per hit.',
    abilities: [{ type: 'stun_chance', chance: 0.10, duration: 1.5 }],
    notInShop: true,
  },

  // Elder Oak Aegis × 3 → Ancient Oak
  {
    id: 'ancient_oak',
    name: 'Ancient Oak',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 300,
    damage: 30,
    castTime: 2.5,
    range: 1,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Elder Oak Aegises. 40 HP shield on the plant behind.',
    abilities: [{ type: 'shield_aura', target: 'rear', value: 40 }],
    notInShop: true,
  },

  // Crystal Fern × 3 → Diamond Fern
  {
    id: 'diamond_fern',
    name: 'Diamond Fern',
    type: 'plant',
    rarity: 'epic',
    category: 'fusion',
    cost: null,
    sell: { min: 6, max: 9 },
    health: 150,
    damage: 30,
    castTime: 12.0,
    range: 1,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Crystal Ferns. +15 Gold and 15 HP self-shield every 12 s.',
    abilities: [{ type: 'self_shield', value: 15, interval: 12.0 }],
    economy: { goldPerCast: 15 },
    notInShop: true,
  },

  // Magma-Core Calla × 3 → Volcanic Calla
  {
    id: 'volcanic_calla',
    name: 'Volcanic Calla',
    type: 'plant',
    rarity: 'epic',
    category: 'fusion',
    cost: null,
    sell: { min: 6, max: 9 },
    health: 140,
    damage: 70,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Magma-Core Callas. Hotter scorching fire trail.',
    abilities: [{ type: 'fire_trail', dotPerSec: 12, duration: 4 }],
    notInShop: true,
  },

  // ============================================================
  // Scrubber × 6 → Epic Scrubber
  // ============================================================
  {
    id: 'epic_scrubber',
    name: 'Epic Scrubber',
    type: 'plant',
    rarity: 'epic',
    category: 'fusion',
    cost: null,
    sell: { min: 6, max: 9 },
    health: 125,
    damage: 60,
    castTime: 1.7,
    range: 1.2,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 6 Scrubbers. A living siege engine.',
    abilities: [],
    notInShop: true,
  },

  // ============================================================
  // Thorn × 3 → Pinecone → Acorn
  // ============================================================
  {
    id: 'pinecone',
    name: 'Pinecone',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 10, max: 15 },
    health: 250,
    damage: 0,
    castTime: 8.0,
    range: 0,
    attackPattern: 'none',
    targetingDefault: 'none',
    description: 'Fusion: 3 Thorns. Generates 150 Gold every 8 seconds.',
    abilities: [],
    economy: { goldPerCast: 150 },
    notInShop: true,
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'acorn' },
  },
  {
    id: 'acorn',
    name: 'Acorn',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 12, max: 18 },
    health: 300,
    damage: 0,
    castTime: 5.0,
    range: 0,
    attackPattern: 'none',
    targetingDefault: 'none',
    description: 'Fusion: 3 Pinecones. Generates 300 Gold every 5 seconds. Magic Mushroom tiers up: +50g and +1s cast per tier.',
    abilities: [],
    economy: { goldPerCast: 300 },
    notInShop: true,
    tierEffect: { goldPerTier: 50, castTimePerTier: 1 },
  },
];
