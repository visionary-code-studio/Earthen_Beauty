import urllib.request
import os
import zipfile
import shutil

zip_filename = "php-8.2.33-Win32-vs16-x64.zip"
zip_url = f"https://windows.php.net/downloads/releases/{zip_filename}"
target_dir = os.path.join(os.path.dirname(__file__), "php")

if os.path.exists(os.path.join(target_dir, "php.exe")):
    print("PHP is already installed at:", target_dir)
else:
    print(f"Downloading {zip_url}...")
    temp_zip = os.path.join(os.path.dirname(__file__), zip_filename)
    
    urllib.request.urlretrieve(zip_url, temp_zip)
    print("Downloaded. Extracting to", target_dir)
    os.makedirs(target_dir, exist_ok=True)
    
    with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
        zip_ref.extractall(target_dir)
        
    if os.path.exists(temp_zip):
        os.remove(temp_zip)
        
    # Create php.ini from php.ini-development
    ini_dev = os.path.join(target_dir, "php.ini-development")
    ini_target = os.path.join(target_dir, "php.ini")
    if os.path.exists(ini_dev) and not os.path.exists(ini_target):
        with open(ini_dev, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        # Enable curl, pdo_mysql, pdo_sqlite, openssl, mbstring, fileinfo
        content = content.replace(";extension_dir = \"ext\"", "extension_dir = \"ext\"")
        content = content.replace(";extension=curl", "extension=curl")
        content = content.replace(";extension=fileinfo", "extension=fileinfo")
        content = content.replace(";extension=mbstring", "extension=mbstring")
        content = content.replace(";extension=openssl", "extension=openssl")
        content = content.replace(";extension=pdo_mysql", "extension=pdo_mysql")
        content = content.replace(";extension=pdo_sqlite", "extension=pdo_sqlite")
        with open(ini_target, "w", encoding="utf-8") as f:
            f.write(content)
        print("Created and configured php.ini with pdo_mysql, curl, and openssl enabled.")

print("PHP setup complete!")
