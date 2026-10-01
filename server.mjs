import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const CHANNEL_ID = '-78856061819466';
const CHANNEL_URL = 'https://max.ru/channel_ai_minimalka';
const GIFT = '🎁 ЗАБРАТЬ ПОДАРОК';
const CHECK = '✅ ПРОВЕРИТЬ ПОДПИСКУ';
const MENU = '🏠 МЕНЮ';
const CATALOG = '📝 ПРОМПТЫ';
const SPORT = '🏒 КАЛЕНДАРЬ КЛУБА';
const READING = '📚 ПОЛЕЗНЫЕ МАТЕРИАЛЫ';
const SUGGEST = '💬 ПРЕДЛОЖИТЬ ТЕМУ';
const CANCEL = '❌ ОТМЕНА';
const OWNER_ID = '5386570';
const SIGN = '\n\nПОНЯЛ • ПРИНЯЛ • ПОВТОРИЛ';

export const categories = [
  { label: '💼 РАБОТА', items: [
    ['Деловое письмо', 'Помоги написать понятное деловое письмо. Кому: [адресат]. Ситуация: [описание]. Цель письма: [что нужно получить]. Тон: вежливый и спокойный. Предложи тему письма и короткий текст с конкретным следующим шагом. Не придумывай факты, суммы и сроки.'],
    ['План дня', 'Помоги составить реалистичный план дня. У меня [число] часов. Задачи: [список с примерной длительностью и сроками]. Выдели 3 приоритета, расставь задачи по порядку, добавь перерывы и запас времени. Если всё не помещается, предложи, что перенести.'],
    ['Краткое содержание', 'Сократи текст ниже до понятного конспекта: суть в 2 предложениях, 5 ключевых мыслей, решения и следующие действия. Если срок или ответственный не указан, так и напиши. Сохрани важные числа и оговорки. Текст: [вставь текст без личных и конфиденциальных данных].']
  ]},
  { label: '🏠 БЫТ', items: [
    ['Ужин из запасов', 'Предложи 3 варианта ужина из продуктов: [список]. Время: [минуты]. Порций: [число]. Ограничения и аллергии: [укажи]. Для каждого варианта дай ингредиенты с количеством и короткие шаги. Отдельно укажи, что придётся докупить. Не считай отсутствующие продукты имеющимися.'],
    ['Объявление о продаже', 'Напиши честное и живое объявление о продаже вещи. Что продаю: [вещь и модель]. Состояние: [описание, включая недостатки]. Цена: [сумма]. Комплект: [состав]. Передача: [условия]. Дай заголовок и короткий текст без выдуманных характеристик и фразы «идеальное состояние», если это не так.'],
    ['Уборка за полчаса', 'Составь план уборки на 30 минут для [комната или квартира]. Больше всего мешает: [описание]. Доступно: [инвентарь]. Дай действия по минутам: сначала то, что заметнее всего. Учти 5 минут на завершение. Не предлагай смешивать чистящие средства.']
  ]},
  { label: '🎓 УЧЁБА', items: [
    ['Объясни по-простому', 'Объясни тему [тема] человеку с уровнем [уровень]. Сначала суть простыми словами, затем бытовая аналогия, один разобранный пример и 3 вопроса для самопроверки. Если аналогия неточная, объясни её границы. Не перегружай терминами.'],
    ['План обучения', 'Помоги освоить [навык] за [срок]. Сейчас я умею [уровень], могу заниматься [минут] в день. Составь план по неделям с короткими практическими заданиями и проверяемым результатом. Отметь, чего реально достичь за этот срок, и не обещай профессиональный уровень за несколько дней.'],
    ['Проверь знания', 'Проверь мои знания по теме [тема], уровень [уровень]. Задавай по одному вопросу и жди моего ответа. Всего 5 вопросов: от простого к сложному. После каждого ответа объясняй ошибки, а в конце предложи, что повторить. Не показывай правильный ответ заранее.']
  ]},
  { label: '✍️ КОНТЕНТ', items: [
    ['Идеи для постов', 'Предложи 10 конкретных идей постов для канала о [тема]. Аудитория: [кто читает]. Уже публиковали: [темы]. Для каждой идеи дай заголовок, пользу для читателя и простой призыв к действию. Не повторяй опубликованное, не выдумывай статистику и новости.'],
    ['Сделай текст живее', 'Отредактируй текст ниже: убери канцелярит и повторы, сократи длинные предложения, сохрани смысл и мой голос. Добавь немного уместного юмора. Не добавляй новые факты и обещания. Дай готовый вариант и 3 главных изменения. Текст: [вставь текст].'],
    ['Сценарий сторис', 'Напиши сценарий сторис на 20 секунд по теме [тема]. Аудитория: [кто смотрит]. Дай 4 сцены по 5 секунд: кадр, короткая надпись и озвучка. Начни с понятного вопроса или ситуации, закончи действием для зрителя. Не используй вымышленные результаты и гарантии.']
  ]}
];

export const readingGroups = [
  { label: '📖 ОСНОВЫ AI', links: [
    ['Что такое промпт', 'AaCfpTnfY-w'],
    ['Как работает нейросеть', 'AaC4DbciQFM'],
    ['Почему AI выдумывает', 'AaDCyFCaWzI']
  ]},
  { label: '📖 AI ДЛЯ РАБОТЫ', links: [
    ['Рабочие письма', 'AaCqBEPuD4M'],
    ['План на день', 'AaCthmffA64'],
    ['Кратко о длинном документе', 'AaCvs_T-cbw']
  ]},
  { label: '📖 AI В БЫТУ', links: [
    ['Ужин за 20 минут', 'AaDweRCdDF0'],
    ['Меню на неделю', 'AaDRlL3PVX0'],
    ['Разобраться с ошибкой', 'AaC5-GoGNCg']
  ]},
  { label: '📖 ТЕКСТЫ И КАРТИНКИ', links: [
    ['Начать с чистого листа', 'AaCytP2yZkI'],
    ['Найти слабые места текста', 'AaDTug4pYQA'],
    ['Создать картинку', 'AaDsLnQgTxM']
  ]}
];

export const sportPrompt = `Создай календарь матчей моей команды в PDF для печати.

Команда: [название]
Вид спорта и лига: [укажи]
Сезон: [укажи]
Часовой пояс: [например, Екатеринбург]

1. Найди актуальные расписание, результаты и турнирную таблицу на официальных сайтах лиги и клуба. Укажи источники и дату проверки. Не выдумывай матчи, результаты или место команды. При расхождениях укажи их. Если у тебя нет доступа к интернету, попроси данные и не называй их актуальными.
2. Сделай PDF на одном листе A4, горизонтально. Белый фон, цвета клуба, крупный заголовок с названием команды и сезоном. Используй официальный логотип из проверенного источника; если получить его не удалось, не рисуй замену.
3. Сверху размести 4 карточки: место в своей конференции или общей таблице (укажи где), очки, сыгранные матчи, баланс результатов. Определи показатели по правилам выбранной лиги и подпиши обозначения. Для хоккея раздели победы и поражения в основное время, овертайме и по буллитам; для футбола используй В–Н–П.
4. Ниже — все матчи выбранного турнира в нескольких равномерных блоках. Колонки: дата и время в указанном часовом поясе, соперник, дома/в гостях, счёт. Подпиши, что счёт указан с точки зрения моей команды. У будущих матчей ставь тире. Переносы и неизвестное время отмечай явно.
5. Число матчей бери из официального расписания: не подгоняй его под шаблон. Если матчей 68, размести 4 блока по 17. Сохрани читабельность, не допускай обрезанных строк и наложения текста. Если всё не помещается разборчиво, предложи альтернативу перед изменением формата.
6. Проверь соответствие итогов карточек официальной таблице. Внизу укажи источники и дату обновления. Открой готовый PDF для проверки и дай файл для скачивания. Если создание файлов недоступно, честно сообщи об этом и выдай таблицу для переноса в документ.`;

const messageButton = text => ({ type: 'message', text });
const keyboard = rows => ({ type: 'inline_keyboard', payload: { buttons: rows } });
const menuKeyboard = () => keyboard([
  [messageButton(GIFT)], [messageButton(CATALOG)], [messageButton(SPORT)],
  [messageButton(READING)], [messageButton(SUGGEST)],
  [{ type: 'link', text: '📣 ОТКРЫТЬ КАНАЛ', url: CHANNEL_URL }], [messageButton(MENU)]
]);
const checkKeyboard = () => keyboard([
  [{ type: 'link', text: '📣 ОТКРЫТЬ КАНАЛ', url: CHANNEL_URL }],
  [messageButton(CHECK)], [messageButton(MENU)]
]);
const itemLabel = (category, index) => `${category + 1}.${index + 1} ${categories[category].items[index][0]}`;

export function createBot({ token, secret, pdfToken, fetchImpl = fetch }) {
  if (!token || !secret) throw new Error('Добавьте MAX_BOT_TOKEN и WEBHOOK_SECRET в Render.');
  const handled = new Map();
  const pending = new Map();
  const suggestions = new Map();
  const delivered = new Map();
  const lastSuggestion = new Map();
  function boundedSet(map, key, value) {
    map.set(key, value);
    if (map.size > 2000) map.delete(map.keys().next().value);
  }
  const cancelKeyboard = () => keyboard([[messageButton(CANCEL)], [messageButton(MENU)]]);
  const confirmSuggestion = userId => send(userId, 'Спасибо! Тема отправлена автору канала ✅', [menuKeyboard()]);

  async function api(path, body) {
    const response = await fetchImpl('https://platform-api2.max.ru' + path, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error('MAX HTTP ' + response.status);
    return response.json();
  }
  const send = (userId, text, attachments = []) => api('/messages?user_id=' + userId, { text, attachments });
  const showMenu = userId => send(userId,
    'Привет! 🤖 Это «AI на минималках».\n\nВыбирай, что пригодится сегодня:\n🎁 PDF с 15 готовыми промптами\n📝 Промпты для работы, быта, учёбы и контента\n🏒 Промпт для календаря любимого клуба\n📚 Полезные посты канала\n💬 Предложить тему автору\n\nМатериалы доступны подписчикам канала.' + SIGN,
    [menuKeyboard()]);

  async function runAction(userId, action) {
    if (action === 'reading') {
      await send(userId, '📚 ПОЛЕЗНЫЕ МАТЕРИАЛЫ\n\nВыбери раздел — внутри ссылки на посты нашего MAX-канала.',
        [keyboard([...readingGroups.map(g => [messageButton(g.label)]), [messageButton(MENU)]])]);
    } else if (action.startsWith('reading:')) {
      const group = readingGroups[Number(action.split(':')[1])];
      await send(userId, group.label + '\n\nНажми на нужный материал:',
        [keyboard([...group.links.map(([text, id]) => [{ type: 'link', text, url: CHANNEL_URL + '/' + id }]),
          [messageButton(READING)], [messageButton(MENU)]])]);
    } else if (action === 'suggest') {
      boundedSet(suggestions, String(userId), Date.now());
      await send(userId,
        '💬 ПРЕДЛОЖИТЬ ТЕМУ\n\nЧто хотелось бы разобрать на канале? Напиши одним текстовым сообщением, до 1500 символов.\n\nТекст и твой ID будут переданы автору канала. Не отправляй пароли и другие секреты.\n\nНа отправку — 15 минут. Передумал? Нажми «❌ ОТМЕНА».',
        [cancelKeyboard()]);
    } else if (action === 'gift') {
      if (!pdfToken) return send(userId, 'Подарок пока недоступен. Попробуй позже.', [menuKeyboard()]);
      try {
        await send(userId, 'Держи подарок! 🎁\n\n15 готовых промптов: выбирай задачу, копируй и пробуй.' + SIGN,
          [{ type: 'file', payload: { token: pdfToken } }, menuKeyboard()]);
      } catch (error) {
        console.error('Отправка PDF:', error.message);
        await send(userId, 'Подписка подтверждена ✅ Но PDF не отправился. Попробуй забрать подарок чуть позже.', [menuKeyboard()]);
      }
    } else if (action === 'catalog') {
      await send(userId, '📝 ПРОМПТЫ\n\nВыбери раздел. В каждом — 3 готовых запроса. Заменяй текст в квадратных скобках своими данными.',
        [keyboard([...categories.map(c => [messageButton(c.label)]), [messageButton(MENU)]])]);
    } else if (action === 'sport') {
      await send(userId, '🏒 КАЛЕНДАРЬ ЛЮБИМОГО КЛУБА\n\nСкопируй запрос ниже в нейросеть с поиском в интернете и созданием PDF. Заполни поля в квадратных скобках.\n\n' + sportPrompt,
        [keyboard([[messageButton(MENU)]])]);
    } else if (action.startsWith('category:')) {
      const ci = Number(action.split(':')[1]);
      const category = categories[ci];
      await send(userId, category.label + '\n\nВыбери задачу:',
        [keyboard([...category.items.map((_, i) => [messageButton(itemLabel(ci, i))]), [messageButton(CATALOG)], [messageButton(MENU)]])]);
    } else if (action.startsWith('prompt:')) {
      const [, ci, pi] = action.split(':').map((v, i) => i ? Number(v) : v);
      const [title, prompt] = categories[ci].items[pi];
      await send(userId, '📝 ' + title + '\n\nСкопируй запрос и заполни квадратные скобки:\n\n' + prompt + SIGN,
        [keyboard([[messageButton(categories[ci].label)], [messageButton(CATALOG)], [messageButton(MENU)]])]);
    }
  }

  function actionFor(text) {
    if ([READING, '/reading'].includes(text)) return 'reading';
    if ([SUGGEST, '/suggest'].includes(text)) return 'suggest';
    for (let i = 0; i < readingGroups.length; i++) {
      if (text === readingGroups[i].label) return 'reading:' + i;
    }
    if ([GIFT, '/gift'].includes(text)) return 'gift';
    if ([CATALOG, '/prompts'].includes(text)) return 'catalog';
    if ([SPORT, '/sport', '/calendar'].includes(text)) return 'sport';
    for (let ci = 0; ci < categories.length; ci++) {
      if (text === categories[ci].label) return 'category:' + ci;
      for (let pi = 0; pi < categories[ci].items.length; pi++) {
        if (text === itemLabel(ci, pi)) return `prompt:${ci}:${pi}`;
      }
    }
    return null;
  }

  async function route(userId, text, messageId) {
    const key = String(userId);
    if (delivered.has(messageId)) return confirmSuggestion(userId);
    if ([CANCEL, '/cancel'].includes(text)) {
      suggestions.delete(key);
      pending.delete(key);
      return send(userId, 'Отменено. Выбирай, что пригодится 👇', [menuKeyboard()]);
    }
    if (text === '/myid') {
      suggestions.delete(key);
      return send(userId, 'Твой ID в MAX: ' + userId, [menuKeyboard()]);
    }
    const navigating = actionFor(text) || [CHECK, MENU, '/start', '/menu', 'Меню', 'меню'].includes(text);
    if (suggestions.has(key) && !navigating) {
      if (Date.now() - suggestions.get(key) > 900000) {
        suggestions.delete(key);
        return send(userId, 'Время отправки истекло. Нажми «💬 ПРЕДЛОЖИТЬ ТЕМУ» ещё раз.', [menuKeyboard()]);
      }
      if (!text || text.length > 1500) {
        return send(userId, 'Пришли тему текстом: от 1 до 1500 символов.', [cancelKeyboard()]);
      }
      if (Date.now() - (lastSuggestion.get(key) || 0) < 60000) {
        return send(userId, 'Предыдущая тема уже отправлена. Подожди минуту перед следующей.', [cancelKeyboard()]);
      }
      let member;
      try {
        const result = await api('/chats/' + CHANNEL_ID + '/members?user_ids=' + encodeURIComponent(key));
        if (!Array.isArray(result.members)) throw new Error('Неожиданный ответ о подписке.');
        member = result.members.some(m => String(m.user_id) === key);
      } catch (error) {
        console.error('Проверка перед отправкой темы:', error.message);
        return send(userId, 'Не удалось проверить подписку. Тема не отправлена. Пришли её ещё раз чуть позже.', [cancelKeyboard()]);
      }
      if (!member) {
        suggestions.delete(key);
        boundedSet(pending, key, { action: 'suggest', time: Date.now() });
        return send(userId, 'Подпишись на канал, затем нажми проверку и отправь тему повторно.', [checkKeyboard()]);
      }
      try {
        await send(OWNER_ID, '💬 НОВАЯ ТЕМА ДЛЯ КАНАЛА\nID отправителя: ' + key + '\n\n' + text);
      } catch (error) {
        console.error('Доставка темы автору:', error.message);
        return send(userId, 'Не удалось доставить тему автору. Попробуй отправить её позже.', [cancelKeyboard()]);
      }
      boundedSet(delivered, messageId, true);
      boundedSet(lastSuggestion, key, Date.now());
      suggestions.delete(key);
      return confirmSuggestion(userId);
    }
    if (navigating) suggestions.delete(key);
    const remembered = pending.get(key);
    const action = text === CHECK
      ? (remembered && Date.now() - remembered.time < 3600000 ? remembered.action : 'gift')
      : actionFor(text);
    if (!action) {
      pending.delete(key);
      return showMenu(userId);
    }
    pending.set(key, { action, time: Date.now() });
    if (pending.size > 2000) pending.delete(pending.keys().next().value);
    let subscribed;
    try {
      const result = await api('/chats/' + CHANNEL_ID + '/members?user_ids=' + encodeURIComponent(key));
      if (!Array.isArray(result.members)) throw new Error('Неожиданный ответ о подписке.');
      subscribed = result.members.some(member => String(member.user_id) === key);
    } catch (error) {
      console.error('Проверка подписки:', error.message);
      return send(userId, 'Не получилось проверить подписку. Нажми кнопку проверки чуть позже.', [checkKeyboard()]);
    }
    if (!subscribed) return send(userId,
      'Материалы — для подписчиков 🎁\n\nОткрой канал и подпишись. Затем вернись сюда и нажми «✅ ПРОВЕРИТЬ ПОДПИСКУ».', [checkKeyboard()]);
    pending.delete(key);
    await runAction(userId, action);
  }

  async function handle(update) {
    if (update?.update_type !== 'message_created') return;
    const message = update.message;
    if (message?.recipient?.chat_type !== 'dialog' || !message.sender || message.sender.is_bot) return;
    const userId = message.sender.user_id;
    const id = message.body?.mid;
    if (userId == null || !id) return;
    if (handled.has(id)) return handled.get(id);
    const task = route(userId, message.body?.text?.trim() || '', id);
    handled.set(id, task);
    try { await task; } catch (error) { handled.delete(id); throw error; }
    if (handled.size > 1000) handled.delete(handled.keys().next().value);
  }

  function authorized(value) {
    const actual = Buffer.from(String(value || ''));
    const expected = Buffer.from(secret);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  return { handle, api, authorized };
}

export function createServer(bot) {
  const server = http.createServer(async (request, response) => {
    const reply = (status, text) => {
      if (response.writableEnded) return;
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(text);
    };
    if (request.method === 'GET' && request.url === '/') return reply(200, 'AI на минималках: сервер работает. Версия 3.');
    if (request.method !== 'POST' || request.url !== '/webhook') return reply(404, 'Not found');
    if (!bot.authorized(request.headers['x-max-bot-api-secret'])) return reply(403, 'Forbidden');
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 262144) return reply(413, 'Payload too large');
        chunks.push(chunk);
      }
      let update;
      try { update = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { return reply(400, 'Invalid JSON'); }
      await bot.handle(update);
      reply(200, 'OK');
    } catch (error) {
      console.error('Ошибка обработки:', error.message);
      reply(503, 'Retry later');
    }
  });
  server.requestTimeout = 20000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const bot = createBot({
    token: process.env.MAX_BOT_TOKEN?.trim(),
    secret: process.env.WEBHOOK_SECRET?.trim(),
    pdfToken: process.env.PDF_FILE_TOKEN?.trim()
  });
  const info = await bot.api('/me');
  console.log('MAX подключён:', info.first_name);
  createServer(bot).listen(Number(process.env.PORT || 10000), '0.0.0.0', () => console.log('Сервер запущен. Версия 3.'));
}
