const { Core, Utils } = Global;
const { $state } = Utils;

const ATTR_DROP_OPTION = 'data-dropdown-option';

customElements.define('drop-down', class extends Core {
    propTypes = {
        'close-on-change': Boolean,
        'update-value': Boolean
    }

    elements = {
        $: ['selected-value', 'select', 'details']
    }

    render() {
        // need this abomination for document event clean up
        this._handleDocClick = this._handleDocClick.bind(this);
        document.addEventListener('click', this._handleDocClick);

        this.$({
            change: this._handleChange
        })

        this.$('select', {
            change: this._handleSelectChange
        })
    }

    destroy() {
        document.removeEventListener('click', this._handleDocClick);
    }

    _handleChange(e) {

        const target = e.target;

        for(let i = 0; i < variantsArray.length; i++) {
            if(target.value == variantsArray[i].title) techContBlock.innerHTML = variantsArray[i].description;
            if(target.value == variantsArray[i].title && specBlock.querySelector('.spec-colour .\\#product-specs-item-value') != null && variantsArray[i].specification_colour != '') specBlock.querySelector('.spec-colour .\\#product-specs-item-value').innerText = variantsArray[i].specification_colour;
            if(target.value == variantsArray[i].title && specBlock.querySelector('.spec-length .\\#product-specs-item-value') != null && variantsArray[i].specification_length != '') specBlock.querySelector('.spec-length .\\#product-specs-item-value').innerText = variantsArray[i].specification_length;
            if(target.value == variantsArray[i].title && specBlock.querySelector('.spec-unit-of-measure .\\#product-specs-item-value') != null && variantsArray[i].specification_unit_of_measure != '') specBlock.querySelector('.spec-unit-of-measure .\\#product-specs-item-value').innerText = variantsArray[i].specification_unit_of_measure;
            if(target.value == variantsArray[i].title && specBlock.querySelector('.spec-approvals .\\#product-specs-item-value') != null && variantsArray[i].specification_approvals != '') specBlock.querySelector('.spec-approvals .\\#product-specs-item-value').innerText = variantsArray[i].specification_approvals;
            if(target.value == variantsArray[i].title && specBlock.querySelector('.spec-material .\\#product-specs-item-value') != null && variantsArray[i].specification_material != '') specBlock.querySelector('.spec-material .\\#product-specs-item-value').innerText = variantsArray[i].specification_material;
            if(target.value == variantsArray[i].title && specBlock.querySelector('.spec-diameter .\\#product-specs-item-value') != null && variantsArray[i].specification_diameter != '') specBlock.querySelector('.spec-diameter .\\#product-specs-item-value').innerText = variantsArray[i].specification_diameter;
            if(target.value == variantsArray[i].title && specBlock.querySelector('.spec-diameter-1 .\\#product-specs-item-value') != null && variantsArray[i].specification_diameter_1 != '') specBlock.querySelector('.spec-diameter-1 .\\#product-specs-item-value').innerText = variantsArray[i].specification_diameter_1;
            if(target.value == variantsArray[i].title && specBlock.querySelector('.spec-diameter-2 .\\#product-specs-item-value') != null && variantsArray[i].specification_diameter_2 != '') specBlock.querySelector('.spec-diameter-2 .\\#product-specs-item-value').innerText = variantsArray[i].specification_diameter_2;
            if(target.value == variantsArray[i].title && variantsArray[i].download_link != '') linkContBlock.innerHTML = variantsArray[i].download_link;
            if(target.value == variantsArray[i].title) prodInfoContBlock.innerHTML = variantsArray[i].variant_title;
        }

        if(target.hasAttribute(ATTR_DROP_OPTION)) {
            e.stopPropagation();
            this._updateSelect(target.value);

            if(this.prop('close-on-change')) {
                this.close();
            }
        }
    }

    _handleDocClick(e) {
        if(this.contains(e.target)) {
            return;
        } 
        this.close();
    }

    _updateSelect(value) {
        if(this.$('select')) {
            this.$('select').value = value;
            this.$('select').dispatchEvent(new Event('change', {
                bubbles: true
            }));
        }
    }

    _handleSelectChange(e) {
        if(this.prop('update-value') && this.$('selected-value')) {
            this.$('selected-value').innerText = e.target.options[e.target.selectedIndex].text;
        }

    }

    close() {
        this.open = false;
    }

    set open(state) {
        this.$('details').open = state;
    }
});