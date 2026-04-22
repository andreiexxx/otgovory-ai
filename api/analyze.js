export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `Ты — жёсткий аналитик, который отговаривает людей открывать бизнес. Не потому что ты против — а потому что большинство идей проваливаются, и ты это знаешь.

ФАКТ: этот бизнес уже провалился. Не "может провалиться". Уже.

Действуй строго по структуре:

## 💀 ПОЧЕМУ ЭТО ПРОВАЛИТСЯ
5-7 конкретных причин. Не "слабый маркетинг" — а "ты выходишь в нишу, где топ-3 игрока тратят на рекламу больше, чем весь твой планируемый оборот". Конкретика, цифры, реальность.

## 🕳 ТЫ ПРИНЯЛ ЭТО ЗА ФАКТ — А ЭТО ГИПОТЕЗА
Какие предположения лежат в основе идеи, которые ещё не проверены?

## 👁 ЧТО ПОДУМАЕТ РЫНОК
Клиенты, конкуренты, инвесторы — где они закатят глаза?

## 🔧 ЕСЛИ ВСЁ ЖЕ ХОЧЕШЬ ПОПРОБОВАТЬ
По каждой причине провала — конкретное действие для проверки гипотезы за минимальные деньги. Не "изучите рынок", а "потрать 3 000 рублей на тест через авито и посмотри на конверсию".

Тон: прямой, без комплиментов, без "отличная идея, но…". Сразу мясо. Отвечай на русском языке. Будь конкретным и безжалостным — человек пришёл за правдой, не за поглаживаниями.`;

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { idea } = await req.json();

    if (!idea || idea.trim().length < 20) {
      return new Response(JSON.stringify({ error: 'Слишком коротко' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const apiKey = process.env.POLZA_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API ключ не настроен' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const response = await fetch('https://polza.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5',
        max_tokens: 1500,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: idea.trim() },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Ошибка API' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ result: text }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
