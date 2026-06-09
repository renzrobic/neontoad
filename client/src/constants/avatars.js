/**
 * NEONTOAD PLATFORM - GLOBAL AVATAR CONFIGURATION
 * 
 * TOAD COLOR MAPPING (Top/Bottom Pairs):
 * 1. Classic: Light Green (#86E95C) & Dark Green (#083400)
 * 2. Neon:    Peach (#FFBC88) & Dark Purple (#2B0B37)
 * 3. Cyber:   Yellow (#FFE94B) & Olive Brown (#3B3318)
 * 4. Ghost:   Cyan (#8CE3E2) & Dark Grey (#20231C)
 * 5. Minimal: Pink (#FFD5F0) & Dark Red (#370305)
 */

// Global fallback remains the Minimalist Toad vector.
export const DEFAULT_AVATAR = '/assets/avatars/toads/toad-classic.svg';

export const getRandomToadAvatar = () => {
  const toadSeries = AVATAR_SERIES.find(s => s.id === 'neontoad');
  if (toadSeries && toadSeries.characters.length > 0) {
    const randomIndex = Math.floor(Math.random() * toadSeries.characters.length);
    return toadSeries.characters[randomIndex].image;
  }
  return DEFAULT_AVATAR;
};

export const AVATAR_SERIES = [
  {
    id: 'neontoad',
    name: 'NeonToad Originals',
    characters: [
      { id: 'toad-classic', name: 'Classic Green', image: '/assets/avatars/toads/toad-classic.svg' }, // Pair: #86E95C / #083400
      { id: 'toad-neon', name: 'Neon Purple', image: '/assets/avatars/toads/toad-neon.svg' },       // Pair: #FFBC88 / #2B0B37
      { id: 'toad-cyber', name: 'Cyber Yellow', image: '/assets/avatars/toads/toad-cyber.svg' },    // Pair: #FFE94B / #3B3318
      { id: 'toad-ghost', name: 'Ghost Cyan', image: '/assets/avatars/toads/toad-ghost.svg' },      // Pair: #8CE3E2 / #20231C
      { id: 'toad-minimal', name: 'Minimal Pink', image: '/assets/avatars/toads/toad-minimal.svg' } // Pair: #FFD5F0 / #370305
    ]
  },
  {
    id: 'mushoku',
    name: 'Mushoku Tensei',
    characters: [
      { id: 'rudeus', name: 'Rudeus Greyrat', image: 'https://res.cloudinary.com/diyghrhlk/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1779543580/RudeusGreyrat_fdl0iz.png' },
      { id: 'sylphiette', name: 'Sylphiette', image: 'https://res.cloudinary.com/diyghrhlk/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1779543581/SylphietteGreyrat_k5o4uu.png' },
      { id: 'roxy', name: 'Roxy Migurdia', image: 'https://res.cloudinary.com/diyghrhlk/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1779543581/RoxyMigurdiaGreyrat_xno6n9.png' },
      { id: 'eris', name: 'Eris Boreas Greyrat', image: 'https://res.cloudinary.com/diyghrhlk/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1779543581/RoxyMigurdiaGreyrat_xno6n9.png' }
    ]
  },
  {
    id: 'frieren',
    name: "Frieren: Beyond Journey's End",
    characters: [
      { id: 'frieren', name: 'Frieren', image: 'https://res.cloudinary.com/diyghrhlk/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1779543091/Frieren_mzqvp1.png' },
      { id: 'fern', name: 'Fern', image: 'https://res.cloudinary.com/diyghrhlk/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1779543094/Fern_ywbngb.png' },
      { id: 'stark', name: 'Stark', image: 'https://res.cloudinary.com/diyghrhlk/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1779543090/Stark_q1px2n.png' },
      { id: 'himmel', name: 'Himmel', image: 'https://res.cloudinary.com/diyghrhlk/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1779543091/Himmel_uftdm4.png' }
    ]
  },
  {
    id: 'spyxfamily',
    name: 'Spy x Family',
    characters: [
      { id: 'loid', name: 'Loid Forger', image: 'https://res.cloudinary.com/diyghrhlk/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1779542637/LoidForger_uvkegz.png' },
      { id: 'anya', name: 'Anya Forger', image: 'https://res.cloudinary.com/diyghrhlk/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1779542637/AnyaForger_mupdy8.png' },
      { id: 'yor', name: 'Yor Forger', image: 'https://res.cloudinary.com/diyghrhlk/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1779542638/YorForger_f3yfgm.png' },
      { id: 'bond', name: 'Bond Forger', image: 'https://res.cloudinary.com/diyghrhlk/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1779542774/BondForger_nit0ne.png' }
    ]
  }
];