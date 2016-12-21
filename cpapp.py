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

GRABS_PATH = "/usbdrive/Grabs/"
MODES_PATH = "/usbdrive/Modes/"

print "UDP target IP:", UDP_IP
print "UDP target port:", UDP_PORT

sock = socket.socket(socket.AF_INET, # Internet
                     socket.SOCK_DGRAM) # UDP

def get_immediate_subdirectories(dir) :
    return [name for name in os.listdir(dir)
            if os.path.isdir(os.path.join(dir, name))]

class Root():

    # /mode/mode-name  loads mode
    def get_mode(self, p):
        mode_path = MODES_PATH+p+'/main.py'
        mode = open(mode_path, 'r').read()
        self.send_command("setmode," + p + "\n")
        return mode
    get_mode.exposed = True

    def send_command(self, data):
        global sock
        sock.sendto(data, (UDP_IP, UDP_PORT))
    send_command.exposed = True

    # save a new mode TODO:  check if it already exists (don't overite existing)
    # TODO:  what to do about bad names
    def save_new(self, name, contents):
        p = name
        mode_dir = MODES_PATH+p
        mode_path = MODES_PATH+p+'/main.py'
        if not os.path.exists(mode_dir): os.makedirs(mode_dir)
        with open(mode_path, "w") as text_file:
            text_file.write(contents)
        #then send reload command
        #TODO: need to work all this out (how modees are stored / loaded in mother program)
        self.send_command("setmode," + p + "\n")
        self.send_command("rlp\n")
        return "SAVED " + name
    save_new.exposed = True

    def save(self, name, contents):
        #save the mode
        p = name
        mode_path = MODES_PATH+p+'/main.py'
        with open(mode_path, "w") as text_file:
            text_file.write(contents)
        #then send reload command
        self.send_command("rlp\n")
        return "SAVED " + name
    save.exposed = True
   
    def get_grabs(self):
        
        images = []
        for filepath in sorted(glob.glob(GRABS_PATH+'*.jpg')):
            filename = os.path.basename(filepath)
            images.append(filename)
        return json.dumps(images)
    get_grabs.exposed = True

    def get_grab(self, name):
        grab_path = GRABS_PATH+name
        grab = open(grab_path, 'r').read()
        cherrypy.response.headers['Content-Type'] = "image/jpg"
        return grab
    get_grab.exposed = True


    # returns list of all the modees
    def index(self):
        
        print "loading modees..."
        modees = []
        mode_folders = get_immediate_subdirectories(MODES_PATH)

        for mode_folder in mode_folders :
            mode_name = str(mode_folder)
            mode_path = MODES_PATH+mode_name+'/main.py'
            #modees.append(urllib.quote(mode_name))
            modees.append(mode_name)

        return json.dumps(modees)

    index.exposed = True


