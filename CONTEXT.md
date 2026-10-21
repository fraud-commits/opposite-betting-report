# CONTEXT — Universal Opposite Betting Report (Tableau Extension)

## Что это
Универсальный Tableau Extension для отчётов по opposite betting. Один extension для ВСЕХ клиентов — колонки определяются по ИМЕНИ через `sumdata.columns`, а не по индексам. Раньше было 8 отдельных копий (папка `P:\FAR\Individual folders LFS\Polina\Opposite betting tool\` — старые версии, НЕ трогать, там pCloud откатывает изменения!).

## Ключевые пути
- **Рабочая копия (репозиторий):** `C:\Users\LFS-PC3\opposite-betting-report` — ВСЕ правки ТОЛЬКО тут (не в pCloud!)
- **GitHub:** https://github.com/fraud-commits/opposite-betting-report (public, нужен для Pages)
- **Хостинг:** GitHub Pages → https://fraud-commits.github.io/opposite-betting-report/
- **gh CLI** залогинен как `fraud-commits`
- Деплой: push в main → Pages собирает ~1.5 мин (`gh api repos/fraud-commits/opposite-betting-report/pages/builds/latest --jq .status`)

## Правило версий (ВАЖНО)
При каждом изменении кода поднимать версию в ТРЁХ местах (Tableau кеширует):
- `MAIN.trex`: `<url>https://fraud-commits.github.io/opposite-betting-report/?v=N</url>`
- `index.html`: `css/style.css?v=N` и `js/application.js?v=N`
Текущая задеплоенная версия: **v=59** (MAIN.trex без версии — грузит всегда свежий index.html).

## Архитектура js/application.js
1. **FIELDS** — конфиг полей: `key`, `aliases` (имена колонок клиентов, регистр не важен), `formatted`, `numeric`, `maskable`. Порядок таблицы = порядок колонок в листе клиента.
2. **buildFieldPlan()** — идёт по колонкам листа; известная → field-конфиг; неизвестная (напр. `roundNumId`) → `__extra`, проходит как есть. Снимает обёртки агрегации Tableau: `SUM(BET)`→BET, `SECOND(Round Time)`→Round Time (и для маппинга, и для заголовка).
3. **OPPOSITE_PAIRS** — пары противопоставленных ставок (~100 значений): первый элемент → BANKER, второй → PLAYER. `isBanker()/isPlayer()`. Проверено: конфликтов нет.
4. Группировка брендов: Partner + SubPartner (если есть). Группа хранит PartnerName/SubPartnerName отдельно (для имён файлов).
5. Маскировка: при клике на чип бренда чужие строки маскируются как `<имя колонки клиента> <Группа>` (напр. `Player Id B`). Маскируются только player/operator/partner-поля (maskable: true). Раунды НЕ маскируются.
6. **Player List** — UserId + "/" + PartnerId по умолчанию; для клиентов из `PLAYER_GROUP_OVERRIDES` (Mac88: dashboards `mac88`, partners `machub`/`gapmac88`; RG: dashboards `rg` (как целое слово)/`royalgaming`, partners `rggap`/`rgst8`) — по SubPartnerId. Короткие ключи дашборда матчатся по целому слову. Кнопка **Copy Players** копирует список в буфер за один клик без попапа (`copyPlayerListNow()` → `copyTextToClipboard()`). Путь копирования: `execCommand('copy')` через **кэшируемый** textarea (создаётся один раз, 1×1 px в углу экрана — НЕ `left:-9999px`, иначе focus() вызывает scroll-into-view и пересчёт всей страницы: копирование висело на ~1300 мс; сейчас ~1 мс), повтор при false, затем `navigator.clipboard`. Если всё отказало — `selectTextFallback()` выделяет текст, чтобы нажать Ctrl+C. Список игроков в попапе — **один текстовый узел** (`#playerList.textContent = arr.join('\n')`, стиль `white-space:pre-wrap`), а не таблица DataTables: 100 игроков → открытие попапа ~2 мс, копирование ~7 мс. Фидбек "Copied N!". Попап со списком открывает кнопка **Players**; кнопка «Copy Player List» внутри попапа копирует и закрывает попап (крестик/подложка/Escape тоже закрывают).
7. **EXPORT TO EXCEL** — `exportCurrentViewExcel()`: экспортирует то, что сейчас на экране (включая маскировку), тем же генератором `buildWorkbookZip()` и с тем же форматом имени: `Example_<Partner_SubPartner или All>_<DateTime>.xlsx` (без `_LFS_`).
8. **EXPORT ALL EXAMPLES** — `exportExamplesPerPartner()`: один ZIP (`Examples_per_Partner_<ts>.zip`, без `_LFS_`), внутри отдельный .xlsx на партнёра, формат имени `Example_Partner_SubPartner_DateTime.xlsx`. Генератор свой: `buildWorkbookZip()` (JSZip, inlineStr). FULL example = `buildExampleRows(lastRowData)` по ВСЕМ данным, в каждом файле все строки example-раундов, чужие партнёры замаскированы. Excel-стили: шапка #EFFFFB + чёрный жирный, рамки thin, всё по центру, отрицательные красным, автоширина колонок.

## Покрытые варианты колонок (12+ клиентов проверено тестом)
Дата: Created/Created At/Finished At/Round Start Time/Round Time/Second of Round Time/Second of Timestamp; Partner: Partner Id/Company Code/Casino Id/Casino Code/Operator Id/Operator Name; SubPartner: Sub Partner Id/Ho/Sub Operator Id/Brand Code; UserId: Player Id/Player ID/Internal Player Id/External Player Id/User Id; UserName: Username/Player Name/Screen Name; также DealerId, Player IP, A, Ma, Game Type, Table Id, Bet Position/Bet_Position, Bet Type, Odds, Currency, BET, NET, BET EUR, NET EUR.

## Текущее состояние
Локальный редизайн/доработки помечены **v=17** (не запушено):
- `index.html`: тёмная шапка (gradient #043927→#000E0B), иконка двойной стрелки (неоновая влево + белая вправо, `.lfs-back`), Load (зелёная), Export Excel (ghost), меню "..." с Export All Examples (ZIP); суб-бар со статистикой + Example/Players; чипы брендов; футер records/rounds + дата.
- Loading state: спиннера НЕТ (убран по просьбе). До первого LOAD `body.is-loading` блюрит контент под шапкой (subbar, чипы, таблица, футер), шапка с кнопкой Load остаётся чёткой. show/hideGlobalLoader тогглят класс body.
- `application.js`: чипы `.lfs-chip`; `renderTableRows()` — бейджи Bet Position, деньги 0.00, NET со знаком и цветом; футер records/rounds; меню "..." toggle; дата в футере. EXAMPLE рендерится тем же новым view (`renderTableRows`).
- Excel: обе кнопки используют `buildWorkbookZip()` и один формат имён без `_LFS_`; деньги в формате `#,##0.00` (разделитель тысяч), отрицательные красным.

## Оставшиеся действия
1. Запушить после подтверждения пользователя (push → Pages → проверить build status).
2. При необходимости доверстать детали по реальному Tableau-виду (сейчас визуально проверено на `test-local.html`, в т.ч. `?manual`).

## Тесты (node)
- `C:\Users\LFS-PC3\AppData\Local\Temp\opencode\test-mapping.js` — маппинг колонок по 14 вариантам клиентов
- `test-positions.js` — классификация ~100 bet positions (читает репозиторий `C:\Users\LFS-PC3\opposite-betting-report\js\application.js`)
- `test-xlsx.js` — валидность генерируемого XLSX (стили: шапка #EFFFFB, рамки, красные отрицательные, экранирование)
- Требуется `npm i jszip` в temp-папке для test-xlsx.js

## Пользователь
Полина, antifraud-аналитик LFS. Общается транслитом по-русски. Предпочитает: сначала проверить/показать, потом пушить; короткие отчёты что сделано + как тестировать.
