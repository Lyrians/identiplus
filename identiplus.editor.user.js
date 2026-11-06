// ==UserScript==
// @name         Identi+ - Biblioteca de imágenes
// @namespace    https://identi.io/
// @version      1.1.0
// @description  Galería local e inserción de imágenes en el editor de Identi.
// @match        https://identi.io/cuenta/publicaciones/nueva*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';
  let openModal = null;
  document.addEventListener('click', event => {
    const target = event.target;
    const button = target instanceof Element && target.closest('button[data-command="image"]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (openModal) openModal();
    else document.addEventListener('DOMContentLoaded', () => openModal && openModal(), { once: true });
  }, true);

  function addClearButton() {
    const draft = [...document.querySelectorAll('button')].find(button => button.textContent.trim().includes('Guardar borrador'));
    if (!draft || draft.parentElement.querySelector('[data-identiplus-clear]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.identiplusClear = 'true';
    button.textContent = 'Limpiar todo';
    button.className = draft.className;
    button.addEventListener('click', () => {
      if (!confirm('¿Querés limpiar todos los campos y el contenido de la publicación?')) return;
      const container = draft.closest('form') || draft.closest('#post-editor');
      if (!container) { alert('No se encontró el formulario de publicación.'); return; }
      container.querySelectorAll('input, textarea, select').forEach(field => {
        if (field.disabled || field.readOnly || (field instanceof HTMLInputElement && ['hidden', 'submit', 'button', 'reset', 'image'].includes(field.type))) return;
        if (field instanceof HTMLInputElement && ['checkbox', 'radio'].includes(field.type)) {
          field.checked = false;
          field.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (field instanceof HTMLSelectElement) {
          field.selectedIndex = 0;
          field.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(prototype, 'value').set.call(field, '');
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      container.querySelectorAll('[contenteditable="true"]').forEach(editor => {
        editor.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editor);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('delete', false);
      });
    });
    draft.before(button);
  }
  function watchEditorActions() {
    addClearButton();
    new MutationObserver(addClearButton).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchEditorActions, { once: true });
  else watchEditorActions();
  function init() {
    if (document.getElementById('identiplus-host')) return;
    const host = document.createElement('div');
    host.id = 'identiplus-host';
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
<style>
* { box-sizing: border-box; }
    .overlay { position: fixed; inset: 0; z-index: 2147483647; min-height: 100vh; display: grid; place-items: center; padding: 24px 60px; background: rgba(0, 7, 20, .55); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
    .modal { position: relative; width: min(576px, 100%); height: min(670px, calc(100vh - 48px)); display: flex; flex-direction: column; padding: 32px; background: #0d1e2e; border: 1px solid #263e52; border-radius: 24px; box-shadow: 0 20px 60px rgba(0, 0, 0, .25); }
    .close { position: absolute; top: 0; left: calc(100% + 12px); width: 36px; height: 36px; display: grid; place-items: center; padding: 0; border: 1px solid #294155; border-radius: 50%; background: transparent; color: #aab9c8; font-size: 22px; line-height: 1; cursor: pointer; }
    .close:hover { color: #fff; border-color: #6e91ad; }
    *:focus-visible { outline: 2px solid #65b2ff; outline-offset: 3px; }
    .heading { text-align: center; padding-bottom: 26px; border-bottom: 1px solid #263e52; }
    .icon { width: 48px; height: 48px; display: grid; place-items: center; margin: 0 auto 16px; border-radius: 8px; color: #69b5ff; background: #0d2b45; }
    h1 { margin: 0; font-size: 24px; line-height: 1.25; }
    .subtitle { margin: 8px 0 0; color: #9eafbf; font-size: 14px; }
    .menu { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 18px 0; border-bottom: 1px solid #263e52; }
    .menu button { border: 0; border-radius: 6px; padding: 10px 12px; color: #aab9c8; background: transparent; font: inherit; font-size: 14px; cursor: pointer; }
    .menu button.active { color: #71baff; background: #102e49; }
    .menu button:disabled { cursor: default; color: #758797; }
    .badge { display: inline-block; margin-left: 5px; color: #8ca1b3; font-size: 10px; }
    .gallery-panel { flex: 1; min-height: 0; display: flex; flex-direction: column; }
    .add-image { width: 100%; margin-top: 16px; padding: 10px 14px; border: 1px solid #096fdb; border-radius: 5px; background: #096fdb; color: white; font: inherit; font-size: 13px; cursor: pointer; }
    .gallery { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-content: start; gap: 12px; padding: 20px 6px 4px 0; scrollbar-color: #37536a transparent; scrollbar-width: thin; }
    .empty, .storage-error { grid-column: 1 / -1; color: #aab9c8; text-align: center; font-size: 14px; }
    .gallery-item { position: relative; min-width: 0; }
    .delete-image { position: absolute; top: 6px; right: 6px; width: 26px; height: 26px; display: grid; place-items: center; padding: 0; border: 1px solid #6a8193; border-radius: 50%; background: rgba(6, 18, 36, .85); color: white; font-size: 18px; line-height: 1; cursor: pointer; }
    .delete-image:hover { background: #bd3942; }
    .select-image { display: block; width: 100%; padding: 0; border: 0; border-radius: 8px; background: transparent; cursor: pointer; }
    .gallery img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; border: 1px solid #263e52; border-radius: 8px; }
    .form-title { margin: 0 0 18px; font-weight: 700; }
    .url-form { padding-top: 22px; overflow-y: auto; color: #e4edf6; }
    .url-form label { display: block; margin-bottom: 7px; font-size: 14px; font-weight: 700; }
    .url-form input, .url-form textarea { display: block; width: 100%; margin-bottom: 16px; padding: 13px 15px; border: 1px solid #30495e; border-radius: 5px; background: transparent; color: #e4edf6; font: inherit; font-size: 14px; }
    .url-form textarea { min-height: 66px; resize: vertical; }
    .url-form input::placeholder, .url-form textarea::placeholder { color: #7f90a0; }
    .url-form .hint { color: #aab9c8; font-size: 12px; line-height: 1.6; }
    .actions { display: flex; justify-content: center; gap: 12px; margin-top: 24px; }
    .actions button { padding: 12px 20px; border: 1px solid #30495e; border-radius: 5px; background: transparent; color: #c5d2de; font: inherit; cursor: pointer; }
    .actions .primary { background: #096fdb; border-color: #096fdb; color: white; }
    [hidden] { display: none !important; }
    @media (max-width: 600px) { .overlay { padding: 24px 48px; } .modal { height: min(670px, calc(100vh - 48px)); padding: 24px 16px; } .menu { gap: 0; flex-wrap: wrap; } .menu button { padding: 10px 8px; } }
</style>
<div class="overlay" id="overlay" hidden>
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="close" type="button" aria-label="Cerrar">&times;</button>
      <header class="heading">
        <div class="icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>
        <h1 id="modal-title">Insertar imágenes</h1>
        <p class="subtitle">Identi+</p>
      </header>
      <nav class="menu" aria-label="Opciones de imágenes">
        <button class="active" type="button" aria-current="page" data-panel="gallery">Galería</button>
        <button type="button" data-panel="url-form">Imagen por URL</button>
        <button type="button" disabled>FrameGrid <span class="badge">Próximamente</span></button>
      </nav>
      <div class="gallery-panel"><button class="add-image" type="button">+ Agregar imagen por URL</button><div class="gallery" aria-label="Galería de imágenes"></div></div>
      <form class="url-form" id="temporary-url" hidden>
        <label for="temporary-image-url">Dirección URL</label>
        <input id="temporary-image-url" type="url" placeholder="https://" required>
        <label for="temporary-image-alt">Descripción alternativa</label>
        <textarea id="temporary-image-alt" placeholder="Describe brevemente la imagen"></textarea>
        <p class="hint">La imagen permanece alojada en el servicio externo. Se insertará en el editor sin guardarse en la galería.</p>
        <p class="storage-error" id="temporary-error" role="alert" hidden></p>
        <div class="actions"><button type="button" class="temporary-cancel">Cancelar</button><button type="submit" class="primary">Insertar</button></div>
      </form>
      <form class="url-form" id="url-form" hidden>
        <p class="form-title">Agregar imagen a la galería</p>
        <label for="image-url">Dirección URL</label>
        <input id="image-url" type="url" placeholder="https://" required>
        <label for="image-alt">Descripción alternativa</label>
        <textarea id="image-alt" placeholder="Describe brevemente la imagen"></textarea>
        <p class="hint">La imagen permanece alojada en el servicio externo. Su URL y descripción se guardan en este navegador.</p>
        <p class="storage-error" role="alert" hidden></p>
        <div class="actions"><button type="button" class="cancel">Cancelar</button><button type="submit" class="primary">Guardar imagen</button></div>
      </form>
    </section>
  </div>
`;
    root.querySelector('.close').addEventListener('click', () => { root.querySelector('#overlay').hidden = true; });
    root.querySelectorAll('.menu button:not(:disabled)').forEach(button => button.addEventListener('click', () => {
      root.querySelectorAll('.menu button').forEach(item => { item.classList.remove('active'); item.removeAttribute('aria-current'); });
      button.classList.add('active');
      button.setAttribute('aria-current', 'page');
      root.querySelector('.gallery-panel').hidden = button.dataset.panel !== 'gallery';
      root.querySelector('#url-form').hidden = true;
      root.querySelector('#temporary-url').hidden = button.dataset.panel !== 'url-form';
    }));
    root.querySelector('.add-image').addEventListener('click', () => {
      root.querySelector('.gallery-panel').hidden = true;
      root.querySelector('#url-form').hidden = false;
      root.querySelector('#image-url').focus();
    });
    function insertImage(url, alt) {
      const editor = document.querySelector('.tiptap.ProseMirror.identi-rich-editor');
      if (!editor) { alert('El editor todavía no está disponible.'); return false; }
      const image = document.createElement('img');
      image.src = url;
      image.alt = alt;
      const clipboard = new DataTransfer();
      clipboard.setData('text/html', image.outerHTML);
      editor.focus();
      editor.dispatchEvent(new ClipboardEvent('paste', { clipboardData: clipboard, bubbles: true, cancelable: true }));
      root.querySelector('#overlay').hidden = true;
      return true;
    }
    const temporaryForm = root.querySelector('#temporary-url');
    const temporaryError = root.querySelector('#temporary-error');
    root.querySelector('.temporary-cancel').addEventListener('click', () => root.querySelector('[data-panel="gallery"]').click());
    temporaryForm.addEventListener('submit', event => {
      event.preventDefault();
      temporaryError.hidden = true;
      const url = root.querySelector('#temporary-image-url').value.trim();
      const alt = root.querySelector('#temporary-image-alt').value.trim();
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('url');
      } catch {
        temporaryError.textContent = 'Ingresá una URL válida que comience con http:// o https://.';
        temporaryError.hidden = false;
        return;
      }
      if (insertImage(url, alt)) temporaryForm.reset();
    });
    const gallery = root.querySelector('.gallery');
    const form = root.querySelector('#url-form');
    const error = root.querySelector('#url-form .storage-error');
    const storageKey = 'identiplus-gallery';
    let images = [];
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved)) images = saved.filter(item => item && typeof item.url === 'string' && typeof item.alt === 'string');
    } catch { error.textContent = 'No se pudo leer la galería guardada.'; error.hidden = false; }
    function renderGallery() {
      gallery.replaceChildren();
      if (!images.length) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Tu galería está vacía. Agregá una imagen con el botón de arriba.';
        gallery.append(empty);
        return;
      }
      images.forEach((item, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'gallery-item';
        const image = document.createElement('img');
        image.src = item.url;
        image.alt = item.alt || 'Imagen guardada';
        const select = document.createElement('button');
        select.type = 'button';
        select.className = 'select-image';
        select.setAttribute('aria-label', 'Insertar ' + (item.alt || 'imagen'));
        select.append(image);
        select.addEventListener('click', () => {
          insertImage(item.url, item.alt);
        });
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'delete-image';
        remove.setAttribute('aria-label', 'Eliminar imagen');
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          const updated = images.filter((_, i) => i !== index);
          try { localStorage.setItem(storageKey, JSON.stringify(updated)); images = updated; renderGallery(); }
          catch { alert('No se pudo eliminar la imagen del almacenamiento local.'); }
        });
        wrapper.append(select, remove);
        gallery.append(wrapper);
      });
    }
    renderGallery();
    root.querySelector('.cancel').addEventListener('click', () => root.querySelector('[data-panel="gallery"]').click());
    form.addEventListener('submit', event => {
      event.preventDefault();
      error.hidden = true;
      const url = root.querySelector('#image-url').value.trim();
      const alt = root.querySelector('#image-alt').value.trim();
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('url');
      } catch { error.textContent = 'Ingresá una URL válida que comience con http:// o https://.'; error.hidden = false; return; }
      const updated = [...images, { url, alt }];
      try { localStorage.setItem(storageKey, JSON.stringify(updated)); }
      catch { error.textContent = 'No se pudo guardar la imagen en este navegador.'; error.hidden = false; return; }
      images = updated;
      renderGallery();
      form.reset();
      root.querySelector('[data-panel="gallery"]').click();
    });
    openModal = () => {
      root.querySelector('#overlay').hidden = false;
      root.querySelector('.close').focus();
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

