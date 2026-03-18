export interface LoreEntry {
  id: string;
  level: number;
  title: string;
  text: string;
  author: string;
}

export const LORE_FRAGMENTS: LoreEntry[] = [
  {
    id: "L1_01",
    level: 1,
    title: "Scratched Into Stone",
    text: "I found the entrance beneath the old cathedral. The stairway spiraled down for what felt like hours. When I reached the bottom, I turned to look back.\n\nThe door was gone. Only cold stone where the passage had been.\n\nThe walls shifted when I wasn't looking.",
    author: "Dr. Elara Voss, Archaeologist",
  },
  {
    id: "L1_02",
    level: 1,
    title: "Wall Markings",
    text: "The carvings on these walls are not decorative. I've spent years studying dead languages, and even I can only read fragments.\n\n'TURN BACK.'\n'IT REMEMBERS.'\n'THE FRUIT IS A LIE.'\n\nWritten in a script older than any civilization I know.",
    author: "Dr. Elara Voss",
  },
  {
    id: "L1_03",
    level: 1,
    title: "Strange Fruit",
    text: "Oranges. Growing from bare stone, glowing faintly in the dark. No soil, no sunlight, no water.\n\nI ate one. It tasted like warmth — like a memory of sunlight. My exhaustion vanished instantly.\n\nBut I noticed something. After eating it, the walls seemed to pulse. As if the maze itself had felt something.",
    author: "Unknown",
  },
  {
    id: "L2_01",
    level: 2,
    title: "Arranged Bones",
    text: "The bones here are not buried. They are displayed — arranged in patterns along the walls, positioned with deliberate care.\n\nRib cages opened outward like flowers. Skulls facing the path, eye sockets aimed at whoever passes.\n\nSomeone wanted us to see what happens to those who wander too deep.",
    author: "Father Aldric, Clergy",
  },
  {
    id: "L2_02",
    level: 2,
    title: "Other Journals",
    text: "I've found journals from others who were trapped here before me. Dozens of them, wedged into cracks in the walls.\n\nDifferent handwriting. Different centuries. Different languages.\n\nAll of them end the same way:\n\n'It watches from the dark.'",
    author: "Dr. Elara Voss",
  },
  {
    id: "L2_03",
    level: 2,
    title: "Living Growth",
    text: "The moss grows toward me. I marked a passage with chalk an hour ago — the moss has already covered it.\n\nI set my lantern down for a moment. When I picked it up, green tendrils had curled around the handle.\n\nThis place is not abandoned. It is alive. And it is aware.",
    author: "Unknown",
  },
  {
    id: "L3_01",
    level: 3,
    title: "Carved by Fire",
    text: "These caves were not dug or carved. The stone is smooth, melted — the tunnels burned open by something immense passing through.\n\nThe heat still rises from below, centuries later.\n\nI found claw marks in obsidian. Each gouge is wider than my arm.",
    author: "Marcus Fell, Spelunker",
  },
  {
    id: "L3_02",
    level: 3,
    title: "Obsidian Mirrors",
    text: "A chamber of black glass. Every surface reflects.\n\nIn every reflection, I saw something standing behind me. Tall. Still. Patient.\n\nI spun around. Nothing.\n\nBut in the mirror, it was closer.",
    author: "Dr. Elara Voss",
  },
  {
    id: "L4_01",
    level: 4,
    title: "Frozen Witnesses",
    text: "The ice preserves everything here. I can see faces frozen in the walls — mouths open, hands reaching.\n\nThey are not dead. Their eyes follow me.\n\nOne of them mouthed a word as I passed. I could not hear it through the ice, but I could read her lips:\n\n'Run.'",
    author: "Unknown",
  },
  {
    id: "L4_02",
    level: 4,
    title: "Lost Time",
    text: "My watch stopped. I don't know if it's been hours or days.\n\nI tried counting my heartbeats to mark time, but the cold makes everything slow. My thoughts drift. I keep forgetting where I came from.\n\nThe maze doesn't just trap your body. It erodes your mind. You forget why you're running. You forget there was ever an outside.",
    author: "Father Aldric",
  },
  {
    id: "L5_01",
    level: 5,
    title: "The Name in the Runes",
    text: "The runes pulse with violet light. I can finally read them — not because I learned the language, but because the maze wants me to understand.\n\nThey spell a name. The name of the one who built this place. The one who waits at the center.\n\nI dare not write it. Names have power here. Especially his.",
    author: "Dr. Elara Voss",
  },
  {
    id: "L5_02",
    level: 5,
    title: "The Truth of the Oranges",
    text: "I understand now.\n\nThe maze does not trap us. It feeds on us. Every orange collected is crystallized life force — the essence of a previous soul who walked these corridors and never left.\n\nEvery step taken, every moment of fear, strengthens the one who dwells at the heart.\n\nWe are not prisoners. We are sustenance.",
    author: "Dr. Elara Voss",
  },
  {
    id: "L5_03",
    level: 5,
    title: "Final Testament",
    text: "To whoever finds this:\n\nI have walked every corridor. I have read every fragment. I know what waits ahead.\n\nThe only way out is through. You must face the Shadow Lord. He cannot be avoided — the maze reshapes itself to lead you to him.\n\nBut know this: he was human once, too. The first explorer. The one who ate every orange and stayed too long.\n\nDefeat him. It is the only mercy left — for him and for us.",
    author: "Dr. Elara Voss — Final Entry",
  },
];

export function getLoreForLevel(level: number): LoreEntry[] {
  return LORE_FRAGMENTS.filter((l) => l.level === level);
}

const DISCOVERED_KEY = "maze_runner_lore";

export function getDiscoveredLore(): Set<string> {
  try {
    const raw = localStorage.getItem(DISCOVERED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function markLoreDiscovered(id: string): Set<string> {
  const discovered = getDiscoveredLore();
  discovered.add(id);
  try {
    localStorage.setItem(DISCOVERED_KEY, JSON.stringify([...discovered]));
  } catch {}
  return discovered;
}

export function getAllDiscoveredEntries(): LoreEntry[] {
  const discovered = getDiscoveredLore();
  return LORE_FRAGMENTS.filter((l) => discovered.has(l.id));
}
