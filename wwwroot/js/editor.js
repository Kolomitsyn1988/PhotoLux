/* Photo Lux — редактор фото с живым WebGL-предпросмотром.
   Математика коррекции идентична ImageProcessingService.cs (серверный экспорт):
   при изменении формул синхронно менять обе реализации. */
(() => {
    'use strict';

    // ---------- локализация ----------
    let lang = localStorage.getItem('photolux-lang') || 'ru';

    const I18N = {
        ru: {
            'btn.open': 'Открыть фото', 'btn.compare': 'Сравнить', 'btn.undo': '↩ Отменить',
            'btn.reset': 'Сбросить', 'btn.clear': 'Очистить', 'btn.download': 'Скачать',
            'btn.fit': 'Вписать',
            'title.compare': 'Удерживайте, чтобы увидеть оригинал',
            'title.undo': 'Отменить последнюю правку (Ctrl+Z)',
            'title.reset': 'Вернуть все ползунки в ноль',
            'title.clear': 'Убрать все фото из галереи',
            'title.theme': 'Переключить тему',
            'title.rotateLeft': 'Повернуть против часовой стрелки',
            'title.rotateRight': 'Повернуть по часовой стрелке',
            'title.zoomOut': 'Уменьшить', 'title.zoomIn': 'Увеличить',
            'title.fit': 'Вписать в окно',
            'empty.title': 'Перетащите фото сюда',
            'empty.p1': 'или нажмите здесь, чтобы выбрать, или вставьте изображение из буфера обмена (Ctrl+V)',
            'empty.p2': 'Поддерживаются JPEG, PNG, WebP, BMP, GIF · до 40 МБ · можно выбрать сразу несколько',
            'empty.hint': 'Нажмите, чтобы выбрать фотографии',
            'export.format': 'Формат', 'export.quality': 'Качество', 'export.size': 'Размер, px',
            'export.result': 'Скачать результат',
            'export.gallery': '🗂 Сохранить галерею (ZIP)',
            'export.galleryTitle': 'Сохранить все фото галереи с их настройками одним ZIP-архивом',
            'export.note': 'Ползунки применяются к полноразмерному оригиналу на сервере.',
            'ph.width': 'ширина', 'ph.height': 'высота',
            'curve.reset': 'Сбросить канал', 'curve.resetTitle': 'Сбросить кривую выбранного канала',
            'label.dblReset': 'Двойной клик — сбросить',
            'pencil.title': 'Фото изменено',
            'thumb.remove': 'Убрать из галереи',
            'modal.cancel': 'Отмена', 'modal.ok': 'Очистить',
            'modal.clearTitle': 'Убрать все фото?',
            'modal.clearText': 'Все загруженные фотографии и их настройки будут удалены из галереи. Это действие нельзя отменить.',
            'toast.cleared': 'Галерея очищена',
            'toast.saved': 'Файл сохранён: {name}',
            'toast.archive': 'Архив сохранён: {n} фото',
            'toast.exportError': 'Ошибка экспорта: {m}',
            'toast.openFail': 'Не удалось открыть фото: {m}',
            'toast.imgFail': 'Не удалось загрузить изображение с сервера',
            'toast.formats': 'Поддерживаются JPEG, PNG, WebP, BMP, GIF',
            'toast.loadFail': 'Не удалось загрузить фото из буфера обмена',
            'busy.processing': 'Обработка…', 'busy.uploading': 'Загрузка…',
            'busy.uploadingN': 'Загрузка {i} из {n}…',
            'busy.export': 'Готовим файл…', 'busy.archive': 'Готовим архив ({n})…',
            'busy.import': 'Загрузка…',
            'info.preview': 'предпросмотр',
            'preset.basic': 'Базовые', 'preset.instagram': 'Instagram', 'preset.lightroom': 'Lightroom',
            'num.range': '{label}: от {min} до {max}',
            'err.loadImage': 'Не удалось загрузить изображение с сервера',
            'err.noImage': 'Файл не передан.'
        },
        en: {
            'btn.open': 'Open photo', 'btn.compare': 'Compare', 'btn.undo': '↩ Undo',
            'btn.reset': 'Reset', 'btn.clear': 'Clear', 'btn.download': 'Download',
            'btn.fit': 'Fit',
            'title.compare': 'Hold to see the original',
            'title.undo': 'Undo the last edit (Ctrl+Z)',
            'title.reset': 'Reset all sliders to zero',
            'title.clear': 'Remove all photos from the gallery',
            'title.theme': 'Toggle theme',
            'title.rotateLeft': 'Rotate counterclockwise',
            'title.rotateRight': 'Rotate clockwise',
            'title.zoomOut': 'Zoom out', 'title.zoomIn': 'Zoom in',
            'title.fit': 'Fit to window',
            'empty.title': 'Drop photos here',
            'empty.p1': 'or click here to choose files, or paste an image from the clipboard (Ctrl+V)',
            'empty.p2': 'JPEG, PNG, WebP, BMP, GIF supported · up to 40 MB · multiple files allowed',
            'empty.hint': 'Click to choose photos',
            'export.format': 'Format', 'export.quality': 'Quality', 'export.size': 'Size, px',
            'export.result': 'Download result',
            'export.gallery': '🗂 Save gallery (ZIP)',
            'export.galleryTitle': 'Save all gallery photos with their settings as one ZIP archive',
            'export.note': 'Adjustments are applied to the full-size original on the server.',
            'ph.width': 'width', 'ph.height': 'height',
            'curve.reset': 'Reset channel', 'curve.resetTitle': 'Reset the selected channel curve',
            'label.dblReset': 'Double-click to reset',
            'pencil.title': 'Edited',
            'thumb.remove': 'Remove from gallery',
            'modal.cancel': 'Cancel', 'modal.ok': 'Clear',
            'modal.clearTitle': 'Remove all photos?',
            'modal.clearText': 'All uploaded photos and their settings will be removed from the gallery. This cannot be undone.',
            'toast.cleared': 'Gallery cleared',
            'toast.saved': 'File saved: {name}',
            'toast.archive': 'Archive saved: {n} photos',
            'toast.exportError': 'Export error: {m}',
            'toast.openFail': 'Failed to open photo: {m}',
            'toast.imgFail': 'Failed to load the image from the server',
            'toast.formats': 'JPEG, PNG, WebP, BMP, GIF supported',
            'toast.loadFail': 'Failed to load photo from clipboard',
            'busy.processing': 'Processing…', 'busy.uploading': 'Uploading…',
            'busy.uploadingN': 'Uploading {i} of {n}…',
            'busy.export': 'Preparing file…', 'busy.archive': 'Preparing archive ({n})…',
            'busy.import': 'Loading…',
            'info.preview': 'preview',
            'preset.basic': 'Basic', 'preset.instagram': 'Instagram', 'preset.lightroom': 'Lightroom',
            'num.range': '{label}: from {min} to {max}',
            'err.loadImage': 'Failed to load the image from the server',
            'err.noImage': 'No file provided.'
        }
    };

    function t(key, params) {
        let s = (I18N[lang] && I18N[lang][key]) ?? I18N.ru[key] ?? key;
        if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
        return s;
    }

    function applyLang() {
        document.documentElement.lang = lang;
        localStorage.setItem('photolux-lang', lang);
        document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
        document.querySelectorAll('[data-i18n-title]').forEach(el => el.title = t(el.dataset.i18nTitle));
        document.querySelectorAll('[data-i18n-ph]').forEach(el => el.placeholder = t(el.dataset.i18nPh));
        for (const b of el.langSwitch.querySelectorAll('button'))
            b.classList.toggle('active', b.dataset.lang === lang);
        rebuildDynamicPanels();
    }

    // пересборка языко-зависимых панелей (значения настроек сохраняются)
    function rebuildDynamicPanels() {
        el.groups.innerHTML = '';
        el.presets.innerHTML = '';
        presetThumbs.length = 0;
        for (const k in inputsByKey) delete inputsByKey[k];
        buildPanel();
        buildPresets();
        syncInputs();
        renderPresetThumbs();
    }

    // ---------- состояние ----------
    const IDENTITY_CURVE = [[0, 0], [1, 1]];
    const DEFAULTS = {
        exposure: 0, brightness: 0, contrast: 0, gamma: 1,
        temperature: 0, hue: 0, saturation: 0, vibrance: 0,
        sharpen: 0, blur: 0,
        skin: 0, glow: 0,
        vignette: 0, grayscale: 0, sepia: 0, blue: 0,
        bwRed: 0, bwGreen: 0, bwBlue: 0,
        curves: {
            master: IDENTITY_CURVE.map(p => [...p]),
            r: IDENTITY_CURVE.map(p => [...p]),
            g: IDENTITY_CURVE.map(p => [...p]),
            b: IDENTITY_CURVE.map(p => [...p])
        }
    };

    function cloneCurves(c) {
        return {
            master: (c?.master || IDENTITY_CURVE).map(p => [...p]),
            r: (c?.r || IDENTITY_CURVE).map(p => [...p]),
            g: (c?.g || IDENTITY_CURVE).map(p => [...p]),
            b: (c?.b || IDENTITY_CURVE).map(p => [...p])
        };
    }

    // все присвоения settings идут через клон: кривые — вложенные объекты
    function cloneSettings(s) {
        const t = { ...s };
        t.curves = cloneCurves(s.curves);
        return t;
    }

    function isCurvesIdentityPoints(c) {
        if (!c) return true;
        return ['master', 'r', 'g', 'b'].every(ch => {
            const pts = c[ch];
            return pts.length === 2 &&
                pts[0][0] === 0 && pts[0][1] === 0 &&
                pts[1][0] === 1 && pts[1][1] === 1;
        });
    }

    // монотонный кубический сплайн (Fritsch–Carlson) → LUT 256 значений
    function computeLut(points) {
        const pts = [...points].sort((a, b) => a[0] - b[0]);
        const n = pts.length;
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        if (n < 2) { const l = new Uint8Array(256); for (let i = 0; i < 256; i++) l[i] = i; return l; }
        const d = new Array(n - 1);
        for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / Math.max(1e-6, xs[i + 1] - xs[i]);
        const m = new Array(n);
        m[0] = d[0]; m[n - 1] = d[n - 2];
        for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
        for (let i = 0; i < n - 1; i++) {
            if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
            const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
            if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
        }
        const lut = new Uint8Array(256);
        let seg = 0;
        for (let i = 0; i < 256; i++) {
            const x = i / 255;
            while (seg < n - 2 && x > xs[seg + 1]) seg++;
            const h = Math.max(1e-6, xs[seg + 1] - xs[seg]);
            const t = Math.min(1, Math.max(0, (x - xs[seg]) / h));
            const t2 = t * t, t3 = t2 * t;
            const y = (2 * t3 - 3 * t2 + 1) * ys[seg] + (t3 - 2 * t2 + t) * h * m[seg] +
                      (-2 * t3 + 3 * t2) * ys[seg + 1] + (t3 - t2) * h * m[seg + 1];
            lut[i] = Math.max(0, Math.min(255, Math.round(y * 255)));
        }
        return lut;
    }

    function buildLuts(curves) {
        const m = computeLut(curves.master), r = computeLut(curves.r),
              g = computeLut(curves.g), b = computeLut(curves.b);
        const md = new Uint8Array(256 * 4), cd = new Uint8Array(256 * 4);
        for (let i = 0; i < 256; i++) {
            md[i * 4] = m[i]; md[i * 4 + 1] = m[i]; md[i * 4 + 2] = m[i]; md[i * 4 + 3] = 255;
            cd[i * 4] = r[i]; cd[i * 4 + 1] = g[i]; cd[i * 4 + 2] = b[i]; cd[i * 4 + 3] = 255;
        }
        return { md, cd };
    }

    let settings = cloneSettings(DEFAULTS);
    let items = [];            // загруженные фото: { id, name, width, height, ext, url, settings }
    let activeIndex = -1;
    let image = null;          // активный элемент items
    let texW = 0, texH = 0;    // размер текстуры предпросмотра
    let compare = false;       // удержание кнопки «Сравнить»
    let uploading = false;

    const MAX_TEXTURE_DIM = 2048;

    const GROUPS = [
        { id: 'light',   title: 'Свет и тон', titleEn: 'Light' },
        { id: 'color',   title: 'Цвет', titleEn: 'Color' },
        { id: 'face',    title: 'Портрет', titleEn: 'Portrait' },
        { id: 'detail',  title: 'Детализация', titleEn: 'Detail' },
        { id: 'effects', title: 'Эффекты', titleEn: 'Effects' },
        { id: 'bw',      title: 'Ч/Б микс', titleEn: 'B&W mix' }
    ];

    const SLIDERS = [
        { key: 'exposure',    group: 'light',   label: 'Экспозиция',   labelEn: 'Exposure',      min: -3,   max: 3,   step: 0.01 },
        { key: 'brightness',  group: 'light',   label: 'Яркость',      labelEn: 'Brightness',    min: -100, max: 100, step: 1 },
        { key: 'contrast',    group: 'light',   label: 'Контраст',     labelEn: 'Contrast',      min: -100, max: 100, step: 1 },
        { key: 'gamma',       group: 'light',   label: 'Гамма',        labelEn: 'Gamma',         min: 0.2,  max: 2.2, step: 0.01 },
        { key: 'temperature', group: 'color',   label: 'Температура',  labelEn: 'Temperature',   min: -100, max: 100, step: 1 },
        { key: 'hue',         group: 'color',   label: 'Оттенок',      labelEn: 'Hue',           min: -180, max: 180, step: 1 },
        { key: 'saturation',  group: 'color',   label: 'Насыщенность', labelEn: 'Saturation',    min: -100, max: 100, step: 1 },
        { key: 'vibrance',    group: 'color',   label: 'Красочность',  labelEn: 'Vibrance',      min: -100, max: 100, step: 1 },
        { key: 'skin',        group: 'face',    label: 'Смягчение кожи', labelEn: 'Skin smoothing', min: 0, max: 100, step: 1 },
        { key: 'glow',        group: 'face',    label: 'Сияние',       labelEn: 'Glow',          min: 0,    max: 100, step: 1 },
        { key: 'sharpen',     group: 'detail',  label: 'Резкость',     labelEn: 'Sharpen',       min: 0,    max: 100, step: 1 },
        { key: 'blur',        group: 'detail',  label: 'Размытие',     labelEn: 'Blur',          min: 0,    max: 10,  step: 0.1 },
        { key: 'vignette',    group: 'effects', label: 'Виньетка',     labelEn: 'Vignette',      min: 0,    max: 100, step: 1 },
        { key: 'grayscale',   group: 'bw',      label: 'Обесцвечивание', labelEn: 'Desaturate',  min: 0,    max: 100, step: 1 },
        { key: 'bwRed',       group: 'bw',      label: 'Красные',      labelEn: 'Reds',          min: -100, max: 100, step: 1 },
        { key: 'bwGreen',     group: 'bw',      label: 'Зелёные',      labelEn: 'Greens',        min: -100, max: 100, step: 1 },
        { key: 'bwBlue',      group: 'bw',      label: 'Синие',        labelEn: 'Blues',         min: -100, max: 100, step: 1 },
        { key: 'sepia',       group: 'effects', label: 'Сепия',        labelEn: 'Sepia',         min: 0,    max: 100, step: 1 },
        { key: 'blue',        group: 'effects', label: 'Синий оттенок', labelEn: 'Blue tint',    min: 0,    max: 100, step: 1 }
    ];

    const PRESETS = [
        // --- базовые ---
        { group: 'basic', name: 'Оригинал', nameEn: 'Original',        values: {} },
        { group: 'basic', name: 'Тёплый вечер', nameEn: 'Warm evening',    values: { exposure: 0.15, temperature: 35, vibrance: 20, vignette: 25, saturation: 5 } },
        { group: 'basic', name: 'Холодный рассвет', nameEn: 'Cold dawn',values: { exposure: 0.1, temperature: -30, contrast: 10, saturation: -5 } },
        { group: 'basic', name: 'Нуар', nameEn: 'Noir',            values: { grayscale: 100, contrast: 25, vignette: 40, sharpen: 15 } },
        { group: 'basic', name: 'Вивиант', nameEn: 'Vivid',         values: { exposure: 0.1, vibrance: 45, saturation: 10, contrast: 8, sharpen: 10 } },
        { group: 'basic', name: 'Мягкий фокус', nameEn: 'Soft focus',    values: { blur: 1.2, brightness: 4, saturation: 8, vignette: 20 } },

        // --- в духе Instagram ---
        { group: 'instagram', name: 'Clarendon',  values: { exposure: 0.12, contrast: 22, saturation: 25, sharpen: 10 } },
        { group: 'instagram', name: 'Gingham',    values: { contrast: -15, brightness: 6, saturation: -18, sepia: 18, vignette: 15 } },
        { group: 'instagram', name: 'Moon',       values: { grayscale: 100, contrast: 18, brightness: 5, sharpen: 12 } },
        { group: 'instagram', name: 'Lark',       values: { exposure: 0.22, vibrance: 30, temperature: 12, saturation: 6 } },
        { group: 'instagram', name: 'Reyes',      values: { exposure: 0.1, contrast: -20, brightness: 8, saturation: -25, sepia: 22 } },
        { group: 'instagram', name: 'Juno',       values: { contrast: 12, saturation: 28, temperature: 10, sharpen: 15 } },
        { group: 'instagram', name: 'Ludwig',     values: { contrast: 15, saturation: 15, temperature: -12, sharpen: 10 } },
        { group: 'instagram', name: 'Aden',       values: { brightness: 8, contrast: -10, saturation: -30, temperature: -20 } },
        { group: 'instagram', name: 'Slumber',    values: { contrast: -12, brightness: 6, saturation: -22, sepia: 15, vignette: 12 } },
        { group: 'instagram', name: 'Crema',      values: { saturation: -18, contrast: -8, sepia: 12, gamma: 1.05, vignette: 10 } },
        { group: 'instagram', name: 'Perpetua',   values: { contrast: 10, saturation: 12, temperature: -10, blue: 15 } },
        { group: 'instagram', name: 'Amaro',      values: { exposure: 0.1, contrast: 8, saturation: 10, glow: 25, vignette: 15 } },
        { group: 'instagram', name: 'Hudson',     values: { contrast: 18, temperature: -20, blue: 20, vignette: 25 } },
        { group: 'instagram', name: 'Valencia',   values: { exposure: 0.12, saturation: 12, sepia: 18, contrast: -5, vignette: 10 } },
        { group: 'instagram', name: 'Nashville',  values: { contrast: 10, sepia: 20, temperature: 10, brightness: 5, vignette: 12 } },
        { group: 'instagram', name: '1977',       values: { contrast: 12, saturation: 20, temperature: 15, exposure: 0.05, vignette: 15 } },
        { group: 'instagram', name: 'Lo-Fi',      values: { contrast: 25, saturation: 35, vignette: 30, sharpen: 12 } },
        { group: 'instagram', name: 'Willow',     values: { grayscale: 90, brightness: 8, contrast: -8, sepia: 10, vignette: 20 } },

        // --- в духе Lightroom ---
        { group: 'lightroom', name: 'Контраст', nameEn: 'Contrast',      values: { contrast: 30, vibrance: 25, sharpen: 20 } },
        { group: 'lightroom', name: 'Матовый', nameEn: 'Matte',       values: { contrast: -18, brightness: 6, saturation: -18, gamma: 1.08, vignette: 18 } },
        { group: 'lightroom', name: 'Кино', nameEn: 'Cinematic',          values: { temperature: 25, contrast: 20, saturation: 8, vignette: 25, sharpen: 10 } },
        { group: 'lightroom', name: 'Драма', nameEn: 'Drama',         values: { contrast: 40, sharpen: 25, vignette: 35, saturation: -10 } },
        { group: 'lightroom', name: 'Плёнка', nameEn: 'Film',        values: { contrast: 12, saturation: -8, sepia: 12, gamma: 1.05, vignette: 20 } },
        { group: 'lightroom', name: 'Холод', nameEn: 'Cold',         values: { blue: 40, contrast: 10 } },
        { group: 'lightroom', name: 'Золотой час', nameEn: 'Golden hour',   values: { exposure: 0.15, temperature: 40, vibrance: 20, vignette: 18, glow: 20 } },
        { group: 'lightroom', name: 'Муди', nameEn: 'Moody',          values: { exposure: -0.15, contrast: 18, saturation: -20, temperature: -15, vignette: 30 } },
        { group: 'lightroom', name: 'Вельвия', nameEn: 'Velvia',       values: { saturation: 40, contrast: 20, vibrance: 15, sharpen: 15 } },
        { group: 'lightroom', name: 'Блейкаут', nameEn: 'Bleach',      values: { saturation: -55, contrast: 25, brightness: 8, sharpen: 10 } },
        { group: 'lightroom', name: 'Кросс-процесс', nameEn: 'Cross process', values: { temperature: -15, hue: 15, contrast: 15, saturation: 10, blue: 12 } },
        { group: 'lightroom', name: 'Ч/Б Контраст', nameEn: 'B&W Contrast',  values: { grayscale: 100, contrast: 30, bwRed: 30, bwBlue: -40 } },
        { group: 'lightroom', name: 'Портрет', nameEn: 'Portrait',       values: { skin: 45, glow: 15, exposure: 0.08, vibrance: 10 } }
    ];

    const $ = id => document.getElementById(id);
    const el = {
        open: $('btnOpen'), compare: $('btnCompare'), reset: $('btnReset'), download: $('btnDownload'),
        undo: $('btnUndo'), clear: $('btnClear'), theme: $('btnTheme'),
        exportGallery: $('btnExportGallery'),
        rotateLeft: $('rotateLeft'), rotateRight: $('rotateRight'),
        modal: $('modal'), modalTitle: $('modalTitle'), modalText: $('modalText'),
        modalOk: $('modalOk'), modalCancel: $('modalCancel'),
        fileInput: $('fileInput'), empty: $('emptyState'), canvas: $('glcanvas'), stage: $('stage'),
        canvasWrap: $('canvasWrap'), canvasBar: $('canvasBar'),
        zoomIn: $('zoomIn'), zoomOut: $('zoomOut'), zoomFit: $('zoomFit'), zoomLabel: $('zoomLabel'),
        info: $('stageInfo'), glError: $('glError'), presets: $('presets'), groups: $('sliderGroups'),
        busy: $('busy'), busyText: $('busyText'), toasts: $('toasts'), gallery: $('gallery'),
        formatSeg: $('formatSeg'), qualityRow: $('qualityRow'), qualityRange: $('qualityRange'),
        qualityNum: $('qualityNum'), maxWidth: $('maxWidth'), maxHeight: $('maxHeight'),
        btnExport: $('btnExport'), histogram: $('histogram'),
        curveEditor: $('curveEditor'), curvesChannels: $('curvesChannels'), btnResetCurve: $('btnResetCurve'),
        langSwitch: $('langSwitch')
    };

    // ---------- зум предпросмотра (100% = вписано в окно) ----------
    let zoom = 1;
    const ZOOM_MIN = 0.25, ZOOM_MAX = 5, ZOOM_STEP = 1.25;

    function applyZoom(value, forceFit = false) {
        zoom = forceFit ? 1 : Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
        const out = outDims();
        if (zoom === 1) {
            el.canvas.style.maxWidth = '';
            el.canvas.style.maxHeight = '';
            el.canvas.style.width = '';
            el.canvas.style.height = '';
        } else {
            el.canvas.style.maxWidth = 'none';
            el.canvas.style.maxHeight = 'none';
            el.canvas.style.width = Math.round(out.w * zoom) + 'px';
            el.canvas.style.height = Math.round(out.h * zoom) + 'px';
        }
        el.zoomLabel.textContent = Math.round(zoom * 100) + '%';
    }

    // ---------- история правок (на каждое фото своя) ----------
    const HISTORY_LIMIT = 50;

    function pushHistory(snapshot) {
        const item = items[activeIndex];
        if (!item) return;
        (item.history ||= []).push(cloneSettings(snapshot || settings));
        if (item.history.length > HISTORY_LIMIT) item.history.shift();
        updateUndoBtn();
    }

    function undo() {
        const item = items[activeIndex];
        if (!item || !item.history || !item.history.length) return;
        settings = cloneSettings(item.history.pop());
        item.settings = cloneSettings(settings);
        syncInputs();
        requestRender();
        refreshPencil(item, settings);
        scheduleThumbUpdate();
        updateUndoBtn();
    }

    function updateUndoBtn() {
        const item = items[activeIndex];
        el.undo.disabled = !item || !item.history || item.history.length === 0;
    }

    // ---------- признаки и превью правок в галерее ----------
    function isEdited(s) {
        if (Object.keys(DEFAULTS).some(k => k !== 'curves' && s[k] !== DEFAULTS[k])) return true;
        return !isCurvesIdentityPoints(s.curves);
    }

    function refreshPencil(item, liveSettings) {
        if (!item || !item.pencil) return;
        item.pencil.hidden = !isEdited(liveSettings || item.settings || {});
    }

    // миниатюра активного фото перерисовывается с правками (с задержкой на время драга)
    let thumbTimer = null;
    function scheduleThumbUpdate() {
        if (thumbTimer) clearTimeout(thumbTimer);
        thumbTimer = setTimeout(() => {
            thumbTimer = null;
            if (!sourceCanvas || !thumbRenderer || activeIndex < 0) return;
            const item = items[activeIndex];
            if (!item || !item.thumbCanvas) return;
            thumbRenderer.setImage(sourceCanvas, 256, 256);
            const rendered = thumbRenderer.render(normalizedSettings(settings), bwWeights(settings), rotation);
            if (!rendered) return;
            const ctx = item.thumbCanvas.getContext('2d');
            ctx.clearRect(0, 0, item.thumbCanvas.width, item.thumbCanvas.height);
            ctx.drawImage(rendered, 0, 0, item.thumbCanvas.width, item.thumbCanvas.height);
            refreshPencil(item, settings);
        }, 350);
    }

    let exportFormat = 'jpeg';

    // ---------- тосты / busy ----------
    function toast(message, isError = false) {
        const t = document.createElement('div');
        t.className = 'toast' + (isError ? ' error' : '');
        t.textContent = message;
        el.toasts.appendChild(t);
        setTimeout(() => t.remove(), 4500);
    }

    function busy(on, text) {
        el.busyText.textContent = text || t('busy.processing');
        el.busy.hidden = !on;
    }

    async function parseError(resp) {
        try {
            const data = await resp.json();
            return data.error || data.detail || ('HTTP ' + resp.status);
        } catch {
            return 'HTTP ' + resp.status;
        }
    }

    // ---------- WebGL ----------
    const gl = el.canvas.getContext('webgl', {
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        antialias: false
    });
    if (!gl) {
        el.glError.hidden = false;
    }

    const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

    // Горизонтальный/вертикальный проход гауссова размытия
    // (классическая линейная выборка; сумма весов = 1).
    const FRAG_BLUR = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_dir;
void main() {
    vec4 c = texture2D(u_tex, v_uv) * 0.2270270270;
    vec2 o1 = u_dir * 1.3846153846;
    vec2 o2 = u_dir * 3.2307692308;
    c += (texture2D(u_tex, v_uv + o1) + texture2D(u_tex, v_uv - o1)) * 0.3162162162;
    c += (texture2D(u_tex, v_uv + o2) + texture2D(u_tex, v_uv - o2)) * 0.0702702703;
    gl_FragColor = c;
}`;

    // Резкость + портретные эффекты (мягкое размытие из u_soft) + вся цветовая
    // коррекция + поворот (u_rot) + виньетка. Формулы совпадают с ImageProcessingService.
    const FRAG_COLOR = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform sampler2D u_soft;
uniform sampler2D u_lutM;
uniform sampler2D u_lutC;
uniform vec2 u_texel;
uniform float u_exposure, u_temperature, u_gamma, u_brightness, u_contrast;
uniform float u_saturation, u_vibrance, u_hue, u_sharpen;
uniform float u_grayscale, u_sepia, u_blue, u_vignette;
uniform float u_skin, u_glow, u_bwR, u_bwG, u_bwB;
uniform float u_rot;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

vec3 hueRotate(vec3 c) {
    float cosA = cos(radians(u_hue));
    float sinA = sin(radians(u_hue));
    float r = c.r, g = c.g, b = c.b;
    return vec3(
        (0.213 + cosA*0.787 - sinA*0.213)*r + (0.715 - cosA*0.715 - sinA*0.715)*g + (0.072 - cosA*0.072 + sinA*0.928)*b,
        (0.213 - cosA*0.213 + sinA*0.143)*r + (0.715 + cosA*0.285 + sinA*0.140)*g + (0.072 - cosA*0.072 - sinA*0.283)*b,
        (0.213 - cosA*0.213 - sinA*0.787)*r + (0.715 - cosA*0.715 + sinA*0.715)*g + (0.072 + cosA*0.928 + sinA*0.072)*b);
}

void main() {
    // поворот на 90°: отображаем выходной пиксель на координату источника
    vec2 suv = v_uv;
    if (u_rot > 0.5 && u_rot < 1.5) suv = vec2(1.0 - v_uv.y, v_uv.x);
    else if (u_rot > 1.5 && u_rot < 2.5) suv = vec2(1.0 - v_uv.x, 1.0 - v_uv.y);
    else if (u_rot > 2.5) suv = vec2(v_uv.y, 1.0 - v_uv.x);

    vec4 src = texture2D(u_tex, suv);
    vec3 c = src.rgb;

    if (u_sharpen > 0.001) {
        vec3 n = texture2D(u_tex, suv + vec2(0.0, u_texel.y)).rgb
               + texture2D(u_tex, suv - vec2(0.0, u_texel.y)).rgb
               + texture2D(u_tex, suv + vec2(u_texel.x, 0.0)).rgb
               + texture2D(u_tex, suv - vec2(u_texel.x, 0.0)).rgb;
        c = clamp(c * (1.0 + 4.0 * u_sharpen) - n * u_sharpen, 0.0, 1.0);
    }

    vec3 softCol = texture2D(u_soft, suv).rgb;

    // Смягчение кожи: размываем только «кожные» цвета, сильные края сохраняем.
    if (u_skin > 0.001) {
        float mx = max(c.r, max(c.g, c.b));
        float mn = min(c.r, min(c.g, c.b));
        float isSkin = (c.r > 0.37 && c.g > 0.15 && c.b > 0.08 && c.r > c.g && c.r > c.b
                        && mx - mn > 0.06 && abs(c.r - c.g) > 0.06) ? 1.0 : 0.0;
        float edge = length(c - softCol);
        float k = u_skin * isSkin * (1.0 - smoothstep(0.05, 0.20, edge));
        c = mix(c, softCol, k);
    }

    // Сияние: мягкий свет (screen-blend с размытой копией).
    if (u_glow > 0.001) {
        vec3 screenV = 1.0 - (1.0 - c) * (1.0 - softCol);
        c = mix(c, screenV, u_glow * 0.7);
    }

    // Кривые: сначала мастер-канал (RGB), затем поканальные R/G/B.
    // LUT-текстуры 256×1 с NEAREST-фильтрацией.
    c.r = texture2D(u_lutM, vec2(c.r, 0.5)).r;
    c.g = texture2D(u_lutM, vec2(c.g, 0.5)).r;
    c.b = texture2D(u_lutM, vec2(c.b, 0.5)).r;
    c.r = texture2D(u_lutC, vec2(c.r, 0.5)).r;
    c.g = texture2D(u_lutC, vec2(c.g, 0.5)).g;
    c.b = texture2D(u_lutC, vec2(c.b, 0.5)).b;

    c *= exp2(u_exposure);
    c *= vec3(1.0 + 0.30 * u_temperature, 1.0, 1.0 - 0.30 * u_temperature);
    c = pow(max(c, vec3(0.0)), vec3(1.0 / u_gamma));
    c *= (1.0 + u_brightness);
    c = (c - 0.5) * (1.0 + u_contrast) + 0.5;

    float l = dot(c, LUMA);
    c = mix(vec3(l), c, 1.0 + u_saturation);

    float mx2 = max(c.r, max(c.g, c.b));
    float mn2 = min(c.r, min(c.g, c.b));
    float k2 = 1.0 + u_vibrance * (1.0 - (mx2 - mn2));
    l = dot(c, LUMA);
    c = mix(vec3(l), c, k2);

    if (abs(u_hue) > 0.01) c = hueRotate(c);

    // Ч/Б с поканальными весами (нормализованы на клиенте и сервере одинаково).
    l = dot(c, vec3(u_bwR, u_bwG, u_bwB));
    c = mix(c, vec3(l), u_grayscale);

    vec3 sp = vec3(
        0.393*c.r + 0.769*c.g + 0.189*c.b,
        0.349*c.r + 0.686*c.g + 0.168*c.b,
        0.272*c.r + 0.534*c.g + 0.131*c.b);
    c = mix(c, sp, u_sepia);

    // Холодный синий тон: гасим красный канал, подмешиваем синий.
    if (u_blue > 0.001) {
        vec3 bt = vec3(c.r * 0.80, c.g * 0.92 + 0.015, c.b * 1.02 + 0.085);
        c = mix(c, bt, u_blue);
    }

    if (u_vignette > 0.001) {
        float d = length(v_uv - vec2(0.5));
        float v = smoothstep(0.20, 0.85, d);
        c *= 1.0 - u_vignette * v;
    }

    gl_FragColor = vec4(src.rgb, src.a); // DEBUG: сырой источник
    // gl_FragColor = vec4(clamp(c, 0.0, 1.0), src.a);
}`;

    const COLOR_UNIFORMS = [
        'u_tex', 'u_soft', 'u_texel', 'u_exposure', 'u_temperature', 'u_gamma', 'u_brightness',
        'u_contrast', 'u_saturation', 'u_vibrance', 'u_hue', 'u_sharpen',
        'u_grayscale', 'u_sepia', 'u_blue', 'u_vignette',
        'u_skin', 'u_glow', 'u_bwR', 'u_bwG', 'u_bwB', 'u_rot'
    ];

    function compile(g, type, source) {
        const sh = g.createShader(type);
        g.shaderSource(sh, source);
        g.compileShader(sh);
        if (!g.getShaderParameter(sh, g.COMPILE_STATUS)) {
            const log = g.getShaderInfoLog(sh);
            console.error('Shader compile error:', log);
            throw new Error('Ошибка компиляции шейдера: ' + log);
        }
        return sh;
    }

    function createProgram(g, fragSource, uniformNames) {
        const p = g.createProgram();
        g.attachShader(p, compile(g, g.VERTEX_SHADER, VERT));
        g.attachShader(p, compile(g, g.FRAGMENT_SHADER, fragSource));
        g.linkProgram(p);
        if (!g.getProgramParameter(p, g.LINK_STATUS)) {
            const log = g.getProgramInfoLog(p);
            console.error('Program link error:', log);
            throw new Error('Ошибка линковки программы: ' + log);
        }
        const uniforms = {};
        for (const name of uniformNames) uniforms[name] = g.getUniformLocation(p, name);
        return { p, a_pos: g.getAttribLocation(p, 'a_pos'), u: uniforms };
    }

    let progBlur = null, progColor = null, lutMTex = null, lutCTex = null;
    try {
        progBlur = createProgram(gl, FRAG_BLUR, ['u_tex', 'u_dir']);
        progColor = createProgram(gl, FRAG_COLOR, COLOR_UNIFORMS);
        lutMTex = gl.createTexture();
        lutCTex = gl.createTexture();
        for (const t of [lutMTex, lutCTex]) {
            gl.bindTexture(gl.TEXTURE_2D, t);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
        gl.useProgram(progColor.p);
        gl.uniform1i(progColor.u.u_lutM, 2);
        gl.uniform1i(progColor.u.u_lutC, 3);
    } catch (e) {
        console.error(e);
        el.glError.hidden = false;
        el.glError.textContent = 'Не удалось инициализировать WebGL: ' + e.message;
    }

    const quad = gl ? gl.createBuffer() : null;
    if (gl) {
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    }

    let texSrc = null;
    let fboA = null, fboB = null, fboC = null, fboD = null; // { tex, fb }
    let sourceCanvas = null; // уменьшенный оригинал для превью пресетов
    const SOFT_BLUR_RADIUS = 2.2; // радиус мягкого размытия для портретных эффектов

    function createTarget(w, h) {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        return { tex, fb };
    }

    function destroyTarget(t) {
        if (!t) return;
        gl.deleteTexture(t.tex);
        gl.deleteFramebuffer(t.fb);
    }

    function bindTexture(unit, tex) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
    }

    function drawQuad(prog) {
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.enableVertexAttribArray(prog.a_pos);
        gl.vertexAttribPointer(prog.a_pos, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // ---------- мини-рендерер: превью пресетов и миниатюр галереи ----------
    const thumbRenderer = (() => {
        const canvas = document.createElement('canvas');
        const g = canvas.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
        if (!g) return null;

        function target(w, h) {
            const t = g.createTexture();
            g.bindTexture(g.TEXTURE_2D, t);
            g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
            g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
            g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
            g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
            g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, w, h, 0, g.RGBA, g.UNSIGNED_BYTE, null);
            const fb = g.createFramebuffer();
            g.bindFramebuffer(g.FRAMEBUFFER, fb);
            g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, t, 0);
            return { tex: t, fb };
        }

        let progB, progC, quad, tex = null, tA, tB, tC, tD;
        try {
            progB = createProgram(g, FRAG_BLUR, ['u_tex', 'u_dir']);
            progC = createProgram(g, FRAG_COLOR, COLOR_UNIFORMS);
            quad = g.createBuffer();
            g.bindBuffer(g.ARRAY_BUFFER, quad);
            g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
        } catch (e) {
            console.error('Thumb renderer init failed:', e);
            return null;
        }

        function pass(prog, srcTex, dst, dx, dy) {
            g.bindFramebuffer(g.FRAMEBUFFER, dst ? dst.fb : null);
            g.viewport(0, 0, canvas.width, canvas.height);
            g.useProgram(prog.p);
            g.uniform1i(prog.u.u_tex, 0);
            g.activeTexture(g.TEXTURE0);
            g.bindTexture(g.TEXTURE_2D, srcTex);
            g.uniform2f(prog.u.u_dir, dx, dy);
            g.bindBuffer(g.ARRAY_BUFFER, quad);
            g.enableVertexAttribArray(prog.a_pos);
            g.vertexAttribPointer(prog.a_pos, 2, g.FLOAT, false, 0, 0);
            g.drawArrays(g.TRIANGLES, 0, 3);
        }

        const src2d = document.createElement('canvas');

        return {
            canvas,
            // кадрируем источник по центру под нужное соотношение сторон;
            // при смене размеров пересоздаем FBO
            setImage(source, tw, th) {
                if (canvas.width !== tw || canvas.height !== th) {
                    canvas.width = tw; canvas.height = th;
                    tA = target(tw, th); tB = target(tw, th);
                    tC = target(tw, th); tD = target(tw, th);
                }
                const sw = source.width, sh = source.height;
                const ta = tw / th, sa = sw / sh;
                let cw = sw, ch = sh, cx = 0, cy = 0;
                if (sa > ta) { cw = sh * ta; cx = (sw - cw) / 2; }
                else { ch = sw / ta; cy = (sh - ch) / 2; }
                src2d.width = tw; src2d.height = th;
                src2d.getContext('2d').drawImage(source, cx, cy, cw, ch, 0, 0, tw, th);
                if (tex) g.deleteTexture(tex);
                tex = g.createTexture();
                g.bindTexture(g.TEXTURE_2D, tex);
                g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
                g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, src2d);
                g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
                g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
                g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
                g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
            },
            render(n, w, rot = 0) {
                if (!tex) return null;
                const tw = canvas.width, th = canvas.height;
                const k = tw / Math.max(texW, 1); // радиусы в масштабе миниатюры
                pass(progB, tex, tA, n.blur * k / tw, 0);
                pass(progB, tA.tex, tB, 0, n.blur * k / th);
                const softR = Math.max(0.3, SOFT_BLUR_RADIUS * k);
                pass(progB, tB.tex, tC, softR / tw, 0);
                pass(progB, tC.tex, tD, 0, softR / th);

                g.bindFramebuffer(g.FRAMEBUFFER, null);
                g.viewport(0, 0, tw, th);
                g.useProgram(progC.p);
                g.uniform1i(progC.u.u_tex, 0);
                g.uniform1i(progC.u.u_soft, 1);
                g.activeTexture(g.TEXTURE0);
                g.bindTexture(g.TEXTURE_2D, tB.tex);
                g.activeTexture(g.TEXTURE1);
                g.bindTexture(g.TEXTURE_2D, tD.tex);
                g.uniform2f(progC.u.u_texel, 1 / tw, 1 / th);
                const u = progC.u;
                g.uniform1f(u.u_exposure, n.exposure);
                g.uniform1f(u.u_temperature, n.temperature);
                g.uniform1f(u.u_gamma, n.gamma);
                g.uniform1f(u.u_brightness, n.brightness);
                g.uniform1f(u.u_contrast, n.contrast);
                g.uniform1f(u.u_saturation, n.saturation);
                g.uniform1f(u.u_vibrance, n.vibrance);
                g.uniform1f(u.u_hue, n.hue);
                g.uniform1f(u.u_sharpen, n.sharpen);
                g.uniform1f(u.u_grayscale, n.grayscale);
                g.uniform1f(u.u_sepia, n.sepia);
                g.uniform1f(u.u_blue, n.blue);
                g.uniform1f(u.u_vignette, n.vignette);
                g.uniform1f(u.u_skin, n.skin);
                g.uniform1f(u.u_glow, n.glow);
                g.uniform1f(u.u_bwR, w[0]);
                g.uniform1f(u.u_bwG, w[1]);
                g.uniform1f(u.u_bwB, w[2]);
                g.uniform1f(u.u_rot, rot);
                g.bindBuffer(g.ARRAY_BUFFER, quad);
                g.enableVertexAttribArray(progC.a_pos);
                g.vertexAttribPointer(progC.a_pos, 2, g.FLOAT, false, 0, 0);
                g.drawArrays(g.TRIANGLES, 0, 3);
                return canvas;
            }
        };
    })();

    // Ч/Б веса с учётом поканальных ползунков (синхронно с C#).
    // Верхняя граница клампа выше базового веса зелёного (0.7152)!
    function bwWeights(s) {
        const w = [
            Math.min(0.95, Math.max(0.02, 0.2126 + (s.bwRed / 100) * 0.2)),
            Math.min(0.95, Math.max(0.02, 0.7152 + (s.bwGreen / 100) * 0.2)),
            Math.min(0.95, Math.max(0.02, 0.0722 + (s.bwBlue / 100) * 0.2))
        ];
        const sum = w[0] + w[1] + w[2];
        return [w[0] / sum, w[1] / sum, w[2] / sum];
    }

    // ---------- поворот ----------
    let rotation = 0; // 0..3, шаг 90° по часовой

    function outDims() {
        const swap = rotation % 2 === 1;
        return swap ? { w: texH, h: texW } : { w: texW, h: texH };
    }

    function applyRotation(newRot) {
        if (newRot !== undefined) rotation = ((newRot % 4) + 4) % 4;
        const { w, h } = outDims();
        el.canvas.width = w;
        el.canvas.height = h;
        if (image) image.rotation = rotation;
        applyZoom(zoom);
        if (image) updateInfo();
        requestRender();
    }

    function normalizedSettings(s) {
        const identity = isCurvesIdentityPoints(s.curves);
        return {
            exposure: s.exposure,
            gamma: s.gamma,
            brightness: s.brightness / 100,
            contrast: s.contrast / 100,
            temperature: s.temperature / 100,
            hue: s.hue,
            saturation: s.saturation / 100,
            vibrance: s.vibrance / 100,
            sharpen: s.sharpen / 100,
            blur: s.blur,
            skin: s.skin / 100,
            glow: s.glow / 100,
            vignette: s.vignette / 100,
            grayscale: s.grayscale / 100,
            sepia: s.sepia / 100,
            blue: s.blue / 100,
            bwRed: s.bwRed / 100,
            bwGreen: s.bwGreen / 100,
            bwBlue: s.bwBlue / 100,
            // LUT [мастер, R, G, B] по 256 значений; identity не отправляем
            curves: identity ? null : [
                Array.from(computeLut(s.curves.master)),
                Array.from(computeLut(s.curves.r)),
                Array.from(computeLut(s.curves.g)),
                Array.from(computeLut(s.curves.b))
            ]
        };
    }

    function blurPass(sourceTex, target, radiusX, radiusY) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
        gl.useProgram(progBlur.p);
        gl.uniform1i(progBlur.u.u_tex, 0);
        bindTexture(0, sourceTex);
        gl.uniform2f(progBlur.u.u_dir, radiusX, radiusY);
        drawQuad(progBlur);
    }

    function render() {
        if (!gl || !texSrc) return;
        const s = compare ? DEFAULTS : settings;
        const n = normalizedSettings(s);
        const w = bwWeights(s);

        gl.viewport(0, 0, texW, texH);
        gl.disable(gl.BLEND);

        // 1–2) размытие пользователя (H → A, V → B)
        blurPass(texSrc, fboA, s.blur / texW, 0);
        blurPass(fboA.tex, fboB, 0, s.blur / texH);

        // 3–4) мягкое размытие для портретных эффектов (H → C, V → D)
        blurPass(fboB.tex, fboC, SOFT_BLUR_RADIUS / texW, 0);
        blurPass(fboC.tex, fboD, 0, SOFT_BLUR_RADIUS / texH);

        // 5) резкость + портрет + поворот + кривые + цвет + виньетка → экран
        const out = outDims();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, out.w, out.h);
        gl.useProgram(progColor.p);
        gl.uniform1i(progColor.u.u_tex, 0);
        gl.uniform1i(progColor.u.u_soft, 1);
        bindTexture(0, fboB.tex);
        bindTexture(1, fboD.tex);

        // LUT кривых: отдельные текстурные блоки 2 и 3 — загрузка строго
        // в них, чтобы не затереть u_tex (блок 0) и u_soft (блок 1)
        const luts = buildLuts(s.curves);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, lutMTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, luts.md);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, lutCTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, luts.cd);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform2f(progColor.u.u_texel, 1 / texW, 1 / texH);
        const u = progColor.u;
        gl.uniform1f(u.u_exposure, n.exposure);
        gl.uniform1f(u.u_temperature, n.temperature);
        gl.uniform1f(u.u_gamma, n.gamma);
        gl.uniform1f(u.u_brightness, n.brightness);
        gl.uniform1f(u.u_contrast, n.contrast);
        gl.uniform1f(u.u_saturation, n.saturation);
        gl.uniform1f(u.u_vibrance, n.vibrance);
        gl.uniform1f(u.u_hue, n.hue);
        gl.uniform1f(u.u_sharpen, n.sharpen);
        gl.uniform1f(u.u_grayscale, n.grayscale);
        gl.uniform1f(u.u_sepia, n.sepia);
        gl.uniform1f(u.u_blue, n.blue);
        gl.uniform1f(u.u_vignette, n.vignette);
        gl.uniform1f(u.u_skin, n.skin);
        gl.uniform1f(u.u_glow, n.glow);
        gl.uniform1f(u.u_bwR, w[0]);
        gl.uniform1f(u.u_bwG, w[1]);
        gl.uniform1f(u.u_bwB, w[2]);
        gl.uniform1f(u.u_rot, rotation);
        drawQuad(progColor);
    }

    let rafPending = false;
    function requestRender() {
        if (rafPending) return;
        rafPending = true;
        let done = false;
        const run = () => {
            if (done) return;
            done = true;
            rafPending = false;
            render();
            scheduleHistogram();
        };
        // rAF не срабатывает в скрытых/фоновых вкладках — дублируем таймером
        requestAnimationFrame(run);
        setTimeout(run, 34);
    }

    // ---------- гистограмма ----------
    const hist2d = document.createElement('canvas');
    const histSrcCtx = hist2d.getContext('2d', { willReadFrequently: true });
    const histCtx = el.histogram.getContext('2d');
    let histTimer = null;
    let histBins = null; // бины последней гистограммы — подложка редактора кривых

    function scheduleHistogram() {
        if (histTimer) return;
        histTimer = setTimeout(() => {
            histTimer = null;
            updateHistogram();
        }, 150);
    }

    function updateHistogram() {
        const W = el.histogram.width, H = el.histogram.height;
        histCtx.clearRect(0, 0, W, H);
        histCtx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--hist-bg').trim() || '#fbfbfd';
        histCtx.fillRect(0, 0, W, H);
        if (!texSrc) { histBins = null; return; }

        const hh = Math.max(1, Math.min(H, Math.round(W * texH / texW)));
        hist2d.width = W; hist2d.height = hh;
        histSrcCtx.drawImage(el.canvas, 0, 0, W, hh);
        let data;
        try {
            data = histSrcCtx.getImageData(0, 0, W, hh).data;
        } catch {
            return;
        }

        const bins = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
        for (let i = 0; i < data.length; i += 4) {
            bins[0][data[i]]++;
            bins[1][data[i + 1]]++;
            bins[2][data[i + 2]]++;
        }
        histBins = bins;

        let max = 1;
        for (const ch of bins) for (const v of ch) if (v > max) max = v;

        histCtx.globalCompositeOperation = 'lighter';
        const colors = ['rgba(255,59,48,0.5)', 'rgba(52,199,89,0.5)', 'rgba(0,113,227,0.5)'];
        for (let ch = 0; ch < 3; ch++) {
            histCtx.beginPath();
            histCtx.moveTo(0, H);
            for (let i = 0; i < 256; i++) {
                const y = H - (bins[ch][i] / max) * (H - 4);
                histCtx.lineTo(i * W / 255, y);
            }
            histCtx.lineTo(W, H);
            histCtx.closePath();
            histCtx.fillStyle = colors[ch];
            histCtx.fill();
        }
        histCtx.globalCompositeOperation = 'source-over';
    }

    // ---------- редактор кривых ----------
    const curveCv = el.curveEditor;
    const curveCtx = curveCv.getContext('2d');
    let curveChannel = 'master';
    let curveDragIdx = -1;
    let curveDragMoved = false;
    let curveDragSnap = null;

    const CURVE_COLORS = { master: '#e8e8ee', r: '#ff6a5e', g: '#5ad06a', b: '#6aa8ff' };

    function drawCurveEditor() {
        const W = curveCv.width, H = curveCv.height;
        curveCtx.clearRect(0, 0, W, H);
        curveCtx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--hist-bg').trim() || '#1c1c20';
        curveCtx.fillRect(0, 0, W, H);

        curveCtx.strokeStyle = 'rgba(255,255,255,0.09)';
        curveCtx.lineWidth = 1;
        curveCtx.beginPath();
        for (let i = 1; i < 4; i++) {
            const p = Math.round(i * W / 4) + 0.5;
            curveCtx.moveTo(p, 0); curveCtx.lineTo(p, H);
            curveCtx.moveTo(0, Math.round(i * H / 4) + 0.5); curveCtx.lineTo(W, Math.round(i * H / 4) + 0.5);
        }
        curveCtx.stroke();

        // гистограмма выбранного канала как подложка
        if (histBins) {
            const idx = { master: -1, r: 0, g: 1, b: 2 }[curveChannel];
            let maxV = 1;
            if (idx >= 0) for (let i = 0; i < 256; i++) if (histBins[idx][i] > maxV) maxV = histBins[idx][i];
            curveCtx.beginPath();
            curveCtx.moveTo(0, H);
            for (let i = 0; i < 256; i++) {
                const v = idx >= 0
                    ? histBins[idx][i]
                    : 0.2126 * histBins[0][i] + 0.7152 * histBins[1][i] + 0.0722 * histBins[2][i];
                curveCtx.lineTo(i * W / 255, H - (v / maxV) * (H - 2));
            }
            curveCtx.lineTo(W, H);
            curveCtx.closePath();
            curveCtx.fillStyle = 'rgba(255,255,255,0.14)';
            curveCtx.fill();
        }

        // диагональ-ориентир
        curveCtx.strokeStyle = 'rgba(255,255,255,0.25)';
        curveCtx.beginPath(); curveCtx.moveTo(0, H); curveCtx.lineTo(W, 0); curveCtx.stroke();

        // кривая — ровно та, что уходит в шейдер и на сервер
        const lut = computeLut(settings.curves[curveChannel]);
        curveCtx.strokeStyle = CURVE_COLORS[curveChannel];
        curveCtx.lineWidth = 2;
        curveCtx.beginPath();
        for (let i = 0; i < 256; i++) {
            const px = i * W / 255, py = H - (lut[i] / 255) * H;
            if (i === 0) curveCtx.moveTo(px, py); else curveCtx.lineTo(px, py);
        }
        curveCtx.stroke();

        curveCtx.fillStyle = '#fff';
        curveCtx.lineWidth = 1.5;
        for (const p of settings.curves[curveChannel]) {
            const px = p[0] * W, py = H - p[1] * H;
            curveCtx.fillStyle = '#fff';
            curveCtx.fillRect(px - 4, py - 4, 8, 8);
            curveCtx.strokeStyle = CURVE_COLORS[curveChannel];
            curveCtx.strokeRect(px - 4, py - 4, 8, 8);
        }
    }

    function curvePointFromEvent(e) {
        const rect = curveCv.getBoundingClientRect();
        return {
            x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
            y: Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height))
        };
    }

    function curveChanged() {
        drawCurveEditor();
        requestRender();
        refreshPencil(items[activeIndex], settings);
        scheduleThumbUpdate();
    }

    curveCv.addEventListener('pointerdown', e => {
        if (!texSrc) return;
        const { x, y } = curvePointFromEvent(e);
        const pts = settings.curves[curveChannel];
        let idx = -1, best = 14;
        pts.forEach((p, i) => {
            const d = Math.hypot((p[0] - x) * curveCv.width, (p[1] - y) * curveCv.height);
            if (d < best) { best = d; idx = i; }
        });
        if (idx === -1) {
            if (x <= 0.02) idx = 0;
            else if (x >= 0.98) idx = pts.length - 1;
            else {
                idx = 1;
                while (idx < pts.length && pts[idx][0] < x) idx++;
                pts.splice(idx, 0, [x, y]);
            }
        }
        curveDragIdx = idx;
        curveDragMoved = false;
        curveDragSnap = cloneSettings(settings);
        try { curveCv.setPointerCapture(e.pointerId); } catch (err) { /* не критично */ }
        curveChanged();
    });

    // move/up на window: перетаскивание не срывается, даже если
    // setPointerCapture не сработал или курсор ушёл за пределы канваса
    window.addEventListener('pointermove', e => {
        if (curveDragIdx < 0) return;
        const { x, y } = curvePointFromEvent(e);
        const pts = settings.curves[curveChannel];
        const p = pts[curveDragIdx];
        if (curveDragIdx === 0) p[0] = 0;
        else if (curveDragIdx === pts.length - 1) p[0] = 1;
        else {
            const lo = pts[curveDragIdx - 1][0] + 0.02;
            const hi = pts[curveDragIdx + 1][0] - 0.02;
            p[0] = Math.min(hi, Math.max(lo, x));
        }
        p[1] = y;
        curveDragMoved = true;
        curveChanged();
    });

    window.addEventListener('pointerup', () => {
        if (curveDragIdx >= 0) {
            if (curveDragMoved) pushHistory(curveDragSnap);
            curveDragIdx = -1;
            curveDragSnap = null;
        }
    });

    curveCv.addEventListener('dblclick', e => {
        const { x, y } = curvePointFromEvent(e);
        const pts = settings.curves[curveChannel];
        let idx = -1, best = 14;
        pts.forEach((p, i) => {
            const d = Math.hypot((p[0] - x) * curveCv.width, (p[1] - y) * curveCv.height);
            if (d < best) { best = d; idx = i; }
        });
        if (idx > 0 && idx < pts.length - 1 && pts.length > 2) {
            pushHistory();
            pts.splice(idx, 1);
            curveChanged();
        }
    });

    el.curvesChannels.addEventListener('click', e => {
        const b = e.target.closest('button[data-ch]');
        if (!b) return;
        curveChannel = b.dataset.ch;
        for (const btn of el.curvesChannels.querySelectorAll('button'))
            btn.classList.toggle('active', btn === b);
        drawCurveEditor();
    });

    el.btnResetCurve.addEventListener('click', () => {
        pushHistory();
        settings.curves[curveChannel] = IDENTITY_CURVE.map(p => [...p]);
        curveChanged();
    });

    // ---------- загрузка изображения ----------
    async function loadAndSetup(url) {
        const img = new Image();
        // onload/onerror вместо decode(): decode() у оторванного от DOM <img>
        // изредка не завершается в Chromium и вечно держит оверлей загрузки
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error(t('err.loadImage')));
            img.src = url;
        });

        const scale = Math.min(1, MAX_TEXTURE_DIM / Math.max(img.naturalWidth, img.naturalHeight));
        texW = Math.max(1, Math.round(img.naturalWidth * scale));
        texH = Math.max(1, Math.round(img.naturalHeight * scale));

        const work = document.createElement('canvas');
        work.width = texW; work.height = texH;
        work.getContext('2d').drawImage(img, 0, 0, texW, texH);

        if (texSrc) gl.deleteTexture(texSrc);
        destroyTarget(fboA);
        destroyTarget(fboB);
        destroyTarget(fboC);
        destroyTarget(fboD);

        texSrc = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texSrc);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, work);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        fboA = createTarget(texW, texH);
        fboB = createTarget(texW, texH);
        fboC = createTarget(texW, texH);
        fboD = createTarget(texW, texH);

        // сохраняем уменьшенный оригинал для превью-миниатюр пресетов
        sourceCanvas = work;
    }

    function showEditor() {
        el.empty.hidden = true;
        el.canvasWrap.hidden = false;
        el.canvasBar.hidden = false;
        el.canvas.hidden = false;
        for (const b of [el.compare, el.reset, el.download, el.btnExport, el.clear, el.exportGallery]) b.disabled = false;
        updateUndoBtn();
    }

    function resetToEmptyState() {
        activeIndex = -1;
        image = null;
        texSrc = null;
        rotation = 0;
        el.gallery.hidden = true;
        el.canvasWrap.hidden = true;
        el.canvasBar.hidden = true;
        el.canvas.hidden = true;
        el.empty.hidden = false;
        for (const b of [el.compare, el.reset, el.download, el.btnExport, el.clear, el.undo, el.exportGallery]) b.disabled = true;
        histBins = null;
        histCtx.clearRect(0, 0, el.histogram.width, el.histogram.height);
        drawCurveEditor();
    }

    function updateInfo() {
        const out = outDims();
        el.info.textContent = `${image.name} · ${image.width}×${image.height} · ${t('info.preview')} ${out.w}×${out.h}`;
    }

    async function uploadFiles(fileList) {
        const files = [...fileList].filter(f => /\.(jpe?g|png|webp|bmp|gif)$/i.test(f.name));
        if (!files.length) {
            toast(t('toast.formats'), true);
            return;
        }
        uploading = true;
        busy(true, files.length > 1 ? t('busy.uploadingN', { i: 1, n: files.length }) : t('busy.uploading'));
        let firstNew = null;
        try {
            for (let i = 0; i < files.length; i++) {
                if (files.length > 1) busy(true, t('busy.uploadingN', { i: i + 1, n: files.length }));
                const fd = new FormData();
                fd.append('file', files[i], files[i].name);
                const resp = await fetch('/api/images/upload', { method: 'POST', body: fd });
                if (!resp.ok) throw new Error(await parseError(resp));
                const data = await resp.json();
                const item = { ...data, settings: null, history: [] };
                items.push(item);
                if (!firstNew) firstNew = item;
                addThumb(item);
            }
            if (items.length === files.length && items.length > 0) showEditor();
            el.gallery.hidden = false;
            if (firstNew) await activateItem(items.indexOf(firstNew));
        } catch (e) {
            toast(t('toast.openFail', { m: e.message }), true);
        } finally {
            uploading = false;
            busy(false);
        }
    }

    async function activateItem(idx) {
        if (idx < 0 || idx >= items.length) return;
        if (activeIndex >= 0 && items[activeIndex]) {
            items[activeIndex].settings = cloneSettings(settings);
            refreshPencil(items[activeIndex]);
        }
        activeIndex = idx;
        image = items[idx];
        settings = cloneSettings({ ...DEFAULTS, ...(image.settings || {}) });
        compare = false;
        el.compare.classList.remove('active');
        syncInputs();
        updateGalleryActive();
        updateUndoBtn();
        await loadAndSetup(image.url);
        rotation = image.rotation || 0;
        applyRotation();
        applyZoom(1, true);
        image.previewWidth = el.canvas.width;
        showEditor();
        updateInfo();
        renderPresetThumbs();
        refreshPencil(image, settings);
        scheduleThumbUpdate();
        requestRender();
    }

    const PENCIL_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';

    // оригинал (квадратный кроп по центру) в миниатюру
    function drawOriginalThumb(item) {
        const img = new Image();
        img.onload = () => {
            const cv = item.thumbCanvas;
            if (!cv) return;
            const sw = img.naturalWidth, sh = img.naturalHeight;
            const side = Math.min(sw, sh);
            const ctx = cv.getContext('2d');
            ctx.clearRect(0, 0, cv.width, cv.height);
            ctx.drawImage(img, (sw - side) / 2, (sh - side) / 2, side, side, 0, 0, cv.width, cv.height);
        };
        img.src = item.url;
    }

    function addThumb(item) {
        const btn = document.createElement('div');
        btn.className = 'gallery-item';
        btn.title = item.name;
        const cv = document.createElement('canvas');
        cv.width = 96; cv.height = 96;
        cv.className = 'thumb-canvas';
        btn.appendChild(cv);
        const pencil = document.createElement('span');
        pencil.className = 'pencil';
        pencil.hidden = true;
        pencil.title = t('pencil.title');
        pencil.innerHTML = PENCIL_SVG;
        btn.appendChild(pencil);
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'remove';
        rm.textContent = '×';
        rm.title = t('thumb.remove');
        rm.addEventListener('click', e => {
            e.stopPropagation();
            removeItem(items.indexOf(item));
        });
        btn.appendChild(rm);
        btn.addEventListener('click', () => {
            const idx = items.indexOf(item);
            if (idx === activeIndex) {
                // клик по активной миниатюре — показать оригинал / вернуть правки
                compare = !compare;
                el.compare.classList.toggle('active', compare);
                requestRender();
            } else {
                activateItem(idx);
            }
        });
        el.gallery.appendChild(btn);
        item.thumb = btn;
        item.thumbCanvas = cv;
        item.pencil = pencil;
        drawOriginalThumb(item);
    }

    function updateGalleryActive() {
        for (let i = 0; i < items.length; i++)
            items[i].thumb.classList.toggle('active', i === activeIndex);
    }

    function removeItem(idx) {
        if (idx < 0) return;
        const [removed] = items.splice(idx, 1);
        removed.thumb.remove();
        if (!items.length) {
            resetToEmptyState();
            return;
        }
        if (idx === activeIndex) {
            activeIndex = -1;
            activateItem(Math.min(idx, items.length - 1));
        } else {
            if (idx < activeIndex) activeIndex--;
            updateGalleryActive();
        }
    }

    // ---------- модальное окно ----------
    function showModal({ title, text, okLabel = 'ОК', onOk }) {
        el.modalTitle.textContent = title;
        el.modalText.textContent = text;
        el.modalOk.textContent = okLabel;
        el.modal.hidden = false;
        el.modalOk.onclick = () => { closeModal(); if (onOk) onOk(); };
        el.modalCancel.onclick = closeModal;
        el.modalCancel.focus();
    }

    function closeModal() {
        el.modal.hidden = true;
    }

    function clearGallery() {
        if (!items.length) return;
        showModal({
            title: t('modal.clearTitle'),
            text: t('modal.clearText'),
            okLabel: t('modal.ok'),
            onOk: () => {
                for (const it of items) it.thumb.remove();
                items = [];
                resetToEmptyState();
                toast(t('toast.cleared'));
            }
        });
    }

    // ---------- экспорт ----------
    async function exportImage() {
        if (!image) return;
        items[activeIndex].settings = cloneSettings(settings);
        busy(true, t('busy.export'));
        try {
            const body = {
                id: image.id,
                format: exportFormat,
                quality: +el.qualityRange.value,
                previewWidth: el.canvas.width,
                rotation: rotation,
                maxWidth: el.maxWidth.value ? +el.maxWidth.value : null,
                maxHeight: el.maxHeight.value ? +el.maxHeight.value : null,
                adjustments: normalizedSettings(settings)
            };
            const resp = await fetch('/api/images/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!resp.ok) throw new Error(await parseError(resp));
            const blob = await resp.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${image.name}-edit.${exportFormat === 'jpeg' ? 'jpg' : exportFormat}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 5000);
            toast(t('toast.saved', { name: a.download }));
        } catch (e) {
            toast(t('toast.exportError', { m: e.message }), true);
        } finally {
            busy(false);
        }
    }

    // ---------- панель ползунков ----------
    const inputsByKey = {};
    const presetThumbs = [];

    function updateTrack(input) {
        const def = SLIDERS.find(d => 'sl-' + d.key === input.id);
        if (!def) return;
        const p = ((+input.value - def.min) / (def.max - def.min)) * 100;
        input.style.background =
            `linear-gradient(90deg, var(--orange) ${p}%, var(--track) ${p}%)`;
    }

    function buildPanel() {
        for (const k in inputsByKey) delete inputsByKey[k];
        for (const group of GROUPS) {
            const details = document.createElement('details');
            details.className = 'tile group';
            details.open = true;

            const summary = document.createElement('summary');
            summary.textContent = lang === 'en' ? group.titleEn : group.title;
            details.appendChild(summary);

            const body = document.createElement('div');
            body.className = 'group-body';

            for (const def of SLIDERS.filter(s => s.group === group.id)) {
                const row = document.createElement('div');
                row.className = 'row slider-row';

                const label = document.createElement('label');
                label.className = 'row-label';
                label.textContent = lang === 'en' ? def.labelEn : def.label;
                label.htmlFor = 'sl-' + def.key;
                label.title = t('label.dblReset');

                const range = document.createElement('input');
                range.type = 'range';
                range.id = 'sl-' + def.key;
                range.min = def.min;
                range.max = def.max;
                range.step = def.step;
                range.value = settings[def.key];

                const num = document.createElement('input');
                num.type = 'number';
                num.className = 'row-num';
                num.id = 'num-' + def.key;
                num.min = def.min;
                num.max = def.max;
                num.step = def.step;
                num.value = settings[def.key];
                num.setAttribute('aria-label', (lang === 'en' ? def.labelEn : def.label) + ', manual input');
                num.title = t('num.range', { label: lang === 'en' ? def.labelEn : def.label, min: def.min, max: def.max });

                const apply = v => {
                    settings[def.key] = v;
                    range.value = v;
                    num.value = v;
                    updateTrack(range);
                    requestRender();
                    refreshPencil(items[activeIndex], settings);
                    scheduleThumbUpdate();
                };

                // перетаскивание ползунка = одно действие в истории:
                // снимок состояния до первого изменения, запись на отпускании
                let dragSnap = null;
                let numSnap = null;

                range.addEventListener('input', () => {
                    if (!dragSnap) dragSnap = { ...settings };
                    apply(+range.value);
                });
                range.addEventListener('change', () => {
                    if (dragSnap) { pushHistory(dragSnap); dragSnap = null; }
                });
                range.addEventListener('dblclick', () => {
                    dragSnap = null;
                    pushHistory();
                    apply(DEFAULTS[def.key]);
                });

                num.addEventListener('focus', () => { numSnap = { ...settings }; });
                num.addEventListener('input', () => {
                    const v = parseFloat(num.value);
                    if (Number.isFinite(v)) apply(v);
                });
                num.addEventListener('change', () => {
                    let v = parseFloat(num.value);
                    if (!Number.isFinite(v)) v = settings[def.key];
                    v = Math.min(def.max, Math.max(def.min, v));
                    if (numSnap) { pushHistory(numSnap); numSnap = null; }
                    apply(v);
                });
                num.addEventListener('dblclick', () => {
                    numSnap = null;
                    pushHistory();
                    apply(DEFAULTS[def.key]);
                });

                row.append(label, range, num);
                body.appendChild(row);
                inputsByKey[def.key] = { range, num, def };
                updateTrack(range);
            }

            details.appendChild(body);
            el.groups.appendChild(details);
        }
    }

    function syncInputs() {
        for (const key of Object.keys(inputsByKey)) {
            const { range, num } = inputsByKey[key];
            range.value = settings[key];
            num.value = settings[key];
            updateTrack(range);
        }
    }

    function buildPresets() {
        presetThumbs.length = 0;
        let currentGroup = null;
        let row = null;
        for (const preset of PRESETS) {
            if (preset.group !== currentGroup) {
                currentGroup = preset.group;
                const title = document.createElement('div');
                title.className = 'presets-group-title';
                title.textContent = t('preset.' + currentGroup);
                el.presets.appendChild(title);
                row = document.createElement('div');
                row.className = 'preset-row';
                el.presets.appendChild(row);
            }
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'preset-chip';
            const thumb = document.createElement('canvas');
            thumb.width = 128; thumb.height = 96;
            const label = document.createElement('span');
            label.textContent = lang === 'en' ? (preset.nameEn || preset.name) : preset.name;
            chip.append(thumb, label);
            chip.addEventListener('click', () => {
                pushHistory();
                settings = cloneSettings({ ...DEFAULTS, ...preset.values });
                syncInputs();
                requestRender();
                refreshPencil(items[activeIndex], settings);
                scheduleThumbUpdate();
            });
            row.appendChild(chip);
            presetThumbs.push({ canvas: thumb, preset });
        }
    }

    // перерисовываем превью всех пресетов для активного фото
    function renderPresetThumbs() {
        if (!sourceCanvas || !thumbRenderer) return;
        thumbRenderer.setImage(sourceCanvas, 256, 192);
        for (const { canvas, preset } of presetThumbs) {
            const s = { ...DEFAULTS, ...preset.values };
            const rendered = thumbRenderer.render(normalizedSettings(s), bwWeights(s), 0);
            if (!rendered) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(rendered, 0, 0, canvas.width, canvas.height);
        }
    }

    // ---------- события ----------
    el.open.addEventListener('click', () => el.fileInput.click());
    el.empty.addEventListener('click', () => el.fileInput.click());
    el.fileInput.addEventListener('change', () => {
        uploadFiles(el.fileInput.files);
        el.fileInput.value = '';
    });

    el.stage.addEventListener('dragover', e => {
        e.preventDefault();
        el.stage.classList.add('dropping');
    });
    el.stage.addEventListener('dragleave', () => el.stage.classList.remove('dropping'));
    el.stage.addEventListener('drop', e => {
        e.preventDefault();
        el.stage.classList.remove('dropping');
        uploadFiles(e.dataTransfer.files);
    });

    window.addEventListener('paste', e => {
        const files = [...(e.clipboardData?.items || [])]
            .filter(i => i.type.startsWith('image/'))
            .map(i => i.getAsFile())
            .filter(Boolean);
        if (files.length) uploadFiles(files);
    });

    const startCompare = () => { if (!image) return; compare = true; requestRender(); };
    const stopCompare = () => { if (!compare) return; compare = false; requestRender(); };
    el.compare.addEventListener('pointerdown', startCompare);
    el.compare.addEventListener('pointerup', stopCompare);
    el.compare.addEventListener('pointerleave', stopCompare);
    el.compare.addEventListener('pointercancel', stopCompare);

    el.reset.addEventListener('click', () => {
        pushHistory();
        settings = cloneSettings(DEFAULTS);
        syncInputs();
        requestRender();
        refreshPencil(items[activeIndex], settings);
        scheduleThumbUpdate();
    });

    el.undo.addEventListener('click', undo);
    el.clear.addEventListener('click', clearGallery);

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            undo();
        }
    });

    el.theme.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('photolux-theme', next);
        scheduleHistogram();
    });

    el.zoomIn.addEventListener('click', () => applyZoom(zoom * ZOOM_STEP));
    el.zoomOut.addEventListener('click', () => applyZoom(zoom / ZOOM_STEP));
    el.zoomFit.addEventListener('click', () => applyZoom(0, true));

    el.rotateRight.addEventListener('click', () => applyRotation(rotation + 1));
    el.rotateLeft.addEventListener('click', () => applyRotation(rotation + 3));

    el.download.addEventListener('click', exportImage);
    el.btnExport.addEventListener('click', exportImage);

    el.modal.addEventListener('click', e => {
        if (e.target === el.modal) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !el.modal.hidden) closeModal();
    });

    // Пакетный экспорт: все фото галереи с их настройками одним ZIP-архивом
    el.exportGallery.addEventListener('click', async () => {
        if (!items.length || uploading) return;
        if (activeIndex >= 0 && items[activeIndex]) items[activeIndex].settings = cloneSettings(settings);
        busy(true, t('busy.archive', { n: items.length }));
        try {
            const body = {
                format: exportFormat,
                quality: +el.qualityRange.value,
                maxWidth: el.maxWidth.value ? +el.maxWidth.value : null,
                maxHeight: el.maxHeight.value ? +el.maxHeight.value : null,
                items: items.map(it => ({
                    id: it.id,
                    previewWidth: it.previewWidth || 0,
                    rotation: it.rotation || 0,
                    adjustments: normalizedSettings({ ...DEFAULTS, ...(it.settings || {}) })
                }))
            };
            const resp = await fetch('/api/images/export-archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!resp.ok) throw new Error(await parseError(resp));
            const blob = await resp.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'photolux-gallery.zip';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 5000);
            toast(t('toast.archive', { n: items.length }));
        } catch (e) {
            toast(t('toast.exportError', { m: e.message }), true);
        } finally {
            busy(false);
        }
    });

    el.formatSeg.addEventListener('click', e => {
        const btn = e.target.closest('button[data-format]');
        if (!btn) return;
        exportFormat = btn.dataset.format;
        for (const b of el.formatSeg.querySelectorAll('button'))
            b.classList.toggle('active', b === btn);
        el.qualityRow.style.opacity = exportFormat === 'png' ? '.4' : '1';
        el.qualityRange.disabled = exportFormat === 'png';
        el.qualityNum.disabled = exportFormat === 'png';
    });

    // качество экспорта: ползунок ↔ число
    el.qualityRange.addEventListener('input', () => {
        el.qualityNum.value = el.qualityRange.value;
    });
    el.qualityNum.addEventListener('input', () => {
        const v = parseFloat(el.qualityNum.value);
        if (Number.isFinite(v)) {
            el.qualityRange.value = Math.min(100, Math.max(1, v));
        }
    });
    el.qualityNum.addEventListener('change', () => {
        let v = parseFloat(el.qualityNum.value);
        if (!Number.isFinite(v)) v = 90;
        v = Math.min(100, Math.max(1, Math.round(v)));
        el.qualityRange.value = v;
        el.qualityNum.value = v;
    });

    // ---------- старт ----------
    window.__PS = {
        get gl() { return gl; }, get texSrc() { return texSrc; },
        get fboB() { return fboB; }, get lutMTex() { return lutMTex; },
        get lutCTex() { return lutCTex; }, get texW() { return texW; }
    };
    el.langSwitch.addEventListener('click', e => {
        const b = e.target.closest('button[data-lang]');
        if (!b || b.dataset.lang === lang) return;
        lang = b.dataset.lang;
        applyLang();
    });
    applyLang();
    drawCurveEditor();
})();
