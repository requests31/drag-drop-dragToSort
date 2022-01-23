﻿function DragSort(options) {
  this.parent = options.element; // 父级元素
  this.isPointerdown = false; // 标识鼠标是否已经按下
  this.diff = { y: 0 }; // 相对于上一次移动差值
  this.drag = {
    element: null,
    getText: 0,
    translate3dDistance: 0,
    top: 0,
    bottom: 0,
    oneIndex: 0,
  }; // 拖拽元素
  this.cllapse = { element: null, getText: 0, y: 0 }; 
  this.lastPointermove = { y: 0 };
  this.area = null; // 用来控制鼠标是否进入了元素区域
  this.rectList = []; // 用于保存拖拽项getBoundingClientRect()方法获得的元素虚拟位置
  this.allDom = []; // 真实变动位置的dom
  this.getRect(); // 实例化后，立即记录元素的初始位置
  this.bindEventListener(); // 绑定方法
  this.elementDistance = 0; // 记录碰撞元素偏离的距离
  this.locateParent = this.parent.getBoundingClientRect();
  this.selectNumbers = 0;
}

DragSort.prototype.getRect = function () {
  // 初始化数据为空数据
  this.rectList.length = 0;
  this.allDom.length = 0;
  for (const item of this.parent.children) {
    this.rectList = [
      ...this.rectList,
      {
        top: parseInt(item.getBoundingClientRect().top),
        bottom: parseInt(item.getBoundingClientRect().bottom),
        distance: 0,
      },
    ];
    this.allDom.push(item);
  }
};

// 绑定监听
DragSort.prototype.bindEventListener = function () {
  // 一、将函数的this都指向实例。如果不绑定函数的指向，监听事件会修改第2个参数this指向为this.parent
  this.handlePointerdown = this.handlePointerdown.bind(this);
  this.handlePointermove = this.handlePointermove.bind(this);
  this.handlePointerup = this.handlePointerup.bind(this);
  this.getRect = this.getRect.bind(this);
  // 二、三种实例方法：按下pointerdown、移动pointermove、松开pointerup
  // 1.父元素ul监听鼠标左键按下操作，addEventListener默认是事件冒泡行为，到底是谁触发了事件的发生？精确的某个子元素。
  this.parent.addEventListener("pointerdown", this.handlePointerdown);
  // 2.父元素ul监听鼠标移动
  this.parent.addEventListener("pointermove", this.handlePointermove);
  // 3.父元素ul监听鼠标左键松开
  this.parent.addEventListener("pointerup", this.handlePointerup);
  // 4.监听父级元素是否双指点击了（未奏效）
  this.parent.addEventListener("touchstart", function (e) {
    // document.write(e.touches.length)
    if (e.touches.length > 2) {
      this.parent.removeEventListener("pointerdown", this.handlePointermove);
      this.handlePointerup();
    }
  });
};


// 鼠标按下
DragSort.prototype.handlePointerdown = function (e) {
  // 确保是鼠标左键按下
  this.selectNumbers +=1
  if (this.selectNumbers > 1) return;
  if (e.pointerType === "mouse" && e.button !== 0) {
    return;
  }
  if (e.target === this.parent) {
    return;
  }
  this.isPointerdown = true;
  this.drag.element = e.target;
  this.lastPointermove.y = this.lastPointermove.y || e.clientY;
  this.drag.oneIndex = [].indexOf.call(this.parent.children, this.drag.element);
  for (let i = 0; i < this.parent.children.length; i++) {
    this.parent.children[i].childNodes[0].classList.add("wrapGray");
    this.parent.children[i].classList.remove("borderTopLine");
    if (i !== this.drag.oneIndex) {
      this.parent.children[i].classList.add("disabled");
    }
  }
  this.drag.element.classList.add("active");
  this.drag.element.childNodes[0].classList.remove("wrapGray");
  this.drag.element.childNodes[0].classList.add("wrapActive");
  this.drag.element.style.zIndex = "20";
  this.drag.element.addEventListener("mouseout", () => {
    this.handlePointerup();
  });
};
// 鼠标移动
DragSort.prototype.handlePointermove = function (e) {
  if (this.isPointerdown) {
    this.drag.top = this.drag.element.getBoundingClientRect().top;
    this.drag.bottom = this.drag.element.getBoundingClientRect().bottom;
    if (
      this.drag.bottom < this.locateParent.bottom + 5 &&
      this.drag.top > this.locateParent.top - 5
    ) {
      this.diff.y = e.clientY - this.lastPointermove.y;
      this.drag.element.style.transform =
        "translate3d(" + "0px, " + this.diff.y + "px, 0)";
      // 碰撞交换元素
      for (let i = 0; i < this.rectList.length; i++) {
        if (
          e.clientY > this.rectList[i].top &&
          e.clientY < this.rectList[i].bottom
        ) {
          this.cllapse.element = this.parent.children[i];
          this.cllapse.getText = this.cllapse.element.childNodes[0].innerText; // temp
          this.drag.getText = this.drag.element.childNodes[0].innerText;
          if (this.drag.element !== this.cllapse.element) {
            // 一、交换元素
            console.log(this.drag.getText < this.cllapse.getText)
            if (this.drag.getText > this.cllapse.getText) {
              this.elementDistance =
                this.rectList[i].bottom - this.rectList[i].top;
              this.cllapse.element.childNodes[0].innerText = this.drag.getText;
              this.drag.element.childNodes[0].innerText = this.cllapse.getText; // temp
              this.allDom[parseInt(this.cllapse.getText) - 1] =
                this.drag.element;
              this.allDom[parseInt(this.drag.getText) - 1] =
                this.cllapse.element;
              this.rectList[i].distance += this.elementDistance;
              this.cllapse.element.style.transform =
                "translate3d(" + "0px," + this.rectList[i].distance + "px, 0)";
              this.cllapse.element.style.transition = "0.3s";
              this.rectList[i].top += this.elementDistance;
              this.rectList[i].bottom += this.elementDistance;
              this.rectList[this.drag.oneIndex].top -= this.elementDistance;
              this.rectList[this.drag.oneIndex].bottom -= this.elementDistance;
              this.drag.translate3dDistance -= this.elementDistance;
            } else if (
                this.drag.getText < this.cllapse.getText
            ) {
              this.elementDistance =
                this.rectList[i].bottom - this.rectList[i].top;
              this.cllapse.element.childNodes[0].innerText = this.drag.getText;
              this.drag.element.childNodes[0].innerText = this.cllapse.getText; // temp
              this.allDom[parseInt(this.cllapse.getText) - 1] =
                this.drag.element;
              this.allDom[parseInt(this.drag.getText) - 1] =
                this.cllapse.element;
              this.rectList[i].distance -= this.elementDistance;
              this.cllapse.element.style.transform =
                "translate3d(" + "0px," + this.rectList[i].distance + "px, 0)";
              this.cllapse.element.style.transition = "0.3s";
              this.rectList[i].top -= this.elementDistance;
              this.rectList[i].bottom -= this.elementDistance;
              this.rectList[this.drag.oneIndex].top += this.elementDistance;
              this.rectList[this.drag.oneIndex].bottom += this.elementDistance;
              this.drag.translate3dDistance += this.elementDistance;
            }
          }
        }
      }
    } else {
      this.parent.removeEventListener("pointerdown", this.handlePointermove);
      this.handlePointerup();
    }
  }
};

// 鼠标松开
DragSort.prototype.handlePointerup = function (e) {
  if (this.isPointerdown) {
    this.isPointerdown = false;
    this.diff.y = 0;
    for (let i = 0; i < this.parent.children.length; i++) {
      this.parent.children[i].childNodes[0].classList.remove("wrapGray");
      this.parent.children[i].classList.add("borderTopLine");
      this.drag.element.classList.add("disabled");
    }
    this.drag.element.classList.remove("active");
    this.drag.element.childNodes[0].classList.remove("wrapActive");
    this.drag.element.style.transform =
      "translate3d(" + "0px," + this.drag.translate3dDistance + "px, 0)";
    this.drag.element.style.transition = "0.2s";
    setTimeout(() => {
      for (let i = 0; i < this.allDom.length; i++) {
        this.parent.children[i].classList.remove("disabled");
        let isTrue = this.parent.children[i] === this.allDom[i];
        if (!isTrue || this.parent.children[i].style.transform !== "") {
          this.parent.replaceChild(
            oneInnerHTML(this.allDom[i]),
            this.parent.children[i]
          );
        } else if (isTrue) {
          continue;
        }
      }
      this.drag.translate3dDistance = 0;
      this.getRect();
      this.elementDistance = 0;
      this.lastPointermove.y = 0;
      this.area = null;
      for (let i = 0; i < this.parent.children.length; i++) {
        this.parent.children[i].classList.remove("disabled");
      }
    }, 200);
    this.selectNumbers = 0
  }
};

function oneInnerHTML(oneDom) {
  const li = document.createElement("li");
  li.className = "column-item borderTopLine";
  oneDom.style = "";
  li.innerHTML = oneDom.innerHTML;
  return li;
}

// 实例化
const forexample = new DragSort({
  element: document.querySelector("#column"),
});
