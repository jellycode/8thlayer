(function () {
  'use strict';

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

  // Older browsers don't support event options, feature detect it.

  // Adopted and modified solution from Bohdan Didukh (2017)
  // https://stackoverflow.com/questions/41594997/ios-10-safari-prevent-scrolling-behind-a-fixed-overlay-and-maintain-scroll-posi

  var hasPassiveEvents = false;
  if (typeof window !== 'undefined') {
    var passiveTestOptions = {
      get passive() {
        hasPassiveEvents = true;
        return undefined;
      }
    };
    window.addEventListener('testPassive', null, passiveTestOptions);
    window.removeEventListener('testPassive', null, passiveTestOptions);
  }

  var isIosDevice = typeof window !== 'undefined' && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);


  var locks = [];
  var documentListenerAdded = false;
  var initialClientY = -1;
  var previousBodyOverflowSetting = void 0;
  var previousBodyPaddingRight = void 0;

  // returns true if `el` should be allowed to receive touchmove events.
  var allowTouchMove = function allowTouchMove(el) {
    return locks.some(function (lock) {
      if (lock.options.allowTouchMove && lock.options.allowTouchMove(el)) {
        return true;
      }

      return false;
    });
  };

  var preventDefault = function preventDefault(rawEvent) {
    var e = rawEvent || window.event;

    // For the case whereby consumers adds a touchmove event listener to document.
    // Recall that we do document.addEventListener('touchmove', preventDefault, { passive: false })
    // in disableBodyScroll - so if we provide this opportunity to allowTouchMove, then
    // the touchmove event on document will break.
    if (allowTouchMove(e.target)) {
      return true;
    }

    // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
    if (e.touches.length > 1) return true;

    if (e.preventDefault) e.preventDefault();

    return false;
  };

  var setOverflowHidden = function setOverflowHidden(options) {
    // If previousBodyPaddingRight is already set, don't set it again.
    if (previousBodyPaddingRight === undefined) {
      var _reserveScrollBarGap = !!options && options.reserveScrollBarGap === true;
      var scrollBarGap = window.innerWidth - document.documentElement.clientWidth;

      if (_reserveScrollBarGap && scrollBarGap > 0) {
        previousBodyPaddingRight = document.body.style.paddingRight;
        document.body.style.paddingRight = scrollBarGap + 'px';
      }
    }

    // If previousBodyOverflowSetting is already set, don't set it again.
    if (previousBodyOverflowSetting === undefined) {
      previousBodyOverflowSetting = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  };

  var restoreOverflowSetting = function restoreOverflowSetting() {
    if (previousBodyPaddingRight !== undefined) {
      document.body.style.paddingRight = previousBodyPaddingRight;

      // Restore previousBodyPaddingRight to undefined so setOverflowHidden knows it
      // can be set again.
      previousBodyPaddingRight = undefined;
    }

    if (previousBodyOverflowSetting !== undefined) {
      document.body.style.overflow = previousBodyOverflowSetting;

      // Restore previousBodyOverflowSetting to undefined
      // so setOverflowHidden knows it can be set again.
      previousBodyOverflowSetting = undefined;
    }
  };

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#Problems_and_solutions
  var isTargetElementTotallyScrolled = function isTargetElementTotallyScrolled(targetElement) {
    return targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false;
  };

  var handleScroll = function handleScroll(event, targetElement) {
    var clientY = event.targetTouches[0].clientY - initialClientY;

    if (allowTouchMove(event.target)) {
      return false;
    }

    if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
      // element is at the top of its scroll.
      return preventDefault(event);
    }

    if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
      // element is at the bottom of its scroll.
      return preventDefault(event);
    }

    event.stopPropagation();
    return true;
  };

  var disableBodyScroll = function disableBodyScroll(targetElement, options) {
    // targetElement must be provided
    if (!targetElement) {
      // eslint-disable-next-line no-console
      console.error('disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.');
      return;
    }

    // disableBodyScroll must not have been called on this targetElement before
    if (locks.some(function (lock) {
      return lock.targetElement === targetElement;
    })) {
      return;
    }

    var lock = {
      targetElement: targetElement,
      options: options || {}
    };

    locks = [].concat(_toConsumableArray(locks), [lock]);

    if (isIosDevice) {
      targetElement.ontouchstart = function (event) {
        if (event.targetTouches.length === 1) {
          // detect single touch.
          initialClientY = event.targetTouches[0].clientY;
        }
      };
      targetElement.ontouchmove = function (event) {
        if (event.targetTouches.length === 1) {
          // detect single touch.
          handleScroll(event, targetElement);
        }
      };

      if (!documentListenerAdded) {
        document.addEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
        documentListenerAdded = true;
      }
    } else {
      setOverflowHidden(options);
    }
  };

  var enableBodyScroll = function enableBodyScroll(targetElement) {
    if (!targetElement) {
      // eslint-disable-next-line no-console
      console.error('enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.');
      return;
    }

    locks = locks.filter(function (lock) {
      return lock.targetElement !== targetElement;
    });

    if (isIosDevice) {
      targetElement.ontouchstart = null;
      targetElement.ontouchmove = null;

      if (documentListenerAdded && locks.length === 0) {
        document.removeEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
        documentListenerAdded = false;
      }
    } else if (!locks.length) {
      restoreOverflowSetting();
    }
  };

  // uncomment for packing

  class ImageCompare {
    constructor(el, settings = {}) {
      const defaults = {
        controlColor: "#FFFFFF",
        controlShadow: true,
        addCircle: false,
        addCircleBlur: true,
        showLabels: false,
        labelOptions: {
          before: "Before",
          after: "After",
          onHover: false,
        },
        smoothing: true,
        smoothingAmount: 100,
        hoverStart: false,
        verticalMode: false,
        startingPoint: 50,
        fluidMode: false,
      };

      this.settings = Object.assign(defaults, settings);

      this.safariAgent =
        navigator.userAgent.indexOf("Safari") != -1 &&
        navigator.userAgent.indexOf("Chrome") == -1;

      this.el = el;
      this.images = {};
      this.wrapper = null;
      this.control = null;
      this.arrowContainer = null;
      this.arrowAnimator = [];
      this.active = false;
      this.slideWidth = 50;
      this.lineWidth = 2;
      this.arrowCoordinates = {
        circle: [5, 3],
        standard: [8, 0],
      };
    }

    mount() {
      // Temporarily disable Safari smoothing
      if (this.safariAgent) {
        this.settings.smoothing = false;
      }

      this._shapeContainer();
      this._getImages();
      this._buildControl();
      this._events();
    }

    _events() {

      // Desktop events
      this.el.addEventListener("mousedown", (ev) => {
        this._activate(true);
        document.body.classList.add("icv__body");
        disableBodyScroll(this.el, {reserveScrollBarGap: true});
        this._slideCompare(ev);
      });
      this.el.addEventListener(
        "mousemove",
        (ev) => this.active && this._slideCompare(ev)
      );

      this.el.addEventListener("mouseup", () => this._activate(false));
      document.body.addEventListener("mouseup", () => {
        document.body.classList.remove("icv__body");
        enableBodyScroll(this.el);
        this._activate(false);
      });

      // Mobile events

      this.control.addEventListener("touchstart", (e) => {
        this._activate(true);
        document.body.classList.add("icv__body");
        disableBodyScroll(this.el, {reserveScrollBarGap: true});
      });

      this.el.addEventListener("touchmove", (ev) => {
        this.active && this._slideCompare(ev);
      });
      this.el.addEventListener("touchend", () => {
        this._activate(false);
        document.body.classList.remove("icv__body");
        enableBodyScroll(this.el);
      });

      // hover

      this.el.addEventListener("mouseenter", () => {
        this.settings.hoverStart && this._activate(true);
        let coord = this.settings.addCircle
          ? this.arrowCoordinates.circle
          : this.arrowCoordinates.standard;

        this.arrowAnimator.forEach((anim, i) => {
          anim.style.cssText = `
        ${
          this.settings.verticalMode
            ? `transform: translateY(${coord[1] * (i === 0 ? 1 : -1)}px);`
            : `transform: translateX(${coord[1] * (i === 0 ? 1 : -1)}px);`
        }
        `;
        });
      });

      this.el.addEventListener("mouseleave", () => {
        let coord = this.settings.addCircle
          ? this.arrowCoordinates.circle
          : this.arrowCoordinates.standard;

        this.arrowAnimator.forEach((anim, i) => {
          anim.style.cssText = `
        ${
          this.settings.verticalMode
            ? `transform: translateY(${
                i === 0 ? `${coord[0]}px` : `-${coord[0]}px`
              });`
            : `transform: translateX(${
                i === 0 ? `${coord[0]}px` : `-${coord[0]}px`
              });`
        }
        `;
        });
      });
    }

    _slideCompare(ev) {
      let bounds = this.el.getBoundingClientRect();
      let x =
        ev.touches !== undefined
          ? ev.touches[0].clientX - bounds.left
          : ev.clientX - bounds.left;
      let y =
        ev.touches !== undefined
          ? ev.touches[0].clientY - bounds.top
          : ev.clientY - bounds.top;

      let position = this.settings.verticalMode
        ? (y / bounds.height) * 100
        : (x / bounds.width) * 100;

      if (position >= 0 && position <= 100) {
        this.settings.verticalMode
          ? (this.control.style.top = `calc(${position}% - ${
            this.slideWidth / 2
          }px)`)
          : (this.control.style.left = `calc(${position}% - ${
            this.slideWidth / 2
          }px)`);

        if (this.settings.fluidMode) {
          this.settings.verticalMode
            ? (this.wrapper.style.clipPath = `inset(0 0 ${100 - position}% 0)`)
            : (this.wrapper.style.clipPath = `inset(0 0 0 ${position}%)`);
        } else {
          this.settings.verticalMode
            ? (this.wrapper.style.height = `calc(${position}%)`)
            : (this.wrapper.style.width = `calc(${100 - position}%)`);
        }
      }
    }

    _activate(state) {
      this.active = state;
    }

    _shapeContainer() {
      let imposter = document.createElement("div");
      let label_l = document.createElement("span");
      let label_r = document.createElement("span");

      label_l.classList.add("icv__label", "icv__label-before", "keep");
      label_r.classList.add("icv__label", "icv__label-after", "keep");

      if (this.settings.labelOptions.onHover) {
        label_l.classList.add("on-hover");
        label_r.classList.add("on-hover");
      }

      if (this.settings.verticalMode) {
        label_l.classList.add("vertical");
        label_r.classList.add("vertical");
      }

      label_l.innerHTML = this.settings.labelOptions.before || "Before";
      label_r.innerHTML = this.settings.labelOptions.after || "After";

      if (this.settings.showLabels) {
        this.el.appendChild(label_l);
        this.el.appendChild(label_r);
      }

      this.el.classList.add(
        `icv`,
        this.settings.verticalMode
          ? `icv__icv--vertical`
          : `icv__icv--horizontal`,
        this.settings.fluidMode ? `icv__is--fluid` : `standard`
      );

      imposter.classList.add("icv__imposter");

      this.el.appendChild(imposter);
    }

    _buildControl() {
      let control = document.createElement("div");
      let uiLine = document.createElement("div");
      let arrows = document.createElement("div");
      let circle = document.createElement("div");

      const arrowSize = "20";

      arrows.classList.add("icv__theme-wrapper");

      for (var idx = 0; idx <= 1; idx++) {
        let animator = document.createElement(`div`);

        let arrow = `<svg
      height="15"
      width="15"
       style="
       transform: 
       scale(${this.settings.addCircle ? 0.7 : 1.5})  
       rotateZ(${
         idx === 0
           ? this.settings.verticalMode
             ? `-90deg`
             : `180deg`
           : this.settings.verticalMode
           ? `90deg`
           : `0deg`
       }); height: ${arrowSize}px; width: ${arrowSize}px;
       
       ${
         this.settings.controlShadow
           ? `
       -webkit-filter: drop-shadow( 0px 3px 5px rgba(0, 0, 0, .33));
       filter: drop-shadow( 0px ${
         idx === 0 ? "-3px" : "3px"
       } 5px rgba(0, 0, 0, .33));
       `
           : ``
       }
       "
       xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 15 15">
       <path ${
         this.settings.addCircle
           ? `fill="transparent"`
           : `fill="${this.settings.controlColor}"`
       }
       stroke="${this.settings.controlColor}"
       stroke-linecap="round"
       stroke-width="${this.settings.addCircle ? 3 : 0}"
       d="M4.5 1.9L10 7.65l-5.5 5.4"
       />
     </svg>`;

        animator.innerHTML += arrow;
        this.arrowAnimator.push(animator);
        arrows.appendChild(animator);
      }

      let coord = this.settings.addCircle
        ? this.arrowCoordinates.circle
        : this.arrowCoordinates.standard;

      this.arrowAnimator.forEach((anim, i) => {
        anim.classList.add("icv__arrow-wrapper");

        anim.style.cssText = `
      ${
        this.settings.verticalMode
          ? `transform: translateY(${
              i === 0 ? `${coord[0]}px` : `-${coord[0]}px`
            });`
          : `transform: translateX(${
              i === 0 ? `${coord[0]}px` : `-${coord[0]}px`
            });`
      }
      `;
      });

      control.classList.add("icv__control");

      control.style.cssText = `
    ${this.settings.verticalMode ? `height` : `width `}: ${this.slideWidth}px;
    ${this.settings.verticalMode ? `top` : `left `}: calc(${
      this.settings.startingPoint
    }% - ${this.slideWidth / 2}px);
    ${
      "ontouchstart" in document.documentElement
        ? ``
        : this.settings.smoothing
        ? `transition: ${this.settings.smoothingAmount}ms ease-out;`
        : ``
    }
    `;

      uiLine.classList.add("icv__control-line");

      uiLine.style.cssText = `
      ${this.settings.verticalMode ? `height` : `width `}: ${this.lineWidth}px;
      background: ${this.settings.controlColor};
        ${
          this.settings.controlShadow
            ? `box-shadow: 0px 0px 15px rgba(0,0,0,0.33);`
            : ``
        }
    `;

      let uiLine2 = uiLine.cloneNode(true);

      circle.classList.add("icv__circle");
      circle.style.cssText = `

      ${
        this.settings.addCircleBlur &&
        `-webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px)`
      };
      
      border: ${this.lineWidth}px solid ${this.settings.controlColor};
      ${
        this.settings.controlShadow &&
        `box-shadow: 0px 0px 15px rgba(0,0,0,0.33)`
      };
    `;

      control.appendChild(uiLine);
      this.settings.addCircle && control.appendChild(circle);
      control.appendChild(arrows);
      control.appendChild(uiLine2);

      this.arrowContainer = arrows;

      this.control = control;
      this.el.appendChild(control);
    }

    _getImages() {
      let children = this.el.querySelectorAll("img, .keep");
      this.el.innerHTML = "";
      children.forEach((img) => {
        this.el.appendChild(img);
      });

      let childrenImages = [...children].filter(
        (element) => element.nodeName.toLowerCase() === "img"
      );

      //  this.settings.verticalMode && [...children].reverse();
      this.settings.verticalMode && childrenImages.reverse();

      for (let idx = 0; idx <= 1; idx++) {
        let child = childrenImages[idx];

        child.classList.add("icv__img");
        child.classList.add(idx === 0 ? `icv__img-a` : `icv__img-b`);

        if (idx === 1) {
          let wrapper = document.createElement("div");
          let afterUrl = childrenImages[1].src;
          wrapper.classList.add("icv__wrapper");
          wrapper.style.cssText = `
            width: ${100 - this.settings.startingPoint}%; 
            height: ${this.settings.startingPoint}%;

            ${
              "ontouchstart" in document.documentElement
                ? ``
                : this.settings.smoothing
                ? `transition: ${this.settings.smoothingAmount}ms ease-out;`
                : ``
            }
            ${
              this.settings.fluidMode &&
              `background-image: url(${afterUrl}); clip-path: inset(${
                this.settings.verticalMode
                  ? ` 0 0 ${100 - this.settings.startingPoint}% 0`
                  : `0 0 0 ${this.settings.startingPoint}%`
              })`
            }
        `;

          wrapper.appendChild(child);
          this.wrapper = wrapper;
          this.el.appendChild(this.wrapper);
        }
      }
      if (this.settings.fluidMode) {
        let url = childrenImages[0].src;
        let fluidWrapper = document.createElement("div");
        fluidWrapper.classList.add("icv__fluidwrapper");
        fluidWrapper.style.cssText = `
 
        background-image: url(${url});
        
      `;
        this.el.appendChild(fluidWrapper);
      }
    }
  }

  class CompareSlider extends HTMLElement {
   constructor() {
    super();
    const element = document.getElementById('image-compare');
    new ImageCompare(element).mount();
   }
  }
  customElements.define('compare-slider', CompareSlider);

})();
