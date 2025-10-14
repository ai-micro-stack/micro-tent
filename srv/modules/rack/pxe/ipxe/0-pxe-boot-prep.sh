#!/bin/bash

sudo update -y
sudo upgrade -y




# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 22

# Verify the Node.js version:
node -v # Should print "v22.14.0".
nvm current # Should print "v22.14.0".

# Download and install Yarn:
corepack enable yarn

# Verify Yarn version:
yarn -v



yarn global add pm2


















su # switch to root user
apt install npm
npm install pm2 -g
exit # switch back from root user


sudo mkdir /micro-rack
sudo chmod 777 -R /micro-rack
cd /micro-rack

# (deploy the installer code & change the hash script permissions as executable)

node server.js

# (http://<server-ip>:3002)














