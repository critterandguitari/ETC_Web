import os.path
current_dir = os.path.dirname(os.path.abspath(__file__))
import time
import glob
import json
import cherrypy
import urllib

# setup UDP socket for sending data to mvp program
import time
import socket

UDP_IP = "127.0.0.1"
UDP_PORT = 5005

GRABS_PATH = "/usbdrive/"
MODES_PATH = "/usbdrive/Patches/"

print "UDP target IP:", UDP_IP
print "UDP target port:", UDP_PORT

sock = socket.socket(socket.AF_INET, # Internet
                     socket.SOCK_DGRAM) # UDP

def get_immediate_subdirectories(dir) :
    return [name for name in os.listdir(dir)
            if os.path.isdir(os.path.join(dir, name))]

class Root():

    # /patch/patch-name  loads patch
    def get_patch(self, p):
        patch_path = MODES_PATH+p+'/main.py'
        patch = open(patch_path, 'r').read()
        self.send_command("setpatch," + p + "\n")
        return patch
    get_patch.exposed = True

    def send_command(self, data):
        global sock
        sock.sendto(data, (UDP_IP, UDP_PORT))
    send_command.exposed = True

    # save a new patch TODO:  check if it already exists (don't overite existing)
    # TODO:  what to do about bad names
    def save_new(self, name, contents):
        p = name
        patch_dir = MODES_PATH+p
        patch_path = MODES_PATH+p+'/main.py'
        if not os.path.exists(patch_dir): os.makedirs(patch_dir)
        with open(patch_path, "w") as text_file:
            text_file.write(contents)
        #then send reload command
        #TODO: need to work all this out (how patches are stored / loaded in mother program)
        self.send_command("setpatch," + p + "\n")
        self.send_command("rlp\n")
        return "SAVED " + name
    save_new.exposed = True

    def save(self, name, contents):
        #save the patch
        p = name
        patch_path = MODES_PATH+p+'/main.py'
        with open(patch_path, "w") as text_file:
            text_file.write(contents)
        #then send reload command
        self.send_command("rlp\n")
        return "SAVED " + name
    save.exposed = True
   
    def get_grabs(self):
        
        images = []
        for filepath in sorted(glob.glob(GRABS_PATH+'*.png')):
            filename = os.path.basename(filepath)
            images.append(filename)
        return json.dumps(images)
    get_grabs.exposed = True

    def get_grab(self, name):
        grab_path = GRABS_PATH+name
        grab = open(grab_path, 'r').read()
        cherrypy.response.headers['Content-Type'] = "image/png"
        return grab
    get_grab.exposed = True


    # returns list of all the patches
    def index(self):
        
        print "loading patches..."
        patches = []
        patch_folders = get_immediate_subdirectories(MODES_PATH)

        for patch_folder in patch_folders :
            patch_name = str(patch_folder)
            patch_path = MODES_PATH+patch_name+'/main.py'
            patches.append(urllib.quote(patch_name))

        return json.dumps(patches)

    index.exposed = True


