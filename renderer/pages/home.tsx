import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function HomePage() {
  const [directoryPath, setDirectoryPath] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedAppPath, setSelectedAppPath] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const handleOpenDirectory = async () => {
    const path = await window.electron.openDirectoryDialog();
    setDirectoryPath(path);
  };

  const handleOpenFile = async () => {
    const path = await window.electron.openFileDialog();
    setFilePath(path);
  };

  const handleOpenFileWithDefaultApp = async () => {
    if (filePath) {
      await window.electron.openFileWithApp(filePath);
    }
  };

  const handleSelectApp = async () => {
    const appPath = await window.electron.selectAppDialog();
    setSelectedAppPath(appPath);

    if (appPath) {
      const result = await window.electron.openFolderWithUserChoice(directoryPath, appPath);
      setMessage(result.success ? 'Folder opened successfully!' : result.message);
    } else {
      setMessage('No application selected.');
    }
  };

  // const handleOpenFolderWithUserChoice = async () => {
  //   if (directoryPath && selectedAppPath) {
  //     const result = await window.electron.openFolderWithUserChoice(directoryPath, selectedAppPath);
  //     setMessage(result.success ? 'Folder opened successfully!' : result.message);
  //   }
  // };

  const handleSearchFileOrFolder = async () => {
    if (directoryPath) {
      await window.electron.searchFileOrFolder(directoryPath, referenceNumber);
    }
  }

  const handleChange = (event) => {
    setReferenceNumber(event.target.value);
  };

  return (
    <React.Fragment>
      <Head>
        <title>Home - Nextron (with-tailwindcss)</title>
      </Head>
      <div className='flex p-[10px] rounded-e-sm bg-blue-300 flex-row gap-10 items-center'>
        <h1 className='text-blue-950'>Select a Directory or File</h1>
        <div>
          <button onClick={handleOpenDirectory} className='p-[10px] bg-blue-950 rounded-md'>Open Directory</button>
        </div>
        <div>
          <button onClick={handleOpenFile} className='p-[10px] bg-blue-950 rounded-md'>Open File</button>
        </div>
      </div>
      <div className='flex p-[10px] rounded-e-sm bg-blue-300 flex-col gap-5'>
        <>
          {directoryPath && (
            <>
              <p className='bg-gray-500 p-5 rounded-md'>
                Selected Directory: <strong>{directoryPath}</strong>
              </p>
              <button onClick={handleSelectApp} className='p-2 bg-blue-500 rounded-md text-white'>Select Application</button>
              {/* <button onClick={handleOpenFolderWithUserChoice} className='p-2 bg-blue-500 rounded-md text-white'>Open Folder with Selected App</button> */}
            </>
          )}
        </>
        <>
          {filePath && (
            <div className='flex flex-row gap-5'>
              <p className='bg-gray-500 p-2 rounded-md'>
                Selected File: <strong>{filePath}</strong>
              </p>
              <button onClick={handleOpenFileWithDefaultApp} className='p-2 bg-blue-500 rounded-md text-white'>Open File</button>
            </div>
          )}
        </>
      </div>
      <div className='flex p-[10px] rounded-e-sm bg-blue-300 flex-row gap-5 items-center'>
        <h1 className='text-blue-950'>Search File or Folder: </h1>
        <input name="search-using-reference" value={referenceNumber || ''} onChange={handleChange} className='p-2 rounded-md text-blue-950' placeholder="Enter reference number" />
        <button onClick={handleSearchFileOrFolder} className='p-2 bg-blue-500 rounded-md text-white'>Search</button>
      </div>
    </React.Fragment>
  );
}
