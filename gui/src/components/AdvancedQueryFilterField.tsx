import { FC, RefObject, useLayoutEffect, useMemo, useRef } from 'react';
import { css } from '@emotion/react';
import { TextField } from '@mui/material';
import { highlightCodeResult, parseQueryFilter } from '../query-parser';

const styles = css`
  position: relative;
`;

const errorStyles = css`
  background: darkred;
  color: #fff;
  font-size: 0.7em;
  padding: 5px 10px;
  margin-top: -4px;
  border-radius: 0 0 3px 3px;
`;

const overlayStyles = css`
  display: block;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: auto;
  z-index: 2;
  pointer-events: none;
  font-family: monospace;
  background: transparent;
  border-color: transparent;
  outline: transparent;
  pointer-events: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  break-words: break-word;
  
  .QF_Literal {
    color: #444;
    font-weight: bold;
  }
  
  .QF_Call {
    color: purple;
    font-weight: bold;
  }
  
  .QF_String {
    color: darkgreen;
  }
  
  .QF_Error {
    border-bottom: 2px dotted darkred;
  }
`;

const useCopiedStyles = (sourceRef: RefObject<any>, targetRef: RefObject<any>, ignore: string[] = []) => {
  useLayoutEffect(() => {
    if (!sourceRef.current || !targetRef.current) {
      return;
    }

    const ownNode = sourceRef.current.parentNode;
    const parentNode = ownNode.parentNode;
    const parentStyles = getComputedStyle(parentNode);
    const styles = getComputedStyle(ownNode);

    for (let i = 0; i < styles.length; i++) {
      if (ignore.includes(styles[i])) {
        continue;
      }
      const parentValue = parentStyles.getPropertyValue(styles[i]);
      const ownValue = styles.getPropertyValue(styles[i]);
      if (parentValue !== ownValue) {
        targetRef.current.style[styles[i]] = ownValue;
      }
    }
  }, [ sourceRef.current, targetRef.current ]);
};

export interface AdvancedQueryFilterFieldProps {
  disabled?: boolean;
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export const AdvancedQueryFilterField: FC<AdvancedQueryFilterFieldProps> = ({ label, value, onChange, disabled }) => {
  const inputRef = useRef(null);
  const overlayRef = useRef(null);
  const result = useMemo(() => parseQueryFilter(value), [ value ]);
  const html = highlightCodeResult(value, result);

  useCopiedStyles(inputRef, overlayRef, [
    'position',
    'font-family',
    'left',
    'top',
    'right',
    'bottom',
    'display',
    'height',
    'zIndex',
    'background',
    'border-color',
    'outline',
    'pointer-events',
    'white-space',
    'overflow-wrap',
    'break-words',
  ]);

  const errorContainer = result.error && value.trim() !== ''
    ? <div css={errorStyles}>{result.error}</div>
    : null;

  return (
    <div css={styles}>
      <TextField
        disabled={disabled}
        inputRef={inputRef}
        value={value}
        inputProps={{ style: { fontFamily: 'monospace' }, spellCheck: 'false', 'data-gramm': 'false' }}
        label={label}
        fullWidth
        multiline
        minRows={1}
        onChange={(e: any) => onChange(e.target.value)}
      />
      {errorContainer}
      <div
        css={overlayStyles}
        ref={overlayRef}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};
