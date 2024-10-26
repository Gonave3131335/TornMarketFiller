// ==UserScript==
// @name         Torn Market Price Filler
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Automatically fill quantity and price fields with Torn API data
// @author       Dexterity [3131335]
// @updateURL    https://github.com/Gonave3131335/TornMarketFiller/raw/main/MarketPriceFiller.user.js
// @downloadURL  https://github.com/Gonave3131335/TornMarketFiller/raw/main/MarketPriceFiller.user.js
// @match        https://www.torn.com/page.php?sid=ItemMarket*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const API_KEY = '';

    async function fillItem(row) {
        const itemID = row.querySelector("img.torn-item").src.match(/items\/(\d+)\//)[1];
        const quantityInput = row.querySelector("input[placeholder='Qty']");
        const priceInput = row.querySelector("input[placeholder='Price']");
        const quantityCheckbox = row.querySelector("input[type='checkbox']:not(#itemRow-incognitoCheckbox-8-13057303023)");

        try {
            const img = row.querySelector('img.torn-item');
            if (!img) return;

            const itemIDMatch = img.src.match(/\/images\/items\/(\d+)\//);
            if (!itemIDMatch) return;
            const itemID = itemIDMatch[1];

            const url = `https://api.torn.com/v2/market/${itemID}?selections=itemmarket&key=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) return;

            const listings = data.itemmarket.listings;
            const lowestListing = listings.reduce((min, listing) => listing.price < min ? listing.price : min, Infinity);

            if (lowestListing < Infinity) {
                const formattedPrice = (lowestListing - 1).toLocaleString('en-US');

                if (priceInput) {
                    priceInput.value = formattedPrice;
                    const priceEvent = new Event('input', { bubbles: true });
                    priceInput.dispatchEvent(priceEvent);
                }

                if (quantityInput) {
                    const maxQuantity = quantityInput.dataset.money;
                    quantityInput.value = maxQuantity;
                    const quantityEvent = new Event('input', { bubbles: true });
                    quantityInput.dispatchEvent(quantityEvent);
                }

                if (quantityCheckbox) {
                    quantityCheckbox.click();
                }
            }
        } catch (error) {}
    }

    function addFillButtons() {
        const itemRows = document.querySelectorAll('.itemRowWrapper___cFs4O');

        itemRows.forEach(row => {
            if (row.querySelector('.fillButton')) return;

            const fillButton = document.createElement('button');
            fillButton.innerText = 'Fill';
            fillButton.classList.add('fillButton');
            fillButton.style.marginLeft = '10px';

            fillButton.onclick = () => fillItem(row);

            const itemRowElement = row.querySelector('.itemRow___Mf7bO');
            if (itemRowElement) {
                itemRowElement.appendChild(fillButton);
            }
        });
    }

    window.fillItem = fillItem;

    window.addEventListener('load', () => {
        addFillButtons();

        const observer = new MutationObserver(() => {
            addFillButtons();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
})();
