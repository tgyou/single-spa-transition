import './style.css';
import singleSpa, { getAppStatus, MOUNTED, NOT_MOUNTED } from 'single-spa';

const DEFAULT_DURATION = 600; // ms

class TransitionSingleSpa {
  private firstMount = true;
  private historyState = null;
  private duration = DEFAULT_DURATION;

  constructor(duration?:number) {
    if (duration) this.duration = duration;
    this.listenSpaEvent();
    this.addRootClassname();
    this.checkAlreadyMounted();
  }

  private addRootClassname() {
    if (!document.body.classList.contains('spa-transition')) {
      document.body.classList.add('spa-transition');
    }
  }

  private checkAlreadyMounted() {
    const wrappers = document.querySelectorAll('[id^="single-spa-application:"]:not([class]):not([data-cloned])');
    if (!this.firstMount || !wrappers.length) return;
    Array.from(wrappers).map((wrapper: HTMLDivElement) => {
      const [, appName] = wrapper.getAttribute('id').split(':');
      if (getAppStatus(appName) === MOUNTED) {
        wrapper.classList.add('active');
        this.firstMount = false;
      }
    })
  }

  private listenSpaEvent() {
    window.addEventListener('single-spa:before-app-change', (event: any) => {
      Object.keys(event.detail.newAppStatuses).map(appName => {
        if (event.detail.newAppStatuses[appName] === NOT_MOUNTED)
          this.transitionHandler(event, appName, 'exit'); 
      })
    });
    
    window.addEventListener('single-spa:app-change', (event: any) => {
      Object.keys(event.detail.newAppStatuses).map(appName => {
        if (event.detail.newAppStatuses[appName] === MOUNTED)
          this.transitionHandler(event, appName, 'enter');
      })
    });
  }

  private getDirection(event?:any) { 
    let direction = 'popstate';
  
    if (window.history.state?.trigger) {
      direction = window.history.state?.trigger
    } else if (event?.detail?.originalEvent?.singleSpaTrigger) {
      direction = event?.detail?.originalEvent?.singleSpaTrigger
    } else if (direction === 'popstate' && this.historyState?.trigger === 'popstate') {
      direction = 'pushstate';
    }
  
    setTimeout(() => this.historyState = window.history.state, 50);
    return direction.replace(/state/i, '');
  }
  

  private transitionHandler(event, appName: string, action: 'enter' | 'exit') {
    const direction = this.getDirection(event);
  
    let wrapper = document.querySelector(`[id$="${appName}"]:not([data-cloned])`) as HTMLDivElement;
    if (!wrapper) return;
    let originWrapper;
  
    // if first mount. no apply transition effect.
    if (action === 'enter' && this.firstMount) {
      this.firstMount = false;
      wrapper.classList.add('active');
      return;
    }
  
    // when if action is `exit`. clone the element.
    if (action === 'exit') {
      originWrapper = wrapper;
      wrapper.removeAttribute('class');
      
      wrapper = wrapper.cloneNode(true) as HTMLDivElement;
      wrapper.setAttribute('id', `${wrapper.getAttribute('id')}:exit`);
      wrapper.setAttribute('data-cloned', '1');

      originWrapper.insertAdjacentElement('afterend', wrapper);
    }
  
    // set position next page position by current page.
    if (direction === 'pop' && action === 'exit') {
      const scrollTop = document.documentElement.scrollTop;
      wrapper.style.top = `-${scrollTop}px`;
      wrapper.style.height = `calc(100vh + ${scrollTop}px)`;
    }
  
    // save `scrollTop`
    if (direction === 'push' && action === 'exit') {
      const scrollTop = document.documentElement.scrollTop;
      originWrapper.setAttribute('data-pop-scroll', scrollTop);
    }
  
    // restore `scrollTop` by saved.
    if (direction === 'pop' && action === 'enter') {
      const scrollTop = parseInt(wrapper.getAttribute('data-pop-scroll') || '0', 0);
      if (scrollTop) {
        document.documentElement.scrollTop = scrollTop;
        wrapper.removeAttribute('data-pop-scroll');
      }
    }
  
    window.requestAnimationFrame(() => {
      // remove class attribute (for reset)
      wrapper.removeAttribute('class');
  
      // initialize transition.
      wrapper.classList.add(direction);
      wrapper.classList.add(action);
  
      // start transition.
      setTimeout(() => wrapper.classList.add(`${action}-active`),1);
      
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
        if (getAppStatus(appName) === MOUNTED) {
          wrapper.classList.add('active');
        }
      }, this.duration);
    })
  }
}

export default TransitionSingleSpa;