import "./style.css";
import {
  useEffect,
  useSignal,
  createReactiveConstant,
  createSignalI18n,
  fromatText,
  useWatch,
} from "../lib";

const I18nRC = createReactiveConstant({
  en: {
    s1: "click s1",
    s2: "click s2",
    s3: "click s3 {count}",
  } as const,
  zh: {
    s1: "点击 s1",
    s2: "点击 s2",
    s3: "点击 s3 {count}",
  } as const,
} as const);
const useI18n = createSignalI18n(I18nRC);

const btnL_en = document.getElementById("btnL_en");
if (btnL_en) {
  btnL_en.addEventListener("click", function () {
    I18nRC.$setCode("en");
  });
}
const btnL_zh = document.getElementById("btnL_zh");
if (btnL_zh) {
  btnL_zh.addEventListener("click", function () {
    I18nRC.$setCode("zh");
  });
}
const LText = document.getElementById("LText");
if (LText) {
  LText.innerHTML = I18nRC.$getCode();
}
I18nRC.$addListener(() => {
  if (LText) {
    LText.innerHTML = I18nRC.$getCode();
  }
});

const s1 = useSignal(1);
const s2 = useSignal(1);
const s3 = useSignal(1);

document.getElementById("btnS1")!.addEventListener("click", function () {
  s1.$set((v) => v + 1);
});
document.getElementById("btnS2")!.addEventListener("click", function () {
  s2.$set((v) => v + 1);
});

const btnS3 = document.getElementById("btnS3");
btnS3!.addEventListener("click", function () {
  s3.$set((v) => v + 1);
});

useEffect(() => {
  console.log("useSignalEffect1", s1());
  const ele = document.querySelector("#btnS1Text");
  if (ele) {
    ele.innerHTML = s1().toString();
  }
});
useEffect(() => {
  console.log("useSignalEffect2", s2());
  const ele = document.querySelector("#btnS2Text");
  if (ele) {
    ele.innerHTML = s2().toString();
  }
});
useEffect(() => {
  console.log("useSignalEffect3", s3());
  const ele = document.querySelector("#btnS3Text");
  if (ele) {
    ele.innerHTML = s3().toString();
  }
  const i18n = useI18n();
  btnS3!.innerText = fromatText(i18n.s3, { count: s3() });
});
const destroyEffect4 = useEffect(() => {
  console.log("useSignalEffect4", s1(), s2(), s3());

  return () => {
    console.log("useSignalEffect4 destroy");
  };
});
// @ts-ignore
window.destroyEffect4 = destroyEffect4;

let init = false;
useEffect(() => {
  if (init) {
    console.log("useSignalEffect5", s1(), s2(), s3());
  } else {
    console.log("useSignalEffect5", s1(), s2());
  }
});
init = true;

useWatch(s3, () => {
  console.log("useWatch1", s1(), s2(), s3());
});
