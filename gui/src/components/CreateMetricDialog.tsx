import {FC, useEffect, useState} from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Metric } from '../types';
import { CreateMetricForm } from './CreateMetricForm';

export interface CreateMetricDialogProps {
  open?: boolean;
  submitting?: boolean;
  onSubmit: (data: Metric) => void;
  onCancel: () => void;
}

const emptyMetric: Metric = {
  name: '',
  className: '',
  attributes: [],
  queryFilter: '',
  interval: 1000,
};

export const CreateMetricDialog: FC<CreateMetricDialogProps> = ({ open, submitting, onSubmit, onCancel }) => {
  const [ value, setValue ] = useState<Metric>(emptyMetric);
  useEffect(() => setValue(emptyMetric), [ open ]);

  return (
    <Dialog open={open} PaperProps={{ sx: { minWidth: '33vw' } }}>
      <DialogTitle>Add new metric</DialogTitle>
      <DialogContent>
        <CreateMetricForm
          submitting={submitting}
          onInput={setValue}
          onSubmit={() => onSubmit(value)}
        />
      </DialogContent>
      <DialogActions>
        <Button disabled={submitting} onClick={onCancel}>Cancel</Button>
        <LoadingButton loading={submitting} onClick={() => onSubmit(value)}>Add</LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
