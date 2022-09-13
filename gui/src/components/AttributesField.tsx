import { FC, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';

export interface AttributesFieldProps {
  label: string;
  value: string[];
  disabled?: boolean;
  onInput: (value: string[]) => void;
}

export const AttributesField: FC<AttributesFieldProps> = ({ label, disabled, value, onInput }) => {
  const [ attributesInput, setAttributesInput ] = useState<string>('');

  const finishValue = () => {
    const endValue = attributesInput.trim();
    if (endValue === '') {
      if (attributesInput !== endValue) {
        setAttributesInput('');
      }
    } else if (value.includes(endValue)) {
      setAttributesInput('');
    } else {
      onInput(value.concat(endValue));
      setAttributesInput('');
    }
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      disableClearable
      disabled={disabled}
      renderInput={(params) => (
        <TextField {...params} fullWidth label={label} />
      )}
      options={[]}
      value={value}
      inputValue={attributesInput}
      onInputChange={(_, value) => {
        setAttributesInput(value);
      }}
      onBlur={finishValue}
      onKeyDown={(event) => {
        if (event.key === ',' || event.key === ' ') {
          event.preventDefault();
          finishValue();
        }
      }}
      onChange={((_, value) => {
        onInput(value as string[]);
      })}
    />
  );
};
