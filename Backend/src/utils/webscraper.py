import os
import json
import requests
from bs4 import BeautifulSoup

def scrape_ollama_search(url):
    file_path = 'ollama_models_list.json'
    
    # If the file already exists, load from file
    if os.path.exists(file_path):
        print("Loading models from local file (offline)...")
        with open(file_path, 'r') as f:
            data = json.load(f)
        return data

    # Else, scrape online
    data = {}
    response = requests.get(url)
    if response.status_code == 200:
        print("Successfully retrieved data from Ollama search page (online scrape)")
        soup = BeautifulSoup(response.text, 'html.parser')
        
        for li in soup.find_all('li', class_="flex items-baseline border-b border-neutral-200 py-6"):
            model_name = li.find('h2', class_="truncate text-xl font-medium underline-offset-2 group-hover:underline md:text-2xl").find('span').text.strip()
            model_link = li.find('a', class_="group w-full")['href']
            model_description = li.find('p', class_="max-w-lg break-words text-neutral-800 text-md")
            model_capability = [mod_cap.text.strip() for mod_cap in li.find_all('span', attrs={"x-test-capability": True})]
            model_sizes = [mod_size.text.strip() for mod_size in li.find_all('span', attrs={"x-test-size": True})]
            model_pulls = li.find('p', class_="my-1 flex space-x-5 text-[13px] font-medium text-neutral-500").find('span', attrs={"x-test-pull-count": True}).text.strip()
            model_tags = li.find('p', class_="my-1 flex space-x-5 text-[13px] font-medium text-neutral-500").find('span', attrs={"x-test-tag-count": True}).text.strip()
            model_last_updated = li.find('p', class_="my-1 flex space-x-5 text-[13px] font-medium text-neutral-500").find('span', attrs={"x-test-updated": True}).text.strip()

            data[model_name] = {
                "model_name": model_name,
                "link": model_link,
                "description": model_description.text.strip() if model_description else "",
                "capability": model_capability,
                "sizes": model_sizes,
                "pulls": model_pulls,
                "tags": model_tags,
                "last_updated": model_last_updated
            }

        # Save to local file
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=4)
                
        return data

    else:
        return {
            "error": "Failed to retrieve data from Ollama search page",
            "status_code": response.status_code
        }
