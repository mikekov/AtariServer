# update package info so installation later on doesn't fail
echo Updating system
sudo apt-get update
sudo apt-get -y dist-upgrade

# build AtariServer components

# to build atariserver executable, install required dependencies:
sudo apt-get -y install build-essential libncurses5-dev zlib1g-dev

# install Atari assembler
echo Atari ASM
wget https://github.com/linuxha/atasm/archive/master.zip
unzip master.zip
rm master.zip
cd atasm-master/src
make
# one step in installation fails to copy missing documentation file; ignore it
sudo make install || true
cd ../..

# build atariserver executable; it's a floppy server and http server all in one
echo AtariServer
cd AtariServer-master/atarisio
make tools DEFAULT_DEVICE=/dev/ttyAMA0
sudo make tools-install
# install AtariSIO tools and RPi device tree overlays
sudo make rpi-install
cd ..

echo Config Pi overlays
# configure RPi, add overlays in boot/config.txt:
# enable_uart=1 -> TODO verify if needed
grep -qxF 'dtoverlay=pi3-disable-bt' /boot/config.txt || sudo sh -c "echo 'dtoverlay=pi3-disable-bt' >> /boot/config.txt"
# add overlay that atarisio/atariserver just built to enabled CTS
grep -qxF 'dtoverlay=uart-ctsrts' /boot/config.txt || sudo sh -c "echo 'dtoverlay=uart-ctsrts' >> /boot/config.txt"

echo Share folder
# mount Atari files (floppy images, Atari xex)
sudo mkdir -p /mnt/atari
# mount your NAS drive
# sudo mount 10.0.0.8:volume1/Open/Atari/ATRs /mnt/atari/
# make it permanent, add it to /etc/fstab:
# 10.0.0.8:/volume1/Open/Atari/ATRs /mnt/atari/ nfs auto,nofail,noatime,nolock,intr,tcp,actimeo=1800 0 0
# test it with: sudo mount -a

# or copy them to SD card
# note: if there are files in mounted location, then ~/files are not used
mkdir -p ~/files
# copy some example file(s)
cp ./atr/* ~/files/

echo Auto-start
# to start atari web server on start-up add it to /etc/rc.local
# local files:
grep -qxF 'atariserver -w /home/pi/AtariServer-master/web-root -b /home/pi/AtariServer-master/atr/hisioboot-atarisio.atr -d /home/pi/files -C &' /etc/rc.local || sudo sed -i -e '$i atariserver -w /home/pi/AtariServer-master/web-root -b /home/pi/AtariServer-master/atr/hisioboot-atarisio.atr -d /home/pi/files -C &\n' /etc/rc.local
# or NAS files:
# grep -qxF 'atariserver -w /home/pi/AtariServer-master/web-root -b /home/pi/AtariServer-master/atr/hisioboot-atarisio.atr -d /mnt/atari -C &' /etc/rc.local || sudo sed -i -e '$i atariserver -w /home/pi/AtariServer-master/web-root -b /home/pi/AtariServer-master/atr/hisioboot-atarisio.atr -d /mnt/atari -C &\n' /etc/rc.local
