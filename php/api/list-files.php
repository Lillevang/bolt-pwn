<?php
// Set appropriate headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Uploads directory path
$uploadsDir = __DIR__ . '/../uploads';

// Ensure the directory exists
if (!file_exists($uploadsDir)) {
    mkdir($uploadsDir, 0777, true);
    echo json_encode(['files' => []]);
    exit;
}

// Get all files in the uploads directory
$files = scandir($uploadsDir);
$filesList = [];

// Remove . and .. from the list
$files = array_diff($files, ['.', '..']);

foreach ($files as $filename) {
    $filePath = $uploadsDir . '/' . $filename;
    
    // Get file information
    $fileInfo = [
        'name' => $filename,
        'size' => filesize($filePath),
        'type' => mime_content_type($filePath),
        'path' => '/uploads/' . $filename,
        'uploadedAt' => date('c', filemtime($filePath))
    ];
    
    $filesList[] = $fileInfo;
}

// Sort files by upload date (newest first)
usort($filesList, function($a, $b) {
    return strtotime($b['uploadedAt']) - strtotime($a['uploadedAt']);
});

echo json_encode(['files' => $filesList]);
?>
