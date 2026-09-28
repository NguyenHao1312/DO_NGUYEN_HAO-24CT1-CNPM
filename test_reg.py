import urllib.request
import json

req = urllib.request.Request('http://127.0.0.1:8000/api/register/', method='POST')
req.add_header('Content-Type', 'application/json')
data = json.dumps({'name': 'Test User', 'username': 'testreg123', 'password': '123', 'role': 'student'})

try:
    with urllib.request.urlopen(req, data=data.encode('utf-8')) as response:
        print("Response:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Error:", str(e))
