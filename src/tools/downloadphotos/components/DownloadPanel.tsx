import { useState } from 'react';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Card } from '../../../design-system/primitives/Card';
import { Badge } from '../../../design-system/primitives/Badge';
import { Button } from '../../../design-system/primitives/Button';
import { Text } from '../../../design-system/primitives/Text';
import type { Child } from '../api';
import { downloadAll, hasFolderSave, type DownloadProgress } from '../download';

interface Props {
  token: string;
  child: Child;
  count: string;

}

export function DownloadPanel({ token, child, count }: Props) {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [status, setStatus] = useState('');
  const [range, setRange] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const folder = hasFolderSave();

  async function start() {
    setBusy(true);
    setStatus('');
    try {
      const done = await downloadAll({
        token,
        child,
        onProgress: (p) => {
          setProgress(p);
          setStatus(p.status);
          if (p.range) setRange(p.range);
        },
      });
      if (done) setStatus(done);
    } catch (e) {
      setStatus('Error: ' + (e as Error).message);
    }
    setProgress(null);
    setBusy(false);
  }

  return (
    <Card className="cf-panel">
      <div className="cf-panel-body">
        <div className="cf-row">
          <Button className="cf-dl" onClick={() => void start()} disabled={busy}>
            Download all photos…
          </Button>
          <Badge>{count}</Badge>
          {range && <Badge>{range}</Badge>}
        </div>
        {progress && (
          <ProgressBar
            label="Download progress"
            isLabelHidden
            isIndeterminate={progress.value == null}
            value={progress.value ?? 0}
            max={progress.max}
          />
        )}
        <Text variant="secondary" className="cf-status" aria-live="polite">
          {status}
        </Text>
        <Text variant="secondary" className="cf-note">
          <strong>For the best experience, use a desktop computer.</strong>{' '}
          {folder
            ? 'Photos save into a folder you choose. If a download stops or fails, just click again and pick the same folder — it skips what you already have and resumes.'
            : "Your browser can't save to a folder directly, so photos download as one ZIP per month. (Use Chrome or Edge to save to a folder and resume if interrupted.)"}
        </Text>
      </div>
    </Card>
  );
}
