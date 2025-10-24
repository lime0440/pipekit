const { Core, Utils, Events } = Global;
const { $loading } = Utils;

customElements.define('cart-drawer', class extends Core { 
  elements = { 'modal': 'modal-container' }

  render() {
    this._onCartAdd ||= this._handleAddingToCart.bind(this);
    this.sub(Events.CART_UPDATE, this._onCartAdd, { global: true });
    this.sub(Events.CART_CHANGE, this._handleCartChange, { global: true });
    this.sub(Events.CART_REPLACE, this._handleCartChange, { global: true });
    this.sub(Events.CART_DRAWER_MUTE, this._handleMute, { once: true, global: true });
    this.sub(Events.CART_DRAWER_UNMUTE, this._handleUnmute, { global: true });
  }

  _handleAddingToCart({ req }) {
    if (req === 'cartAdd') {
      this.$('modal')?.open?.();
    }
  }

  _handleCartChange({ key }) {
    const updatingProduct = this.querySelector(`[data-item-key="${key}"]`);
    if (!updatingProduct) return;
    $loading(updatingProduct);
  }

  _handleMute = () => {
    // Mute: stop listening for CART_UPDATE
    this.unsub?.(Events.CART_UPDATE, this._onCartAdd, { global: true });
    this._muted = true;
  }

  _handleUnmute = () => {
    // Unmute: re-subscribe (guard against duplicates)
    if (!this._muted) return;
    this.sub(Events.CART_UPDATE, this._onCartAdd, { global: true });
    this._muted = false;
  }
});
