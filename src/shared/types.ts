/** Shape of a single course record stored in the library */
export interface CourseMetadata {
  id: string;
  title: string;
  cachePath: string;
  launchFile: string;
  scormVersion: string;
  dateAdded: string;
  originalZipName: string;
}

/** Progress payload emitted during ZIP import */
export interface ImportProgress {
  stage: 'extracting' | 'parsing' | 'saving';
  message: string;
}

/** IPC channel name constants — single source of truth */
export const IPC = {
  // Course management
  IMPORT_ZIP: 'course:import-zip',
  IMPORT_ZIP_PROGRESS: 'course:import-zip-progress',
  GET_ALL_COURSES: 'course:get-all',
  GET_COURSE: 'course:get',
  REMOVE_COURSE: 'course:remove',

  // Player
  LAUNCH: 'course:launch',

  // Utility
  PICK_FILE: 'dialog:pick-file',
  OPEN_CACHE_FOLDER: 'shell:open-cache-folder',
} as const;
