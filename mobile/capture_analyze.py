import subprocess
import sys

def run_analyze():
    try:
        result = subprocess.run(['flutter', 'analyze'], capture_output=True, text=True, cwd='c:/coding/project/FLux Hackathon/mobile')
        with open('analyze_log.txt', 'w', encoding='utf-8') as f:
            f.write(result.stdout)
            f.write(result.stderr)
        print("Done. saved to analyze_log.txt")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_analyze()
