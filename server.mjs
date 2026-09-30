import http from "node:http";
import { timingSafeEqual } from "node:crypto";

const token = process.env.MAX_BOT_TOKEN?.trim();
const secret = process.env.WEBHOOK_SECRET?.trim();
const apiBase = "https://" + "platform-api2.max.ru";

if (!token || !secret) {
  throw new Error("Добавьте MAX_BOT_TOKEN и WEBHOOK_SECRET в Render.");
}

async function api(path, body) {
  const response = await fetch(apiBase + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: token,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error("MAX HTTP " + response.status);
  }

  return response.json();
}

function authorized(value) {
  const actual = Buffer.from(String(value || ""));
  const expected = Buffer.from(secret);
  return actual.length === expected.length &&
    timingSafeEqual(actual, expected);
}

const CHANNEL_ID = "-78856061819466";
const CHANNEL_URL = "https://" + "max.ru/channel_ai_minimalka";
const pdfToken = process.env.PDF_FILE_TOKEN?.trim();

const GIFT = "🎁 ЗАБРАТЬ ПОДАРОК";
const CHECK = "✅ ПРОВЕРИТЬ ПОДПИСКУ";
const MENU = "🏠 МЕНЮ";

const handled = new Map();

function keyboard(checkSubscription = false) {
  return {
    type: "inline_keyboard",
    payload: {
      buttons: [
        [{
          type: "message",
          text: checkSubscription ? CHECK : GIFT
        }],
        [{
          type: "link",
          text: "📣 ОТКРЫТЬ КАНАЛ",
          url: CHANNEL_URL
        }],
        [{
          type: "message",
          text: MENU
        }]
      ]
    }
  };
}

function send(userId, text, attachments = []) {
  return api("/messages?user_id=" + userId, {
    text,
    attachments
  });
}

async function showMenu(userId) {
  await send(
    userId,
    "Привет! 🤖 Это «AI на минималках».\n\n" +
    "Здесь можно забрать подарок — PDF с 15 готовыми промптами " +
    "для жизни, работы и повседневных задач.\n\n" +
    "Подпишись на канал и нажми «🎁 ЗАБРАТЬ ПОДАРОК».\n\n" +
    "ПОНЯЛ • ПРИНЯЛ • ПОВТОРИЛ",
    [keyboard()]
  );
}

async function giveGift(userId) {
  if (!pdfToken) {
    console.error("Не настроен PDF_FILE_TOKEN.");
    await send(
      userId,
      "Подарок пока недоступен. Попробуй немного позже.",
      [keyboard()]
    );
    return;
  }

  let subscribed;

  try {
    const result = await api(
      "/chats/" + CHANNEL_ID +
      "/members?user_ids=" + encodeURIComponent(String(userId))
    );

    if (!Array.isArray(result.members)) {
      throw new Error("Неожиданный формат ответа о подписке.");
    }

    subscribed = result.members.some(
      member => String(member.user_id) === String(userId)
    );
  } catch (error) {
    console.error("Проверка подписки:", error.message);
    await send(
      userId,
      "Не получилось проверить подписку. " +
      "Попробуй нажать кнопку проверки чуть позже.",
      [keyboard(true)]
    );
    return;
  }

  if (!subscribed) {
    await send(
      userId,
      "🎁 Подарок — для подписчиков нашего канала.\n\n" +
      "1. Нажми «📣 ОТКРЫТЬ КАНАЛ» и подпишись.\n" +
      "2. Вернись сюда и нажми «✅ ПРОВЕРИТЬ ПОДПИСКУ».",
      [keyboard(true)]
    );
    return;
  }

  try {
    await send(
      userId,
      "Держи подарок! 🎁\n\n" +
      "15 готовых промптов: выбирай задачу, копируй и пробуй.\n" +
      "Первый результат ближе, чем кажется 😉\n\n" +
      "ПОНЯЛ • ПРИНЯЛ • ПОВТОРИЛ",
      [
        { type: "file", payload: { token: pdfToken } },
        keyboard()
      ]
    );
    console.log("PDF отправлен подписчику.");
  } catch (error) {
    console.error("Отправка PDF:", error.message);
    await send(
      userId,
      "Подписка подтверждена ✅\n" +
      "Но отправить PDF сейчас не получилось. Попробуй ещё раз чуть позже.",
      [keyboard()]
    );
  }
}

async function handle(update) {
  if (update.update_type !== "message_created") return;

  const message = update.message;
  if (message?.recipient?.chat_type !== "dialog") return;
  if (!message.sender || message.sender.is_bot) return;

  const id = message.body?.mid;
  if (!id) return;

  if (handled.has(id)) {
    await handled.get(id);
    return;
  }

  const userId = message.sender.user_id;
  const text = message.body?.text?.trim() || "";

  const task = (async () => {
    if ([GIFT, CHECK, "/gift"].includes(text)) {
      await giveGift(userId);
    } else {
      await showMenu(userId);
    }
  })();

  handled.set(id, task);

  try {
    await task;
  } catch (error) {
    handled.delete(id);
    throw error;
  }

  if (handled.size > 1000) {
    handled.delete(handled.keys().next().value);
  }
}
const bot = await api("/me");
console.log("MAX подключён:", bot.first_name);

const server = http.createServer(async (request, response) => {
  const reply = (status, text) => {
    response.writeHead(status, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    response.end(text);
  };

  if (request.method === "GET" && request.url === "/") {
    return reply(200, "AI на минималках: сервер работает.");
  }

  if (request.method !== "POST" || request.url !== "/webhook") {
    return reply(404, "Not found");
  }

  if (!authorized(request.headers["x-max-bot-api-secret"])) {
    return reply(403, "Forbidden");
  }

  try {
    const chunks = [];
    let size = 0;

    for await (const chunk of request) {
      size += chunk.length;
      if (size > 262144) return reply(413, "Payload too large");
      chunks.push(chunk);
    }

    let update;
    try {
      update = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return reply(400, "Invalid JSON");
    }

    await handle(update);
    reply(200, "OK");
  } catch (error) {
    console.error("Ошибка обработки:", error.message);
    reply(503, "Retry later");
  }
});

server.requestTimeout = 20000;
server.listen(Number(process.env.PORT || 10000), "0.0.0.0", () => {
  console.log("Сервер запущен.");
});
