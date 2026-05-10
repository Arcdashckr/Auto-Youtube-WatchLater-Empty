// ==UserScript==
// @name            Auto YouTube Watch Later Empty
// @name:tr         Otomatik YouTube Daha Sonra İzle Temizleyici
// @namespace       https://github.com/Arcdashckr/Auto-Youtube-WatchLater-Empty
// @version         1.0.0
// @description     Auto empty your YouTube Watch Later playlist.
// @description:tr  Otomatik olarak YouTube Daha Sonra İzle listenizi boşaltın.
// @author          Arcdashckr
// @match           https://www.youtube.com/*
// @icon            https://cdn.simpleicons.org/youtube/FF0000
// @run-at          document-end
// @grant           GM_registerMenuCommand
// @license         MIT
// @updateURL       https://github.com/Arcdashckr/Auto-Youtube-WatchLater-Empty/raw/main/Auto-Youtube-WatchLater-Empty.js
// @downloadURL     https://github.com/Arcdashckr/Auto-Youtube-WatchLater-Empty/raw/main/Auto-Youtube-WatchLater-Empty.js
// @supportURL      https://github.com/Arcdashckr/Auto-Youtube-WatchLater-Empty/issues
// ==/UserScript==

(function() {
    'use strict';

    // --- AYARLAR VE DEĞİŞKENLER ---
    const DELAY = 1500;
    let isRunning = false;
    let lastUrl = location.href;

    // Hedef XPath'ler
    const VIDEO_MENU_XPATH = "/html/body/ytd-app/div[1]/ytd-page-manager/ytd-browse/ytd-two-column-browse-results-renderer/div[1]/ytd-section-list-renderer/div[2]/ytd-item-section-renderer/div[3]/ytd-playlist-video-list-renderer/div[3]/ytd-playlist-video-renderer[1]/div[3]/ytd-menu-renderer/yt-icon-button/button";
    const REMOVE_BUTTON_XPATH = "/html/body/ytd-app/ytd-popup-container/tp-yt-iron-dropdown/div/ytd-menu-popup-renderer/tp-yt-paper-listbox/ytd-menu-service-item-renderer[2]/tp-yt-paper-item";

    // --- YARDIMCI FONKSİYONLAR ---
    const log = (msg, type = 'info') => {
        const prefix = '[WatchLater-Cleaner]';
        const style = type === 'error' ? 'color: #ff4d4d; font-weight: bold;' : 'color: #00ff88; font-weight: bold;';
        console.log(`%c${prefix} %c${msg}`, style, 'color: inherit;');
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function getElementByXpath(path) {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    // --- ANA MANTIK ---
    async function startCleaning() {
        if (!location.href.includes("list=WL")) {
            alert(navigator.language.startsWith('tr') ? "Lütfen 'Daha Sonra İzle' listesine gidin!" : "Please go to 'Watch Later' playlist!");
            return;
        }

        if (isRunning) return;

        const confirmMsg = navigator.language.startsWith('tr')
            ? "Listedeki TÜM videolar kaldırılacak. Devam edilsin mi?"
            : "ALL videos in the list will be removed. Proceed?";

        if (!confirm(confirmMsg)) return;

        isRunning = true;
        log("Temizlik işlemi başlatıldı...");

        while (isRunning) {
            const menuButton = getElementByXpath(VIDEO_MENU_XPATH);

            if (!menuButton) {
                log("Temizlenecek video bulunamadı veya liste sonu.");
                isRunning = false;
                break;
            }

            try {
                menuButton.scrollIntoView({block: "center"});
                menuButton.click();
                await sleep(DELAY);

                const removeButton = getElementByXpath(REMOVE_BUTTON_XPATH);

                if (removeButton) {
                    removeButton.click();
                    log("Video kaldırıldı.");
                } else {
                    log("Kaldır butonu bulunamadı, yedek yöntem deneniyor...", 'error');
                    const menuItems = document.querySelectorAll('ytd-menu-service-item-renderer');
                    let foundFallback = false;
                    for (const item of menuItems) {
                        if (item.textContent.toLowerCase().includes("kaldır") || item.textContent.toLowerCase().includes("remove")) {
                            item.click();
                            foundFallback = true;
                            break;
                        }
                    }
                    if (!foundFallback) {
                        document.body.click();
                        isRunning = false;
                        break;
                    }
                }
            } catch (err) {
                log("Hata oluştu: " + err, 'error');
                isRunning = false;
            }

            await sleep(DELAY);
        }

        const doneMsg = navigator.language.startsWith('tr') ? "İşlem tamamlandı!" : "Process completed!";
        alert(doneMsg);
        log("İşlem bitti.");
    }

    // --- DİNAMİK SAYFA KONTROLÜ ---
    function init() {
        // Tampermonkey menüsüne komutları ekle
        GM_registerMenuCommand(navigator.language.startsWith('tr') ? "🚀 Temizliği Başlat" : "🚀 Start Cleaning", startCleaning);
        GM_registerMenuCommand(navigator.language.startsWith('tr') ? "🛑 Durdur" : "🛑 Stop", () => {
            isRunning = false;
            log("İşlem durduruldu.");
        });

        log("Script aktif. Kullanmak için Tampermonkey menüsünü açın.");
    }

    // Sayfa değişikliklerini izle (YouTube SPA Navigasyonu için)
    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            if (location.href.includes("list=WL")) {
                log("Daha Sonra İzle listesi algılandı.");
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // İlk çalıştırma
    init();

})();
