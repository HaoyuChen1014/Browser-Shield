import sqlite3

# Create and connect to the whitelist database
conn = sqlite3.connect('whitelist.db')
c = conn.cursor()

# Create the whitelist table
c.execute('''
CREATE TABLE IF NOT EXISTS whitelist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE
)
''')

# List of common safe URLs
safe_urls = [
    'https://www.google.com/',
    'https://www.youtube.com/',
    'https://www.baidu.com/',
    'https://www.amazon.com/',
    'https://www.facebook.com/',
    'https://www.wikipedia.org/',
    'https://www.reddit.com/',
    'https://www.yahoo.com/',
    'https://www.twitter.com/',
    'https://www.instagram.com/',
    'https://www.linkedin.com/',
    'https://www.netflix.com/',
    'https://www.whatsapp.com/',
    'https://www.twitch.tv/',
    'https://www.microsoft.com/',
    'https://www.apple.com/',
    'https://www.adobe.com/',
    'https://www.tumblr.com/',
    'https://www.imgur.com/',
    'https://www.spotify.com/'
]

# Insert safe URLs into the whitelist table
for url in safe_urls:
    try:
        c.execute('INSERT INTO whitelist (url) VALUES (?)', (url,))
    except sqlite3.IntegrityError:
        print(f"URL already exists: {url}")

# Commit the changes and close the connection
conn.commit()
conn.close()

print("Whitelist database has been created and populated successfully.")
