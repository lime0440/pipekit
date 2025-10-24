const { Core } = Global;

customElements.define('moving-content', class extends Core {
  elements = { $: ['content'] };

  // ---------------- Lifecycle ----------------
  render() {
    // Host should not leak overflow while sliding
    this.style.overflow = 'hidden';

    this._content = this.$('content'); // [data-element="content"]
    this._slides  = Array.from(this._content?.children || []).filter(n => n.nodeType === 1);
    if (!this._content || this._slides.length === 0) return;

    // Bind once
    this._onResize = this._onResize || this._handleResize.bind(this);

    // Initial mode setup + listen for viewport changes
    this._handleResize();
    window.addEventListener('resize', this._onResize, { passive: true });

    // Optional pause on hover/touch (honors section setting)
    const pauseFlag = (this.dataset.pauseOnHover || '').toString() === 'true';
    if (pauseFlag) {
      this._onEnter = this._onEnter || (() => this._maybePause(true));
      this._onLeave = this._onLeave || (() => this._maybePause(false));
      this.addEventListener('mouseenter', this._onEnter);
      this.addEventListener('mouseleave', this._onLeave);
      this.addEventListener('touchstart', this._onEnter, { passive: true });
      this.addEventListener('touchend', this._onLeave,   { passive: true });
    }
  }

  disconnectedCallback() {
    this._stopAutoplay();
    window.removeEventListener('resize', this._onResize);
    this.removeEventListener('mouseenter', this._onEnter);
    this.removeEventListener('mouseleave', this._onLeave);
    this.removeEventListener('touchstart', this._onEnter);
    this.removeEventListener('touchend', this._onLeave);
    if (this._content) {
      this._content.removeEventListener('transitionend', this._onTransitionEnd);
    }
  }

  // ---------------- Mobile slider (infinite) ----------------
  _enableSlider() {
    if (this._sliderEnabled) return;
    this._sliderEnabled = true;

    // Layout for sliding (left-packed row)
    this._content.style.display         = 'flex';
    this._content.style.gap             = '0';
    this._content.style.willChange      = 'transform';
    this._content.style.justifyContent  = 'flex-start';
    this._content.style.whiteSpace      = 'normal';

    // Build infinite track (adds clones when >= 2 originals)
    this._buildInfiniteTrack();

    // Start at first real slide if looping; otherwise 0
    this._index = this._looping ? 1 : 0;

    this._setSlideWidths();
    this._jumpTo(this._index, false);

    // Seamless loop index normalization
    this._content.addEventListener('transitionend', this._onTransitionEnd);

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this._startAutoplay();
    }
  }

  _disableSlider() {
    if (!this._sliderEnabled) return;
    this._sliderEnabled = false;

    this._stopAutoplay();

    // Remove listener for loop normalization
    this._content.removeEventListener('transitionend', this._onTransitionEnd);

    // Cleanup inline styles on track
    this._content.style.transform       = '';
    this._content.style.transition      = '';
    this._content.style.display         = '';
    this._content.style.gap             = '';
    this._content.style.willChange      = '';
    this._content.style.justifyContent  = '';
    this._content.style.whiteSpace      = '';

    // Remove clones and restore originals
    this._teardownClones();

    // Clear per-slide sizing
    this._slides.forEach(el => {
      el.style.flex = '';
      el.style.width = '';
      el.style.minWidth = '';
    });
  }

  _setSlideWidths() {
    const width = this.clientWidth; // host width
    this._slideWidth = width;
    this._slides.forEach(el => {
      el.style.flex     = `0 0 ${width}px`;
      el.style.width    = `${width}px`;
      el.style.minWidth = `${width}px`;
    });
  }

  _jumpTo(i, animate = true) {
    if (!this._sliderEnabled) return;
    this._content.style.transition = animate ? 'transform 400ms ease' : 'none';
    this._content.style.transform  = `translate3d(${-i * this._slideWidth}px,0,0)`;
  }

  _next() {
    if (!this._slides.length) return;
    this._index += 1;
    // When looping, we let transitionend normalize if we hit a clone.
    if (!this._looping) this._index = this._index % this._slides.length;
    this._jumpTo(this._index, true);
  }

  _startAutoplay() {
    this._stopAutoplay();
    this._timer = setInterval(() => this._next(), 3000); // advance every 3s
  }

  _stopAutoplay() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }

  _maybePause(pause) {
    if (!this._sliderEnabled) return;
    if (pause) this._stopAutoplay();
    else this._startAutoplay();
  }

  // ---------------- Infinite loop helpers ----------------
  _buildInfiniteTrack() {

    this._teardownClones();

    const originals = Array.from(this._content.children)
      .filter(n => n.nodeType === 1 && !n.dataset.clone);

    if (originals.length < 2) {
      this._slides = originals;
      this._looping = false;
      return;
    }

    this._looping = true;

    const first = originals[0];
    const last  = originals[originals.length - 1];

    const firstClone = first.cloneNode(true);
    const lastClone  = last.cloneNode(true);
    firstClone.dataset.clone = 'first';
    lastClone .dataset.clone = 'last';


    this._content.prepend(lastClone);
    this._content.append(firstClone);


    this._slides = Array.from(this._content.children).filter(n => n.nodeType === 1);
  }

  _teardownClones() {
    Array.from(this._content?.children || [])
      .filter(n => n.nodeType === 1 && n.dataset && n.dataset.clone)
      .forEach(n => n.remove());

    // Restore slide cache to originals only
    this._slides = Array.from(this._content?.children || [])
      .filter(n => n.nodeType === 1 && !n.dataset.clone);
  }

  _onTransitionEnd = () => {
    if (!this._sliderEnabled || !this._looping) return;

    const cur = this._slides[this._index];
    const atFirstClone = cur?.dataset?.clone === 'first';
    const atLastClone  = cur?.dataset?.clone === 'last';

    if (atFirstClone) {
      // Stepped onto trailing first-clone → jump to first real (index 1)
      this._index = 1;
      this._jumpTo(this._index, false);
    } else if (atLastClone) {
      // Stepped onto leading last-clone → jump to last real (index len-2)
      this._index = this._slides.length - 2;
      this._jumpTo(this._index, false);
    }
  };

  // ---------------- Mode switching ----------------
  _isMobile() { return window.matchMedia('(max-width: 991px)').matches; }

  _handleResize() {
    const mobile = this._isMobile();
    if (mobile) {
      if (!this._sliderEnabled) this._enableSlider();
      this._setSlideWidths();
      this._jumpTo(this._index ?? (this._looping ? 1 : 0), false);
    } else {
      this._disableSlider(); // desktop: no sliding
    }
  }
});
