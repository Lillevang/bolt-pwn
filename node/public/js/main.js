// DOM Elements
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const selectFilesBtn = document.getElementById('select-files-btn');
const uploadProgressContainer = document.getElementById('upload-progress-container');
const uploadProgressBar = document.getElementById('upload-progress-bar');
const uploadFilename = document.getElementById('upload-filename');
const uploadPercentage = document.getElementById('upload-percentage');
const fileList = document.getElementById('file-list');
const fileListEmpty = document.getElementById('file-list-empty');
const refreshFilesBtn = document.getElementById('refresh-files-btn');
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadFiles();
  setupEventListeners();
});

function setupEventListeners() {
  // Select files button
  selectFilesBtn.addEventListener('click', () => {
    fileInput.click();
  });
  
  // File input change
  fileInput.addEventListener('change', handleFileSelect);
  
  // Refresh files list
  refreshFilesBtn.addEventListener('click', loadFiles);
  
  // Drag and drop functionality
  uploadZone.addEventListener('dragover', handleDragOver);
  uploadZone.addEventListener('dragleave', handleDragLeave);
  uploadZone.addEventListener('drop', handleDrop);
  uploadZone.addEventListener('click', () => {
    // Don't trigger click if progress is showing
    if (uploadZone.querySelector('.upload-content').style.display !== 'none') {
      fileInput.click();
    }
  });
}

// Handle file selection from input
function handleFileSelect(event) {
  const files = event.target.files;
  if (files.length > 0) {
    uploadFiles(files);
  }
}

// Handle drag over
function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  uploadZone.classList.add('drag-over');
}

// Handle drag leave
function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  uploadZone.classList.remove('drag-over');
}

// Handle file drop
function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  uploadZone.classList.remove('drag-over');
  
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    uploadFiles(files);
  }
}

// Upload files
async function uploadFiles(files) {
  // Show upload progress
  uploadZone.querySelector('.upload-content').style.display = 'none';
  uploadProgressContainer.style.display = 'block';
  
  try {
    if (files.length === 1) {
      // Single file upload
      await uploadSingleFile(files[0]);
    } else {
      // Multiple files upload
      await uploadMultipleFiles(files);
    }
    
    // Show success message
    showToast('success', `${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully`);
    
    // Refresh file list
    loadFiles();
  } catch (error) {
    console.error('Upload error:', error);
    showToast('error', 'Failed to upload files');
  } finally {
    // Reset the file input
    fileInput.value = '';
    
    // Hide upload progress and show upload content
    setTimeout(() => {
      uploadProgressContainer.style.display = 'none';
      uploadZone.querySelector('.upload-content').style.display = 'flex';
      uploadProgressBar.style.width = '0%';
    }, 500);
  }
}

// Upload a single file with progress
async function uploadSingleFile(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const xhr = new XMLHttpRequest();
    
    // Handle progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        uploadProgressBar.style.width = `${percentComplete}%`;
        uploadFilename.textContent = `Uploading ${file.name}`;
        uploadPercentage.textContent = `${percentComplete}%`;
      }
    });
    
    // Handle success
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`HTTP Error: ${xhr.status}`));
      }
    });
    
    // Handle error
    xhr.addEventListener('error', () => {
      reject(new Error('Network Error'));
    });
    
    // Send the request
    xhr.open('POST', '/upload');
    xhr.send(formData);
  });
}

// Upload multiple files
async function uploadMultipleFiles(files) {
  const formData = new FormData();
  let totalSize = 0;
  let loadedSize = 0;
  
  // Calculate total size
  for (const file of files) {
    totalSize += file.size;
    formData.append('files', file);
  }
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Handle progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        loadedSize = event.loaded;
        const percentComplete = Math.round((loadedSize / totalSize) * 100);
        uploadProgressBar.style.width = `${percentComplete}%`;
        uploadFilename.textContent = `Uploading ${files.length} files`;
        uploadPercentage.textContent = `${percentComplete}%`;
      }
    });
    
    // Handle success
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`HTTP Error: ${xhr.status}`));
      }
    });
    
    // Handle error
    xhr.addEventListener('error', () => {
      reject(new Error('Network Error'));
    });
    
    // Send the request
    xhr.open('POST', '/upload-multiple');
    xhr.send(formData);
  });
}

// Load files from server
async function loadFiles() {
  try {
    refreshFilesBtn.disabled = true;
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    refreshFilesBtn.appendChild(spinner);
    
    const response = await fetch('/files');
    const files = await response.json();
    
    // Render files
    renderFiles(files);
  } catch (error) {
    console.error('Error loading files:', error);
    showToast('error', 'Failed to load files');
  } finally {
    refreshFilesBtn.disabled = false;
    const spinner = refreshFilesBtn.querySelector('.spinner');
    if (spinner) {
      refreshFilesBtn.removeChild(spinner);
    }
  }
}

// Render files in the file list
function renderFiles(files) {
  // Clear existing content
  fileList.innerHTML = '';
  
  if (files.length === 0) {
    fileList.appendChild(fileListEmpty);
    return;
  }
  
  // Sort files by date (newest first)
  files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  
  // Create file items
  files.forEach(file => {
    const fileItem = createFileItem(file);
    fileList.appendChild(fileItem);
  });
}

// Create a file item element
function createFileItem(file) {
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';
  
  // File extension for the icon
  const extension = file.name.split('.').pop().toLowerCase();
  
  // File info
  const fileInfo = document.createElement('div');
  fileInfo.className = 'file-info';
  
  // File icon (based on type)
  const fileIcon = document.createElement('div');
  fileIcon.className = 'file-icon';
  
  // Choose icon based on file type
  const iconType = getFileIconType(file.type, extension);
  fileIcon.innerHTML = `<img src="/images/file-${iconType}-icon.svg" alt="${iconType} file">`;
  
  // File details
  const fileDetails = document.createElement('div');
  fileDetails.className = 'file-details';
  
  // File name
  const fileName = document.createElement('div');
  fileName.className = 'file-name';
  fileName.textContent = file.originalName;
  
  // File meta info
  const fileMeta = document.createElement('div');
  fileMeta.className = 'file-meta';
  
  // File size
  const fileSize = document.createElement('span');
  fileSize.textContent = file.formattedSize;
  
  // File date
  const fileDate = document.createElement('span');
  fileDate.textContent = file.formattedDate;
  
  fileMeta.appendChild(fileSize);
  fileMeta.appendChild(document.createTextNode(' • '));
  fileMeta.appendChild(fileDate);
  
  fileDetails.appendChild(fileName);
  fileDetails.appendChild(fileMeta);
  
  fileInfo.appendChild(fileIcon);
  fileInfo.appendChild(fileDetails);
  
  // File actions
  const fileActions = document.createElement('div');
  fileActions.className = 'file-actions';
  
  // Download button
  const downloadButton = document.createElement('button');
  downloadButton.className = 'file-action-button';
  downloadButton.innerHTML = '<img src="/images/download-icon.svg" alt="Download">';
  downloadButton.setAttribute('aria-label', 'Download file');
  downloadButton.addEventListener('click', () => {
    window.location.href = file.path;
  });
  
  fileActions.appendChild(downloadButton);
  
  // Add all elements to the file item
  fileItem.appendChild(fileInfo);
  fileItem.appendChild(fileActions);
  
  return fileItem;
}

// Get file icon type based on MIME type
function getFileIconType(mimeType, extension) {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else if (mimeType.includes('pdf')) {
    return 'pdf';
  } else if (mimeType.includes('word') || extension === 'doc' || extension === 'docx') {
    return 'document';
  } else if (mimeType.includes('excel') || extension === 'xls' || extension === 'xlsx') {
    return 'spreadsheet';
  } else if (mimeType.includes('zip') || mimeType.includes('compressed') || 
             extension === 'zip' || extension === 'rar' || extension === '7z') {
    return 'archive';
  } else if (mimeType.includes('text/') || extension === 'txt' || 
             extension === 'md' || extension === 'json') {
    return 'text';
  } else if (extension === 'js' || extension === 'ts' || extension === 'jsx' || 
             extension === 'tsx' || extension === 'html' || extension === 'css') {
    return 'code';
  } else {
    return 'generic';
  }
}

// Show toast notification
function showToast(type, message) {
  toastMessage.textContent = message;
  
  if (type === 'success') {
    toastIcon.src = '/images/success-icon.svg';
  } else if (type === 'error') {
    toastIcon.src = '/images/error-icon.svg';
  } else if (type === 'warning') {
    toastIcon.src = '/images/warning-icon.svg';
  }
  
  toast.classList.add('show');
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}