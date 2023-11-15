/** 获取一个随机6位字符串加时间戳的字符串，格式为 `{randomString}:{timestamp}` */
export function getRandomStr() {
  return `${Math.random().toString(36).slice(-8)}:${new Date().getTime()}`;
}

/**
 * 获取一个不属于 comparative 的随机字符串
 * @param {string[]} comparative - 需要排除的字符串集合
 * @param length - 字符串长度，默认长度：8
 * */
export function getOnlyStr(comparative, length = 8) {
  const str = Math.random().toString(36).slice(-length);
  if (comparative.includes(str)) {
    return getOnlyStr(comparative, length);
  }
  return str;
}

/**
 * 获取 [n,m] 范围内的随机整数
 * @param {number} n - 范围的下限
 * @param {number} m - 范围的上限
 */
export function getRandomInteger(n, m) {
  return Math.floor(Math.random() * (m - n + 1)) + n;
}

/**
 * 提取 url 的 query
 * @param {string} url 需要提取的 url
 * @param {string} key query 的 key
 */
export function getUrlQuery(url, key) {
  if (!url.includes("?")) {
    return undefined;
  }
  const reg = new RegExp(`(^|&)${key}=([^&]*)(&|$)`, "i");
  const resultList = url.split("?")[1].match(reg);
  return resultList ? decodeURIComponent(resultList[2]) : undefined;
}

/**
 * 防抖函数
 * @template T
 * @param {(...args: T) => void} callback - 回调函数
 * @param {object} option - 配置项
 * @param {number} option.wait - 延迟毫秒数
 * @param {boolean} option.immediate
 * - immediate=true 调用函数体时，callback 被立即调用，并锁定不能再调用。函数体会从上一次被调用后，倒计时 wait 毫秒后解锁可调用 callback。
 * - immediate=false 函数体被最后一次调用后，延迟 wait 毫秒后调用 callback；
 *
 * @return {(...args: T) => void} - 防抖函数体
 */
export function debounce(callback, option = {}) {
  let timer = null;
  const { wait = 500, immediate = false } = option;
  return (...args) => {
    if (timer) {
      clearTimeout(timer);
    }
    if (immediate) {
      if (!timer) {
        callback(...args);
      }
      timer = setTimeout(() => (timer = null), wait);
    } else {
      timer = setTimeout(() => {
        timer = null;
        callback(...args);
      }, wait);
    }
  };
}

/**
 * 节流函数。函数体在 wait 毫秒内多次调用，callback 只触发一次
 * @template T
 * @param {(...args: T) => void} callback - 回调函数
 * @param {number} wait
 * @return {(...args: T) => void} - 节流函数体
 */
export function throttle(
  callback,
  /**
   * 间隔时间，单位：毫秒
   * @default 500
   * */
  wait
) {
  let startTime = 0;
  return (...args) => {
    const now = +new Date();
    if (now - startTime >= wait) {
      startTime = now;
      callback(...args);
    }
  };
}

/**
 * 字符串首字母大写，其余都小写
 * @param {string} str - 需要转换的字符串
 * */
export function toTitleCase(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * 字符串的每个单词首字母都大写，其余部分小写
 * @param {string} str - 需要转换的字符串
 * */
export function toEachTitleUpperCase(str) {
  let newStr = str.split(" ");
  for (let i = 0; i < newStr.length; i++) {
    newStr[i] =
      newStr[i].slice(0, 1).toUpperCase() + newStr[i].slice(1).toLowerCase();
  }
  return newStr.join(" ");
}

/**
 * 获取对象中的值
 * @param {string} strKey - 字符串格式的 key
 * @param {object} objState - 对象的状态
 * */
export function getValueFromStringKey(strKey, objState) {
  const keyList = strKey.split(".");
  let data = objState;
  for (const key of keyList) {
    data = data[key];
  }
  return data;
}
