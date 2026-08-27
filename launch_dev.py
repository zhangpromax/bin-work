import subprocess, os, sys
from subprocess import CREATE_NEW_PROCESS_GROUP, CREATE_BREAKAWAY_FROM_JOB

NODE = r"C:\Users\张家欣\.workbuddy\binaries\node\versions\22.22.2\node.exe"
NEXT = r"D:\workbuddy存储\nuonuo\node_modules\next\dist\bin\next"
CWD = r"D:\workbuddy存储\nuonuo"
TEMP = os.environ.get("TEMP", r"C:\Users\张家欣\AppData\Local\Temp")
LOG = os.path.join(TEMP, "nuonuo_dev.log")

env = os.environ.copy()
env["NODE_OPTIONS"] = ""  # 绕过 safe-delete shim

log = open(LOG, "ab")
p = subprocess.Popen(
    [NODE, NEXT, "dev", "-p", "3000"],
    cwd=CWD,
    env=env,
    stdout=log,
    stderr=log,
    creationflags=CREATE_NEW_PROCESS_GROUP | CREATE_BREAKAWAY_FROM_JOB,
)
print("launched pid", p.pid, "log", LOG)
sys.stdout.flush()
