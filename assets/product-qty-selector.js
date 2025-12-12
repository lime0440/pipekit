const { Core, Utils, Events } = Global;
const { $clone } = Utils;

const SEL_INPUT = '[data-element="input"]';

customElements.define('product-qty-selector', class extends Core {
  elements = {
    $: ['selector-wrapper', 'input-template']
  }

  render() {
    this.$('selector-wrapper', { change: this._onQtyChange })
  }

  _isPackTemplate() {
    return this.dataset.packTemplate === 'true';
  }

  _getStep() {
    return this._isPackTemplate() ? 10 : 1;
  }

  _getMin() {
    return this._isPackTemplate() ? 10 : 1;
  }

  _snap(val) {
    const step = this._getStep();
    const min = this._getMin();
    let n = parseInt(val, 10);

    if (!Number.isFinite(n)) n = min;
    if (n < min) n = min;

    // snap to nearest multiple of step
    n = Math.round(n / step) * step;

    // ensure never below min after snapping
    if (n < min) n = min;

    return n;
  }

  _onQtyChange(e) {
    if (!this._isPackTemplate()) return;

    const snapped = this._snap(e.target.value);
    if (+e.target.value !== snapped) {
      e.target.value = snapped;
    }

    // keep your existing behaviour
    if (snapped === 10) this._changeInputType();
  }

  async _changeInputType() {
    this.replaceChild($clone(this.$('input-template')), this.$('selector-wrapper'));
    await customElements.whenDefined('product-qty-input');

    const $input = this.querySelector(SEL_INPUT);
    if (!$input) return;

    const min = this._getMin();
    const step = this._getStep();

    $input.setAttribute('min', min);
    $input.setAttribute('step', step);
    $input.setAttribute('value', min);
    $input.value = min;

    $input.dispatchEvent(new Event('input', { bubbles: true }));
    $input.dispatchEvent(new Event('change', { bubbles: true }));
  }
})