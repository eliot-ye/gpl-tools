import "./style.css";
import {
  createSubscribeState,
  useEffect,
  useSignal,
  destroyEffect,
} from "../lib";
import { createApp } from "../lib/BindDOM";

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

const app = createSubscribeState({
  title: "hello",
  a: 0,
  b: 0,
  checked: false,
  data: {
    a: 0,
  },
});

app.$subscribe((state) => {
  console.log("订阅 空数组", JSON.stringify(state));
}, []);
app.$subscribe((state) => {
  console.log("订阅 无参数", JSON.stringify(state));
});

// app.subscribe(
//   (state) => {
//     console.log("订阅 title", state.title);
//     const ele = document.querySelector(`[bd-text="title"]`);
//     if (ele) {
//       ele.innerHTML = state.title;
//     }
//   },
//   ["title"]
// );

// app.subscribe(
//   (state) => {
//     const ele = document.querySelector(`[bd-text="a"]`);
//     if (ele) {
//       ele.innerHTML = String(state.a);
//     }
//     console.log("订阅 a", state.a);
//   },
//   ["a"]
// );

// app.subscribe(
//   (state) => {
//     const ele = document.querySelector(`[bd-text="b"]`);
//     if (ele) {
//       ele.innerHTML = String(state.b);
//     }
//     console.log("订阅 b", state.b);
//   },
//   ["b"]
// );

const btnA = document.getElementById("btnA");
if (btnA) {
  btnA.addEventListener("click", () => {
    for (let i = 0; i < 100; i++) {
      app.$set("a", app.$getState().a + 1);
    }
    app.$set("a", app.$get("a") + 1);
    app.$setFromStringKey("data.a", app.$get("data").a + 1);
  });
}

const btnB = document.getElementById("btnB");
if (btnB) {
  btnB.addEventListener("click", () => {
    app.$set("b", app.$get("b") + 1);
  });
}
const btnChecked = document.getElementById("btnChecked");
if (btnChecked) {
  btnChecked.addEventListener("click", () => {
    app.$set("checked", !app.$get("checked"));
  });
}

const btnTitle = document.getElementById("btnTitle");
if (btnTitle) {
  btnTitle.addEventListener("click", () => {
    app.$set("title", "hi, a is " + app.$get("b"));
  });
}

const appIn = createApp([app]);
appIn.mount("#app");

const unmount = document.getElementById("unmount");
if (unmount) {
  unmount.addEventListener("click", () => {
    appIn.unmount();
  });
}
