<?php
// Simple fallback page that works even when database is down
header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Harun R Rayhan - Portfolio</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .status { margin-top: 20px; padding: 10px; background: #f8f8f8; border-radius: 4px; }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>Harun R Rayhan</h1>
    <p>Full Stack Developer | DevOps Engineer | Cloud Architect</p>
    
    <p>Welcome to my portfolio site. The full featured site will be available shortly.</p>
    
    <div class="status">
        <h3>System Status:</h3>
        <?php
        try {
            $db = new PDO('pgsql:host=db;port=5432;dbname=portfolio', 'portfolio', 'password');
            echo '<p class="success">✅ Database connection: SUCCESSFUL</p>';
            echo '<p>The full site will be available soon!</p>';
        } catch (PDOException $e) {
            echo '<p class="error">❌ Database connection: FAILED</p>';
            echo '<p class="error">Error: ' . $e->getMessage() . '</p>';
            echo '<p>The site is currently undergoing maintenance.</p>';
        }
        ?>
    </div>
</body>
</html>
