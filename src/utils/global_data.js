const globalData = {
  UserInfo: null, // 用户信息
  TOKEN: null,
}

export function set (key, val) {
  globalData[key] = val
}

export function get (key) {
  return globalData[key]
}