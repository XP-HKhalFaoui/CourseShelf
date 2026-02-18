import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { CourseMetadata } from '../../shared/types';
import { removeCacheFolder } from './zip-service';

/** Path to the JSON library file */
function getLibraryPath(): string {
  return path.join(app.getPath('userData'), 'course-library.json');
}

/** Read all courses from the JSON file */
function readLibrary(): CourseMetadata[] {
  const libPath = getLibraryPath();
  if (!fs.existsSync(libPath)) return [];
  try {
    const raw = fs.readFileSync(libPath, 'utf-8');
    return JSON.parse(raw) as CourseMetadata[];
  } catch {
    return [];
  }
}

/** Write the full course list to disk */
function writeLibrary(courses: CourseMetadata[]): void {
  const libPath = getLibraryPath();
  fs.writeFileSync(libPath, JSON.stringify(courses, null, 2), 'utf-8');
}

/** Add a new course to the library */
export function addCourse(course: CourseMetadata): void {
  const courses = readLibrary();
  courses.push(course);
  writeLibrary(courses);
}

/** Get all courses */
export function getAllCourses(): CourseMetadata[] {
  return readLibrary();
}

/** Get a single course by ID */
export function getCourseById(id: string): CourseMetadata | undefined {
  return readLibrary().find((c) => c.id === id);
}

/** Remove a course by ID and delete its cached files */
export function removeCourse(id: string): boolean {
  const courses = readLibrary();
  const idx = courses.findIndex((c) => c.id === id);
  if (idx === -1) return false;

  const course = courses[idx];
  removeCacheFolder(course.cachePath);
  courses.splice(idx, 1);
  writeLibrary(courses);
  return true;
}
