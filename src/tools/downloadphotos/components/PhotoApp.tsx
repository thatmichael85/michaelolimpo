import { useCallback, useState } from 'react';
import { TabList, Tab } from '@astryxdesign/core/TabList';
import { Heading } from '../../../design-system/primitives/Heading';
import { Button } from '../../../design-system/primitives/Button';
import { childName, type Child, type Photo } from '../api';
import { useGallery } from '../useGallery';
import { DownloadPanel } from './DownloadPanel';
import { Gallery } from './Gallery';
import { PhotoViewer } from './PhotoViewer';

/** Gallery + download for one child. Mounted with key={child.id}, so switching child starts fresh. */
function ChildPhotos({ token, child, onUnauthorized }: { token: string; child: Child; onUnauthorized: () => void }) {
  const g = useGallery(token, child.id, onUnauthorized);
  const [open, setOpen] = useState<Photo | null>(null);
  return (
    <>
      <DownloadPanel
        token={token}
        child={child}
        count={g.count}

      />
      <Gallery g={g} onOpen={setOpen} />
      <PhotoViewer photos={g.flat} open={open} onChange={setOpen} />
    </>
  );
}

export function PhotoApp({
  token,
  childList: children,
  onSignOut,
}: {
  token: string;
  childList: Child[];
  onSignOut: () => void;
}) {
  const [current, setCurrent] = useState(children[0].id);
  const child = children.find((c) => c.id === current) ?? children[0];
  const signOut = useCallback(() => onSignOut(), [onSignOut]);

  return (
    <div className="cf-app">
      <header className="cf-header">
        <div className="cf-header-main">
          <Heading level={1}>Your child's photos</Heading>
          <TabList
            value={String(child.id)}
            onChange={(v) => setCurrent(Number(v))}
            aria-label="Children"
            overflow="scroll"
            size="lg"
            className="cf-tabs"
          >
            {children.map((c) => (
              <Tab key={c.id} value={String(c.id)} label={childName(c)} />
            ))}
          </TabList>
        </div>
        <Button variant="outline" onClick={signOut} className="cf-signout">
          Sign out
        </Button>
      </header>
      <ChildPhotos key={child.id} token={token} child={child} onUnauthorized={signOut} />
    </div>
  );
}
