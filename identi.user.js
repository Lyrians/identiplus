// ==UserScript==
// @name         Identi Redesign
// @author       LyriansP
// @namespace    https://identi.io/
// @version      1.0.5
// @description  Reorganiza elementos de la portada y las publicaciones
// @match        https://identi.io/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ------------------------------------------------------------
    // PORTADA: TOP PUBLICACIONES Y FOOTER
    // ------------------------------------------------------------

    function reorganizarElementos() {
        // Busca la sección de Top publicaciones.
        const topPosts = document.querySelector('section[data-top-posts]');

        // Busca el aside de destino indicado.
        const asideDestino = document.querySelector(
            'body > main > section.home-canvas > div > div.grid > aside.grid.content-start.gap-3.lg\\:col-start-2.xl\\:col-start-auto'
        );

        // Mueve Top publicaciones al final del aside indicado.
        if (topPosts && asideDestino && topPosts.parentElement !== asideDestino) {
            asideDestino.append(topPosts);
        }

        // Busca el contenido del footer.
        const footerContenido = document.querySelector(
            'footer .overflow-hidden.bg-identi-950.text-white'
        );

        // Busca el aside donde se colocará el contenido del footer.
        const aside = document.querySelector(
            'aside.grid.content-start.gap-4'
        );

        const descripcionTop = topPosts?.querySelector('header p');

        if (descripcionTop?.textContent.trim().toLowerCase() ===
            'los aportes con más puntos en los últimos 7 días') {
            descripcionTop.textContent = 'Últimos 7 días';
        }

        // Mueve el contenido del footer al principio del aside.
        if (footerContenido && aside && aside.firstElementChild !== footerContenido) {
            aside.prepend(footerContenido);
        }
    }

    // Ejecuta la reorganización al cargar la página.
    reorganizarElementos();

    // Vuelve a comprobar los elementos cuando la página cambia.
    const observer = new MutationObserver(reorganizarElementos);

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // ------------------------------------------------------------
    // PUBLICACIÓN: TÍTULO Y CATEGORÍAS
    // ------------------------------------------------------------

    function moverTitulo() {
        const article = document.querySelector('main > article');
        if (!article) return;

        const titulo = article.querySelector('h1');

        // Contenedor al que se moverá el título.
        const contenedor = article.querySelector(
            'div.mx-auto.max-w-4xl > div.rounded-2xl'
        );

        if (!titulo || !contenedor) return;

        // Coloca el título al principio del contenedor.
        if (titulo.parentElement !== contenedor) {
            contenedor.prepend(titulo);
        }
    }

    function moverElementosDebajoDelTitulo() {
        const article = document.querySelector('main > article');
        if (!article) return;

        const headerDiv = article.querySelector(':scope > header > div');
        if (!headerDiv) return;

        // Busca la navegación y las categorías del encabezado.
        const nav = headerDiv.querySelector(':scope > nav.flex');

        const categorias = headerDiv.querySelector(
            ':scope > div.mt-5.flex.flex-wrap.gap-2'
        );

        const titulo = article.querySelector(
            'div.mx-auto.max-w-4xl > div.rounded-2xl > h1'
        );

        if (!titulo || !nav || !categorias) return;

        // Crea un contenedor para agrupar navegación y categorías.
        let wrapper = titulo.parentElement.querySelector(
            ':scope > .categoria-post'
        );

        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'categoria-post';
            titulo.after(wrapper);
        }

        // Mueve los elementos originales al contenedor.
        wrapper.append(nav, categorias);
    }

    moverTitulo();
    moverElementosDebajoDelTitulo();

    // ------------------------------------------------------------
    // PUBLICACIÓN: FECHA Y CONTADORES
    // ------------------------------------------------------------

    function moverFechaDebajoDelTitulo() {
        const article = document.querySelector('main > article');
        if (!article) return;

        const titulo = article.querySelector(
            'div.mx-auto.max-w-4xl > div.rounded-2xl > h1'
        );

        // Busca la fecha en el encabezado original.
        const fecha = article.querySelector(
            'header time[data-local-datetime]'
        );

        const bloqueFecha = fecha?.closest('p');

        // Coloca el párrafo de fecha debajo del título.
        if (titulo && bloqueFecha) {
            titulo.after(bloqueFecha);
        }
    }

    function moverContadoresALaFecha() {
        const article = document.querySelector('main > article');
        if (!article) return;

        // Busca el párrafo que contiene la fecha.
        const parrafoFecha = article
            .querySelector('time[data-local-datetime]')
            ?.closest('p');

        // Busca el contenedor de visitas y comentarios.
        const contenedorOriginal = article
            .querySelector('[data-post-view-count]')
            ?.parentElement
            ?.parentElement;

        if (!parrafoFecha || !contenedorOriginal) return;

        // Evita repetir el movimiento.
        if (parrafoFecha.contains(contenedorOriginal)) return;

        // Crea un span para colocar los contadores dentro del párrafo.
        const contenedorNuevo = document.createElement('span');
        contenedorNuevo.className = contenedorOriginal.className;

        // Mueve los contadores originales sin clonarlos.
        contenedorNuevo.append(...contenedorOriginal.childNodes);
        parrafoFecha.append(contenedorNuevo);

        // Elimina el div original, que quedó vacío.
        contenedorOriginal.remove();
    }

    moverFechaDebajoDelTitulo();
    moverContadoresALaFecha();

    // ------------------------------------------------------------
    // PUBLICACIÓN: SALTOS DE LÍNEA
    // ------------------------------------------------------------

    // Elimina todos los <br> del contenido principal de la publicación.
    // No modifica los saltos de línea de los comentarios.
    document
        .querySelectorAll('.legacy-content[data-protected-post-id] br')
        .forEach(br => br.remove());

    // ------------------------------------------------------------
    // PUBLICACIÓN: SECCIÓN DE COMENTARIOS
    // ------------------------------------------------------------

    // Busca el contenedor principal del cuerpo de la publicación.
    const destino = document.querySelector(
        'body > main > article > div.mx-auto.max-w-4xl.px-4.py-10.sm\\:px-6.lg\\:px-8'
    );

    // Busca la sección completa de comentarios y su compositor.
    const comentarios = document.querySelector('#comentarios');

    // Mueve la sección al final del contenedor.
    if (destino && comentarios) {
        destino.append(comentarios);
    }
})();
