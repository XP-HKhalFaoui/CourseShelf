import { contextBridge, ipcRenderer } from 'electron';
import { IPC, CourseMetadata, ImportProgress } from '../shared/types';

const electronAPI = {
  /** Open native file picker for ZIP files */
  pickFile: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC.PICK_FILE),

  /** Import a ZIP file (extract, parse, save) */
  importZip: (zipPath: string): Promise<CourseMetadata> =>
    ipcRenderer.invoke(IPC.IMPORT_ZIP, zipPath),

  /** Listen for import progress updates */
  onImportProgress: (callback: (progress: ImportProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: ImportProgress) =>
      callback(progress);
    ipcRenderer.on(IPC.IMPORT_ZIP_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC.IMPORT_ZIP_PROGRESS, handler);
  },

  /** Get all courses in the library */
  getAllCourses: (): Promise<CourseMetadata[]> =>
    ipcRenderer.invoke(IPC.GET_ALL_COURSES),

  /** Remove a course by ID */
  removeCourse: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.REMOVE_COURSE, id),

  /** Launch a course in the player window */
  launchCourse: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.LAUNCH, id),

  /** Open the cache folder in the system file explorer */
  openCacheFolder: (): Promise<void> =>
    ipcRenderer.invoke(IPC.OPEN_CACHE_FOLDER),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
