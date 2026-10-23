const inputError = 'Prüfe Zahlen, Klammern und Rechenzeichen.';

type Token = { type: 'number'; value: number } | { type: 'symbol'; value: string };

function tokenize(expression: string): Token[] {
  if (expression.length > 512)
    throw new Error('Die Rechnung ist zu lang. Rechne in Teilschritten.');
  const normalized = expression
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replaceAll('√', 'sqrt');
  const tokens: Token[] = [];
  let index = 0;
  let depth = 0;
  while (index < normalized.length) {
    const rest = normalized.slice(index);
    const space = /^\s+/.exec(rest);
    if (space) {
      index += space[0].length;
      continue;
    }
    const number = /^(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?/.exec(rest);
    if (number) {
      const value = Number(number[0].replace(',', '.'));
      if (!Number.isFinite(value)) throw new Error('Diese Zahl ist zu groß.');
      tokens.push({ type: 'number', value });
      index += number[0].length;
    } else if (rest.startsWith('sqrt')) {
      tokens.push({ type: 'symbol', value: 'sqrt' });
      index += 4;
    } else if ('+-*/^()%'.includes(rest[0])) {
      if (rest[0] === '(' && ++depth > 32) throw new Error('Zu viele verschachtelte Klammern.');
      if (rest[0] === ')') depth -= 1;
      tokens.push({ type: 'symbol', value: rest[0] });
      index += 1;
    } else {
      throw new Error(inputError);
    }
    if (tokens.length > 256) throw new Error('Die Rechnung ist zu lang. Rechne in Teilschritten.');
  }
  return tokens;
}

/** Small arithmetic grammar; no JavaScript evaluation or external requests. */
export function calculateExpression(expression: string): number {
  const tokens = tokenize(expression);
  if (tokens.length === 0) throw new Error('Gib zuerst eine Rechnung ein.');
  let position = 0;
  const take = (symbol: string) => {
    const token = tokens[position];
    if (token?.type === 'symbol' && token.value === symbol) {
      position += 1;
      return true;
    }
    return false;
  };
  const checked = (value: number): number => {
    if (!Number.isFinite(value))
      throw new Error('Das Ergebnis ist nicht als endliche Zahl darstellbar.');
    return Object.is(value, -0) ? 0 : value;
  };
  function primary(): number {
    if (take('(')) {
      const value = sum();
      if (!take(')')) throw new Error('Eine schließende Klammer fehlt.');
      return value;
    }
    if (take('sqrt')) {
      if (!take('(')) throw new Error('Schreibe die Wurzel als sqrt(…).');
      const value = sum();
      if (!take(')')) throw new Error('Eine schließende Klammer fehlt.');
      if (value < 0) throw new Error('Eine negative Zahl hat hier keine reelle Quadratwurzel.');
      return Math.sqrt(value);
    }
    const token = tokens[position];
    if (token?.type !== 'number') throw new Error(inputError);
    position += 1;
    return token.value;
  }
  function postfix(): number {
    let value = primary();
    while (take('%')) value /= 100;
    return value;
  }
  function power(): number {
    const value = postfix();
    return take('^') ? checked(value ** unary()) : value;
  }
  function unary(): number {
    if (take('+')) return unary();
    if (take('-')) return checked(-unary());
    return power();
  }
  function product(): number {
    let value = unary();
    for (;;) {
      if (take('*')) value = checked(value * unary());
      else if (take('/')) {
        const divisor = unary();
        if (divisor === 0) throw new Error('Durch null kannst du nicht teilen.');
        value = checked(value / divisor);
      } else return value;
    }
  }
  function sum(): number {
    let value = product();
    for (;;) {
      if (take('+')) value = checked(value + product());
      else if (take('-')) value = checked(value - product());
      else return value;
    }
  }
  const result = checked(sum());
  if (position !== tokens.length) throw new Error(inputError);
  return result;
}

export function formatCalculatorResult(value: number): string {
  // A calculator display rounds floating-point noise to twelve significant digits.
  const rounded = Number(value.toPrecision(12));
  if (rounded !== 0 && (Math.abs(rounded) < 1e-8 || Math.abs(rounded) >= 1e12))
    return rounded.toExponential().replace('.', ',');
  return new Intl.NumberFormat('de-DE', {
    useGrouping: false,
    maximumSignificantDigits: 12,
  }).format(rounded);
}
