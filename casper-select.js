/*
  - Copyright (c) 2014-2016 Cloudware S.A. All rights reserved.
  -
  - This file is part of casper-select.
  -
  - casper-select is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - casper-select  is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with casper-select.  If not, see <http://www.gnu.org/licenses/>.
  -
*/

import './casper-select-dropdown.js';
import '@toconline/casper-icons/casper-icon.js';
import '@toconline/casper-button/casper-button.js';
import '@polymer/iron-list/iron-list.js';
import '@polymer/iron-input/iron-input.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-spinner/paper-spinner.js';
import '@polymer/paper-input/paper-input-container.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { templatize } from '@polymer/polymer/lib/utils/templatize.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import DOMPurify from 'dompurify';

class CasperSelect extends PolymerElement {
  static get template () {
    return html`
      <style>
        :host {
          display: inline-block;
        }

        #suffixIcon {
          cursor: pointer;
        }

        /* Styles applied to the single-selection variant */
        .casper-single-selection {
          --paper-input-container: {
            @apply --casper-select-single-paper-input-container;
          }

          --paper-input-container-input: {
            @apply --casper-select-single-paper-input-container-input;
          }

          --paper-input-container-label: {
            @apply --casper-select-single-paper-input-container-label;
          }

          --paper-input-container-underline: {
            @apply --casper-select-single-paper-input-container-underline;
          }

          --paper-input-container-underline-focus: {
            @apply --casper-select-single-paper-input-container-underline-focus;
          }
        }

        .casper-single-selection .input-icons {
          display: flex;
        }

        .casper-single-selection .input-icons casper-icon {
          width: 15px;
          height: 15px;
          color: #525252;
          transition: color 200ms linear;
          @apply --casper-select-single-paper-input-icon;
        }

        .casper-single-selection .input-icons casper-icon:hover {
          color: black;
          cursor: pointer;
          @apply --casper-select-single-paper-input-icon-hover;
        }

        /* Styles applied to the multi-selection variant */
        .casper-multi-selection .list-items {
          display: flex;
          flex-wrap: wrap;
        }

        .casper-multi-selection .list-items .list-item {
          color: #333;
          display: flex;
          outline: none;
          padding: 0 5px;
          cursor: default;
          font-size: 12px;
          min-height: 18px;
          user-select: none;
          border-radius: 3px;
          align-items: center;
          margin: 0 4px 4px 0;
          line-height: initial;
          border: 1px solid #6F6262;
        }

        .casper-multi-selection .list-items .list-item button {
          padding: 0;
          height: 10px;
          color: white;
          border: none;
          display: flex;
          outline: none;
          flex-shrink: 0;
          font-size: 12px;
          cursor: pointer;
          flex-basis: 10px;
          background: none;
          margin-right: 5px;
          user-select: none;
          border-radius: 50%;
          align-items: center;
          flex-direction: column;
          justify-content: center;
          background-color: #9E9E9E;
        }

        .casper-multi-selection .list-items .list-item button:hover {
          background-color: #686868;
        }

        .casper-multi-selection[disabled] .list-items .list-item button {
          display: none;
        }

        .casper-multi-selection .list-items .list-item button casper-icon {
          width: 10px;
          height: 10px;
        }

        .casper-multi-selection .list-item-input {
          width: 0;
          flex-grow: 1;
          overflow: hidden;
        }

        .casper-multi-selection .list-item-input #searchSelf {
          border: 0;
          width: 100%;
          outline: none;
          background-color: transparent;
        }

        #measureDropdownItem {
          opacity: 0;
          left: -100vh;
          position: absolute;
        }

        slot[name='dropdown-prefix']::slotted(*),
        slot[name='dropdown-suffix']::slotted(*) {
          display: none;
        }
      </style>

      <template is="dom-if" if="[[searchDynamic]]">

        <!--Multi-selection variant-->
        <template is="dom-if" if="[[multiSelection]]">
          <paper-input-container disabled$="[[disabled]]" class="casper-multi-selection" no-label-float="[[noLabelFloat]]" always-float-label$="[[_shouldLabelFloat]]">
            <template is="dom-if" if="[[!noLabelFloat]]">
              <label slot="label">[[label]]</label>
            </template>

            <iron-input slot="input">
              <div class="list-items" id="dynamicListWithInput">
                <div class="list-item-input">
                  <input id="searchSelf" disabled$="[[disabled]]">
                </div>
              </div>
            </iron-input>
          </paper-input-container>
        </template>

        <!--Single-selection variant-->
        <template is="dom-if" if="[[!multiSelection]]">
          <div class="casper-single-selection">
            <paper-input
              id="searchSelf"
              label="[[label]]"
              no-label-float="[[noLabelFloat]]"
              disabled="[[_isInputDisabled(readonly, disabled)]]">
              <div class="input-icons" slot="suffix">
                <!--Only display the first icon if there are selected items-->
                <template is="dom-if" if="[[_shouldDisplayClearIcon(_selectedItems)]]">
                  <casper-icon icon="fa-light:times" on-click="_clearSelectIconClicked"></casper-icon>
                </template>
                <casper-icon icon="fa-regular:angle-down"></casper-icon>
              </div>
            </paper-input>
          </div>
        </template>
      </template>

      <slot name="dropdown-prefix"></slot>
      <slot name="dropdown-suffix"></slot>

      <casper-select-dropdown
        id="dropdown"
        no-overlap
        dynamic-align
        vertical-align="auto"
        horizontal-align="auto"
        template-style="[[templateStyle]]"
        with-backdrop$="[[noCancelOnOutsideClick]]"
        no-cancel-on-esc-key
        no-cancel-on-outside-click$="[[noCancelOnOutsideClick]]">
        <!--In this case, a paper-input will be rendered inside the dropdown itself-->
        <template is="dom-if" if="[[searchCombo]]">
          <paper-input tabindex="1" no-label-float="" id="searchInput" label="[[searchComboPlaceholder]]">
            <casper-icon icon="fa-light:times" slot="suffix" id="suffixIcon"></casper-icon>
          </paper-input>
        </template>

        <div id="dropdown-prefix"></div>

        <div id="dropdownScroller">
          <iron-list
            id="dropdownItems"
            items="[[filteredItems]]"
            hidden$="[[noVisibleItems]]"
            selected-items="{{ironListSelectedItems}}"
            class$="[[_computedDisabledSelect(disabled)]]">
            <template>
              <div on-click="_itemClicked" inner-h-t-m-l="[[_computedItemHtml(item._csHTML)]]" class$="dropdown-item [[ _computedItemSelectedClass(selected, index) ]] [[ _computedItemDisabledClass(item.csDisabled) ]]">
              </div>
            </template>
          </iron-list>
        </div>

        <!--Placeholder for the cases when there are no items-->
        <template is="dom-if" if="[[noVisibleItems]]">
          <div id="dropdown-no-items">
            <casper-icon icon="fa-light:clipboard"></casper-icon>
            [[emptyListMessage]]
          </div>
        </template>

        <template is="dom-if" if="[[_shouldDisplayPaginationAndOrClose(multiSelection, lazyLoadResource, __hasSuffixAssignedNodes)]]" restamp>
          <div class="dropdown-pagination-container">

            <!--Displays the suffix elements-->
            <template is="dom-if" if="[[__hasSuffixAssignedNodes]]">
              <div id="dropdown-suffix"></div>
            </template>
            <!--Displays the number of visible results vs the total-->
            <div class="dropdown-pagination">
              <template is="dom-if" if="[[lazyLoadResource]]">
                [[_dropdownPaginationInfo(items, _lazyLoadTotalResults)]]
                <paper-spinner active$="[[_shouldDisplaySpinner(_lazyLoadFetching, _lazyLoadTyping)]]">
                </paper-spinner>
              </template>
            </div>

            <!--Button to close the dropdown when multi-selection is enabled-->
            <template is="dom-if" if="[[_displayDropdownFooterButton(multiSelection, noCancelOnOutsideClick)]]">
              <div class="dropdown-group-buttons">
                <casper-button size="s" on-click="closeDropdown">
                  [[_translations.multiSelectionCloseButton]]
                </casper-button>
                <template is="dom-if" if="[[noCancelOnOutsideClick]]">
                  <casper-button size="s" on-click="closeDropdownWithoutSaving">
                  [[_translations.closeWithoutSavingButton]]
                  </casper-button>
                </template>
              </div>
            </template>

          </div>
        </template>
      </casper-select-dropdown>

      <!--Element used to measure the longest dropdown item-->
      <div id="measureDropdownItem"></div>
  `;
  }

  static get is () {
    return 'casper-select';
  }

  static get properties () {
    return {
      /**
       * Casper-Select current option stringified
       * @type {String}
       */
      value: {
        type: String,
        notify: true,
        value: '',
        observer: '_valueChanged'
      },
      /**
       * Items supplied
       * @type {Object}
       */
      items: {
        type: Object,
        value: () => [],
        observer: '_itemsChanged'
      },
      /**
       * Disabled Items Stored
       * @type {Object}
       */
      disabledItems: {
        type: Object,
        observer: '_disabledItemsChanged'
      },
      /**
       * Disabled Items Keys Stored
       * @type {Array}
       */
      disabledItemsKeys: {
        type: Array,
        value: () => []
      },
      /**
       * Item Column -> default: "name"
       * @type {String}
       */
      itemColumn: {
        type: String,
        value: 'name'
      },
      /**
       * Short Item Column used for multi-selection -> default: "shortName"
       * If not present will fallback to itemColumn.
       * @type {String}
       */
      shortItemColumn: {
        type: String,
        value: 'shortName'
      },
      /**
       * Key Column -> default: "id"
       * @type {String}
       */
      keyColumn: {
        type: String,
        value: 'id'
      },
      /**
       * Multi Selection Key Values Seperator
       * @type {Object}
       */
      multiSelectionValueSeparator: {
        type: String,
        value: ','
      },
      /**
       * Dynamic Search Input - Internal Paper Input Property
       * @type {Boolean}
       */
      noLabelFloat: {
        type: Boolean,
        value: false
      },
      /**
       * Dynamic Search Innput - Internal Paper Input Property
       * @type {String}
       */
      label: {
        type: String,
        value: 'Escolha uma opção'
      },
      /**
       * Empty List String
       * @type {String}
       */
      emptyListMessage: {
        type: String,
        value: 'Lista vazia'
      },
      /**
       * Items actually present in the select
       * @type {Object}
       */
      filteredItems: {
        type: Object,
        value: () => []
      },
      /**
       * This option doesn't allow you to enter search terms that have no matches
       * Either shows matched or prevents your input
       * @type {Boolean}
       */
      smartFilter: {
        type: Boolean,
        value: true
      },
      /**
       * Activate or disable filtering
       * @type {Boolean}
       */
      filtering: {
        type: Boolean,
        value: true
      },
      /**
       * No visible items COMPUTED flag
       * smartFilter needs to be disabled for this value to become true
       * @type {Boolean}
       */
      noVisibleItems: {
        type: Boolean,
        value: false,
        computed: '_emptyList(filteredItems)'
      },
      /**
       * Iron List Internal Selected Items - DO NOT MANIPULATE
       * @type {Object}
       */
      ironListSelectedItems: {
        type: Object
      },
      /**
       * Casper-Select Internal Selected Items
       * DO NOT MANIPULATE
       * @type {Object}
       */
      _selectedItems: {
        type: Object,
        observer: '_selectedItemsChanged'
      },
      /**
       * Casper-Select Internal Last Selected Items
       * DO NOT MANIPULATE
       * @type {Object}
       */
      lastSelectedItems: {
        type: Object,
        value: () => []
      },
      /**
       * HTML Template for the items, with curly brackets for object value replacement
       * @type {String}
       */
      template: {
        type: Object,
        observer: 'restampTemplate'
      },
      /**
       * Disable the entire select
       * @type {Object}
       */
      disabled: {
        type: Boolean,
        observer: '_disabledChanged'
      },
      /**
       * Make the casper-select only readonly.
       * @type {Object}
       */
      readonly: {
        type: Boolean,
      },
      /**
       * If multi-selection should be enabled
       * @type {Boolean}
       */
      multiSelection: {
        type: Boolean,
        value: false,
        observer: '_multiSelectionChanged'
      },
      /**
       * Use multi-selection tags on the input
       * Requires: "searchDynamic" to be true
       * @type {Boolean}
       */
      multiSelectionTags: {
        type: Boolean,
        value: false
      },
      /**
       * Computed property to hold the multi-selection tags class to add to the DOM
       * @type {String}
       */
      multiSelectionTagsClass: {
        type: String,
        computed: '_multiSelectionTagsDefined(multiSelectionTags)'
      },
      /**
       * DOM Element provided to override the placeholder for the multi-selection tags
       * @type {Object}
       */
      multiSelectionTagsElementParent: {
        type: Object
      },
      /**
       * Enable or disable selections
       * @type {Boolean}
       */
      selectionEnabled: {
        type: Boolean,
        value: true,
        observer: '_selectionEnabledChanged'
      },
      /**
       * When attached to an existing element, will use that same element for filtering
       * @type {Boolean}
       */
      searchInline: {
        type: Boolean,
        value: false,
        observer: '_searchInlineChanged'
      },
      /**
       * When attached to an existing element, will add an extra input to the "select dropdown" for filtering
       * @type {Object}
       */
      searchCombo: {
        type: Boolean,
        value: false,
        observer: '_searchComboChanged'
      },
      /**
       * Placeholder present on the input that was dynamically added to the dropdown.
       * @type {Object}
       */
      searchComboPlaceholder: {
        type: String,
        value: 'Escreva para filtrar..'
      },
      /**
       * Dynamically shows its own input, and uses it for filtering and for showing the selected option
       * Is also computed by the other two types of searches
       * @type {Object}
       */
      searchDynamic: {
        type: Boolean,
        value: false,
        computed: '_isDynamicSearch(searchInline, searchCombo)',
        observer: '_searchDynamicChanged'
      },
      /**
       * If we are not in "multiSelection" mode, will automatically close dropdown on select
       * @type {Boolean}
       */
      closeOnSelect: {
        type: Boolean,
        value: true
      },
      /**
       * HTML Tag that embodies the Highlighted text
       * Default: span
       * @type {String}
       */
      highlightTemplateTag: {
        type: String,
        value: 'span'
      },
      /**
       * CSS class applied to the Highlight Template Tag
       * @type {String}
       */
      highlightTemplateClass: {
        type: String,
        value: 'dropdown-item-highlight'
      },
      /**
       * Target element (if using exisitng input elements on the page) to attach the select dropdown to
       * @type {Object}
       */
      targetElement: {
        type: Object,
        observer: '_targetElementChanged'
      },
      /**
       * Fixed List Height
       * @type {String}
       */
      listHeight: String,
      /**
       * Fixed List Item Height
       * @type {Number}
       */
      listItemHeight: Number,
      /**
       * Fied List Width
       * @type {String}
       */
      listWidth: String,
      /**
       * Enforce select width to match container width
       * @type {Object}
       */
      fixedContainerWidth: {
        type: Boolean,
        value: false
      },
      /**
       * Adjust list height when filtering results
       * @type {Boolean}
       */
      resizeOnFilter: {
        type: Boolean,
        value: true
      },
      /**
       * Current status of the dropdown
       * @type {Boolean}
       */
      opened: {
        type: Boolean,
        notify: true
      },
      /**
       * Resets filtering and search term on a new attachment
       * @type {Boolean}
       */
      resetOnOpen: {
        type: Boolean,
        value: false
      },
      /**
       * Allows the user to have empty values.
       * @type {Boolean}
       */
      disableClear: {
        type: Boolean,
        value: false
      },
      /**
       * Allows the user to postpone the JSON API request which will now be triggered when first opening
       * the casper-select-dropdown.
       * @type {Boolean}
       */
      delayLazyLoad: {
        type: Boolean,
        value: false
      },
      /**
       * Does not open the select dropdown on arrow press.
       * @type {Boolean}
       */
      noOpenOnArrowKeyPress: {
        type: Boolean,
        value: false
      },
      /**
       * Does not close the dropdown when clicking outside.
       * @type {Boolean}
       */
      noCancelOnOutsideClick: {
        type: Boolean,
        value: false
      },
      /**
       * Do not confirm selection with tab
       * @type {Boolean}
       */
      noConfirmOnTabKey: {
        type: Boolean,
        value: false
      },
      /**
       * JSON API resource to use in the web socket calls
       * @type {String}
       */
      lazyLoadResource: {
        type: String,
        observer: '_lazyLoadResourceChanged'
      },
      /**
       * The fields that will be used to construct the query to the JSON API.
       * @type {Array}
       */
      lazyLoadFilterFields: Array,
      /**
       * The custom SQL that will always be included in the filter part of the URL.
       * @type {String}
       */
      lazyLoadCustomFilters: {
        type: Object,
        value: {}
      },
      /**
       * The number of records to fetch each time the socket is called.
       * @type {Number}
       */
      lazyLoadPageSize: {
        type: Number,
        value: 100
      },
      /**
       * The URL parameter name for the search filters.
       * @type {String}
       */
      lazyLoadFilterAttr: {
        type: String,
        value: 'filter'
      },
      /**
       * The URL parameter name for the number of records per "page".
       * @type {String}
       */
      lazyLoadPageSizeAttr: {
        type: String,
        value: 'page[size]'
      },
      /**
       * The URL parameter name for the current "page".
       * @type {String}
       */
      lazyLoadPageNumberAttr: {
        type: String,
        value: 'page[number]'
      },
      /**
       * The parameter name and value to make the socket respond with the totals metadata.
       * @type {String}
       */
      lazyLoadMetadataAttr: {
        type: String,
        value: 'totals=1'
      },
      /**
       * Number of milliseconds until a socket call times out.
       * @type {Number}
       */
      lazyLoadTimeout: {
        type: Number,
        value: 5000
      },
      /**
       * Boolean that when set to true, fetches all the results at once.
       * @type {Number}
       */
      lazyLoadFetchAllResults: {
        type: Boolean,
        value: false
      },
      /**
       * Boolean that when set to true, dispatch and event that cannot leave the list empty
       * @type {Number}
       */
      preventLeaveEmpty: {
        type: Boolean,
        value: false
      }
    };
  }

  ready () {
    super.ready();

    this._boundSearchInputClicked = this._searchInputClicked.bind(this);
    this._boundSearchInputBlurred = this._searchInputBlurred.bind(this);
    this._boundSearchInputFocused = this._searchInputFocused.bind(this);
    this._boundDebounceFilterItems = this._debounceFilterItems.bind(this);
    this._boundSearchInputKeyDownHandler = this._searchInputKeyDownHandler.bind(this);
    this._boundSearchInputKeyPressHandler = this._searchInputKeyPressHandler.bind(this);
    this._boundClearSearch = this._clearSearch.bind(this);

    this.$.dropdownItems.addEventListener('scroll', event => this._dropdownScrolled(event));
    this.$.dropdown.addEventListener('opened-changed', event => this._onOpenedChanged(event));
    this.$.dropdown.addEventListener('iron-overlay-canceled', event => this._cancelOverlay(event));

    this._translations = { multiSelectionCloseButton: 'Concluído', closeWithoutSavingButton: 'Cancelar' };

    // Detect if the browser supports the IntersectionObserver API.
    if (this._browserSupportsIntersectionObserver()) {
      const intersectionObserver = new IntersectionObserver(() => {
        if (!this.offsetParent) this.closeDropdown();
      });
      intersectionObserver.observe(this);
    }

    // Detect if we are on mobile
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      this._isMobile = true;
     } else {
      this._isMobile = false;
     }

    // Pass the slotted elements to the casper-select-dropdown element.
    afterNextRender(this, () => {
      const prefixSlotNodes = this.shadowRoot.querySelector('slot[name="dropdown-prefix"]').assignedNodes();
      const suffixSlotNodes = this.shadowRoot.querySelector('slot[name="dropdown-suffix"]').assignedNodes();

      this.__hasSuffixAssignedNodes = suffixSlotNodes.length > 0;

      afterNextRender(this, () => {
        const dropdownPrefix = this.$.dropdown.shadowRoot.querySelector('#dropdown-prefix');
        const dropdownSuffix = this.$.dropdown.shadowRoot.querySelector('#dropdown-suffix');

        if (prefixSlotNodes.length > 0) prefixSlotNodes.forEach(slotNode => dropdownPrefix.appendChild(slotNode));
        if (suffixSlotNodes.length > 0) suffixSlotNodes.forEach(slotNode => dropdownSuffix.appendChild(slotNode));
      });

      // Do not fetch the items if the delayLazyLoad flag is set to true.
      if (this.lazyLoadResource && !this.delayLazyLoad) {
        this._loadMoreItems('scroll');
      }
    });
  }

  _cancelOverlay (e) {
    if (e.composedPath().includes(this.searchInput)) {
      e.preventDefault();
    }
  }

  _onOpenedChanged (e) {
    // Closing
    if (e.detail.value === false) {
      this.shadowRoot.appendChild(this.$.dropdown);

      // Clear the interval for browsers that don't support the IntersectionObserver API.
      if (!this._browserSupportsIntersectionObserver() && this._intersectionObserverFallbackInterval) {
        clearInterval(this._intersectionObserverFallbackInterval);
      }

      this.opened = false;
      if (!this.multiSelection) {
        this.lastSelectedItems = this._selectedItems;
        if (this.searchDynamic || this.searchInline) {
          if (this._selectedItems !== undefined) {
            this._setValueInInput();
          } else {
            this._clearValueInput();
          }
        }
      }
      // Opening
    } else {
      this._resizeItemListWidth();
      // If the we are opening the casper-select-dropdown and the lazy load was delayed initially, fetch the items now.
      if (this._lazyLoadFirstFetch === undefined && this.delayLazyLoad) {
        this._loadMoreItems('scroll');
      }

      document.body.appendChild(this.$.dropdown);

      // Set the interval for browsers that don't support the IntersectionObserver API.
      if (!this._browserSupportsIntersectionObserver()) {
        this._intersectionObserverFallbackInterval = setInterval(() => {
          if (!this.offsetParent) this.closeDropdown();
        }, 100);
      }

      setTimeout(() => {
        this._selectedIndex === undefined
          ? this.$.dropdownItems.scrollToIndex(0)
          : this.$.dropdownItems.scrollToIndex(this._selectedIndex);
      }, 16);

      this.opened = true;
      if (!this.multiSelection && (this.searchDynamic || this.searchInline)) {
        this._unsetValueInInput();
      }

      // Necessary for CasperEditDialog, to fix problem related to the stacking context of the top-layer
      this.dispatchEvent(new CustomEvent('casper-overlay-opened', { bubbles: true, composed: true, detail: { element: this.$.dropdown } }));
    }
  }

  _clearValueInput () {
    this.searchInput.value = '';
  }

  _setValueInInput () {
    if (this.searchCombo) return;
    this._tempFiltering = this._tempFiltering || this.filtering;
    this.filtering = false;

    const inputValue = this._selectedItems ? this._selectedItems[this.itemColumn] : '';

    afterNextRender(this, () => {
      this.searchInput.value = inputValue;

      // Hack because the floating sometimes behaves erratically and overlaps the value.
      this.searchInput.invalid = true;
      this.searchInput.invalid = false;
      this.searchInput.readonly = true;
    });
  }

  _unsetValueInInput () {
    if (!this.searchInput || this.searchCombo) return;

    this.searchInput.value = this._lastQuery || '';
    this.searchInput.readonly = false;
    this._resizeItemListHeight();
    if (typeof this._tempFiltering !== "undefined") {
      this.filtering = this._tempFiltering;
      this._tempFiltering = undefined;
    }
  }

  _isDynamicSearch (searchInline, searchCombo) {
    return (searchInline === false && searchCombo === false);
  }

  _searchDynamicChanged (newSearchDynamicValue, oldSearchDynamicValue) {
    if (newSearchDynamicValue && !oldSearchDynamicValue) {
      afterNextRender(this, () => {
        if (this.items && this.items.length > 0) {
          this._resizeItemListHeight();
        }
        this._setMultiSelectionTarget();
        this._unbindSearchInputListeners();
        this.searchInput = this.shadowRoot.querySelector('#searchSelf');
        this._bindSearchInputListeners();

        // Apply text-overflow to the inner input.
        if (this.searchInput && this.searchInput.shadowRoot) {
          this.searchInput.shadowRoot.querySelector('input').style.textOverflow = 'ellipsis';
        }
      });
    }
  }

  _selectedItemsChanged (newSelectedItems) {
    if (this.__ignoreSelectedItemsChanged) return;
    this._shouldLabelFloat = this._multiSelectionHasItems();

    let listItems = this.multiSelectionTagsElementParent
      ? this.multiSelectionTagsElementParent
      : this.shadowRoot.querySelector('#dynamicListWithInput');

    if (this.multiSelection && this.multiSelectionTags) {
      if (listItems) {
        this._removeDynamicListSelectedValues(listItems);
        if (newSelectedItems !== undefined && newSelectedItems.length > 0) {
          newSelectedItems.forEach(el => {
            const item = document.createElement('div');
            const itemButton = document.createElement('button');
            const itemSpan = document.createElement('span');

            const itemButtonIcon = document.createElement('casper-icon');
            itemButtonIcon.setAttribute('icon', 'fa-light:times');

            itemButton.appendChild(itemButtonIcon);
            itemButton.dataset.key = el[this.keyColumn];
            itemButton.addEventListener('click', this._removeOptionFromList.bind(this));
            itemSpan.innerHTML = el[this.shortItemColumn] === undefined ? el[this.itemColumn] : el[this.shortItemColumn];

            item.classList.add('list-item');
            item.appendChild(itemButton);
            item.appendChild(itemSpan);
            listItems.insertBefore(item, listItems.lastElementChild);
          });
        }
      }
    }

    this.$.dropdown.refit();
    this._setValue();

    if (!this.disabled) {
      this.dispatchEvent(new CustomEvent('casper-select-changed', { detail: { selectedItems: newSelectedItems } }));
    }
  }

  _removeDynamicListSelectedValues (list) {
    let elements = this.multiSelectionTagsElementParent
      ? list.querySelectorAll('div')
      : list.querySelectorAll('div:not(:last-child)');

    if (elements.length > 0) {
      elements.forEach(element => list.removeChild(element));
    }
  }

  _removeOptionFromList (event) {

    if (this._selectedItems.length == 1 && this.preventLeaveEmpty) {
      this._dispatchPreventLeaveEmpty(event)
      return
    }

    const clickedKey = event.target.parentNode.dataset.key;

    for (let [key, item] of Object.entries(this._selectedItems)) {
      if (item[this.keyColumn] == clickedKey) {
        this._selectedItems.splice(key, 1);
        this._selectedItems = JSON.parse(JSON.stringify(this._selectedItems));
        break;
      }
    }
    for (let [key, item] of Object.entries(this.ironListSelectedItems)) {
      if (item[this.keyColumn] == clickedKey) {
        this.$.dropdownItems.deselectItem(item);
        break;
      }
    }
    this.$.dropdown.refit();
    event.preventDefault();
    event.stopPropagation();
  }

  _searchInputClicked () {
    // Do nothing if the input is already open.
    if (this.opened) return;

    if (this._isMobile) {
      // We need this to open mobile keyboard
      this._debounceFocus(0);
    }

    // Open the dropdown in case of lazy loading because the items actively change according to the search input.
    if (this.lazyLoadResource && !this.disabled && !this.readonly) {
      this.openDropdown();
    } else if (!this.lazyLoadResource) {
      this.items && this.items.length > 0 && !this.disabled && !this.readonly
        ? this.openDropdown()
        : this.searchInput.blur();
    }
  }

  _itemClicked (event) {

    if (this._isMobile) return this._mobileItemClicked(event);

    let classList = (event.composedPath()).find(element => element.classList.contains('dropdown-item')).classList;

    if (!this.selectionEnabled || classList.contains('dropdown-item-disabled')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.multiSelection) {
      if (classList.contains('dropdown-item-selected')) {

        if (this._selectedItems.length == 1 && this.preventLeaveEmpty) {
          this._dispatchPreventLeaveEmpty(event)
          return
        }

        for (let [key, item] of Object.entries(this._selectedItems)) {
          if (item[this.keyColumn] == event.model.item[this.keyColumn]) {
            this._selectedItems.splice(key, 1);
            this._selectedItems = JSON.parse(JSON.stringify(this._selectedItems));
            return;
          }
        }
      } else {
        if (typeof this._selectedItems === "undefined") {
          this._selectedItems = [];
        }
        this._selectedItems.push(event.model.item);
        this._selectedItems = JSON.parse(JSON.stringify(this._selectedItems));
      }
    } else {
      if (classList.contains('dropdown-item-selected')) {
        // Force the user to have at least one item selected.
        if (this.disableClear) {
          afterNextRender(this, () => {
            this.$.dropdownItems.selectIndex(event.model.index);
          });
          return;
        }

        this._selectedItems = [];
        this._selectedIndex = -1;
      } else {
        this._selectedIndex = event.model.index;
        this._selectedItems = event.model.item;
        if (this.closeOnSelect) {
          this.closeDropdown();
        }
      }
    }
  }

  _mobileItemClicked (event) {
    let classList = (event.composedPath()).find(element => element.classList.contains('dropdown-item')).classList;

    if (!this.selectionEnabled || classList.contains('dropdown-item-disabled')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.multiSelection) {
      if (!classList.contains('dropdown-item-selected')) {

        if (this._selectedItems.length == 1 && this.preventLeaveEmpty) {
          this._dispatchPreventLeaveEmpty(event)
          return
        }

        for (let [key, item] of Object.entries(this._selectedItems)) {
          if (item[this.keyColumn] == event.model.item[this.keyColumn]) {
            this._selectedItems.splice(key, 1);
            this._selectedItems = JSON.parse(JSON.stringify(this._selectedItems));
            return;
          }
        }
      } else {
        if (typeof this._selectedItems === "undefined") {
          this._selectedItems = [];
        }
        this._selectedItems.push(event.model.item);
        this._selectedItems = JSON.parse(JSON.stringify(this._selectedItems));
      }
    } else {
      if (!classList.contains('dropdown-item-selected')) {
        // Force the user to have at least one item selected.
        if (this.disableClear) {
          afterNextRender(this, () => {
            this.$.dropdownItems.selectIndex(event.model.index);
          });
          return;
        }

        this._selectedItems = [];
        this._selectedIndex = -1;
      } else {
        this._selectedIndex = event.model.index;
        this._selectedItems = event.model.item;
        if (this.closeOnSelect) {
          this.closeDropdown();
        }
      }
    }
  }

  _dispatchPreventLeaveEmpty (event) {
    event.preventDefault();
    event.stopPropagation();

    this.dispatchEvent(new CustomEvent('casper-select-prevent-leave-empty', { detail: { empty: false } }));
    console.log("casper-select-prevent-leave-empty")
  }

  _emptyList (items) {
    return !items || items.length === 0 ? true : false;
  }

  _clearSearch (e) {
    if (this.searchInput) {
      if (e && this.searchCombo && this.searchInput.value == "") {
        return this.closeDropdownWithoutSaving();
      }
      this.searchInput.value = "";
    }
    const sfxIcon = this.shadowRoot.querySelector('#suffixIcon');
    if (sfxIcon) {
      sfxIcon.style.opacity = 0;
      sfxIcon.removeEventListener('click', this._boundClearSearch);
    }
  }

  _searchInputKeyPressHandler (event) {

    if (!this.smartFilter || !this.filtering || !this.searchInput) {
      return;
    }

    let key = event.keyCode
    // tab, enter, esc -- just in case
    if ([9, 13, 27].includes(key)) return;

    let nextLetter = String.fromCharCode(key);
    if (nextLetter.length > 0) {
      let searchTerm = this.searchInput.value + nextLetter.trim();
      if (searchTerm.length > 0) {
        let _lastQuery = this.searchInput.value;
        this.filterItems(searchTerm);
        if (this.filteredItems.length === 0) {
          event.preventDefault();
          this.filterItems(_lastQuery);
        }
      }
    }
  }

  _searchInputKeyDownHandler (event) {
    event.stopPropagation();

    let key = event.keyCode;
    switch (key) {
      case 8: // backspace
        if (this.multiSelection
          && this._selectedItems
          && this._selectedItems.length > 0
          && this.searchInput.value.length === 0) {
          const lastKeySelectedItemInList = this._selectedItems[this._selectedItems.length - 1][this.keyColumn];
          this.lastSelectedItems = this.lastSelectedItems.filter(item => item[this.keyColumn] !== lastKeySelectedItemInList);

          this._selectedItems.splice(-1);
          this._selectedItems = JSON.parse(JSON.stringify(this._selectedItems));
          for (let [key, item] of Object.entries(this.ironListSelectedItems)) {
            if (item[this.keyColumn] == lastKeySelectedItemInList) {
              this.$.dropdownItems.deselectItem(item);
              break;
            }
          }
          this.$.dropdown.refit();
        }
        break;
      case 9: // tab
      case 13: // enter
        if (this.noConfirmOnTabKey && key == 9) {
          event.preventDefault();

          // Necessary for CasperEditDialog and other components, so that the previous / next field is focused when the user presses shift+tab / tab
          this.dispatchEvent(new CustomEvent('casper-select-tab-was-pressed', { bubbles: true, composed: true, cancelable: true, detail: { element: this, pressed_shift_key: event.shiftKey } }));
          return;
        }
        this._closingKey = key == 13 ? 'enter' : (event.shiftKey === true ? 'shift+tab' : 'tab');
        if (!this.multiSelection) {
          this.lastSelectedItems = this._selectedItems;
          if (this.opened) {
            if (this.$.dropdownItems.items.length === 1) {
              this._selectedItems = this.lastSelectedItems = this.$.dropdownItems.items[0];
            }

            if (this.closeOnSelect) {
              this.closeDropdown();
            }
          }
        } else {
          if (this.opened) {
            if (this.$.dropdownItems.items.length === 1 && !this._selectedItems.find(item => item[this.keyColumn] === this.$.dropdownItems.items[0][this.keyColumn])) {
              this._selectedItems = [...this._selectedItems, this.$.dropdownItems.items[0]];
              this.lastSelectedItems = [...this.lastSelectedItems, this.$.dropdownItems.items[0]];

              this._clearValueInput();
              this.lazyLoadResource ? this._loadMoreItems('search') : this.filterItems();
            }
          }
        }

        if (key == 9) {
          // Necessary for CasperEditDialog and other components, so that the previous / next field is focused when the user presses shift+tab / tab
          this.dispatchEvent(new CustomEvent('casper-select-tab-was-pressed', { bubbles: true, composed: true, cancelable: true, detail: { element: this, pressed_shift_key: event.shiftKey } }));
        }

        break;
      case 27: // escape
        this._closingKey = 'esc';
        this.closeDropdownWithoutSaving();
        break;
      case 37: // left
        if (this._doesntExistYet) {
          this._moveSelection('up');
        }
        break;
      case 38: // up
        this.opened || (this.noOpenOnArrowKeyPress && !this.multiSelection)
          ? this._moveSelection('up')
          : this._searchInputClicked();
        break;
      case 39: // right
        if (this._doesntExistYet) {
          this._moveSelection('down');
        }
        break;
      case 40: // down
        this.opened || (this.noOpenOnArrowKeyPress && !this.multiSelection)
          ? this._moveSelection('down')
          : this._searchInputClicked();
        break;
      default:
        // Open the dropdown when one presses other keys other than those which have special behaviors.
        if (!this.opened) this._searchInputClicked();
    }

    // The value-changed event is not fired for iron-input elements.
    if (this.multiSelection) this._boundDebounceFilterItems(event);
  }

  _moveSelection (direction) {
    if (!this.multiSelection) {
      let _selectedIndex = typeof this._selectedIndex === "undefined" || isNaN(this._selectedIndex) ? -1 : this._selectedIndex;
      let indexScroll = _selectedIndex;
      if (direction === 'up' && _selectedIndex > 0) {
        _selectedIndex -= 1;
        indexScroll = _selectedIndex - 1;
      } else if (direction === 'down' && _selectedIndex < this.filteredItems.length - 1) {
        _selectedIndex += 1;
        indexScroll = _selectedIndex - 1;
      }

      this.$.dropdownItems.selectItem(this.$.dropdownItems.items[_selectedIndex]);
      this._selectedIndex = _selectedIndex;
      this._selectedItems = this.$.dropdownItems.items[_selectedIndex];
      this.$.dropdownItems.scrollToIndex(indexScroll);

      if (!this.opened) {
        this._setValueInInput();
      }

    }
  }

  _targetElementChanged (newTargetElement) {
    if (newTargetElement instanceof HTMLElement) {
      this._unbindSearchInputListeners();
      this.searchInput = this.searchCombo ? this.searchInput : this.targetElement;
      this._bindSearchInputListeners();
    }
  }

  _bindSearchInputListeners () {
    if (this.searchInput && this.targetElement) {
      if (this.disabled) {
        this.searchInput.setAttribute('disabled', '');
      }
      this._unbindSearchInputListeners();

      this.searchInput.addEventListener('blur', this._boundSearchInputBlurred);
      this.searchInput.addEventListener('focus', this._boundSearchInputFocused);
      this.searchInput.addEventListener('value-changed', this._boundDebounceFilterItems);
      this.searchInput.addEventListener('keydown', this._boundSearchInputKeyDownHandler);
      this.searchInput.addEventListener('keypress', this._boundSearchInputKeyPressHandler);

      if (!this.searchCombo) {
        this.targetElement.addEventListener('click', this._boundSearchInputClicked);
      }
    }
  }

  _unbindSearchInputListeners () {
    if (this.searchInput && this.targetElement) {

      this.searchInput.removeEventListener('blur', this._boundSearchInputBlurred);
      this.searchInput.removeEventListener('focus', this._boundSearchInputFocused);
      this.searchInput.removeEventListener('value-changed', this._boundDebounceFilterItems);
      this.searchInput.removeEventListener('keydown', this._boundSearchInputKeyDownHandler);
      this.searchInput.removeEventListener('keypress', this._boundSearchInputKeyPressHandler);

      if (!this.searchCombo) {
        this.targetElement.removeEventListener('click', this._boundSearchInputClicked);
      }
    }
  }

  _searchComboChanged (newSearchComboValue, oldSearchComboValue) {
    if (newSearchComboValue && !oldSearchComboValue) {
      this.searchInline = false;

      afterNextRender(this, () => {
        this.$.dropdown.shadowRoot.querySelector('#suffixIcon').addEventListener('click', this._boundClearSearch);
        this.searchInput = this.$.dropdown.shadowRoot.querySelector('#searchInput');
        this._bindSearchInputListeners();
      });
    } else if (newSearchComboValue === false && oldSearchComboValue === true) {
      this._unbindSearchInputListeners();
    }
  }

  _searchInlineChanged (newSearchInlineValue, oldSearchInlineValue) {
    if (newSearchInlineValue && !oldSearchInlineValue) {
      this.searchCombo = false;
      this.searchInput = this.targetElement;
      this._bindSearchInputListeners();
    } else if (newSearchInlineValue === false && oldSearchInlineValue !== newSearchInlineValue) {
      this._unbindSearchInputListeners();
    }
  }

  _destroy () {
    this.ironListSelectedItems = [];
    this._clearSearch();
    this.filteredItems = [];
    this._selectedItems = [];
    this.lastSelectedItems = [];

    if (this.opened) {
      this.closeDropdown();
    }
  }

  _itemColumn (item) {
    return this.template
      ? this._listItemInnerHTML(this.__stampItemTemplate(item))
      : this._listItemInnerHTML(item[this.itemColumn]);
  }

  _itemsChanged (newItems) {

    if (newItems == undefined || newItems == null) {
      return this._destroy();
    } else if (newItems && newItems.length === 0) {
      this.filteredItems = [];
    }

    if (newItems && newItems.length > 0 && newItems[0].constructor === String) {
      // The following object change will trigger the observer again, so we do an early return.
      this.items = newItems.map((element, index) => ({ id: index, name: element }));
      return;
    }

    for (let [key, item] of Object.entries(this.items)) {
      item._csHTML = this._itemColumn(item);
      this.items[key] = item;
    }
    if (!this.filtering) {
      this.filteredItems = [];
      this.set('filteredItems', this.items);
    }

    if (this.items.length > 0) {
      this.filterItems(undefined, true);

      afterNextRender(this, () => {
        if (this.__initialSetValue && !this.__initialSetValueWasSet) {
          this.__initialSetValueWasSet = true;
          this._valueChanged(this.__initialSetValue);
        }
        this._resizeItemListHeight();
        this._resizeItemListWidth();
      });
      if (typeof this._ignoreDisabledItems === "undefined" || this._ignoreDisabledItems === false) {
        const currentDisabledItemsKeys = this.disabledItemsKeys;
        this.disabledItems = this.disabledItemsKeys = [];
        this.disableItems(currentDisabledItemsKeys);
      }
    } else {
      if (typeof this._ignoreDisabledItems === "undefined" || this._ignoreDisabledItems === false) {
        afterNextRender(this, () => {
          this._unsetValueInInput();
        });
      }
    }

    // This happens after a lazy load with results triggered by a search.
    if (this._triggerFirstItemSelection) {
      this._triggerFirstItemSelection = false;
      this._selectedIndex = 0;
      this._selectedItems = this.filteredItems[0];
      this._selectItems();
    }
  }

  enableItems (enabledItemsKeys) {
    this.disableItems(this.disabledItemsKeys.filter(key => !enabledItemsKeys.includes(key)), true);
  }

  disableAllItems () {
    this.disableItems([], false, true);
  }

  disableItems (disabledItemsKeys, cleanPrevious = false, disableAll = false) {
    let disabledItemsLength = disabledItemsKeys.length;
    let disabledItemsFound = 0;
    if (disabledItemsLength > 0) {
      disabledItemsKeys = disabledItemsKeys.filter(key => !this.disabledItemsKeys.includes(key));
      disabledItemsLength = disabledItemsKeys.length;
    }
    if (disabledItemsLength > 0 || cleanPrevious || disableAll) {
      this.disabledItemsKeys = disabledItemsKeys;
      let items = [], disabledItems = [];
      for (let [key, item] of Object.entries(this.items)) {
        let newItem = JSON.parse(JSON.stringify(item));
        if (cleanPrevious) {
          newItem.csDisabled = false;
        } else if (disableAll) {
          newItem.csDisabled = true;
        }
        if (disabledItemsLength > 0 && disabledItemsFound < disabledItemsLength) {
          for (let disabledItemKey of disabledItemsKeys) {
            if (item[this.keyColumn] == disabledItemKey) {
              newItem.csDisabled = true;
              disabledItemsFound++;
              break;
            }
          }
        }
        if (newItem.csDisabled) {
          disabledItems.push({ index: key, key: item[this.keyColumn] });
        }
        items.push(newItem);
      }
      this.disabledItems = disabledItems;
      this._ignoreDisabledItems = true;
      this.items = [];
      this.items = items;
      this._ignoreDisabledItems = false;
      this.filterItems();
    }
  }

  deselectAllItems () {
    this._clearValueInput();
    this._tempItems = this.items || [];
    this.items = [];

    this._selectedItems = [];
    this.lastSelectedItems = [];
    this.ironListSelectedItems = [];
    this.items = this._tempItems;
    this._tempItems = undefined;
  }

  _disabledItemsChanged (newDisabledItems) {
    if (newDisabledItems && newDisabledItems.length > 0) {
      if (this.multiSelection) {
        if (this._selectedItems !== undefined) {
          let selectedItems = [];
          for (let [key, item] of Object.entries(this._selectedItems)) {
            if (!this.disabledItemsKeys.includes(item[this.keyColumn])) {
              selectedItems.push(item);
            }
          }
          this._selectedItems = selectedItems;
        }
        if (this.lastSelectedItems !== undefined) {
          let lastSelectedItems = [];
          for (let [key, item] of Object.entries(this.lastSelectedItems)) {
            if (!this.disabledItemsKeys.includes(item[this.keyColumn])) {
              lastSelectedItems.push(item);
            }
          }
          this.lastSelectedItems = lastSelectedItems;
        }
      } else {
        if (this._selectedItems !== undefined) {
          if (this.disabledItemsKeys.includes(this._selectedItems[this.keyColumn])) {
            this._selectedItems = undefined;
            if (!this.opened) {
              this._clearValueInput();
            }
          }
        }
        if (this.lastSelectedItems !== undefined) {
          if (this.disabledItemsKeys.includes(this.lastSelectedItems[this.keyColumn])) {
            this.lastSelectedItems = undefined;
          }
        }
      }
    }
  }

  _computedItemHtml (html) {
    this._debounceRender();
    return html;
  }

  _disabledChanged (disabled) {
    if (disabled) {
      if (this.opened) this.closeDropdown();
      if (this.searchInput) this.searchInput.setAttribute('disabled', '');
    } else {
      if (this.searchInput) this.searchInput.removeAttribute('disabled');
    }

    this._setValue();
  }

  _multiSelectionChanged (newMultiSelectionValue, oldMultiSelectionValue) {
    if (newMultiSelectionValue) {
      this.$.dropdownItems.setAttribute('multi-selection', '');
      this._setMultiSelectionTarget();
    } else {
      this.$.dropdownItems.removeAttribute('multi-selection');
      this.multiSelectionTags = false;
    }
    if (this._selectedItems === undefined) {
      this.__ignoreSelectedItemsChanged = true;
    }
    this._selectedItems = [];
    this.lastSelectedItems = [];
    this.__ignoreSelectedItemsChanged = false;
  }

  _setMultiSelectionTarget () {
    if (this.multiSelection) {
      if (!this.multiSelectionTagsElementParent) {
        this.multiSelectionTags = true;
      }
      if (this.multiSelectionTags) {
        this._setPositionTarget(this.shadowRoot.querySelector('#dynamicListWithInput'));
      } else {
        this._setPositionTarget(this.shadowRoot.querySelector('#searchSelf'));
      }
    } else {
      this._setPositionTarget(this.shadowRoot.querySelector('#searchSelf'));
    }
  }

  _selectionEnabledChanged (newSelectionEnabledValue) {
    if (newSelectionEnabledValue) {
      this.$.dropdownItems.setAttribute('selection-enabled', '');
    } else {
      this.$.dropdownItems.removeAttribute('selection-enabled');
      this.ironListSelectedItems = null;
    }
  }

  _multiSelectionTagsDefined (multiSelectionTags) {
    this.noLabelFloat = this.noLabelFloat;
    return multiSelectionTags ? 'multiSelectionWithTags' : '';
  }

  _computedDisabledSelect (disabled) {
    return disabled ? 'listDisabled' : '';
  }

  _computedItemDisabledClass (disabled) {
    return disabled ? 'dropdown-item-disabled' : '';
  }

  _computedItemSelectedClass (selected) {
    if (this.opened && !this._isMobile) {
      this._debounceFocus();
    }

    return selected ? 'dropdown-item-selected' : '';
  }

  _debounceRender (defaultTimeout = 30) {
    if (typeof this._debounceRenderTimeout !== "undefined") {
      clearTimeout(this._debounceRenderTimeout);
    }
    this._debounceRenderTimeout = setTimeout(() => {
      this._selectItems();
    }, defaultTimeout);
  }

  _debounceFocus (defaultTimeout = 15) {
    if (!this.searchInput) {
      return;
    }
    if (typeof this._debounceFocusTimeout !== "undefined") {
      clearTimeout(this._debounceFocusTimeout);
    }
    this._debounceFocusTimeout = setTimeout(() => {
      this.searchInput.blur();
      this.searchInput.focus();
    }, defaultTimeout);
  }

  openDropdown (targetElement) {
    this.$.dropdown.positionTarget = targetElement || this.targetElement;
    this.$.dropdown.open();
  }

  closeDropdown () {
    this.$.dropdown.close();
  }

  closeDropdownWithoutSaving () {
    if (!this.multiSelection) {
      this._selectedItems = this.lastSelectedItems;
      this.ironListSelectedItems = [];
      this.ironListSelectedItems = this._selectedItems;
      if (this._selectedItems === undefined) {
        this._clearValueInput();
      } else {
        this._setValueInInput();
      }
    }
    if (this.opened) {
      this.closeDropdown();
    } else {
      if (this.searchInput) {
        this.searchInput.blur();
      }
    }
  }

  attachTo (element, options) {

    if (this.resetOnOpen) {
      this._clearSearch();
      this.ironListSelectedItems = null;
      this.filteredItems = this.items;
      this._selectedItems = [];
    }

    if (options !== undefined) {
      for (let [key, value] of Object.entries(options)) {
        this.key = value;
      }
    }

    this._setPositionTarget(element);
    this._resizeItemListHeight();
    this.openDropdown();

    afterNextRender(this, () => {
      this._debounceFocus(0);
    });
  }

  _setPositionTarget (element) {
    this.$.dropdown.positionTarget = element;
    this.targetElement = element;
    this._resizeItemListWidth();
  }

  _debounceFilterItems (event) {
    event.stopImmediatePropagation();

    this.dispatchEvent(new CustomEvent('casper-select-typing', { detail: { typing: true, value: event.detail.value} }));

    const filterItemsTimer = this.lazyLoadResource ? 250 : 50;
    const filterItemsCallback = () => {
      !!this.lazyLoadResource && this.filtering
        ? this._loadMoreItems('search')
        : this.filterItems(event.detail.value);
    };

    if (this._debounceFilterItemsTimeout) {
      clearTimeout(this._debounceFilterItemsTimeout);
      this._debounceFilterItemsTimeout = setTimeout(filterItemsCallback, filterItemsTimer);

      if (!!this.lazyLoadResource && this.filtering) {
        this._lazyLoadTyping = true;
      }
    } else {
      // Call the method straight away and fake a timeout.
      filterItemsCallback();
      this._debounceFilterItemsTimeout = setTimeout(() => { }, 0);
    }
  }

  filterItems (query, clearLast = false, skipFiltering = false) {
    if (typeof this.items === "undefined" || this.items.length === 0 || (skipFiltering === false && this.filtering === false)) {
      return;
    }

    if (clearLast) {
      this._lastQueryNormalized = this._lastQuery = undefined;
    }

    query = query || (this.searchInput ? this.searchInput.value : '');
    if (query === this._lastQuery) {
      return;
    }

    this._lastQuery = query;
    let filteredItems = [];

    let queryNormalized = (query.normalize('NFD').replace(/[\u0300-\u036f]/g, '')).toLowerCase().split(' ').filter((el) => el !== '');

    if (typeof this._lastQueryNormalized !== "undefined") {
      if (this._simpleArrayEqual(queryNormalized, this._lastQueryNormalized ? this._lastQueryNormalized : []) === true) {
        return;
      }
    }

    if (query !== '') {
      let highlightTemplate = this._highlightTemplate();

      this._lastQueryNormalized = queryNormalized;

      if (this.template) {
        this._filterTemplateHTML = this._filterTemplateHTML || document.createElement('div');
      }

      for (let [key, item] of Object.entries(this.items)) {

        let itemValue;
        if (this.template) {
          this._filterTemplateHTML.innerHTML = this._itemColumn(item);
          itemValue = this._filterTemplateHTML.textContent || this._filterTemplateHTML.innerText || item[this.itemColumn];
        } else {
          itemValue = item[this.itemColumn];
        }

        itemValue = itemValue.toString();
        let itemNormalized = itemValue.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
        let modifications = [];

        for (let term of queryNormalized) {
          let indexOf = itemNormalized.indexOf(term);
          if (indexOf !== -1) {
            modifications.push([indexOf, indexOf + term.length - 1]);
          }
        }

        if ((modifications.length > 0 && modifications.length === queryNormalized.length) || this.lazyLoadResource) {
          let itemText;

          // If the items have a template or it resulted from a wild-card search from the ILIKE's underscore operator.
          if (this.template || (modifications.length === 0 && this.lazyLoadResource)) {
            itemText = this._itemColumn(item);
          } else if (modifications.length > 0) {
            // Create highlight template tag around matches
            modifications = this._mergeOverlappedRanges(modifications);
            itemText = itemValue.substring(0, modifications[0][0]);
            for (let m = 0; m < (modifications.length); m++) {
              itemText += highlightTemplate.begin + itemValue.substring(modifications[m][0], modifications[m][1] + 1) + highlightTemplate.end;
              if (m === (modifications.length) - 1) {
                itemText += itemValue.substring(modifications[m][1] + 1, itemValue.length);
              } else {
                itemText += itemValue.substring(modifications[m][1] + 1, modifications[m + 1][0]);
              }
            }
            itemText = this._listItemInnerHTML(itemText);
          }

          let newItem = JSON.parse(JSON.stringify(item));
          newItem._csHTML = itemText;
          filteredItems.push(newItem);
        }
      }

      // @REVIEW:
      // This doesn't seem necessary nor important at this stage..
      // Dont remember why I added it, so I just commented it for now

      //if ( filteredItems.length === 0 ) {
      //this.searchInput.value = _lastQuery;
      //}


      if (this.lazyLoadResource && this._appendNewFilteredItems) {
        this.push('filteredItems', ...this._appendNewFilteredItems.map(newFilteredItem => {
          return filteredItems.find(filteredItem => filteredItem[this.keyColumn] === newFilteredItem[this.keyColumn]);
        }));
        this._appendNewFilteredItems = undefined;
      } else {
        this.filteredItems = [];
        this.filteredItems = filteredItems;
      }
    } else {
      if (this.lazyLoadResource && this._appendNewFilteredItems) {
        this.push('filteredItems', ...this._appendNewFilteredItems);
        this._appendNewFilteredItems = undefined;
      } else {
        this.filteredItems = [];
        this.filteredItems = this.items;
      }

      this._lastQueryNormalized = queryNormalized;
    }

    if (this.resizeOnFilter) {
      this._resizeItemListHeight();
    }

    try {
      this.shadowRoot.querySelector("#suffixIcon").style.opacity = this._lastQueryNormalized.length > 0 ? 1 : 0;
    } catch (e) {
      // Sometimes the #suffixIcon might not exist.
    }
  }

  _resizeItemListHeight () {
    if (this.listHeight) {
      if (this.items && this.listItemHeight) {
        const measuringUnit = this.listHeight.slice(-2);
        let measuringUnitSize;

        if (measuringUnit === 'px') {
          measuringUnitSize = parseInt(this.listHeight);
        } else if (measuringUnit === 'vh') {
          measuringUnitSize = document.documentElement.clientHeight * (parseInt(this.listHeight) / 100);
        }

        if (this.items.length * this.listItemHeight >= measuringUnitSize) {
          this.$.dropdownItems.style.height = this.listHeight;
          return;
        }
      }
      this.$.dropdownItems.style.maxHeight = this.listHeight;
    }
  }

  _resizeItemListWidth () {
    if (this.listWidth) {
      // This means the user specified a width via properties.
      this.$.dropdown.style.width = this.listWidth;
    } else if (this.$.dropdown.positionTarget && (this.fixedContainerWidth || !this.items || this.items.length === 0)) {
      // This means the dropdown will try to ajust to the container's width.
      this.$.dropdown.style.width = `${this.$.dropdown.positionTarget.offsetWidth}px`;
    } else if (this.$.dropdown.positionTarget && this.items && this.items.length > 0) {
      // Fetch the item which has the most characters.
      const longestItem = this.items.reduce((previousItem, nextItem) => (
        nextItem[this.itemColumn].length > previousItem[this.itemColumn].length ? nextItem : previousItem
      ));

      this.$.measureDropdownItem.innerText = longestItem[this.itemColumn];

      // Use the highest width between the container or the measure element's current width plus the 14px icon, the
      // 8px container's padding (4px on both sides) and some additional 20px margin.
      this.$.dropdown.style.width = `${Math.max(this.$.dropdown.positionTarget.offsetWidth, this.$.measureDropdownItem.offsetWidth + 42)}px`;
    }

    this.$.dropdown.notifyResize();
  }

  _selectItems () {
    if (this.filteredItems && this.filteredItems.length > 0 && this._selectedItems && (!this.multiSelection || this._selectedItems.length > 0)) {
      for (let [key, item] of Object.entries(this.filteredItems)) {
        if (!this.multiSelection) {
          if (this._selectedItems[this.keyColumn] == item[this.keyColumn]) {
            this.$.dropdownItems.selectItem(this.$.dropdownItems.items[key]);
          }
        } else {
          for (let selItem of this._selectedItems) {
            if (selItem[this.keyColumn] == item[this.keyColumn]) {
              this.$.dropdownItems.selectItem(this.$.dropdownItems.items[key]);
            }
          }
        }
      }
    }

    this.$.dropdown.notifyResize();
  }

  _setValue () {
    if (!this._selectedItems || this.disabled) {
      this.value = this._skipValueObserver = '';
      return;
    }

    this.value = this._skipValueObserver = !this.multiSelection
      ? this._selectedItems[this.keyColumn]
      : this._selectedItems.map(item => item[this.keyColumn]).join(this.multiSelectionValueSeparator);
  }

  get selectedItems () {
    return this.disabled ? null : this._selectedItems;
  }

  _highlightTemplate () {
    return { begin: `<${this.highlightTemplateTag} class="${this.highlightTemplateClass}">`, end: `</${this.highlightTemplateTag}>` };
  }

  _simpleArrayEqual (arr1, arr2) {
    if (arr1.length != arr2.length) {
      return false;
    }
    for (let i = 0, l = arr1.length; i < l; i++) {
      if (arr1[i] != arr2[i]) {
        return false;
      }
    }
    return true;
  }

  _mergeOverlappedRanges (ranges) {
    let result = [], last;
    ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    ranges.forEach(r => {
      if (!last || (r[0] - 1) > last[1]) {
        result.push(last = r);
      } else if ((r[1] - 1) > last[1]) {
        last[1] = r[1];
      }
    });
    return result;
  }

  /**
   * Deselects all currently selected items when the user clicks the
   * clear icon.
   * @param {Object} event - The event that was triggered.
   */
  _clearSelectIconClicked (event) {
    if (this.disabled || this.readonly) return;

    this.dispatchEvent(new CustomEvent('casper-select-clear-selection', { detail: { clear: true} }));

    event.stopImmediatePropagation();

    if (!!this.lazyLoadResource) {
      this._lastQuery = '';
      this.resetLazyLoad(true);
    } else {
      this.deselectAllItems();
    }

    if (this.searchInput) this.searchInput.blur();
  }

  /**
   * Checks if there is at least one item selected to hide / display
   * the clear icon on the dropdown.
   * @param {Object|Array} selectedItems - The currently selected item(s).
   */
  _shouldDisplayClearIcon (selectedItems) {
    return !this.disableClear
      && selectedItems
      && Object.entries(selectedItems).length > 0;
  }

  _listItemInnerHTML (itemContents) {

    const iconElement = document.createElement('casper-icon');
    iconElement.setAttribute('icon', 'fa-light:check');

    const textContainer = document.createElement('div');
    textContainer.classList.add('dropdown-item-text');
    textContainer.innerHTML = DOMPurify.sanitize(itemContents, {
      CUSTOM_ELEMENT_HANDLING: {
          tagNameCheck: /^casper-/, // only casper elements are allowed
          attributeNameCheck: /icon/, // only icon attribute is allowed
          allowCustomizedBuiltInElements: false, // no customized built-ins allowed
      },
    });

    const iconContainer = document.createElement('div');
    iconContainer.classList.add('dropdown-item-icon');
    iconContainer.appendChild(iconElement);

    return textContainer.outerHTML + iconContainer.outerHTML;
  }

  _multiSelectionHasItems () {
    return this.multiSelection
      && this._selectedItems
      && this._selectedItems.length > 0;
  }

  _searchInputBlurred () {
    this._shouldLabelFloat = !!this.searchInput.value || this._multiSelectionHasItems();
    this._searchInputFiltering = false;
  }

  _searchInputFocused () {
    this._shouldLabelFloat = true;
    this._searchInputFiltering = true;
  }

  _loadMoreItems (eventSource) {
    this.__loadMoreItemsDebouncer = Debouncer.debounce(this.__loadMoreItemsDebouncer, timeOut.after(100), () => {
      this._lazyLoadTyping = false;

      if (!this.lazyLoadResource) return;

      const triggeredFromSearch = eventSource === 'search';

      afterNextRender(this, async () => {
        // Used to not trigger an additional query for a repeated search for when the user opens the select.
        if (triggeredFromSearch && this.searchInput && this.searchInput.value === this._lastQuery) return;

        // Flag that states if this is the first time fetching data or not.
        this._lazyLoadFirstFetch = this._lazyLoadFirstFetch !== undefined ? this._lazyLoadFirstFetch : true;

        // This means the filter has changed therefore you reset the page number and the disabled flag.
        if (triggeredFromSearch || !this._lazyLoadCurrentPage) {
          this._lazyLoadCurrentPage = 0;
          this._lazyLoadDisabled = false;
        }

        if (this._lazyLoadDisabled) return;

        this._lazyLoadFetching = true;

        const socketResponse = await window.app.socket.jget(this._loadMoreItemsUrl(), this.lazyLoadTimeout);

        // Hide the spinner and reset the scroll triggers.
        this._lazyLoadFetching = false;
        this._dropdownScrollEventDisabled = false;
        if (socketResponse.errors && socketResponse.errors.constructor === Array && socketResponse.errors.length > 0 && socketResponse.errors[0].detail) {
          return window.app.openToast({
            backgroundColor: 'red',
            text: socketResponse.errors[0].detail,
          });
        }

        // Fetch the relationships data which falls under the 'included' key.
        const includedData = socketResponse.included ? socketResponse.included : null;
        const resultsIncludedData = {};
        if (includedData && includedData.length > 0) {
          includedData.forEach(included => {
            if (!resultsIncludedData[included.type]) {
              resultsIncludedData[included.type] = {};
            }
            resultsIncludedData[included.type][included.id] = included;
          });
        }

        // Either replace the all items list if it was triggered by a search or append if it's a scroll event.
        const currentItems = this.items || [];
        const formattedResultItems = !this.lazyLoadCallback
          ? socketResponse.data
          : socketResponse.data.map(item => this.lazyLoadCallback(item, resultsIncludedData));

        const resultItems = triggeredFromSearch
          ? formattedResultItems
          : [...currentItems, ...formattedResultItems];

        // This is used so that we can push the elements into the list instead of directly replacing them
        // which would cause iron-list to scroll to its top.
        if (!triggeredFromSearch && this._lazyLoadCurrentPage !== 1) {
          this._appendNewFilteredItems = formattedResultItems;
        }

        // Save the last query in case there are no results.
        if (triggeredFromSearch && socketResponse.data.length === 0) this._lastQuery = this.searchInput.value;

        // Select the first item that resulted from a search.
        if (triggeredFromSearch && socketResponse.data.length > 0 && !this.multiSelection) {
          this._triggerFirstItemSelection = true;
        }

        this.items = resultItems;

        // Open the dropdown if this was triggered from a search event.
        if (triggeredFromSearch && !this.opened) {
          this.openDropdown();
        }

        // Calculate the total number of existing pages.
        if (socketResponse.meta && socketResponse.meta.total) {
          this._lazyLoadTotalResults = parseInt(socketResponse.meta.total);
        } else {
          if (socketResponse.data) {
            this._lazyLoadTotalResults = parseInt(this.items.length);
            if (!this.lazyLoadFetchAllResults) {
              if (this.lazyLoadPageSize && socketResponse.data.length >= this.lazyLoadPageSize) this._lazyLoadTotalResults += this.lazyLoadPageSize;
              if (!this.lazyLoadPageSize && socketResponse.data.length > 0) this._lazyLoadTotalResults += 1;
            }
          } else {
            this._lazyLoadTotalResults = this.items.length;
          }
        }

        // Disable further socket queries if there are no more results.
        this._lazyLoadDisabled = this.items.length === this._lazyLoadTotalResults;

        // Dispatch an event with the flag stating if it's the first fetch or not.
        this.dispatchEvent(new CustomEvent('casper-select-lazy-loaded', { detail: { initialLoad: this._lazyLoadFirstFetch } }));
        this._lazyLoadFirstFetch = false;
      });
    });
  }

  _loadMoreItemsUrl () {
    this._lazyLoadCurrentPage++;

    // Apply the metadata, page size and current page number.
    let resourceUrlParams = [this.lazyLoadMetadataAttr];

    if (!this.lazyLoadFetchAllResults) {
      resourceUrlParams = resourceUrlParams.concat([
        `${this.lazyLoadPageSizeAttr}=${this.lazyLoadPageSize}`,
        `${this.lazyLoadPageNumberAttr}=${this._lazyLoadCurrentPage}`
      ]);
    }


    let filterParams = Object.values(this.lazyLoadCustomFilters || {}).filter(field => field).join(' AND ');

    if (this.searchInput && this.searchInput.value && this.lazyLoadFilterFields) {
      // Escape the % characters that have a special meaning in the ILIKE clause.
      let escapedSearchInputValue = this.searchInput.value.replace(/[%\\]/g, '\$&');
      escapedSearchInputValue = escapedSearchInputValue.replace(/[&]/g, '_');

      // Build the filter parameters.
      const customFilterParams = this.lazyLoadFilterFields
        .filter(filterField => !Object.keys(this.lazyLoadCustomFilters || {}).includes(filterField.constructor === String ? filterField : filterField.field))
        .map(filterField => {
          if (filterField.constructor === String) {
            return `${filterField}::TEXT ILIKE '%${escapedSearchInputValue}%'`;
          }

          if (filterField.constructor === Object && filterField.field && filterField.filterType) {
            switch (filterField.filterType) {
              case 'exact': return `${filterField.field}::TEXT ILIKE '${escapedSearchInputValue}'`;
              case 'endsWith': return `${filterField.field}::TEXT ILIKE '%${escapedSearchInputValue}'`;
              case 'contains': return `${filterField.field}::TEXT ILIKE '%${escapedSearchInputValue}%'`;
              case 'startsWith': return `${filterField.field}::TEXT ILIKE '${escapedSearchInputValue}%'`;
            }
          }
        }).join(' OR ');

      if (customFilterParams) {
        filterParams
          ? filterParams += ` AND (${customFilterParams})`
          : filterParams += customFilterParams;
      }
    }

    if (filterParams) {
      resourceUrlParams.push(`${this.lazyLoadFilterAttr}="(${filterParams})"`);
    }

    // Check if the resource URL already contains a ? which indicates some parameters were already given.
    return this.lazyLoadResource.includes('?')
      ? `${this.lazyLoadResource}&${resourceUrlParams.join('&')}`
      : `${this.lazyLoadResource}?${resourceUrlParams.join('&')}`;

  }

  _lazyLoadResourceChanged () {
    this._dropdownScrollEventDisabled = !this.lazyLoadResource;

    this.smartFilter = false;
  }

  _valueChanged (value) {
    if (!this.__initialSetValue && value !== null && value !== undefined && (!this.items || this.items && this.items.length == 0)) {
      this.__initialSetValue = value;
      return;
    }
    if (this._skipValueObserver === value) {
      this._skipValueObserver = undefined;
      return;
    }

    afterNextRender(this, () => {
      if (value !== null && value !== undefined && this.items && this.items.length > 0) {
        const valuesToSelect = !this.multiSelection ? [value] : value.split(this.multiSelectionValueSeparator);
        this._findAndSelectItems(valuesToSelect);
      }
    });
  }

  _dropdownPaginationInfo (items, lazyLoadTotalResults) {
    if (items) return `${items.length} de ${lazyLoadTotalResults ? lazyLoadTotalResults : '...'}`;
  }

  resetLazyLoad (internalReset = false) {
    this.items = undefined;
    this._lastQuery = undefined;
    this._lazyLoadCurrentPage = 0;
    this._lazyLoadDisabled = false;
    this._lazyLoadTotalResults = undefined;
    this._lazyLoadFirstFetch = !internalReset;

    this._loadMoreItems('scroll');
  }

  _shouldDisplayPaginationAndOrClose (multiSelection, lazyLoadResource, hasSuffixAssignedNodes) {
    return multiSelection || !!lazyLoadResource || hasSuffixAssignedNodes;
  }


  _shouldDisplaySpinner (lazyLoadFetching, lazyLoadTyping) {
    return lazyLoadFetching || lazyLoadTyping;
  }

  _dropdownScrolled () {
    // Ignore the event if this flagged is marked as true (not lazy load or no more results via lazy load).
    if (this._dropdownScrollEventDisabled || this.lazyLoadFetchAllResults) return;

    // Debounce the scroll event listener.
    if (this._dropdownScrollTimeout) clearTimeout(this._dropdownScrollTimeout);
    this._dropdownScrollTimeout = setTimeout(() => {
      const ironList = this.$.dropdownItems;

      if (ironList.scrollTop + ironList.getBoundingClientRect().height >= ironList.scrollHeight - 200) {
        // Disable the event listener until it's re-activated.
        this._dropdownScrollEventDisabled = true;
        this._loadMoreItems('scroll');
      }
    }, 50);
  }

  _findAndSelectItems (itemsToSelect) {
    let foundItems = 0;
    const selectedIndexes = [];

    // In case of multi-selection clear the current selected items.
    if (this.multiSelection) {
      this.selectedItems
        .map(selectedItem => this.items.findIndex(item => item[this.keyColumn].toString() === selectedItem[this.keyColumn].toString()))
        .forEach(selectedIndex => this.$.dropdownItems.deselectIndex(selectedIndex));
    }

    for (let [key, item] of Object.entries(this.items)) {
      itemsToSelect.forEach(itemToSelect => {
        if (itemToSelect.toString() === item[this.keyColumn].toString()) {
          foundItems++;
          selectedIndexes.push(parseInt(key));
          this.$.dropdownItems.selectIndex(parseInt(key));
        }
      });

      if (foundItems === itemsToSelect.length) break;
    }

    if (foundItems === 0) {
      this._selectedItems = this.lastSelectedItems = [];
      this.$.dropdownItems.clearSelection();
    } else {
      this._selectedItems = this.lastSelectedItems = JSON.parse(JSON.stringify(this.ironListSelectedItems));
    }

    if (selectedIndexes.length > 0) {
      // If there is only one selected item use that index, otherwise use the minimum one.
      this._selectedIndex = selectedIndexes.length === 1
        ? selectedIndexes[0]
        : Math.min(...selectedIndexes);
    }

    afterNextRender(this, () => this.$.dropdownItems.scrollToIndex(this._selectedIndex));

    // Only set the value in the search input for single-selection.
    if (!this.multiSelection && !this._searchInputFiltering) this._setValueInInput();
  }

  _browserSupportsIntersectionObserver () {
    return 'IntersectionObserver' in window;
  }

  _isInputDisabled (readonly, disabled) {
    // This is only used because we want to apply the same styles to readonly as disabled.
    return readonly || disabled;
  }

  _displayDropdownFooterButton (multiSelection, noCancelOnOutsideClick) {
    return multiSelection || noCancelOnOutsideClick;
  }

  restampTemplate () {
    if (!this.template || !this.items || !this.filteredItems) return;

    let filteredItems = [];

    for (let [key, item] of Object.entries(this.items)) {
      if (this.filteredItems.some(filteredItem => filteredItem[this.keyColumn] === item[this.keyColumn])) {
        item._csHTML = this._listItemInnerHTML(this.__stampItemTemplate(item));
        filteredItems.push(item);
      }
    }

    this.filteredItems = [];
    this.filteredItems = JSON.parse(JSON.stringify(filteredItems));
  }

  __stampItemTemplate (item) {

    const templateClass = templatize(this.template);
    const templateClassInstance = new templateClass(item);

    const wrapperElement = document.createElement('div');
    wrapperElement.appendChild(templateClassInstance.root);

    return wrapperElement.outerHTML;
  }
}

window.customElements.define(CasperSelect.is, CasperSelect);
