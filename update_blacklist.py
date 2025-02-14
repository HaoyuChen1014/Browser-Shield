# Important Note: You need to download the csv file manullly every 3 days.
# The download link is: http://data.phishtank.com/data/online-valid.csv

import pandas as pd
import sqlite3
import os
from datetime import datetime

def load_urls_to_database(csv_path, db_path):
    # 连接到 SQLite 数据库
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 创建一个新表用于存储 URLs，如果表已经存在，则忽略此命令
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS blacklist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT UNIQUE
        );
    ''')
    conn.commit()

    # 读取 CSV 文件，假设 URL 位于第二列
    df = pd.read_csv(csv_path, usecols=[1])
    
    # 遍历所有的 URL 并插入到数据库中
    for url in df.iloc[:, 0].unique():  # 使用 unique() 确保 URL 唯一
        try:
            cursor.execute('INSERT INTO blacklist (url) VALUES (?);', (url,))
            conn.commit()
        except sqlite3.IntegrityError:
            print(f"URL {url} is already in the database")

    print("All URLs have been inserted into the database.")
    conn.close()

# 使用示例
if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_file_path = os.path.join(script_dir, 'verified_online.csv')  # CSV 文件位置
    db_file_path = os.path.join(script_dir, 'blacklist.db')  # 数据库文件位置
    load_urls_to_database(csv_file_path, db_file_path)

# every time update the blacklist just save the log to submission_log.txt
with open('submission_log.txt', 'a') as f:
    f.write(f"Blacklist updated on {datetime.now()}\n")