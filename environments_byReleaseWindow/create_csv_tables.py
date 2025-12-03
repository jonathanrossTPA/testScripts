import json
import csv

def create_csv_tables(json_file):
    # Read the JSON file
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Separate environments based on releaseWindows
    with_release_windows = []
    without_release_windows = []
    
    for env in data:
        row = {
            'Name': env.get('name', '') or 'N/A',
            'Alias': env.get('alias', '') or 'N/A',
            'Env Type': env.get('envType', '') or 'N/A',
            'Cloud Platform': env.get('cloudPlatform', '') or 'N/A',
            'Account Type': env.get('accountType', '') or 'N/A',
            'Region': env.get('region', '') or 'N/A',
            'Display Name': env.get('displayName', '') or 'N/A'
        }
        
        if env.get('releaseWindows') is not None:
            row['Release Windows Count'] = len(env.get('releaseWindows', []))
            with_release_windows.append(row)
        else:
            without_release_windows.append(row)
    
    # Write environments WITH release windows to CSV
    with open('environments_with_release_windows.csv', 'w', newline='', encoding='utf-8') as f:
        if with_release_windows:
            fieldnames = ['Name', 'Alias', 'Env Type', 'Cloud Platform', 'Account Type', 'Region', 'Display Name', 'Release Windows Count']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(with_release_windows)
    
    # Write environments WITHOUT release windows to CSV
    with open('environments_without_release_windows.csv', 'w', newline='', encoding='utf-8') as f:
        if without_release_windows:
            fieldnames = ['Name', 'Alias', 'Env Type', 'Cloud Platform', 'Account Type', 'Region', 'Display Name']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(without_release_windows)
    
    # Print summary
    print(f"\n✓ Created 'environments_with_release_windows.csv' with {len(with_release_windows)} entries")
    print(f"✓ Created 'environments_without_release_windows.csv' with {len(without_release_windows)} entries")
    print(f"\nTotal environments: {len(data)}")
    print(f"  - With release windows: {len(with_release_windows)}")
    print(f"  - Without release windows (null): {len(without_release_windows)}")

if __name__ == '__main__':
    create_csv_tables('environments.json')
