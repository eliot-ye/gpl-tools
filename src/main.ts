import "./style.css";
import { createSubscribeState, createSubscribeEvents } from "../lib";
import { createApp } from "../lib/BindDOM";

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

const titleEve = createSubscribeEvents<string>();
titleEve.subscribe((value) => {
  console.log("订阅 event title", value);
  app.$setState("title", value);
});

const btnA = document.getElementById("btnA");
if (btnA) {
  btnA.addEventListener("click", () => {
    for (let i = 0; i < 100; i++) {
      app.$setState("a", app.$getState().a + 1);
    }
    app.$setState("a", app.$get("a") + 1);
    app.$setFromStringKey("data.a", app.$get("data").a + 1);
  });
}

const btnB = document.getElementById("btnB");
if (btnB) {
  btnB.addEventListener("click", () => {
    app.$setState("b", app.$get("b") + 1);
  });
}
const btnChecked = document.getElementById("btnChecked");
if (btnChecked) {
  btnChecked.addEventListener("click", () => {
    app.$setState("checked", !app.$get("checked"));
  });
}

const btnTitle = document.getElementById("btnTitle");
if (btnTitle) {
  btnTitle.addEventListener("click", () => {
    titleEve.publish("hi, a is " + app.$get("b"));
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
