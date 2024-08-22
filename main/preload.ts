import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value)
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
}

contextBridge.exposeInMainWorld('electron', {
  openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openFileWithApp: (filePath) => ipcRenderer.invoke('open-file-with-app', filePath),
  selectAppDialog: () => ipcRenderer.invoke('select-app-dialog'),
  openFolderWithUserChoice: (folderPath, appPath) => ipcRenderer.invoke('open-folder-with-user-choice', folderPath, appPath),
  searchFileOrFolder: (folderPath, referenceNumber) => ipcRenderer.invoke('search-file-or-folder', folderPath, referenceNumber),
});

export type IpcHandler = typeof handler