import "./style.css";
import {
  useEffect,
  useSignal,
  destroyEffect,
  createReactiveConstant,
} from "../lib";

const [s1, s1Set] = useSignal(1);
const [s2, s2Set] = useSignal(1);
const [s3, s3Set] = useSignal(1);
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
});
const s5Id = useEffect(() => {
  console.log("useSignalEffect4", s1(), s2(), s3());
});
destroyEffect(s5Id);
useEffect(() => {
  console.log("useSignalEffect5", s1(), s2(), s3());
});
const btnS1 = document.getElementById("btnS1");
if (btnS1) {
  btnS1.addEventListener("click", function () {
    s1Set((v) => v + 1);
  });
}
const btnS2 = document.getElementById("btnS2");
if (btnS2) {
  btnS2.addEventListener("click", function () {
    s2Set((v) => v + 1);
  });
}
const btnS3 = document.getElementById("btnS3");
if (btnS3) {
  btnS3.addEventListener("click", function () {
    s3Set((v) => v + 1);
  });
}

const I18nObj = createReactiveConstant({
  en: {
    s1: "click s1",
    s2: "click s2",
    s3: "click s3",
  } as const,
  zh: {
    s1: "点击 s1",
    s2: "点击 s2",
    s3: "点击 s3",
  } as const,
} as const);
const btnL_en = document.getElementById("btnL_en");
if (btnL_en) {
  btnL_en.addEventListener("click", function () {
    I18nObj.$setCode("en");
  });
}
const btnL_zh = document.getElementById("btnL_zh");
if (btnL_zh) {
  btnL_zh.addEventListener("click", function () {
    I18nObj.$setCode("zh");
  });
}
const LText = document.getElementById("LText");
if (LText) {
  LText.innerHTML = I18nObj.$getCode();
}

const [getI18n, setI18n] = useSignal(I18nObj);
I18nObj.$addListener(() => {
  if (LText) {
    LText.innerHTML = I18nObj.$getCode();
  }
  setI18n({ ...I18nObj });
});

useEffect(() => {
  const langEleList = document.querySelectorAll("[data-t]");
  const i18n = getI18n();
  for (let index = 0; index < langEleList.length; index++) {
    const element = langEleList[index];
    const langKey = element.getAttribute("data-t") as keyof typeof i18n;
    if (langKey) {
      const value = i18n[langKey];
      if (typeof value === "function") {
        return;
      }
      element.innerHTML = value;
    }
  }
});
