/**
 * Aether-Root Spells
 *
 * Side-panel spells that the PLAYER actively casts during combat.
 * These are the only mid-round player intervention. Each has a cooldown
 * (or once-per-round limit) instead of a gold cost.
 *
 * Obtained ONLY from card packs (Mythic / Arcane / Frenzy). They never
 * appear in the regular shop and don't take up a normal deck slot —
 * they live in their own side-panel inventory implemented in Phase 9.
 *
 * Schema:
 *   { id, name, type:'spell', rarity, category:'aether_root', pack,
 *     cooldown (sec) OR oncePerRound (bool), description, effect:{...} }
 */

export const AETHER_ROOT_SPELLS = [
  {
    id: 'sap_mend',
    name: 'Sap-Mend',
    type: 'spell',
    rarity: 'common',
    category: 'aether_root',
    pack: 'mythic', // Drops from Mythic packs
    cost: null,
    sell: { min: 2, max: 4 },
    cooldown: 15,
    description: 'Restores 10 HP to the Aether-Root.',
    effect: { type: 'heal_aether', value: 10 },
  },
  {
    id: 'grove_shield',
    name: 'Grove-Shield',
    type: 'spell',
    rarity: 'uncommon',
    category: 'aether_root',
    pack: 'mythic',
    cost: null,
    sell: { min: 3, max: 5 },
    cooldown: 30,
    description: 'Grants the Aether-Root a Shield equal to 25 HP. Damage is taken by the shield first.',
    effect: { type: 'shield_aether', value: 25 },
  },
  {
    id: 'thorn_pulse',
    name: 'Thorn-Pulse',
    type: 'spell',
    rarity: 'rare',
    category: 'aether_root',
    pack: 'arcane',
    cost: null,
    sell: { min: 4, max: 7 },
    cooldown: 45,
    description: 'Emits a shockwave from the Aether-Root that knocks all zombies back 2 tiles.',
    effect: { type: 'knockback_all', tiles: 2 },
  },
  {
    id: 'photosynthetic_burst',
    name: 'Photosynthetic Burst',
    type: 'spell',
    rarity: 'rare',
    category: 'aether_root',
    pack: 'arcane',
    cost: null,
    sell: { min: 4, max: 7 },
    cooldown: 60,
    description: 'Instantly grants 5 Gold but reduces the Aether-Root\'s current health by 5 HP.',
    effect: { type: 'gold_for_hp', gold: 5, hpCost: 5 },
  },
  {
    id: 'natures_wrath',
    name: 'Nature\'s Wrath',
    type: 'spell',
    rarity: 'epic',
    category: 'aether_root',
    pack: 'frenzy',
    cost: null,
    sell: { min: 5, max: 8 },
    cooldown: 90,
    description: 'For 5 seconds, the Aether-Root shoots a high-damage beam down the center lane.',
    effect: { type: 'beam_lane', lane: 'center', duration: 5, dpsMultiplier: 4 },
  },
  {
    id: 'verdant_rebirth',
    name: 'Verdant Rebirth',
    type: 'spell',
    rarity: 'legendary',
    category: 'aether_root',
    pack: 'frenzy',
    cost: null,
    sell: { min: 6, max: 10 },
    oncePerRound: true,
    cooldown: null,
    description: 'Fully heals the Aether-Root and adds a 50 HP Shield. Only usable once per round.',
    effect: { type: 'heal_aether', value: 'full', shield: 50 },
  },
];
