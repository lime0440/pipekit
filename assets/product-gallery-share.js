const { Core, Utils } = Global;
const { $state } = Utils;

const ACTIVE_CLASSNAME = 'open';

customElements.define('product-gallery-share', class extends Core {
    elements = {
        $: ['trigger-button', 'dropdown']
    }
    isOpen = false;

    render() {
        this.$('trigger-button', { click: this._onTriggerClick });
        this._handleDocClick = this._handleDocClick.bind(this);
        document.addEventListener('click', this._handleDocClick);
    }

    destroy() {
        document.removeEventListener('click', this._handleDocClick);
    }
    
    _onTriggerClick() {
        this.isOpen = !this.isOpen;
        $state(this, ACTIVE_CLASSNAME, this.isOpen);
    }


    _handleDocClick(e) {
        if (!this.isOpen) {
            return;
        }
        if(this.contains(e.target)) {
            return;
        } 
        this.isOpen = false;
        $state(this, ACTIVE_CLASSNAME, false);
    }
})