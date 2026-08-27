// 0-6 岁宝宝成长里程碑模板（权威资料整理）
// 数据来源：
//  - 国家卫生健康委员会《婴幼儿辅食添加营养指南》WS/T 678—2020
//  - 中国营养学会《中国婴幼儿喂养指南（2022）》
//  - 国家免疫规划疫苗儿童免疫程序（2026 年版，国家疾控局/国家卫健委）
//  - 国家卫生健康委《婴幼儿早期发展服务指南（试行）》3 岁以下心理行为发育标志
//  - WHO 婴幼儿喂养指南（6-23 月龄）
// 说明：month = 目标月龄；cat 用于分类着色；zh/en 双语展示；src 标注权威出处。

export type MilestoneCat = 'vaccine' | 'food' | 'dev' | 'teeth' | 'checkup';

export interface MilestoneTpl {
  id: string;
  month: number;
  cat: MilestoneCat;
  icon: string;
  zh: { title: string; desc: string; src: string };
  en: { title: string; desc: string; src: string };
}

export const MILESTONE_TEMPLATE: MilestoneTpl[] = [
  // ===== 疫苗（国家免疫规划 2026）=====
  {
    id: 'v0', month: 0, cat: 'vaccine', icon: '💉',
    zh: { title: '出生时接种疫苗', desc: '出生 24 小时内接种乙肝疫苗第 1 剂；出生后尽早接种卡介苗（预防结核性脑膜炎等）。', src: '国家免疫规划 2026' },
    en: { title: 'Birth vaccines', desc: 'HepB dose 1 within 24h of birth; BCG as soon as possible after birth.', src: 'NIP 2026' },
  },
  {
    id: 'v1', month: 1, cat: 'vaccine', icon: '💉',
    zh: { title: '乙肝疫苗第 2 剂', desc: '满 1 月龄接种乙肝疫苗第 2 剂（按 0-1-6 月程序）。', src: '国家免疫规划 2026' },
    en: { title: 'HepB dose 2', desc: 'Hepatitis B vaccine 2nd dose at 1 month (0-1-6 schedule).', src: 'NIP 2026' },
  },
  {
    id: 'v2', month: 2, cat: 'vaccine', icon: '💉',
    zh: { title: '脊灰① + 百白破①', desc: '2 月龄接种脊灰灭活疫苗（IPV）第 1 剂、百白破疫苗第 1 剂。', src: '国家免疫规划 2026' },
    en: { title: 'IPV① + DTaP①', desc: '2 months: polio (IPV) dose 1, DTaP dose 1.', src: 'NIP 2026' },
  },
  {
    id: 'v3', month: 3, cat: 'vaccine', icon: '💉',
    zh: { title: '脊灰灭活疫苗第 2 剂', desc: '3 月龄接种脊灰灭活疫苗（IPV）第 2 剂。', src: '国家免疫规划 2026' },
    en: { title: 'IPV dose 2', desc: '3 months: polio (IPV) dose 2.', src: 'NIP 2026' },
  },
  {
    id: 'v4', month: 4, cat: 'vaccine', icon: '💉',
    zh: { title: '脊灰③ + 百白破②', desc: '4 月龄接种脊灰减毒活疫苗（bOPV）第 3 剂、百白破疫苗第 2 剂。', src: '国家免疫规划 2026' },
    en: { title: 'bOPV③ + DTaP②', desc: '4 months: polio (bOPV) dose 3, DTaP dose 2.', src: 'NIP 2026' },
  },
  {
    id: 'v5', month: 5, cat: 'vaccine', icon: '💉',
    zh: { title: '百白破疫苗第 3 剂', desc: '5 月龄接种百白破疫苗第 3 剂。', src: '国家免疫规划 2026' },
    en: { title: 'DTaP dose 3', desc: '5 months: DTaP dose 3.', src: 'NIP 2026' },
  },
  {
    id: 'v6', month: 6, cat: 'vaccine', icon: '💉',
    zh: { title: '乙肝③ + A 群流脑①', desc: '6 月龄接种乙肝疫苗第 3 剂、A 群流脑多糖疫苗第 1 剂。', src: '国家免疫规划 2026' },
    en: { title: 'HepB③ + MPSV-A①', desc: '6 months: HepB dose 3, meningococcal (MPSV-A) dose 1.', src: 'NIP 2026' },
  },
  {
    id: 'v8', month: 8, cat: 'vaccine', icon: '💉',
    zh: { title: '麻腮风① + 乙脑①', desc: '8 月龄接种麻腮风疫苗第 1 剂、乙脑减毒活疫苗第 1 剂。', src: '国家免疫规划 2026' },
    en: { title: 'MMR① + JE①', desc: '8 months: MMR dose 1, Japanese encephalitis dose 1.', src: 'NIP 2026' },
  },
  {
    id: 'v9', month: 9, cat: 'vaccine', icon: '💉',
    zh: { title: 'A 群流脑多糖疫苗第 2 剂', desc: '9 月龄接种 A 群流脑多糖疫苗第 2 剂。', src: '国家免疫规划 2026' },
    en: { title: 'MPSV-A dose 2', desc: '9 months: meningococcal (MPSV-A) dose 2.', src: 'NIP 2026' },
  },
  {
    id: 'v12', month: 12, cat: 'vaccine', icon: '💉',
    zh: { title: '水痘疫苗第 1 剂', desc: '12 月龄（约 1 岁）建议接种水痘疫苗第 1 剂（自费，普遍推荐）。', src: '儿童接种门诊建议' },
    en: { title: 'Varicella dose 1', desc: 'Around 12 months: varicella (chickenpox) vaccine dose 1 (recommended).', src: 'Clinic advice' },
  },
  {
    id: 'v18', month: 18, cat: 'vaccine', icon: '💉',
    zh: { title: '百白破④ + 麻腮风② + 甲肝①', desc: '18 月龄接种百白破第 4 剂、麻腮风第 2 剂、甲肝减毒活疫苗第 1 剂。', src: '国家免疫规划 2026' },
    en: { title: 'DTaP④ + MMR② + HepA①', desc: '18 months: DTaP dose 4, MMR dose 2, HepA dose 1.', src: 'NIP 2026' },
  },
  {
    id: 'v24', month: 24, cat: 'vaccine', icon: '💉',
    zh: { title: '乙脑减毒活疫苗第 2 剂', desc: '2 周岁接种乙脑减毒活疫苗第 2 剂。', src: '国家免疫规划 2026' },
    en: { title: 'JE dose 2', desc: '2 years: Japanese encephalitis dose 2.', src: 'NIP 2026' },
  },
  {
    id: 'v36', month: 36, cat: 'vaccine', icon: '💉',
    zh: { title: 'A+C 群流脑多糖疫苗第 1 剂', desc: '3 周岁接种 A 群 C 群流脑多糖疫苗第 1 剂。', src: '国家免疫规划 2026' },
    en: { title: 'MPSV-AC dose 1', desc: '3 years: AC meningococcal vaccine dose 1.', src: 'NIP 2026' },
  },
  {
    id: 'v48', month: 48, cat: 'vaccine', icon: '💉',
    zh: { title: '水痘② + 脊灰(OPV)④', desc: '4 周岁接种水痘疫苗第 2 剂、脊灰减毒活疫苗第 4 剂。', src: '国家免疫规划 2026' },
    en: { title: 'Varicella② + bOPV④', desc: '4 years: varicella dose 2, polio (bOPV) dose 4.', src: 'NIP 2026' },
  },
  {
    id: 'v72', month: 72, cat: 'vaccine', icon: '💉',
    zh: { title: '白破① + A+C 流脑②', desc: '6 周岁接种白破疫苗第 1 剂、A+C 群流脑多糖疫苗第 2 剂。', src: '国家免疫规划 2026' },
    en: { title: 'DT① + MPSV-AC②', desc: '6 years: diphtheria-tetanus dose 1, AC meningococcal dose 2.', src: 'NIP 2026' },
  },

  // ===== 辅食 / 吃饭（卫健委辅食指南 + 中国喂养指南 2022）=====
  {
    id: 'f6', month: 6, cat: 'food', icon: '🥄',
    zh: { title: '满 6 月龄开始添加辅食', desc: '首选强化铁米粉（高铁）。原则：由少到多、由稀到稠、由一种到多种；每加一种新食物观察 3-5 天。1 岁内辅食不加盐、糖、酱油。', src: 'WS/T 678—2020 辅食指南' },
    en: { title: 'Start solids at 6 months', desc: 'Start with iron-fortified cereal (high iron). One new food at a time, watch 3-5 days for allergy. No salt/sugar before 1 year.', src: 'WS/T 678—2020' },
  },
  {
    id: 'f7', month: 7, cat: 'food', icon: '🥣',
    zh: { title: '引入菜泥、果泥、肉泥肝泥', desc: '7-9 月逐步引入蔬菜泥、水果泥、肉泥/肝泥（富铁）。每日 2 次辅食，奶量保持 ≥600ml。蛋黄从 1/4 个起。', src: '中国婴幼儿喂养指南 2022' },
    en: { title: 'Add puréed veg/fruit/meat', desc: '7-9 mo: veggie/fruit/meat purées (iron-rich). 2 meals/day, milk ≥600ml. Egg yolk from 1/4.', src: 'Chinese Feeding Guideline 2022' },
  },
  {
    id: 'f9', month: 9, cat: 'food', icon: '🍲',
    zh: { title: '末状 / 碎末食物，练咀嚼', desc: '食物过渡到碎末、软烂粥面、肉末；锻炼咀嚼吞咽。继续每日 2-3 次辅食。', src: 'WS/T 678—2020 辅食指南' },
    en: { title: 'Minced & mashed foods', desc: 'Move to minced/soft foods, well-cooked porridge, meat paste. 2-3 meals/day.', src: 'WS/T 678—2020' },
  },
  {
    id: 'f10', month: 10, cat: 'food', icon: '✋',
    zh: { title: '手指食物，鼓励自主抓食', desc: '10-12 月给软烂块状、手指食物（南瓜条、软饭团），让宝宝自己抓着吃，大人旁看护防呛。', src: 'WS/T 678—2020 辅食指南' },
    en: { title: 'Finger foods & self-feeding', desc: '10-12 mo: soft finger foods (pumpkin sticks, rice balls). Let baby self-feed with supervision.', src: 'WS/T 678—2020' },
  },
  {
    id: 'f12', month: 12, cat: 'food', icon: '🍚',
    zh: { title: '逐渐过渡到家庭餐', desc: '1 岁后随家人进餐，食物清淡少盐（仍少盐少糖），每日 3 餐 + 2 次奶/点心，培养规律饮食。', src: '中国婴幼儿喂养指南 2022' },
    en: { title: 'Transition to family meals', desc: 'After 1 yr: eat with family, mild & low-salt. 3 meals + 2 snacks, regular routine.', src: 'Chinese Feeding Guideline 2022' },
  },
  {
    id: 'f24', month: 24, cat: 'food', icon: '🥢',
    zh: { title: '三餐两点，自主进食', desc: '2-3 岁每日三餐两点，鼓励自己用勺/筷，食物多样化、少油炸少甜饮。', src: '中国婴幼儿喂养指南 2022' },
    en: { title: '3 meals + 2 snacks', desc: '2-3 yr: three meals + two snacks, encourage self-feeding, varied & low-sugar diet.', src: 'Chinese Feeding Guideline 2022' },
  },
  {
    id: 'f36', month: 36, cat: 'food', icon: '🍽️',
    zh: { title: '与家人同桌，习惯养成', desc: '3 岁起与家人同桌进餐，固定就餐位置与时间，不边玩边吃，建立良好饮食习惯。', src: '中国婴幼儿喂养指南 2022' },
    en: { title: 'Family table & habits', desc: 'From 3 yr: eat at the family table, fixed seat & time, no eating while playing.', src: 'Chinese Feeding Guideline 2022' },
  },

  // ===== 发育里程碑（大运动 / 精细 / 语言 / 社交）=====
  {
    id: 'd2', month: 2, cat: 'dev', icon: '😊',
    zh: { title: '俯卧抬头、会笑', desc: '2 月龄俯卧可短暂抬头；逗引出现社会性微笑（对人笑）。', src: '婴幼儿心理行为发育标志' },
    en: { title: 'Head up & social smile', desc: '2 mo: brief head lift while prone; smiles in response to people.', src: 'Dev. milestones' },
  },
  {
    id: 'd4', month: 4, cat: 'dev', icon: '🔄',
    zh: { title: '会翻身', desc: '4 月龄可从仰卧翻到俯卧；能注视人脸。', src: '婴幼儿心理行为发育标志' },
    en: { title: 'Rolls over', desc: '4 mo: rolls from back to tummy; follows faces with eyes.', src: 'Dev. milestones' },
  },
  {
    id: 'd6', month: 6, cat: 'dev', icon: '🪑',
    zh: { title: '独坐片刻、认生', desc: '6 月龄能独坐片刻；能区分熟人与陌生人（认生属正常）。', src: '婴幼儿心理行为发育标志' },
    en: { title: 'Sits & stranger anxiety', desc: '6 mo: sits briefly alone; distinguishes familiar vs stranger.', src: 'Dev. milestones' },
  },
  {
    id: 'd8', month: 8, cat: 'dev', icon: '🐛',
    zh: { title: '爬行', desc: '8 月龄腹部贴床面爬行，开始探索周围环境。', src: '婴幼儿心理行为发育标志' },
    en: { title: 'Crawls', desc: '8 mo: crawls with abdomen on floor, begins to explore.', src: 'Dev. milestones' },
  },
  {
    id: 'd9', month: 9, cat: 'dev', icon: '🤏',
    zh: { title: '拇食指捏取', desc: '9 月龄能用拇指和食指捏起小物品（如小饼干）。', src: '婴幼儿心理行为发育标志' },
    en: { title: 'Pincer grasp', desc: '9 mo: picks up small items with thumb and forefinger.', src: 'Dev. milestones' },
  },
  {
    id: 'd12', month: 12, cat: 'dev', icon: '👣',
    zh: { title: '独站、走几步、叫爸妈', desc: '12 月龄可独站数秒、独走几步；有意识叫“爸爸/妈妈”；会挥手再见。', src: '婴幼儿心理行为发育标志' },
    en: { title: 'Stands, steps, says words', desc: '12 mo: stands alone, few steps; says “mama/papa” with meaning; waves bye.', src: 'Dev. milestones' },
  },
  {
    id: 'd18', month: 18, cat: 'dev', icon: '🪜',
    zh: { title: '扶栏上楼梯、说约 10 词', desc: '18 月龄能扶栏上楼梯；能说约 10 个有意义的词。', src: '婴幼儿心理行为发育标志' },
    en: { title: 'Climbs stairs, ~10 words', desc: '18 mo: climbs stairs with rail; says about 10 meaningful words.', src: 'Dev. milestones' },
  },
  {
    id: 'd24', month: 24, cat: 'dev', icon: '🦘',
    zh: { title: '双脚离地跳、说短句', desc: '24 月龄能双脚同时离地跳起；能说 2-3 个词的短句。', src: '婴幼儿心理行为发育标志' },
    en: { title: 'Jumps & short phrases', desc: '24 mo: jumps with both feet; speaks 2-3 word phrases.', src: 'Dev. milestones' },
  },
  {
    id: 'd36', month: 36, cat: 'dev', icon: '🤸',
    zh: { title: '单脚站 5 秒以上', desc: '36 月龄能单脚站立 5 秒以上；会扣扣子、玩假装游戏。', src: '婴幼儿心理行为发育标志' },
    en: { title: 'Stands on one foot', desc: '36 mo: stands on one foot >5s; buttons clothes, pretend play.', src: 'Dev. milestones' },
  },

  // ===== 牙齿 =====
  {
    id: 't6', month: 6, cat: 'teeth', icon: '🦷',
    zh: { title: '第一颗乳牙萌出', desc: '多数宝宝 6-8 月萌出第一颗牙（通常下中切牙）。开始用纱布/指套清洁牙龈与牙齿。', src: '儿童口腔保健' },
    en: { title: 'First tooth erupts', desc: 'Most babies get first tooth at 6-8 mo (lower central incisor). Start cleaning gums/teeth.', src: 'Child oral care' },
  },
  {
    id: 't24', month: 24, cat: 'teeth', icon: '🪥',
    zh: { title: '20 颗乳牙大多出齐', desc: '约 2 岁 20 颗乳牙基本出齐。坚持刷牙、少吃夜奶，预防龋齿。', src: '儿童口腔保健' },
    en: { title: '20 primary teeth', desc: 'By ~2 yr most have 20 primary teeth. Brush daily, avoid night milk to prevent cavities.', src: 'Child oral care' },
  },

  // ===== 儿童保健体检 =====
  {
    id: 'c1', month: 1, cat: 'checkup', icon: '🩺',
    zh: { title: '满月儿童保健', desc: '满月（1 月龄）做首次儿保体检，监测体重、身长、黄疸、喂养与神经发育。', src: '国家基本公共卫生服务' },
    en: { title: '1-month checkup', desc: 'First well-child visit at 1 month: weight, length, jaundice, feeding & neuro dev.', src: 'Public health service' },
  },
  {
    id: 'c6', month: 6, cat: 'checkup', icon: '🩺',
    zh: { title: '半岁儿保 + 发育筛查', desc: '6 月龄儿保，测身长体重头围、贫血筛查，评估大运动/精细/语言发育。', src: '国家基本公共卫生服务' },
    en: { title: '6-month checkup', desc: '6 mo checkup: growth (weight/length/head), anemia screen, dev. screening.', src: 'Public health service' },
  },
  {
    id: 'c12', month: 12, cat: 'checkup', icon: '🩺',
    zh: { title: '1 岁儿保', desc: '12 月龄儿保，评估生长曲线、运动语言发育，按计划接种疫苗。', src: '国家基本公共卫生服务' },
    en: { title: '12-month checkup', desc: '12 mo checkup: growth curve, motor & language dev., vaccines.', src: 'Public health service' },
  },
  {
    id: 'c24', month: 24, cat: 'checkup', icon: '🩺',
    zh: { title: '2 岁儿保', desc: '24 月龄儿保，关注语言、社交、视力与龋齿，做心理行为发育自评。', src: '国家基本公共卫生服务' },
    en: { title: '24-month checkup', desc: '24 mo checkup: language, social, vision, teeth; dev. self-assessment.', src: 'Public health service' },
  },
  {
    id: 'c36', month: 36, cat: 'checkup', icon: '🩺',
    zh: { title: '3 岁儿保', desc: '36 月龄儿保，入园前体检，评估体格、语言社交与适应行为。', src: '国家基本公共卫生服务' },
    en: { title: '36-month checkup', desc: '36 mo checkup: pre-kindergarten exam, physical, language & adaptive behavior.', src: 'Public health service' },
  },
];

export const CAT_META: Record<MilestoneCat, { zh: string; en: string; color: string }> = {
  vaccine: { zh: '疫苗', en: 'Vaccine', color: '#FF6F69' },
  food: { zh: '喂养', en: 'Feeding', color: '#FFB072' },
  dev: { zh: '发育', en: 'Development', color: '#5BB98C' },
  teeth: { zh: '牙齿', en: 'Teeth', color: '#7AA7FF' },
  checkup: { zh: '儿保', en: 'Checkup', color: '#C9A66B' },
};
