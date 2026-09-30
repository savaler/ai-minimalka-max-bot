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

// Защита от повторной обработки в пределах текущего запуска.
const handled = new Map();

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

  const task = api(
    "/messages?user_id=" + message.sender.user_id,
    {
      text:
        "Привет! 🤖 Я бот канала «AI на минималках».\n\n" +
        "Подключение работает! Подарки и меню скоро появятся здесь.\n" +
        "А пока загляни в наш канал 👇\n\n" +
        "ПОНЯЛ • ПРИНЯЛ • ПОВТОРИЛ",
      attachments: [{
        type: "inline_keyboard",
        payload: {
          buttons: [[{
            type: "link",
            text: "📣 ОТКРЫТЬ КАНАЛ",
            url: "https://" + "max.ru/channel_ai_minimalka"
          }]]
        }
      }]
    }
  );

  handled.set(id, task);

  try {
    await task;
    console.log("Ответ отправлен.");
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
