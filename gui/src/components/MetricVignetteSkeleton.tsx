import { FC } from 'react';
import { Card, CardContent, Typography, Skeleton } from '@mui/material';

export const MetricVignetteSkeleton: FC = () => {
  return (
    <Card variant='outlined'>
      <CardContent>
        <Typography sx={{ mb: 1.5 }}>
          <Skeleton variant='text' width='20%' />
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          <Skeleton variant='text' width='20%' />
          <Skeleton variant='text' width='30%' />
          <Skeleton variant='text' width='40%' />
        </Typography>
      </CardContent>
    </Card>
  );
};
