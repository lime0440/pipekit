const { Core, Utils } = Global;
const { $state } = Utils;

function isPositiveInteger(value)   {
    return Number.isInteger(value) && value > 0;
}

customElements.define('product-qty-input', class extends Core {
    elements = {
        $: ['button-minus', 'button-plus', 'input']
    }

currentValue = 1;

render() {
  this.$('button-plus', { click: this._changeBy(+1) });
  this.$('button-minus', { click: this._changeBy(-1) });
  this.$('input', { change: this._handleChange });
}

_getStep() {
  const input = this.$('input');
  return parseInt(input?.getAttribute('step'), 10) || 1;
}

_getMin() {
  const input = this.$('input');
  return parseInt(input?.getAttribute('min'), 10) || 1;
}

_changeBy(direction) {
  return () => {
    const input = this.$('input');
    const step = parseInt(input?.getAttribute('step'), 10) || 1;
    const min = parseInt(input?.getAttribute('min'), 10) || 1;

    // 🔑 Sync currentValue from input BEFORE incrementing
    const current = parseInt(input.value, 10);
    this.currentValue = Number.isFinite(current) ? current : min;

    this.currentValue += direction * step;
    if (this.currentValue < min) this.currentValue = min;

    this._applyCurrentValue();
  };
}

    _handleChange({ target }) {
        const value = target.valueAsNumber;
        if (this.qtyLimit && value > this.qtyLimit) {
            this.currentValue = this.qtyLimit;
        } else if (!isPositiveInteger(value)) {
            this.currentValue = 1;
        } else {
            this.currentValue = value;
        }
        this._applyCurrentValue();
    }

    _applyCurrentValue() {
        this.$('input').value = this.currentValue;
        this._toggleButtons();
    }
    
    _toggleButtons() {
        this.$('button-minus').toggleAttribute('disabled', this.currentValue === 1);
        this.$('button-plus').toggleAttribute('disabled', this.currentValue === this.qtyLimit);
    }

    get qtyLimit() {
        return +this.$('input').getAttribute('max');
    }
})