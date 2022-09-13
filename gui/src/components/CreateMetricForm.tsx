import { ChangeEvent, FC, FormEvent, useState, useEffect } from 'react';
import { Autocomplete, Typography, Stack, TextField, createFilterOptions } from '@mui/material';
import mos from '../data/mos.json';
import { defaultMetricInterval } from '../config';
import { Metric } from '../types';
import { QueryFilterField, QueryFilterFieldValue } from './QueryFilterField';
import { AttributesField } from './AttributesField';

export interface CreateMetricFormProps {
  submitting?: boolean;
  onInput?: (data: Metric) => void;
  onSubmit: () => void;
}

export const CreateMetricForm: FC<CreateMetricFormProps> = ({ submitting, onInput, onSubmit }) => {
  const [ name, setName ] = useState('');
  const [ className, setClassName ] = useState('');
  const [ attributes, setAttributes ] = useState<string[]>([]);
  const [ queryFilter, setQueryFilter ] = useState<QueryFilterFieldValue>({ basic: [], advanced: '' });

  useEffect(() => {
    onInput({
      name,
      className,
      attributes,
      queryFilter: queryFilter.advanced,
      interval: defaultMetricInterval,
    });
  }, [ name, className, attributes, queryFilter.advanced ]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={submit}>
      <Stack spacing={2}>
        <Typography variant='h6'>
          Settings
        </Typography>

        <TextField
          fullWidth
          label='Metric name in Grafana'
          type='text'
          disabled={submitting}
          value={name}
          onInput={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        />

        <Autocomplete
          freeSolo
          disableClearable
          disabled={submitting}
          renderInput={(params) => (
            <TextField {...params} fullWidth label='Class name' type='text' />
          )}
          options={mos}
          filterOptions={createFilterOptions({ limit: 100 })}
          value={className}
          onInputChange={(_, value) => setClassName(value)}
        />

        <AttributesField
          label='Monitored attributes'
          disabled={submitting}
          value={attributes}
          onInput={setAttributes}
        />

        <QueryFilterField
          className={className}
          disabled={submitting}
          value={queryFilter}
          onInput={setQueryFilter}
        />
      </Stack>

      <button type='submit' css={{ display: 'none' }}>Submit</button>
    </form>
  );
};
