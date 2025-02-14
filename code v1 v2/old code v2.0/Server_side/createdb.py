import sqlite3

# Function to create the database, insert URLs, and set up a whitelist table
def create_database_and_insert_urls_with_whitelist(db_file, phishing_txt_file, whitelist_txt_file):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Create the phishing_sites table if it doesn't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS phishing_sites (
            id INTEGER PRIMARY KEY,
            url TEXT UNIQUE
        )
    ''')

    # Create the whitelist table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS whitelist (
            id INTEGER PRIMARY KEY,
            url TEXT UNIQUE
        )
    ''')

    # Insert phishing URLs
    with open(phishing_txt_file, 'r') as file:
        phishing_urls = file.read().splitlines()
        for url in phishing_urls:
            cursor.execute('INSERT OR IGNORE INTO phishing_sites (url) VALUES (?)', (url,))

    # Insert whitelist URLs
    with open(whitelist_txt_file, 'r') as file:
        whitelist_urls = file.read().splitlines()
        for url in whitelist_urls:
            cursor.execute('INSERT OR IGNORE INTO whitelist (url) VALUES (?)', (url,))

    # Commit the changes and close the connection
    conn.commit()
    conn.close()

    print("Data imported successfully into both phishing and whitelist tables.")

# Function to check if a URL is in the phishing database (bad website)
def is_url_bad(db_file, url):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Check if the URL exists in the phishing_sites table
    cursor.execute('SELECT COUNT(*) FROM phishing_sites WHERE url = ?', (url,))
    count = cursor.fetchone()[0]

    # Close the connection
    conn.close()

    return count > 0

# Function to check if a URL is in the whitelist
def is_url_whitelisted(db_file, url):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Check if the URL exists in the whitelist table
    cursor.execute('SELECT COUNT(*) FROM whitelist WHERE url = ?', (url,))
    count = cursor.fetchone()[0]

    # Close the connection
    conn.close()

    return count > 0

# Main execution block
if __name__ == "__main__":
    db_file = 'phishing_sites.db'
    phishing_txt_file = 'openphish.com_feed.txt'
    whitelist_txt_file = 'whitelist.txt'

    # Create the database and insert URLs for both phishing and whitelist
    create_database_and_insert_urls_with_whitelist(db_file, phishing_txt_file, whitelist_txt_file)

    # Test if a URL is in the whitelist
    test_url = 'https://example.com/'
    if is_url_whitelisted(db_file, test_url):
        print(f"{test_url} is a whitelisted website.")
    else:
        print(f"{test_url} is not in the whitelist.")

    # Test if a URL is in the phishing database
    test_phishing_url = 'http://robbinhodlogii.mystrikingly.com/'
    if is_url_bad(db_file, test_phishing_url):
        print(f"{test_phishing_url} is a bad website.")
    else:
        print(f"{test_phishing_url} is not in the database.")
