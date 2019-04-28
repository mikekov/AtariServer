import subprocess, sys, shlex, os
from flask import Flask, request, send_from_directory, jsonify
app = Flask(__name__, static_url_path='', static_folder='web')

atari = None
server = 'atariserver'
sharedDir = '/mnt/atari'
pokeyDivisor = 40   # default transmission speed of 19200 baud
turboOn = 0
lastFile = ''
fileList = []

# traverse directory recursively, collect all Atari files
def scanFolder(path):
    fileList = []
    for root, dirNames, fileNames in os.walk(path):
        for f in fileNames:
            if f.lower().endswith(('.atr', '.xex')):
                fileList.append(os.path.join(root, f))

    fileList.sort()
    return fileList

# stop atariserver
def stopServer():
    global atari
    if atari:
        atari.kill()
        atari.wait()
        atari = None

# start atariserver to serve files over SIO
def startServer(filePath, readOnly, divisor, turbo):
    stopServer()

    ro = '-p' if readOnly else ''
    arg = '{server} -f /dev/ttyAMA0 -C -S {divisor} -s {turbo} '.format(server=server, divisor=divisor, turbo=turbo)
    # for turbo modes load HISIO driver into first drive
    if turbo:
        arg = arg + "-p -1 hisioboot-atarisio.atr {ro} -2 {filePath}".format(ro=ro, filePath=filePath)
    else:
        arg = arg + "{ro} -1 {filePath}".format(ro=ro, filePath=filePath)

    args = shlex.split(arg)
    global atari
    print('Start ', arg)
    atari = subprocess.Popen(args, shell = False)

# get file path from the list
def getFile(fileId):
    index = +fileId - 1
    if index >= 0 and index < len(fileList):
        return shlex.quote(fileList[index])
    else:
        return None


# load requested "floppy" into a drive
@app.route('/insert/<int:fileId>', methods = ['PUT'])
def insert(fileId):
    # insert floppy
    global lastFile
    readOnly = False
    filePath = getFile(fileId)
    if filePath:
        startServer(filePath, readOnly, pokeyDivisor, turboOn)
    else:
        stopServer()

    lastFile = filePath
    global atari
    return 'ok' if atari else 'error'

# modify transmission speed; if turbo is off HISIO driver will not be used/served
@app.route('/turbo', methods = ['PUT'])
def setTurbo():
    div = '0'
    if 'divider' in request.args:
        div = request.args['divider']
    enable = '1'
    if 'turbo' in request.args:
        enable = request.args['turbo']
    # set turbo speed
    global pokeyDivisor
    global turboOn
    pokeyDivisor = div
    turboOn = enable
    startServer(lastFile, False, div, enable)
    global atari
    return 'ok' if atari else 'error'

# serve list of Atari files
@app.route('/files')
def getAtariFiles():
    files = [{'id': i + 1, 'name': f.rsplit('/', 1)[1]} for i, f in enumerate(fileList)]
    return jsonify(files) 

# serving client static files (web page & JS)
@app.route('/<path:path>')
def send_main(path):
    return send_from_directory(path)

@app.route('/')
def root():
    return app.send_static_file('index.html')


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else None
    # try mounted shared location first
    if (len(fileList) == 0):
        print('Scaning mounted dir ', sharedDir)
        fileList = scanFolder(sharedDir)
        print(len(fileList), " files found")

    # try provided folder path if no files found
    if path and len(fileList) == 0:
        print('Scaning dir ', path)
        fileList = scanFolder(path)
        print(len(fileList), " files found")

    app.run(host='0.0.0.0', port=80, debug=True)
