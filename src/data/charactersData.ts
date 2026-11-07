export interface CharacterProfile {
  id: string;
  name: string;
  enName: string;
  age: number;
  role: string;
  personality: string;
  appearance: string;
  features: string;
  quote: string;
  background: string;
  avatarUrl: string;
  stats: {
    assault: number;
    tactics: number;
    hacking: number;
    survival: number;
  };
}

export const CHARACTERS_DATA: CharacterProfile[] = [
  {
    id: 'kane',
    name: '凱恩',
    enName: 'Kane',
    age: 27,
    role: '幽影部隊突擊隊員 (Shadow Strike Commando)',
    personality: '冷靜、果斷、擅長分析局勢與快速決策。在危急戰況中始終保持心率平穩。',
    appearance: '深色戰術外骨骼裝甲服、輕型防彈合金裝甲、戰術披肩披風、背部與肩部嵌有零界能源青色發光節點、高科技戰術頭盔。',
    features: '專精突擊步槍、精準射擊與動能推進戰術移動，能以一人之力突破敵陣重型火力。',
    quote: '「這次……我一定要找到真相。」',
    background: '凱恩曾參與多次高風險深層滲透任務，擁有極其豐富的實戰經驗與戰術直覺。在半年前的一場防衛演習失敗中，他失去了幾位戰友，並敏銳地察覺到上級軍工指揮部刻意隱瞞了能源實驗的真實數據。這次奉命單兵進入失控封鎖區，表面上是回收核心數據，暗地裡則誓言徹查背後慘劇的始作俑者。',
    avatarUrl: '/assets/aistudio/_____________9e08efa2.png',
    stats: {
      assault: 95,
      tactics: 88,
      hacking: 65,
      survival: 92,
    },
  },
  {
    id: 'aira',
    name: '艾拉',
    enName: 'Aira',
    age: 25,
    role: '情報分析與無線電通訊專員 (Tactical Intel Specialist)',
    personality: '理性、細心、思維敏銳，擅長巨量數據解密與戰場弱點掃描。',
    appearance: '輕型科技戰鬥服、高增益通訊耳機、全息手腕微電腦資料終端。',
    features: '遠端駭入敵方防衛網絡、即時分析機械部隊弱點、提供小地圖雷達掃描與空投坐標支援。',
    quote: '「凱恩，雷達已標註敵方巡邏路線。記住，安全回來。」',
    background: '幽影後方基地最年輕的天才通訊工程師。她負責在作戰期間遠端監控凱恩的生命體徵與封鎖區的電磁訊號。在解密地下研究所的核心通訊紀錄時，她驚恐地發現了指揮部高層與民間軍火巨頭之間的秘密協定，毅然決定與凱恩站在同一陣線，揭發黑幕。',
    avatarUrl: '/assets/aistudio/_______________47390514.png',
    stats: {
      assault: 45,
      tactics: 96,
      hacking: 98,
      survival: 70,
    },
  },
  {
    id: 'commander',
    name: '沃克指揮官',
    enName: 'Commander Walker',
    age: 48,
    role: '幽影特遣部隊總指揮官 (Supreme Taskforce Commander)',
    personality: '鐵腕、冷酷、恪守軍令與政治平衡，崇尚絕對服從。',
    appearance: '重型將官戰術動力甲、灰白鬢髮、右眼配備義體戰術目鏡與一道戰損傷痕。',
    features: '掌控軌道衛星通訊權限與封鎖區遠程自毀協議。',
    quote: '「士兵的天職是服從，凱恩。有些真相，公眾永遠不需要知道。」',
    background: '軍旅生涯超過二十五年的老將，深信為了「更大的秩序與都市繁榮」，部分犧牲與隱瞞是不可避免的必要代價。他既賞識凱恩的戰鬥天賦，又對其不受控的獨立思考抱持高度戒心。在終局面對凱恩時，他代表了冷酷體制的最高守門人。',
    avatarUrl: '/assets/aistudio/_______________47390514.png',
    stats: {
      assault: 85,
      tactics: 92,
      hacking: 75,
      survival: 90,
    },
  },
];
