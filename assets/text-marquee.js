const { Core } = Global;

customElements.define('moving-content', class extends Core {
  elements = { $: ['content'] };

  connectedCallback() {
    super.connectedCallback?.();

    this._tpl = this.$('content')?.cloneNode(true);


    this._build();


    this._mq = window.matchMedia('(min-width: 992px)');
    this._onMQ = e => this._build(e.matches);

    this._mq.addEventListener?.('change', this._onMQ) || this._mq.addListener?.(this._onMQ);


    let t;
    this._onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => this._build(), 100);
    };
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  disconnectedCallback() {
    this._mq?.removeEventListener?.('change', this._onMQ);
    this._mq?.removeListener?.(this._onMQ);
    window.removeEventListener('resize', this._onResize);
  }

  render() {
    this._build();
  }

  _build(forceIsDesktop) {
    const isDesktop = (forceIsDesktop ?? this._mq?.matches ?? window.innerWidth >= 992);


    if (isDesktop) {
      if (!this._isDesktopRendered) {
        if (this._tpl) this.replaceChildren(this._tpl.cloneNode(true));
        this._isDesktopRendered = true;
        this._isMobileRendered = false;
      }
      this._setVars(); 
      return;
    }


    if (!this._isMobileRendered) {
      this._setContent(); 
      this._isMobileRendered = true;
      this._isDesktopRendered = false;
    }

    this._setVars();
  }

  _setVars() {
    const content = this.querySelector('[data-element="content"]');
    if (!content) return;
    const width = content.offsetWidth || 0;
    this.style.setProperty('--content-width', `${width}`);
  }

  _setContent() {
    const content = this._tpl?.cloneNode(true);
    if (!content) return;

    const measure = document.createElement('div');
    measure.style.position = 'absolute';
    measure.style.visibility = 'hidden';
    measure.style.pointerEvents = 'none';
    measure.appendChild(content.cloneNode(true));
    document.body.appendChild(measure);
    const stripWidth = measure.firstElementChild.offsetWidth || 0;
    document.body.removeChild(measure);

    const vw = this.clientWidth || window.innerWidth;
    const repeats = Math.max(2, Math.ceil((vw + stripWidth) / stripWidth));

    const track = document.createDocumentFragment();
    for (let i = 0; i < repeats; i++) {
      track.appendChild(content.cloneNode(true));
    }

    this.replaceChildren(track);
  }

  get duplicates() {
    const isDesktop = this._mq?.matches ?? window.innerWidth >= 992;
    return isDesktop ? 1 : Math.ceil(window.innerWidth / (parseFloat(getComputedStyle(this).getPropertyValue('--content-width')) || 1)) + 1;
  }
});
