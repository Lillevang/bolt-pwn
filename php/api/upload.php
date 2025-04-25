<?php
// Ensure the uploads directory exists
$uploadsDir = __DIR__ . '/../uploads';
if (!file_exists($uploadsDir)) {
    mkdir($uploadsDir, 0777, true);
}

// Set unlimited maximum execution time
set_time_limit(0);

// Configure unlimited file size uploads
ini_set('upload_max_filesize', '0');
ini_set('post_max_size', '0');
ini_set('memory_limit', '-1');

// Set appropriate headers for CORS and JSON response
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle OPTIONS request (for CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if files were uploaded
if (empty($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];

// Check for upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
        UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the MAX_FILE_SIZE directive in the HTML form',
        UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded',
        UPLOAD_ERR_NO_FILE => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
    ];

    $errorMessage = isset($errorMessages[$file['error']]) 
        ? $errorMessages[$file['error']] 
        : 'Unknown upload error';

    http_response_code(500);
    echo json_encode(['error' => $errorMessage]);
    exit;
}

// Generate a unique filename to prevent overwriting
$filename = $file['name'];
$destination = $uploadsDir . '/' . $filename;

// If file already exists, append a unique identifier
if (file_exists($destination)) {
    $pathInfo = pathinfo($filename);
    $filename = $pathInfo['filename'] . '_' . uniqid() . '.' . $pathInfo['extension'];
    $destination = $uploadsDir . '/' . $filename;
}

// Move the uploaded file to the destination
if (move_uploaded_file($file['tmp_name'], $destination)) {
    // Return success response with file information
    $filePath = '/uploads/' . $filename;
    
    echo json_encode([
        'success' => true,
        'message' => 'File uploaded successfully',
        'name' => $file['name'],
        'size' => $file['size'],
        'type' => $file['type'],
        'path' => $filePath
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to move uploaded file'
    ]);
}
?>
