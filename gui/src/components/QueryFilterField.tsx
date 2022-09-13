import { FC, useState, useEffect } from 'react';
import { Typography, Button, Stack, Grid } from '@mui/material';
import { parseQueryFilter, QueryFilterNode } from '../query-parser';
import { AdvancedQueryFilterField } from './AdvancedQueryFilterField';
import { BasicQueryFilter, BasicQueryFilterField } from './BasicQueryFilterField';

export interface QueryFilterFieldValue {
  basic: BasicQueryFilter[] | null;
  advanced: string;
}

export interface QueryFilterFieldProps {
  className: string;
  disabled?: boolean;
  value: QueryFilterFieldValue;
  onInput: (data: QueryFilterFieldValue) => void;
}

function convertAdvancedNodeToBasic(context: string, node: QueryFilterNode): BasicQueryFilter[] | null {
  if (node.type !== 'FunctionCall') {
    return null;
  } else if (node.name.value === 'or') {
    return null;
  } else if (node.name.value === 'and') {
    const args = node.args.map((arg) => convertAdvancedNodeToBasic(context, arg));
    return args.some((arg) => arg === null) ? null : args.flat();
  } else if (node.args.length !== 2) {
    return null;
  }

  if (node.args[0].type === 'Literal' && node.args[1].type === 'String') {
    if (!node.args[0].value.startsWith(`${context}.`)) {
      return null;
    }
    return [
      {
        name: node.args[0].value.substring(context.length + 1),
        operator: node.name.value as any,
        value: node.args[1].value,
      },
    ];
  }
  return null;
}

function convertAdvancedToBasic(context: string, query: string): BasicQueryFilter[] | null {
  if (query.trim() === '') {
    return [];
  }
  const { node, error } = parseQueryFilter(query);
  return error ? null : convertAdvancedNodeToBasic(context, node);
}

function convertBasicToAdvanced(context: string, query: BasicQueryFilter[]): string {
  if (query.length === 0) {
    return '';
  }
  const args = query.map((filter) => `${filter.operator}(${context}.${filter.name}, "${filter.value.replace(/"/g, '\\"')}")`).join(', ');
  return query.length === 1 ? args : `and(${args})`;
}

export const QueryFilterField: FC<QueryFilterFieldProps> = ({ className, value, disabled, onInput }) => {
  const [ useAdvanced, setUseAdvanced ] = useState(false);

  const updateBasicQuery = (query: BasicQueryFilter[]) => onInput({
    advanced: convertBasicToAdvanced(className, query),
    basic: query,
  });

  const updateAdvancedQuery = (query: string) => onInput({
    advanced: query,
    basic: convertAdvancedToBasic(className, query),
  });

  useEffect(() => {
    if (useAdvanced) {
      updateAdvancedQuery(value.advanced);
    } else {
      updateBasicQuery(value.basic);
    }
  }, [ className ]);

  const input = useAdvanced
    ? <AdvancedQueryFilterField
        label='Query filter'
        disabled={disabled}
        value={value.advanced}
        onChange={updateAdvancedQuery}
      />
    : <BasicQueryFilterField
        value={value.basic}
        disabled={disabled}
        onInput={updateBasicQuery}
      />;

  return (
    <Stack spacing={2}>
      <Grid container spacing={2} rowSpacing={2} columns={24} alignItems='center'>
        <Grid item xs={16}>
          <Typography variant='h6'>
            Filters
          </Typography>
        </Grid>
        <Grid item xs={8}>
          <Grid container justifyContent='flex-end'>
            {useAdvanced
              ? <Button variant='outlined' disabled={!value.basic || disabled} onClick={() => setUseAdvanced(false)}>Basic</Button>
              : <Button variant='outlined' disabled={disabled} onClick={() => setUseAdvanced(true)}>Advanced</Button>}
          </Grid>
        </Grid>
      </Grid>

      {input}
    </Stack>
  );
};
