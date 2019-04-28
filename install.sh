# update package info so installation later on doesn't fail
sudo apt-get update
sudo apt-get -y dist-upgrade

# build AtariServer components

# to build atariserver executable, install required dependencies:
sudo apt-get -y install build-essential libncurses5-dev zlib1g-dev

# install Atari assembler
wget https://github.com/linuxha/atasm/archive/master.zip
unzip master.zip
rm master.zip
cd atasm-master/src
make
# one step in installation fails to copy missing documentation file; ignore it
sudo make install || true
cd ../..

# build atariserver executable
cd AtariServer-master/atarisio
make tools DEFAULT_DEVICE=/dev/ttyAMA0
#sudo make tools-install
# install AtariSIO tools and RPi device tree overlays
sudo make rpi-install
cd ..

# configure RPi, add overlays in boot/config.txt:
# enable_uart=1 -> TODO verify if needed
grep -qxF 'dtoverlay=pi3-disable-bt' /boot/config.txt || sudo sh -c "echo 'dtoverlay=pi3-disable-bt' >> /boot/config.txt"
# add overlay that atarisio/atariserver just built to enabled CTS
grep -qxF 'dtoverlay=uart-ctsrts' /boot/config.txt || sudo sh -c "echo 'dtoverlay=uart-ctsrts' >> /boot/config.txt"

# to run flask web server:
sudo apt-get -y install python3-pip
sudo pip3 install flask

# mount Atari files (floppy images, Atari xex)
sudo mkdir -p /mnt/atari
# mount your NAS drive
# sudo mount 10.0.0.8:volume1/Archive/AtariGames/\!ATRs /mnt/atari/

# or copy them to SD card
# note: if there are files in mounted location, then ~/files are not used
mkdir -p ~/files

# to start flask server on start-up add it to /etc/rc.local
grep -qxF 'python3 /home/pi/AtariServer-master/flask/atari-web-server.py /home/pi/files &' /etc/rc.local || sudo sed -i -e '$i python3 /home/pi/AtariServer-master/flask/atari-web-server.py /home/pi/files &\n' /etc/rc.local
