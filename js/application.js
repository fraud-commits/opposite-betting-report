// ============================================================================
// UNIVERSAL OPPOSITE BETTING REPORT
// Один extension для всех клиентов.
//
// Как это работает:
// 1. Колонки находятся ПО ИМЕНИ (sumdata.columns), а не по индексу.
// 2. Порядок и заголовки колонок берутся ИЗ ЛИСТА клиента — как в источнике.
// 3. Нераспознанные колонки (напр. roundNumId) проходят КАК ЕСТЬ —
//    с оригинальным именем, в оригинальной позиции. Конфиг менять не нужно.
// 4. Чтобы extension "понимал" новую колонку (маскировка, суммы и т.д.) —
//    добавьте её имя в aliases соответствующего поля в FIELDS ниже.
// ============================================================================

// ---------- КОНФИГУРАЦИЯ ----------

const WORKSHEET_NAME = 'Opposite'; // имя листа с данными

// Известные поля. Имя колонки клиента ищется в aliases (регистр не важен).
// key       — внутреннее имя поля (по нему работает логика отчёта)
// aliases   — возможные имена колонки в листе клиента
// formatted — брать formattedValue вместо value
// numeric   — поле участвует в суммах (Amount)
// maskable  — поле маскируется при выборе бренда
//             (текст маски = оригинальное имя колонки клиента + группа)
const FIELDS = [
  { key: 'Createdate',  aliases: ['Createdate', 'Create Date', 'Start Round Time', 'Round Start Time', 'Round Time', 'Created', 'Created At', 'Finished At', 'Second of Round Time', 'Second of Timestamp', 'Date'], formatted: true },
  { key: 'Gameid',      aliases: ['Gameid', 'Game Id', 'Game ID', 'Round Id', 'Round ID'] },
  { key: 'DealerId',    aliases: ['DealerId', 'Dealer Id', 'Dealer ID'] },
  { key: 'Partner',     aliases: ['Partner', 'Partner Id', 'PartnerID', 'Company Code', 'CompanyCode', 'Casino Id', 'Casino ID', 'Casino Code', 'Operator Id', 'Operator ID', 'Operator Name'], maskable: true },
  { key: 'SubPartner',  aliases: ['SubPartner', 'Sub Partner Id', 'SubPartnerID', 'Ho', 'Sub Operator Id', 'Sub Operator Name', 'Brand Code'], maskable: true },
  { key: 'OperatorID',  aliases: ['OperatorID', 'Operator User id', 'Operator User Id'], maskable: true },
  { key: 'UserId',      aliases: ['UserId', 'User Id', 'UserID', 'Player Id', 'Player ID', 'Internal Player Id', 'External Player Id', 'Casino player id', 'Casino Player Id'], maskable: true },
  { key: 'UserName',    aliases: ['UserName', 'User Name', 'Username', 'Player Name', 'Screen Name'], maskable: true },
  { key: 'Ip',          aliases: ['Ip', 'IP', 'Player IP', 'Ip Address'], formatted: true, maskable: true },
  { key: 'TableType',   aliases: ['TableType', 'Table Type', 'GameType', 'Game Type'] },
  { key: 'A',           aliases: ['A'], formatted: true, maskable: true },
  { key: 'Ma',          aliases: ['Ma'], formatted: true, maskable: true },
  { key: 'TableId',     aliases: ['TableId', 'Table Id', 'Table ID', 'TableCode', 'Table Code'], formatted: true },
  { key: 'BetPosition', aliases: ['BetPosition', 'Bet Position', 'Bet_Position'], formatted: true },
  { key: 'Odds',        aliases: ['Odds'] },
  { key: 'BetType',     aliases: ['Bet Type', 'BetType'] },
  { key: 'Currency',    aliases: ['Currency'] },
  { key: 'Amount',      aliases: ['Amount', 'BET', 'Bet', 'Bet Amount'], numeric: true },
  { key: 'Net',         aliases: ['Net'] },
  { key: 'AmountEUR',   aliases: ['BETEUR', 'Bet EUR', 'Amount EUR', 'AmountEUR'] },
  { key: 'NetEUR',      aliases: ['NetEUR', 'Net EUR'] },
];

// Пары противоположных ставок (lower-case):
// первый элемент пары -> группа BANKER, второй -> группа PLAYER.
// Новый клиент с новыми значениями BetPosition -> просто добавьте пару сюда.
const OPPOSITE_PAIRS = [
  // Baccarat
  ['banker', 'player'],
  ['banker_no_commission', 'player_no_commission'],
  // Roulette
  ['red', 'black'],
  ['even', 'odd'],
  ['low', 'high'],
  // Sic Bo
  ['odd_sicbo', 'even_sicbo'],
  ['big', 'small'],
  // Cricket / sports
  ['rsa', 'eng'],
  ['pak', 'sl'],
  ['aus', 'ind'],
  ['batsman', 'bowler'],
  ['bowler red', 'bowler black'],
  ['batsman black', 'batsman red'],
  // Roulette variants (named ranges)
  ['low(1-18)', 'high(19-36)'],
  ['from1to18.from1to18', 'from19to36.from19to36'],
  ['even.even', 'odd.odd'],
  ['red.red', 'black.black'],
  ['first_half', 'second_half'],
  // A/B games (Teen Patti, Baccarat variants)
  ['player a', 'player b'],
  ['player a main', 'player b main'],
  ['3 baccarat a', '3 baccarat b'],
  ['mini baccarat a', 'mini baccarat b'],
  ['m baccarat a', 'm baccarat b'],
  ['red a', 'black a'],
  ['red b', 'black b'],
  ['total a', 'total b'],
  ['1st bet a', '1st bet b'],
  ['2nd bet a', '2nd bet b'],
  ['winner a', 'winner b'],
  ['player_a_0', 'player_b_0'],
  ['barati j-a', 'dulha dulhan k-q'],
  ['position_j_a', 'position_k_q'],
  // Dragon Tiger
  ['dragon', 'tiger'],
  ['dragon - black', 'dragon - red'],
  ['tiger - black', 'tiger - red'],
  ['dragon black', 'dragon red'],
  // Andar Bahar
  ['andar', 'bahar'],
  // Even/Odd + Over/Under variants (PlayerGeneralInfos)
  ['bankereven', 'bankerodd'],
  ['playereven', 'playerodd'],
  ['bankerover', 'bankerunder'],
  ['playerover', 'playerunder'],
  ['awayeven', 'awayodd'],
  ['awayover', 'awayunder'],
  ['homeeven', 'homeodd'],
  ['homeover', 'homeunder'],
  // High/Low card games
  ['high card', 'low card'],
  ['high card a', 'high card b'],
  // 7 Up 7 Down
  ['under 7', 'over 7'],
  ['under7', 'over 7'],
  ['7down', '7up'],
  ['7 down dealer', '7 up dealer'],
  // even/odd variants
  ['even single', 'odd single'],
  ['player 8 even', 'player 8 odd'],
  ['player 9 even', 'player 9 odd'],
  ['player 10 even', 'player 10 odd'],
  ['player 11 even', 'player 11 odd'],
  // color suffix variants
  ['black d', 'red d'],
  ['black t', 'red t'],
  ['black l', 'red l'],
  ['center - red', 'center - black'],
  ['left - red', 'left - black'],
  ['right - red', 'right - black'],
  ['lion - red', 'lion - black'],
  // totals
  ['8 & 9 total', '10 & 11 total'],
  // line games
  ['line 1', 'line 2'],
  // champion/contender, red/blue
  ['champion', 'contender'],
  ['red', 'blue'],
  // Craps
  ['pass_line', 'dont_pass_line'],
  ['come', 'dont_come'],
  // numbered craps variants (4,5,6,8,9,10)
  ...[4, 5, 6, 8, 9, 10].flatMap(n => [
    ['pass_line_' + n, 'dont_pass_line_' + n],
    ['come_' + n, 'dont_come_' + n],
    ['take_odds_' + n, 'lay_odds_' + n],
    ['win_' + n, 'lose_' + n],
  ]),
];

// Списки сторон строятся из пар автоматически (первое вхождение побеждает)
const BANKER_POSITIONS = [];
const PLAYER_POSITIONS = [];
OPPOSITE_PAIRS.forEach(([left, right]) => {
  if (!BANKER_POSITIONS.includes(left) && !PLAYER_POSITIONS.includes(left)) BANKER_POSITIONS.push(left);
  if (!PLAYER_POSITIONS.includes(right) && !BANKER_POSITIONS.includes(right)) PLAYER_POSITIONS.push(right);
});
// Исключение: пара Player/Dealer — 'player' уже на стороне PLAYER,
// поэтому 'dealer' добавляем на противоположную сторону вручную
BANKER_POSITIONS.push('dealer');

// ---------- КОНЕЦ КОНФИГУРАЦИИ ----------


let currentBrand = "No Brand name selected";
let TicketCount = 0;

// Данные последней загрузки — нужны кнопке EXPORT ALL EXAMPLES
let lastRowData = [];
let lastGroups = [];
let lastPlan = [];

const isBanker = pos => BANKER_POSITIONS.includes(String(pos).trim().toLowerCase());
const isPlayer = pos => PLAYER_POSITIONS.includes(String(pos).trim().toLowerCase());

// Построить план колонок: идём по колонкам листа В ИХ ПОРЯДКЕ.
// Известная колонка -> её field-конфиг (с оригинальным именем как заголовком).
// Неизвестная колонка -> generic-поле, проходит как есть.
function buildFieldPlan(sumdata) {
  const usedKeys = new Set();
  const plan = [];

  sumdata.columns.forEach((col, idx) => {
    const name = String(col.fieldName).trim();
    // Tableau может оборачивать имя в агрегацию: SUM(BET), SECOND(Round Time) и т.д.
    // — пробуем матчить и полное имя, и внутреннее
    const aggMatch = name.match(/^[A-Za-z]+\((.*)\)$/);
    const innerName = aggMatch ? aggMatch[1].trim() : null;

    const field = FIELDS.find(f =>
      !usedKeys.has(f.key) &&
      f.aliases.some(a =>
        a.toLowerCase() === name.toLowerCase() ||
        (innerName && a.toLowerCase() === innerName.toLowerCase())
      )
    );

    // заголовок = имя без обёртки агрегации (SUM(BET) -> BET)
    const displayName = innerName || name;

    if (field) {
      usedKeys.add(field.key);
      // заголовок и текст маски = имя колонки у клиента (без SUM()/SECOND() и т.п.)
      plan.push(Object.assign({}, field, { header: displayName, maskLabel: displayName, index: idx }));
    } else {
      plan.push({ key: '__extra_' + idx, header: displayName, index: idx, extra: true });
    }
  });

  return plan;
}

// Построить <thead> таблицы по плану колонок
function buildHeader(plan) {
  const tr = document.getElementById('header-row');
  tr.innerHTML = '';
  plan.forEach(f => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = f.header;
    tr.appendChild(th);
  });
}


// Отрисовать строки в таблице по плану колонок
function renderTableRows(dataRows, plan) {
  if ($.fn.DataTable && $.fn.DataTable.isDataTable('#my-table')) {
    $('#my-table').DataTable().clear().destroy();
  }

  const tbody = document.getElementById("my-table").getElementsByTagName("tbody")[0];
  tbody.innerHTML = '';

  for (let i = 0; i < dataRows.length; i++) {
    const row = tbody.insertRow();

    plan.forEach((f, cellIndex) => {
      const cell = row.insertCell(cellIndex);
      const value = dataRows[i][f.key];
      cell.innerHTML = value;

      if (f.maskable) {
        cell.setAttribute("data-UniqueGroup", dataRows[i].UniqueGroup);
        cell.setAttribute("data-Uniqueidentifier", dataRows[i].Uniqueidentifier);
        cell.setAttribute("data-maskvalue", value);
        cell.setAttribute("data-masklabel", f.maskLabel);
      }
    });
  }
}

// Выборка example-раундов из переданных строк (логика кнопки EXAMPLE)
function buildExampleRows(rows) {
  const uniqueGameIds = [...new Set(rows.map(item => item.Gameid))];
  const resultArray = [];

  uniqueGameIds.forEach(gameId => {
    const gameData = { gameId: gameId };
    const playersInGame = [];

    rows.forEach(item => {
      if (item.Gameid === gameId) {
        const betPosition = item.BetPosition;
        if (isBanker(betPosition)) {
          gameData.BANKER = (gameData.BANKER || 0) + item.AmountNum;
        } else if (isPlayer(betPosition)) {
          gameData.PLAYER = (gameData.PLAYER || 0) + item.AmountNum;
        } else {
          gameData[betPosition] = (gameData[betPosition] || 0) + item.AmountNum;
        }
        playersInGame.push(item.UserId);
      }
    });

    gameData.players = [...new Set(playersInGame)];
    gameData.difference = (gameData.BANKER || 0) - (gameData.PLAYER || 0);
    gameData.differencePercentage = ((gameData.BANKER || 0) - (gameData.PLAYER || 0)) / (gameData.PLAYER || 1) * 100;
    resultArray.push(gameData);
  });

  const filteredArray = [];

  resultArray.forEach(gameData => {
    const uniquePlayers = [...new Set(gameData.players)];

    if (uniquePlayers.length > 0) {
      let exampleCount = uniquePlayers.length <= 5 ? 1 : 2;

      if (gameData.differencePercentage <= 45 && gameData.differencePercentage >= -45) {
        let bankerGames = filteredArray.filter(game => game.UserId === 'BANKER');
        let playerGames = filteredArray.filter(game => game.UserId === 'PLAYER');
        let topBankerGame = bankerGames.reduce((max, game) => max.BANKER > game.BANKER ? max : game, { BANKER: -Infinity });
        let topPlayerGame = playerGames.reduce((max, game) => max.PLAYER > game.PLAYER ? max : game, { PLAYER: -Infinity });

        if ((gameData.BANKER || 0) > topBankerGame.BANKER || (gameData.PLAYER || 0) > topPlayerGame.PLAYER) {
          const gameIdList = [];
          for (let i = 0; i < exampleCount; i++) {
            gameIdList.push(gameData.gameId);
          }
          filteredArray.push({
            UserId: gameData.BANKER >= gameData.PLAYER ? 'BANKER' : 'PLAYER',
            gameIdList,
            BANKER: gameData.BANKER || 0,
            PLAYER: gameData.PLAYER || 0,
            difference: gameData.difference || 0,
            differencePercentage: gameData.differencePercentage || 0
          });
        }
      }
    } else {
      return false;
    }
  });

  // Sort by highest rounds by banker or player amount
  filteredArray.sort((a, b) => {
    return Math.max(b.BANKER, b.PLAYER) - Math.max(a.BANKER, a.PLAYER);
  });

  return rows.filter(row => filteredArray.some(filteredRow => filteredRow.gameIdList.includes(row.Gameid)));
}

// Скачать example Excel для каждого бренда по отдельности
function exportExamplesPerPartner() {
  if (!lastRowData.length || !lastGroups.length) {
    alert('Сначала нажмите LOAD');
    return;
  }

  let idx = 0;

  function next() {
    if (idx >= lastGroups.length) return;

    const group = lastGroups[idx];
    const rows = lastRowData.filter(r => r.Uniqueidentifier === group.Uniqueidentifier);
    const exampleRows = buildExampleRows(rows);

    renderTableRows(exampleRows.length ? exampleRows : rows, lastPlan);

    currentBrand = group.Uniqueidentifier;
    LoadDataTables();
    $(".buttons-excel").trigger("click");

    idx++;
    setTimeout(next, 700); // пауза, чтобы браузер не блокировал множественные загрузки
  }

  next();
}


tableau.extensions.initializeAsync().then(function () {

  function getWorksheet() {
    const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
    return worksheets.find(w => w.name === WORKSHEET_NAME) || worksheets[0];
  }

  function LoadGameExample() {
    const worksheet = getWorksheet();

    worksheet.getSummaryDataAsync().then(function (sumdata) {
      const data = sumdata.data;
      const plan = buildFieldPlan(sumdata);

      console.log('Column plan:', plan.map(f => f.key + ' <- "' + f.header + '" [' + f.index + ']'));

      buildHeader(plan);

      const planField = key => plan.find(f => f.key === key);

      // читатель ячейки по полю плана, с обработкой %null%
      const val = (i, field) => {
        if (!field || field.index === undefined || field.index < 0) return '';
        const cell = data[i][field.index];
        let v = (field.formatted || field.extra) ? cell.formattedValue : cell.value;
        if (v === '%null%' || v === null || v === undefined) v = '';
        return v;
      };

      const partnerField = planField('Partner');
      const subPartnerField = planField('SubPartner');
      const userIdField = planField('UserId');
      const betPositionField = planField('BetPosition');
      const amountField = planField('Amount');

      // ключ группировки по бренду: Partner + SubPartner (если есть)
      const brandKey = i => String(val(i, partnerField)) +
                            (subPartnerField ? String(val(i, subPartnerField)) : '');

      const rowData = [];
      const Uniqueidentifier = [];
      let Banker = 0;
      let Player = 0;

      if ($.fn.DataTable && $.fn.DataTable.isDataTable('#my-table')) {
        $('#my-table').DataTable().clear().destroy();
      }
      $(".butoon-container").empty();
      $(".UserData").empty();

      for (let i = 0; i < data.length; i++) {
        const uid = brandKey(i);

        if (!Uniqueidentifier.some(obj => obj.Uniqueidentifier === uid)) {
          Uniqueidentifier.push({
            Uniqueidentifier: uid,
            UniqueGroup: String.fromCharCode(65 + Uniqueidentifier.length)
          });

          const partnerVal = val(i, partnerField);
          const subPartnerVal = subPartnerField ? val(i, subPartnerField) : '';

          const button = $("<button/>", {
            "data-Uniqueidentifier": uid,
            "data-UniqueGroup": String.fromCharCode(65 + Uniqueidentifier.length),
            id: "333"
          }).append(
            '<a href="#_" class="inline-flex overflow-hidden text-white bg-gray-900 rounded group">\n' +
            '  <span class="px-3.5 py-2 text-white bg-purple-500 group-hover:bg-purple-600 flex items-center justify-center">\n' +
            '    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>\n' +
            '<p class="margin-l"> ' + partnerVal + '</p>\n' +
            '  </span>\n' +
            '  <span class="pl-4 pr-5 py-2.5">' + subPartnerVal + '</span>\n' +
            '</a>'
          );

          $(".butoon-container").append(button);
        }

        // суммы BANKER / PLAYER
        const betPos = val(i, betPositionField);
        const amount = Number(val(i, amountField)) || 0;
        if (isBanker(betPos)) {
          Banker += amount;
        } else if (isPlayer(betPos)) {
          Player += amount;
        }

        // строка данных: все колонки плана + служебные поля
        const rowObj = { UniqueGroup: "no", Uniqueidentifier: uid };
        plan.forEach(f => { rowObj[f.key] = val(i, f); });
        rowObj.AmountNum = amount;
        rowObj.UniquePlayerID = String(val(i, userIdField)) + "/" + String(val(i, partnerField));

        for (let Y = 0; Y < Uniqueidentifier.length; Y++) {
          if (uid === Uniqueidentifier[Y].Uniqueidentifier) {
            rowObj.UniqueGroup = Uniqueidentifier[Y].UniqueGroup;
          }
        }

        rowData.push(rowObj);
      }

      console.log(rowData);


      function GetPlayerList() {
        let uniqueArray = [...new Set(rowData.map(item => item.UniquePlayerID))];

        console.log(uniqueArray);

        $(".player-list-count").html(uniqueArray.length);

        $('#myTable').DataTable({
          data: uniqueArray.map(id => [id]),
          searching: false,
          bPaginate: false,
          ordering: false,
          stateSave: true,
          bDestroy: true,
          destroy: true,
          pageLength: -1,
          dom: 'Bfrtip',
          buttons: [{
            extend: 'copyHtml5',
            text: '    ',
            title: '',
            columns: ':not(:last-child)'
          }],
          columns: [{ title: "" }]
        });

        $('title').remove();
      }

      GetPlayerList();


      // сохраняем для кнопки EXPORT ALL EXAMPLES
      lastRowData = rowData;
      lastGroups = Uniqueidentifier;
      lastPlan = plan;

      function PlayerExampleGenerator() {
        $(".UserData").empty();
        const matchingRows = buildExampleRows(rowData);
        GenerateHtmalTable(matchingRows);
      }


      function GenerateHtmalTable(matchingRows) {
        renderTableRows(matchingRows || rowData, plan);
      }

      GenerateHtmalTable();

      let bankerFormatted = Banker.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      $(".banker").html(bankerFormatted.replace(/[$]/g, ''));

      let playerFormatted = Player.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      $(".player").html(playerFormatted.replace(/[$]/g, ''));

      $("#example-btn").off("click").on("click", function () {
        PlayerExampleGenerator();
      });

      // Маскировка чужих брендов при клике на кнопку бренда
      $('button[data-Uniqueidentifier]').off("click").on("click", function () {
        var clickedUniqueId = $(this).attr('data-Uniqueidentifier');
        currentBrand = clickedUniqueId;

        $('td[data-Uniqueidentifier]').each(function () {
          var tdUniqueId = $(this).attr('data-Uniqueidentifier');
          if (tdUniqueId !== clickedUniqueId) {
            $(this).html($(this).attr('data-masklabel') + " " + $(this).attr('data-uniquegroup'));
          } else {
            $(this).html($(this).attr('data-maskvalue'));
          }
        });
      });

    });
  }


  $("#load").on("click", function () {
    $(".butoon-container").empty();
    LoadGameExample();
  });
});


function LoadDataTables() {
  TicketCount += 1;

  // Get current timestamp in 24-hour format with seconds
  let now = new Date();
  let timestamp = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, '0') + "-" +
    String(now.getDate()).padStart(2, '0') + "_" +
    String(now.getHours()).padStart(2, '0') + "-" +
    String(now.getMinutes()).padStart(2, '0') + "-" +
    String(now.getSeconds()).padStart(2, '0');

  $('#my-table').DataTable({
    "searching": false,
    "bPaginate": false,
    "ordering": false,
    stateSave: true,
    "bDestroy": true,
    dom: 'Bfrtip',
    buttons: [{
      extend: 'excelHtml5',
      title: '',
      filename: "Example_" + currentBrand + "_LFS_" + TicketCount + "_" + timestamp,
      text: 'Excel',

      customize: function (xlsx) {
        var sheet = xlsx.xl.worksheets['sheet1.xml'];

        // jQuery selector to add a border
        $('row c[r]', sheet).attr('s', '25');
        $('row:first c', sheet).attr('s', '47');
      },
    }]
  });
}


$("#export-btn").on("click", function () {
  LoadDataTables();
  $(".buttons-excel").trigger("click");
});


$("#export-all-btn").on("click", function () {
  exportExamplesPerPartner();
});


function openPopup(title, desc) {
  // Get the elements for the popup
  const popupOverlay = document.getElementById('popupOverlay');
  const popupContent = document.getElementById('popupContent');
  const popupTitle = document.getElementById('popupTitle');
  const popupDesc = document.getElementById('popupDesc');
  const copyButton = document.getElementById('copyButton');

  // Set the content and show the popup
  popupTitle.innerText = title;
  popupDesc.innerText = desc;
  popupOverlay.classList.remove('hidden');
  popupContent.classList.remove('hidden');

  // Add event listener to close the popup when copy button is pressed
  copyButton.addEventListener('click', function () {
    $(".buttons-copy").trigger("click");
    popupOverlay.classList.add('hidden');
    popupContent.classList.add('hidden');
  });
}
