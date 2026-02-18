// Access the preload-exposed API
const api = (window as any).electronAPI;

const courseGrid = document.getElementById('course-grid') as HTMLDivElement;
const emptyState = document.getElementById('empty-state') as HTMLDivElement;
const progressBar = document.getElementById('progress-bar') as HTMLDivElement;
const progressText = document.getElementById('progress-text') as HTMLSpanElement;
const btnAddZip = document.getElementById('btn-add-zip') as HTMLButtonElement;
const btnOpenFolder = document.getElementById('btn-open-folder') as HTMLButtonElement;

interface CourseMetadata {
  id: string;
  title: string;
  cachePath: string;
  launchFile: string;
  scormVersion: string;
  dateAdded: string;
  originalZipName: string;
}

// ─── Render Functions ───────────────────────────────────────

function renderCourses(courses: CourseMetadata[]): void {
  courseGrid.innerHTML = '';

  if (courses.length === 0) {
    emptyState.style.display = 'flex';
    courseGrid.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  courseGrid.style.display = 'grid';

  for (const course of courses) {
    const tile = document.createElement('div');
    tile.className = 'course-tile';
    tile.innerHTML = `
      <div class="tile-icon">📘</div>
      <div class="tile-info">
        <h3 class="tile-title">${escapeHtml(course.title)}</h3>
        <span class="tile-badge scorm-${course.scormVersion}">SCORM ${escapeHtml(course.scormVersion)}</span>
        <span class="tile-date">Added ${formatDate(course.dateAdded)}</span>
        <span class="tile-file">${escapeHtml(course.originalZipName)}</span>
      </div>
      <div class="tile-actions">
        <button class="btn btn-launch" data-id="${course.id}">▶ Launch</button>
        <button class="btn btn-remove" data-id="${course.id}">🗑 Remove</button>
      </div>
    `;
    courseGrid.appendChild(tile);
  }

  // Attach event listeners
  courseGrid.querySelectorAll('.btn-launch').forEach((btn) => {
    btn.addEventListener('click', () => handleLaunch((btn as HTMLElement).dataset.id!));
  });
  courseGrid.querySelectorAll('.btn-remove').forEach((btn) => {
    btn.addEventListener('click', () => handleRemove((btn as HTMLElement).dataset.id!));
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Event Handlers ─────────────────────────────────────────

async function handleAddZip(): Promise<void> {
  try {
    const zipPath = await api.pickFile();
    if (!zipPath) return;

    // Show progress
    progressBar.style.display = 'flex';
    btnAddZip.disabled = true;

    await api.importZip(zipPath);

    // Refresh the grid
    const courses = await api.getAllCourses();
    renderCourses(courses);
  } catch (err: any) {
    alert(`Import failed: ${err.message || err}`);
  } finally {
    progressBar.style.display = 'none';
    btnAddZip.disabled = false;
  }
}

async function handleLaunch(id: string): Promise<void> {
  try {
    await api.launchCourse(id);
  } catch (err: any) {
    alert(`Launch failed: ${err.message || err}`);
  }
}

async function handleRemove(id: string): Promise<void> {
  const confirmed = confirm('Remove this course? The cached files will be deleted.');
  if (!confirmed) return;

  try {
    await api.removeCourse(id);
    const courses = await api.getAllCourses();
    renderCourses(courses);
  } catch (err: any) {
    alert(`Remove failed: ${err.message || err}`);
  }
}

// ─── Init ─────────────────────────────────────────────────

btnAddZip.addEventListener('click', handleAddZip);
btnOpenFolder.addEventListener('click', () => api.openCacheFolder());

// Listen for import progress
api.onImportProgress((progress: { stage: string; message: string }) => {
  progressText.textContent = progress.message;
});

// Load courses on startup
(async () => {
  const courses = await api.getAllCourses();
  renderCourses(courses);
})();
