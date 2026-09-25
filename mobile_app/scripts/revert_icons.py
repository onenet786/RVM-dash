import os
import shutil

RES_DIR = r"d:\GIT-HUB\RVM-dash\mobile_app\android\app\src\main\res"
BACKUP_DIR = r"d:\GIT-HUB\RVM-dash\mobile_app\android\app\src\main\res_icons_backup_original"

def main():
    if not os.path.exists(BACKUP_DIR):
        print(f"Error: Backup directory not found at {BACKUP_DIR}")
        return

    print("Restoring original icons from backup...")
    for item in os.listdir(BACKUP_DIR):
        src_item = os.path.join(BACKUP_DIR, item)
        dest_item = os.path.join(RES_DIR, item)
        if os.path.isdir(src_item) and item.startswith("mipmap"):
            for file in os.listdir(src_item):
                s_file = os.path.join(src_item, file)
                d_file = os.path.join(dest_item, file)
                shutil.copy2(s_file, d_file)
                print(f"Restored: {item}/{file}")

    print("\nOriginal icons successfully restored! Run gradlew assembleRelease to rebuild with old icons.")

if __name__ == "__main__":
    main()
