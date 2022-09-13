import { FC } from 'react';
import { TextField, Grid, FormControl, Select, MenuItem, IconButton } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

export interface BasicQueryFilterFieldProps {
  value: BasicQueryFilter[];
  disabled?: boolean;
  onInput?: (data: BasicQueryFilter[]) => void;
}

export interface BasicQueryFilter {
  name: string;
  operator: 'eq' | 'gt' | 'lt' | 'le' | 'ge' | 'ne';
  value: string;
}

export interface BasicQueryFilterItemProps {
  value: BasicQueryFilter;
  disabled?: boolean;
  mayDelete?: boolean;
  onChange: (value: BasicQueryFilter) => void;
  onDelete?: () => void;
}

const BasicQueryFilterItem: FC<BasicQueryFilterItemProps> = ({ value, mayDelete, onChange, onDelete, disabled }) => <>
  <Grid item xs={9}>
    <TextField
      label='Property'
      size='small'
      fullWidth
      disabled={disabled}
      value={value.name}
      onChange={(e: any) => onChange({ ...value, name: e.target.value })}
    />
  </Grid>
  <Grid item xs={4}>
    <FormControl fullWidth>
      <Select
        value={value.operator}
        disabled={disabled}
        size='small'
        onChange={(e: any) => onChange({ ...value, operator: e.target.value })}
      >
        <MenuItem value='eq'>==</MenuItem>
        <MenuItem value='ne'>!=</MenuItem>
        <MenuItem value='lt'>&lt;</MenuItem>
        <MenuItem value='gt'>&gt;</MenuItem>
        <MenuItem value='le'>&lt;=</MenuItem>
        <MenuItem value='ge'>&gt;=</MenuItem>
        <MenuItem value='wcard'>contains</MenuItem>
      </Select>
    </FormControl>
  </Grid>
  <Grid item xs={9}>
    <TextField
      label='Value'
      size='small'
      fullWidth
      disabled={disabled}
      value={value.value}
      onChange={(e: any) => onChange({ ...value, value: e.target.value })}
    />
  </Grid>
  <Grid item xs={2}>
    <IconButton onClick={onDelete} disabled={!mayDelete || disabled} color='error' size='small'>
      <ClearIcon />
    </IconButton>
  </Grid>
</>;

export const BasicQueryFilterField: FC<BasicQueryFilterFieldProps> = ({ value, onInput, disabled }) => (
  <div>
    <Grid container spacing={2} rowSpacing={2} columns={24}>
      {value.concat({ name: '', operator: 'eq', value: '' }).map((filter, index) => (
        <BasicQueryFilterItem
          key={index}
          disabled={disabled}
          value={filter}
          onChange={(result) => onInput([
            ...value.slice(0, index),
            result,
            ...value.slice(index + 1),
          ])}
          onDelete={() => onInput([
            ...value.slice(0, index),
            ...value.slice(index + 1),
          ])}
          mayDelete={index !== value.length}
        />
      ))}
    </Grid>
  </div>
);
