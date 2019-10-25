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

import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { IronFitBehavior } from '@polymer/iron-fit-behavior/iron-fit-behavior.js';
import { IronOverlayBehavior } from '@polymer/iron-overlay-behavior/iron-overlay-behavior.js';

class CasperSelectDropdown extends mixinBehaviors([IronOverlayBehavior, IronFitBehavior], PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          padding: 4px;
          display: flex;
          overflow: hidden;
          flex-direction: column;
          border: 1px solid #AAA;
          background-color: white;
          border-radius: 0 0 3px 3px;
          max-height: 99vh !important;
          transition: width 250ms linear;
          box-shadow: rgba(25, 59, 103, 0.05) 0px 0px 0px 1px,
                      rgba(28, 55, 90, 0.16) 0px 2px 6px -1px,
                      rgba(28, 50, 79, 0.38) 0px 8px 24px -4px;
        }

        iron-icon#suffixIcon {
          width: 15px;
          height: 15px;
          color: #525252;
        }

        #dropdown-no-items {
          display: flex;
          font-size: 13px;
          padding: 15px 0;
          color: lightgrey;
          align-items: center;
          flex-direction: column;
          @apply --casper-select-dropdown-no-items;
        }

        #dropdown-no-items iron-icon {
          width: 75px;
          height: 75px;
        }

          #ironScrollThreshold {
          overflow: auto;
          -ms-overflow-style: -ms-autohiding-scrollbar;
          max-height: var(--casper-combo-box-overlay-max-height, 80vh);

          /* Fixes item background from getting on top of scrollbars on Safari */
          transform: translate3d(0, 0, 0);

          /* Enable momentum scrolling on iOS (iron-list v1.2+ no longer does it for us) */
          -webkit-overflow-scrolling: touch;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          flex-grow: 1;
        }

        #dropdownItems {
          @apply --casper-select-dropdown-items;
        }

        #dropdownItems[hidden] {
          display: none;
        }

        #measureDropdownItem,
        #dropdownItems .dropdown-item {
          padding: 5px;
          display: flex;
          font-size: 13px;
          min-height: 30px;
          align-items: center;
          box-sizing: border-box;
          background-color: white;
          border-bottom: 1px solid white;
          justify-content: space-between;
          @apply --casper-select-dropdown-item;
        }

        #dropdownItems .dropdown-item[hidden] {
          display: none;
        }

        #dropdownItems .dropdown-item:not(.dropdown-item-disabled).dropdown-item-selected {
          color: white;
          background-color: var(--dark-primary-color);
          @apply --casper-select-dropdown-item-selected;
        }

        #dropdownItems .dropdown-item:not(.dropdown-item-disabled):hover {
          color: white;
          background-color: var(--primary-color);
          @apply --casper-select-dropdown-item-hover;
        }

        #dropdownItems .dropdown-item .dropdown-item-highlight {
          border: 1px solid #CCC;
          font-weight: bold;
          border-radius: 4px;
          @apply --casper-select-dropdown-item-highlight;
        }

        #dropdownItems .dropdown-item .dropdown-item-text {
          flex-grow: 1;
          word-break: break-word;
          -webkit-hyphens: auto;
          -moz-hyphens: auto;
          -ms-hyphens: auto;
          hyphens: auto;
        }

        #dropdownItems .dropdown-item .dropdown-item-icon {
          flex: 0 0 14px;
          @apply --casper-select-dropdown-item-icon;
        }

        #dropdownItems .dropdown-item .dropdown-item-icon iron-icon {
          width: 100%;
          height: 100%;
          display: none;
        }

        #dropdownItems .dropdown-item.dropdown-item-selected .dropdown-item-icon iron-icon {
          display: block;
        }

        #dropdownItems .dropdown-item.dropdown-item-disabled {
          color: #00000033;
          cursor: not-allowed;
          @apply --casper-select-dropdown-item-disabled;
        }

        .dropdown-pagination-container {
          padding: 5px;
          display: flex;
          color: #737373;
          line-height: 30px;
          font-size: 0.85em;
          position: relative;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 -5px 5px -5px #CCC;
        }

        .dropdown-pagination-container .dropdown-pagination {
          display: flex;
          align-items: center;
        }

        .dropdown-pagination-container .dropdown-pagination paper-spinner {
          margin-left: 10px;
        }

        .dropdown-pagination-container casper-button {
          margin: 0;
        }
      </style>
      <slot></slot>
  `;
  }

  static get is () {
    return 'casper-select-dropdown';
  }

  ready () {
    super.ready();

    this.shadowRoot.querySelector('slot').assignedNodes().forEach(assignedNode => {
      this.shadowRoot.appendChild(assignedNode);
    });
  }
}

window.customElements.define(CasperSelectDropdown.is, CasperSelectDropdown);
