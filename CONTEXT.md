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
Текущая задеплоенная версия: **v=14**. Локально незапушенный редизайн помечен v=15.

## Архитектура js/application.js
1. **FIELDS** — конфиг полей: `key`, `aliases` (имена колонок клиентов, регистр не важен), `formatted`, `numeric`, `maskable`. Порядок таблицы = порядок колонок в листе клиента.
2. **buildFieldPlan()** — идёт по колонкам листа; известная → field-конфиг; неизвестная (напр. `roundNumId`) → `__extra`, проходит как есть. Снимает обёртки агрегации Tableau: `SUM(BET)`→BET, `SECOND(Round Time)`→Round Time (и для маппинга, и для заголовка).
3. **OPPOSITE_PAIRS** — пары противопоставленных ставок (~100 значений): первый элемент → BANKER, второй → PLAYER. `isBanker()/isPlayer()`. Проверено: конфликтов нет.
4. Группировка брендов: Partner + SubPartner (если есть). Группа хранит PartnerName/SubPartnerName отдельно (для имён файлов).
5. Маскировка: при клике на чип бренда чужие строки маскируются как `<имя колонки клиента> <Группа>` (напр. `Player Id B`). Маскируются только player/operator/partner-поля (maskable: true). Раунды НЕ маскируются.
6. **Player List** — всегда UserId + "/" + PartnerId (без subpartner).
7. **EXPORT TO EXCEL** — старый механизм DataTables excelHtml5 (LoadDataTables + trigger .buttons-excel). ⚠️ экспортирует то, что на экране (включая маскировку).
8. **EXPORT ALL EXAMPLES** — `exportExamplesPerPartner()`: один ZIP (`Examples_per_Partner_LFS_<ts>.zip`), внутри отдельный .xlsx на партнёра, формат имени `Example_Partner_SubPartner_DateTime.xlsx`. Генератор свой: `buildWorkbookZip()` (JSZip, inlineStr). FULL example = `buildExampleRows(lastRowData)` по ВСЕМ данным, в каждом файле все строки example-раундов, чужие партнёры замаскированы. Excel-стили: шапка #EFFFFB + чёрный жирный, рамки thin, всё по центру, отрицательные красным, автоширина колонок.

## Покрытые варианты колонок (12+ клиентов проверено тестом)
Дата: Created/Created At/Finished At/Round Start Time/Round Time/Second of Round Time/Second of Timestamp; Partner: Partner Id/Company Code/Casino Id/Casino Code/Operator Id/Operator Name; SubPartner: Sub Partner Id/Ho/Sub Operator Id/Brand Code; UserId: Player Id/Player ID/Internal Player Id/External Player Id/User Id; UserName: Username/Player Name/Screen Name; также DealerId, Player IP, A, Ma, Game Type, Table Id, Bet Position/Bet_Position, Bet Type, Odds, Currency, BET, NET, BET EUR, NET EUR.

## Текущее состояние (НЕЗАВЕРШЁННАЯ РАБОТА)
Локально сделан редизайн v15 по макету пользователя (НЕ запушено, не проверено в браузере до конца):
- `index.html` переписан: тёмная шапка (gradient #043927→#000E0B) с заголовком OPPOSITE BETTING, кнопки Load (зелёная), Export Excel (ghost), меню "..." с Export All Examples (ZIP); суб-бар: "Banker amount X | Player amount X" + кнопки Example/Players (с бейджем счётчика); чипы брендов; футер "N records · M rounds" + дата.
- `css/style.css` переписан полностью (классы lfs-*).
- `application.js`: чипы брендов → `.lfs-chip` (partner | subpartner); `renderTableRows()` — бейджи Bet Position (badge-banker мятный / badge-player лавандовый / badge-neutral), деньги формат 0.00, NET со знаком и цветом (num-pos/num-neg), MONEY_KEYS=['Amount','Net','AmountEUR','NetEUR'], футер records/rounds; меню "..." toggle; дата в футере.

## Открытые задачи от пользователя (TODO)
1. **"vivesti all example tozhe na etot view"** — результат EXAMPLE / export all examples должен отображаться в этом же новом view (проверить, что renderTableRows используется везде).
2. **Loading state:** пока LOAD не нажат — в центре экрана показывать "load players" (спиннер/плейсхолдер).
3. Допроверить v15 визуально (локальный стенд `test-local.html` — генерируется из index.html заменой tableau-extensions script на мок; сервер `node` на порту 8123 уже запускался фоном) и запушить.
4. Баг-риск: маскировка восстанавливает ячейки через `data-maskvalue` (сырой текст) — для Bet Position/денег форматирование (бейджи) при восстановлении теряется не должно, т.к. эти поля не maskable. Проверить.
5. Возможно перевести обычный EXPORT TO EXCEL на свой генератор buildWorkbookZip (сейчас DataTables со старым оформлением).

## Тесты (node)
- `C:\Users\LFS-PC3\AppData\Local\Temp\opencode\test-mapping.js` — маппинг колонок по 14 вариантам клиентов
- `test-positions.js` — классификация ~100 bet positions
- `test-xlsx.js` — валидность генерируемого XLSX (стили, рамки, красные отрицательные, экранирование)
- Требуется `npm i jszip` в temp-папке для test-xlsx.js

## Пользователь
Полина, antifraud-аналитик LFS. Общается транслитом по-русски. Предпочитает: сначала проверить/показать, потом пушить; короткие отчёты что сделано + как тестировать.
