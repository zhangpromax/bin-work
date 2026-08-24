// 水豚噜噜预选头像清单
// 这些文件位于 public/capy-avatars/ 下，由前端以 /capy-avatars/<name> 形式加载。
// 想新增预选头像：把图片丢进 public/capy-avatars/，然后在此数组里加一行文件名即可。
export const CAPY_AVATARS: string[] = [
  'capy_01.png',
  'capy_02.png',
  'capy_03.png',
  'capy_04.png',
];

// 转成前端可用的绝对路径
export const avatarList: string[] = CAPY_AVATARS.map((n) => `/capy-avatars/${n}`);
