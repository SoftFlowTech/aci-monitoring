import { FC } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { LoadingButton } from '@mui/lab';

export interface MetricDeleteConfirmModalProps {
  deleting?: boolean;
  open?: boolean;
  onDelete?: () => void;
  onCancel?: () => void;
}

export const MetricDeleteConfirmModal: FC<MetricDeleteConfirmModalProps> = ({ open, deleting, onDelete, onCancel }) => (
  <Dialog open={open}>
    <DialogTitle>Are you sure?</DialogTitle>
    <DialogContent>
      Are you sure that you want to delete this metric?
    </DialogContent>
    <DialogActions>
      <Button disabled={deleting} onClick={onCancel}>Cancel</Button>
      <LoadingButton color='error' loading={deleting} onClick={onDelete}>Delete</LoadingButton>
    </DialogActions>
  </Dialog>
);
