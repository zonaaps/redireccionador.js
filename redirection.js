(function() {
  const clickAdUrl = "https://otieu.com/4/9467773"; // Anuncio para clics en la página principal JEF-2.2
  const embedAdUrl = "https://yawnfreakishnotably.com/x5au88i2?key=b204c2328553c7815136f462216fa2ab"; // Anuncio para embed.php
  const currentUrl = window.location.href;
  const domain = window.location.origin;
  const adInterval = 300000; // 5 minutos para clics
  const maxPageLoads = 5; // Máximo de cargas antes de restablecer
  const storageCleanupInterval = 3600000; // 1 hora para limpiar sessionStorage

  // Detectar navegador de TikTok con una expresión regular más robusta
  const userAgent = navigator.userAgent;
  const isTikTokBrowser = /TikTok|Bytedance|ByteDance|bytedance/i.test(userAgent);
  console.log("Navegador de TikTok detectado:", isTikTokBrowser, "User-Agent:", userAgent);

  // Generar una clave única para la página (basada en la URL)
  const pageKey = btoa(currentUrl);
  let pageLoads = parseInt(sessionStorage.getItem('pageLoads_' + pageKey) || '0', 10);
  pageLoads += 1;
  sessionStorage.setItem('pageLoads_' + pageKey, pageLoads);
  console.log("Carga de página #", pageLoads, "para pageKey:", pageKey);

  // Verificar parámetros y estado de noAd para embed
  const urlParams = new URLSearchParams(window.location.search);
  const noAdParam = urlParams.get('noAd') === '1';
  const isNoAdValid = sessionStorage.getItem('noAdValid') === 'true';
  const noAd = noAdParam && isNoAdValid && pageLoads <= maxPageLoads;
  console.log("Sitio principal cargado, noAd:", noAd, "noAdParam:", noAdParam, "isNoAdValid:", isNoAdValid, "pageLoads:", pageLoads, "URL:", currentUrl);

  // Restablecer pageLoads si se superan las 5 cargas
  if (pageLoads > maxPageLoads) {
    console.log("Restableciendo pageLoads y limpiando noAd para pageKey:", pageKey);
    sessionStorage.setItem('pageLoads_' + pageKey, '0');
    sessionStorage.removeItem('noAdValid');
    // Limpiar adShown_ para permitir nuevos anuncios en la página
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('adShown_')) {
        sessionStorage.removeItem(key);
      }
    });
  }

  // Limpieza periódica de sessionStorage
  const lastCleanupTime = parseInt(localStorage.getItem('lastCleanupTime') || '0', 10);
  if (Date.now() - lastCleanupTime > storageCleanupInterval) {
    console.log("Limpiando sessionStorage");
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('adShown_') || key.startsWith('pageLoads_')) {
        sessionStorage.removeItem(key);
      }
    });
    localStorage.setItem('lastCleanupTime', Date.now().toString());
  }

  // Bandera para evitar procesar múltiples eventos simultáneos
  let isProcessing = false;
  let lastAdTime = parseInt(sessionStorage.getItem('lastAdTime') || '0', 10);

  // Función para verificar si la URL es del dominio actual
  function isSameDomain(url) {
    try {
      const urlObj = new URL(url, domain);
      return urlObj.origin === domain || urlObj.pathname.startsWith('/');
    } catch (e) {
      console.error("Error al parsear URL:", url, e);
      return false;
    }
  }

  // Función para verificar si la URL es de una imagen
  function isImageUrl(url) {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
  }

  // Función para verificar si el enlace es válido
  function isValidLink(target) {
    if (target.tagName !== 'A') return false;
    const href = target.getAttribute('href');
    if (!href || href === '#' || href === '' || href.startsWith('javascript:')) {
      console.log("Enlace inválido ignorado, href:", href);
      return false;
    }
    return true;
  }

  // Función para manejar el disparo del anuncio
  function handleAdTrigger(event, targetUrl, isFromEmbed = false) {
    if (!isProcessing && (isFromEmbed ? !noAd : Date.now() - lastAdTime >= adInterval)) {
      isProcessing = true;
      if (!isFromEmbed) {
        lastAdTime = Date.now();
        sessionStorage.setItem('lastAdTime', lastAdTime.toString());
      }
      console.log("Procesando evento, disparando anuncio, isFromEmbed:", isFromEmbed);

      // Mostrar mensaje de transición si existe
      const transitionMessage = document.getElementById('transitionMessage');
      if (transitionMessage) {
        transitionMessage.style.display = 'block';
        console.log("Mensaje de transición mostrado");
      }

      // Construir URL para nueva pestaña
      const url = new URL(targetUrl);
      url.searchParams.delete('noAd');
      url.searchParams.set('noAd', '1');
      const newTabUrl = url.toString();
      console.log("newTabUrl:", newTabUrl);

      // Seleccionar la URL del anuncio según el evento
      const adUrl = isFromEmbed ? embedAdUrl : clickAdUrl;

      // Intentar abrir nueva pestaña
      const newWindow = window.open(newTabUrl, '_blank');
      if (newWindow) {
        console.log("Nueva pestaña abierta con:", newTabUrl);
      } else {
        console.error("Fallo al abrir nueva pestaña");
        const popupBlocked = document.getElementById('popupBlocked');
        if (popupBlocked) popupBlocked.style.display = 'block';
      }

      // Redirigir al anuncio después de un pequeño retraso
      setTimeout(() => {
        console.log("Redirigiendo al anuncio:", adUrl);
        window.location.href = adUrl;
      }, 500);

      // Evitar la acción por defecto del clic (solo para clics)
      if (!isFromEmbed && event) {
        event.preventDefault();
        event.stopPropagation();
      }
    } else {
      console.log("Evento ignorado, isProcessing:", isProcessing, "Tiempo desde último anuncio:", Date.now() - lastAdTime, "noAd:", noAd);
    }

    // Resetear isProcessing después de un tiempo
    setTimeout(() => {
      isProcessing = false;
    }, 1000);
  }

  // Escuchar clics en enlaces, excluyendo iframes
  document.addEventListener('click', (event) => {
    if (isTikTokBrowser) {
      console.log("Clic ignorado: Navegador de TikTok detectado, permitiendo acción normal");
      return;
    }

    if (event.target.closest('iframe') || event.target.ownerDocument.defaultView !== window) {
      console.log("Clic dentro de iframe o documento secundario ignorado");
      return;
    }

    let target = event.target.closest('a.item, a.dtmain, a.post, a.movie-link, a.series-link, a.menu, a.tab, a[role="button"], a[role="tab"], a');
    if (!target && event.target.tagName === 'IMG') {
      target = event.target.closest('a');
      if (target) {
        console.log("Clic en imagen dentro de enlace detectado:", target);
      }
    }

    if (target && isValidLink(target)) {
      const targetUrl = target.href;
      if (!isSameDomain(targetUrl)) {
        console.log("Clic ignorado, URL fuera del dominio:", targetUrl);
        return;
      }

      if (isImageUrl(targetUrl)) {
        console.log("Clic ignorado, URL es de una imagen:", targetUrl);
        return;
      }

      console.log("Clic detectado en enlace válido:", target);
      handleAdTrigger(event, targetUrl, false);
    } else {
      console.log("Clic ignorado, no es un enlace válido:", event.target);
    }
  }, { capture: true });

  // Escuchar mensajes postMessage desde embed.php
  window.addEventListener('message', function(event) {
    console.log("Mensaje recibido en el sitio principal:", event.data);
    if (event.data.event === 'videoPlay') {
      const videoKey = event.data.videoKey;
      console.log("Procesando evento videoPlay, videoKey:", videoKey);
      if (isTikTokBrowser) {
        console.log("Reproducción directa permitida en TikTok, sin redirección ni anuncio");
        return; // Permitir reproducción directa sin redirección en TikTok
      }
      if (!noAd && !isProcessing && !sessionStorage.getItem("adShown_" + videoKey)) {
        sessionStorage.setItem("adShown_" + videoKey, "true");
        handleAdTrigger(null, currentUrl, true);
      } else {
        console.log("Evento videoPlay ignorado, noAd:", noAd, "isProcessing:", isProcessing, "adShown:", !!sessionStorage.getItem("adShown_" + videoKey));
      }
    }
  });

})();

