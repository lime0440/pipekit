const { Core, Utils, Events, Cache } = Global;
const { $fetch, $loading } = Utils;

customElements.define('collection-provider', class extends Core {

    elements = {
        $: [['collection-form'], 'loader']
    }

    propTypes = {
        'collection-url': String
    }

    render() {
        const pageNumber = parseInt(new URL(window.location.href).searchParams.get('page'))
        this.sub(Events.COLLECTION_CHANGE, this._handleChange);
        this._getForms();
        this._initCache();

        if(pageNumber > 1) {
            const docPromiseList = []
            for(let i = 1; i < pageNumber; i++) {
                const pagePromise = this._fetchDocByPageNumber(i)
                docPromiseList.push(pagePromise)
            }
            Promise.all(docPromiseList).then(pagesDocList => {
                this.pub('prev-page', { docList: pagesDocList });
            })
        } 

    }

    _getForms() {
        this.$forms = new Map();
        this.$('collection-form').map((form) => {
            this.$forms.set(form.id, form);
        });
    }

    async _handleChange({ src, url, formId }) {
        this.src = src;
        this._getUrlParams(url, formId);
        await this._getDoc();
        this._updateHistory();
        this.pub(Events.COLLECTION_UPDATED, { src, doc: this.$doc });
        document.dispatchEvent(new CustomEvent("swym:collections-loaded"));
    }

    set src(value) {
        const inert = (value === 'dynamic-pagination');
        this.withLoading = !inert;
        if(!inert) {
            this._scrollToTop();
        }
    }

    _initCache() {
        const firstFormId = this.$forms.keys().next().value;
        Cache.set(
            new URLSearchParams(this._formData(firstFormId)).toString(),
            document.cloneNode(true)
        );
    }

    _getUrlParams(url, formId) {
        if(!url && !formId) {
            console.error('collection change does not contain resource');
            return;
        }
        this.urlParams = url
            ? new URL(`${window.location.origin}${url}`).searchParams
            : new URLSearchParams(this._formData(formId));
    }

    _updateHistory() {
        this.urlParams.delete('section_id');
        window.history.pushState({}, null, `${window.location.pathname}?${this.urlParams.toString()}`);
    }

    _formData(formId) {
        if(!this.$forms.has(formId)) {
            console.error(`form not found with id ${formId}`);
            return;
        }
        return new FormData(this.$forms.get(formId));
    }

    async _fetchDocByPageNumber(pageNumber) {
        const params = new URLSearchParams(window.location.search);
        const paramsObj = {};
        
        for (const [key, value] of params.entries()) {
          paramsObj[key] = value;
        }

        paramsObj.page = pageNumber

        const url = this.prop('collection-url')
        const options = {
            before: this._loading(true),
            after: this._loading(false),
            sectionId: this.sectionId,
            params: paramsObj
        }

        const doc = await $fetch(url, options);
        return doc;
    }

    async _getDoc() {
        const cacheId = this.urlParams.toString();
        if(Cache.has(cacheId)) {
            this.$doc = Cache.get(cacheId);
            return;
        }

        this.$doc = await this._fetchDoc();
        Cache.set(cacheId, this.$doc);
    }

    async _fetchDoc(urlParamsStr) {
        const browserParams = new URLSearchParams(window.location.search);
        const isCollectionWithSortType = Boolean(browserParams.get("sort_by"))

        if(!isCollectionWithSortType) {
            this.urlParams.delete('sort_by')
        }

        const doc = await $fetch(this.prop('collection-url'), {
            before: this._loading(true),
            after: this._loading(false),
            sectionId: this.sectionId,
            params: this.urlParams
        });
        return doc;
    }

    _loading(state) {
        return () => {
            if(!this.withLoading && state) {
                return;
            }
            $loading(this.$('loader'), state);
        }
    }

    _scrollToTop() {
        window.scrollTo({
            top: this.topPoint + window.pageYOffset,
            behavior: 'smooth',
        });
    }

    get topPoint() {
        const headerHeight = document.documentElement.style.getPropertyValue('--header-height')?.replace('px', '');
        const offset = this.getBoundingClientRect().top;
        return headerHeight ? offset - headerHeight : offset;
    }
})