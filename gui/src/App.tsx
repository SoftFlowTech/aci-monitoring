import { FC, useContext, useState, useEffect } from 'react';
import { css, Global } from '@emotion/react';
import { Helmet } from 'react-helmet';
import { AppBar, Button, Stack, Typography, Toolbar, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useEffectOnce } from 'react-use';
import { MetricsContext } from './context/MetricsContext';
import { MetricVignetteSkeleton } from './components/MetricVignetteSkeleton';
import { MetricVignette } from './components/MetricVignette';
import { CreateMetricDialog } from './components/CreateMetricDialog';

const globalStyles = css`
  html, body {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
  }

  body {
    background: #fff;
    font: 1rem/1.666666 'Roboto', 'Open Sans', 'Helvetica Neue', Arial, Tahoma, sans-serif;
    color: #32333c;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

const containerStyles = css`
  max-width: 1200px;
  margin: 0 auto;
`;

const sectionHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const App: FC = () => {
  const [ adding, setAdding ] = useState(false);
  const context = useContext(MetricsContext);
  useEffectOnce(() => {
    context.load.perform();
  });
  useEffect(() => setAdding(false), [ context.items ]);

  const header = (
    <header css={sectionHeaderStyles}>
      <h2>
        Monitored properties
      </h2>
      <div>
        <Button variant='outlined' onClick={() => setAdding(true)} startIcon={<AddIcon />}>
          Add new
        </Button>
      </div>
    </header>
  );

  const items = context.items.length > 0
    ? <Stack spacing={2}>
        {context.items.map((metric) => (
          <MetricVignette
            key={metric.name}
            metric={metric}
            deleting={context.delete.loading}
            onDelete={() => context.delete.perform(metric.name)}
          />
        ))}
      </Stack>
    : 'No monitored properties yet.';

  const loader = (
    <Stack spacing={2}>
      <MetricVignetteSkeleton />
    </Stack>
  );

  const body = context.load.loading
    ? <>{header}{loader}</>
    : context.load.error
      ? <div>Error: {context.load.error.message}</div>
      : <>{header}{items}</>;

  return (
    <div id='#app'>
      <Helmet>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='crossorigin' />
        <link href='https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap' rel='stylesheet' />
      </Helmet>
      <Global styles={globalStyles} />

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={Boolean(context.add.error)}
        autoHideDuration={5000}
        onClose={context.add.reset}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {context.add.error?.message}
        </Alert>
      </Snackbar>

      <CreateMetricDialog
        open={adding}
        submitting={context.add.loading}
        onSubmit={context.add.perform}
        onCancel={() => setAdding(false)}
      />

      <AppBar position='static'>
        <Toolbar>
          <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
            ACI Monitoring Configuration
          </Typography>
        </Toolbar>
      </AppBar>

      <div css={containerStyles}>
        {body}
      </div>
    </div>
  );
};
