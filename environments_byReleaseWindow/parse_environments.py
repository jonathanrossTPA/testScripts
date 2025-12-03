import json

def create_tables(json_file):
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
            # Add release window count
            row['Release Windows Count'] = len(env.get('releaseWindows', []))
            with_release_windows.append(row)
        else:
            without_release_windows.append(row)
    
    # Print table with release windows
    print('=' * 150)
    print(f'ENVIRONMENTS WITH RELEASE WINDOWS (Total: {len(with_release_windows)})')
    print('=' * 150)
    
    if with_release_windows:
        # Print header
        headers = ['Name', 'Alias', 'Env Type', 'Cloud Platform', 'Account Type', 'Region', 'Display Name', 'RW Count']
        print(f"{headers[0]:<35} {headers[1]:<20} {headers[2]:<12} {headers[3]:<15} {headers[4]:<20} {headers[5]:<20} {headers[6]:<35} {headers[7]:<10}")
        print('-' * 150)
        
        # Print rows
        for row in with_release_windows:
            print(f"{row['Name']:<35} {row['Alias']:<20} {row['Env Type']:<12} {row['Cloud Platform']:<15} {row['Account Type']:<20} {row['Region']:<20} {row['Display Name']:<35} {row['Release Windows Count']:<10}")
    else:
        print('No environments with release windows found.')
    
    print('\n\n')
    
    # Print table without release windows
    print('=' * 150)
    print(f'ENVIRONMENTS WITHOUT RELEASE WINDOWS - NULL (Total: {len(without_release_windows)})')
    print('=' * 150)
    
    if without_release_windows:
        # Print header
        headers = ['Name', 'Alias', 'Env Type', 'Cloud Platform', 'Account Type', 'Region', 'Display Name']
        print(f"{headers[0]:<35} {headers[1]:<20} {headers[2]:<12} {headers[3]:<15} {headers[4]:<20} {headers[5]:<20} {headers[6]:<35}")
        print('-' * 150)
        
        # Print rows
        for row in without_release_windows:
            print(f"{row['Name']:<35} {row['Alias']:<20} {row['Env Type']:<12} {row['Cloud Platform']:<15} {row['Account Type']:<20} {row['Region']:<20} {row['Display Name']:<35}")
    else:
        print('No environments without release windows found.')
    
    # Print summary
    print('\n')
    print('=' * 150)
    print('SUMMARY')
    print('=' * 150)
    print(f"Total environments: {len(data)}")
    print(f"With release windows: {len(with_release_windows)}")
    print(f"Without release windows (null): {len(without_release_windows)}")

if __name__ == '__main__':
    create_tables('environments.json')
