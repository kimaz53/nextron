import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function HomePage() {
  const [directoryPath, setDirectoryPath] = useState<string | null>(null);

  const handleOpenDirectory = async () => {
    const path = await window.electron.openDirectoryDialog();
    setDirectoryPath(path);
  };

  return (
    <React.Fragment>
      <Head>
        <title>Home - Nextron (with-tailwindcss)</title>
      </Head>
      <div style={{ padding: 20 }}>
        <h1>Select a Directory</h1>
        <button onClick={handleOpenDirectory}>Open Directory</button>
        {directoryPath && (
          <p>
            Selected Directory: <strong>{directoryPath}</strong>
          </p>
        )}
      </div>
    </React.Fragment>
  );
}
