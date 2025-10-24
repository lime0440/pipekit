const { Core, Utils, Events } = Global;

customElements.define('cart-notification', class extends Core {
  elements = { 'modal': 'modal-container' }

  // session cookie helpers
  _dismissCookie = 'cartNotifDismiss=1';
  _isDismissedCookie() { return document.cookie.split('; ').includes(this._dismissCookie); }
  _setDismissCookie()   { document.cookie = `${this._dismissCookie}; path=/`; } // session cookie

  render() {
    this._reportEnabling();
    this._handleModal();
    this._muteDrawer(); // default: mute drawer if popup is active

    // "Don't show again" -> cookie + close + unmute
    this._onRootClick ||= (e) => {
      const btn = e.target.closest('[data-dismiss="cart-notification"]');
      if (!btn) return;
      e.preventDefault();
      this._setDismissCookie();
      this.$('modal')?.close?.();
      this.pub?.(Events.CART_DRAWER_UNMUTE); // let drawer work immediately
    };
    this.addEventListener('click', this._onRootClick);
  }

  async _reportEnabling() {
    await customElements.whenDefined('cart-provider');
    this.pub(Events.CART_NOTIFICATIONS_ENABLING);
  }

  _handleAddToCart = ({ req }) => {
    if (req === 'cartAdd' && !this._isDismissedCookie()) {
      setTimeout(() => { this.$('modal')?.open?.(); }, 50);
    }
  }

  async _handleModal() {
    await customElements.whenDefined(this.elements.modal);
    this.sub(Events.CART_UPDATE, this._handleAddToCart, { global: true });
  }

  async _muteDrawer() {
    if (this._isDismissedCookie()) return;        // if cookie set, keep drawer active
    await customElements.whenDefined('cart-drawer');

    // Defer so the drawer has time to subscribe before we mute (simple + reliable)
    requestAnimationFrame(() => setTimeout(() => {
      this.pub(Events.CART_DRAWER_MUTE);
    }, 0));
  }

  disconnectedCallback() {
    if (this._onRootClick) this.removeEventListener('click', this._onRootClick);
    this.unsub?.(Events.CART_UPDATE, this._handleAddToCart, { global: true });
  }
});
