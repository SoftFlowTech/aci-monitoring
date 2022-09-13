import { FC, useState } from 'react';
import { useCopyToClipboard, useTimeoutFn } from 'react-use';
import { css } from '@emotion/react';
import { Check, ContentCopy } from '@mui/icons-material';
import { Tooltip, Typography } from '@mui/material';

const styles = css`
  width: 1em;
  height: 1em;
  text-align: center;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;
  
  svg {
    font-size: 1em;
  }
`;

export interface CopyButtonProps {
  text: string;
}

export const CopyButton: FC<CopyButtonProps> = ({ text }) => {
  const [ copied, setCopied ] = useState(false);
  const [ , copy ] = useCopyToClipboard();
  const [ ,, resetCleanup ] = useTimeoutFn(() => setCopied(false), 3000);

  const icon = copied ? <Check /> : <ContentCopy />;
  const onClick = () => {
    copy(text);
    setCopied(true);
    resetCleanup();
  };

  return (
    <Tooltip title={`Copy: "${text}"`} arrow>
      <button css={styles} type='button' onClick={onClick}>
        <Typography color='text.primary'>{icon}</Typography>
      </button>
    </Tooltip>
  );
};
