import os
import json

def generate_file_list(root_dir):
    """
    Generates a list of all files to be cached.
    """
    file_list = [
        '/',
        '/index.html',
        '/cache-status.html',
        '/toplayer.css',
        '/manifest.json',
        '/favicon.ico'
    ]
    # Exclude .git directory and other dotfiles
    exclude_dirs = ['.git']
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            # Exclude dotfiles
            if file.startswith('.'):
                continue
            full_path = os.path.join(root, file)
            relative_path = '/' + os.path.relpath(full_path, root_dir)
            file_list.append(relative_path)
    return sorted(list(set(file_list)))

if __name__ == '__main__':
    # We assume the script is run from the root of the project
    project_root = '.'
    files_to_cache = generate_file_list(project_root)
    
    with open('file-list.json', 'w') as f:
        json.dump(files_to_cache, f, indent=2)
        
    print(f"Generated file-list.json with {len(files_to_cache)} files.")
