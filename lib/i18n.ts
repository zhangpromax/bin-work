export type Lang = 'zh' | 'en';

const I18N: Record<Lang, Record<string, string>> = {
  zh: {
    title: '家有宝宝', sub: '宝宝成长记录台',
    tabhome: '首页', tabprofile: '成长', tabhealth: '数据', tabmine: '我的', quick: '记录',
    todaytodo: '今日待办', recent: '最近动态', today: '今日', todayoverview: '今日概览', alldata: '全部数据', back: '返回', babies: '宝宝', addbaby: '添加宝宝',
    feed: '喂奶', diaper: '换尿布', sleep: '睡眠', temp: '体温', med: '喂药', mrec: '医疗', weight: '体重', cost: '消费',
    feedlog: '喂奶记录', diapers: '换尿布', sleeplog: '睡眠记录', temphd: '体温记录',
    medlog: '喂药疗程', medreclog: '医疗记录', weightlog: '体重记录', costlog: '消费记录',
    last14: '近14天喂奶量(ml)', type30: '近30天食物类型占比', weighttrend: '体重趋势', monthledger: '本月账本',
    last14diaper: '近14天换尿布次数', diaper30: '近30天尿布类型占比',
    last14sleep: '近14天睡眠时长(小时)', sleeptrend: '体温趋势', hightemp: '偏高',
    name: '昵称', birthday: '生日', gender: '性别', avatar: '头像', note: '备注', age: '年龄',
    height: '身高', bloodType: '血型',
    male: '男', female: '女', save: '保存', cancel: '取消', edit: '编辑', delete: '删除',
    amount: '奶量(ml)', foodtype: '类型', milk: '母乳', formula: '配方奶', solid: '辅食', water: '水',
    coursename: '疗程名称', startdate: '开始日期', totaldays: '总天数', freq: '每日次数', dose: '本次打卡',
    mtype: '类型', vaccine: '疫苗', checkup: '体检', visit: '就诊', other: '其他', nextdate: '下次到期',
    costlabel: '费用(¥)', recorddate: '日期', weightlabel: '体重(kg)', category: '分类',
    catfood: '伙食', catmedical: '医疗', cattoy: '玩具', catcloth: '衣物', catother: '其他',
    diapertype: '尿布类型', wet: '尿', dirty: '便', both: '尿+便',
    sleepdur: '时长(分钟)', sleepstart: '开始', sleepend: '结束',
    tempval: '体温(°C)',
    nodata: '暂无记录', syncoff: '本地模式', syncon: '云端已同步', syncset: '同步设置',
    synctip: '填入 Supabase 项目 URL 与 anon key 启用私有云同步（不公开部署）',
    export: '导出备份', import: '导入备份', samples: '载入示例数据', clearData: '清空数据',
    confirmclear: '确定清空所有数据？', missed: '漏喂', done: '已完成', pending: '待完成',
    expired: '已到期', soon: '即将到期', langbtn: 'EN', about: '关于',
    all: '全部', filterby: '按宝宝筛选',
    theme: '主题风格', themeStatic: '静态图标', themeDynamic: '动态图标',
    themeTip: '切换底部菜单栏图标为静态或动态水豚噜噜',
    profile: '个人资料', signature: '个性签名', phone: '手机号',
    cloudSync: '已同步',
    babyProfile: '宝宝资料', album: '成长相册', reminders: '提醒设置',
    feedingSet: '喂养设置', exportData: '数据导出', multiBabies: '多宝宝管理',
    settings: '设置', data: '数据', signout: '退出登录',
    smile: '第一次微笑', rollover: '第一次翻身', sit: '独坐', teeth: '第一颗牙', crawl: '爬行', stand: '扶站', walk: '迈出第一步', talk: '说出第一个词', callparents: '叫爸爸妈妈', recognize: '认人',
    milestone: '成长里程碑', mileadd: '记录里程碑', milelabel: '里程碑', dailycare: '日常护理', healthcare: '健康医疗', growthdata: '成长数据',
    addBabyTip: '还没有宝宝，点击添加', daysOld: '天', syncStatus: '数据同步中',
    smartReminders: '智能提醒', addReminder: '添加提醒', editReminder: '编辑提醒',
    reminderContent: '提醒内容', reminderIcon: '图标', reminderSubTitle: '副标题备注',
    reminderCycle: '提醒周期', once: '单次', daily: '每天', weekly: '每周',
    hourly: '每N小时', daysLater: 'N天后', at: '在', hour: '小时', minute: '分钟',
    weekDay0: '周日', weekDay1: '周一', weekDay2: '周二', weekDay3: '周三',
    weekDay4: '周四', weekDay5: '周五', weekDay6: '周六',
    tapSwitchHint: '点击右侧开关启停提醒', reminderEmpty: '还没有提醒，点击添加',
    enabled: '启用',
    growthGuide: '0-6岁成长里程碑', growthGuideSub: '按宝宝生日自动生成 · 权威指南提醒',
    currentStage: '当前阶段', msReached: '已到', msUpcoming: '未到',
    msMarkDone: '完成', msUndo: '撤销', msSource: '来源', msAllDone: '该阶段前的里程碑都已完成 🎉',
  },
  en: {
    title: 'Baby Care', sub: 'Baby Growth Tracker',
    tabhome: 'Home', tabprofile: 'Growth', tabhealth: 'Data', tabmine: 'Mine', quick: 'Log',
    todaytodo: 'Today', recent: 'Recent', today: 'Today', todayoverview: 'Today Overview', alldata: 'All Data', back: 'Back', babies: 'Babies', addbaby: 'Add Baby',
    feed: 'Feed', diaper: 'Diaper', sleep: 'Sleep', temp: 'Temp', med: 'Med', mrec: 'Medical', weight: 'Weight', cost: 'Expense',
    feedlog: 'Feeding Log', diapers: 'Diapers', sleeplog: 'Sleep Log', temphd: 'Temp Log',
    medlog: 'Medicine Courses', medreclog: 'Medical Records', weightlog: 'Weight Log', costlog: 'Expense Log',
    last14: 'Last 14 days intake (ml)', type30: 'Last 30 days by type', weighttrend: 'Weight Trend', monthledger: 'This Month',
    last14diaper: 'Last 14 days diapers', diaper30: 'Last 30 days by type',
    last14sleep: 'Last 14 days sleep(h)', sleeptrend: 'Temp Trend', hightemp: 'High',
    name: 'Name', birthday: 'Birthday', gender: 'Gender', avatar: 'Avatar', note: 'Note', age: 'Age',
    height: 'Height', bloodType: 'Blood Type',
    male: 'Boy', female: 'Girl', save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete',
    amount: 'Amount(ml)', foodtype: 'Type', milk: 'Breast', formula: 'Formula', solid: 'Solid', water: 'Water',
    coursename: 'Course', startdate: 'Start Date', totaldays: 'Total Days', freq: 'Per Day', dose: 'Check-in',
    mtype: 'Type', vaccine: 'Vaccine', checkup: 'Checkup', visit: 'Visit', other: 'Other', nextdate: 'Next Due',
    costlabel: 'Cost(¥)', recorddate: 'Date', weightlabel: 'Weight(kg)', category: 'Category',
    catfood: 'Food', catmedical: 'Medical', cattoy: 'Toy', catcloth: 'Clothes', catother: 'Other',
    diapertype: 'Diaper type', wet: 'Wet', dirty: 'Dirty', both: 'Both',
    sleepdur: 'Duration(min)', sleepstart: 'Start', sleepend: 'End',
    tempval: 'Temp(°C)',
    nodata: 'No records yet', syncoff: 'Local', syncon: 'Cloud Synced', syncset: 'Sync Settings',
    synctip: 'Enter Supabase URL & anon key to enable private cloud sync (not public)',
    export: 'Export', import: 'Import', samples: 'Load Samples', clearData: 'Clear Data',
    confirmclear: 'Clear all data?', missed: 'Missed', done: 'Done', pending: 'Pending',
    expired: 'Expired', soon: 'Due Soon', langbtn: '中', about: 'About',
    all: 'All', filterby: 'Filter by baby',
    theme: 'Theme', themeStatic: 'Static Icons', themeDynamic: 'Animated Icons',
    themeTip: 'Switch bottom bar icons between static and animated capybara Lulu',
    profile: 'Profile', signature: 'Signature', phone: 'Phone',
    cloudSync: 'Synced',
    babyProfile: 'Baby Profile', album: 'Album', reminders: 'Reminders',
    feedingSet: 'Feeding Settings', exportData: 'Export Data', multiBabies: 'Multi-baby',
    settings: 'Settings', data: 'Data', signout: 'Sign Out',
    smile: 'First smile', rollover: 'First roll', sit: 'Sits up', teeth: 'First tooth', crawl: 'Crawls', stand: 'Stands', walk: 'First steps', talk: 'First word', callparents: 'Says mama/papa', recognize: 'Recognizes people',
    milestone: 'Milestones', mileadd: 'Add milestone', milelabel: 'Milestone', dailycare: 'Daily Care', healthcare: 'Health & Medical', growthdata: 'Growth Data',
    addBabyTip: 'No baby yet, tap to add', daysOld: 'days', syncStatus: 'syncing',
    smartReminders: 'Smart Reminders', addReminder: 'Add Reminder', editReminder: 'Edit Reminder',
    reminderContent: 'Content', reminderIcon: 'Icon', reminderSubTitle: 'Subtitle / Note',
    reminderCycle: 'Repeat', once: 'Once', daily: 'Daily', weekly: 'Weekly',
    hourly: 'Every N hours', daysLater: 'N days later', at: 'at', hour: 'hour', minute: 'min',
    weekDay0: 'Sun', weekDay1: 'Mon', weekDay2: 'Tue', weekDay3: 'Wed',
    weekDay4: 'Thu', weekDay5: 'Fri', weekDay6: 'Sat',
    tapSwitchHint: 'Tap the switch on the right to toggle', reminderEmpty: 'No reminders yet, tap to add',
    enabled: 'Enabled',
    growthGuide: '0-6 Yrs Growth Milestones', growthGuideSub: 'Auto from baby birthday · official guidelines',
    currentStage: 'Current stage', msReached: 'Due', msUpcoming: 'Upcoming',
    msMarkDone: 'Done', msUndo: 'Undo', msSource: 'Source', msAllDone: 'Milestones up to now are all done 🎉',
  },
};

let LANG: Lang = 'zh';
export function initLang(paramLang: string | null): void {
  LANG = paramLang === 'en' ? 'en' : 'zh';
}
export function setLang(l: Lang): void {
  LANG = l;
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    if (l === 'en') url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');
    window.history.replaceState(null, '', url.toString());
  }
}
export function getLang(): Lang {
  return LANG;
}
export function t(key: string): string {
  return I18N[LANG][key] ?? key;
}
export function toggleLang(): void {
  setLang(LANG === 'en' ? 'zh' : 'en');
}
