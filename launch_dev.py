import subprocess, os

# 让子进程脱离当前作业（Job），会话/Shell 结束时不会被一起杀掉
CREATE_BREAKAWAY_FROM_JOB = 0x01000000
CREATE_NEW_PROCESS_GROUP = 0x00000200

PROJ = r"D:\workbuddy存储\nuonuo"
NODE = r"C:\Users\张家欣\.workbuddy\binaries\node\versions\22.22.2\node.exe"
NEXT = os.path.join(PROJ, "node_modules", "next", "dist", "bin", "next")

env = dict(os.environ)
env["NODE_OPTIONS"] = ""  # 清掉本机 safe-delete shim，否则会拦截 .next 操作

log_path = os.path.join(PROJ, "dev.log")
with open(log_path, "ab") as log:
    p = subprocess.Popen(
        [NODE, NEXT, "dev", "-p", "3000"],
        cwd=PROJ,
        env=env,
        creationflags=CREATE_BREAKAWAY_FROM_JOB | CREATE_NEW_PROCESS_GROUP,
        stdout=log,
        stderr=subprocess.STDOUT,
        close_fds=True,
    )
    print("launched dev server pid=%d" % p.pid)
