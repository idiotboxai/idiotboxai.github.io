
import sqlite3
import requests
from bs4 import BeautifulSoup
import argparse
import sys

def init_db():
    conn = sqlite3.connect('bug_bounty.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS domain_info
                 (domain TEXT, section TEXT, content TEXT,
                  PRIMARY KEY (domain, section, content))''')
    conn.commit()
    return conn

def get_site_tech_info(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    tech_sections = soup.find_all('div', class_='si_tech')
    tech_info = {}
    for section in tech_sections:
        section_title = section.find_previous('div', class_='si_h')
        if section_title:
            section_title_text = section_title.text.strip()
        else:
            section_title_text = "All information about " + url.split('/')[-1]
        if section_title_text not in tech_info:
            tech_info[section_title_text] = []
        section_content = section.text.strip()
        tech_info[section_title_text].append(section_content)
    return tech_info

def process_domain(domain, conn):
    url = f"https://w3techs.com/sites/info/{domain}"
    site_tech_info = get_site_tech_info(url)

    c = conn.cursor()
    for section, content in site_tech_info.items():
        for item in content:
            c.execute('''INSERT OR REPLACE INTO domain_info (domain, section, content)
                         VALUES (?, ?, ?)''', (domain, section, item))
    conn.commit()

def main():
    parser = argparse.ArgumentParser(description="Fetch technology information for domains")
    parser.add_argument("-u", "--url", help="Single domain to process")
    args = parser.parse_args()

    conn = init_db()

    if args.url:
        process_domain(args.url, conn)
    else:
        for line in sys.stdin:
            domain = line.strip()
            if domain:
                process_domain(domain, conn)

    conn.close()

if __name__ == "__main__":
    main()
