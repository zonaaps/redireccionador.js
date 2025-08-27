(function() {
  const clickAdUrl = "https://otieu.com/4/9467773"; // Anuncio para clics en la página principal JEF-2.8 (Monetag)
  const embedAdUrl = "https://yawnfreakishnotably.com/x5au88i2?key=b204c2328553c7815136f462216fa2ab"; // Anuncio para iframes ocultos (Adsterra)
  const currentUrl = window.location.href;
  const domain = window.location.origin;
  const adInterval = 300000; // 5 minutos para clics
  const iframeInterval = 180000; // 3 minutos para iframes ocultos
  const maxPageLoads = 5; // Máximo de cargas antes de restablecer
  const storageCleanupInterval = 3600000; // 1 hora para limpiar sessionStorage
  const maxIframes = 5; // Máximo de iframes ocultos por tanda

  // Detectar navegador de TikTok, Safari y VIP (anteriormente AppCreator24)
  const userAgent = navigator.userAgent;
  const isTikTokBrowser = /TikTok|Bytedance|ByteDance|bytedance/i.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome|Chromium|Edge/.test(userAgent);
  const urlParams = new URLSearchParams(window.location.search);
  const isVipParam = urlParams.get('vip') === '1';

  // Establecer o verificar la bandera vipWebView en sessionStorage
  if (isVipParam && !sessionStorage.getItem('vipWebView')) {
    sessionStorage.setItem('vipWebView', 'true');
    console.log("VIP detectado en la URL, desactivando anuncios para esta sesión");
  }
  const isVipWebView = sessionStorage.getItem('vipWebView') === 'true' || isVipParam;
  
  console.log("Navegador de TikTok detectado:", isTikTokBrowser, 
              "Es Safari:", isSafari, 
              "Es VIP (parámetro):", isVipParam, 
              "Es VIP (bandera):", isVipWebView, 
              "User-Agent:", userAgent);

  // Bandera para verificar interacción del usuario
  let hasUserInteraction = false;

  // Crear iframes ocultos cada 3 minutos
  function createMonetizationIframes() {
    if (isTikTokBrowser || isSafari || isVipWebView) {
      console.log("No se crean iframes: Navegador de TikTok, Safari o VIP detectado");
      return;
    }

    console.log("Creando iframes de monetización");
    // Eliminar iframes existentes para evitar acumulación
    document.querySelectorAll('[id^="monetization-iframe-"]').forEach(iframe => iframe.remove());

    for (let i = 0; i < maxIframes; i++) {
      try {
        const iframe = document.createElement('iframe');
        iframe.src = embedAdUrl;
        iframe.style.display = 'none';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        iframe.id = `monetization-iframe-${i}`;
        iframe.title = `Monetization Iframe ${i}`;
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        iframe.onerror = () => console.error(`Error cargando iframe ${i}: ${embedAdUrl}`);
        iframe.onload = () => console.log(`Iframe ${i} cargado exitosamente: ${embedAdUrl}`);
        document.body.appendChild(iframe);
        console.log(`Iframe oculto ${i} creado con URL: ${embedAdUrl}`);
      } catch (e) {
        console.error(`Error creando iframe ${i}:`, e);
      }
    }
  }

  // Iniciar creación periódica de iframes tras interacción
  function startIframeCreation() {
    if (!hasUserInteraction) {
      hasUserInteraction = true;
      createMonetizationIframes();
      setInterval(createMonetizationIframes, iframeInterval);
      console.log("Iniciado ciclo de creación de iframes cada 3 minutos");
    }
  }

  // Generar una clave única para la página (basada en la URL)
  const pageKey = btoa(currentUrl);
  let pageLoads = parseInt(sessionStorage.getItem('pageLoads_' + pageKey) || '0', 10);
  pageLoads += 1;
  sessionStorage.setItem('pageLoads_' + pageKey, pageLoads);
  console.log("Carga de página #", pageLoads, "para pageKey:", pageKey);

  // Verificar parámetros y estado de noAd
  const noAdParam = urlParams.get('noAd') === '1';
  const isNoAdValid = sessionStorage.getItem('noAdValid') === 'true';
  const noAd = noAdParam && isNoAdValid && pageLoads <= maxPageLoads;
  console.log("Sitio cargado, noAd:", noAd, "noAdParam:", noAdParam, "isNoAdValid:", isNoAdValid, "pageLoads:", pageLoads, "URL:", currentUrl);

  // Restablecer pageLoads si se superan las 5 cargas
  if (pageLoads > maxPageLoads) {
    console.log("Restableciendo pageLoads y limpiando noAd para pageKey:", pageKey);
    sessionStorage.setItem('pageLoads_' + pageKey, '0');
    sessionStorage.removeItem('noAdValid');
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('adShown_')) {
        sessionStorage.removeItem(key);
      }
    });
  }

  // Limpieza periódica de sessionStorage (incluyendo vipWebView)
  const lastCleanupTime = parseInt(localStorage.getItem('lastCleanupTime') || '0', 10);
  if (Date.now() - lastCleanupTime > storageCleanupInterval) {
    console.log("Limpiando sessionStorage completamente");
    sessionStorage.clear();
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
    if (isVipWebView) {
      console.log("Anuncio ignorado: VIP detectado");
      return;
    }
    if (!isProcessing && (isFromEmbed ? !noAd : Date.now() - lastAdTime >= adInterval)) {
      isProcessing = true;
      if (!isFromEmbed) {
        lastAdTime = Date.now();
        sessionStorage.setItem('lastAdTime', lastAdTime.toString());
      }
      console.log("Procesando evento, disparando anuncio, isFromEmbed:", isFromEmbed);

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
        newWindow.blur();
        window.focus();
        console.log("Nueva pestaña abierta con:", newTabUrl);
      } else {
        console.error("Fallo al abrir nueva pestaña");
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
      console.log("Evento ignorado, isProcessing:", isProcessing, 
                  "Tiempo desde último anuncio:", Date.now() - lastAdTime, 
                  "noAd:", noAd);
    }

    // Resetear isProcessing después de un tiempo
    setTimeout(() => {
      isProcessing = false;
    }, 1000);
  }

  // Escuchar clics en enlaces, excluyendo iframes
  document.addEventListener('click', (event) => {
    if (isTikTokBrowser || isVipWebView) {
      console.log("Clic ignorado: Navegador de TikTok o VIP detectado, permitiendo acción normal");
      return;
    }

    // Registrar interacción del usuario para iniciar iframes
    startIframeCreation();

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

  // Escuchar mensajes postMessage desde el reproductor
  window.addEventListener('message', function(event) {
    console.log("Mensaje recibido en el sitio principal:", event.data);
    if (event.data.event === 'videoPlay') {
      const videoKey = event.data.videoKey;
      console.log("Procesando evento videoPlay, videoKey:", videoKey);
      if (isTikTokBrowser || isVipWebView) {
        console.log("Reproducción directa permitida en TikTok o VIP, sin redirección ni anuncio");
        return;
      }
      if (!noAd && !isProcessing && !sessionStorage.getItem("adShown_" + videoKey)) {
        sessionStorage.setItem("adShown_" + videoKey, "true");
        sessionStorage.setItem('noAdValid', 'true');
        handleAdTrigger(null, currentUrl, true);
      } else {
        console.log("Evento videoPlay ignorado, noAd:", noAd, 
                    "isProcessing:", isProcessing, 
                    "adShown:", !!sessionStorage.getItem("adShown_" + videoKey));
      }
    }
  });

})();
