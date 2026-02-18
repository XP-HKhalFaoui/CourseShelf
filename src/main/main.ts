import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IPC, CourseMetadata } from '../shared/types';
import { extractZip } from './services/zip-service';
import { parseManifest } from './services/manifest-parser';
import { addCourse, getAllCourses, getCourseById, removeCourse } from './services/library-service';
import { openPlayerWindow } from './windows/player-window';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if ((await import('electron-squirrel-startup')).default) {
  app.quit();
}

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'CourseShelf',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Load the renderer
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
}

// ─── IPC Handlers ────────────────────────────────────────────

function registerIpcHandlers(): void {
  // Pick a ZIP file via native dialog
  ipcMain.handle(IPC.PICK_FILE, async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select a SCORM ZIP file',
      filters: [{ name: 'ZIP Archives', extensions: ['zip'] }],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // Full import flow: extract → parse → save
  ipcMain.handle(IPC.IMPORT_ZIP, async (_event, zipPath: string) => {
    // 1. Extract
    mainWindow?.webContents.send(IPC.IMPORT_ZIP_PROGRESS, {
      stage: 'extracting',
      message: 'Extracting ZIP...',
    });
    const cachePath = extractZip(zipPath);

    // 2. Parse manifest
    mainWindow?.webContents.send(IPC.IMPORT_ZIP_PROGRESS, {
      stage: 'parsing',
      message: 'Detecting launch file...',
    });
    const manifest = parseManifest(cachePath);

    // 3. Save to library
    mainWindow?.webContents.send(IPC.IMPORT_ZIP_PROGRESS, {
      stage: 'saving',
      message: 'Saving to library...',
    });

    const course: CourseMetadata = {
      id: uuidv4(),
      title: manifest.title,
      cachePath,
      launchFile: manifest.launchFile,
      scormVersion: manifest.scormVersion,
      dateAdded: new Date().toISOString(),
      originalZipName: path.basename(zipPath),
    };

    addCourse(course);
    return course;
  });

  // Get all courses
  ipcMain.handle(IPC.GET_ALL_COURSES, () => {
    return getAllCourses();
  });

  // Get single course
  ipcMain.handle(IPC.GET_COURSE, (_event, id: string) => {
    return getCourseById(id);
  });

  // Remove course
  ipcMain.handle(IPC.REMOVE_COURSE, (_event, id: string) => {
    return removeCourse(id);
  });

  // Launch course in player window
  ipcMain.handle(IPC.LAUNCH, (_event, id: string) => {
    const course = getCourseById(id);
    if (!course) throw new Error(`Course not found: ${id}`);
    openPlayerWindow(course);
    return true;
  });

  // Open cache folder in file explorer
  ipcMain.handle(IPC.OPEN_CACHE_FOLDER, () => {
    const cacheDir = path.join(app.getPath('home'), '.courseshelf', 'cache');
    shell.openPath(cacheDir);
  });
}

// ─── App Lifecycle ───────────────────────────────────────────

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
