# Universal Opposite Betting Report (Tableau Extension)

Один extension для **всех клиентов**. Больше не нужно копировать проект
под каждого клиента — колонки определяются автоматически **по имени**
через `sumdata.columns`, а не по жёстко зашитым индексам.

## Как это работает

1. Extension читает лист `Opposite` (имя задаётся в `WORKSHEET_NAME`
   в `js/application.js`).
2. Идёт по колонкам листа **в их оригинальном порядке**:
   - Колонка с известным именем (есть в `aliases` конфига `FIELDS`) —
     подключается к логике отчёта (суммы, маскировка, example).
   - **Незнакомая колонка (напр. `roundNumId`) проходит КАК ЕСТЬ** —
     с оригинальным именем, в оригинальной позиции, попадает в таблицу
     и в Excel-экспорт. Менять конфиг не нужно.
3. Заголовки таблицы берутся из листа клиента — как колонка названа,
   так и отображается.
4. Суммы BANKER/PLAYER считаются по значениям из списков
   `BANKER_POSITIONS` / `PLAYER_POSITIONS`.

## Как добавить нового клиента

Обычно **ничего делать не нужно** — неизвестные колонки проходят сами.

Конфиг трогать, только если:
- колонка клиента должна участвовать в логике (группировка по бренду,
  маскировка, суммы), но называется по-новому → добавьте имя в
  `aliases` соответствующего поля в `js/application.js`;
- у клиента новые значения BetPosition → добавьте их в
  `BANKER_POSITIONS` или `PLAYER_POSITIONS` (маленькими буквами).

## Покрытые варианты колонок

Проверено маппингом на всех 12 текущих вариантах:

- Дата: `Start Round Time`, `Created`, `Created At`, `Finished At`,
  `Round Start Time`, `Round Time`, `Second of Round Time`,
  `Second of Timestamp`
- Round: `Round Id`, `Round ID`
- Partner: `Partner Id`, `Company Code`, `Casino Id`, `Casino ID`,
  `Casino Code`, `Operator Id`, `Operator ID`, `Operator Name`
- SubPartner: `Sub Partner Id`, `Ho`, `Sub Operator Id`,
  `Sub Operator Name`, `Brand Code`
- Игрок: `Player Id`, `Player ID`, `Internal Player Id`
- Имя: `User Name`, `Username`, `Player Name`, `Screen Name`
- Прочее: `Dealer Id`, `Player IP`, `A`, `Ma`, `Game Type`,
  `Table Id`, `Table ID`, `Bet Position`, `Bet_Position`, `Bet Type`,
  `Currency`, `BET`, `NET`, `BET EUR`, `NET EUR`

## Установка

1. Залейте содержимое папки на хостинг (как раньше, напр. Glitch).
2. В `MAIN.trex` замените URL в `<source-location><url>` на свой.
3. Подключите `.trex` в дашборде Tableau. Лист с данными должен
   называться `Opposite` (или поменяйте `WORKSHEET_NAME`).

## Отладка

После нажатия LOAD в консоли браузера (F12) выводится `Column plan` —
видно, какая колонка клиента на какое поле смапилась, а какая прошла
как `__extra` (нераспознанная).
