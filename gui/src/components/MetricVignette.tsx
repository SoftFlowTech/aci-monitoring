import { FC, useMemo, useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import { Card, CardContent, CardActions, Button, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Metric } from '../types';
import { parseQueryFilter, humanReadableText } from '../query-parser';
import { MetricDeleteConfirmModal } from './MetricDeleteConfirmModal';
import { CopyButton } from './CopyButton';

export interface MetricVignetteProps {
  metric: Metric;
  deleting?: boolean;
  onDelete?: () => void;
}

export const MetricVignette: FC<MetricVignetteProps> = ({ metric, deleting, onDelete }) => {
  const [ deletingModal, setDeletingModal ] = useState(false);
  const { node } = useMemo(() => parseQueryFilter(metric.queryFilter), [ metric.queryFilter ]);
  const queryDescription = node ? humanReadableText(node, metric.className) : metric.queryFilter;

  return (
    <Card variant='outlined'>
      <MetricDeleteConfirmModal
        open={deletingModal}
        deleting={deleting}
        onDelete={onDelete}
        onCancel={() => setDeletingModal(false)}
      />

      <CardContent>
        <Typography sx={{ mb: 1.5 }}>
          {metric.name}
        </Typography>

        <Typography variant='body2' color='text.secondary'>
          <strong>C:</strong> {metric.className} <CopyButton text={metric.className} /><br />

          <strong>A:</strong> {metric.attributes.map((name, i, arr) => (
            <span key={i}>
              {name} <CopyButton text={name} />
              {i + 1 === arr.length ? '' : ', '}
            </span>
          ))}<br />

          <strong>F:</strong> {
            metric.queryFilter
              ? <>{queryDescription} <CopyButton text={metric.queryFilter}/></>
              : <em>none</em>
          }
        </Typography>
      </CardContent>

      <CardActions>
        <Button startIcon={<DeleteIcon />} onClick={() => setDeletingModal(true)}>Delete</Button>
      </CardActions>
    </Card>
  );
};
