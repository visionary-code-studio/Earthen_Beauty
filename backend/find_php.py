import urllib.request
import re
import os
import zipfile

url = 'https://windows.php.net/downloads/releases/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        # Find x64 zip
        zips = re.findall(r'href=["\'](/downloads/releases/php-8\.[2-4]\.[0-9]+-Win32-[^"\' ]*x64\.zip)["\']', html)
        if not zips:
            zips = re.findall(r'php-8\.[2-4]\.[0-9]+-Win32-[^"\' ]*x64\.zip', html)
        print("Found PHP builds:", zips[:3])
except Exception as e:
    print("Download check error:", e)
