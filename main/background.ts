import path from 'path'
import { app, ipcMain, dialog, shell } from 'electron'
import serve from 'electron-serve'
import { spawn } from 'child_process';  // Import spawn for launching apps
import { exec } from 'child_process';
import fs from 'fs';
import chokidar from 'chokidar'
import { createWindow } from './helpers'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

const findFileOrFolderByReferenceNumber = (directory, targetInode) => {

  const findRecursively = (dir) => {

    fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
      if (err) {
        console.error(`Error reading directory: ${err}`);
        return;
      }

      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);

        fs.stat(fullPath, (err, stats) => {
          if (err) {
            console.error(`Error getting stats: ${err}`);
            return;
          }

          if (stats.ino === targetInode) {
            console.log(`Found file/folder with ID ${targetInode}: ${fullPath}`);
            return;
          }

          // Recursively search in subdirectories
          if (entry.isDirectory()) {
            findRecursively(fullPath);
          }
        });
      });
    });
  };

  findRecursively(directory);
};


let watcher;

// Example function to get the file or folder ID
const getFileOrFolderId = (path) => {
  fs.stat(path, (err, stats) => {
    if (err) {
      console.error('Error fetching stats:', err);
    } else {
      console.log(`The ID (File Reference Number) of ${path} is: ${stats.ino}`);
    }
  });
};

const startWatching = (directoryPath) => {
  if (watcher) {
    watcher.close();
  }

  watcher = chokidar.watch(directoryPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: false,
    depth: Infinity, // Watch all subdirectories
  });

  watcher
    .on('add', path => { getFileOrFolderId(path) })
    .on('change', path => { getFileOrFolderId(path) })
    .on('unlink', path => { getFileOrFolderId(path) })
    .on('addDir', path => { getFileOrFolderId(path) })
    .on('unlinkDir', path => { getFileOrFolderId(path) })
    .on('error', error => { console.log(`Watcher error: ${error}`) })
    .on('ready', () => { console.log('Initial scan complete. Ready for changes') })
    .on('raw', (event, path, details) => { // internal
      console.log('Raw event info:', event, path, details);
    });

  // 'add', 'addDir' and 'change' events also receive stat() results as second
  // argument when available: https://nodejs.org/api/fs.html#fs_class_fs_stats
  watcher.on('change', (path, stats) => {
    if (stats) console.log(`File ${path} changed size to ${stats.size}`);
  });
};

; (async () => {
  await app.whenReady()

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }

  // Handle directory selection
  ipcMain.handle('open-directory-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    });
    if (filePaths.length > 0) {
      startWatching(filePaths[0]);
    }
    return canceled ? null : filePaths[0];
  });

  // Handle file selection
  ipcMain.handle('open-file-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
    });
    return canceled ? null : filePaths[0];
  });

  // Handle opening file with default application
  ipcMain.handle('open-file-with-app', async (_event, filePath: string) => {
    if (filePath) {
      shell.openPath(filePath);
    }
  });

  // Handle application selection
  ipcMain.handle('select-app-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [{ name: 'Executables', extensions: ['exe', 'bat', 'cmd'] }],
    });
    return canceled ? null : filePaths[0];
  });

  // Handle opening folder with a user-selected application
  ipcMain.handle('open-folder-with-user-choice', async (_event, folderPath: string, appPath: string) => {
    try {
      const child = spawn(appPath, [folderPath], { detached: true });
      child.unref();
      return { success: true };
    } catch (error) {
      return { success: false, message: `Could not open the folder with ${appPath}.` };
    }
  });


  // Handle search file or folder using inode
  ipcMain.handle('search-file-or-folder', async (_event, folderPath: string, referenceNumber: string) => {
    try {
      findFileOrFolderByReferenceNumber(folderPath, Number(referenceNumber));
    } catch (error) {
      console.log(`There is an error: ${error}`)
    }
  })


})()



app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})
