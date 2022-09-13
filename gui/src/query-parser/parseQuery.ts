export interface QueryFilterToken<T = 'String' | 'Whitespace' | 'Literal' | 'Open' | 'Close' | 'Comma'> {
  type: T;
  data: {
    value: string;
  };
  start: number;
  end: number;
}

export interface QueryFilterLiteralNode {
  type: 'Literal';
  value: string;
}

export interface QueryFilterStringNode {
  type: 'String';
  value: string;
}

export interface QueryFilterFunctionCallNode {
  type: 'FunctionCall';
  name: QueryFilterLiteralNode;
  // eslint-disable-next-line no-use-before-define
  args: QueryFilterNode[];
  start?: number;
  end?: number;
}

export type QueryFilterNode = (
  QueryFilterLiteralNode |
  QueryFilterStringNode |
  QueryFilterFunctionCallNode
);

function tokenize(code: string): {
  index: number;
  error: string | null;
  tokens: QueryFilterToken[];
} {
  const tokens: QueryFilterToken[] = [];
  for (let offset = 0; offset < code.length; offset++) {
    if (code[offset] === '(') {
      tokens.push({
        type: 'Open',
        data: { value: '(' },
        start: offset,
        end: offset + 1,
      });
      continue;
    } else if (code[offset] === ')') {
      tokens.push({
        type: 'Close',
        data: { value: ')' },
        start: offset,
        end: offset + 1,
      });
      continue;
    } else if (code[offset] === ',') {
      tokens.push({
        type: 'Comma',
        data: { value: ',' },
        start: offset,
        end: offset + 1,
      });
      continue;
    }

    const whitespaceMatch = code.substring(offset).match(/^\s+/);
    if (whitespaceMatch) {
      tokens.push({
        type: 'Whitespace',
        data: { value: whitespaceMatch[0].replace(/\\"/g, '"') },
        start: offset,
        end: offset + whitespaceMatch[0].length,
      });
      offset += whitespaceMatch[0].length - 1;
      continue;
    }

    const stringMatch = code.substring(offset).match(/^"(?:.*?(?:\\")?.*?)*?"/);
    if (stringMatch) {
      tokens.push({
        type: 'String',
        data: {
          value: stringMatch[0]
            .replace(/\\"/g, '"')
            .replace(/(^"|"$)/g, ''),
        },
        start: offset,
        end: offset + stringMatch[0].length,
      });
      offset += stringMatch[0].length - 1;
      continue;
    }

    const literalMatch = code.substring(offset).match(/^[a-z_]\w*(\.([a-z_]\w*))*/i);
    if (literalMatch) {
      tokens.push({
        type: 'Literal',
        data: { value: literalMatch[0].replace(/\\"/g, '"') },
        start: offset,
        end: offset + literalMatch[0].length,
      });
      offset += literalMatch[0].length - 1;
      continue;
    }

    return {
      index: offset,
      error: 'Unexpected token.',
      tokens,
    };
  }
  return {
    index: code.length,
    error: null,
    tokens,
  };
}

function parseTokens(tokens: QueryFilterToken[], offset = 0): {
  offset: number;
  error: string | null;
  node: QueryFilterNode | null;
} {
  // Ignore all initial whitespaces
  while (tokens[offset]?.type === 'Whitespace') {
    offset++;
  }

  // Early exit for empty list
  if (offset >= tokens.length) {
    return {
      offset,
      error: 'Unexpected end of input.',
      node: null,
    };
  }

  // Early exit for strings
  if (tokens[offset]?.type === 'String') {
    return {
      offset: offset + 1,
      error: null,
      node: {
        type: 'String',
        value: tokens[offset].data.value,
      },
    };
  }

  // Fail for the token that could not be an expression
  if (tokens[offset]?.type !== 'Literal') {
    return {
      offset,
      error: `Unexpected ${tokens[offset]?.type} token. Expected Literal or String.`,
      node: null,
    };
  }

  // Extract literal
  const literal: QueryFilterLiteralNode = {
    type: 'Literal',
    value: tokens[offset].data.value,
  };
  const literalIndex = offset++;

  // Ignore all next whitespaces
  while (tokens[offset]?.type === 'Whitespace') {
    offset++;
  }

  // Use literal if it's not a function call
  if (offset >= tokens.length || tokens[offset]?.type !== 'Open') {
    return {
      offset: literalIndex + 1,
      error: null,
      node: literal,
    };
  }

  // Start consuming function arguments
  offset++;
  const args: QueryFilterNode[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Extract next argument
    const argResult = parseTokens(tokens, offset);
    if (argResult.error) {
      return argResult;
    }
    offset = argResult.offset;
    args.push(argResult.node);

    // Ignore next whitespaces
    while (tokens[offset]?.type === 'Whitespace') {
      offset++;
    }

    // Detect next action
    if (offset >= tokens.length) {
      return {
        offset,
        error: 'Unexpected end of input.',
        node: null,
      };
    }
    if (tokens[offset]?.type === 'Close') {
      return {
        offset: offset + 1,
        error: null,
        node: {
          type: 'FunctionCall',
          name: literal,
          args,
          start: tokens[literalIndex].start,
          end: tokens[offset].end,
        },
      };
    }
    if (tokens[offset]?.type !== 'Comma') {
      return {
        offset: offset - 1,
        error: `Unexpected ${tokens[offset]?.type} token. Expected Comma or Close.`,
        node: null,
      };
    }
    offset++;
  }
}

function extractFunctionCalls(node: QueryFilterNode): QueryFilterFunctionCallNode[] {
  if (node.type === 'FunctionCall') {
    return [node].concat(...node.args.map(extractFunctionCalls));
  }
  return [];
}

export function parseQueryFilter(code: string): {
  index: number;
  error: string | null;
  tokens: QueryFilterToken[];
  node: QueryFilterNode | null;
} {
  if (code === '') {
    return {
      index: 0,
      error: 'Empty query filter.',
      node: null,
      tokens: [],
    };
  }

  const result = tokenize(code);

  // Return tokenization error
  if (result.error) {
    return {
      index: result.index,
      error: result.error,
      node: null,
      tokens: result.tokens,
    };
  }

  // Extract found tokens
  const { tokens } = result;

  // Parse the tokens to AST
  const { node, error, offset } = parseTokens(tokens);

  // Detect if there wasn't some unnecessary expression passed
  const restTokens = tokens.slice(offset);
  const restFirstExpressionIndex = restTokens.findIndex((x) => x.type !== 'Whitespace');
  if (!error && restFirstExpressionIndex !== -1) {
    return {
      index: tokens[offset + restFirstExpressionIndex - 1].end,
      error: 'Unexpected expression after end.',
      node: null,
      tokens,
    };
  }

  // Extract all function calls for validation
  const calls = node ? extractFunctionCalls(node) : [];
  const knownFunctions = ['and', 'or', 'eq', 'ne', 'lt', 'gt', 'le', 'ge', 'wcard'];

  // Ensure there are only valid function names used
  const unknownFunction = calls.find((x) => !knownFunctions.includes(x.name.value));
  if (!error && unknownFunction) {
    const suggestion = knownFunctions.includes(unknownFunction.name.value.toLowerCase())
      ? ` Did you mean: '${unknownFunction.name.value.toLowerCase()}'?`
      : '';
    return {
      index: unknownFunction.start || 0,
      error: `Unknown function used '${unknownFunction.name.value}'.${suggestion}`,
      node: null,
      tokens,
    };
  }

  // Ensure that "and" and "or" functions will get other functions as arguments
  const invalidBooleanArguments = calls.find((x) => ['and', 'or'].includes(x.name.value) && x.args.some((arg) => arg.type !== 'FunctionCall'));
  if (!error && invalidBooleanArguments) {
    return {
      index: invalidBooleanArguments.start || 0,
      error: 'Functions and/or expect boolean arguments.',
      node: null,
      tokens,
    };
  }

  // Ensure that other functions have two arguments
  const invalidArgumentsCount = calls.find((x) => !['and', 'or'].includes(x.name.value) && x.args.length !== 2);
  if (!error && invalidArgumentsCount) {
    return {
      index: invalidArgumentsCount.start || 0,
      error: `Function '${invalidArgumentsCount.name.value}' expects 2 arguments.`,
      node: null,
      tokens,
    };
  }

  // Ensure that other functions have only literals and strings
  const invalidOtherArguments = calls.find((x) => !['and', 'or'].includes(x.name.value) && (x.args[0].type !== 'Literal' || x.args[1].type !== 'String'));
  if (!error && invalidOtherArguments) {
    return {
      index: invalidOtherArguments.start || 0,
      error: `Function '${invalidOtherArguments.name.value}' expects Literal as first, and String as second argument.`,
      node: null,
      tokens,
    };
  }

  // Ensure that on top level there is a function call
  if (!error && node.type !== 'FunctionCall') {
    return {
      index: 0,
      error: 'Expected a boolean expression as top node.',
      node,
      tokens,
    };
  }

  return {
    index: tokens[error ? offset : offset - 1]?.end || tokens[offset - 1].end,
    error,
    node,
    tokens,
  };
}

export function queryFilterNodeToString(node: QueryFilterNode): string {
  if (node.type === 'Literal') {
    return node.value;
  }
  if (node.type === 'String') {
    return `"${node.value.replace(/"/g, '\\"')}"`;
  }
  if (node.type === 'FunctionCall') {
    const args = node.args.map((x) => queryFilterNodeToString(x)).join(',');
    return `${queryFilterNodeToString(node.name)}(${args})`;
  }
  throw new Error('Invalid node.');
}

const operators: Record<string, string> = {
  eq: '=',
  ne: '!=',
  lt: '<',
  gt: '>',
  le: '<=',
  ge: '<=',
  wcard: 'CONTAINS',
};

export function humanReadableText(node: QueryFilterNode, context: string, inner = false): string {
  if (node.type === 'Literal') {
    return node.value.startsWith(`${context}.`) ? node.value.substring(context.length + 1) : node.value;
  }
  if (node.type === 'String') {
    return /^\d+$/.test(node.value) ? node.value : `"${node.value.replace(/"/g, '\\"')}"`;
  }
  if (node.type === 'FunctionCall') {
    const args = node.args.map((arg) => humanReadableText(arg, context, inner));
    const operator = operators[node.name.value] || node.name.value.toUpperCase();
    const result = args.join(` ${operator} `);
    return inner ? `(${result})` : result;
  }
  throw new Error('Invalid node.');
}
