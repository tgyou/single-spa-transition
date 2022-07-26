import { getAppStatus, LOAD_ERROR, MOUNTED, NOT_MOUNTED, SKIP_BECAUSE_BROKEN } from 'single-spa';
import globalCSS from '!!raw-loader!./global.css';
import transitionCSS from '!!raw-loader!./transition.css';

const DEFAULT_DURATION = 500; // ms
const DEFAULT_DELAY = 100; // ms

interface SingleSpaTransitionStyle {
  width?: number | string;
  height?: number | string;
  left?: number | string;
  top?: number | string;
  backgroundColor?: string;
}

interface SingleSpaTransitionOptions {
  duration?: number; // default: 500
  delay?: number; // default: 100
  style?: SingleSpaTransitionStyle; // default: {},
  unmountAfterMount?: boolean; // default: false
  injectGlobalStyleSheet?: boolean; // default: true
  injectStyleSheet?: boolean; // default: true
}

class SingleSpaTransition {
  // options
  private _duration: number = DEFAULT_DURATION;
  private _delay: number = DEFAULT_DELAY;
  private _style: SingleSpaTransitionStyle = {};
  private unmountAfterMount: boolean = false;

  // internal state
  private firstMount: boolean = true;
  private historyState: any = null;
  private scrollStates: any = {};
  private unmountCallback: Function | null = null;

  constructor(options?: SingleSpaTransitionOptions) {
    if (typeof window === undefined) return;

    const { duration, delay, style, unmountAfterMount, injectGlobalStyleSheet, injectStyleSheet } = options;

    if (duration > -1) this._duration = duration;
    if (delay > -1) this._delay = delay;
    if (style) this._style = style;
    if (unmountAfterMount !== undefined) this.unmountAfterMount = unmountAfterMount;

    this.listenSpaEvent();
    this.checkAlreadyMounted();
    this.createStyleSheet(injectGlobalStyleSheet, injectStyleSheet);

    const win = window as any;
    if (win.singleSpaTransition) {
      console.warn('`single-spa-transition` is already declared. cannot duplicate declaration.');
    } else {
      win.singleSpaTransition = this;
    }

    return win.singleSpaTransition;
  }

  public set duration(duration: number) {
    this._duration = duration;
    this.updateStyleSheet();
  }

  public get duration() {
    return this._duration;
  }

  public set delay(delay: number) {
    this._delay = delay;
    this.updateStyleSheet();
  }

  public get delay() {
    return this._delay;
  }

  public set style(style: SingleSpaTransitionStyle) {
    this._style = style;
    this.updateStyleSheet();
  }

  public get style() {
    return this._style;
  }

  private get timeout() {
    return this._duration + this._delay;
  }

  get stylesheet() {
    const rows = [
      `--spa-transition-duration: ${this._duration}ms;`,
      `--spa-transition-delay: ${this._delay}ms;`,
      ...Object.keys(this._style).map(key => {
        const k = key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
        const v = typeof this._style[key] === 'number' ? this._style[key] + 'px' : this._style[key];
        return `--spa-transition-${k}: ${v};`;
      }),
    ];

    return `:root { ${rows.join(' ')} }`;
  }

  private createStyleSheet(injectGlobalStyleSheet = true, injectStyleSheet = true) {
    if (injectGlobalStyleSheet) {
      const styleGlobal = document.createElement('style');
      styleGlobal.setAttribute('data-spa-style', 'global');
      styleGlobal.textContent = globalCSS;
      document.querySelector('head').appendChild(styleGlobal);
    }

    const styleVar = document.createElement('style');
    styleVar.setAttribute('data-spa-style', 'variables');
    styleVar.textContent = this.stylesheet;
    document.querySelector('head').appendChild(styleVar);

    if (injectStyleSheet) {
      const styleTransition = document.createElement('style');
      styleTransition.setAttribute('data-spa-style', 'transition');
      styleTransition.textContent = transitionCSS;
      document.querySelector('head').appendChild(styleTransition);
    }

    this.addRootClassname();
    return this;
  }

  private updateStyleSheet() {
    const style = document.querySelector('style[data-spa-style]');
    style.textContent = this.stylesheet;
    this.addRootClassname();
    return this;
  }

  private addRootClassname() {
    if (!document.body.classList.contains('spa-transition') && this._duration) {
      document.body.classList.add('spa-transition');
    } else if (document.body.classList.contains('spa-transition') && !this._duration) {
      document.body.classList.remove('spa-transition');
    }
    return this;
  }

  private checkAlreadyMounted() {
    const wrappers = document.querySelectorAll('[id^="single-spa-application:"]:not([class]):not([data-cloned])');
    if (!this.firstMount || !wrappers.length) return;
    Array.from(wrappers).map((wrapper: HTMLDivElement) => {
      const [, appName] = wrapper.getAttribute('id').split(':');
      if ([MOUNTED, LOAD_ERROR, SKIP_BECAUSE_BROKEN].includes(getAppStatus(appName))) {
        wrapper.classList.add('active');
        this.firstMount = false;
      }
    });
    return this;
  }

  private listenSpaEvent() {
    window.addEventListener('single-spa:before-app-change', (event: any) => {
      Object.keys(event.detail.newAppStatuses).map(appName => {
        if (event.detail.newAppStatuses[appName] === NOT_MOUNTED)
          this.unmountCallback = this.transitionHandler(event, appName, 'exit');
      });
    });

    window.addEventListener('single-spa:app-change', (event: any) => {
      Object.keys(event.detail.newAppStatuses).map(appName => {
        if ([MOUNTED, LOAD_ERROR, SKIP_BECAUSE_BROKEN].includes(event.detail.newAppStatuses[appName]))
          this.transitionHandler(event, appName, 'enter');
      });
    });

    return this;
  }

  private getDirection(event?: any) {
    let direction = 'popstate';

    if (window.history.state?.trigger) {
      direction = window.history.state?.trigger;
    } else if (event?.detail?.originalEvent?.singleSpaTrigger) {
      direction = event?.detail?.originalEvent?.singleSpaTrigger;
    } else if (direction === 'popstate' && this.historyState?.trigger === 'popstate') {
      direction = 'pushstate';
    }

    setTimeout(() => (this.historyState = window.history.state), 50);
    return direction.replace(/state/i, '');
  }

  private transitionHandler(event, appName: string, action: 'enter' | 'exit') {
    const direction = this.getDirection(event);

    let wrapper = document.querySelector(`[id$="${appName}"]`) as HTMLDivElement;
    if (!wrapper) return null;

    /**
     * If first mount.
     * no apply transition effect.
     */
    if (action === 'enter' && this.firstMount) {
      this.firstMount = false;
      wrapper.classList.add('active');
      return null;
    }

    /**
     * Call waited `exit` callback.
     */

    if (action === 'enter' && this.unmountCallback) {
      this.unmountCallback();
      this.unmountCallback = null;
    }

    /**
     * when if action is `exit`. clone the element.
     */

    if (action === 'exit') {
      const originWrapper = wrapper;
      wrapper.removeAttribute('class');

      wrapper = wrapper.cloneNode(true) as HTMLDivElement;
      wrapper.setAttribute('id', `${wrapper.getAttribute('id')}:exit`);

      originWrapper.insertAdjacentElement('afterend', wrapper);
    }

    /**
     * Scroll
     */

    // set position next page position by current page.
    if (direction === 'pop' && action === 'exit') {
      const scrollTop = document.documentElement.scrollTop;
      wrapper.style.top = `-${scrollTop}px`;
      wrapper.style.height = `calc(100vh + ${scrollTop}px)`;
    }

    // save `scrollTop`
    if (direction === 'push' && action === 'exit') {
      this.scrollStates[appName] = document.documentElement.scrollTop;
    }

    // restore `scrollTop` by saved.
    if (direction === 'pop' && action === 'enter') {
      const scrollTop = this.scrollStates[appName];
      document.documentElement.scrollTop = scrollTop;
      delete this.scrollStates[appName];
    }

    /**
     * Reset and initialize transition class.
     */

    const resetAndEnter = () => {
      // remove class attribute (for reset)
      wrapper.removeAttribute('class');

      // initialize transition.
      wrapper.classList.add(direction);
      wrapper.classList.add(action);
    };

    /**
     * Active transitions.
     */

    const enterActive = () => {
      window.requestAnimationFrame(() => {
        // start transition.
        setTimeout(() => wrapper.classList.add(`${action}-active`), 1);

        // reset transiiton.
        setTimeout(() => {
          if (action === 'exit') {
            // when if action is `exit`, remove cloned element.
            wrapper.parentNode?.removeChild(wrapper);
            return;
          }

          // if action is `enter`, remove transition classes.
          wrapper.removeAttribute('class');

          // scroll to top
          if (direction === 'push' && action === 'enter' && document.documentElement.scrollTop) {
            document.documentElement.scrollTop = 0;
          }

          // marked `active` when mounted app.
          if ([MOUNTED, LOAD_ERROR, SKIP_BECAUSE_BROKEN].includes(getAppStatus(appName))) {
            wrapper.classList.add('active');
          }
        }, this.timeout);
      });

      return null;
    };

    resetAndEnter();

    if (action === 'exit' && this.unmountAfterMount) {
      return enterActive;
    } else {
      return enterActive();
    }
  }
}

export default SingleSpaTransition;
